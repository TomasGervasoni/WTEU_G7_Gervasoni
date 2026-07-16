'use strict';

// =============================================================================
// Dashboard/DashboardContenedor.js — Router del módulo Dashboard
// CU-024 Dashboard, CU-025 Ventas, CU-026 Pedidos, CU-027 Clientes, CU-028 Excel
// =============================================================================
// PLACEHOLDER — se completa al implementar con el prompt 2.6.
// =============================================================================

const express = require('express');
const router = express.Router();
const DashboardAdapter = require('./DashboardAdapters/DashboardAdapter');
const { requireAuth, requireRole } = require('../Seguridad/SeguridadServices/SeguridadServices');

// CU-024: GET /           ← KPIs del dashboard principal
router.get('/', requireAuth, requireRole('administrador'), DashboardAdapter.getResumen);

// CU-028: GET /exportar   ← descarga del Excel (exceljs)
router.get('/exportar', requireAuth, requireRole('administrador'), DashboardAdapter.exportarExcel);

module.exports = router;
