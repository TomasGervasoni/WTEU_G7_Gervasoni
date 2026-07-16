'use strict';

// =============================================================================
// Cancelacion/CancelacionServices/CancelacionServices.js
// Lógica de negocio del módulo Cancelación (CU-017, CU-018, CU-019).
// No conoce Express ni req/res. Accede a PostgreSQL vía pool.
// =============================================================================

const pool = require('../../config/db');

// cross-module: Cancelación reutiliza la misma función de transición de estados
// que usa CU-016 (Pedidos), en lugar de duplicar el UPDATE. Esto garantiza que
// la validación del diagrama de estados (AGENTS.md §6, regla 8) se aplica igual.
const { actualizarEstadoPedido } = require('../../Pedidos/PedidosServices/PedidosServices');

// ─────────────────────────────────────────────────────────────────────────────
// CU-017 — Solicitar cancelación de un pedido
// Precondición: el pedido pertenece al cliente autenticado y NO está en estado
// final (entregado / cancelado).
// Postcondición éxito: se inserta una fila en cancelacion_solicitudes con
//   estado = 'solicitada'.
// Postcondición fracaso: si el pedido ya está en un estado final o no
//   pertenece al cliente, se lanza un error con status 422/403.
// ─────────────────────────────────────────────────────────────────────────────
async function solicitarCancelacion(pedidoId, usuarioId, motivo) {
  // 1. Verificar que el pedido existe, pertenece al usuario y no es un carrito
  const pedidoRes = await pool.query(
    `SELECT id, estado FROM pedidos WHERE id = $1 AND usuario_id = $2 AND estado != '__carrito__'`,
    [pedidoId, usuarioId]
  );
  if (pedidoRes.rows.length === 0) {
    const err = new Error('Pedido no encontrado o no pertenece a tu cuenta');
    err.status = 404;
    throw err;
  }

  const estadoActual = pedidoRes.rows[0].estado;
  const estadosFinales = ['entregado', 'cancelado'];
  if (estadosFinales.includes(estadoActual)) {
    const err = new Error(`No es posible solicitar cancelación de un pedido en estado "${estadoActual}"`);
    err.status = 422;
    throw err;
  }

  // 2. Verificar que no tenga ya una solicitud pendiente (aunque la tabla ya tiene UNIQUE en pedido_id)
  const solicitudPendiente = await pool.query(
    `SELECT id FROM solicitudes_cancelacion WHERE pedido_id = $1 AND estado = 'solicitada'`,
    [pedidoId]
  );
  if (solicitudPendiente.rows.length > 0) {
    const err = new Error('Ya existe una solicitud de cancelación pendiente para este pedido');
    err.status = 409;
    throw err;
  }

  // 3. Insertar la solicitud con estado transitorio "solicitada"
  const res = await pool.query(
    `INSERT INTO solicitudes_cancelacion (pedido_id, usuario_id, motivo, estado, creado_en)
     VALUES ($1, $2, $3, 'solicitada', NOW())
     RETURNING id, pedido_id, motivo, estado, creado_en`,
    [pedidoId, usuarioId, motivo || null]
  );

  return res.rows[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-018 — Aprobar solicitud de cancelación (admin)
// ─────────────────────────────────────────────────────────────────────────────
async function aprobarCancelacion(solicitudId, adminId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obtener y bloquear la solicitud
    const solRes = await client.query(
      `SELECT id, pedido_id, estado FROM solicitudes_cancelacion WHERE id = $1 FOR UPDATE`,
      [solicitudId]
    );
    if (solRes.rows.length === 0) {
      const err = new Error('Solicitud de cancelación no encontrada');
      err.status = 404;
      throw err;
    }

    const solicitud = solRes.rows[0];
    if (solicitud.estado !== 'solicitada') {
      const err = new Error(`La solicitud ya fue resuelta (estado actual: "${solicitud.estado}")`);
      err.status = 422;
      throw err;
    }

    // 2. Actualizar la solicitud a "aprobada"
    await client.query(
      `UPDATE solicitudes_cancelacion SET estado = 'aprobada', resuelto_en = NOW(), resuelto_por = $2 WHERE id = $1`,
      [solicitudId, adminId]
    );

    await client.query('COMMIT');

    // 3. Cambiar estado del pedido a "cancelado"
    const pedidoActualizado = await actualizarEstadoPedido(solicitud.pedido_id, 'cancelado');

    return {
      solicitud: { id: solicitudId, estado: 'aprobada' },
      pedido:    pedidoActualizado,
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-019 — Rechazar solicitud de cancelación (admin)
// ─────────────────────────────────────────────────────────────────────────────
async function rechazarCancelacion(solicitudId, adminId, motivoRechazo = null) {
  const res = await pool.query(
    `UPDATE solicitudes_cancelacion
     SET estado = 'rechazada', resuelto_en = NOW(), resuelto_por = $2, motivo_rechazo = $3
     WHERE id = $1 AND estado = 'solicitada'
     RETURNING id, pedido_id, estado, resuelto_en`,
    [solicitudId, adminId, motivoRechazo]
  );

  if (res.rows.length === 0) {
    // Verificar si no existe o ya estaba resuelta
    const existe = await pool.query(
      `SELECT estado FROM solicitudes_cancelacion WHERE id = $1`,
      [solicitudId]
    );
    if (existe.rows.length === 0) {
      const err = new Error('Solicitud de cancelación no encontrada');
      err.status = 404;
      throw err;
    }
    const err = new Error(`La solicitud ya fue resuelta (estado actual: "${existe.rows[0].estado}")`);
    err.status = 422;
    throw err;
  }

  return res.rows[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Listar todas las solicitudes (admin)
// ─────────────────────────────────────────────────────────────────────────────
async function listarSolicitudes(filtroEstado) {
  const params = [];
  let where = '';
  if (filtroEstado) {
    params.push(filtroEstado);
    where = `WHERE cs.estado = $1`;
  }

  const res = await pool.query(
    `SELECT cs.id,
            cs.pedido_id,
            cs.motivo,
            cs.estado,
            cs.creado_en,
            cs.resuelto_en,
            cs.motivo_rechazo,
            u.nombre   AS cliente_nombre,
            u.email    AS cliente_email,
            p.estado   AS pedido_estado,
            p.total    AS pedido_total,
            admin.nombre AS admin_nombre
     FROM   solicitudes_cancelacion cs
     JOIN   pedidos  p ON p.id   = cs.pedido_id
     JOIN   usuarios u ON u.id   = cs.usuario_id
     LEFT JOIN usuarios admin ON admin.id = cs.resuelto_por
     ${where}
     ORDER  BY cs.creado_en DESC`,
    params
  );
  return res.rows;
}

module.exports = {
  solicitarCancelacion,
  aprobarCancelacion,
  rechazarCancelacion,
  listarSolicitudes,
};
