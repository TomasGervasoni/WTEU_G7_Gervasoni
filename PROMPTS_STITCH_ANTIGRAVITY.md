# Guía de prompts — Stitch (diseño) → Antigravity (código)

Cómo instalar lo anterior:
1. `AGENTS.md` va en la **raíz** del repo (`WTEU_G7_Gervasoni/AGENTS.md`).
2. `SKILL.md` va en `WTEU_G7_Gervasoni/.agents/skills/nuevo-modulo-wteu/SKILL.md`
   (respetá el nombre de carpeta exacto, es lo que usa Antigravity para
   indexar la skill).
3. Abrí el proyecto en Antigravity y arrancá con el modo
   **"Review-driven development"** (revisa antes de tocar la DB o hacer
   commits grandes) — es el más razonable para un TP que vas a defender.

Como estás en planes gratuitos de ambas herramientas (Stitch: ~350
generaciones/mes en modo estándar; Antigravity: cuota diaria de uso),
la estrategia es: **diseñar todo en Stitch primero, en pocas tandas
grandes**, y después construir con Antigravity **módulo por módulo**
(no todo el proyecto de una vez), así podés revisar cada uno antes de
gastar cuota en el siguiente.

---

## PARTE 1 — Prompts para Stitch (diseño de interfaces)

### 1.0 Prompt base de sistema de diseño (correlo primero, una sola vez)

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

### 1.4 Módulo Pedidos/Cancelación/Pagos — Panel de administración

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

### 1.5 Módulo Dashboard

```
Diseñá una pantalla de "Dashboard" para el panel admin de "Town Estilo
Urbano", mismo sistema de diseño, versión admin: 4 tarjetas de KPI
arriba (Ventas del mes, Pedidos totales, Clientes registrados, Pagos
validados) con número grande e ícono. Debajo, dos gráficos: uno de
barras (ventas por mes) y uno de torta (pedidos por estado). Al costado
un botón "Exportar reportes a Excel".
```

### 1.6 Módulo Cancelación

```
Diseñá una pantalla web para que un cliente autenticado vea el detalle
de un pedido y pueda solicitar su cancelación, mismo sistema de diseño:
tarjeta con datos del pedido, botón "Solicitar cancelación", y al
hacer click un modal de confirmación con un campo opcional de motivo y
botones "Confirmar solicitud" / "Cancelar".
```

### Cómo exportar de Stitch

Por cada pantalla: click en el diseño → pestaña **Code** → copiar
HTML/CSS. Guardalo directamente como el archivo `.html` que le
corresponde según `AGENTS.md` (ej. el HTML del login va en
`Seguridad/SeguridadPages/SeguridadLogin.html`). No lo pegues en el chat
de Antigravity como texto largo: subí el archivo al repo y decile a
Antigravity que lo tome como base (ver prompts de la Parte 2).

---

## PARTE 2 — Prompts para Antigravity (construcción del código)

Encará esto en orden: **Seguridad → Clientes → Pedidos → Cancelación →
Pagos → Dashboard**, porque cada módulo depende de que el anterior ya
tenga su capa de Servicios lista (ej. Pedidos necesita el middleware de
sesión de Seguridad).

### 2.0 Prompt inicial (una sola vez, al abrir el proyecto)

```
Este es el proyecto WTEU_G7_Gervasoni. Ya coloqué AGENTS.md en la raíz
y la skill nuevo-modulo-wteu en .agents/skills/. Leé ambos archivos
completos antes de hacer nada.

Necesito que armes el esqueleto inicial del proyecto:
- package.json con Express, pg, bcrypt, jsonwebtoken, cookie-parser,
  cors, dotenv
- app.js como composition root: cookie-parser, cors configurado para
  cookies cross-domain (credentials: true), middleware de manejo de
  errores, y placeholders para montar cada Contenedor.js de los módulos
  a medida que los vayamos creando
- config/db.js con el pool de PostgreSQL usando variables de entorno
- config/config.js con el switcher de URL localhost/Railway para el
  frontend
- Un .env.example con las variables necesarias (sin valores reales)

No implementes todavía ningún módulo funcional, solo el esqueleto base.
Al terminar, mostrame el árbol de carpetas resultante.
```

