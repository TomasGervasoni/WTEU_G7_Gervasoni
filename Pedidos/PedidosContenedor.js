'use strict';

// =============================================================================
// Pedidos/PedidosContenedor.js — Router del módulo Pedidos
// CU-011 Catálogo, CU-012 Carrito, CU-013 Generar Pedido,
// CU-014 Consultar Estado, CU-015 Listar Pedidos (admin), CU-016 Actualizar Estado
// =============================================================================
// PLACEHOLDER — se completa al implementar con el prompt 2.3.
// =============================================================================

const express = require('express');
const router = express.Router();

// TODO (CU-011): GET  /productos          ← catálogo con filtros
// TODO (CU-011): GET  /productos/:id      ← detalle de producto
// TODO (CU-012): POST /carrito            ← sincronizar carrito al iniciar sesión
// TODO (CU-013): POST /                   ← generar pedido (transacción BEGIN/COMMIT)
// TODO (CU-014): GET  /mis-pedidos        ← pedidos del cliente autenticado
// TODO (CU-015): GET  /admin              ← listado admin (filtros de fecha/búsqueda)
// TODO (CU-016): PUT  /admin/:id/estado   ← cambiar estado (validar diagrama de estados)

module.exports = router;
