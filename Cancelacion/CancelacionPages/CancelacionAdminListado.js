// =============================================================================
// Cancelacion/CancelacionPages/CancelacionAdminListado.js
// Panel de gestión de cancelaciones para el administrador (CU-018, CU-019).
// =============================================================================

(function () {
  'use strict';

  function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  const selectFiltro = document.getElementById('filtroEstado');
  const listaSolicitudes = document.getElementById('listaSolicitudes');

  function badgeEstadoSolicitud(estado) {
    const map = {
      solicitada: 'bg-surface-variant text-on-surface-variant border-outline-variant',
      aprobada:   'bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed-dim',
      rechazada:  'bg-error-container text-on-error-container border-error',
    };
    return map[estado] || map.solicitada;
  }

  function renderizarSolicitudes(solicitudes) {
    if (!listaSolicitudes) return;

    if (solicitudes.length === 0) {
      listaSolicitudes.innerHTML = `<p class="text-center py-16 text-on-surface-variant font-label-sm">No hay solicitudes para mostrar</p>`;
      return;
    }

    listaSolicitudes.innerHTML = solicitudes.map(s => {
      const fecha = new Date(s.creado_en).toLocaleDateString('es-AR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const badge = badgeEstadoSolicitud(s.estado);
      const isPendiente = s.estado === 'solicitada';

      return `
      <div class="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden order-card-shadow" data-id="${s.id}">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 border-b border-outline-variant gap-3 bg-surface-container-low">
          <div>
            <span class="font-label-sm text-label-sm font-bold text-primary">SOLICITUD #${s.id}</span>
            <span class="text-xs text-on-surface-variant ml-3">${fecha}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-label-sm text-xs font-bold text-primary">PEDIDO #${s.pedido_id}</span>
            <span class="inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-label-sm font-bold border ${badge}">
              ${s.estado.toUpperCase()}
            </span>
          </div>
        </div>

        <!-- Body -->
        <div class="px-6 py-4 flex flex-col md:flex-row gap-6">
          <div class="flex-1">
            <p class="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Cliente</p>
            <p class="font-body-md font-semibold text-primary">${escHtml(s.cliente_nombre)}</p>
            <p class="text-xs text-on-surface-variant mt-1">✉ ${escHtml(s.cliente_email)}</p>
            
            <p class="font-label-sm text-label-sm text-on-surface-variant uppercase mt-4 mb-2">Detalles del Pedido</p>
            <p class="text-sm">Monto Total: <span class="font-bold">$${Number(s.pedido_total).toFixed(2)}</span></p>
            <p class="text-sm">Estado actual (Pedidos): <span class="uppercase text-xs font-bold bg-surface-variant px-1 rounded">${s.pedido_estado}</span></p>
          </div>
          <div class="flex-1 bg-surface rounded p-4 border border-outline-variant border-dashed">
            <p class="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Motivo del Cliente</p>
            <p class="font-body-md text-primary italic">"${escHtml(s.motivo || 'Sin motivo especificado')}"</p>
            
            ${s.resuelto_en ? `
            <div class="mt-4 pt-4 border-t border-outline-variant">
              <p class="font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">Resolución</p>
              <p class="text-sm text-primary">Resuelto por: <strong>${escHtml(s.admin_nombre || 'Admin')}</strong></p>
              ${s.motivo_rechazo ? `<p class="text-sm text-error mt-1">Rechazo: ${escHtml(s.motivo_rechazo)}</p>` : ''}
            </div>` : ''}
          </div>
        </div>

        <!-- Footer / Acciones -->
        ${isPendiente ? `
        <div class="px-6 py-4 border-t border-outline-variant flex flex-col sm:flex-row justify-end gap-3 bg-surface-container-lowest">
          <input type="text" class="input-rechazo flex-1 px-3 py-2 border border-outline-variant rounded font-body-md text-sm outline-none focus:border-primary" placeholder="Motivo de rechazo (opcional)" data-id="${s.id}">
          <button class="btn-rechazar px-4 py-2 bg-surface-variant text-on-surface-variant font-label-sm text-label-sm uppercase hover:bg-error-container hover:text-error hover:border-error border border-transparent transition-colors rounded" data-id="${s.id}">
            Rechazar
          </button>
          <button class="btn-aprobar px-4 py-2 bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-wider hover:opacity-90 transition-opacity rounded" data-id="${s.id}">
            Aprobar Cancelación
          </button>
        </div>` : ''}
      </div>`;
    }).join('');

    // Listeners
    listaSolicitudes.querySelectorAll('.btn-aprobar').forEach(btn => {
      btn.addEventListener('click', () => aprobarSolicitud(btn.dataset.id));
    });

    listaSolicitudes.querySelectorAll('.btn-rechazar').forEach(btn => {
      btn.addEventListener('click', () => rechazarSolicitud(btn.dataset.id));
    });
  }

  async function cargarSolicitudes() {
    if (!listaSolicitudes) return;
    listaSolicitudes.innerHTML = `<p class="py-16 text-center text-on-surface-variant font-label-sm animate-pulse">Cargando solicitudes...</p>`;

    try {
      const param = selectFiltro.value ? `?estado=${selectFiltro.value}` : '';
      const resp = await fetch(`${window.API_URL}/api/v1/cancelacion${param}`, {
        credentials: 'include'
      });

      if (resp.status === 401 || resp.status === 403) {
        window.location.href = '/Seguridad/SeguridadPages/SeguridadLogin.html';
        return;
      }

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.mensaje || 'Error al cargar');
      renderizarSolicitudes(data.solicitudes || []);
    } catch (err) {
      listaSolicitudes.innerHTML = `<p class="text-center py-16 text-error font-label-sm">${err.message}</p>`;
    }
  }

  async function aprobarSolicitud(id) {
    if (!confirm('¿Seguro que deseas APROBAR esta cancelación? El pedido se marcará como Cancelado de forma irreversible.')) return;
    try {
      const resp = await fetch(`${window.API_URL}/api/v1/cancelacion/${id}/aprobar`, {
        method: 'PUT',
        credentials: 'include'
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.mensaje || 'Error al aprobar');
      alert('Solicitud aprobada con éxito');
      cargarSolicitudes();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async function rechazarSolicitud(id) {
    const input = document.querySelector(`.input-rechazo[data-id="${id}"]`);
    const motivo = input ? input.value : '';
    if (!confirm('¿Seguro que deseas RECHAZAR esta cancelación? El pedido continuará su curso normal.')) return;
    
    try {
      const resp = await fetch(`${window.API_URL}/api/v1/cancelacion/${id}/rechazar`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo_rechazo: motivo })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.mensaje || 'Error al rechazar');
      alert('Solicitud rechazada');
      cargarSolicitudes();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  // Logout listener
  document.getElementById('btn-logout')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch(`${window.API_URL}/api/v1/seguridad/logout`, { credentials: 'include' });
    window.location.href = '/Seguridad/SeguridadPages/SeguridadLogin.html';
  });

  // Filtro
  selectFiltro?.addEventListener('change', cargarSolicitudes);

  // Init
  cargarSolicitudes();
})();
