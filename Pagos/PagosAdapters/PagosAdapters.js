'use strict';

// =============================================================================
// Pagos/PagosAdapters/PagosAdapters.js
// Controladores HTTP del módulo Pagos (CU-020 a CU-023).
// Solo valida el shape del request y delega al Service. No accede a la DB.
// =============================================================================

const {
  registrarPagoManual,
  crearPreferenciaMercadoPago,
  procesarWebhookMP,
  validarPago,
  listarPagos,
  listarPagosPedido,
} = require('../PagosServices/PagosServices');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/pagos/admin/manual — CU-020 (admin)
// ─────────────────────────────────────────────────────────────────────────────
async function registrarManual(req, res, next) {
  try {
    const { pedido_id, metodo, monto, notas, comprobante_url } = req.body;

    if (!pedido_id || !metodo) {
      return res.status(400).json({ ok: false, mensaje: 'pedido_id y metodo son obligatorios' });
    }

    const pago = await registrarPagoManual({
      pedidoId:       parseInt(pedido_id, 10),
      metodo,
      monto:          monto != null ? parseFloat(monto) : null,
      notas:          notas || null,
      comprobanteUrl: comprobante_url || null,
      adminId:        req.usuario.id,
    });

    return res.status(201).json({ ok: true, pago });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/pagos/mp/preferencia — CU-021 (cliente autenticado)
// ─────────────────────────────────────────────────────────────────────────────
async function crearPreferencia(req, res, next) {
  try {
    const { pedido_id } = req.body;
    if (!pedido_id) {
      return res.status(400).json({ ok: false, mensaje: 'pedido_id es obligatorio' });
    }

    const resultado = await crearPreferenciaMercadoPago(
      parseInt(pedido_id, 10),
      req.usuario.id
    );

    return res.status(200).json({ ok: true, ...resultado });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/pagos/mp/webhook — CU-021 (sin auth — llamado por MP)
// ─────────────────────────────────────────────────────────────────────────────
async function webhook(req, res, next) {
  try {
    // MP espera respuesta rápida (200) independientemente de lo que hagamos
    const resultado = await procesarWebhookMP(req.body);
    console.log('[CU-021][webhook]', resultado);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[CU-021][webhook] Error:', err.message);
    // Devolver 200 de todas formas para que MP no reintente indefinidamente
    return res.status(200).json({ ok: false, mensaje: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/pagos/mp/retorno — CU-021 (redirect de MP tras pago)
// MP redirige al cliente aquí tras el intento de pago.
// Redirigimos al frontend con el estado.
// ─────────────────────────────────────────────────────────────────────────────
function retornoMP(req, res) {
  const { status, pedido_id } = req.query;
  // Redirigir a la pantalla de mis pedidos con un query param de resultado
  return res.redirect(
    `/Pedidos/PedidosPages/PedidosMisPedidos.html?pago=${status || 'pending'}&pedido=${pedido_id || ''}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/pagos/admin/:pagoId/validar — CU-022 (admin)
// ─────────────────────────────────────────────────────────────────────────────
async function validar(req, res, next) {
  try {
    const pagoId = parseInt(req.params.pagoId, 10);
    if (isNaN(pagoId)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de pago inválido' });
    }

    const { estado } = req.body;
    if (!estado) {
      return res.status(400).json({ ok: false, mensaje: 'estado es obligatorio (aprobado | rechazado)' });
    }

    const pago = await validarPago(pagoId, estado, req.usuario.id);
    return res.status(200).json({ ok: true, pago });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/pagos/admin/historial — CU-023 (admin)
// Query params opcionales: estado, metodo, pedido_id
// ─────────────────────────────────────────────────────────────────────────────
async function historialAdmin(req, res, next) {
  try {
    const { estado, metodo, pedido_id } = req.query;
    const pagos = await listarPagos({
      estado:   estado   || null,
      metodo:   metodo   || null,
      pedidoId: pedido_id ? parseInt(pedido_id, 10) : null,
    });
    return res.status(200).json({ ok: true, pagos });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/pagos/pedido/:pedidoId — CU-023 (cliente autenticado)
// ─────────────────────────────────────────────────────────────────────────────
async function historialPedido(req, res, next) {
  try {
    const pedidoId = parseInt(req.params.pedidoId, 10);
    if (isNaN(pedidoId)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de pedido inválido' });
    }

    const pagos = await listarPagosPedido(pedidoId, req.usuario.id);
    return res.status(200).json({ ok: true, pagos });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registrarManual,
  crearPreferencia,
  webhook,
  retornoMP,
  validar,
  historialAdmin,
  historialPedido,
};
