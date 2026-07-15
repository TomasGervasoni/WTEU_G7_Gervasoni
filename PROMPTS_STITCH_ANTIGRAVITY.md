# Guía de prompts — Stitch (diseño) → Antigravity (código)

Cómo instalar lo anterior:
1. `AGENTS.md` va en la **raíz** del repo (`WTEU_G7_Gervasoni/AGENTS.md`).
2. `SKILL.md` va en `WTEU_G7_Gervasoni/.agents/skills/nuevo-modulo-wteu/SKILL.md`
   (respetá el nombre de carpeta exacto, es lo que usa Antigravity para
   indexar la skill).
3. Abrí el proyecto en Antigravity y arrancá con el modo
   **"Review-driven development"** (revisa antes de tocar la DB o hacer
   commits grandes) — es el más razonable para un TP que vas a defender.

Estado actual (referencia rápida): las 11 pantallas de Stitch ya están
diseñadas, exportadas y pegadas como `.html` en su carpeta correspondiente
según AGENTS.md. Las 4 pantallas de administración (Productos, Pedidos,
Clientes, Dashboard) ya comparten el mismo sidebar estándar. La Parte 1
de este documento queda como **historial** de qué se le pidió a Stitch
y por qué (útil para la memoria del TP y para el informe de auditoría);
si necesitás una pantalla nueva más adelante, la Parte 1 te sirve de
referencia de estilo. La Parte 2 es la que usás **ahora** para seguir
con Antigravity.

---

## PARTE 0 — Estándar de administración (vigente, no volver a tocar salvo necesidad)

Todas las pantallas donde entra el administrador (`Pedidos/PedidosPages/PedidosAdminListado.html`,
`Pedidos/PedidosPages/PedidosAdminProductos.html`,
`Clientes/ClientesPages/ClientesAdminListado.html`,
`Dashboard/DashboardPages/DashboardAdmin.html`) comparten:

- **Sidebar fijo a la izquierda**: "ADMIN" + "Panel de Control" arriba,
  menú vertical (Resumen, Productos, Pedidos, Clientes, Reportes) con el
  ítem activo resaltado en verde, y abajo "Configuración" / "Salir"
  separados por una línea.
- Cada pantalla resalta su propio ítem: Productos → "Productos",
  PedidosAdminListado → "Pedidos", ClientesAdminListado → "Clientes",
  DashboardAdmin → "Resumen".

Filtros/búsqueda ya incorporados a cada pantalla:
- **Productos**: barra de búsqueda con lupa (filtra por nombre) + botón
  "Nuevo producto".
- **Pedidos admin**: tabs "Esta semana" / "Este mes" / "Todos los
  pedidos" + barra de búsqueda con lupa (por número de pedido o nombre
  de cliente).
- **Clientes admin**: barra de búsqueda con lupa (por nombre, usuario o
  email) + botón "Nuevo cliente", drawer lateral de "Ver historial" y
  modal de "Editar".

Si en el futuro agregás una pantalla admin nueva, replicá este mismo
sidebar desde el arranque (pedíselo a Stitch citando esta sección como
referencia) en vez de generar un navbar propio.

---

## PARTE 1 — Prompts para Stitch (diseño de interfaces) — HISTORIAL

### 1.0 Prompt base de sistema de diseño

```
Quiero crear un sistema de diseño consistente para un e-commerce de
indumentaria personalizada llamado "Town Estilo Urbano". Estilo: urbano,
moderno, minimalista, con acentos oscuros. Header/navbar en azul marino
muy oscuro casi negro (#0f1420 aprox) con texto blanco. Fondo general
blanco/gris muy claro. Tarjetas de producto con bordes sutiles y sombra
suave. Botón primario oscuro (mismo tono que el navbar) con texto
blanco, esquinas ligeramente redondeadas. Botón de acción positiva en
verde (para WhatsApp/confirmaciones). Tipografía sans-serif limpia,
tamaños generosos en títulos. Debe verse bien tanto en desktop como en
mobile (diseño responsive). Guardá esto como sistema de diseño base
para reutilizar en las próximas pantallas que te voy a pedir.
```

