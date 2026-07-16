// =============================================================================
// Pedidos/PedidosPages/PedidosCheckout.js
// JS de página — CU-013 Generar Pedido.
// Lee el carrito de localStorage, muestra el resumen y envía el pedido a la API.
// El formulario tiene IDs definidos en el HTML de Stitch.
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

  // ── Verificar autenticación antes de hacer nada ───────────────────────────
  async function verificarSesion() {
    try {
      const resp = await fetch(`${window.API_URL}/api/v1/seguridad/me`, { credentials: 'include' });
      if (!resp.ok) {
        // Guardar carrito en URL para recuperar después del login (simple redirección)
        window.location.href = '/Seguridad/SeguridadPages/SeguridadLogin.html';
        return null;
      }
      const data = await resp.json();
      return data.usuario;
    } catch {
      window.location.href = '/Seguridad/SeguridadPages/SeguridadLogin.html';
      return null;
    }
  }

  // ── Referencias al DOM (todos tienen ID según el análisis del HTML) ───────
  const fNombre    = document.getElementById('nombre');
  const fApellido  = document.getElementById('apellido');
  const fCuil      = document.getElementById('cuil');
  const fEmail     = document.getElementById('email');
  const fWhatsapp  = document.getElementById('whatsapp');
  const fDireccion = document.getElementById('direccion');
  const fCiudad    = document.getElementById('ciudad');
  const fCp        = document.getElementById('cp');
  const fProvincia = document.getElementById('provincia');

  // El botón de submit es type="button" en Stitch, lo controlamos nosotros
  const btnConfirmar = document.querySelector('button[type="button"].bg-\\[\\#0f1420\\]') ||
                        document.querySelector('button[type="button"]');

  // ── Renderizar resumen del pedido (panel izquierdo) ───────────────────────
  function renderizarResumen(carrito) {
    const resumenContainer = document.querySelector('.lg\\:col-span-5');
    if (!resumenContainer) return;

    const subtotal = carrito.reduce((s, i) => s + Number(i.precio_unitario) * i.cantidad, 0);

    // Reemplazar items hardcodeados de Stitch por los reales
    const itemsContainer = resumenContainer.querySelector('.space-y-4, .flex.flex-col');
    if (itemsContainer) {
      itemsContainer.innerHTML = carrito.map(item => {
        const imagen = item.imagen_url ||
          'https://placehold.co/80x96/eceef0/45464c?text=Prod';
        return `
        <div class="flex gap-3 py-3 border-b border-outline-variant last:border-0">
          <img src="${escHtml(imagen)}" class="w-16 h-20 object-cover rounded-lg flex-shrink-0 bg-surface-container" alt="${escHtml(item.nombre_producto)}" loading="lazy">
          <div class="flex-1 min-w-0">
            <p class="font-body-md font-semibold text-primary text-sm truncate">${escHtml(item.nombre_producto)}</p>
            <p class="text-xs text-on-surface-variant mt-0.5">
              ${item.color ? escHtml(item.color) : ''}${item.color && item.talle ? ' · ' : ''}${item.talle ? escHtml(item.talle) : ''}
            </p>
            <div class="flex justify-between items-center mt-2">
              <span class="text-xs text-on-surface-variant">× ${item.cantidad}</span>
              <span class="font-body-md font-bold text-primary text-sm">$${(Number(item.precio_unitario) * item.cantidad).toFixed(2)}</span>
            </div>
          </div>
        </div>`;
      }).join('');
    }

    // Actualizar Subtotal, Envío y Total fijos de Stitch
    const spans = Array.from(resumenContainer.querySelectorAll('span'));
    const spanSubtotal = spans.find(s => s.textContent.trim().toLowerCase() === 'subtotal')?.nextElementSibling;
    const spanEnvio    = spans.find(s => s.textContent.trim().toLowerCase() === 'envío' || s.textContent.trim().toLowerCase() === 'shipping')?.nextElementSibling;
    const spanTotal    = spans.find(s => s.textContent.trim().toLowerCase() === 'total')?.nextElementSibling;

    if (spanSubtotal) spanSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    if (spanEnvio)    spanEnvio.textContent = `A convenir`;
    if (spanTotal)    spanTotal.textContent = `$${subtotal.toFixed(2)}`;
  }

  // ── Pre-rellenar datos del usuario autenticado ────────────────────────────
  async function preRellenarFormulario(usuario) {
    if (!usuario) return;
    // Separar nombre de apellido si el servidor devuelve nombre completo
    const partes = (usuario.nombre || '').split(' ');
    if (fNombre) fNombre.value = partes[0] || '';
    if (fApellido) fApellido.value = partes.slice(1).join(' ') || '';
    if (fEmail) fEmail.value = usuario.email || '';

    // Intentar cargar datos del perfil de cliente (si ya los llenó antes)
    try {
      const resp = await fetch(`${window.API_URL}/api/v1/clientes/${usuario.id}`, {
        credentials: 'include',
      });
      if (resp.ok) {
        const data = await resp.json();
        const c = data.cliente;
        if (c?.whatsapp && fWhatsapp) fWhatsapp.value = c.whatsapp;
        if (c?.direccion && fDireccion) fDireccion.value = c.direccion;
        if (c?.codigo_postal && fCp) fCp.value = c.codigo_postal;
      }
    } catch { /* Silencio — no es crítico */ }
  }

  // ── Validación básica del formulario ──────────────────────────────────────
  function validarFormulario() {
    const obligatorios = { nombre: fNombre, email: fEmail, whatsapp: fWhatsapp };
    for (const [campo, el] of Object.entries(obligatorios)) {
      if (!el?.value?.trim()) {
        el?.focus();
        return `El campo "${campo}" es obligatorio`;
      }
    }
    return null;
  }

  // ── CU-013 — Confirmar pedido ─────────────────────────────────────────────
  async function confirmarPedido() {
    const carrito = getCarrito();
    if (carrito.length === 0) {
      window.location.href = '/Pedidos/PedidosPages/PedidosCarrito.html';
      return;
    }

    const errValidacion = validarFormulario();
    if (errValidacion) {
      mostrarError(errValidacion);
      return;
    }

    const datosCliente = {
      nombre_cliente: `${fNombre?.value.trim()} ${fApellido?.value.trim()}`.trim(),
      cuil:           fCuil?.value.trim() || null,
      whatsapp:       fWhatsapp?.value.trim(),
      email:          fEmail?.value.trim(),
      direccion:      `${fDireccion?.value.trim() || ''} ${fCiudad?.value.trim() || ''} ${fProvincia?.value || ''}`.trim() || null,
      codigo_postal:  fCp?.value.trim() || null,
    };

    const items = carrito.map(i => ({
      producto_id:     i.producto_id,
      nombre_producto: i.nombre_producto,
      imagen_url:      i.imagen_url || null,
      color:           i.color || null,
      talle:           i.talle || null,
      precio_unitario: i.precio_unitario,
      cantidad:        i.cantidad,
    }));

    if (btnConfirmar) {
      btnConfirmar.disabled = true;
      btnConfirmar.textContent = 'Procesando...';
    }
    ocultarError();

    try {
      const resp = await fetch(`${window.API_URL}/api/v1/pedidos`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ datosCliente, items }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        mostrarError(data.mensaje || 'Error al generar el pedido');
        return;
      }

      // CU-013 postcondición éxito: vaciar carrito local y redirigir
      localStorage.removeItem(CARRITO_KEY);
      window.location.href = `/Pedidos/PedidosPages/PedidosMisPedidos.html?nuevo=${data.pedidoId}`;
    } catch (err) {
      mostrarError('Error de conexión. Intentá nuevamente.');
      console.error('[CU-013]', err);
    } finally {
      if (btnConfirmar) {
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = 'Confirmar y Pagar';
      }
    }
  }

  // ── Bloque de error ───────────────────────────────────────────────────────
  let errorEl = null;

  function mostrarError(msg) {
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'p-3 bg-error-container text-on-error-container text-sm rounded-sm mt-4 font-label-sm';
      btnConfirmar?.insertAdjacentElement('beforebegin', errorEl);
    }
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }

  function ocultarError() {
    if (errorEl) errorEl.style.display = 'none';
  }

  // ── Link "Volver al carrito" ───────────────────────────────────────────────
  document.querySelectorAll('a').forEach(a => {
    if (a.textContent.trim().toLowerCase().includes('volver')) {
      a.href = '/Pedidos/PedidosPages/PedidosCarrito.html';
    }
  });

  btnConfirmar?.addEventListener('click', confirmarPedido);

  // ── Carga inicial ─────────────────────────────────────────────────────────
  (async () => {
    const usuario = await verificarSesion();
    const carrito = getCarrito();
    if (carrito.length === 0) {
      window.location.href = '/Pedidos/PedidosPages/PedidosCarrito.html';
      return;
    }
    renderizarResumen(carrito);
    await preRellenarFormulario(usuario);
  })();
})();
