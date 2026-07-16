'use strict';

// =============================================================================
// Cancelacion/CancelacionContenedor.js — Router del módulo Cancelación
// CU-017 Solicitar Cancelación, CU-018 Aprobar, CU-019 Rechazar
// Montado en app.js como: app.use('/api/v1/cancelacion', CancelacionContenedor)
// =============================================================================

const express = require('express');
const router  = express.Router();

const adapters = require('./CancelacionAdapters/CancelacionAdapters');
const { requireAuth, requireRole } = require('../Seguridad/SeguridadServices/SeguridadServices');

// ─────────────────────────────────────────────────────────────────────────────
// CU-017 — Solicitar cancelación (cliente autenticado)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:pedidoId/solicitar', requireAuth, adapters.solicitar);

// ─────────────────────────────────────────────────────────────────────────────
// CU-018 — Aprobar solicitud de cancelación (admin)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/aprobar', requireAuth, requireRole('administrador'), adapters.aprobar);

// ─────────────────────────────────────────────────────────────────────────────
// CU-019 — Rechazar solicitud de cancelación (admin)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/rechazar', requireAuth, requireRole('administrador'), adapters.rechazar);

// ─────────────────────────────────────────────────────────────────────────────
// GET — Listar solicitudes de cancelación (admin, panel de gestión)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', requireAuth, requireRole('administrador'), adapters.listar);

module.exports = router;