### 1.1 Módulo Seguridad — Login y Registro

```
Diseñá 2 pantallas web responsive para "Town Estilo Urbano" usando el
mismo sistema de diseño:

1) Pantalla de "Registro": título "Registro", campos Usuario, Nombre,
Email, Contraseña, botón oscuro "Crear cuenta", link "Ya tenés cuenta?
Ingresar" y link "Volver a la tienda". Debe soportar mostrar un mensaje
de error debajo del botón (ej. "El usuario o email ya existe").

2) Pantalla de "Ingresar" (login): título "Ingresar", campos Usuario y
Contraseña, botón oscuro "Ingresar", link "No tenés cuenta? Registrate"
y link "Volver a la tienda". Debe soportar mostrar un mensaje de error
genérico ("Usuario o contraseña incorrectos").

Ambas centradas en una tarjeta blanca sobre fondo gris claro.
```

### 1.2 Módulo Pedidos — Catálogo, Detalle de producto y Carrito

```
Diseñá 3 pantallas web responsive para el catálogo de "Town Estilo
Urbano", usando el mismo sistema de diseño:

1) "Catálogo": navbar oscura con logo "Town Estilo Urbano" y links
(Todos, Niños/as, Hombre, Mujer, Personalizado, Empresas), botón
"Filtros", ícono de usuario e ícono de carrito con contador. Debajo un
banner grande de marca. Grid de tarjetas de producto (imagen, nombre,
precio) con 30 resultados. Sidebar de filtros con checkboxes de
categoría, selector de color (círculos de color), checkboxes de tipo de
tela, y rango de precio (min/máx) con botones Aplicar/Limpiar.

2) "Detalle de producto": galería de imágenes con miniaturas a la
izquierda, a la derecha nombre del producto, descripción corta, datos
de corte y tela, selector de color (círculos), selector de talle
(botones S/M/L/XL/2XL), precio grande, botón oscuro "Agregar al
carrito" y un texto de confirmación "Listo para agregar al carrito".

3) "Carrito": lista de ítems (imagen, nombre, color/talle, precio,
botón eliminar, selector de cantidad +/-) y a la derecha un resumen con
el total y un botón oscuro "Finalizar Compra". Link "Seguir comprando"
arriba.
```

### 1.3 Módulo Pedidos — Checkout y "Mis pedidos"

```
Diseñá 2 pantallas web responsive para "Town Estilo Urbano", mismo
sistema de diseño:

1) "Finalizar compra": a la izquierda un resumen del pedido (ítem,
color/talle, cantidad, subtotal, total). A la derecha un formulario
"Datos del cliente" con Nombre y apellido, CUIL, WhatsApp, Correo,
Dirección, Código postal, botón oscuro "Confirmar y Pagar" y botón
secundario "Volver al carrito".

2) "Mis pedidos": navbar con "Tienda", título "Mis pedidos" y link
"Salir" a la derecha. Debajo, una lista de tarjetas de pedido, cada una
con número de pedido, badge de estado (pendiente/confirmado/en
preparación/enviado/entregado/cancelado con colores distintos por
estado), total, lista de ítems, y un botón verde "Pagar con Mercado
Pago" cuando el estado es "pendiente".
```

### 1.4 Módulo Pedidos — Panel de administración (Pedidos y Productos)

```
Diseñá 2 pantallas de panel de administración web (desktop, densidad de
información media) para "Town Estilo Urbano", mismo sistema de diseño
pero versión "admin" con navbar oscura que dice "Admin" y link "Salir":

1) "Pedidos (admin)": título "Pedidos", lista de tarjetas de pedido
mostrando número de pedido, badge de estado, datos del cliente (nombre,
teléfono, email, dirección), total, ítems del pedido, un select con los
estados posibles (pendiente, confirmado, en_preparacion, enviado,
entregado, cancelado), botón "Cambiar estado" y botón rojo "Eliminar".

2) "Gestión de productos": tabla o grid de productos con miniatura,
nombre, precio, estado (activo/inactivo), y un pequeño gestor de
imágenes por producto (miniaturas con botón de eliminar por imagen y
botón "Subir imagen"). Botón oscuro "Nuevo producto" arriba a la
derecha.
```

