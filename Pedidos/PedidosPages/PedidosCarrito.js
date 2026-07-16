// =============================================================================
// Pedidos/PedidosPages/PedidosCarrito.js
// JS de página — CU-012 (gestión del carrito) + navegación al checkout.
// Toda la lógica del carrito vive en localStorage.
// =============================================================================

(function () {
  'use strict';

  const CARRITO_KEY = 'wteu_carrito';

  function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Helpers de carrito ────────────────────────────────────────────────────
  function getCarrito() {
    try { return JSON.parse(localStorage.getItem(CARRITO_KEY)) || []; }
    catch { return []; }
  }

  function saveCarrito(items) {
    localStorage.setItem(CARRITO_KEY, JSON.stringify(items));
    renderizarCarrito();
  }

  // ── Referencias al DOM ────────────────────────────────────────────────────
  // La lista de items está en el primer div.w-full.lg\:w-2\/3
  const listaItems  = document.querySelector('.w-full.lg\\:w-2\\/3');
  const panelResumen = document.querySelector('.lg\\:w-1\\/3') ||
                        document.querySelector('[class*="sticky top-24"]');
  const btnCheckout  = document.querySelector('button.bg-\\[\\#0F1420\\]') ||
                        document.querySelector('button[class*="bg-primary"]');

  // ── Renderizar carrito ────────────────────────────────────────────────────
  function renderizarCarrito() {
    const carrito = getCarrito();

    if (!listaItems) return;

    if (carrito.length === 0) {
      listaItems.innerHTML = `
        <div class="text-center py-16">
          <span class="material-symbols-outlined text-[64px] text-on-surface-variant mb-4 block">shopping_cart</span>
          <h2 class="font-headline-md text-headline-md text-primary mb-2">Tu carrito está vacío</h2>
          <p class="text-on-surface-variant font-body-md mb-6">Explorá el catálogo y agregá productos.</p>
          <a href="/Pedidos/PedidosPages/PedidosCatalogo.html"
             class="inline-flex items-center gap-2 bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-wider px-6 py-3 rounded hover:opacity-90 transition-opacity">
            <span class="material-symbols-outlined text-[18px]">store</span>Ver catálogo
          </a>
        </div>`;
      actualizarResumen(carrito);
      return;
    }

    listaItems.innerHTML = carrito.map((item, idx) => {
      const imagen = item.imagen_url ||
        'https://placehold.co/120x140/eceef0/45464c?text=Producto';
      return `
      <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex gap-4" data-idx="${idx}">
        <a href="/Pedidos/PedidosPages/PedidosDetalleProducto.html?id=${item.producto_id}">
          <img src="${escHtml(imagen)}" class="w-24 h-28 object-cover rounded-lg flex-shrink-0 bg-surface-container" alt="${escHtml(item.nombre_producto)}" loading="lazy">
        </a>
        <div class="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 class="font-body-md font-semibold text-primary">${escHtml(item.nombre_producto)}</h3>
            <p class="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
              ${item.color ? escHtml(item.color) : ''}${item.color && item.talle ? ' · ' : ''}${item.talle ? escHtml(item.talle) : ''}
            </p>
            <p class="font-body-md text-primary font-semibold mt-2">$${Number(item.precio_unitario).toFixed(2)}</p>
          </div>
          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center gap-1 border border-outline-variant rounded overflow-hidden">
              <button class="btn-menos p-2 hover:bg-surface-container transition-colors" data-idx="${idx}" title="Reducir cantidad">
                <span class="material-symbols-outlined text-[18px]">remove</span>
              </button>
              <span class="px-4 font-label-sm text-label-sm font-bold min-w-[2rem] text-center">${item.cantidad}</span>
              <button class="btn-mas p-2 hover:bg-surface-container transition-colors" data-idx="${idx}" title="Aumentar cantidad">
                <span class="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
            <button class="btn-eliminar p-2 text-error hover:bg-error-container rounded transition-colors" data-idx="${idx}" title="Eliminar">
              <span class="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        </div>
        <div class="flex-shrink-0 text-right">
          <span class="font-headline-md text-headline-md font-bold text-primary">$${(Number(item.precio_unitario) * item.cantidad).toFixed(2)}</span>
        </div>
      </div>`;
    }).join('');

    // Listeners sobre el DOM dinámico
    listaItems.querySelectorAll('.btn-menos').forEach(btn => {
      btn.addEventListener('click', () => cambiarCantidad(parseInt(btn.dataset.idx, 10), -1));
    });
    listaItems.querySelectorAll('.btn-mas').forEach(btn => {
      btn.addEventListener('click', () => cambiarCantidad(parseInt(btn.dataset.idx, 10), 1));
    });
    listaItems.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', () => eliminarItem(parseInt(btn.dataset.idx, 10)));
    });

    actualizarResumen(carrito);
  }

  function cambiarCantidad(idx, delta) {
    const carrito = getCarrito();
    if (!carrito[idx]) return;
    carrito[idx].cantidad = Math.max(1, carrito[idx].cantidad + delta);
    saveCarrito(carrito);
  }

  function eliminarItem(idx) {
    const carrito = getCarrito();
    carrito.splice(idx, 1);
    saveCarrito(carrito);
  }

  function actualizarResumen(carrito) {
    if (!panelResumen) return;
    const subtotal = carrito.reduce((s, i) => s + Number(i.precio_unitario) * i.cantidad, 0);
    
    // Buscar los spans por su etiqueta de texto para asegurar que se reemplazan todos los $ fijos de Stitch
    const spans = Array.from(panelResumen.querySelectorAll('span'));
    const spanSubtotal = spans.find(s => s.textContent.trim().toLowerCase() === 'subtotal')?.nextElementSibling;
    const spanTotal    = spans.find(s => s.textContent.trim().toLowerCase() === 'total')?.nextElementSibling;

    if (spanSubtotal) spanSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    if (spanTotal)    spanTotal.textContent = `$${subtotal.toFixed(2)}`;

    // También actualizar el span de "X artículos" si existe
    const articulosEl = panelResumen.querySelector('p, span');
    if (articulosEl && carrito.length >= 0) {
      const total = carrito.reduce((s, i) => s + i.cantidad, 0);
      if (articulosEl.textContent.includes('artículo')) {
        articulosEl.textContent = `${total} artículo${total !== 1 ? 's' : ''} en tu carrito`;
      }
    }
  }

  // ── Botón Finalizar Compra ────────────────────────────────────────────────
  btnCheckout?.addEventListener('click', () => {
    const carrito = getCarrito();
    if (carrito.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }
    window.location.href = '/Pedidos/PedidosPages/PedidosCheckout.html';
  });

  // ── Navbar hrefs ──────────────────────────────────────────────────────────
  document.querySelectorAll('nav a, header a').forEach(a => {
    const icon = a.querySelector('.material-symbols-outlined');
    if (icon?.textContent.trim() === 'person') a.href = '/Seguridad/SeguridadPages/SeguridadLogin.html';
  });

  // ── Carga inicial ─────────────────────────────────────────────────────────
  renderizarCarrito();
})();
