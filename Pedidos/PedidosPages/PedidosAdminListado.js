// =============================================================================
// Pedidos/PedidosPages/PedidosAdminListado.js
// JS de página — CU-015 (listar pedidos admin) + CU-016 (cambiar estado).
// Implementa los 3 tabs (Esta semana / Este mes / Todos) y búsqueda.
// Reemplaza el script inline de Stitch (micro-interacciones de demo).
// =============================================================================

(function () {
  'use strict';

  function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Diagrama de estados (validación del lado cliente) ─────────────────────
  const ESTADOS_DISPLAY = {
    pendiente:      { label: 'Pendiente',      badge: 'bg-surface-variant text-on-surface-variant border-outline-variant' },
    confirmado:     { label: 'Confirmado',     badge: 'bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed-dim' },
    en_preparacion: { label: 'En Preparación', badge: 'bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed-dim' },
    enviado:        { label: 'Enviado',        badge: 'bg-primary text-on-primary border-transparent' },
    entregado:      { label: 'Entregado',      badge: 'bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed-dim' },
    cancelado:      { label: 'Cancelado',      badge: 'bg-error-container text-on-error-container border-error' },
  };

  // ── Estado de la página ───────────────────────────────────────────────────
  let filtroActual  = null;  // null | 'semana' | 'mes'
  let busquedaActual = '';

  // ── Referencias al DOM del Stitch ─────────────────────────────────────────
  // Tabs: los 3 botones de pestaña (Esta semana / Este mes / Todos)
  const tabBtns    = document.querySelectorAll('button[class*="tab"], nav button, [role="tab"]');
  // Más robusto: buscar por texto
  const allButtons = document.querySelectorAll('button');
  const tabSemana  = [...allButtons].find(b => b.textContent.trim() === 'Esta semana');
  const tabMes     = [...allButtons].find(b => b.textContent.trim() === 'Este mes');
  const tabTodos   = [...allButtons].find(b => b.textContent.trim() === 'Todos los pedidos');

  const inputBusqueda = document.querySelector('input[type="text"]');
  // Lista de pedidos: el div con space-y-6
  const listaPedidos  = document.querySelector('.space-y-6');

  // ── Cargar KPIs del Dashboard (Cross-Module) ──────────────────────────────
  async function cargarKPIs() {
    try {
      const res = await fetch(`${window.API_URL}/api/v1/dashboard`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      
      let pendientes = 0;
      let enPreparacion = 0;
      let enviados = 0;

      data.pedidosPorEstado.forEach(p => {
        if (p.estado === 'pendiente') pendientes = p.cantidad;
        if (p.estado === 'en_preparacion') enPreparacion = p.cantidad;
        if (p.estado === 'enviado') enviados = p.cantidad;
      });

      const elPendientes = document.getElementById('kpiPedidosPendientes');
      const elPreparacion = document.getElementById('kpiPedidosEnPreparacion');
      const elEnviados = document.getElementById('kpiPedidosEnviados');
      const elFacturacion = document.getElementById('kpiPedidosFacturacion');

      if(elPendientes) elPendientes.textContent = pendientes;
      if(elPreparacion) elPreparacion.textContent = enPreparacion;
      if(elEnviados) elEnviados.textContent = enviados;
      
      if(elFacturacion) {
        elFacturacion.textContent = new Intl.NumberFormat('es-AR', {
          style: 'currency', currency: 'ARS', maximumFractionDigits: 0
        }).format(data.ventasMesActual);
      }
    } catch (e) {
      console.error('Error cargando KPIs:', e);
    }
  }

  // ── Renderizar pedidos ────────────────────────────────────────────────────
  function renderizarPedidos(pedidos) {
    if (!listaPedidos) return;

    if (pedidos.length === 0) {
      listaPedidos.innerHTML = `<p class="text-center py-16 text-on-surface-variant font-label-sm">Sin pedidos para mostrar</p>`;
      return;
    }

    listaPedidos.innerHTML = pedidos.map(p => {
      const fecha = new Date(p.creado_en).toLocaleDateString('es-AR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const est = ESTADOS_DISPLAY[p.estado] || ESTADOS_DISPLAY.pendiente;
      const items = Array.isArray(p.items) ? p.items : [];
      const esFinal = p.estado === 'entregado' || p.estado === 'cancelado';

      const opcionesEstado = Object.entries(ESTADOS_DISPLAY)
        .filter(([key]) => key !== p.estado)
        .map(([key, val]) => `<option value="${key}">${val.label}</option>`)
        .join('');

      return `
      <div class="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden order-card-shadow" data-pedido-id="${p.id}">
        <!-- Header de la card -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 border-b border-outline-variant gap-3">
          <div>
            <span class="font-label-sm text-label-sm font-bold text-primary">ORD-#${p.id}</span>
            <span class="text-xs text-on-surface-variant ml-3">${fecha}</span>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <span class="inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-label-sm font-bold border ${est.badge}">
              ${est.label.toUpperCase()}
            </span>
            <span class="font-headline-md text-headline-md font-bold text-primary">$${Number(p.total).toFixed(2)}</span>
          </div>
        </div>

        <!-- Cuerpo: info del cliente + items -->
        <div class="px-6 py-4 flex flex-col md:flex-row gap-6">
          <div class="flex-1">
            <p class="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Cliente</p>
            <p class="font-body-md font-semibold text-primary">${escHtml(p.nombre_cliente)}</p>
            ${p.usuario_login ? `<p class="text-xs text-on-surface-variant">@${escHtml(p.usuario_login)}</p>` : ''}
            ${p.whatsapp ? `<p class="text-xs text-on-surface-variant mt-1">📱 ${escHtml(p.whatsapp)}</p>` : ''}
            ${p.email    ? `<p class="text-xs text-on-surface-variant">✉ ${escHtml(p.email)}</p>` : ''}
          </div>
          <div class="flex-1">
            <p class="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Ítems (${items.length})</p>
            <div class="space-y-1">
              ${items.slice(0, 3).map(i => `
              <p class="text-sm text-primary truncate">
                ${escHtml(i.nombre_producto)} — × ${i.cantidad}
                ${i.color ? `<span class="text-on-surface-variant">(${escHtml(i.color)}${i.talle ? ' / ' + escHtml(i.talle) : ''})</span>` : ''}
              </p>`).join('')}
              ${items.length > 3 ? `<p class="text-xs text-on-surface-variant">+${items.length - 3} más...</p>` : ''}
            </div>
          </div>
        </div>

        <!-- Footer: selector de estado + botones -->
        <div class="px-6 py-4 border-t border-outline-variant flex flex-col sm:flex-row items-start sm:items-center gap-3">
          ${!esFinal ? `
          <select class="select-estado border border-outline-variant rounded px-3 py-2 font-label-sm text-label-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest"
            data-id="${p.id}">
            <option value="" disabled selected>Cambiar estado a...</option>
            ${opcionesEstado}
          </select>
          <button class="btn-cambiar-estado flex items-center gap-2 bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-wider px-4 py-2 rounded hover:opacity-90 transition-opacity"
            data-id="${p.id}">
            <span class="material-symbols-outlined text-[16px]">sync</span>Cambiar estado
          </button>` : `
          <span class="font-label-sm text-label-sm text-on-surface-variant italic">Estado final — sin más transiciones</span>`}
        </div>
      </div>`;
    }).join('');

    // ── Listeners: CU-016 cambiar estado ────────────────────────────────────
    listaPedidos.querySelectorAll('.btn-cambiar-estado').forEach(btn => {
      btn.addEventListener('click', () => cambiarEstado(parseInt(btn.dataset.id, 10)));
    });
  }

  // ── CU-016 — Cambiar estado ───────────────────────────────────────────────
  async function cambiarEstado(pedidoId) {
    const card   = listaPedidos.querySelector(`[data-pedido-id="${pedidoId}"]`);
    const select = card?.querySelector('.select-estado');
    const btn    = card?.querySelector('.btn-cambiar-estado');

    const nuevoEstado = select?.value;
    if (!nuevoEstado) {
      alert('Seleccioná un nuevo estado primero');
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Actualizando...'; }

    try {
      const resp = await fetch(`${window.API_URL}/api/v1/pedidos/admin/${pedidoId}/estado`, {
        method:      'PUT',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.mensaje || 'Error al actualizar estado');

      // Recargar la lista para reflejar el nuevo estado
      await cargarPedidos();
    } catch (err) {
      alert(`Error: ${err.message}`);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span class="material-symbols-outlined text-[16px]">sync</span>Cambiar estado`;
      }
    }
  }

  // ── CU-015 — Cargar pedidos con filtros ───────────────────────────────────
  async function cargarPedidos() {
    if (!listaPedidos) return;

    listaPedidos.innerHTML = `<p class="py-16 text-center text-on-surface-variant font-label-sm animate-pulse">Cargando pedidos...</p>`;

    try {
      const params = new URLSearchParams();
      if (filtroActual)  params.set('filtro',   filtroActual);
      if (busquedaActual) params.set('busqueda', busquedaActual);

      const resp = await fetch(
        `${window.API_URL}/api/v1/pedidos/admin/listado${params.toString() ? '?' + params : ''}`,
        { credentials: 'include' }
      );

      if (resp.status === 401 || resp.status === 403) {
        window.location.href = '/Seguridad/SeguridadPages/SeguridadLogin.html';
        return;
      }

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.mensaje || 'Error al cargar pedidos');
      renderizarPedidos(data.pedidos || []);
    } catch (err) {
      console.error('[CU-015]', err);
      if (listaPedidos) {
        listaPedidos.innerHTML = `<p class="text-center py-16 text-error font-label-sm">${err.message}</p>`;
      }
    }
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  function setTabActivo(btn) {
    [tabSemana, tabMes, tabTodos].filter(Boolean).forEach(t => {
      t.classList.remove('bg-primary', 'text-on-primary');
      t.classList.add('text-on-surface-variant');
    });
    if (btn) {
      btn.classList.add('bg-primary', 'text-on-primary');
      btn.classList.remove('text-on-surface-variant');
    }
  }

  tabSemana?.addEventListener('click', () => {
    filtroActual = 'semana';
    setTabActivo(tabSemana);
    cargarPedidos();
  });
  tabMes?.addEventListener('click', () => {
    filtroActual = 'mes';
    setTabActivo(tabMes);
    cargarPedidos();
  });
  tabTodos?.addEventListener('click', () => {
    filtroActual = null;
    setTabActivo(tabTodos);
    cargarPedidos();
  });

  // ── Búsqueda con debounce ─────────────────────────────────────────────────
  let debounceTimer = null;
  inputBusqueda?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      busquedaActual = inputBusqueda.value;
      cargarPedidos();
    }, 350);
  });

  // ── Sidebar hrefs ─────────────────────────────────────────────────────────
  document.querySelectorAll('aside a, nav a').forEach(a => {
    const texto = a.textContent.trim();
    if (texto === 'Resumen')   a.href = '/Dashboard/DashboardPages/DashboardAdmin.html';
    if (texto === 'Productos') a.href = '/Pedidos/PedidosPages/PedidosAdminProductos.html';
    if (texto === 'Clientes')  a.href = '/Clientes/ClientesPages/ClientesAdminListado.html';
    if (texto === 'Salir') {
      a.href = '#';
      a.addEventListener('click', async (e) => {
        e.preventDefault();
        await fetch(`${window.API_URL}/api/v1/seguridad/logout`, { credentials: 'include' });
        window.location.href = '/Seguridad/SeguridadPages/SeguridadLogin.html';
      });
    }
  });

  // ── Carga inicial (tab "Todos los pedidos" activo por defecto) ────────────
  setTabActivo(tabTodos);
  cargarKPIs();
  cargarPedidos();
})();