### 1.4.1 Edición — búsqueda en Productos y tabs + búsqueda en Pedidos

```
Editá las 2 pantallas de admin que generaste antes ("Pedidos (admin)" y
"Gestión de productos"), manteniendo el mismo sistema de diseño, con
estos cambios:

1) En "Gestión de productos": agregá una barra de búsqueda con ícono de
lupa arriba de la tabla/grid, con placeholder "Buscar producto por
nombre...", ubicada a la izquierda del botón "Nuevo producto" (que
sigue arriba a la derecha).

2) En "Pedidos (admin)": separá el listado en 3 pestañas (tabs)
horizontales arriba del título "Pedidos": "Esta semana", "Este mes" y
"Todos los pedidos", con la pestaña activa resaltada en el mismo tono
oscuro del navbar. Debajo de las tabs va el listado de tarjetas de
pedido que ya tenías, filtrado según la pestaña seleccionada. Al lado
de las tabs, a la derecha, agregá también una barra de búsqueda con
lupa para buscar pedido por número o por nombre de cliente.
```

### 1.5 Módulo Clientes — panel admin

```
Diseñá 1 pantalla de panel de administración web (desktop, densidad de
información media) para "Town Estilo Urbano", mismo sistema de diseño,
versión admin (navbar oscura que dice "Admin" y link "Salir"):

"Clientes (admin)": título "Clientes", barra de búsqueda con ícono de
lupa arriba a la izquierda (placeholder "Buscar cliente por nombre,
usuario o email...") y botón oscuro "Nuevo cliente" arriba a la
derecha. Debajo, una tabla con columnas: Nombre, Usuario, Email,
Estado (badge activo/inactivo), y una columna de acciones con 3
íconos/botones pequeños: "Ver historial", "Editar" y "Dar de baja"
(este último en rojo).

Al hacer click en "Ver historial" se abre un panel lateral (drawer)
desde la derecha mostrando: datos del cliente arriba, y debajo la
lista de sus pedidos (número de pedido, fecha, total, badge de
estado), igual al estilo de las tarjetas de pedido que ya usamos en
"Pedidos (admin)".

Al hacer click en "Editar" se abre un modal con el formulario de datos
del cliente (Nombre, Usuario, Email) y botones "Guardar cambios" /
"Cancelar".
```

### 1.6 Módulo Dashboard

```
Diseñá una pantalla de "Dashboard" para el panel admin de "Town Estilo
Urbano", mismo sistema de diseño, versión admin: 4 tarjetas de KPI
arriba (Ventas del mes, Pedidos totales, Clientes registrados, Pagos
validados) con número grande e ícono. Debajo, dos gráficos: uno de
barras (ventas por mes) y uno de torta (pedidos por estado). Al costado
un botón "Exportar reportes a Excel".
```

### 1.7 Módulo Cancelación

```
Diseñá una pantalla web para que un cliente autenticado vea el detalle
de un pedido y pueda solicitar su cancelación, mismo sistema de diseño:
tarjeta con datos del pedido, botón "Solicitar cancelación", y al
hacer click un modal de confirmación con un campo opcional de motivo y
botones "Confirmar solicitud" / "Cancelar".
```

### 1.8 Estandarización de sidebar admin (multi-select)

```
[Aplicado con Shift+click sobre las 4 pantallas admin: Gestión de
productos, Pedidos (admin), Clientes (admin), Dashboard]

Reemplazá el navbar/header que tiene cada una de estas 4 pantallas por
un sidebar de navegación fijo a la izquierda, idéntico en las 4,
compuesto por:

- Arriba: título "ADMIN" en negrita, y debajo "Panel de Control" como
  subtítulo, en gris.
- Debajo, un menú vertical con ícono + texto para cada ítem, en este
  orden: "Resumen", "Productos", "Pedidos", "Clientes", "Reportes".
- El ítem correspondiente a la pantalla actual debe quedar resaltado
  con fondo verde y esquinas redondeadas.
- Abajo del todo del sidebar, separado por una línea divisoria: ícono +
  texto "Configuración" y debajo ícono + texto "Salir".
- El sidebar debe tener un fondo con un degradé sutil de un tono oscuro
  arriba hacia blanco/gris claro abajo.

Ajustá el contenido de cada pantalla para que ocupe el espacio restante
a la derecha del sidebar. No cambies nada del contenido interno de cada
pantalla.
```

