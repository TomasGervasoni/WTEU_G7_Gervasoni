'use strict';

// =============================================================================
// Pagos/PagosContenedor.js — Router del módulo Pagos
// CU-020 Pago manual, CU-021 MercadoPago, CU-022 Validar pago, CU-023 Historial
// =============================================================================

const express = require('express');
const router  = express.Router();

const adapters = require('./PagosAdapters/PagosAdapters');

// cross-module: autenticación y autorización por rol vienen de Seguridad
const { requireAuth, requireRole } = require('../Seguridad/SeguridadServices/SeguridadServices');

// ─── Rutas admin ──────────────────────────────────────────────────────────────

// CU-020 — Registrar pago manual
router.post(
  '/admin/manual',
  requireAuth,
  requireRole('administrador'),
  adapters.registrarManual
);

// CU-022 — Validar pago MP manualmente
router.put(
  '/admin/:pagoId/validar',
  requireAuth,
  requireRole('administrador'),
  adapters.validar
);

// CU-023 — Historial completo de pagos (admin)
router.get(
  '/admin/historial',
  requireAuth,
  requireRole('administrador'),
  adapters.historialAdmin
);

// ─── Rutas cliente ────────────────────────────────────────────────────────────

// CU-021 — Crear preferencia MercadoPago
router.post(
  '/mp/preferencia',
  requireAuth,
  adapters.crearPreferencia
);

// CU-021 — Webhook MercadoPago (sin auth — llamado por MP, no por el cliente)
router.post(
  '/mp/webhook',
  adapters.webhook
);

// CU-021 — Retorno desde MercadoPago (redirect)
router.get(
  '/mp/retorno',
  adapters.retornoMP
);

// CU-023 — Historial de pagos de un pedido específico (cliente)
router.get(
  '/pedido/:pedidoId',
  requireAuth,
  adapters.historialPedido
);

module.exports = router;
