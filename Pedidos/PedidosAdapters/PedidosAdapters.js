'use strict';

// =============================================================================
// Pedidos/PedidosAdapters/PedidosAdapters.js
// Controladores HTTP del módulo Pedidos (CU-011 a CU-016).
// Validan shape del body/params, llaman al Service, arman la respuesta HTTP.
// NO acceden directamente a la base de datos.
// =============================================================================

const {
  listarProductos,
  listarProductosAdmin,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  guardarCarritoUsuario,
  obtenerCarritoUsuario,
  generarPedido,
  obtenerPedidosPorUsuario,
  obtenerPedidoPorId,
  listarPedidosAdmin,
  actualizarEstadoPedido,
  TRANSICIONES_VALIDAS,
  agregarImagenProducto,
} = require('../PedidosServices/PedidosServices');

// ─────────────────────────────────────────────────────────────────────────────
// CU-011 — GET /api/v1/pedidos/productos — Catálogo público
// Query param: ?busqueda=texto
// ─────────────────────────────────────────────────────────────────────────────
async function catalogo(req, res, next) {
  try {
    const busqueda = req.query.busqueda || '';
    const productos = await listarProductos(busqueda);
    return res.status(200).json({ ok: true, productos });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-011 (admin) — GET /api/v1/pedidos/admin/productos — Catálogo con inactivos
// ─────────────────────────────────────────────────────────────────────────────
async function catalogoAdmin(req, res, next) {
  try {
    const busqueda = req.query.busqueda || '';
    const productos = await listarProductosAdmin(busqueda);
    return res.status(200).json({ ok: true, productos });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-011 — GET /api/v1/pedidos/productos/:id — Detalle de producto
// ─────────────────────────────────────────────────────────────────────────────
async function detalleProducto(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ ok: false, mensaje: 'ID inválido' });
    const producto = await obtenerProductoPorId(id);
    return res.status(200).json({ ok: true, producto });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-011 (admin) — POST /api/v1/pedidos/admin/productos — Crear producto
// ─────────────────────────────────────────────────────────────────────────────
async function crearProductoAdapter(req, res, next) {
  try {
    const { nombre, descripcion, categoria, tipo_tela, precio } = req.body;
    const producto = await crearProducto({ nombre, descripcion, categoria, tipo_tela, precio });
    return res.status(201).json({ ok: true, mensaje: 'Producto creado', producto });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/pedidos/admin/productos/:id/imagenes — Subir imagen
// ─────────────────────────────────────────────────────────────────────────────
async function subirImagenProducto(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ ok: false, mensaje: 'ID de producto inválido' });
    if (!req.file) return res.status(400).json({ ok: false, mensaje: 'No se envió ninguna imagen' });

    // La URL de la imagen que guardaremos en la BD para servirla estáticamente
    const url = `/uploads/${req.file.filename}`;
    const imgGuardada = await agregarImagenProducto(id, url);

    return res.status(201).json({
      ok: true,
      mensaje: 'Imagen subida correctamente',
      imagen: imgGuardada
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-011 (admin) — PUT /api/v1/pedidos/admin/productos/:id — Actualizar producto
// ─────────────────────────────────────────────────────────────────────────────
async function actualizarProductoAdapter(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ ok: false, mensaje: 'ID inválido' });
    const { nombre, descripcion, categoria, tipo_tela, precio, activo } = req.body;
    const producto = await actualizarProducto(id, { nombre, descripcion, categoria, tipo_tela, precio, activo });
    return res.status(200).json({ ok: true, mensaje: 'Producto actualizado', producto });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-012 — GET /api/v1/pedidos/carrito — Obtener carrito del usuario (pullFromServer)
// Requiere autenticación. El frontend llama esto al loguearse para recuperar
// el carrito de la última sesión — NO para sobreescribir el localStorage.
// ─────────────────────────────────────────────────────────────────────────────
async function obtenerCarrito(req, res, next) {
  try {
    const items = await obtenerCarritoUsuario(req.usuario.id);
    return res.status(200).json({ ok: true, items });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-012 — POST /api/v1/pedidos/carrito — Guardar carrito del usuario en el servidor
// Body: { items: [{ producto_id, nombre_producto, imagen_url, color, talle, precio_unitario, cantidad }] }
// ─────────────────────────────────────────────────────────────────────────────
async function guardarCarrito(req, res, next) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ ok: false, mensaje: 'items debe ser un array' });
    }
    await guardarCarritoUsuario(req.usuario.id, items);
    return res.status(200).json({ ok: true, mensaje: 'Carrito guardado' });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-013 — POST /api/v1/pedidos — Generar pedido
// Body: { datosCliente: {...}, items: [...] }
// ─────────────────────────────────────────────────────────────────────────────
async function generarPedidoAdapter(req, res, next) {
  try {
    const { datosCliente, items } = req.body;
    if (!datosCliente || !items) {
      return res.status(400).json({ ok: false, mensaje: 'datosCliente e items son obligatorios' });
    }
    const resultado = await generarPedido({
      usuarioId: req.usuario.id,
      datosCliente,
      items,
    });
    return res.status(201).json({
      ok: true,
      mensaje: 'Pedido generado correctamente',
      pedidoId: resultado.pedidoId,
      total: resultado.total,
    });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-014 — GET /api/v1/pedidos/mis-pedidos — Pedidos del usuario autenticado
// ─────────────────────────────────────────────────────────────────────────────
async function misPedidos(req, res, next) {
  try {
    const pedidos = await obtenerPedidosPorUsuario(req.usuario.id);
    return res.status(200).json({ ok: true, pedidos });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-014 — GET /api/v1/pedidos/:id — Detalle de un pedido (del usuario)
// ─────────────────────────────────────────────────────────────────────────────
async function detallePedido(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ ok: false, mensaje: 'ID inválido' });
    // Pasamos el usuarioId para que el Service valide que el pedido le pertenece
    const pedido = await obtenerPedidoPorId(id, req.usuario.id);
    return res.status(200).json({ ok: true, pedido });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-015 — GET /api/v1/pedidos/admin/listado — Listado admin con filtros
// Query params: ?filtro=semana|mes (omitir para "Todos") &busqueda=texto
// ─────────────────────────────────────────────────────────────────────────────
async function listadoAdmin(req, res, next) {
  try {
    const filtroFecha = req.query.filtro || null;    // 'semana' | 'mes' | null
    const busqueda    = req.query.busqueda || '';
    const pedidos = await listarPedidosAdmin({ filtroFecha, busqueda });
    return res.status(200).json({ ok: true, pedidos });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-016 — PUT /api/v1/pedidos/admin/:id/estado — Cambiar estado del pedido
// Body: { estado: 'confirmado' | 'en_preparacion' | 'enviado' | 'entregado' | 'cancelado' }
// ─────────────────────────────────────────────────────────────────────────────
async function cambiarEstado(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ ok: false, mensaje: 'ID inválido' });
    const { estado } = req.body;
    if (!estado) return res.status(400).json({ ok: false, mensaje: 'El campo estado es obligatorio' });
    const resultado = await actualizarEstadoPedido(id, estado);
    return res.status(200).json({
      ok: true,
      mensaje: `Estado actualizado a "${estado}"`,
      pedido: resultado,
    });
  } catch (err) { next(err); }
}

module.exports = {
  catalogo,
  catalogoAdmin,
  detalleProducto,
  crearProductoAdapter,
  subirImagenProducto,
  actualizarProductoAdapter,
  obtenerCarrito,
  guardarCarrito,
  generarPedidoAdapter,
  misPedidos,
  detallePedido,
  listadoAdmin,
  cambiarEstado,
};