### Mapeo final pantalla Stitch → archivo del repo

| Pantalla de Stitch | Archivo |
|---|---|
| Registro | `Seguridad/SeguridadPages/SeguridadRegistro.html` |
| Login | `Seguridad/SeguridadPages/SeguridadLogin.html` |
| Catálogo | `Pedidos/PedidosPages/PedidosCatalogo.html` |
| Detalle de producto | `Pedidos/PedidosPages/PedidosDetalleProducto.html` |
| Carrito | `Pedidos/PedidosPages/PedidosCarrito.html` |
| Checkout | `Pedidos/PedidosPages/PedidosCheckout.html` |
| Mis pedidos (cliente) | `Pedidos/PedidosPages/PedidosMisPedidos.html` |
| Pedidos (admin) | `Pedidos/PedidosPages/PedidosAdminListado.html` |
| Gestión de productos (admin) | `Pedidos/PedidosPages/PedidosAdminProductos.html` |
| Clientes (admin) | `Clientes/ClientesPages/ClientesAdminListado.html` |
| Dashboard (admin) | `Dashboard/DashboardPages/DashboardAdmin.html` |
| Solicitud de cancelación | `Cancelacion/CancelacionPages/CancelacionSolicitud.html` |

---

## PARTE 2 — Prompts para Antigravity (construcción del código) — USAR AHORA

Encará esto en orden: **Seguridad → Clientes → Pedidos → Cancelación →
Pagos → Dashboard**, porque cada módulo depende de que el anterior ya
tenga su capa de Servicios lista (ej. Pedidos necesita el middleware de
sesión de Seguridad).

### 2.0 Prompt inicial — esqueleto + entorno Docker (una sola vez, al abrir el proyecto)

```
Este es el proyecto WTEU_G7_Gervasoni. Ya coloqué AGENTS.md en la raíz
y la skill nuevo-modulo-wteu en .agents/skills/. Leé ambos archivos
completos antes de hacer nada, en especial la sección 3 (Entorno de
desarrollo local con Docker). Las 11 pantallas HTML exportadas de
Stitch ya están pegadas en sus carpetas correspondientes según la
tabla de mapeo del documento PROMPTS_STITCH_ANTIGRAVITY.md — no las
regeneres, tomalas como base visual fija.

Necesito que armes el esqueleto inicial del proyecto, corriendo TODO
sobre Docker (nunca instalación nativa de PostgreSQL ni node app.js
suelto como flujo de trabajo estándar):

1) `docker-compose.yml` en la raíz con 2 servicios:
   - `db`: imagen postgres:16-alpine, puerto 5432:5432, variables
     POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB desde .env, volumen
     nombrado wteu_pgdata para persistencia, y un mount de solo lectura
     de db/init.sql en /docker-entrypoint-initdb.d/.
   - `api`: build desde un Dockerfile propio, puerto 3000:3000,
     depends_on db, con nodemon para hot-reload montando el código como
     volumen, leyendo variables desde .env.

2) `Dockerfile` para el servicio api: Node LTS, instala dependencias
   con npm, corre nodemon en modo desarrollo.

3) `db/init.sql`: script de creación de las tablas según el modelo de
   datos lógico (DER) de la documentación (usuarios, pedidos,
   pedido_items, productos, y las tablas que hagan falta para
   Cancelación y Pagos si el DER las contempla), con las cardinalidades
   y ON DELETE CASCADE donde corresponda tal como está documentado.

4) `config/db.js`: pool de PostgreSQL (biblioteca `pg`) que lea host,
   puerto, usuario, contraseña y nombre de base desde variables de
   entorno — en Docker el host va a ser el nombre del servicio (`db`),
   nunca `localhost` hardcodeado. El mismo archivo debe servir también
   para producción en Railway solo cambiando las variables de entorno.

5) `config/config.js`: switcher de `window.API_URL` para
   localhost/Railway en el frontend.

6) `package.json` con Express, pg, bcrypt, jsonwebtoken, cookie-parser,
   cors, dotenv, y nodemon como devDependency.

7) `app.js` como composition root: cookie-parser, cors configurado para
   cookies cross-domain (credentials: true), middleware de manejo de
   errores, y placeholders para montar cada Contenedor.js de los
   módulos a medida que los vayamos creando.

8) `.env.example` con todas las variables necesarias (nombres, sin
   valores reales) y confirmá que `.env` y `node_modules` estén en
   `.gitignore`.

No implementes todavía ningún módulo funcional, solo el esqueleto base.
Al terminar, mostrame el árbol de carpetas resultante y decime
exactamente qué comando tengo que correr en la terminal de VS Code
para levantar todo (`docker compose up -d` o el que corresponda) y
cómo verifico que la base de datos ya tiene las tablas creadas.
```

