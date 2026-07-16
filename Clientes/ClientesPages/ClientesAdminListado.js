// =============================================================================
// Clientes/ClientesPages/ClientesAdminListado.js
// JS de página para el panel de administración de clientes.
// Cubre: CU-006 (alta), CU-007 (editar), CU-008 (listar/buscar),
//        CU-009 (baja lógica), CU-010 (historial de pedidos — drawer).
// Usa window.API_URL definido en config/config.js.
// NO modifica el diseño visual del HTML de Stitch.
// =============================================================================

(function () {
  'use strict';

  // ── Estado local ──────────────────────────────────────────────────────────
  let todosLosClientes = [];      // caché del último fetch
  let clienteEnEdicion = null;    // cliente cargado en el modal de editar

  // ── Referencias al DOM del Stitch ─────────────────────────────────────────
  const tbody         = document.querySelector('table tbody');
  const inputBusqueda = document.querySelector('input[type="text"]');
  const btnNuevo      = document.querySelector('button.bg-\\[\\#0F1420\\]');
  const spanTotal     = document.querySelector('.p-4.border-t span');

  // Drawer (ya existe en el HTML)
  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawerPanel   = document.getElementById('drawerPanel');

  // ── Inyectar modal de editar + modal de alta (no estaban en el HTML) ───────
  const modalHTML = `
  <!-- Modal Editar Cliente — CU-007 -->
  <div id="modalEditar" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" style="display:none!important">
    <div class="bg-surface-container-lowest border border-outline-variant shadow-xl w-full max-w-md mx-4 rounded-lg overflow-hidden">
      <div class="flex justify-between items-center px-6 py-4 border-b border-outline-variant bg-surface-bright">
        <h2 class="font-headline-md text-headline-md text-primary">Editar cliente</h2>
        <button id="btnCerrarModal" class="p-2 hover:bg-surface-variant rounded-full text-on-surface transition-colors">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <form id="formEditar" class="p-6 space-y-4">
        <input type="hidden" id="editId">
        <div>
          <label class="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">Nombre</label>
          <input id="editNombre" type="text" class="w-full border border-outline-variant px-3 py-2 font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded-sm bg-surface-container-lowest">
        </div>
        <div>
          <label class="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">Email</label>
          <input id="editEmail" type="email" class="w-full border border-outline-variant px-3 py-2 font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded-sm bg-surface-container-lowest">
        </div>
        <div>
          <label class="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">WhatsApp</label>
          <input id="editWhatsapp" type="text" class="w-full border border-outline-variant px-3 py-2 font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded-sm bg-surface-container-lowest">
        </div>
        <div id="modalError" class="p-3 bg-error-container text-on-error-container text-sm rounded-sm" style="display:none"></div>
        <div class="flex gap-3 pt-2">
          <button type="submit" class="flex-1 bg-primary text-on-primary font-label-sm text-label-sm py-3 uppercase tracking-wider hover:opacity-90 transition-opacity rounded-sm">Guardar cambios</button>
          <button type="button" id="btnCancelarModal" class="flex-1 border border-outline-variant font-label-sm text-label-sm py-3 uppercase tracking-wider hover:bg-surface-variant transition-colors rounded-sm">Cancelar</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal Alta Cliente — CU-006 -->
  <div id="modalAlta" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" style="display:none!important">
    <div class="bg-surface-container-lowest border border-outline-variant shadow-xl w-full max-w-md mx-4 rounded-lg overflow-hidden">
      <div class="flex justify-between items-center px-6 py-4 border-b border-outline-variant bg-surface-bright">
        <h2 class="font-headline-md text-headline-md text-primary">Nuevo cliente</h2>
        <button id="btnCerrarModalAlta" class="p-2 hover:bg-surface-variant rounded-full text-on-surface transition-colors">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <form id="formAlta" class="p-6 space-y-4">
        <div>
          <label class="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">Usuario *</label>
          <input id="altaUsuario" type="text" required class="w-full border border-outline-variant px-3 py-2 font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded-sm bg-surface-container-lowest">
        </div>
        <div>
          <label class="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">Nombre *</label>
          <input id="altaNombre" type="text" required class="w-full border border-outline-variant px-3 py-2 font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded-sm bg-surface-container-lowest">
        </div>
        <div>
          <label class="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">Email *</label>
          <input id="altaEmail" type="email" required class="w-full border border-outline-variant px-3 py-2 font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded-sm bg-surface-container-lowest">
        </div>
        <div>
          <label class="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">Contraseña *</label>
          <input id="altaPassword" type="password" required class="w-full border border-outline-variant px-3 py-2 font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded-sm bg-surface-container-lowest">
        </div>
        <div id="altaError" class="p-3 bg-error-container text-on-error-container text-sm rounded-sm" style="display:none"></div>
        <div class="flex gap-3 pt-2">
          <button type="submit" class="flex-1 bg-primary text-on-primary font-label-sm text-label-sm py-3 uppercase tracking-wider hover:opacity-90 transition-opacity rounded-sm">Crear cliente</button>
          <button type="button" id="btnCancelarAlta" class="flex-1 border border-outline-variant font-label-sm text-label-sm py-3 uppercase tracking-wider hover:bg-surface-variant transition-colors rounded-sm">Cancelar</button>
        </div>
      </form>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modalEditar  = document.getElementById('modalEditar');
  const modalAlta    = document.getElementById('modalAlta');

  // ── Helpers de visibilidad de modales ─────────────────────────────────────
  function abrirModal(el)  { el.style.cssText = ''; }   // quita el display:none!important
  function cerrarModal(el) { el.style.cssText = 'display:none!important'; }

  // ── Drawer — funciones expuestas globalmente (el Stitch usa onclick="...") ─
  window.toggleDrawer = function (e) {
    if (e && e.target !== drawerOverlay) return; // click dentro del panel → no cierra
    const abierto = drawerOverlay.classList.contains('drawer-open');
    if (abierto) {
      drawerOverlay.classList.remove('drawer-open');
      drawerOverlay.style.display = 'none';
    } else {
      drawerOverlay.style.display = 'flex';
      drawerOverlay.classList.add('drawer-open');
    }
  };

  function abrirDrawer(cliente) {
    // Actualizar el encabezado del drawer con los datos del cliente
    const h2    = drawerPanel.querySelector('h2');
    const p     = drawerPanel.querySelector('p.font-label-sm');
    const spans = drawerPanel.querySelectorAll('.mt-3 span');
    if (h2) h2.textContent = cliente.nombre;
    if (p)  p.textContent  = `@${cliente.usuario} • ${cliente.email}`;
    if (spans[0]) {
      const año = new Date(cliente.creado_en).getFullYear();
      spans[0].textContent = `Cliente desde ${año}`;
    }

    drawerOverlay.style.display = 'flex';
    drawerOverlay.classList.add('drawer-open');

    // Cargar historial
    cargarHistorial(cliente.id);
  }

  function cerrarDrawer() {
    drawerOverlay.classList.remove('drawer-open');
    drawerOverlay.style.display = 'none';
  }

  drawerOverlay.addEventListener('click', (e) => {
    if (e.target === drawerOverlay) cerrarDrawer();
  });
  drawerPanel.querySelector('button[onclick="toggleDrawer()"]')
             ?.removeAttribute('onclick');
  drawerPanel.querySelector('button')
             ?.addEventListener('click', cerrarDrawer);

  // ── CU-010 — Cargar historial de pedidos en el drawer ─────────────────────
  async function cargarHistorial(clienteId) {
    const contenedor = drawerPanel.querySelector('.flex-1.overflow-y-auto .flex.flex-col');
    const titulo     = drawerPanel.querySelector('h3');
    if (!contenedor || !titulo) return;

    contenedor.innerHTML = '<p class="text-on-surface-variant font-label-sm animate-pulse">Cargando...</p>';

    try {
      const resp = await fetch(`${window.API_URL}/api/v1/clientes/${clienteId}/historial`, {
        credentials: 'include',
      });
      const data = await resp.json();

      if (!resp.ok) throw new Error(data.mensaje || 'Error al cargar historial');

      const pedidos = data.pedidos || [];
      titulo.textContent = `HISTORIAL DE PEDIDOS (${pedidos.length})`;

      if (pedidos.length === 0) {
        contenedor.innerHTML = '<p class="text-on-surface-variant font-label-sm">Sin pedidos registrados.</p>';
        return;
      }

      contenedor.innerHTML = pedidos.map(p => {
        const fecha = new Date(p.creado_en).toLocaleDateString('es-AR', {
          day: '2-digit', month: 'short', year: 'numeric'
        });
        const badgeClase = badgeEstado(p.estado);
        const items = p.cantidad_items === 1 ? '1 ítem' : `${p.cantidad_items} ítems`;
        return `
        <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-sm">
          <div class="flex justify-between items-start mb-3 border-b border-outline-variant pb-3">
            <div>
              <span class="font-label-sm text-label-sm font-bold text-primary block">ORD-#${p.id}</span>
              <span class="text-xs text-on-surface-variant">${fecha}</span>
            </div>
            <span class="${badgeClase}">${p.estado.toUpperCase()}</span>
          </div>
          <div class="flex justify-between items-end">
            <div class="text-sm text-on-surface-variant">${items}</div>
            <div class="font-body-md font-bold text-primary">$${Number(p.total).toFixed(2)}</div>
          </div>
        </div>`;
      }).join('');
    } catch (err) {
      contenedor.innerHTML = `<p class="text-error font-label-sm">${err.message}</p>`;
    }
  }

  // ── CU-008 — Cargar tabla de clientes ─────────────────────────────────────
  async function cargarClientes(busqueda = '') {
    try {
      const url = `${window.API_URL}/api/v1/clientes${busqueda ? `?busqueda=${encodeURIComponent(busqueda)}` : ''}`;
      const resp = await fetch(url, { credentials: 'include' });
      const data = await resp.json();

      if (!resp.ok) {
        if (resp.status === 401 || resp.status === 403) {
          window.location.href = '/Seguridad/SeguridadPages/SeguridadLogin.html';
          return;
        }
        throw new Error(data.mensaje || 'Error al cargar clientes');
      }

      todosLosClientes = data.clientes || [];
      renderizarTabla(todosLosClientes);
    } catch (err) {
      console.error('[CU-008]', err);
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-error font-label-sm">${err.message}</td></tr>`;
      }
    }
  }

  // ── Renderizar filas de la tabla ───────────────────────────────────────────
  function renderizarTabla(clientes) {
    if (!tbody) return;

    if (spanTotal) {
      spanTotal.textContent = `Mostrando ${clientes.length} cliente${clientes.length !== 1 ? 's' : ''}`;
    }

    if (clientes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-on-surface-variant font-label-sm">Sin resultados</td></tr>`;
      return;
    }

    tbody.innerHTML = clientes.map(c => {
      const iniciales = (c.nombre || '??').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
      const activoBadge = c.activo
        ? `<span class="inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-label-sm font-bold bg-secondary-fixed text-on-secondary-fixed border border-secondary-fixed-dim">ACTIVO</span>`
        : `<span class="inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-label-sm font-bold bg-surface-variant text-on-surface-variant border border-outline-variant">INACTIVO</span>`;

      return `
      <tr class="table-row-hover transition-colors group" data-id="${c.id}">
        <td class="p-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-primary font-bold text-xs">${iniciales}</div>
            <span class="font-body-md text-primary font-semibold">${escHtml(c.nombre)}</span>
          </div>
        </td>
        <td class="p-4 text-on-surface-variant font-label-sm">@${escHtml(c.usuario)}</td>
        <td class="p-4 text-on-surface-variant">${escHtml(c.email)}</td>
        <td class="p-4">${activoBadge}</td>
        <td class="p-4 text-right">
          <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="btn-historial p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-md transition-colors" title="Ver historial" data-id="${c.id}">
              <span class="material-symbols-outlined text-[20px]">history</span>
            </button>
            <button class="btn-editar p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-md transition-colors" title="Editar" data-id="${c.id}">
              <span class="material-symbols-outlined text-[20px]">edit</span>
            </button>
            ${c.activo ? `
            <button class="btn-baja p-1.5 text-error hover:bg-error-container rounded-md transition-colors" title="Dar de baja" data-id="${c.id}">
              <span class="material-symbols-outlined text-[20px]">person_off</span>
            </button>` : `
            <button class="btn-reactivar p-1.5 text-secondary hover:bg-secondary-container/20 rounded-md transition-colors" title="Reactivar cliente" data-id="${c.id}">
              <span class="material-symbols-outlined text-[20px]">person_add</span>
            </button>`}
          </div>
        </td>
      </tr>`;
    }).join('');

    // Delegar eventos sobre la tabla dinámica
    tbody.querySelectorAll('.btn-historial').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        const cliente = todosLosClientes.find(c => c.id === id);
        if (cliente) abrirDrawer(cliente);
      });
    });

    tbody.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        const cliente = todosLosClientes.find(c => c.id === id);
        if (cliente) abrirModalEditar(cliente);
      });
    });

    tbody.querySelectorAll('.btn-baja').forEach(btn => {
      btn.addEventListener('click', () => darDeBaja(parseInt(btn.dataset.id, 10)));
    });

    tbody.querySelectorAll('.btn-reactivar').forEach(btn => {
      btn.addEventListener('click', () => reactivar(parseInt(btn.dataset.id, 10)));
    });
  }

  // ── CU-007 — Abrir modal de editar ────────────────────────────────────────
  function abrirModalEditar(cliente) {
    clienteEnEdicion = cliente;
    document.getElementById('editId').value        = cliente.id;
    document.getElementById('editNombre').value    = cliente.nombre || '';
    document.getElementById('editEmail').value     = cliente.email  || '';
    document.getElementById('editWhatsapp').value  = cliente.whatsapp || '';
    document.getElementById('modalError').style.display = 'none';
    abrirModal(modalEditar);
  }

  document.getElementById('btnCerrarModal')?.addEventListener('click',   () => cerrarModal(modalEditar));
  document.getElementById('btnCancelarModal')?.addEventListener('click', () => cerrarModal(modalEditar));

  document.getElementById('formEditar')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errDiv  = document.getElementById('modalError');
    const id      = parseInt(document.getElementById('editId').value, 10);
    const nombre  = document.getElementById('editNombre').value.trim();
    const email   = document.getElementById('editEmail').value.trim();
    const whatsapp = document.getElementById('editWhatsapp').value.trim();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      const resp = await fetch(`${window.API_URL}/api/v1/clientes/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, whatsapp }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        errDiv.textContent = data.mensaje || 'Error al guardar';
        errDiv.style.display = 'block';
        return;
      }

      cerrarModal(modalEditar);
      await cargarClientes(inputBusqueda?.value || '');
    } catch (err) {
      errDiv.textContent = 'Error de conexión';
      errDiv.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
    }
  });

  // ── CU-006 — Modal de alta ─────────────────────────────────────────────────
  btnNuevo?.addEventListener('click', () => {
    document.getElementById('formAlta').reset();
    document.getElementById('altaError').style.display = 'none';
    abrirModal(modalAlta);
  });

  document.getElementById('btnCerrarModalAlta')?.addEventListener('click',  () => cerrarModal(modalAlta));
  document.getElementById('btnCancelarAlta')?.addEventListener('click',      () => cerrarModal(modalAlta));

  document.getElementById('formAlta')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errDiv    = document.getElementById('altaError');
    const usuario   = document.getElementById('altaUsuario').value.trim();
    const nombre    = document.getElementById('altaNombre').value.trim();
    const email     = document.getElementById('altaEmail').value.trim();
    const password  = document.getElementById('altaPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      const resp = await fetch(`${window.API_URL}/api/v1/clientes`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, nombre, email, password }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        errDiv.textContent = data.mensaje || 'Error al crear cliente';
        errDiv.style.display = 'block';
        return;
      }

      cerrarModal(modalAlta);
      await cargarClientes(inputBusqueda?.value || '');
    } catch (err) {
      errDiv.textContent = 'Error de conexión';
      errDiv.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
    }
  });

  // ── CU-009 — Dar de baja con confirmación ─────────────────────────────────
  async function darDeBaja(id) {
    const cliente = todosLosClientes.find(c => c.id === id);
    if (!cliente) return;

    if (!confirm(`¿Dar de baja a "${cliente.nombre}"?\nEsta acción es reversible solo desde la base de datos.`)) return;

    try {
      const resp = await fetch(`${window.API_URL}/api/v1/clientes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.mensaje || 'Error al dar de baja');
      await cargarClientes(inputBusqueda?.value || '');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  // ── Extensión de CU-009 — Reactivar cliente con confirmación ──────────────
  async function reactivar(id) {
    const cliente = todosLosClientes.find(c => c.id === id);
    if (!cliente) return;

    if (!confirm(`¿Reactivar al cliente "${cliente.nombre}"?\nEl usuario podrá volver a iniciar sesión.`)) return;

    try {
      const resp = await fetch(`${window.API_URL}/api/v1/clientes/${id}/reactivar`, {
        method: 'PUT',
        credentials: 'include',
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.mensaje || 'Error al reactivar cliente');
      await cargarClientes(inputBusqueda?.value || '');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  // ── Búsqueda con debounce (CU-008) ────────────────────────────────────────
  let debounceTimer = null;
  inputBusqueda?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      cargarClientes(inputBusqueda.value);
    }, 350);
  });

  // ── Sidebar: actualizar hrefs y botón Salir ───────────────────────────────
  const sidebarLinks = document.querySelectorAll('nav a');
  sidebarLinks.forEach(a => {
    const texto = a.textContent.trim();
    if (texto === 'Resumen')   a.href = '/Dashboard/DashboardPages/DashboardAdmin.html';
    if (texto === 'Productos') a.href = '/Pedidos/PedidosPages/PedidosAdminProductos.html';
    if (texto === 'Pedidos')   a.href = '/Pedidos/PedidosPages/PedidosAdminListado.html';
    if (texto === 'Salir') {
      a.href = '#';
      a.addEventListener('click', async (e) => {
        e.preventDefault();
        await fetch(`${window.API_URL}/api/v1/seguridad/logout`, { credentials: 'include' });
        window.location.href = '/Seguridad/SeguridadPages/SeguridadLogin.html';
      });
    }
  });

  // ── Ocultar el drawer al inicio (Stitch lo deja visible) ─────────────────
  drawerOverlay.style.display = 'none';

  // ── Helpers ───────────────────────────────────────────────────────────────
  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function badgeEstado(estado) {
    const map = {
      pendiente:      'inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-label-sm font-bold bg-surface-variant text-on-surface-variant border border-outline-variant',
      confirmado:     'inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-label-sm font-bold bg-secondary-fixed text-on-secondary-fixed border border-secondary-fixed-dim',
      en_preparacion: 'inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-label-sm font-bold bg-secondary-fixed text-on-secondary-fixed border border-secondary-fixed-dim',
      enviado:        'inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-label-sm font-bold bg-primary text-on-primary',
      entregado:      'inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-label-sm font-bold bg-secondary-fixed text-on-secondary-fixed border border-secondary-fixed-dim',
      cancelado:      'inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-label-sm font-bold bg-error-container text-on-error-container border border-error',
    };
    return map[estado] || map.pendiente;
  }

  // ── Carga inicial ─────────────────────────────────────────────────────────
  cargarClientes();
})();
