'use strict';

// =============================================================================
// Pedidos/PedidosContenedor.js — Router del módulo Pedidos
// CU-011 Catálogo, CU-012 Carrito, CU-013 Generar Pedido,
// CU-014 Consultar Estado, CU-015 Listar Pedidos (admin), CU-016 Actualizar Estado
// Montado en app.js como: app.use('/api/v1/pedidos', PedidosContenedor)
// =============================================================================

const express  = require('express');
const router   = express.Router();
const adapters = require('./PedidosAdapters/PedidosAdapters');

const { requireAuth, requireRole } = require('../Seguridad/SeguridadServices/SeguridadServices');

const multer = require('multer');
const path = require('path');

// Configuración de multer para guardar en la carpeta uploads en la raíz
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'prod-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ─────────────────────────────────────────────────────────────────────────────
// Rutas PÚBLICAS (sin autenticación)
// ─────────────────────────────────────────────────────────────────────────────

// CU-011 — Catálogo de productos (visitantes y clientes autenticados)
router.get('/productos', adapters.catalogo);

// CU-011 — Detalle de producto
router.get('/productos/:id', adapters.detalleProducto);

// ─────────────────────────────────────────────────────────────────────────────
// Rutas que REQUIEREN autenticación (cliente o admin)
// ─────────────────────────────────────────────────────────────────────────────

// CU-012 — Carrito del usuario (pullFromServer al loguearse)
router.get('/carrito', requireAuth, adapters.obtenerCarrito);

// CU-012 — Guardar carrito en servidor
router.post('/carrito', requireAuth, adapters.guardarCarrito);

// CU-013 — Generar pedido
router.post('/', requireAuth, adapters.generarPedidoAdapter);

// CU-014 — Mis pedidos (cliente)
router.get('/mis-pedidos', requireAuth, adapters.misPedidos);

// CU-014 — Detalle de un pedido del cliente
router.get('/:id', requireAuth, adapters.detallePedido);

// ─────────────────────────────────────────────────────────────────────────────
// Rutas ADMIN — requieren requireAuth + requireRole('administrador')
// ─────────────────────────────────────────────────────────────────────────────

// CU-015 — Listado admin con filtros de fecha y búsqueda
router.get('/admin/listado', requireAuth, requireRole('administrador'), adapters.listadoAdmin);

// CU-011 (admin) — Catálogo admin (activos + inactivos)
router.get('/admin/productos', requireAuth, requireRole('administrador'), adapters.catalogoAdmin);

// CU-011 (admin) — Crear producto
router.post('/admin/productos', requireAuth, requireRole('administrador'), adapters.crearProductoAdapter);

// Subir imagen de producto
router.post('/admin/productos/:id/imagenes', requireAuth, requireRole('administrador'), upload.single('imagen'), adapters.subirImagenProducto);

// CU-011 (admin) — Actualizar producto
router.put('/admin/productos/:id', requireAuth, requireRole('administrador'), adapters.actualizarProductoAdapter);

// CU-016 — Cambiar estado de pedido (admin)
router.put('/admin/:id/estado', requireAuth, requireRole('administrador'), adapters.cambiarEstado);

module.exports = router;