A partir de acá, con VS Code abierto en paralelo: levantás `docker
compose up -d` una vez al empezar a trabajar, y lo dejás corriendo en
segundo plano mientras Antigravity va implementando cada módulo — no
hace falta reiniciar el contenedor entre módulos (nodemon recarga solo,
y las tablas ya están creadas desde el arranque).

### 2.1 Módulo Seguridad (CU-001 a CU-005)

```
Vamos a implementar el módulo Seguridad completo: CU-001 (Registrar
Usuario), CU-002 (Iniciar Sesión), CU-003 (Cerrar Sesión), CU-004
(Recuperar contraseña) y CU-005 (Gestionar roles y permisos).

Fuente de verdad: la ficha de cada CU en la sección 3.4 del documento
(objetivo, precondiciones, postcondiciones, curso normal y
alternativas) — ya te lo compartí antes, usalo tal cual, no inventes
reglas nuevas.

El HTML exportado de Stitch ya está en:
- Seguridad/SeguridadPages/SeguridadLogin.html
- Seguridad/SeguridadPages/SeguridadRegistro.html

Tomá ese HTML como base visual (no lo rediseñes) y agregale el JS de
página necesario (SeguridadLogin.js / SeguridadRegistro.js) para que
haga fetch contra la API usando window.API_URL.

Del lado backend, implementá:
- SeguridadServices: hasheo con bcrypt, generación/verificación de JWT,
  middleware de autenticación (requireAuth) y de autorización por rol
  (requireRole), y la lógica de recuperación de contraseña.
- SeguridadAdapters: controladores para POST /registro, POST
  /autenticacion, GET /logout, POST /recuperar-password.
- SeguridadContenedor.js: el router con esas rutas montadas.

Recordá: el token va en cookie httpOnly (sameSite: 'none', secure:
true), nunca en localStorage. El mensaje de error de login debe ser
genérico (no distinguir usuario inexistente de contraseña incorrecta).

Registrá el router en app.js. Al terminar, resumime qué archivos
creaste y qué CU cubre cada uno.
```

### 2.2 Módulo Clientes (CU-006 a CU-010)

```
Implementá el módulo Clientes completo: CU-006 (Dar de alta cliente),
CU-007 (Modificar datos), CU-008 (Consultar cliente), CU-009 (Dar de
baja cliente) y CU-010 (Consultar historial de pedidos).

Usá las fichas de esos CU del documento como fuente de verdad. El alta
de cliente ocurre automáticamente cuando un usuario se registra en
Seguridad (rol "cliente") — este módulo gestiona los datos adicionales
del cliente y su consulta/edición/baja lógica por parte del admin.

El HTML de la pantalla admin ya está en:
- Clientes/ClientesPages/ClientesAdminListado.html

Esta pantalla incluye: barra de búsqueda con lupa (nombre/usuario/
email — CU-008 con filtro), botón "Nuevo cliente" (CU-006), un drawer
lateral de "Ver historial" (CU-010, historial de pedidos del cliente —
para esto vas a necesitar cross-module con PedidosServices; poné el
comentario `// cross-module` correspondiente) y un modal de "Editar"
(CU-007). El botón "Dar de baja" en rojo es CU-009 (baja lógica, no
DELETE físico).

