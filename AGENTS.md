# AGENTS.md — WTEU_G7_Gervasoni

Este archivo se lee SIEMPRE al iniciar cualquier sesión de agente en este workspace.
No es opcional ni depende del pedido puntual del usuario: aplica en el 100% de las tareas.

## 1. Contexto del proyecto

"Web Town Estilo Urbano" (WTEU) es un sistema de e-commerce de indumentaria
personalizada con estampado DTF. Es el Trabajo Práctico Final de la materia
PP3 (Colegio Universitario IES, Analista de Sistemas, Ciclo 2026).

La documentación del proyecto (Word/PDF con Objetivo-Límites-Alcance,
Requerimientos Funcionales RF-001 a RF-033, y Casos de Uso CU-001 a CU-028
con sus diagramas de secuencia/actividad) es la ÚNICA fuente de verdad.
Antes de programar un caso de uso, releé su ficha en la sección 3.4
(Realización de Casos de Uso) del documento: objetivo, precondiciones,
postcondiciones de éxito/fracaso, curso normal y alternativas.

Si el pedido del usuario en el chat contradice lo que dice el documento
para ese CU, el agente debe preguntar antes de improvisar una solución
distinta a la documentada.

## 2. Stack tecnológico obligatorio (NO reemplazar por otro sin permiso explícito)

- **Backend:** Node.js + Express, en JavaScript puro (sin TypeScript).
- **Base de datos:** PostgreSQL, con SQL crudo mediante el pool nativo
  de `pg` (`pool.query('SELECT ...')`). Sin ORM ni query builder
  (nada de Sequelize, Prisma, TypeORM, Knex, etc.) — todas las
  consultas se escriben a mano en los Services.
- **Autenticación:** JWT guardado en cookie httpOnly. En producción
  (Railway, `NODE_ENV=production`): `sameSite: 'none'`, `secure: true`.
  En desarrollo local con Docker (HTTP, sin TLS): `sameSite: 'lax'`,
  `secure: false`, porque los navegadores descartan cookies `secure`
  sobre HTTP plano. Esta rama condicional por `NODE_ENV` va en
  `SeguridadServices.js` (donde se emite la cookie), no se resuelve
  editando `AGENTS.md` cada vez. Prohibido usar localStorage o
  sessionStorage para el token de sesión, en cualquier entorno.
- **Contraseñas:** hasheadas con bcrypt. Nunca texto plano.
- **Frontend:** HTML + CSS + JavaScript vanilla (DOM nativo, `fetch`).
  Sin React, Vue, Angular, Svelte, jQuery, ni ningún framework o
  librería de UI, y sin bundlers/compiladores (Webpack, Vite, Babel).
- **Config de entorno:** usar el switcher `config.js` para localhost vs.
  Railway/Docker, y `window.API_URL` en todo el frontend (nunca URLs
  hardcodeadas, por compatibilidad con GitHub Pages).

Estas 4 tecnologías (HTML, CSS, JavaScript, SQL) más Node/Express son el
límite del stack para todo el proyecto: no agregar ninguna otra
tecnología, lenguaje o librería de frontend/backend sin que el usuario
lo pida explícitamente, ni siquiera con la excusa de que "simplifica"
o "es una buena práctica".

## 3. Entorno de desarrollo local con Docker (OBLIGATORIO)

Todo el entorno local se levanta con `docker compose`, controlado desde
VS Code mientras se desarrolla. No se instala PostgreSQL directamente en
la máquina del usuario: vive únicamente dentro de un contenedor.

Servicios obligatorios en `docker-compose.yml` (raíz del proyecto):

- **`db`**: `postgres:16-alpine`, puerto **`5433:5432`** (mapeo NO
  estándar — el usuario tiene un PostgreSQL 18 nativo corriendo como
  servicio de Windows que ya ocupa el 5432 del host; el contenedor usa
  internamente el 5432 de siempre, `api` se conecta a `db` por nombre
  de servicio sin verse afectado, pero cualquier cliente externo desde
  Windows —DBClient, pgAdmin, `psql` nativo— debe apuntar al puerto
  **5433**), variables `POSTGRES_USER`, `POSTGRES_PASSWORD`,
  `POSTGRES_DB` leídas desde `.env`, volumen nombrado (`wteu_pgdata`)
  para persistir los datos entre reinicios, y un mount de solo lectura
  de un script de inicialización (`db/init.sql`) en
  `/docker-entrypoint-initdb.d/` para crear el esquema (tablas
  `usuarios`, `pedidos`, `pedido_items`, `productos`, etc.) según el
  DER del documento (sección 3.8).
