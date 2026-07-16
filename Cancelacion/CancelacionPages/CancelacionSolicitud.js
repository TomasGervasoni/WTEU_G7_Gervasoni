'use strict';

// =============================================================================
// Cancelacion/CancelacionPages/CancelacionSolicitud.js
// Lógica frontend para solicitar la cancelación de un pedido (CU-017).
// =============================================================================

(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const pedidoId = urlParams.get('id');

  // Si no hay ID de pedido, redirigir
  if (!pedidoId) {
    window.location.href = '../../Pedidos/PedidosPages/PedidosMisPedidos.html';
    return;
  }

  // ── Referencias al DOM ────────────────────────────────────────────────────
  const btnConfirmar = document.querySelector('#cancelModal button.bg-primary');
  const txtMotivo = document.querySelector('#cancelModal textarea');
  const headerPedido = document.querySelector('h2.font-headline-lg');

  // Actualizar el título con el ID real
  if (headerPedido) {
    headerPedido.textContent = `Pedido #${pedidoId}`;
  }

  // ── Solicitar cancelación (CU-017) ────────────────────────────────────────
  btnConfirmar?.addEventListener('click', async (e) => {
    e.preventDefault();
    const originalText = btnConfirmar.textContent;
    btnConfirmar.textContent = 'Enviando...';
    btnConfirmar.disabled = true;

    try {
      const resp = await fetch(`${window.API_URL}/api/v1/cancelacion/${pedidoId}/solicitar`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: txtMotivo ? txtMotivo.value : '' })
      });
      const data = await resp.json();

      if (!resp.ok) {
        if (resp.status === 401 || resp.status === 403) {
          window.location.href = '../../Seguridad/SeguridadPages/SeguridadLogin.html';
          return;
        }
        throw new Error(data.mensaje || 'Error al solicitar cancelación');
      }

      alert('Solicitud enviada correctamente. Será revisada a la brevedad.');
      window.location.href = '../../Pedidos/PedidosPages/PedidosMisPedidos.html';

    } catch (err) {
      alert(`Error: ${err.message}`);
      btnConfirmar.textContent = originalText;
      btnConfirmar.disabled = false;
    }
  });

})();
