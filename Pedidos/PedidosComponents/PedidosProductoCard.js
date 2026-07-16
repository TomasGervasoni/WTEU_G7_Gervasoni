// =============================================================================
// Pedidos/PedidosComponents/PedidosProductoCard.js
// Componente reutilizable: genera el HTML de una tarjeta de producto.
// Usado por PedidosCatalogo.js y PedidosAdminProductos.js.
// NO hace fetch ni accede al DOM directamente — solo genera HTML string.
// =============================================================================

/**
 * Genera el HTML de una tarjeta de producto para el catálogo público.
 * @param {Object} producto  - Fila devuelta por PedidosServices.listarProductos()
 * @param {Function} escHtml - Función de escape (pasada desde el caller)
 */
function tarjetaProductoCatalogo(producto, escHtml) {
  const imagen = producto.imagen_principal ||
    'https://placehold.co/400x500/eceef0/45464c?text=Sin+imagen';

  const variantes = Array.isArray(producto.variantes) ? producto.variantes : [];
  const hayStock  = variantes.some(v => v.stock > 0);

  return `
  <article class="group cursor-pointer flex flex-col" data-id="${producto.id}" data-nombre="${escHtml(producto.nombre)}">
    <div class="relative overflow-hidden rounded-lg aspect-[4/5] bg-surface-container mb-4">
      <img
        src="${escHtml(imagen)}"
        alt="${escHtml(producto.nombre)}"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      >
      ${!hayStock ? `<div class="absolute inset-0 bg-black/40 flex items-center justify-center">
        <span class="text-white font-label-sm text-label-sm uppercase tracking-widest">Sin stock</span>
      </div>` : ''}
      <button
        class="btn-agregar-carrito absolute bottom-4 left-4 right-4 bg-primary text-on-primary
               py-2 rounded font-label-sm text-label-sm uppercase tracking-wider
               opacity-0 group-hover:opacity-100 transition-opacity
               flex items-center justify-center gap-2
               ${!hayStock ? 'cursor-not-allowed bg-outline' : ''}"
        data-id="${producto.id}"
        data-nombre="${escHtml(producto.nombre)}"
        data-precio="${producto.precio}"
        data-imagen="${escHtml(imagen)}"
        ${!hayStock ? 'disabled' : ''}
        title="${hayStock ? 'Agregar al carrito' : 'Sin stock'}"
      >
        <span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
        ${hayStock ? 'Agregar' : 'Sin stock'}
      </button>
    </div>
    <div class="flex flex-col gap-1 px-1">
      <a href="/Pedidos/PedidosPages/PedidosDetalleProducto.html?id=${producto.id}"
         class="font-body-md font-semibold text-primary hover:underline line-clamp-1">
        ${escHtml(producto.nombre)}
      </a>
      ${producto.categoria
        ? `<span class="font-label-sm text-label-sm text-on-surface-variant uppercase">${escHtml(producto.categoria)}</span>`
        : ''}
      <span class="font-headline-md text-headline-md text-primary mt-1">$${Number(producto.precio).toFixed(2)}</span>
    </div>
  </article>`;
}

/**
 * Genera el HTML de una fila de producto para el listado admin.
 * @param {Object}   producto
 * @param {Function} escHtml
 */
function tarjetaProductoAdmin(producto, escHtml) {
  const imagen = producto.imagen_principal ||
    'https://placehold.co/120x120/eceef0/45464c?text=Sin+imagen';

  const activoBadge = producto.activo
    ? `<span class="inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-label-sm font-bold bg-secondary-fixed text-on-secondary-fixed border border-secondary-fixed-dim">ACTIVO</span>`
    : `<span class="inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-label-sm font-bold bg-surface-variant text-on-surface-variant border border-outline-variant">INACTIVO</span>`;

  return `
  <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex gap-4 items-start" data-id="${producto.id}">
    <img
      src="${escHtml(imagen)}"
      alt="${escHtml(producto.nombre)}"
      class="w-24 h-24 object-cover rounded-lg flex-shrink-0 bg-surface-container"
      loading="lazy"
    >
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div class="min-w-0">
          <h3 class="font-body-md font-semibold text-primary truncate">${escHtml(producto.nombre)}</h3>
          <p class="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
            ${producto.categoria ? escHtml(producto.categoria) : ''} ${producto.tipo_tela ? '· ' + escHtml(producto.tipo_tela) : ''}
          </p>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          ${activoBadge}
          <span class="font-headline-md text-headline-md text-primary font-bold">$${Number(producto.precio).toFixed(2)}</span>
        </div>
      </div>
      ${producto.descripcion
        ? `<p class="text-on-surface-variant text-sm mt-2 line-clamp-2">${escHtml(producto.descripcion)}</p>`
        : ''}
      <div class="flex gap-2 mt-3">
        <button class="btn-editar-producto flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded font-label-sm text-label-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
          data-id="${producto.id}" data-nombre="${escHtml(producto.nombre)}" data-precio="${producto.precio}"
          data-descripcion="${escHtml(producto.descripcion || '')}" data-categoria="${escHtml(producto.categoria || '')}"
          data-tela="${escHtml(producto.tipo_tela || '')}" data-activo="${producto.activo}">
          <span class="material-symbols-outlined text-[16px]">edit</span>Editar
        </button>
        <button class="btn-toggle-activo flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded font-label-sm text-label-sm
          ${producto.activo ? 'text-error hover:border-error hover:bg-error-container' : 'text-secondary hover:border-secondary'} transition-colors"
          data-id="${producto.id}" data-activo="${producto.activo}" title="${producto.activo ? 'Desactivar' : 'Activar'}">
          <span class="material-symbols-outlined text-[16px]">${producto.activo ? 'visibility_off' : 'visibility'}</span>
          ${producto.activo ? 'Desactivar' : 'Activar'}
        </button>
        <button class="btn-subir-imagen flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded font-label-sm text-label-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
          data-id="${producto.id}">
          <span class="material-symbols-outlined text-[16px]">upload</span>Subir imagen
        </button>
        <input type="file" class="input-file-imagen hidden" accept="image/*" data-id="${producto.id}">
      </div>
    </div>
  </div>`;
}

// Exporta como módulo CommonJS para que Node pueda verificar sintaxis,
// pero también está disponible como objeto global en el browser
// (el HTML lo carga antes que los JS de página).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { tarjetaProductoCatalogo, tarjetaProductoAdmin };
}