Tomá ese HTML como base visual y agregale el JS de página
(ClientesAdminListado.js) para que haga fetch a la API vía
window.API_URL. Todos los endpoints de este módulo requieren
requireAuth + requireRole('administrador') de Seguridad/
SeguridadServices, excepto los que el propio cliente consulta sobre sí
mismo (si los hubiera).

Estructura: ClientesContenedor.js, ClientesAdapters/, ClientesServices/,
ClientesComponents/ (si hace falta extraer el drawer o el modal como
componente reutilizable). Registrá el router en app.js y resumí los
archivos creados por CU.
```

### 2.3 Módulo Pedidos (CU-011 a CU-016)

```
Implementá el módulo Pedidos completo: CU-011 (Visualizar catálogo),
CU-012 (Agregar al carrito), CU-013 (Generar pedido), CU-014 (Consultar
estado de pedido), CU-015 (Listar pedidos - admin) y CU-016 (Actualizar
estado de pedido - admin).

El HTML de Stitch ya está en:
- Pedidos/PedidosPages/PedidosCatalogo.html
- Pedidos/PedidosPages/PedidosDetalleProducto.html
- Pedidos/PedidosPages/PedidosCarrito.html
- Pedidos/PedidosPages/PedidosCheckout.html
- Pedidos/PedidosPages/PedidosMisPedidos.html
- Pedidos/PedidosPages/PedidosAdminListado.html
- Pedidos/PedidosPages/PedidosAdminProductos.html

Tomalos como base visual y agregales el JS de página correspondiente.

