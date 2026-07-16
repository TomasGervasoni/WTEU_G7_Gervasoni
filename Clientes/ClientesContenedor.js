'use strict';

// =============================================================================
// Clientes/ClientesContenedor.js — Router del módulo Clientes
// CU-006 Alta, CU-007 Modificar, CU-008 Consultar, CU-009 Baja, CU-010 Historial
// Montado en app.js como: app.use('/api/v1/clientes', ClientesContenedor)
// Todos los endpoints requieren requireAuth + requireRole('administrador').
// =============================================================================

const express  = require('express');
const router   = express.Router();
const adapters = require('./ClientesAdapters/ClientesAdapters');

// Middlewares de Seguridad (CU-005)
const { requireAuth, requireRole } = require('../Seguridad/SeguridadServices/SeguridadServices');

// Todos los endpoints de Clientes son exclusivos del administrador
router.use(requireAuth, requireRole('administrador'));

// CU-008 — Listar clientes (con búsqueda opcional ?busqueda=texto)
router.get('/', adapters.listar);

// CU-008 — Consultar un cliente por ID
router.get('/:id', adapters.obtenerUno);

// CU-006 — Alta manual de cliente
router.post('/', adapters.alta);

// CU-007 — Modificar datos del cliente
router.put('/:id', adapters.modificar);

// CU-009 — Dar de baja (lógica)
router.delete('/:id', adapters.baja);

// Extensión de CU-009 — Reactivar cliente
router.put('/:id/reactivar', adapters.reactivar);

// CU-010 — Historial de pedidos del cliente
router.get('/:id/historial', adapters.historial);

module.exports = router;
