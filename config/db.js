'use strict';

const { Pool } = require('pg');

// ---------------------------------------------------------------------------
// Pool de conexiones a PostgreSQL
// ---------------------------------------------------------------------------
// Lee TODA la configuración desde variables de entorno.
// En Docker local:  DB_HOST = 'db' (nombre del servicio en docker-compose.yml)
// En Railway:       DATABASE_URL completa o variables DB_* equivalentes
// Nunca hardcodear 'localhost', credenciales ni puertos aquí.
// ---------------------------------------------------------------------------

let pool;

if (process.env.DATABASE_URL) {
  // Railway / Heroku / cualquier provider que entregue una connection string
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // En Railway, SSL suele ser requerido
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
} else {
  // Variables individuales (Docker local y development)
  pool = new Pool({
    host:     process.env.DB_HOST,      // 'db' en Docker, variable en Railway
    port:     parseInt(process.env.DB_PORT || '5432', 10),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
}

// Log mínimo para saber si la conexión fue exitosa al arrancar
pool.on('connect', () => {
  console.log('[db] Nueva conexión al pool de PostgreSQL establecida.');
});

pool.on('error', (err) => {
  console.error('[db] Error inesperado en el pool de PostgreSQL:', err.message);
});

module.exports = pool;
