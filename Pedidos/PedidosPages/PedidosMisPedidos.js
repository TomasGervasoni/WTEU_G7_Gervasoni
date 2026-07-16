// =============================================================================
// Pedidos/PedidosPages/PedidosMisPedidos.js
// JS de página — CU-014 Consultar estado de pedido.
// Muestra los pedidos del usuario autenticado, usando <details> nativo.
// =============================================================================

(function () {
  'use strict';

  const contenedor = document.querySelector('.max-w-3xl.mx-auto');

  function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Mapa de estado → clase CSS de badge (consistente con resto del sistema)
  function badgeEstado(estado) {
    const map = {
      pendiente:      'bg-surface-variant text-on-surface-variant border-outline-variant',
      confirmado:     'bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed-dim',
      en_preparacion: 'bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed-dim',
      enviado:        'bg-primary text-on-primary border-transparent',
      entregado:      'bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed-dim',
      cancelado:      'bg-error-container text-on-error-container border-error',
    };
    return map[estado] || map.pendiente;
  }

  function etiquetaEstado(estado) {
    return {
      pendiente:      'Pendiente',
      confirmado:     'Confirmado',
      en_preparacion: 'En preparación',
      enviado:        'Enviado',
      entregado:      'Entregado',
      cancelado:      'Cancelado',
    }[estado] || estado;
  }

  function renderizarPedidos(pedidos) {
    if (!contenedor) return;

    if (pedidos.length === 0) {
      contenedor.innerHTML = `
        <div class="text-center py-16">
          <span class="material-symbols-outlined text-[48px] text-on-surface-variant mb-4 block">receipt_long</span>
          <p class="font-body-md text-on-surface-variant">Aún no tenés pedidos.</p>
          <a href="/Pedidos/PedidosPages/PedidosCatalogo.html"
             class="mt-4 inline-block bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-wider px-6 py-3 rounded">
            Ver catálogo
          </a>
        </div>`;
      return;
    }

    contenedor.innerHTML = pedidos.map(p => {
      const fecha = new Date(p.creado_en).toLocaleDateString('es-AR', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
      const items = Array.isArray(p.items) ? p.items : [];
      const badge = badgeEstado(p.estado);

      return `
      <article class="bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden shadow-sm">
        <summary-replacement class="flex justify-between items-start p-6 gap-4 border-b border-outline-variant">
          <div>
            <span class="font-label-sm text-label-sm font-bold text-primary block">ORD-#${p.id}</span>
            <span class="text-xs text-on-surface-variant">${fecha}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-label-sm font-bold border ${badge}">
              ${etiquetaEstado(p.estado).toUpperCase()}
            </span>
            <span class="font-headline-md text-headline-md font-bold text-primary">$${Number(p.total).toFixed(2)}</span>
          </div>
        </summary-replacement>

        <details class="group">
          <summary class="flex items-center gap-2 px-6 py-3 cursor-pointer text-on-surface-variant font-label-sm text-label-sm uppercase hover:bg-surface-container transition-colors select-none">
            <span class="material-symbols-outlined text-[18px] transition-transform group-open:rotate-180">expand_more</span>
            Ver detalle (${items.length} ítem${items.length !== 1 ? 's' : ''})
          </summary>
          <div class="px-6 py-4 space-y-3 border-t border-outline-variant">
            ${items.map(i => `
            <div class="flex gap-4 items-center">
              ${i.imagen_url
                ? `<img src="${escHtml(i.imagen_url)}" class="w-14 h-14 object-cover rounded-lg bg-surface-container flex-shrink-0" alt="${escHtml(i.nombre_producto)}" loading="lazy">`
                : `<div class="w-14 h-14 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0"><span class="material-symbols-outlined text-on-surface-variant">image</span></div>`}
              <div class="flex-1 min-w-0">
                <p class="font-body-md font-semibold text-primary truncate">${escHtml(i.nombre_producto)}</p>
                <p class="text-xs text-on-surface-variant">
                  ${i.color ? escHtml(i.color) : ''}${i.color && i.talle ? ' · ' : ''}${i.talle ? escHtml(i.talle) : ''}
                </p>
                <p class="text-xs text-on-surface-variant mt-0.5">× ${i.cantidad} — $${Number(i.precio_unitario).toFixed(2)} c/u</p>
              </div>
              <span class="font-body-md font-bold text-primary flex-shrink-0">$${Number(i.subtotal).toFixed(2)}</span>
            </div>`).join('')}
          </div>
        </details>

        ${p.estado === 'pendiente' ? `
        <div class="px-6 py-4 border-t border-outline-variant flex gap-3 flex-wrap">
          <button class="btn-pagar-mp flex items-center gap-2 bg-secondary text-on-secondary font-label-sm text-label-sm uppercase tracking-wider px-4 py-2 rounded hover:opacity-90 transition-opacity"
            data-pedido-id="${p.id}">
            <span class="material-symbols-outlined text-[18px]">payment</span>
            Pagar con Mercado Pago
          </button>
        </div>` : ''}

        ${(p.estado !== 'entregado' && p.estado !== 'cancelado') ? `
        <div class="px-6 py-4 border-t border-outline-variant flex justify-end">
          <a href="../../Cancelacion/CancelacionPages/CancelacionSolicitud.html?id=${p.id}" class="flex items-center gap-2 border border-outline-variant text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider px-4 py-2 rounded hover:text-primary hover:border-primary transition-colors">
            <span class="material-symbols-outlined text-[18px]">cancel</span>
            Solicitar cancelación
          </a>
        </div>` : ''}
      </article>`;
    }).join('');
  }

  async function cargarMisPedidos() {
    if (!contenedor) return;

    contenedor.innerHTML = `<div class="py-16 text-center">
      <span class="font-label-sm text-on-surface-variant animate-pulse">Cargando tus pedidos...</span>
    </div>`;

    try {
      const resp = await fetch(`${window.API_URL}/api/v1/pedidos/mis-pedidos`, {
        credentials: 'include',
      });

      if (resp.status === 401) {
        window.location.href = '/Seguridad/SeguridadPages/SeguridadLogin.html';
        return;
      }

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.mensaje || 'Error al cargar pedidos');
      renderizarPedidos(data.pedidos || []);
    } catch (err) {
      console.error('[CU-014]', err);
      if (contenedor) {
        contenedor.innerHTML = `<p class="text-center py-16 text-error font-label-sm">${err.message}</p>`;
      }
    }
  }


  // ── Actualizar navbar hrefs ───────────────────────────────────────────────
  document.querySelectorAll('nav a, header a').forEach(a => {
    const icon = a.querySelector('.material-symbols-outlined');
    if (icon?.textContent.trim() === 'shopping_bag') a.href = '/Pedidos/PedidosPages/PedidosCarrito.html';
    if (icon?.textContent.trim() === 'person') a.href = '/Seguridad/SeguridadPages/SeguridadLogin.html';
  });

  // ── CU-021: Pagar con MercadoPago (delegación de eventos) ────────────────
  contenedor?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-pagar-mp');
    if (!btn) return;

    const pedidoId = btn.dataset.pedidoId;
    const textoOriginal = btn.textContent.trim();
    btn.disabled = true;
    btn.textContent = 'Conectando...';

    try {
      const resp = await fetch(`${window.API_URL}/api/v1/pagos/mp/preferencia`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ pedido_id: parseInt(pedidoId, 10) }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.mensaje || 'Error al crear preferencia');

      // Redirigir al checkout de MercadoPago (el backend decide prod o sandbox)
      const url = data.checkout_url || data.init_point;
      window.location.href = url;
    } catch (err) {
      alert(`Error MercadoPago: ${err.message}`);
      btn.disabled = false;
      btn.textContent = textoOriginal;
    }
  });

  cargarMisPedidos();
})();
