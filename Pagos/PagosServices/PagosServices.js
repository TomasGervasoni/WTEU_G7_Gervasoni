'use strict';

// =============================================================================
// Pagos/PagosServices/PagosServices.js
// Lógica de negocio del módulo Pagos (CU-020, CU-021, CU-022, CU-023).
// No conoce Express ni req/res. Accede a PostgreSQL vía pool.
// =============================================================================

const pool  = require('../../config/db');

// cross-module: Pagos necesita confirmar el pedido al aprobarse un pago,
// reutilizando la misma función de transición de PedidosServices (CU-016).
const { actualizarEstadoPedido } = require('../../Pedidos/PedidosServices/PedidosServices');

// ─────────────────────────────────────────────────────────────────────────────
// CU-020 — Registrar pago manual (admin)
// Un administrador registra un pago recibido fuera de MercadoPago
// (transferencia, efectivo, otro). El pedido pasa a "confirmado".
// ─────────────────────────────────────────────────────────────────────────────
async function registrarPagoManual({ pedidoId, metodo, monto, notas, comprobanteUrl, adminId }) {
  // Validar que el metodo sea uno de los permitidos para pago manual
  const metodosPermitidos = ['transferencia', 'efectivo', 'otro'];
  if (!metodosPermitidos.includes(metodo)) {
    const err = new Error(`Método de pago inválido para registro manual. Opciones: ${metodosPermitidos.join(', ')}`);
    err.status = 400;
    throw err;
  }

  // Verificar que el pedido exista y no sea un carrito
  const pedidoRes = await pool.query(
    `SELECT id, estado, total FROM pedidos WHERE id = $1 AND estado != '__carrito__'`,
    [pedidoId]
  );
  if (pedidoRes.rows.length === 0) {
    const err = new Error('Pedido no encontrado');
    err.status = 404;
    throw err;
  }

  const pedido = pedidoRes.rows[0];
  const estadosFinales = ['entregado', 'cancelado'];
  if (estadosFinales.includes(pedido.estado)) {
    const err = new Error(`No se puede registrar un pago para un pedido en estado "${pedido.estado}"`);
    err.status = 422;
    throw err;
  }

  const montoFinal = monto != null ? Number(monto) : Number(pedido.total);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insertar pago aprobado
    const pagoRes = await client.query(
      `INSERT INTO pagos (pedido_id, metodo, estado, monto, comprobante_url, notas, creado_en, actualizado_en)
       VALUES ($1, $2, 'aprobado', $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [pedidoId, metodo, montoFinal, comprobanteUrl || null, notas || null]
    );
    const pago = pagoRes.rows[0];

    // cross-module: transicionar el pedido a "confirmado" via PedidosServices
    // Solo si el pedido está en "pendiente" (evitar doble-confirmación)
    if (pedido.estado === 'pendiente') {
      await actualizarEstadoPedido(pedidoId, 'confirmado', adminId);
    }

    await client.query('COMMIT');
    return pago;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-021 — Crear preferencia de MercadoPago
// Crea una preferencia en la API de MP y devuelve init_point para redirigir al cliente.
// ─────────────────────────────────────────────────────────────────────────────
async function crearPreferenciaMercadoPago(pedidoId, usuarioId) {
  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_ACCESS_TOKEN) {
    const err = new Error('Las credenciales de MercadoPago no están configuradas en el servidor');
    err.status = 503;
    throw err;
  }

  // Verificar que el pedido pertenece al usuario y está en estado adecuado
  const pedidoRes = await pool.query(
    `SELECT p.id, p.total, p.estado, p.nombre_cliente, p.email,
            json_agg(
              json_build_object(
                'nombre_producto', i.nombre_producto,
                'precio_unitario', i.precio_unitario,
                'cantidad',        i.cantidad
              )
            ) AS items
     FROM pedidos p
     JOIN pedido_items i ON i.pedido_id = p.id
     WHERE p.id = $1 AND p.usuario_id = $2 AND p.estado != '__carrito__'
     GROUP BY p.id`,
    [pedidoId, usuarioId]
  );

  if (pedidoRes.rows.length === 0) {
    const err = new Error('Pedido no encontrado o no pertenece a tu cuenta');
    err.status = 404;
    throw err;
  }

  const pedido = pedidoRes.rows[0];
  if (!['pendiente'].includes(pedido.estado)) {
    const err = new Error(`Solo se puede iniciar el pago de un pedido en estado "pendiente". Estado actual: "${pedido.estado}"`);
    err.status = 422;
    throw err;
  }

  const BASE_URL = process.env.MP_BACK_URL_BASE || 'http://localhost:3000';

  // Construir items para MP a partir de los items del pedido
  const items = (pedido.items || []).map(i => ({
    title:       i.nombre_producto,
    quantity:    Number(i.cantidad),
    unit_price:  Number(i.precio_unitario),
    currency_id: 'ARS',
  }));

  // Llamada a la API de MercadoPago v1
  const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization':  `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type':   'application/json',
      'X-Idempotency-Key': `wteu-pedido-${pedidoId}-${Date.now()}`,
    },
    body: JSON.stringify({
      items,
      external_reference: String(pedidoId),
      payer: {
        name:  pedido.nombre_cliente,
        email: pedido.email || 'sin-email@wteu.com',
      },
      back_urls: {
        success: `${BASE_URL}/api/v1/pagos/mp/retorno?status=success&pedido_id=${pedidoId}`,
        failure: `${BASE_URL}/api/v1/pagos/mp/retorno?status=failure&pedido_id=${pedidoId}`,
        pending: `${BASE_URL}/api/v1/pagos/mp/retorno?status=pending&pedido_id=${pedidoId}`,
      },
      // NOTA: auto_return removido intencionalmente para evitar error conocido de MP sandbox
      notification_url: `${BASE_URL}/api/v1/pagos/mp/webhook`,
    }),
  });

  if (!mpRes.ok) {
    const errBody = await mpRes.json().catch(() => ({}));
    const err = new Error(`Error al crear preferencia en MercadoPago: ${errBody.message || mpRes.status}`);
    err.status = 502;
    throw err;
  }

  const preferencia = await mpRes.json();

  // Guardar el registro de pago en nuestra BD (estado pendiente, con preference_id)
  await pool.query(
    `INSERT INTO pagos (pedido_id, metodo, estado, monto, mp_preference_id, creado_en, actualizado_en)
     VALUES ($1, 'mercadopago', 'pendiente', $2, $3, NOW(), NOW())`,
    [pedidoId, pedido.total, preferencia.id]
  );

  const esProduccion = process.env.MP_ENV === 'production';

  return {
    preference_id: preferencia.id,
    checkout_url:  esProduccion ? preferencia.init_point : preferencia.sandbox_init_point,
    init_point:    preferencia.init_point,       // URL de pago (producción)
    sandbox_init_point: preferencia.sandbox_init_point, // URL de pago (sandbox test)
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-021 / CU-022 — Webhook de MercadoPago
// Recibe la notificación IPN/webhook de MP, consulta el estado real del pago
// via la API de MP y actualiza nuestra tabla `pagos`.
// Si el pago es aprobado → transiciona el pedido a "confirmado".
//
// TODO (pendiente conocido — AGENTS.md §8): la confirmación automática vía
// webhook requiere que el endpoint sea accesible desde internet (ngrok / Railway).
// En desarrollo local sin túnel, MP no puede enviar la notificación y este
// código nunca se ejecuta. El flujo de prueba local es: CU-022 (validar manual).
// ─────────────────────────────────────────────────────────────────────────────
async function procesarWebhookMP(body) {
  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

  // MP envía topic=payment y data.id con el payment_id real
  const { type, data } = body;

  if (type !== 'payment' || !data?.id) {
    // Tipo de notificación no relevante → ignorar silenciosamente
    return { procesado: false, motivo: 'tipo de notificación ignorado' };
  }

  const mpPaymentId = String(data.id);

  // Consultar el pago real en la API de MP para validar el estado
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
    headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
  });

  if (!mpRes.ok) {
    const err = new Error(`No se pudo consultar el pago ${mpPaymentId} en MP`);
    err.status = 502;
    throw err;
  }

  const mpPago = await mpRes.json();
  const { status, status_detail, external_reference } = mpPago;

  // external_reference es el pedido_id que enviamos al crear la preferencia
  const pedidoId = parseInt(external_reference, 10);
  if (isNaN(pedidoId)) {
    return { procesado: false, motivo: 'external_reference inválida' };
  }

  // Mapear estado de MP a estado interno
  const estadoInterno = status === 'approved' ? 'aprobado'
                      : status === 'rejected'  ? 'rechazado'
                      : 'en_proceso';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Actualizar o insertar el pago con los datos de MP
    await client.query(
      `INSERT INTO pagos (pedido_id, metodo, estado, monto, mp_payment_id, mp_status, mp_status_detail, creado_en, actualizado_en)
       VALUES ($1, 'mercadopago', $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (mp_payment_id) DO UPDATE
         SET estado = $2, mp_status = $5, mp_status_detail = $6, actualizado_en = NOW()`,
      [pedidoId, estadoInterno, mpPago.transaction_amount, mpPaymentId, status, status_detail]
    ).catch(async () => {
      // Si no hay UNIQUE en mp_payment_id, hacemos UPDATE
      await client.query(
        `UPDATE pagos SET estado = $1, mp_payment_id = $2, mp_status = $3, mp_status_detail = $4, actualizado_en = NOW()
         WHERE pedido_id = $5 AND metodo = 'mercadopago' AND estado = 'pendiente'`,
        [estadoInterno, mpPaymentId, status, status_detail, pedidoId]
      );
    });

    // Si aprobado → confirmar el pedido
    if (estadoInterno === 'aprobado') {
      const pedidoRes = await client.query(
        `SELECT estado FROM pedidos WHERE id = $1`, [pedidoId]
      );
      if (pedidoRes.rows[0]?.estado === 'pendiente') {
        // cross-module: usar actualizarEstadoPedido para respetar el diagrama de estados
        await actualizarEstadoPedido(pedidoId, 'confirmado', null);
      }
    }

    await client.query('COMMIT');
    return { procesado: true, pedidoId, estadoInterno };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-022 — Validar pago manualmente (admin)