### 2.1 Módulo Seguridad (CU-001 a CU-005)

```
Vamos a implementar el módulo Seguridad completo: CU-001 (Registrar
Usuario), CU-002 (Iniciar Sesión), CU-003 (Cerrar Sesión), CU-004
(Recuperar contraseña) y CU-005 (Gestionar roles y permisos).

Fuente de verdad: la ficha de cada CU en la sección 3.4 del documento
(objetivo, precondiciones, postcondiciones, curso normal y
alternativas) — ya te lo compartí antes, usalo tal cual, no inventes
reglas nuevas.

Ya subí el HTML exportado de Stitch en:
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

Todos los endpoints de este módulo requieren sesión iniciada
(requireAuth de Seguridad/SeguridadServices) y los de administración
requieren además requireRole('administrador').

Seguí la estructura: ClientesContenedor.js, ClientesAdapters/,
ClientesServices/. Si necesitás pantallas (panel de clientes en admin),
avisame antes de diseñarlas vos mismo — prefiero pasarte primero el
HTML de Stitch.

Registrá el router en app.js y resumí los archivos creados.
```

### 2.3 Módulo Pedidos (CU-011 a CU-016)

```
Implementá el módulo Pedidos completo: CU-011 (Visualizar catálogo),
CU-012 (Agregar al carrito), CU-013 (Generar pedido), CU-014 (Consultar
estado de pedido), CU-015 (Listar pedidos - admin) y CU-016 (Actualizar
estado de pedido - admin).

Ya subí el HTML de Stitch en:
- Pedidos/PedidosPages/PedidosCatalogo.html
- Pedidos/PedidosPages/PedidosDetalleProducto.html
- Pedidos/PedidosPages/PedidosCarrito.html
- Pedidos/PedidosPages/PedidosCheckout.html
- Pedidos/PedidosPages/PedidosMisPedidos.html
- Pedidos/PedidosPages/PedidosAdminListado.html

Tomalos como base visual y agregales el JS de página correspondiente.

Reglas clave del documento a respetar:
- El carrito de un visitante no autenticado persiste solo en el
  navegador; al iniciar sesión se sincroniza con el servidor (¡ojo con
  no confundir pullFromServer con pushFromServer al sincronizar!).
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

Si ya te pasé el HTML de Stitch para la pantalla de solicitud de
cancelación, tomalo como base; si no, avisame antes de diseñar vos la
pantalla.

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
MercadoPago desde variables de entorno, nunca hardcodeadas.

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

Si te pasé el HTML de Stitch del dashboard, tomalo como base y
conectale los gráficos a los datos reales agregados desde
PedidosServices, PagosServices y ClientesServices (import explícito
cross-module, con el comentario correspondiente).

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
  el resultado antes de pasar al siguiente — así no gastás cuota
  reconstruyendo algo que salió mal en un módulo temprano.
- **Modo de autonomía:** usá "Review-driven development" al menos hasta
  terminar Seguridad y Pedidos (son los más críticos para la defensa del
  TP). Podés pasar a un modo más autónomo para Dashboard, que es más
  autocontenido.
- **Stitch:** generá primero el prompt base de sistema de diseño (1.0) y
  después las pantallas — así todas comparten paleta y tipografía sin
  gastar generaciones corrigiendo inconsistencias.
- Si Antigravity se desvía de la estructura de carpetas en algún
  momento, no se lo corrijas manualmente vos: decile "revisá AGENTS.md,
  esto no respeta la estructura obligatoria" y dejá que lo arregle él
  mismo — así el agente refuerza el patrón para el resto de la sesión.
