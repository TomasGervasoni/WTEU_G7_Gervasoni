'use strict';

// =============================================================================
// Seguridad/SeguridadAdapters/SeguridadAdapters.js
// Controladores HTTP del módulo Seguridad.
// Validan el shape del payload, llaman al Service y traducen el resultado
// a una respuesta HTTP. NO acceden directamente a la base de datos.
// =============================================================================

const {
  registrarUsuario,
  autenticarUsuario,
  generarJWT,
  generarTokenRecuperacion,
  cambiarPasswordConToken,
} = require('../SeguridadServices/SeguridadServices');

// Opciones de la cookie de sesión (AGENTS.md §2)
// secure: true  → solo HTTPS (Railway/producción)
// sameSite: 'none' → cross-site para que GitHub Pages pueda enviar cookies a Railway
// En desarrollo local con HTTP, los navegadores modernos pueden rechazar secure+sameSite:none
// → usamos una variable de entorno para relajarlo en local sin tocar el código.
function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure:   isProd,                       // true en Railway, false en localhost
    sameSite: isProd ? 'none' : 'lax',     // 'none' requiere secure:true
    maxAge:   7 * 24 * 60 * 60 * 1000,     // 7 días en ms
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/seguridad/registro — CU-001 Registrar Usuario
// Body: { usuario, nombre, email, password }
// ─────────────────────────────────────────────────────────────────────────────
async function registro(req, res, next) {
  try {
    const { usuario, nombre, email, password } = req.body;

    // Validación de shape (el Service no conoce req/res)
    if (!usuario || !nombre || !email || !password) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Todos los campos son obligatorios: usuario, nombre, email, password',
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        ok: false,
        mensaje: 'La contraseña debe tener al menos 6 caracteres',
      });
    }

    const nuevoUsuario = await registrarUsuario({ usuario, nombre, email, password });

    // Auto-login después del registro: generamos el JWT y lo enviamos en cookie
    const payload = {
      id:      nuevoUsuario.id,
      usuario: nuevoUsuario.usuario,
      nombre:  nuevoUsuario.nombre,
      email:   nuevoUsuario.email,
      rol:     nuevoUsuario.rol,
    };
    const token = generarJWT(payload);
    res.cookie('token', token, cookieOptions());

    return res.status(201).json({
      ok: true,
      mensaje: 'Usuario registrado correctamente',
      usuario: {
        id:      nuevoUsuario.id,
        usuario: nuevoUsuario.usuario,
        nombre:  nuevoUsuario.nombre,
        email:   nuevoUsuario.email,
        rol:     nuevoUsuario.rol,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/seguridad/autenticacion — CU-002 Iniciar Sesión
// Body: { usuario, password }
// ─────────────────────────────────────────────────────────────────────────────
async function autenticacion(req, res, next) {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({
        ok: false,
        // Genérico — no distinguir campo faltante de credencial incorrecta
        mensaje: 'Usuario o contraseña incorrectos',
      });
    }

    const payload = await autenticarUsuario({ usuario, password });
    const token   = generarJWT(payload);

    res.cookie('token', token, cookieOptions());

    return res.status(200).json({
      ok: true,
      mensaje: 'Sesión iniciada',
      usuario: {
        id:      payload.id,
        usuario: payload.usuario,
        nombre:  payload.nombre,
        email:   payload.email,
        rol:     payload.rol,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/seguridad/logout — CU-003 Cerrar Sesión
// Borra la cookie httpOnly del lado del servidor.
// No requiere autenticación previa (si el token expiró igual debe poder salir).
// ─────────────────────────────────────────────────────────────────────────────
function logout(req, res) {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? 'none' : 'lax',
  });
  return res.status(200).json({ ok: true, mensaje: 'Sesión cerrada' });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/seguridad/recuperar-password — CU-004 (paso 1: solicitar reset)
// Body: { email }
// ─────────────────────────────────────────────────────────────────────────────
async function recuperarPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ ok: false, mensaje: 'El email es obligatorio' });
    }

    const resetToken = await generarTokenRecuperacion(email);

    // Respuesta genérica independientemente de si el email existe (evitar enumeración)
    // En un sistema real: enviar resetToken por email. Para el TP se devuelve en el body.
    if (resetToken) {
      console.log(`[CU-004] Token de reset generado para ${email}: ${resetToken}`);
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Si el email está registrado, recibirás las instrucciones para restablecer tu contraseña.',
      // SOLO para el TP: exponer el token en la respuesta para poder probar sin email
      ...(process.env.NODE_ENV !== 'production' && resetToken ? { resetToken } : {}),
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/seguridad/cambiar-password — CU-004 (paso 2: usar el token)
// Body: { token, nuevaPassword }
// ─────────────────────────────────────────────────────────────────────────────
async function cambiarPassword(req, res, next) {
  try {
    const { token, nuevaPassword } = req.body;
    if (!token || !nuevaPassword) {
      return res.status(400).json({ ok: false, mensaje: 'Token y nueva contraseña son obligatorios' });
    }
    if (nuevaPassword.length < 6) {
      return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }

    await cambiarPasswordConToken({ token, nuevaPassword });
    return res.status(200).json({ ok: true, mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/seguridad/me — utilidad: devuelve los datos del usuario logueado
// Requiere requireAuth (montado en el Contenedor)
// ─────────────────────────────────────────────────────────────────────────────
function me(req, res) {
  return res.status(200).json({ ok: true, usuario: req.usuario });
}

module.exports = {
  registro,
  autenticacion,
  logout,
  recuperarPassword,
  cambiarPassword,
  me,
};
