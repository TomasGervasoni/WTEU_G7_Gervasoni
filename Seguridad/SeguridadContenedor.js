'use strict';

// =============================================================================
// Seguridad/SeguridadContenedor.js — Router del módulo Seguridad
// CU-001 Registrar Usuario, CU-002 Iniciar Sesión, CU-003 Cerrar Sesión,
// CU-004 Recuperar Contraseña, CU-005 Gestionar Roles y Permisos
// =============================================================================
// Montado en app.js como: app.use('/api/v1/seguridad', SeguridadContenedor)
// =============================================================================

const express  = require('express');
const router   = express.Router();
const adapters = require('./SeguridadAdapters/SeguridadAdapters');
const { requireAuth } = require('./SeguridadServices/SeguridadServices');

// CU-001 — Registrar usuario
router.post('/registro', adapters.registro);

// CU-002 — Iniciar sesión
router.post('/autenticacion', adapters.autenticacion);

// CU-003 — Cerrar sesión
router.get('/logout', adapters.logout);

// CU-004 — Solicitar recuperación de contraseña (paso 1)
router.post('/recuperar-password', adapters.recuperarPassword);

// CU-004 — Cambiar contraseña con token (paso 2)
router.post('/cambiar-password', adapters.cambiarPassword);

// Utilidad: datos del usuario logueado (requiere sesión — CU-005)
router.get('/me', requireAuth, adapters.me);

module.exports = router;
