'use strict';

// =============================================================================
// app.js — Composition root de WTEU_G7_Gervasoni
// =============================================================================
// Este archivo monta todos los middlewares globales y registra los routers
// de cada módulo. NO contiene lógica de negocio ni queries SQL.
//
// Orden de montaje (AGENTS.md §5):
//   1. Middlewares globales (cookie-parser, cors, body-parser)
//   2. Rutas estáticas para servir los archivos de configuración del frontend
//   3. Routers de módulos (/api/v1/...)
//   4. Middleware de manejo de errores (siempre al final)
// =============================================================================

require('dotenv').config();

const express     = require('express');
const cookieParser = require('cookie-parser');
const cors        = require('cors');
const path        = require('path');

const app = express();

// ---------------------------------------------------------------------------
// CORS — permite cookies cross-domain (credentials: true)
// origin debe coincidir con el origen del frontend (GitHub Pages en prod).
// En desarrollo aceptamos localhost:* y también el origen del frontend estático.
// ---------------------------------------------------------------------------
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5500,http://127.0.0.1:5500')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origin (curl, Postman, mismo servidor)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin "${origin}" no permitido`));
  },
  credentials: true,           // obligatorio para cookies httpOnly cross-domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ---------------------------------------------------------------------------
// Body parsers y cookie parser
// ---------------------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ---------------------------------------------------------------------------
// Archivos estáticos del frontend
// Sirve los módulos HTML + JS directamente desde las carpetas del proyecto.
// config/config.js se sirve así para que los HTML lo puedan incluir con
// <script src="/config/config.js">.
// ---------------------------------------------------------------------------
app.use('/config',      express.static(path.join(__dirname, 'config')));
app.use('/Seguridad',   express.static(path.join(__dirname, 'Seguridad')));
app.use('/Clientes',    express.static(path.join(__dirname, 'Clientes')));
app.use('/Pedidos',     express.static(path.join(__dirname, 'Pedidos')));
app.use('/Cancelacion', express.static(path.join(__dirname, 'Cancelacion')));
app.use('/Pagos',       express.static(path.join(__dirname, 'Pagos')));
app.use('/Dashboard',   express.static(path.join(__dirname, 'Dashboard')));

// ---------------------------------------------------------------------------
// Ruta raíz — redirige al login mientras no haya una página de inicio propia
// ---------------------------------------------------------------------------
app.get('/', (_req, res) => {
  res.redirect('/Seguridad/SeguridadPages/SeguridadLogin.html');
});

// ---------------------------------------------------------------------------
// Routers de módulos — se descomentan a medida que se implementan
// ---------------------------------------------------------------------------

// CU-001 a CU-005 — Seguridad
// const SeguridadContenedor = require('./Seguridad/SeguridadContenedor');
// app.use('/api/v1/seguridad', SeguridadContenedor);

// CU-006 a CU-010 — Clientes
// const ClientesContenedor = require('./Clientes/ClientesContenedor');
// app.use('/api/v1/clientes', ClientesContenedor);

// CU-011 a CU-016 — Pedidos
// const PedidosContenedor = require('./Pedidos/PedidosContenedor');
// app.use('/api/v1/pedidos', PedidosContenedor);

// CU-017 a CU-019 — Cancelación
// const CancelacionContenedor = require('./Cancelacion/CancelacionContenedor');
// app.use('/api/v1/cancelacion', CancelacionContenedor);

// CU-020 a CU-023 — Pagos
// const PagosContenedor = require('./Pagos/PagosContenedor');
// app.use('/api/v1/pagos', PagosContenedor);

// CU-024 a CU-028 — Dashboard
// const DashboardContenedor = require('./Dashboard/DashboardContenedor');
// app.use('/api/v1/dashboard', DashboardContenedor);

// ---------------------------------------------------------------------------
// Health-check — útil para verificar que la API está viva
// ---------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Middleware de manejo de errores (SIEMPRE al final, después de las rutas)
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    ok: false,
    mensaje: err.message || 'Error interno del servidor',
  });
});

// ---------------------------------------------------------------------------
// Arranque del servidor
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[app] WTEU API corriendo en http://localhost:${PORT}`);
  console.log(`[app] Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
