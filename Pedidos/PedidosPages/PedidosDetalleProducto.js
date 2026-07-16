// =============================================================================
// Pedidos/PedidosPages/PedidosDetalleProducto.js
// JS de página — CU-011 (detalle) + CU-012 (agregar al carrito con talle/color).
// Lee el ID del producto del query string: ?id=123
// =============================================================================

(function () {
  'use strict';

  const CARRITO_KEY = 'wteu_carrito';

  function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getCarrito() {
    try { return JSON.parse(localStorage.getItem(CARRITO_KEY)) || []; }
    catch { return []; }
  }

  function saveCarrito(items) {
    localStorage.setItem(CARRITO_KEY, JSON.stringify(items));
    actualizarBadge();
  }

  function actualizarBadge() {
    const total = getCarrito().reduce((s, i) => s + i.cantidad, 0);
    document.querySelectorAll('.absolute.rounded-full').forEach(el => {
      if (el.textContent.match(/^\d+$/)) el.textContent = String(total);
    });
  }

  // ── Leer query string ─────────────────────────────────────────────────────
  const params     = new URLSearchParams(window.location.search);
  const productoId = parseInt(params.get('id'), 10);

  if (!productoId) {
    window.location.href = '/Pedidos/PedidosPages/PedidosCatalogo.html';
    return;
  }

  // ── Referencias al DOM del Stitch ─────────────────────────────────────────
  // Stitch no tiene IDs; identificamos por rol/posición
  const imgPrincipal   = document.querySelector('img.w-full.flex-grow') ||
                          document.querySelector('main img');
  const contenedorNombre = document.querySelector('h1') || document.querySelector('[class*="headline-lg"]');
  const contenedorPrecio = document.querySelector('[class*="headline-md"]');
  const colorContainer   = document.getElementById('colorContainer');
  const talleContainer   = document.getElementById('talleContainer');
  const colorSelTexto    = document.getElementById('colorSeleccionadoTexto');
  const btnAgregar       = document.getElementById('btnAgregarCarrito') || document.querySelector('button[class*="bg-primary"]');
  const thumbnailsWrap   = document.querySelector('.flex.md\\:flex-col.gap-base');

  // Estado local de selección
  let producto     = null;
  let colorSel     = null;
  let talleSel     = null;
  let imagenActual = null;

  // ── Cargar producto ───────────────────────────────────────────────────────
  async function cargarProducto() {
    try {
      const resp = await fetch(`${window.API_URL}/api/v1/pedidos/productos/${productoId}`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.mensaje || 'Producto no encontrado');
      producto = data.producto;
      renderizarProducto(producto);
    } catch (err) {
      console.error('[CU-011 detalle]', err);
      document.querySelector('main')?.insertAdjacentHTML('afterbegin',
        `<p class="p-4 text-error font-label-sm">${err.message}</p>`);
    }
  }

  function renderizarProducto(p) {
    // Título y precio
    if (contenedorNombre) contenedorNombre.textContent = p.nombre;
    if (contenedorPrecio) contenedorPrecio.textContent = `$${Number(p.precio).toFixed(2)}`;
    document.title = `${p.nombre} — TOWN ESTILO URBANO`;

    // Imágenes
    const imagenes = Array.isArray(p.imagenes) ? p.imagenes : [];
    const imgPrincipalUrl = imagenes.find(i => i.es_principal)?.url ||
      imagenes[0]?.url || 'https://placehold.co/600x750/eceef0/45464c?text=Sin+imagen';
    imagenActual = imgPrincipalUrl;

    if (imgPrincipal) {
      imgPrincipal.src = imgPrincipalUrl;
      imgPrincipal.alt = p.nombre;
    }

    // Actualizar thumbnails (reemplazar los hardcodeados de Stitch)
    if (thumbnailsWrap && imagenes.length > 0) {
      thumbnailsWrap.innerHTML = imagenes.map((img, idx) => `
        <button class="thumb-btn flex-shrink-0 w-16 h-16 rounded border-2 ${idx === 0 ? 'border-primary' : 'border-outline-variant'} overflow-hidden transition-all"
          data-url="${escHtml(img.url)}">
          <img src="${escHtml(img.url)}" class="w-full h-full object-cover" alt="Vista ${idx + 1}" loading="lazy">
        </button>`).join('');

      thumbnailsWrap.querySelectorAll('.thumb-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (imgPrincipal) imgPrincipal.src = btn.dataset.url;
          imagenActual = btn.dataset.url;
          thumbnailsWrap.querySelectorAll('.thumb-btn').forEach(b =>
            b.classList.replace('border-primary', 'border-outline-variant'));
          btn.classList.replace('border-outline-variant', 'border-primary');
        });
      });
    }

    // Colores y talles dinámicos desde variantes
    const variantes = Array.isArray(p.variantes) ? p.variantes : [];
    const coloresUnicos = [...new Set(variantes.map(v => v.color).filter(Boolean))];
    const tallesUnicos  = [...new Set(variantes.map(v => v.talle).filter(Boolean))];

    if (variantes.length === 0) {
      if (colorContainer) colorContainer.innerHTML = '<span class="text-label-sm text-on-surface-variant">Único color</span>';
      if (talleContainer) talleContainer.innerHTML = '<span class="text-label-sm text-on-surface-variant">Talle único</span>';
    } else {
      // Reemplazar botones de color
      if (colorContainer) {
        colorContainer.innerHTML = coloresUnicos.map(c => `
          <button aria-label="${escHtml(c)}"
            class="color-btn w-10 h-10 rounded-full border border-outline-variant ring-2 ring-offset-2 ring-transparent
                   hover:border-primary transition-all shadow-sm font-label-sm"
            data-color="${escHtml(c)}"
            title="${escHtml(c)}"
            style="background: ${colorToCSS(c)}">
          </button>`).join('');

        colorContainer.querySelectorAll('.color-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            colorContainer.querySelectorAll('.color-btn').forEach(b => {
              b.classList.remove('ring-primary', 'border-primary');
              b.classList.add('border-outline-variant');
            });
            btn.classList.add('ring-primary', 'border-primary');
            btn.classList.remove('border-outline-variant');
            colorSel = btn.dataset.color;
            if (colorSelTexto) colorSelTexto.textContent = colorSel;
          });
        });
      }

      // Reemplazar botones de talle
      if (talleContainer) {
        talleContainer.innerHTML = tallesUnicos.map(t => {
          return `<button class="talle-btn w-14 h-12 rounded-sm border font-label-sm text-label-sm uppercase transition-colors shadow-sm
            border-outline-variant bg-surface text-primary hover:border-primary"
            data-talle="${escHtml(t)}">${escHtml(t)}</button>`;
        }).join('');

        talleContainer.querySelectorAll('.talle-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            talleContainer.querySelectorAll('.talle-btn').forEach(b => {
              b.classList.remove('bg-primary', 'text-on-primary', 'border-primary');
              b.classList.add('bg-surface', 'text-primary', 'border-outline-variant');
            });
            btn.classList.remove('bg-surface', 'text-primary', 'border-outline-variant');
            btn.classList.add('bg-primary', 'text-on-primary', 'border-primary');
            talleSel = btn.dataset.talle;
          });
        });
      }
    }

    // Botón "Agregar al carrito"
    if (btnAgregar) {
      btnAgregar.addEventListener('click', () => {
        if (!producto) return;

        // Si hay variantes de color y no seleccionaron, advertir
        if (coloresUnicos.length > 0 && !colorSel) {
          btnAgregar.textContent = '⚠ Seleccioná un color';
          setTimeout(() => {
            btnAgregar.innerHTML = `Agregar al carrito <span class="material-symbols-outlined text-[18px]">shopping_bag</span>`;
          }, 1500);
          return;
        }

        // Si hay variantes de talle y no seleccionaron, advertir
        if (tallesUnicos.length > 0 && !talleSel) {
          btnAgregar.textContent = '⚠ Seleccioná un talle';
          setTimeout(() => {
            btnAgregar.innerHTML = `Agregar al carrito <span class="material-symbols-outlined text-[18px]">shopping_bag</span>`;
          }, 1500);
          return;
        }

        const carrito = getCarrito();
        const idx = carrito.findIndex(
          i => i.producto_id === producto.id && i.color === colorSel && i.talle === talleSel
        );
        if (idx >= 0) {
          carrito[idx].cantidad += 1;
        } else {
          carrito.push({
            producto_id:     producto.id,
            nombre_producto: producto.nombre,
            imagen_url:      imagenActual,
            precio_unitario: producto.precio,
            color:           colorSel,
            talle:           talleSel,
            cantidad:        1,
          });
        }
        saveCarrito(carrito);

        btnAgregar.innerHTML = `<span class="material-symbols-outlined text-[20px]">check</span> ¡Agregado al carrito!`;
        setTimeout(() => {
          btnAgregar.innerHTML = `Agregar al carrito <span class="material-symbols-outlined text-[18px]">shopping_bag</span>`;
        }, 1500);
      });
    }
  }

  // Convierte nombre de color a CSS aproximado (heurística simple para el TP)
  function colorToCSS(nombre) {
    const map = {
      'negro': '#0f1420', 'black': '#0f1420', 'midnight black': '#0f1420',
      'blanco': '#ffffff', 'white': '#ffffff', 'chalk white': '#ffffff',
      'gris': '#888', 'grey': '#888', 'gray': '#888', 'concrete grey': '#888',
      'rojo': '#dc2626', 'red': '#dc2626',
      'azul': '#2563eb', 'blue': '#2563eb',
      'verde': '#16a34a', 'green': '#16a34a',
    };
    return map[nombre.toLowerCase()] || '#eceef0';
  }

  // ── Navbar hrefs ──────────────────────────────────────────────────────────
  document.querySelectorAll('nav a, header a').forEach(a => {
    const icon = a.querySelector('.material-symbols-outlined');
    if (icon?.textContent.trim() === 'shopping_bag') a.href = '/Pedidos/PedidosPages/PedidosCarrito.html';
    if (icon?.textContent.trim() === 'person') a.href = '/Seguridad/SeguridadPages/SeguridadLogin.html';
  });

  actualizarBadge();
  cargarProducto();
})();
