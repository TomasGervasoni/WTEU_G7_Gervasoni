'use strict';

// =============================================================================
// Dashboard/DashboardAdapters/DashboardAdapter.js
// Adaptador del módulo Dashboard (CU-024).
// =============================================================================

const DashboardServices = require('../DashboardServices/DashboardServices');

async function getResumen(req, res, next) {
  try {
    const resumen = await DashboardServices.generarResumenDashboard();
    res.json(resumen);
  } catch (error) {
    next(error);
  }
}

async function exportarExcel(req, res, next) {
  try {
    const buffer = await DashboardServices.exportarReporteExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Reporte_WTEU.xlsx"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getResumen,
  exportarExcel
};
