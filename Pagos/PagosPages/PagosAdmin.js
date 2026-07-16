// =============================================================================
// Pagos/PagosPages/PagosAdmin.js
// JS de página — CU-020 (Registrar pago manual) + CU-023 (Historial de pagos).
// =============================================================================

(function () {
  'use strict';

  function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Badges ────────────────────────────────────────────────────────────────
  const ESTADO_PAGO_BADGE = {
    pendiente:  'bg-surface-variant text-on-surface-variant border-outline-variant',
    aprobado:   'bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed-dim',
    rechazado:  'bg-error-container text-on-error-container border-error',
    en_proceso: 'bg-surface-variant text-on-surface-variant border-outline-variant',
    devuelto:   'bg-surface-variant text-on-surface-variant border-outline-variant',
  };

  const METODO_LABEL = {
    mercadopago:  'MercadoPago',
    transferencia:'Transferencia',
    efectivo:     'Efectivo',
    otro:         'Otro',
  };

  // ── Referencias DOM ───────────────────────────────────────────────────────
  const listaPagos    = document.getElementById('listaPagos');
  const filtroEstado  = document.getElementById('filtroEstado');
  const filtroMetodo  = document.getElementById('filtroMetodo');
  const modalPago     = document.getElementById('modalPago');
  const formPago      = document.getElementById('formPago');
  const errorManual   = document.getElementById('errorManual');
  const btnRegistrar  = document.getElementById('btnRegistrarManual');
  const btnCerrar     = document.getElementById('btnCerrarModal');
  const btnSubmit     = document.getElementById('btnSubmitPago');

  // ── Renderizar lista ──────────────────────────────────────────────────────
  function renderizarPagos(pagos) {
    if (!listaPagos) return;

    if (pagos.length === 0) {
      listaPagos.innerHTML = `<p class="text-center py-16 text-on-surface-variant font-label-sm">No hay pagos para mostrar</p>`;
      return;
    }

    listaPagos.innerHTML = pagos.map(p => {
      const fecha = new Date(p.creado_en).toLocaleDateString('es-AR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const badge = ESTADO_PAGO_BADGE[p.estado] || ESTADO_PAGO_BADGE.pendiente;
      const esPendiente = p.estado === 'pendiente' || p.estado === 'en_proceso';

      return `
      <div class="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden card-shadow" data-pago-id="${p.id}">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 border-b border-outline-variant gap-3 bg-surface-container-low">
          <div>
            <span class="font-label-sm text-xs font-bold text-primary">PAGO #${p.id}</span>
            <span class="text-xs text-on-surface-variant ml-3">${fecha}</span>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <span class="inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-bold border ${badge}">
              ${p.estado.toUpperCase()}
            </span>
            <span class="font-headline-md text-[20px] font-bold text-primary">$${Number(p.monto).toFixed(2)}</span>
          </div>
        </div>

        <div class="px-6 py-4 flex flex-col md:flex-row gap-6">
          <div class="flex-1">
            <p class="font-label-sm text-[11px] text-on-surface-variant uppercase mb-2">Pedido</p>
            <p class="font-body-md font-bold text-primary">#${p.pedido_id}</p>
            <p class="text-sm text-on-surface-variant mt-1">${escHtml(p.nombre_cliente)}</p>
            <p class="text-xs text-on-surface-variant">${escHtml(p.cliente_email || '')}</p>
          </div>
          <div class="flex-1">
            <p class="font-label-sm text-[11px] text-on-surface-variant uppercase mb-2">Método</p>
            <p class="font-body-md font-semibold text-primary">${METODO_LABEL[p.metodo] || p.metodo}</p>
            ${p.mp_payment_id ? `<p class="text-xs text-on-surface-variant mt-1">MP ID: <code class="font-label-sm">${escHtml(p.mp_payment_id)}</code></p>` : ''}
            ${p.notas ? `<p class="text-xs text-on-surface-variant italic mt-1">"${escHtml(p.notas)}"</p>` : ''}
          </div>
          ${esPendiente ? `
          <div class="flex flex-col gap-2 justify-center">
            <button class="btn-aprobar-pago px-4 py-2 bg-primary text-on-primary font-label-sm text-xs uppercase tracking-wider hover:opacity-90 rounded transition-opacity" data-id="${p.id}">
              Aprobar
            </button>
            <button class="btn-rechazar-pago px-4 py-2 border border-outline-variant text-on-surface-variant font-label-sm text-xs uppercase hover:bg-error-container hover:text-error hover:border-error rounded transition-colors" data-id="${p.id}">
              Rechazar
            </button>
          </div>` : ''}
        </div>
      </div>`;
    }).join('');

    // Listeners de validación (CU-022)
    listaPagos.querySelectorAll('.btn-aprobar-pago').forEach(btn => {
      btn.addEventListener('click', () => validarPago(btn.dataset.id, 'aprobado'));
    });
    listaPagos.querySelectorAll('.btn-rechazar-pago').forEach(btn => {
      btn.addEventListener('click', () => validarPago(btn.dataset.id, 'rechazado'));
    });
  }

  // ── CU-023 Cargar historial ────────────────────────────────────────────────
  async function cargarPagos() {
    if (!listaPagos) return;
    listaPagos.innerHTML = `<p class="py-16 text-center text-on-surface-variant font-label-sm animate-pulse">Cargando pagos...</p>`;

    const params = new URLSearchParams();
    if (filtroEstado.value) params.set('estado',  filtroEstado.value);
    if (filtroMetodo.value) params.set('metodo',  filtroMetodo.value);

    try {
      const resp = await fetch(
        `${window.API_URL}/api/v1/pagos/admin/historial${params.toString() ? '?' + params : ''}`,
        { credentials: 'include' }
      );

      if (resp.status === 401 || resp.status === 403) {
        window.location.href = '/Seguridad/SeguridadPages/SeguridadLogin.html';
        return;
      }

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.mensaje || 'Error al cargar pagos');
      renderizarPagos(data.pagos || []);
    } catch (err) {
      listaPagos.innerHTML = `<p class="text-center py-16 text-error font-label-sm">${err.message}</p>`;
    }
  }

  // ── CU-022 Validar pago ────────────────────────────────────────────────────
  async function validarPago(pagoId, estado) {
    const accion = estado === 'aprobado' ? 'APROBAR' : 'RECHAZAR';
    if (!confirm(`¿Seguro que deseás ${accion} el pago #${pagoId}?`)) return;

    try {
      const resp = await fetch(`${window.API_URL}/api/v1/pagos/admin/${pagoId}/validar`, {
        method:      'PUT',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ estado }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.mensaje || 'Error al validar pago');
      await cargarPagos();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  // ── CU-020 Modal de registro manual ───────────────────────────────────────
  function abrirModal() {
    formPago.reset();
    errorManual.classList.add('hidden');
    modalPago.classList.remove('hidden');
  }

  function cerrarModal() {
    modalPago.classList.add('hidden');
  }

  btnRegistrar?.addEventListener('click', abrirModal);
  btnCerrar?.addEventListener('click', cerrarModal);
  modalPago?.addEventListener('click', (e) => {
    if (e.target === modalPago) cerrarModal();
  });

  formPago?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorManual.classList.add('hidden');

    const pedidoId = document.getElementById('inputPedidoId').value;
    const metodo   = document.getElementById('inputMetodo').value;
    const monto    = document.getElementById('inputMonto').value;
    const url      = document.getElementById('inputComprobante').value;
    const notas    = document.getElementById('inputNotas').value;

    if (!pedidoId || !metodo) {
      errorManual.textContent = 'N° de pedido y método de pago son obligatorios.';
      errorManual.classList.remove('hidden');
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Registrando...';

    try {
      const resp = await fetch(`${window.API_URL}/api/v1/pagos/admin/manual`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id:       parseInt(pedidoId, 10),
          metodo,
          monto:           monto ? parseFloat(monto) : null,
          comprobante_url: url || null,
          notas:           notas || null,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.mensaje || 'Error al registrar pago');

      cerrarModal();
      await cargarPagos();
    } catch (err) {
      errorManual.textContent = err.message;
      errorManual.classList.remove('hidden');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Confirmar pago';
    }
  });

  // ── Filtros ───────────────────────────────────────────────────────────────
  filtroEstado?.addEventListener('change', cargarPagos);
  filtroMetodo?.addEventListener('change', cargarPagos);

  // ── Logout ────────────────────────────────────────────────────────────────
  document.getElementById('btn-logout')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch(`${window.API_URL}/api/v1/seguridad/logout`, { credentials: 'include' });
    window.location.href = '/Seguridad/SeguridadPages/SeguridadLogin.html';
  });

  // ── Init ──────────────────────────────────────────────────────────────────
  cargarPagos();
})();
