// =============================================================================
// Pedidos/PedidosPages/PedidosAdminProductos.js
// JS de página — CU-011 (admin) gestión de productos y búsqueda.
// Reemplaza el script inline de micro-interacciones de Stitch.
// =============================================================================

(function () {
  'use strict';

  function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Referencias al DOM ────────────────────────────────────────────────────
  const listaProductos = document.querySelector('.space-y-6');
  const inputBusqueda  = document.querySelector('input[type="text"]');
  const btnNuevo       = [...document.querySelectorAll('button')].find(b =>
    b.textContent.trim().toUpperCase().includes('NUEVO PRODUCTO'));

  // ── Modal de crear/editar producto ────────────────────────────────────────
  const modalHTML = `
  <div id="modalProducto" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" style="display:none!important">
    <div class="bg-surface-container-lowest border border-outline-variant shadow-xl w-full max-w-lg mx-4 rounded-lg overflow-hidden">
      <div class="flex justify-between items-center px-6 py-4 border-b border-outline-variant bg-surface-bright">
        <h2 id="modalProductoTitulo" class="font-headline-md text-headline-md text-primary">Nuevo producto</h2>
        <button id="btnCerrarModalProducto" class="p-2 hover:bg-surface-variant rounded-full">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <form id="formProducto" class="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
        <input type="hidden" id="prodId">
        <div>
          <label class="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">Nombre *</label>
          <input id="prodNombre" type="text" required class="w-full border border-outline-variant px-3 py-2 font-body-md focus:border-primary outline-none transition-colors rounded-sm bg-surface-container-lowest">
        </div>
        <div>
          <label class="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">Descripción</label>
          <textarea id="prodDescripcion" rows="3" class="w-full border border-outline-variant px-3 py-2 font-body-md focus:border-primary outline-none transition-colors rounded-sm bg-surface-container-lowest resize-none"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">Categoría</label>
            <input id="prodCategoria" type="text" class="w-full border border-outline-variant px-3 py-2 font-body-md focus:border-primary outline-none transition-colors rounded-sm bg-surface-container-lowest">
          </div>
          <div>
            <label class="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">Tipo de tela</label>
            <input id="prodTela" type="text" class="w-full border border-outline-variant px-3 py-2 font-body-md focus:border-primary outline-none transition-colors rounded-sm bg-surface-container-lowest">
          </div>
        </div>
        <div>
          <label class="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">Precio *</label>
          <input id="prodPrecio" type="number" min="0" step="0.01" required class="w-full border border-outline-variant px-3 py-2 font-body-md focus:border-primary outline-none transition-colors rounded-sm bg-surface-container-lowest">
        </div>
        <div id="prodErrorModal" class="p-3 bg-error-container text-on-error-container text-sm rounded-sm" style="display:none"></div>
        <div class="flex gap-3 pt-2">
          <button type="submit" class="flex-1 bg-primary text-on-primary font-label-sm text-label-sm py-3 uppercase tracking-wider hover:opacity-90 transition-opacity rounded-sm">Guardar</button>
          <button type="button" id="btnCancelarModalProducto" class="flex-1 border border-outline-variant font-label-sm text-label-sm py-3 uppercase tracking-wider hover:bg-surface-variant rounded-sm">Cancelar</button>
        </div>
      </form>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modalProducto = document.getElementById('modalProducto');

  function abrirModal()  { modalProducto.style.cssText = ''; }
  function cerrarModal() { modalProducto.style.cssText = 'display:none!important'; }

  document.getElementById('btnCerrarModalProducto')?.addEventListener('click', cerrarModal);
  document.getElementById('btnCancelarModalProducto')?.addEventListener('click', cerrarModal);

  function setModalEditar(prod) {
    document.getElementById('modalProductoTitulo').textContent = 'Editar producto';
    document.getElementById('prodId').value          = prod.id;
    document.getElementById('prodNombre').value      = prod.nombre || '';
    document.getElementById('prodDescripcion').value = prod.descripcion || '';
    document.getElementById('prodCategoria').value   = prod.categoria || '';
    document.getElementById('prodTela').value        = prod.tela || '';
    document.getElementById('prodPrecio').value      = prod.precio || '';
    document.getElementById('prodErrorModal').style.display = 'none';
    abrirModal();
  }

  function setModalNuevo() {
    document.getElementById('modalProductoTitulo').textContent = 'Nuevo producto';
    document.getElementById('formProducto').reset();
    document.getElementById('prodId').value = '';
    document.getElementById('prodErrorModal').style.display = 'none';
    abrirModal();
  }

  // ── Submit del form (crear o editar) ──────────────────────────────────────
  document.getElementById('formProducto')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errDiv = document.getElementById('prodErrorModal');
    const id     = document.getElementById('prodId').value;
    const body   = {
      nombre:      document.getElementById('prodNombre').value.trim(),
      descripcion: document.getElementById('prodDescripcion').value.trim() || null,
      categoria:   document.getElementById('prodCategoria').value.trim() || null,
      tipo_tela:   document.getElementById('prodTela').value.trim() || null,
      precio:      parseFloat(document.getElementById('prodPrecio').value),
    };
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      const url    = id
        ? `${window.API_URL}/api/v1/pedidos/admin/productos/${id}`
        : `${window.API_URL}/api/v1/pedidos/admin/productos`;
      const method = id ? 'PUT' : 'POST';

      const resp = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) {
        errDiv.textContent = data.mensaje || 'Error al guardar';
        errDiv.style.display = 'block';
        return;
      }
      cerrarModal();
      await cargarProductos(inputBusqueda?.value || '');
    } catch {
      errDiv.textContent = 'Error de conexión';
      errDiv.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
    }
  });

  // ── CU-011 admin — Cargar y renderizar productos ──────────────────────────
  async function cargarProductos(busqueda = '') {
    if (!listaProductos) return;
    listaProductos.innerHTML = `<p class="py-16 text-center text-on-surface-variant font-label-sm animate-pulse">Cargando productos...</p>`;

    try {
      const url = `${window.API_URL}/api/v1/pedidos/admin/productos${busqueda ? `?busqueda=${encodeURIComponent(busqueda)}` : ''}`;
      const resp = await fetch(url, { credentials: 'include' });

      if (resp.status === 401 || resp.status === 403) {
        window.location.href = '/Seguridad/SeguridadPages/SeguridadLogin.html';
        return;
      }

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.mensaje || 'Error al cargar productos');
      const productos = data.productos || [];

      if (productos.length === 0) {
        listaProductos.innerHTML = `<p class="text-center py-16 text-on-surface-variant font-label-sm">Sin productos</p>`;
        return;
      }

      listaProductos.innerHTML = productos.map(p => tarjetaProductoAdmin(p, escHtml)).join('');

      // Listeners: editar
      listaProductos.querySelectorAll('.btn-editar-producto').forEach(btn => {
        btn.addEventListener('click', () => setModalEditar({
          id:          btn.dataset.id,
          nombre:      btn.dataset.nombre,
          precio:      btn.dataset.precio,
          descripcion: btn.dataset.descripcion,
          categoria:   btn.dataset.categoria,
          tela:        btn.dataset.tela,
        }));
      });

      // Listeners: activar/desactivar producto
      listaProductos.querySelectorAll('.btn-toggle-activo').forEach(btn => {
        btn.addEventListener('click', () => toggleActivo(
          parseInt(btn.dataset.id, 10),
          btn.dataset.activo === 'true'
        ));
      });

      // Listeners: subir imagen
      listaProductos.querySelectorAll('.btn-subir-imagen').forEach(btn => {
        btn.addEventListener('click', () => {
          const fileInput = btn.parentElement.querySelector('.input-file-imagen');
          if (fileInput) fileInput.click();
        });
      });

      listaProductos.querySelectorAll('.input-file-imagen').forEach(input => {
        input.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const id = input.dataset.id;
          const formData = new FormData();
          formData.append('imagen', file);

          try {
            const resp = await fetch(`${window.API_URL}/api/v1/pedidos/admin/productos/${id}/imagenes`, {
              method: 'POST',
              credentials: 'include',
              body: formData
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.mensaje || 'Error al subir la imagen');
            
            // Recargar productos para ver la imagen actualizada
            await cargarProductos(inputBusqueda?.value || '');
          } catch (err) {
            alert(`Error subiendo imagen: ${err.message}`);
          }
        });
      });

    } catch (err) {
      console.error('[CU-011 admin]', err);
      listaProductos.innerHTML = `<p class="text-center py-16 text-error font-label-sm">${err.message}</p>`;
    }
  }

  // ── Toggle activo/inactivo ─────────────────────────────────────────────────
  async function toggleActivo(id, estaActivo) {
    const accion = estaActivo ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} este producto?`)) return;
    try {
      const resp = await fetch(`${window.API_URL}/api/v1/pedidos/admin/productos/${id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !estaActivo }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.mensaje || 'Error');
      await cargarProductos(inputBusqueda?.value || '');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  // ── Botón Nuevo producto ───────────────────────────────────────────────────
  btnNuevo?.addEventListener('click', setModalNuevo);

  // ── Búsqueda con debounce ─────────────────────────────────────────────────
  let debounceTimer = null;
  inputBusqueda?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => cargarProductos(inputBusqueda.value), 350);
  });

  // ── Sidebar hrefs ─────────────────────────────────────────────────────────
  document.querySelectorAll('aside a, nav a').forEach(a => {
    const texto = a.textContent.trim();
    if (texto === 'Resumen')  a.href = '/Dashboard/DashboardPages/DashboardAdmin.html';
    if (texto === 'Pedidos')  a.href = '/Pedidos/PedidosPages/PedidosAdminListado.html';
    if (texto === 'Clientes') a.href = '/Clientes/ClientesPages/ClientesAdminListado.html';
    if (texto === 'Salir') {
      a.href = '#';
      a.addEventListener('click', async (e) => {
        e.preventDefault();
        await fetch(`${window.API_URL}/api/v1/seguridad/logout`, { credentials: 'include' });
        window.location.href = '/Seguridad/SeguridadPages/SeguridadLogin.html';
      });
    }
  });

  // ── Carga inicial ─────────────────────────────────────────────────────────
  cargarProductos();
})();
