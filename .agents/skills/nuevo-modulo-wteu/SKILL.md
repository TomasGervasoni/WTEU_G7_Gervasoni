---
name: nuevo-modulo-wteu
description: Usar esta skill cada vez que haya que crear un módulo desde cero, implementar un caso de uso (CU) que todavía no tiene archivos, agregar un endpoint/página/componente sin ubicación especificada, o cuando el usuario diga cosas como "creá la estructura de X", "implementá el CU-0XX", "agregá el módulo de Y". Aplica siempre junto con las reglas de AGENTS.md.
---

# Skill: Crear / extender un módulo de WTEU

## Cuándo se activa
- El usuario pide implementar un CU puntual (ej. "implementá el CU-017
  solicitar cancelación de pedido").
- El usuario pide crear un módulo que todavía no existe en el proyecto.
- El usuario pide un endpoint, página o componente nuevo sin indicar en
  qué carpeta va.

## Pasos obligatorios

1. **Identificar el módulo.** Usar la tabla de mapeo de `AGENTS.md`
   (sección 6) para saber a qué carpeta pertenece el CU pedido.

2. **Verificar si la carpeta del módulo ya existe.**
   - Si no existe, crear el esqueleto completo antes de escribir código:
     ```
     <Modulo>/
     ├── <Modulo>Contenedor.js
     ├── <Modulo>Pages/
     ├── <Modulo>Components/
     ├── <Modulo>Adapters/
     └── <Modulo>Services/
     ```
   - Si ya existe, agregar los archivos nuevos dentro de las subcarpetas
     existentes, sin reorganizar lo que ya está.

3. **Nombrar todo con el prefijo del módulo.** Ejemplos correctos:
   `PedidosCarritoAdapter.js`, `PedidosGenerarPedidoService.js`,
   `PagosMercadoPagoAdapter.js`. Nunca usar nombres genéricos como
   `controller.js` o `service.js` a secas.

4. **Seguir el flujo documentado.** Si el CU tiene diagrama de secuencia
   en la sección 3.4.x del documento, replicar el mismo orden de llamadas
   al programar: `Page → Adapter → Service → Base de Datos`, incluyendo
   las ramas alternativas (ej. rollback de transacción si falla la
   creación del pedido).

5. **Registrar el router del módulo.** Si `<Modulo>Contenedor.js` es
   nuevo, agregar en `app.js`:
   ```js
   app.use('/api/v1/<modulo-en-minuscula>', require('./<Modulo>/<Modulo>Contenedor'));
   ```
   Si ya estaba registrado, no duplicar la línea.

6. **Si hay HTML de Stitch para pegar.** Cuando el usuario provea el
   HTML/CSS exportado de Stitch para una pantalla, colocarlo tal cual
   dentro de `<Modulo>Pages/<Nombre>.html` (ajustando solo lo necesario
   para que use `window.API_URL`), y separar el JS de interacción/fetch
   en un archivo `.js` hermano — no reescribir el diseño visual sin que
   se pida.

7. **Cerrar con un resumen.** Al terminar, listar en el chat qué archivos
   se crearon o modificaron y a qué CU corresponde cada uno.

## Ejemplo

Pedido del usuario: *"Implementá el alta de cliente."*

→ Módulo: `Clientes` (CU-006, RF-006)
→ Archivos a crear/tocar:
  - `Clientes/ClientesAdapters/ClientesAltaAdapter.js`
  - `Clientes/ClientesServices/ClientesAltaService.js`
  - Ruteo agregado en `Clientes/ClientesContenedor.js`
  - Si no existe: registrar `ClientesContenedor` en `app.js`
