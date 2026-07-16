// =============================================================================
// Seguridad/SeguridadPages/SeguridadLogin.js
// JS de página para CU-002 (Iniciar Sesión) y CU-003 (Cerrar Sesión).
// Hace fetch contra la API usando window.API_URL (definido en config/config.js).
// NO modifica el diseño visual del HTML de Stitch.
// =============================================================================

(function () {
  'use strict';

  // ── Referencias al DOM ────────────────────────────────────────────────────
  const loginForm    = document.getElementById('loginForm');
  const errorMessage = document.getElementById('errorMessage');
  const toggleBtn    = document.querySelector('#loginForm button[type="button"]');
  const passInput    = document.getElementById('password');
  const usernameInput = document.getElementById('username');

  // ── Toggle visibilidad contraseña (ya existía en el HTML de Stitch) ───────
  toggleBtn?.addEventListener('click', () => {
    const isPass = passInput.type === 'password';
    passInput.type = isPass ? 'text' : 'password';
    toggleBtn.querySelector('span').textContent = isPass ? 'visibility_off' : 'visibility';
  });

  // ── Mostrar / ocultar el bloque de error ──────────────────────────────────
  function mostrarError(mensaje) {
    const span = errorMessage.querySelector('span.font-body-md') ||
                 errorMessage.querySelector('span:not(.material-symbols-outlined)');
    if (span) span.textContent = mensaje;
    errorMessage.style.display = 'flex';
    // Re-trigger animación
    errorMessage.classList.remove('animate-in');
    void errorMessage.offsetWidth;
    errorMessage.classList.add('animate-in');
  }

  function ocultarError() {
    errorMessage.style.display = 'none';
  }

  // Ocultar el bloque de error al inicio (Stitch lo dejó visible para demo)
  ocultarError();

  // ── Submit — CU-002 Iniciar Sesión ────────────────────────────────────────
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    ocultarError();

    const usuario  = usernameInput?.value?.trim();
    const password = passInput?.value;

    if (!usuario || !password) {
      mostrarError('Usuario o contraseña incorrectos');
      return;
    }

    // Deshabilitar botón mientras se procesa
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Ingresando...';

    try {
      const resp = await fetch(`${window.API_URL}/api/v1/seguridad/autenticacion`, {
        method:      'POST',
        credentials: 'include',           // obligatorio para que el servidor envíe la cookie
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ usuario, password }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        mostrarError(data.mensaje || 'Usuario o contraseña incorrectos');
        return;
      }

      // CU-002 postcondición éxito: redirigir según rol
      const rol = data.usuario?.rol;
      if (rol === 'administrador') {
        window.location.href = '/Pedidos/PedidosPages/PedidosAdminListado.html';
      } else {
        window.location.href = '/Pedidos/PedidosPages/PedidosCatalogo.html';
      }
    } catch (err) {
      console.error('[login] Error de red:', err);
      mostrarError('Error de conexión. Intentá de nuevo.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Ingresar';
    }
  });

  // ── Links de navegación ───────────────────────────────────────────────────
  // Actualizar href de "¿No tenés cuenta? Registrate"
  const linkRegistro = loginForm?.querySelector('a[href="#"]:first-of-type') ||
    document.querySelector('a[href="#"]');

  // Buscar todos los <a href="#"> y asignarles destinos reales
  document.querySelectorAll('a[href="#"]').forEach((a) => {
    const texto = a.textContent.trim().toUpperCase();
    if (texto.includes('REGISTRATE') || texto.includes('REGISTRO')) {
      a.href = '/Seguridad/SeguridadPages/SeguridadRegistro.html';
    }
    if (texto.includes('TIENDA') || texto.includes('VOLVER')) {
      a.href = '/Pedidos/PedidosPages/PedidosCatalogo.html';
    }
  });
})();