// Permite al admin aprobar o rechazar un pago MP pendiente sin esperar el webhook.
// ─────────────────────────────────────────────────────────────────────────────
async function validarPago(pagoId, nuevoEstado, adminId) {
  const estadosValidos = ['aprobado', 'rechazado'];
  if (!estadosValidos.includes(nuevoEstado)) {
    const err = new Error(`Estado inválido. Opciones: ${estadosValidos.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const pagoRes = await pool.query(
    `SELECT id, pedido_id, estado FROM pagos WHERE id = $1`, [pagoId]
  );
  if (pagoRes.rows.length === 0) {
    const err = new Error('Pago no encontrado');
    err.status = 404;
    throw err;
  }
  const pago = pagoRes.rows[0];
  if (pago.estado === nuevoEstado) {
    const err = new Error(`El pago ya está en estado "${nuevoEstado}"`);
    err.status = 409;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE pagos SET estado = $1, actualizado_en = NOW() WHERE id = $2`,
      [nuevoEstado, pagoId]
    );

    // Si se aprueba → confirmar pedido (cross-module)
    if (nuevoEstado === 'aprobado') {
      const pedidoRes = await client.query(
        `SELECT estado FROM pedidos WHERE id = $1`, [pago.pedido_id]
      );
      if (pedidoRes.rows[0]?.estado === 'pendiente') {
        await actualizarEstadoPedido(pago.pedido_id, 'confirmado', adminId);
      }
    }

    await client.query('COMMIT');
    const actualizado = await pool.query(`SELECT * FROM pagos WHERE id = $1`, [pagoId]);
    return actualizado.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-023 — Consultar historial de pagos (admin)
// Retorna todos los pagos con datos del pedido y cliente.
// Acepta filtros: estado, metodo, pedido_id.
// ─────────────────────────────────────────────────────────────────────────────
async function listarPagos({ estado, metodo, pedidoId } = {}) {
  const condiciones = ['1=1'];
  const params      = [];

  if (estado)   { params.push(estado);   condiciones.push(`pa.estado = $${params.length}`); }
  if (metodo)   { params.push(metodo);   condiciones.push(`pa.metodo = $${params.length}`); }
  if (pedidoId) { params.push(pedidoId); condiciones.push(`pa.pedido_id = $${params.length}`); }

  const res = await pool.query(
    `SELECT
       pa.id,
       pa.pedido_id,
       pa.metodo,
       pa.estado,
       pa.monto,
       pa.mp_preference_id,
       pa.mp_payment_id,
       pa.mp_status,
       pa.mp_status_detail,
       pa.comprobante_url,
       pa.notas,
       pa.creado_en,
       pa.actualizado_en,
       -- Datos del pedido
       pe.estado         AS pedido_estado,
       pe.nombre_cliente,
       pe.email          AS cliente_email
     FROM pagos pa
     JOIN pedidos pe ON pe.id = pa.pedido_id
     WHERE ${condiciones.join(' AND ')}
     ORDER BY pa.creado_en DESC`,
    params
  );

  return res.rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-023 — Consultar historial de pagos de UN pedido específico (cliente)
// ─────────────────────────────────────────────────────────────────────────────
async function listarPagosPedido(pedidoId, usuarioId) {
  // Verificar que el pedido pertenece al usuario
  const check = await pool.query(
    `SELECT id FROM pedidos WHERE id = $1 AND usuario_id = $2 AND estado != '__carrito__'`,
    [pedidoId, usuarioId]
  );
  if (check.rows.length === 0) {
    const err = new Error('Pedido no encontrado o no pertenece a tu cuenta');
    err.status = 404;
    throw err;
  }

  const res = await pool.query(
    `SELECT id, metodo, estado, monto, mp_status, mp_status_detail, creado_en
     FROM pagos WHERE pedido_id = $1 ORDER BY creado_en DESC`,
    [pedidoId]
  );
  return res.rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-024 — Métricas para el Dashboard
// ─────────────────────────────────────────────────────────────────────────────
async function obtenerEficienciaPagos() {
  const res = await pool.query(`
    SELECT 
      COUNT(*) AS total_intentos,
      SUM(CASE WHEN estado = 'aprobado' THEN 1 ELSE 0 END) AS validados
    FROM pagos
  `);
  const total = parseInt(res.rows[0].total_intentos, 10);
  const validados = parseInt(res.rows[0].validados, 10);
  if (total === 0) return 0;
  return (validados / total) * 100;
}

module.exports = {
  registrarPagoManual,
  crearPreferenciaMercadoPago,
  procesarWebhookMP,
  validarPago,
  listarPagos,
  listarPagosPedido,
  obtenerEficienciaPagos,
};