- **`api`**: build desde un `Dockerfile` en la raíz, corre `app.js` con
  Node, expone el puerto `3000:3000`, usa `depends_on: db`, monta el
  código como volumen para hot-reload (`nodemon` en desarrollo) y lee
  sus variables desde `.env`.

Reglas:
1. `config/db.js` debe leer la conexión desde variables de entorno
   (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, o una
   `DATABASE_URL` completa) — nunca hardcodear `localhost` ni
   credenciales. En Docker, `DB_HOST` va a ser el nombre del servicio
   (`db`), no `localhost`.
2. El mismo `config/db.js` debe servir tanto para Docker local como
   para Railway en producción, cambiando solo las variables de entorno
   (no el código).
3. `.env` (con valores reales) va en `.gitignore`. `.env.example` sí se
   versiona, con los nombres de variable sin valores sensibles.
4. Comandos estándar de trabajo diario (documentar en el `README.md`):
   - `docker compose up -d` → levanta `db` y `api` en segundo plano
   - `docker compose logs -f api` → ver logs de la app en vivo
   - `docker compose down` → apagar todo (los datos de Postgres
     persisten gracias al volumen)
   - `docker compose down -v` → apagar y borrar también los datos
     (reinicio limpio de la base)
   - `docker exec -it wteu_db psql -U wteu_user -d wteu_db` → conectarse
     a la base desde la terminal sin depender de un cliente gráfico
     (útil si DBClient/pgAdmin tienen problemas de puerto, ver más abajo)
6. Watch de nodemon en Windows: los bind mounts de Docker Desktop no
   siempre propagan bien los eventos de archivo. Configurado con
   `CHOKIDAR_USEPOLLING=true` (docker-compose.yml) + `legacyWatch: true`
   (`nodemon.json`) para que los cambios se detecten de forma confiable
   sin necesidad de `docker compose restart api` manual.
7. Cualquier cambio de estructura de tablas (nueva migración) se agrega
   como un script nuevo versionado en `db/` (ej. `db/migrations/002_...
   .sql`), nunca editando a mano los datos ya persistidos en el
   volumen.

## 4. Estructura de carpetas OBLIGATORIA (no negociable)

```
WTEU_G7_Gervasoni/
├── docker-compose.yml         (servicios db + api, ver sección 3)
├── Dockerfile                 (imagen del servicio api)
├── .env                       (NO versionado — variables reales)
├── .env.example                (versionado — nombres de variable sin valores)
├── db/
│   ├── init.sql                (esquema inicial, montado en el contenedor db)
│   └── migrations/             (scripts de cambios posteriores, versionados)
├── app.js                     (composición raíz global: monta todos los Contenedor.js)
├── config/
│   ├── config.js              (switcher localhost/Railway)
│   └── db.js                  (pool de PostgreSQL, lee variables de entorno)
│
├── Seguridad/
│   ├── SeguridadContenedor.js
│   ├── SeguridadPages/
│   │   ├── SeguridadLogin.html
│   │   ├── SeguridadLogin.js
│   │   ├── SeguridadRegistro.html
│   │   └── SeguridadRegistro.js
│   ├── SeguridadComponents/
│   │   └── SeguridadComponents.js
│   ├── SeguridadAdapters/
│   │   └── SeguridadAdapters.js
│   └── SeguridadServices/
│       └── SeguridadServices.js
│
├── Clientes/
│   ├── ClientesContenedor.js
│   ├── ClientesPages/
│   ├── ClientesComponents/
│   ├── ClientesAdapters/
│   └── ClientesServices/
│
├── Pedidos/
│   ├── PedidosContenedor.js
│   ├── PedidosPages/
│   ├── PedidosComponents/
│   ├── PedidosAdapters/
│   └── PedidosServices/
│
├── Cancelacion/
│   ├── CancelacionContenedor.js
│   ├── CancelacionPages/
│   ├── CancelacionComponents/
│   ├── CancelacionAdapters/
│   └── CancelacionServices/
│
├── Pagos/
│   ├── PagosContenedor.js
│   ├── PagosPages/
│   ├── PagosComponents/
│   ├── PagosAdapters/
│   └── PagosServices/
│
└── Dashboard/
    ├── DashboardContenedor.js
    ├── DashboardPages/
    ├── DashboardComponents/
    ├── DashboardAdapters/
    └── DashboardServices/
```

