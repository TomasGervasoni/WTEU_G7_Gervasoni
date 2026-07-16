const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

async function seedImagenesLocales() {
  let imagenesInsertadas = 0;

  try {
    const dataPath = path.join(__dirname, '../productos_seed.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const productosSeed = JSON.parse(rawData);

    await pool.query('BEGIN');

    for (const item of productosSeed) {
      if (item.id === 'p038') {
        continue;
      }

      if (Array.isArray(item.images)) {
        // Encontrar imágenes locales en el JSON
        const locales = item.images.filter(url => url.startsWith('./imagenes/'));
        if (locales.length === 0) continue;

        // Obtener el ID del producto por nombre (ya que p038 fue ignorado en el seed inicial, el nombre es la clave)
        const resProducto = await pool.query('SELECT id FROM productos WHERE nombre = $1', [item.name]);
        if (resProducto.rows.length === 0) continue; // Si no existe (ej. falló el seed anterior o es un caso raro)
        
        const productoId = resProducto.rows[0].id;

        // Revisar cuántas imágenes tiene actualmente para saber si asignamos es_principal
        const resCount = await pool.query('SELECT COUNT(*) AS total FROM producto_imagenes WHERE producto_id = $1', [productoId]);
        const tieneImagenes = parseInt(resCount.rows[0].total, 10) > 0;

        for (let i = 0; i < locales.length; i++) {
          // Convertir './imagenes/x.jpeg' a '/imagenes/x.jpeg'
          const urlRelativa = locales[i].replace('./imagenes/', '/imagenes/');
          
          // Si no tenía imágenes previas, la primera local es la principal. Si ya tenía HTTP, las locales no son principales.
          const esPrincipal = (!tieneImagenes && i === 0);

          await pool.query(
            `INSERT INTO producto_imagenes (producto_id, url, es_principal) VALUES ($1, $2, $3)`,
            [productoId, urlRelativa, esPrincipal]
          );
          imagenesInsertadas++;
        }
      }
    }

    await pool.query('COMMIT');
    console.log(`\nSeed de imágenes locales completado con éxito:`);
    console.log(`- Imágenes locales insertadas: ${imagenesInsertadas}`);
    process.exit(0);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error durante el seed de imágenes locales:', error);
    process.exit(1);
  }
}

seedImagenesLocales();
