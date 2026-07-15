'use strict';

// =============================================================================
// config/config.js — Switcher de window.API_URL para el frontend
// =============================================================================
// Este archivo se incluye en las páginas HTML con <script src="/config/config.js">
// antes de cualquier otro script de página, para que window.API_URL siempre
// esté disponible.
//
// Lógica:
//   - Si el hostname es 'localhost' o '127.0.0.1', apunta a la API local.
//   - De lo contrario (GitHub Pages, Railway, etc.), apunta al backend de producción.
//     Reemplazá RAILWAY_API_URL con la URL real de tu deployment en Railway.
// =============================================================================

(function () {
  const LOCAL_HOSTS = ['localhost', '127.0.0.1'];
  const isLocal = LOCAL_HOSTS.includes(window.location.hostname);

  // URL del backend de producción en Railway.
  // Cambiar este valor cuando se tenga la URL definitiva del deployment.
  const PRODUCTION_API_URL = 'https://wteu-api.up.railway.app';

  window.API_URL = isLocal
    ? 'http://localhost:3000'
    : PRODUCTION_API_URL;

  console.log('[config] API_URL =', window.API_URL);
})();
