'use strict';

// =============================================================================
// Cancelacion/CancelacionAdapters/CancelacionAdapters.js
// Controladores HTTP del módulo Cancelación (CU-017, CU-018, CU-019).
// Validan shape del body/params, llaman al Service, arman la respuesta HTTP.
// NO acceden directamente a la base de datos.
// =============================================================================

const {
  solicitarCancelacion,
  aprobarCancelacion,
  rechazarCancelacion,
  listarSolicitudes,
} = require('../CancelacionServices/CancelacionServices');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/cancelacion/:pedidoId/solicitar — CU-017
// Requiere sesión de cliente. El ID del usuario viene de req.usuario (JWT).
// ─────────────────────────────────────────────────────────────────────────────
async function solicitar(req, res, next) {
  try {
    const pedidoId = parseInt(req.params.pedidoId, 10);
    if (isNaN(pedidoId)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de pedido inválido' });
    }

    const usuarioId = req.usuario.id;
    const motivo = (req.body.motivo || '').trim() || null;

    const solicitud = await solicitarCancelacion(pedidoId, usuarioId, motivo);
    return res.status(201).json({
      ok: true,
      mensaje: 'Solicitud de cancelación enviada. Será revisada por nuestro equipo.',
      solicitud,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/cancelacion/:id/aprobar — CU-018 (admin)
// ─────────────────────────────────────────────────────────────────────────────
async function aprobar(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de solicitud inválido' });
    }

    const adminId = req.usuario.id;
    const resultado = await aprobarCancelacion(id, adminId);
    return res.status(200).json({
      ok: true,
      mensaje: 'Cancelación aprobada. El pedido pasó a estado "cancelado".',
      ...resultado,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/cancelacion/:id/rechazar — CU-019 (admin)
// ─────────────────────────────────────────────────────────────────────────────
async function rechazar(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de solicitud inválido' });
    }

    const adminId = req.usuario.id;
    const motivoRechazo = (req.body.motivo_rechazo || '').trim() || null;
    
    const solicitud = await rechazarCancelacion(id, adminId, motivoRechazo);
    return res.status(200).json({
      ok: true,
      mensaje: 'Solicitud de cancelación rechazada. El pedido conserva su estado anterior.',
      solicitud,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/cancelacion — Listar solicitudes (admin)
// Query param opcional: ?estado=solicitada|aprobada|rechazada
// ─────────────────────────────────────────────────────────────────────────────
async function listar(req, res, next) {
  try {
    const estadosPermitidos = ['solicitada', 'aprobada', 'rechazada'];
    const filtro = req.query.estado;
    if (filtro && !estadosPermitidos.includes(filtro)) {
      return res.status(400).json({ ok: false, mensaje: `Estado inválido: ${filtro}` });
    }

    const solicitudes = await listarSolicitudes(filtro || null);
    return res.status(200).json({ ok: true, solicitudes });
  } catch (err) {
    next(err);
  }
}

module.exports = { solicitar, aprobar, rechazar, listar };
