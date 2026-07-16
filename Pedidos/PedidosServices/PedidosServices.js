'use strict';

// =============================================================================
// Pedidos/PedidosServices/PedidosServices.js
// Lógica de negocio del módulo Pedidos (CU-011 a CU-016).
// No conoce Express ni req/res. Accede a PostgreSQL vía pool.
// =============================================================================

const pool = require('../../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// Diagrama de estados (AGENTS.md §6, regla 8)
// pendiente → confirmado → en_preparacion → enviado → entregado
// cualquier estado no-final → cancelado
// entregado y cancelado son FINALES (no admiten nuevas transiciones)
// ─────────────────────────────────────────────────────────────────────────────
const TRANSICIONES_VALIDAS = {
  pendiente:      ['confirmado', 'cancelado'],
  confirmado:     ['en_preparacion', 'cancelado'],
  en_preparacion: ['enviado', 'cancelado'],
  enviado:        ['entregado', 'cancelado'],
  entregado:      [],   // estado final
  cancelado:      [],   // estado final
};

// ─────────────────────────────────────────────────────────────────────────────
// CU-011 — Visualizar catálogo de productos
// Retorna productos activos con sus variantes e imagen principal.
// Acepta filtro de texto opcional (búsqueda por nombre).
// ─────────────────────────────────────────────────────────────────────────────
async function listarProductos(busqueda = '') {
  const termino = busqueda.trim() ? `%${busqueda.trim()}%` : null;

  const res = await pool.query(
    `SELECT
       p.id,
       p.nombre,
       p.descripcion,
       p.categoria,
       p.tipo_tela,
       p.precio,
       p.activo,
       -- Imagen principal
       (SELECT url FROM producto_imagenes
        WHERE producto_id = p.id AND es_principal = true
        LIMIT 1)                                          AS imagen_principal,
       -- Variantes disponibles como JSON agregado
       COALESCE(
         json_agg(
           json_build_object(
             'id',     pv.id,
             'color',  pv.color,
             'talle',  pv.talle,
             'stock',  pv.stock
           ) ORDER BY pv.color, pv.talle
         ) FILTER (WHERE pv.id IS NOT NULL),
         '[]'
       )                                                  AS variantes
     FROM productos p
     LEFT JOIN producto_variantes pv ON pv.producto_id = p.id
     WHERE p.activo = true
       AND ($1::text IS NULL OR p.nombre ILIKE $1)
     GROUP BY p.id
     ORDER BY p.creado_en DESC`,
    [termino]
  );
  return res.rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-011 (admin) — Listar TODOS los productos (activos e inactivos)
// Usado en PedidosAdminProductos.html para gestión de productos.
// ─────────────────────────────────────────────────────────────────────────────
async function listarProductosAdmin(busqueda = '') {
  const termino = busqueda.trim() ? `%${busqueda.trim()}%` : null;

  const res = await pool.query(
    `SELECT
       p.id, p.nombre, p.descripcion, p.categoria, p.tipo_tela, p.precio, p.activo,
       (SELECT url FROM producto_imagenes
        WHERE producto_id = p.id AND es_principal = true LIMIT 1) AS imagen_principal,
       (SELECT COUNT(*) FROM producto_imagenes WHERE producto_id = p.id)::int AS total_imagenes
     FROM productos p
     WHERE ($1::text IS NULL OR p.nombre ILIKE $1)
     ORDER BY p.creado_en DESC`,
    [termino]
  );
  return res.rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-011 — Obtener un producto por ID (para la página de detalle)
// ─────────────────────────────────────────────────────────────────────────────
async function obtenerProductoPorId(id) {
  const res = await pool.query(
    `SELECT
       p.id, p.nombre, p.descripcion, p.categoria, p.tipo_tela, p.precio, p.activo,
       COALESCE(
         json_agg(
           json_build_object('id', pv.id, 'color', pv.color, 'talle', pv.talle, 'stock', pv.stock)
           ORDER BY pv.color, pv.talle
         ) FILTER (WHERE pv.id IS NOT NULL), '[]'
       ) AS variantes,
       COALESCE(
         json_agg(
           DISTINCT jsonb_build_object('url', pi2.url, 'es_principal', pi2.es_principal, 'orden', pi2.orden)
         ) FILTER (WHERE pi2.id IS NOT NULL), '[]'
       ) AS imagenes
     FROM productos p
     LEFT JOIN producto_variantes pv ON pv.producto_id = p.id
     LEFT JOIN producto_imagenes  pi2 ON pi2.producto_id = p.id
     WHERE p.id = $1
     GROUP BY p.id`,
    [id]
  );
  if (res.rows.length === 0) {
    const err = new Error('Producto no encontrado');
    err.status = 404;
    throw err;
  }
  return res.rows[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-011 (admin) — Crear producto
// ─────────────────────────────────────────────────────────────────────────────
async function crearProducto({ nombre, descripcion, categoria, tipo_tela, precio }) {
  if (!nombre || precio == null) {
    const err = new Error('nombre y precio son obligatorios');
    err.status = 400;
    throw err;
  }
  const res = await pool.query(
    `INSERT INTO productos (nombre, descripcion, categoria, tipo_tela, precio)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [nombre.trim(), descripcion || null, categoria || null, tipo_tela || null, precio]
  );
  return res.rows[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-011 (admin) — Actualizar producto
// ─────────────────────────────────────────────────────────────────────────────
async function actualizarProducto(id, { nombre, descripcion, categoria, tipo_tela, precio, activo }) {
  const res = await pool.query(
    `UPDATE productos
     SET nombre        = COALESCE($1, nombre),
         descripcion   = COALESCE($2, descripcion),
         categoria     = COALESCE($3, categoria),
         tipo_tela     = COALESCE($4, tipo_tela),
         precio        = COALESCE($5, precio),
         activo        = COALESCE($6, activo),
         actualizado_en = NOW()
     WHERE id = $7
     RETURNING *`,
    [nombre || null, descripcion || null, categoria || null, tipo_tela || null,
     precio ?? null, activo ?? null, id]
  );
  if (res.rows.length === 0) {
    const err = new Error('Producto no encontrado');
    err.status = 404;
    throw err;
  }
  return res.rows[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-011 (admin) — Agregar imagen a un producto
// ─────────────────────────────────────────────────────────────────────────────
async function agregarImagenProducto(productoId, url) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      'INSERT INTO producto_imagenes (producto_id, url) VALUES ($1, $2) RETURNING id, url',
      [productoId, url]
    );
    return res.rows[0];
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-012 — Guardar carrito temporal en el servidore
// El carrito del visitante vive en localStorage del browser.
// Al loguearse, el frontend hace pullFromServer: trae el carrito guardado
// en sesiones anteriores (si existe) y LO PISA con lo que ya tiene en local.
// NO se hace push del localStorage al servidor (ese es el bug a evitar).
//
// Nota: en esta versión el carrito del servidor actúa como "recuperación
// de sesión previa". El carrito activo se mantiene siempre en localStorage.
// ─────────────────────────────────────────────────────────────────────────────

// Guardar carrito del usuario (llamado al hacer checkout o al sincronizar)
async function guardarCarritoUsuario(usuarioId, items) {
  // Usamos la tabla pedidos con estado especial '__carrito__' como tabla de
  // carrito persistente. Alternativa limpia sin tabla extra.
  // Si existe un carrito previo lo reemplazamos.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Eliminar carrito previo si existe
    const prev = await client.query(
      `SELECT id FROM pedidos WHERE usuario_id = $1 AND estado = '__carrito__'`,
      [usuarioId]
    );
    if (prev.rows.length > 0) {
      await client.query('DELETE FROM pedidos WHERE id = $1', [prev.rows[0].id]);
    }

    if (!items || items.length === 0) {
      await client.query('COMMIT');
      return;
    }

    // Calcular total
    const total = items.reduce((s, i) => s + (Number(i.precio_unitario) * Number(i.cantidad)), 0);

    const pedidoRes = await client.query(
      `INSERT INTO pedidos (usuario_id, nombre_cliente, estado, total)
       VALUES ($1, '__carrito__', '__carrito__', $2)
       RETURNING id`,
      [usuarioId, total]
    );
    const pedidoId = pedidoRes.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO pedido_items
           (pedido_id, producto_id, nombre_producto, imagen_url, color, talle, precio_unitario, cantidad, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [pedidoId, item.producto_id || null, item.nombre_producto,
         item.imagen_url || null, item.color || null, item.talle || null,
         item.precio_unitario, item.cantidad,
         Number(item.precio_unitario) * Number(item.cantidad)]
      );
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Obtener carrito guardado del usuario (pullFromServer — CU-012)
async function obtenerCarritoUsuario(usuarioId) {
  const res = await pool.query(
    `SELECT pi.*
     FROM pedido_items pi
     JOIN pedidos p ON p.id = pi.pedido_id
     WHERE p.usuario_id = $1 AND p.estado = '__carrito__'`,
    [usuarioId]
  );
  return res.rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-013 — Generar pedido
// Precondición: el carrito no está vacío y el usuario está autenticado.
// Usa transacción real: BEGIN → crea pedido → inserta items desnormalizados
// → elimina carrito temporal → COMMIT.
// Solo limpia el carrito si todo salió bien (ROLLBACK en caso contrario).
// ─────────────────────────────────────────────────────────────────────────────
async function generarPedido({ usuarioId, datosCliente, items }) {
  if (!items || items.length === 0) {
    const err = new Error('El carrito está vacío');
    err.status = 400;
    throw err;
  }

  const {
    nombre_cliente, cuil, whatsapp, email, direccion, codigo_postal
  } = datosCliente;

  if (!nombre_cliente || !whatsapp || !email) {
    const err = new Error('nombre_cliente, whatsapp y email son obligatorios');
    err.status = 400;
    throw err;
  }

  const total = items.reduce(
    (s, i) => s + (Number(i.precio_unitario) * Number(i.cantidad)), 0
  );

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Crear pedido en estado 'pendiente'
    const pedidoRes = await client.query(
      `INSERT INTO pedidos
         (usuario_id, nombre_cliente, cuil, whatsapp, email, direccion, codigo_postal, estado, total)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pendiente',$8)
       RETURNING id`,
      [usuarioId, nombre_cliente, cuil || null, whatsapp,
       email, direccion || null, codigo_postal || null, total]
    );
    const pedidoId = pedidoRes.rows[0].id;

    // Insertar items desnormalizando datos del producto al momento de la compra
    // En este modelo de negocio (impresión DTF bajo demanda), no hay stock pre-fabricado.
    // Guardamos el color y talle que eligió el cliente como datos de personalización.
    for (const item of items) {
      // Verificar que el producto existe y está activo
      const prodRes = await client.query(
        'SELECT id, nombre, precio, activo FROM productos WHERE id = $1',
        [item.producto_id]
      );
      if (prodRes.rows.length === 0 || !prodRes.rows[0].activo) {
        throw Object.assign(new Error(`Producto "${item.nombre_producto || item.producto_id}" no disponible o inactivo`), { status: 400 });
      }

      const prod = prodRes.rows[0];
      const precioUnitario = Number(item.precio_unitario || prod.precio);
      const cantidad = Number(item.cantidad);

      await client.query(
        `INSERT INTO pedido_items
           (pedido_id, producto_id, nombre_producto, imagen_url, color, talle,
            precio_unitario, cantidad, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [pedidoId, prod.id, prod.nombre,
         item.imagen_url || null, item.color || null, item.talle || null,
         precioUnitario, cantidad, precioUnitario * cantidad]
      );
    }

    // Eliminar carrito temporal del servidor (solo si el COMMIT tiene éxito)
    await client.query(
      `DELETE FROM pedidos WHERE usuario_id = $1 AND estado = '__carrito__'`,
      [usuarioId]
    );

    await client.query('COMMIT');
    return { pedidoId, total };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-014 — Consultar estado de pedido (cliente ve sus propios pedidos)
// ─────────────────────────────────────────────────────────────────────────────
async function obtenerPedidosPorUsuario(usuarioId) {
  const res = await pool.query(
    `SELECT
       p.id, p.estado, p.total, p.creado_en, p.actualizado_en,
       p.nombre_cliente, p.whatsapp, p.email, p.direccion,
       COALESCE(
         json_agg(
           json_build_object(
             'id',               pi.id,
             'producto_id',      pi.producto_id,
             'nombre_producto',  pi.nombre_producto,
             'imagen_url',       pi.imagen_url,
             'color',            pi.color,
             'talle',            pi.talle,
             'cantidad',         pi.cantidad,
             'precio_unitario',  pi.precio_unitario,
             'subtotal',         pi.subtotal
           ) ORDER BY pi.id
         ) FILTER (WHERE pi.id IS NOT NULL), '[]'
       ) AS items
     FROM pedidos p
     LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
     WHERE p.usuario_id = $1
       AND p.estado != '__carrito__'
     GROUP BY p.id
     ORDER BY p.creado_en DESC`,
    [usuarioId]
  );
  return res.rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-014 — Consultar un pedido específico por ID (verificando que pertenece
// al usuario, para que un cliente no pueda ver pedidos de otros).
// ─────────────────────────────────────────────────────────────────────────────
async function obtenerPedidoPorId(pedidoId, usuarioId = null) {
  const res = await pool.query(
    `SELECT
       p.id, p.usuario_id, p.estado, p.total, p.creado_en,
       p.nombre_cliente, p.cuil, p.whatsapp, p.email, p.direccion, p.codigo_postal,
       COALESCE(
         json_agg(
           json_build_object(
             'id', pi.id, 'nombre_producto', pi.nombre_producto,
             'imagen_url', pi.imagen_url, 'color', pi.color,
             'talle', pi.talle, 'cantidad', pi.cantidad,
             'precio_unitario', pi.precio_unitario, 'subtotal', pi.subtotal
           ) ORDER BY pi.id
         ) FILTER (WHERE pi.id IS NOT NULL), '[]'
       ) AS items
     FROM pedidos p
     LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
     WHERE p.id = $1
       AND p.estado != '__carrito__'
       AND ($2::int IS NULL OR p.usuario_id = $2)
     GROUP BY p.id`,
    [pedidoId, usuarioId]
  );
  if (res.rows.length === 0) {
    const err = new Error('Pedido no encontrado');
    err.status = 404;
    throw err;
  }
  return res.rows[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-015 — Listar pedidos (admin) con filtros de pestaña y búsqueda
// filtroFecha: 'semana' | 'mes' | null (todos)
// busqueda: número de pedido (ID) o nombre de cliente
// ─────────────────────────────────────────────────────────────────────────────
async function listarPedidosAdmin({ filtroFecha = null, busqueda = '' } = {}) {
  let fechaFiltro = null;
  if (filtroFecha === 'semana') {
    fechaFiltro = "NOW() - INTERVAL '7 days'";
  } else if (filtroFecha === 'mes') {
    fechaFiltro = "NOW() - INTERVAL '30 days'";
  }

  const termino = busqueda.trim() ? `%${busqueda.trim()}%` : null;

  // Construimos la query dinámicamente para los filtros opcionales
  const condiciones = [`p.estado != '__carrito__'`];
  const finalParams = [];

  if (fechaFiltro) {
    condiciones.push(`p.creado_en >= ${fechaFiltro}`);
  }

  if (termino) {
    finalParams.push(termino);
    condiciones.push(`(
      p.nombre_cliente ILIKE $${finalParams.length}
      OR CAST(p.id AS TEXT) LIKE $${finalParams.length}
    )`);
  }

  const whereIndexed = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const res = await pool.query(
    `SELECT
       p.id, p.estado, p.total, p.creado_en,
       p.nombre_cliente, p.cuil, p.whatsapp, p.email, p.direccion,
       u.usuario AS usuario_login,
       COALESCE(
         json_agg(
           json_build_object(
             'nombre_producto', pi.nombre_producto,
             'color',           pi.color,
             'talle',           pi.talle,
             'cantidad',        pi.cantidad,
             'subtotal',        pi.subtotal
           ) ORDER BY pi.id
         ) FILTER (WHERE pi.id IS NOT NULL), '[]'
       ) AS items
     FROM pedidos p
     LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
     LEFT JOIN usuarios u ON u.id = p.usuario_id
     ${whereIndexed}
     GROUP BY p.id, u.usuario
     ORDER BY p.creado_en DESC`,
    finalParams
  );
  return res.rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-016 — Actualizar estado de pedido (admin)
// Valida el diagrama de estados antes de aplicar la transición.
// ─────────────────────────────────────────────────────────────────────────────
async function actualizarEstadoPedido(pedidoId, nuevoEstado) {
  const estadosValidos = Object.keys(TRANSICIONES_VALIDAS);
  if (!estadosValidos.includes(nuevoEstado)) {
    const err = new Error(`Estado inválido: ${nuevoEstado}`);
    err.status = 400;
    throw err;
  }

  const res = await pool.query(
    `SELECT estado FROM pedidos WHERE id = $1 AND estado != '__carrito__'`,
    [pedidoId]
  );
  if (res.rows.length === 0) {
    const err = new Error('Pedido no encontrado');
    err.status = 404;
    throw err;
  }

  const estadoActual = res.rows[0].estado;
  const transicionesPermitidas = TRANSICIONES_VALIDAS[estadoActual];

  if (!transicionesPermitidas.includes(nuevoEstado)) {
    const err = new Error(
      `Transición inválida: ${estadoActual} → ${nuevoEstado}. ` +
      `Desde "${estadoActual}" solo se puede ir a: [${transicionesPermitidas.join(', ') || 'ninguno (estado final)'}]`
    );
    err.status = 422;
    throw err;
  }

  const updated = await pool.query(
    `UPDATE pedidos
     SET estado = $1, actualizado_en = NOW()
     WHERE id = $2
     RETURNING id, estado, actualizado_en`,
    [nuevoEstado, pedidoId]
  );
  return updated.rows[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// CU-024 — Métricas para el Dashboard
// ─────────────────────────────────────────────────────────────────────────────
async function obtenerMetricasPedidos() {
  const resPedidos = await pool.query(`SELECT COUNT(*) AS total FROM pedidos WHERE estado != '__carrito__'`);
  const pedidosTotales = parseInt(resPedidos.rows[0].total, 10);

  const resVentas = await pool.query(`
    SELECT 
      SUM(CASE WHEN DATE_TRUNC('month', creado_en) = DATE_TRUNC('month', NOW()) THEN total ELSE 0 END) AS ventas_mes_actual,
      SUM(CASE WHEN DATE_TRUNC('month', creado_en) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') THEN total ELSE 0 END) AS ventas_mes_anterior
    FROM pedidos 
    WHERE estado != '__carrito__' AND estado != 'cancelado'
  `);
  
  const ventasMesActual = parseFloat(resVentas.rows[0].ventas_mes_actual || 0);
  const ventasMesAnterior = parseFloat(resVentas.rows[0].ventas_mes_anterior || 0);
  let crecimientoVentas = 0;
  if (ventasMesAnterior > 0) {
    crecimientoVentas = ((ventasMesActual - ventasMesAnterior) / ventasMesAnterior) * 100;
  }

  const resGraficoBarras = await pool.query(`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', creado_en), 'Mon') AS mes,
      SUM(total) AS total_ventas
    FROM pedidos
    WHERE estado != '__carrito__' AND estado != 'cancelado'
      AND creado_en >= DATE_TRUNC('month', NOW() - INTERVAL '5 months')
    GROUP BY DATE_TRUNC('month', creado_en)
    ORDER BY DATE_TRUNC('month', creado_en) ASC
  `);

  const resEstados = await pool.query(`
    SELECT estado, COUNT(*) as cantidad
    FROM pedidos
    WHERE estado != '__carrito__'
    GROUP BY estado
  `);
  
  return {
    pedidosTotales,
    ventasMesActual,
    crecimientoVentas,
    ventasPorMes: resGraficoBarras.rows,
    pedidosPorEstado: resEstados.rows
  };
}

module.exports = {
  // CU-011
  listarProductos,
  listarProductosAdmin,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  // CU-012
  guardarCarritoUsuario,
  obtenerCarritoUsuario,
  // CU-013
  generarPedido,
  // CU-014 (también usado por cross-module en ClientesServices)
  obtenerPedidosPorUsuario,
  obtenerPedidoPorId,
  // CU-015
  listarPedidosAdmin,
  // CU-016
  actualizarEstadoPedido,
  // CU-024 (Dashboard)
  obtenerMetricasPedidos,
  // Diagrama de estados exportado para uso del frontend
  TRANSICIONES_VALIDAS,
  agregarImagenProducto,
};
