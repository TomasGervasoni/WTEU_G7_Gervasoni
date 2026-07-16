const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

async function seed() {
  let productosInsertados = 0;
  let variantesInsertadas = 0;
  let imagenesInsertadas = 0;

  try {
    const dataPath = path.join(__dirname, '../productos_seed.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const productosSeed = JSON.parse(rawData);

    await pool.query('BEGIN');

    for (const item of productosSeed) {
      if (item.id === 'p038') {
        continue; // Ignorar el producto de prueba
      }

      if (item.name === 'Uniforme corporativo' && item.price === 0) {
        console.log('AVISO: Insertando "Uniforme corporativo" que tiene price=0.');
      }

      // Insertar producto
      const resProducto = await pool.query(
        `INSERT INTO productos (nombre, descripcion, categoria, tipo_tela, precio, activo) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [item.name, item.description, item.seccion, item.tela, item.price, true]
      );
      const productoId = resProducto.rows[0].id;
      productosInsertados++;

      // Insertar variantes
      const talles = Array.isArray(item.talle) ? item.talle.map(t => t.trim()) : [];
      let colores = [];
      if (item.color) {
        colores = Array.isArray(item.color) ? item.color : [item.color];
      }
      
      // Si un producto no tiene colores o talles, la lógica estándar
      // de la app requiere que al menos haya una variante vacía o algo.
      // Pero si el JSON los tiene bien, iteramos sobre el producto cartesiano:
      if (colores.length > 0 && talles.length > 0) {
        for (const color of colores) {
          for (const talle of talles) {
            await pool.query(
              `INSERT INTO producto_variantes (producto_id, color, talle, stock) VALUES ($1, $2, $3, $4)`,
              [productoId, color.trim(), talle, 0]
            );
            variantesInsertadas++;
          }
        }
      } else if (colores.length > 0) {
        for (const color of colores) {
          await pool.query(
            `INSERT INTO producto_variantes (producto_id, color, stock) VALUES ($1, $2, $3)`,
            [productoId, color.trim(), 0]
          );
          variantesInsertadas++;
        }
      } else if (talles.length > 0) {
        for (const talle of talles) {
          await pool.query(
            `INSERT INTO producto_variantes (producto_id, talle, stock) VALUES ($1, $2, $3)`,
            [productoId, talle, 0]
          );
          variantesInsertadas++;
        }
      } else {
        // Sin color ni talle específico
        await pool.query(
          `INSERT INTO producto_variantes (producto_id, stock) VALUES ($1, $2)`,
          [productoId, 0]
        );
        variantesInsertadas++;
      }

      // Insertar imágenes (solo HTTP)
      if (Array.isArray(item.images)) {
        const urlHttp = item.images.filter(url => url.startsWith('http'));
        for (let i = 0; i < urlHttp.length; i++) {
          await pool.query(
            `INSERT INTO producto_imagenes (producto_id, url, es_principal) VALUES ($1, $2, $3)`,
            [productoId, urlHttp[i], i === 0]
          );
          imagenesInsertadas++;
        }
      }
    }

    await pool.query('COMMIT');
    console.log(`\nSeed completado con éxito:`);
    console.log(`- Productos insertados: ${productosInsertados}`);
    console.log(`- Variantes insertadas: ${variantesInsertadas}`);
    console.log(`- Imágenes HTTP insertadas: ${imagenesInsertadas}`);
    process.exit(0);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error durante el seed:', error);
    process.exit(1);
  }
}

seed();
