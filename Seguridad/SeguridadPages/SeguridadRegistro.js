// =============================================================================
// Seguridad/SeguridadPages/SeguridadRegistro.js
// JS de página para CU-001 (Registrar Usuario).
// Hace fetch contra la API usando window.API_URL (definido en config/config.js).
// NO modifica el diseño visual del HTML de Stitch.
// =============================================================================

(function () {
  'use strict';

  // ── El form de Stitch no tiene id — lo buscamos por selector ─────────────
  const form         = document.querySelector('form');
  const errorBox     = document.querySelector('.bg-error-container\\/20') ||
                       document.querySelector('[class*="error-container"]');

  // Los inputs de Stitch no tienen id/name — los identificamos por tipo/orden
  const inputs = form ? form.querySelectorAll('input') : [];
  // Orden según el HTML: [0]=usuario [1]=nombre [2]=email [3]=password
  const inputUsuario  = inputs[0];
  const inputNombre   = inputs[1];
  const inputEmail    = inputs[2];
  const inputPassword = inputs[3];

  // Asignamos id y name para que sean accesibles y para accesibilidad
  if (inputUsuario)  { inputUsuario.id  = 'reg-usuario';  inputUsuario.name  = 'usuario'; }
  if (inputNombre)   { inputNombre.id   = 'reg-nombre';   inputNombre.name   = 'nombre'; }
  if (inputEmail)    { inputEmail.id    = 'reg-email';    inputEmail.name    = 'email'; }
  if (inputPassword) { inputPassword.id = 'reg-password'; inputPassword.name = 'password'; }

  // ── Mostrar / ocultar error ───────────────────────────────────────────────
  function mostrarError(msg) {
    if (!errorBox) return;
    const p = errorBox.querySelector('p') || errorBox.querySelector('span:not([data-icon])');
    if (p) p.textContent = msg;
    errorBox.style.display = 'flex';
  }

  function ocultarError() {
    if (errorBox) errorBox.style.display = 'none';
  }

  // Ocultar al inicio
  ocultarError();

  // ── Submit — CU-001 Registrar Usuario ────────────────────────────────────
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    ocultarError();

    const usuario  = inputUsuario?.value?.trim();
    const nombre   = inputNombre?.value?.trim();
    const email    = inputEmail?.value?.trim();
    const password = inputPassword?.value;

    // Validación mínima de cliente (el Service hace la definitiva)
    if (!usuario || !nombre || !email || !password) {
      mostrarError('Todos los campos son obligatorios');
      return;
    }
    if (password.length < 6) {
      mostrarError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]') ||
                      form.querySelector('button');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creando cuenta...';
    }

    try {
      const resp = await fetch(`${window.API_URL}/api/v1/seguridad/registro`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ usuario, nombre, email, password }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        // CU-001 flujo alternativo A1: usuario o email ya existe
        mostrarError(data.mensaje || 'El usuario o email ya existe');
        return;
      }

      // CU-001 postcondición éxito: redirigir al catálogo (ya viene con sesión iniciada)
      window.location.href = '/Pedidos/PedidosPages/PedidosCatalogo.html';
    } catch (err) {
      console.error('[registro] Error de red:', err);
      mostrarError('Error de conexión. Intentá de nuevo.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Crear cuenta';
      }
    }
  });

  // ── Actualizar links de navegación ────────────────────────────────────────
  document.querySelectorAll('a[href="#"]').forEach((a) => {
    const texto = a.textContent.trim().toUpperCase();
    if (texto.includes('INGRESAR') || texto.includes('CUENTA')) {
      a.href = '/Seguridad/SeguridadPages/SeguridadLogin.html';
    }
    if (texto.includes('TIENDA') || texto.includes('VOLVER')) {
      a.href = '/Pedidos/PedidosPages/PedidosCatalogo.html';
    }
  });
})();
