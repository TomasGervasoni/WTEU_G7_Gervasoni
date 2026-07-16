'use strict';

// =============================================================================
// Clientes/ClientesAdapters/ClientesAdapters.js
// Controladores HTTP del módulo Clientes (CU-006 a CU-010).
// Validan shape del body, llaman al Service, arman la respuesta HTTP.
// NO acceden directamente a la base de datos.
// =============================================================================

const {
  altaCliente,
  modificarCliente,
  listarClientes,
  consultarClientePorId,
  bajaCliente,
  historialPedidosCliente,
  reactivarCliente,
} = require('../ClientesServices/ClientesServices');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/clientes — CU-008 Listar clientes (con búsqueda opcional)
// Query param: ?busqueda=texto
// ─────────────────────────────────────────────────────────────────────────────
async function listar(req, res, next) {
  try {
    const busqueda = req.query.busqueda || '';
    const clientes = await listarClientes(busqueda);
    return res.status(200).json({ ok: true, clientes });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/clientes/:id — CU-008 Consultar un cliente por ID
// ─────────────────────────────────────────────────────────────────────────────
async function obtenerUno(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID inválido' });
    }
    const cliente = await consultarClientePorId(id);
    return res.status(200).json({ ok: true, cliente });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/clientes — CU-006 Alta manual de cliente (por admin)
// Body: { usuario, nombre, email, password }
// ─────────────────────────────────────────────────────────────────────────────
async function alta(req, res, next) {
  try {
    const { usuario, nombre, email, password } = req.body;

    if (!usuario || !nombre || !email || !password) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Campos obligatorios: usuario, nombre, email, password',
      });
    }

    const nuevoCliente = await altaCliente({ usuario, nombre, email, password });
    return res.status(201).json({
      ok: true,
      mensaje: 'Cliente creado correctamente',
      cliente: nuevoCliente,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/clientes/:id — CU-007 Modificar datos del cliente
// Body: { nombre?, email?, whatsapp?, direccion?, codigoPostal? }
// ─────────────────────────────────────────────────────────────────────────────
async function modificar(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID inválido' });
    }

    const { nombre, email, whatsapp, direccion, codigoPostal } = req.body;
    const clienteActualizado = await modificarCliente(id, { nombre, email, whatsapp, direccion, codigoPostal });

    return res.status(200).json({
      ok: true,
      mensaje: 'Cliente actualizado correctamente',
      cliente: clienteActualizado,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/clientes/:id — CU-009 Dar de baja (baja LÓGICA)
// No elimina físicamente — pone activo=false en la tabla usuarios.
// ─────────────────────────────────────────────────────────────────────────────
async function baja(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID inválido' });
    }

    const resultado = await bajaCliente(id);
    return res.status(200).json({
      ok: true,
      mensaje: 'Cliente dado de baja correctamente',
      cliente: resultado,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/clientes/:id/reactivar — Extensión de CU-009 (Reactivar)
// Pone activo=true en la tabla usuarios.
// ─────────────────────────────────────────────────────────────────────────────
async function reactivar(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID inválido' });
    }

    const resultado = await reactivarCliente(id);
    return res.status(200).json({
      ok: true,
      mensaje: 'Cliente reactivado correctamente',
      cliente: resultado,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/clientes/:id/historial — CU-010 Historial de pedidos del cliente
// ─────────────────────────────────────────────────────────────────────────────
async function historial(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID inválido' });
    }

    const pedidos = await historialPedidosCliente(id);
    return res.status(200).json({ ok: true, pedidos });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtenerUno, alta, modificar, baja, reactivar, historial };
