'use strict';

// =============================================================================
// Seguridad/SeguridadServices/SeguridadServices.js
// Lógica de negocio del módulo Seguridad (CU-001 a CU-005).
// No conoce Express ni req/res — solo recibe datos y devuelve resultados.
// =============================================================================

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const pool   = require('../../config/db');

// Rondas de bcrypt — 12 es un buen balance seguridad/velocidad
const SALT_ROUNDS = 12;

// ─────────────────────────────────────────────────────────────────────────────
// CU-001 — Registrar Usuario
// Precondiciones : usuario y email únicos en la BD.
// Postcondición éxito: usuario creado en tabla `usuarios` + fila en `clientes`.
// Postcondición falla: lanza error con mensaje descriptivo para el Adapter.
// ─────────────────────────────────────────────────────────────────────────────
async function registrarUsuario({ usuario, nombre, email, password }) {
  // Verificar duplicados (CU-001 flujo alternativo A1)
  const existe = await pool.query(
    'SELECT id FROM usuarios WHERE usuario = $1 OR email = $2',
    [usuario.trim(), email.trim().toLowerCase()]
  );
  if (existe.rows.length > 0) {
    const err = new Error('El usuario o email ya existe');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Transacción: insertar usuario + perfil de cliente atómicamente
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const resUsuario = await client.query(
      `INSERT INTO usuarios (usuario, nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, $4, 'cliente')
       RETURNING id, usuario, nombre, email, rol`,
      [usuario.trim(), nombre.trim(), email.trim().toLowerCase(), passwordHash]
    );
    const nuevoUsuario = resUsuario.rows[0];

    // Crear perfil cliente (CU-006 se inicia aquí automáticamente)
    await client.query(
      `INSERT INTO clientes (usuario_id, nombre_completo)
       VALUES ($1, $2)`,
      [nuevoUsuario.id, nombre.trim()]
    );

    await client.query('COMMIT');
    return nuevoUsuario;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-002 — Iniciar Sesión
// El mensaje de error SIEMPRE es genérico (no distingue usuario/contraseña).
// Retorna el payload del token, no el token en sí (eso lo hace el Adapter).
// ─────────────────────────────────────────────────────────────────────────────
async function autenticarUsuario({ usuario, password }) {
  const ERROR_GENERICO = new Error('Usuario o contraseña incorrectos');
  ERROR_GENERICO.status = 401;

  // Precondición: usuario existe y está activo
  const res = await pool.query(
    'SELECT id, usuario, nombre, email, rol, activo, password_hash FROM usuarios WHERE usuario = $1',
    [usuario.trim()]
  );
  if (res.rows.length === 0) throw ERROR_GENERICO;

  const user = res.rows[0];
  if (!user.activo) throw ERROR_GENERICO; // baja lógica → mismo error genérico

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw ERROR_GENERICO;

  // Payload del JWT — nunca incluir password_hash
  const payload = {
    id:      user.id,
    usuario: user.usuario,
    nombre:  user.nombre,
    email:   user.email,
    rol:     user.rol,
  };
  return payload;
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-004 — Recuperar Contraseña
// Flujo simplificado (sin SMTP en el TP): verifica que el email existe,
// genera un token temporal de reset y lo devuelve al Adapter.
// En producción el Adapter lo enviaría por email; para el TP lo retorna en
// la respuesta JSON (solo visible en la red — NO en el HTML).
// ─────────────────────────────────────────────────────────────────────────────
async function generarTokenRecuperacion(email) {
  const res = await pool.query(
    'SELECT id, email, activo FROM usuarios WHERE email = $1',
    [email.trim().toLowerCase()]
  );

  // Flujo alternativo A1: email no registrado → respuesta genérica (no revelar)
  if (res.rows.length === 0 || !res.rows[0].activo) {
    // Respuesta intencionalmente idéntica para no filtrar información
    return null;
  }

  const usuario = res.rows[0];

  // Token de corta duración (15 minutos) firmado con el JWT_SECRET
  const resetToken = jwt.sign(
    { id: usuario.id, tipo: 'reset_password' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  return resetToken;
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-004 — Cambiar contraseña usando token de reset
// ─────────────────────────────────────────────────────────────────────────────
async function cambiarPasswordConToken({ token, nuevaPassword }) {
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    const err = new Error('Token de recuperación inválido o expirado');
    err.status = 400;
    throw err;
  }

  if (payload.tipo !== 'reset_password') {
    const err = new Error('Token inválido');
    err.status = 400;
    throw err;
  }

  const hash = await bcrypt.hash(nuevaPassword, SALT_ROUNDS);
  await pool.query(
    'UPDATE usuarios SET password_hash = $1, actualizado_en = NOW() WHERE id = $2',
    [hash, payload.id]
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generación del JWT de sesión (usado en CU-002)
// ─────────────────────────────────────────────────────────────────────────────
function generarJWT(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-005 — Middleware requireAuth
// Verifica que la cookie `token` sea un JWT válido y que el usuario
// siga existiendo en la base de datos y esté activo (evita sesiones zombie de usuarios dados de baja).
// Si no cumple, responde 401 sin llegar al handler de la ruta.
// ─────────────────────────────────────────────────────────────────────────────
async function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ ok: false, mensaje: 'No autenticado' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Consulta rápida para validar baja lógica (CU-009)
    const userRes = await pool.query(
      'SELECT activo FROM usuarios WHERE id = $1',
      [payload.id]
    );

    if (userRes.rows.length === 0 || !userRes.rows[0].activo) {
      return res.status(401).json({ ok: false, mensaje: 'Usuario inactivo o inexistente' });
    }

    req.usuario = payload; // disponible para el Adapter y el Service del módulo destino
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ ok: false, mensaje: 'Sesión expirada o inválida' });
    }
    // Error de base de datos u otro tipo
    console.error('[requireAuth] Error al verificar estado de usuario:', err.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno al validar la sesión' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-005 — Middleware requireRole
// Se usa DESPUÉS de requireAuth. Verifica que el usuario tenga el rol esperado.
// Uso: router.get('/ruta', requireAuth, requireRole('administrador'), handler)
// ─────────────────────────────────────────────────────────────────────────────
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ ok: false, mensaje: 'No autenticado' });
    }
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ ok: false, mensaje: 'Acceso denegado: permisos insuficientes' });
    }
    next();
  };
}

module.exports = {
  registrarUsuario,
  autenticarUsuario,
  generarJWT,
  generarTokenRecuperacion,
  cambiarPasswordConToken,
  requireAuth,
  requireRole,
};
