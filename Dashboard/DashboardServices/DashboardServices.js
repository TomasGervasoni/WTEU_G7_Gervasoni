'use strict';

// =============================================================================
// Dashboard/DashboardServices/DashboardServices.js
// Lógica de orquestación del Dashboard (CU-024).
// Delega en los otros servicios (cross-module) para obtener las métricas.
// =============================================================================

const { obtenerMetricasPedidos, listarPedidosAdmin } = require('../../Pedidos/PedidosServices/PedidosServices');
const { obtenerMetricasClientes } = require('../../Clientes/ClientesServices/ClientesServices');
const { obtenerEficienciaPagos } = require('../../Pagos/PagosServices/PagosServices');
const ExcelJS = require('exceljs');

async function generarResumenDashboard() {
  const metricasPedidos = await obtenerMetricasPedidos();
  const clientesTotales = await obtenerMetricasClientes();
  const eficienciaPagos = await obtenerEficienciaPagos();

  return {
    ...metricasPedidos,
    clientesTotales,
    eficienciaPagos
  };
}

async function exportarReporteExcel() {
  const pedidos = await listarPedidosAdmin();
  
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'WTEU Admin';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Reporte de Pedidos');
  
  worksheet.columns = [
    { header: 'ID Pedido', key: 'id', width: 10 },
    { header: 'Fecha', key: 'fecha', width: 20 },
    { header: 'Cliente', key: 'cliente', width: 30 },
    { header: 'Estado', key: 'estado', width: 15 },
    { header: 'Total (ARS)', key: 'total', width: 15 }
  ];

  pedidos.forEach(p => {
    worksheet.addRow({
      id: p.id,
      fecha: new Date(p.creado_en).toLocaleString('es-AR'),
      cliente: p.nombre_cliente,
      estado: p.estado,
      total: p.total
    });
  });

  return workbook.xlsx.writeBuffer();
}

module.exports = {
  generarResumenDashboard,
  exportarReporteExcel
};