Notas sobre la pantalla PedidosAdminListado.html: tiene 3 tabs ("Esta
semana", "Este mes", "Todos los pedidos") — es una variante de CU-015,
no un CU nuevo: el filtro es un WHERE sobre `creado_en` en
PedidosServices (esta semana / este mes / sin filtro de fecha). También
tiene una barra de búsqueda por número de pedido o nombre de cliente —
mismo Service, filtro adicional opcional.

Notas sobre PedidosAdminProductos.html: tiene una barra de búsqueda por
nombre de producto — variante de CU-011 del lado admin, mismo Service
de catálogo con filtro de texto.

Reglas clave del documento a respetar:
- El carrito de un visitante no autenticado persiste solo en el
  navegador; al iniciar sesión se sincroniza con el servidor
  (pullFromServer al loguearse, no pushFromServer — cuidado con este
  bug ya detectado antes en el proyecto).
- CU-013 debe usar una transacción real (BEGIN/COMMIT/ROLLBACK): crea
  el pedido en estado "pendiente", inserta los pedido_items
  desnormalizando nombre/imagen/precio del producto, y vacía el
  carrito solo si todo salió bien.
- CU-016 debe validar que la transición de estado sea válida según el
  diagrama de estados del documento (entregado y cancelado son
  finales, no admiten nuevas transiciones).
- Solo administrador puede usar CU-015 y CU-016.

Estructura: PedidosContenedor.js, PedidosAdapters/, PedidosServices/,
PedidosComponents/ (para la tarjeta de producto reutilizable entre
catálogo y otras vistas). Registrá el router en app.js y resumí los
archivos creados por CU.
```

### 2.4 Módulo Cancelación (CU-017 a CU-019)

```
Implementá el módulo Cancelación completo: CU-017 (Solicitar
cancelación), CU-018 (Aprobar cancelación) y CU-019 (Rechazar
cancelación).

Usá el diagrama de estados de Cancelación del documento: el estado
"Solicitada" es transitorio y siempre evoluciona a "Aprobada" (el
pedido pasa a "Cancelado") o "Rechazada" (el pedido sigue en su estado
previo). Esto depende del módulo Pedidos, así que importá desde ahí
solo lo estrictamente necesario (la función de cambiar estado del
pedido) y dejá el comentario cross-module correspondiente, tal como
indica AGENTS.md.

El HTML de Stitch ya está en:
- Cancelacion/CancelacionPages/CancelacionSolicitud.html

Tomalo como base visual y agregale el JS de página.

Estructura: CancelacionContenedor.js, CancelacionAdapters/,
CancelacionServices/. Registrá el router en app.js.
```

### 2.5 Módulo Pagos (CU-020 a CU-023)

```
Implementá el módulo Pagos completo: CU-020 (Registrar pago manual),
CU-021 (Procesar y validar pago online con MercadoPago), CU-022
(Validar pago) y CU-023 (Consultar historial de pagos).

CU-021 es el más sensible: seguí exactamente el diagrama de secuencia
del documento (crear preferencia → redirigir a MercadoPago → recibir
webhook → validar notificación → actualizar estado del pedido a
"confirmado" si se aprueba). Usá las credenciales de test de
MercadoPago desde variables de entorno, nunca hardcodeadas. Ya se sacó
el parámetro auto_return anteriormente para evitar el error conocido
de MercadoPago sandbox — no lo vuelvas a agregar.

Nota: la confirmación automática vía webhook es un pendiente conocido
del proyecto (está anotado en AGENTS.md) — si no tenés el endpoint de
webhook resuelto todavía, dejalo con un TODO explícito y avisame, no lo
simules como si funcionara.

Estructura: PagosContenedor.js, PagosAdapters/, PagosServices/
(acá va el cliente de la API de MercadoPago). Registrá el router en
app.js.
```

### 2.6 Módulo Dashboard (CU-024 a CU-028)

```
Implementá el módulo Dashboard completo: CU-024 (Visualizar dashboard),
CU-025 (Reporte de ventas), CU-026 (Reporte de pedidos), CU-027
(Reporte de clientes) y CU-028 (Exportar reportes a Excel).

Todos los endpoints requieren rol administrador. Para CU-028 generá el
archivo Excel en el backend (biblioteca liviana tipo exceljs) y
devolvelo como descarga.

El HTML de Stitch ya está en:
- Dashboard/DashboardPages/DashboardAdmin.html

Tomalo como base visual y conectale los gráficos a los datos reales
agregados desde PedidosServices, PagosServices y ClientesServices
(import explícito cross-module, con el comentario correspondiente).

Estructura: DashboardContenedor.js, DashboardAdapters/,
DashboardServices/. Registrá el router en app.js.
```

### 2.7 Prompt de cierre / integración final

```
Ya están los 6 módulos armados. Revisá app.js: confirmá que los 6
Contenedor.js estén montados, que el orden de middlewares sea correcto
(cookie-parser y cors ANTES de las rutas), y hacé un repaso general de
que ningún Adapter tenga lógica de negocio ni ningún Service conozca
req/res, según lo que dice AGENTS.md. Listame cualquier violación que
encuentres antes de corregirla vos mismo.
```

---

## Tips generales

- **Cuota gratuita:** hacé un módulo por sesión de Antigravity y revisá
  el resultado antes de pasar al siguiente.
- **Modo de autonomía:** usá "Review-driven development" al menos hasta
  terminar Seguridad y Pedidos (son los más críticos para la defensa del
  TP). Podés pasar a un modo más autónomo para Dashboard.
- Si Antigravity se desvía de la estructura de carpetas en algún
  momento, no se lo corrijas manualmente vos: decile "revisá AGENTS.md,
  esto no respeta la estructura obligatoria" y dejá que lo arregle él
  mismo.
- **Flujo con Docker + VS Code:** dejá una terminal de VS Code con
  `docker compose logs -f api` corriendo mientras Antigravity trabaja
  — así ves en vivo si un endpoint nuevo tira error apenas se guarda el
  archivo (con nodemon el contenedor se recarga solo). Si en algún
  momento la base queda en un estado raro durante pruebas, `docker
  compose down -v && docker compose up -d` te la reinicia limpia desde
  `db/init.sql` sin tocar nada del código.
- Si un módulo necesita una tabla nueva que `db/init.sql` no contempla
  todavía, pedile a Antigravity que la agregue como script nuevo en
  `db/migrations/`, nunca editando `init.sql` a mano una vez que ya
  tenés datos de prueba cargados (así no perdés lo que ya probaste).
