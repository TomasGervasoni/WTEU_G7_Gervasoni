'use strict';

// =============================================================================
// Clientes/ClientesServices/ClientesServices.js
// Lógica de negocio del módulo Clientes (CU-006 a CU-010).
// No conoce Express ni req/res. Accede directamente a PostgreSQL vía pool.
// =============================================================================

const pool = require('../../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// CU-006 — Dar de alta cliente (manual por administrador)
// Nota: el alta AUTOMÁTICA ocurre en SeguridadServices.registrarUsuario()
// Este CU cubre el alta manual por parte del admin desde el panel.
// Crea el usuario con rol 'cliente' + su perfil en clientes.
// ─────────────────────────────────────────────────────────────────────────────
async function altaCliente({ usuario, nombre, email, password }) {
  // Verificar unicidad (mismo chequeo que en Seguridad para consistencia)
  const existe = await pool.query(
    'SELECT id FROM usuarios WHERE usuario = $1 OR email = $2',
    [usuario.trim(), email.trim().toLowerCase()]
  );
  if (existe.rows.length > 0) {
    const err = new Error('El usuario o email ya existe');
    err.status = 409;
    throw err;
  }

  // Hashear contraseña — importamos bcrypt aquí para no depender de Seguridad
  const bcrypt = require('bcrypt');
  const hash = await bcrypt.hash(password, 12);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const resU = await client.query(
      `INSERT INTO usuarios (usuario, nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, $4, 'cliente')
       RETURNING id, usuario, nombre, email, rol, activo, creado_en`,
      [usuario.trim(), nombre.trim(), email.trim().toLowerCase(), hash]
    );
    const u = resU.rows[0];

    await client.query(
      `INSERT INTO clientes (usuario_id, nombre_completo)
       VALUES ($1, $2)`,
      [u.id, nombre.trim()]
    );

    await client.query('COMMIT');
    return u;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-007 — Modificar datos del cliente
// El admin puede modificar: nombre, email del usuario y datos de perfil del cliente.
// No permite cambiar el nombre de usuario (campo inmutable según documento).
// ─────────────────────────────────────────────────────────────────────────────
async function modificarCliente(id, { nombre, email, whatsapp, direccion, codigoPostal }) {
  // Verificar que el cliente existe y está activo
  const res = await pool.query(
    `SELECT u.id FROM usuarios u WHERE u.id = $1`,
    [id]
  );
  if (res.rows.length === 0) {
    const err = new Error('Cliente no encontrado');
    err.status = 404;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Actualizar tabla usuarios
    if (nombre || email) {
      await client.query(
        `UPDATE usuarios
         SET nombre = COALESCE($1, nombre),
             email  = COALESCE($2, email),
             actualizado_en = NOW()
         WHERE id = $3`,
        [nombre?.trim() || null, email?.trim().toLowerCase() || null, id]
      );
    }

    // Actualizar tabla clientes (datos de perfil)
    await client.query(
      `UPDATE clientes
       SET nombre_completo = COALESCE($1, nombre_completo),
           whatsapp        = COALESCE($2, whatsapp),
           direccion       = COALESCE($3, direccion),
           codigo_postal   = COALESCE($4, codigo_postal),
           actualizado_en  = NOW()
       WHERE usuario_id = $5`,
      [nombre?.trim() || null, whatsapp || null, direccion || null, codigoPostal || null, id]
    );

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  return consultarClientePorId(id);
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-008 — Consultar clientes (listado con búsqueda opcional)
// Retorna todos los clientes (rol='cliente') con búsqueda por nombre/usuario/email.
// ─────────────────────────────────────────────────────────────────────────────
async function listarClientes(busqueda = '') {
  const termino = `%${busqueda.trim()}%`;

  const res = await pool.query(
    `SELECT
       u.id,
       u.usuario,
       u.nombre,
       u.email,
       u.activo,
       u.creado_en,
       c.whatsapp,
       c.direccion,
       c.codigo_postal
     FROM usuarios u
     LEFT JOIN clientes c ON c.usuario_id = u.id
     WHERE u.rol = 'cliente'
       AND (
         $1 = '%%'
         OR u.nombre  ILIKE $1
         OR u.usuario ILIKE $1
         OR u.email   ILIKE $1
       )
     ORDER BY u.creado_en DESC`,
    [termino]
  );
  return res.rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-008 — Consultar un cliente por ID (para el modal de editar)
// ─────────────────────────────────────────────────────────────────────────────
async function consultarClientePorId(id) {
  const res = await pool.query(
    `SELECT
       u.id,
       u.usuario,
       u.nombre,
       u.email,
       u.activo,
       u.creado_en,
       c.whatsapp,
       c.direccion,
       c.codigo_postal
     FROM usuarios u
     LEFT JOIN clientes c ON c.usuario_id = u.id
     WHERE u.id = $1 AND u.rol = 'cliente'`,
    [id]
  );
  if (res.rows.length === 0) {
    const err = new Error('Cliente no encontrado');
    err.status = 404;
    throw err;
  }
  return res.rows[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-009 — Dar de baja cliente (baja LÓGICA — nunca DELETE físico)
// Pone activo=false en la tabla usuarios. El cliente no puede iniciar sesión.
// ─────────────────────────────────────────────────────────────────────────────
async function bajaCliente(id) {
  const res = await pool.query(
    `UPDATE usuarios
     SET activo = false, actualizado_en = NOW()
     WHERE id = $1 AND rol = 'cliente'
     RETURNING id, usuario, activo`,
    [id]
  );
  if (res.rows.length === 0) {
    const err = new Error('Cliente no encontrado');
    err.status = 404;
    throw err;
  }
  return res.rows[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Extensión de CU-009 — Reactivar cliente
// Pone activo=true en la tabla usuarios. El cliente vuelve a tener acceso.
// ─────────────────────────────────────────────────────────────────────────────
async function reactivarCliente(id) {
  const res = await pool.query(
    `UPDATE usuarios
     SET activo = true, actualizado_en = NOW()
     WHERE id = $1 AND rol = 'cliente'
     RETURNING id, usuario, activo`,
    [id]
  );
  if (res.rows.length === 0) {
    const err = new Error('Cliente no encontrado');
    err.status = 404;
    throw err;
  }
  return res.rows[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-010 — Consultar historial de pedidos de un cliente
// cross-module: importamos obtenerPedidosPorUsuario de PedidosServices
// en lugar de duplicar la query SQL aquí.
// Motivo: PedidosServices es la fuente de verdad sobre el modelo de pedidos;
// tener la query en dos lugares generaría inconsistencias ante futuros cambios.
// ─────────────────────────────────────────────────────────────────────────────
const { obtenerPedidosPorUsuario } = require('../../Pedidos/PedidosServices/PedidosServices'); // cross-module: CU-010 necesita datos de Pedidos

async function historialPedidosCliente(usuarioId) {
  // Verificar que el usuario existe y es cliente antes de delegar
  const userRes = await pool.query(
    'SELECT id FROM usuarios WHERE id = $1 AND rol = $2',
    [usuarioId, 'cliente']
  );
  if (userRes.rows.length === 0) {
    const err = new Error('Cliente no encontrado');
    err.status = 404;
    throw err;
  }

  // Delegar al Service del módulo Pedidos (cross-module)
  return obtenerPedidosPorUsuario(usuarioId);
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-024 — Métricas para el Dashboard
// ─────────────────────────────────────────────────────────────────────────────
async function obtenerMetricasClientes() {
  const res = await pool.query(`SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'cliente' AND activo = true`);
  return parseInt(res.rows[0].total, 10);
}

module.exports = {
  altaCliente,
  modificarCliente,
  listarClientes,
  consultarClientePorId,
  bajaCliente,
  reactivarCliente,
  historialPedidosCliente,
  obtenerMetricasClientes,
};
