// =============================================================================
// Pedidos/PedidosPages/PedidosCatalogo.js
// JS de página — CU-011 Visualizar catálogo, CU-012 Agregar al carrito.
// Gestiona el localStorage del carrito (fuente de verdad del browser).
// =============================================================================

(function () {
  'use strict';

  // ── Helper de escape ──────────────────────────────────────────────────────
  function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Carrito en localStorage ───────────────────────────────────────────────
  const CARRITO_KEY = 'wteu_carrito';

  function getCarrito() {
    try { return JSON.parse(localStorage.getItem(CARRITO_KEY)) || []; }
    catch { return []; }
  }

  function saveCarrito(items) {
    localStorage.setItem(CARRITO_KEY, JSON.stringify(items));
    actualizarBadge();
  }

  function agregarAlCarrito(item) {
    const carrito = getCarrito();
    // Buscar si ya existe el mismo producto+color+talle
    const idx = carrito.findIndex(
      i => i.producto_id === item.producto_id && i.color === item.color && i.talle === item.talle
    );
    if (idx >= 0) {
      carrito[idx].cantidad += 1;
    } else {
      carrito.push({ ...item, cantidad: 1 });
    }
    saveCarrito(carrito);
  }

  function actualizarBadge() {
    const total = getCarrito().reduce((s, i) => s + i.cantidad, 0);
    const badge = document.querySelector('[data-badge]') ||
      document.querySelector('.shopping_bag')?.closest('a')?.querySelector('span.bg-');
    if (badge) badge.textContent = total > 0 ? total : '';
    // actualizar el span del ícono de carrito (estructura Stitch)
    const badgeSpans = document.querySelectorAll('.absolute.rounded-full');
    badgeSpans.forEach(el => {
      if (el.textContent.match(/^\d+$/)) el.textContent = total > 0 ? total : '0';
    });
  }

  // ── Referencias al DOM ────────────────────────────────────────────────────
  const grid       = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2');
  const selectSort = document.querySelector('select');

  // ── CU-011 — Cargar catálogo ──────────────────────────────────────────────
  async function cargarCatalogo(busqueda = '') {
    if (!grid) return;

    grid.innerHTML = `<div class="col-span-full flex justify-center py-16">
      <span class="text-on-surface-variant font-label-sm animate-pulse">Cargando catálogo...</span>
    </div>`;

    try {
      const url = `${window.API_URL}/api/v1/pedidos/productos${busqueda ? `?busqueda=${encodeURIComponent(busqueda)}` : ''}`;
      const resp = await fetch(url);
      const data = await resp.json();

      if (!resp.ok) throw new Error(data.mensaje || 'Error al cargar catálogo');

      const productos = data.productos || [];

      if (productos.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-16 text-on-surface-variant font-label-sm">Sin productos disponibles</div>`;
        return;
      }

      // Ordenar según el select de Stitch
      const orden = selectSort?.value || 'featured';
      const ordenados = [...productos].sort((a, b) => {
        if (orden === 'price-asc') return a.precio - b.precio;
        if (orden === 'price-desc') return b.precio - a.precio;
        return 0;
      });

      grid.innerHTML = ordenados.map(p => tarjetaProductoCatalogo(p, escHtml)).join('');

      // Eventos: clic en botón → carrito

      grid.querySelectorAll('.btn-agregar-carrito:not([disabled])').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          agregarAlCarrito({
            producto_id:     parseInt(btn.dataset.id, 10),
            nombre_producto: btn.dataset.nombre,
            imagen_url:      btn.dataset.imagen,
            precio_unitario: parseFloat(btn.dataset.precio),
            color:           null,
            talle:           null,
          });
          // Feedback visual breve
          btn.textContent = '✓ Agregado';
          btn.disabled = true;
          setTimeout(() => {
            btn.innerHTML = `<span class="material-symbols-outlined text-[18px]">add_shopping_cart</span> Agregar`;
            btn.disabled = false;
          }, 1200);
        });
      });

    } catch (err) {
      console.error('[CU-011]', err);
      grid.innerHTML = `<div class="col-span-full text-center py-16 text-error font-label-sm">${err.message}</div>`;
    }
  }

  // Ordenar sin recargar la API al cambiar el select
  selectSort?.addEventListener('change', () => cargarCatalogo());

  // ── Actualizar links de navbar ─────────────────────────────────────────────
  const carritoLink = document.querySelector('a[href="#"]');
  document.querySelectorAll('nav a, header a').forEach(a => {
    const icon = a.querySelector('.material-symbols-outlined');
    if (icon?.textContent.trim() === 'shopping_bag') {
      a.href = '/Pedidos/PedidosPages/PedidosCarrito.html';
    }
    if (icon?.textContent.trim() === 'person') {
      a.href = '/Seguridad/SeguridadPages/SeguridadLogin.html';
    }
  });

  // ── pullFromServer al cargar (si el usuario está autenticado) ─────────────
  // Nota: pullFromServer significa traer el carrito guardado en el servidor
  // y UNIRLO (merge) con el local — no sobreescribirlo.
  // El carrito local tiene prioridad sobre el del servidor.
  async function pullFromServer() {
    try {
      const resp = await fetch(`${window.API_URL}/api/v1/pedidos/carrito`, {
        credentials: 'include',
      });
      if (!resp.ok) return; // 401 = no autenticado, ignorar silenciosamente
      const data = await resp.json();
      const serverItems = data.items || [];
      if (serverItems.length === 0) return;

      const carritoLocal = getCarrito();
      // Solo agregar items del servidor que no estén en local
      serverItems.forEach(serverItem => {
        const existe = carritoLocal.find(
          i => i.producto_id === serverItem.producto_id &&
               i.color === serverItem.color && i.talle === serverItem.talle
        );
        if (!existe) {
          carritoLocal.push({
            producto_id:     serverItem.producto_id,
            nombre_producto: serverItem.nombre_producto,
            imagen_url:      serverItem.imagen_url,
            precio_unitario: serverItem.precio_unitario,
            color:           serverItem.color,
            talle:           serverItem.talle,
            cantidad:        serverItem.cantidad,
          });
        }
      });
      saveCarrito(carritoLocal);
    } catch { /* silencio — sin conexión o no autenticado */ }
  }

  // ── Carga inicial ─────────────────────────────────────────────────────────
  actualizarBadge();
  pullFromServer();
  cargarCatalogo();
})();