## 5. Responsabilidad de cada capa dentro de un módulo

- **`<Modulo>Contenedor.js`**: composition root del módulo. Crea el
  `express.Router()`, importa los Adapters, conecta cada Adapter a su ruta
  HTTP (`GET/POST/PUT/DELETE`) y exporta el router. `app.js` lo monta con
  `app.use('/api/v1/<modulo-en-minuscula>', <Modulo>Contenedor)`.
  **No contiene lógica de negocio ni queries SQL.**
- **`<Modulo>Adapters/`**: controladores HTTP. Reciben `req/res`, validan
  el shape del payload de entrada, llaman al Service correspondiente y
  traducen el resultado a una respuesta HTTP (status code + JSON).
  **No acceden directamente a la base de datos.**
- **`<Modulo>Services/`**: lógica de negocio / casos de uso puros. Reciben
  datos ya validados, ejecutan las reglas descriptas en la ficha del CU
  (transacciones, validaciones de stock, hasheo de contraseña, etc.) y son
  responsables del acceso a PostgreSQL. **No conocen Express ni objetos
  `req/res`.**
- **`<Modulo>Pages/`**: páginas HTML del módulo + su JS de página
  (validación de formularios, `fetch` contra la API vía `window.API_URL`).
- **`<Modulo>Components/`**: piezas de UI reutilizables dentro del módulo,
  usadas por más de una Page (ej. tarjeta de producto, modal de
  confirmación, selector de talle/color).

## 6. Reglas estrictas

1. Antes de crear un archivo, identificar a qué módulo pertenece el CU
   (ver tabla de mapeo abajo) y ubicarlo ahí. Nunca crear archivos sueltos
   en la raíz ni en carpetas nuevas fuera de este esquema.
2. Nunca mezclar capas: una query SQL va en un Service, nunca en un
   Adapter ni en una Page.
3. Un Adapter solo llama a Services de su propio módulo. Si un módulo
   necesita datos de otro módulo, se debe importar explícitamente la
   función exportada del Service ajeno y dejar un comentario
   `// cross-module: <motivo>` explicando por qué.
4. Todo endpoint que requiera sesión iniciada debe pasar por el
   middleware de autenticación ubicado en `Seguridad/SeguridadServices/`.
5. Nombrar cada archivo nuevo con el prefijo del módulo
   (ej. `PedidosCarritoAdapter.js`, nunca `carritoAdapter.js` a secas).
6. Al implementar un CU, citar su ID en el mensaje de respuesta
   (ej. "Implementando CU-013 Generar Pedido") y respetar el curso normal
   + los flujos alternativos tal como están descriptos en el documento.
7. Nunca proponer instalar PostgreSQL de forma nativa ni correr `node
   app.js` fuera de Docker como flujo de trabajo estándar — el flujo
   soportado es `docker compose up -d` (ver sección 3). Scripts de
   `package.json` (`npm run dev`, etc.) pueden existir para debugging
   puntual, pero el contenedor `api` es la fuente de verdad.
8. Los estados de Pedido (`pendiente → confirmado → en_preparacion →
   enviado → entregado`, y el estado final `cancelado`) deben validarse
   según el diagrama de estados del documento antes de aplicar cualquier
   transición.

## 7. Mapeo de módulos (según la documentación)

| Carpeta        | Módulo (doc.)                     | CUs             |
|-----------------|-----------------------------------|-----------------|
| Seguridad       | Control de Acceso y Seguridad     | CU-001 a CU-005 |
| Clientes        | Administración de Clientes        | CU-006 a CU-010 |
| Pedidos         | Gestión de Pedidos                | CU-011 a CU-016 |
| Cancelacion     | Cancelación de Pedidos            | CU-017 a CU-019 |
| Pagos           | Pagos                             | CU-020 a CU-023 |
| Dashboard       | Reportería y Dashboard            | CU-024 a CU-028 |

## 8. Pendientes conocidos (no resolver salvo pedido explícito)

- Confirmación automática de pago vía webhook de MercadoPago
  (actualmente el pedido no cambia de estado solo con la notificación).
- Módulos evolutivos "Gestión de Insumos" y "Producción" (CU-E01 a
  CU-E08) están fuera de alcance de esta versión — no crear sus carpetas
  a menos que el usuario lo pida.
