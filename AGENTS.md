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

- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL, acceso mediante el pool nativo de `pg`
  (sin ORM, salvo que el usuario lo pida expresamente)
- **Autenticación:** JWT guardado en cookie httpOnly
  (`sameSite: 'none'`, `secure: true`). Prohibido usar localStorage o
  sessionStorage para el token de sesión.
- **Contraseñas:** hasheadas con bcrypt. Nunca texto plano.
- **Frontend:** HTML + CSS + JavaScript vanilla (sin React/Vue/Angular
  salvo instrucción explícita del usuario).
- **Config de entorno:** usar el switcher `config.js` para localhost vs.
  Railway, y `window.API_URL` en todo el frontend (nunca URLs hardcodeadas,
  por compatibilidad con GitHub Pages).

## 3. Estructura de carpetas OBLIGATORIA (no negociable)

```
WTEU_G7_Gervasoni/
├── app.js                     (composición raíz global: monta todos los Contenedor.js)
├── config/
│   ├── config.js              (switcher localhost/Railway)
│   └── db.js                  (pool de PostgreSQL)
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

## 4. Responsabilidad de cada capa dentro de un módulo

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

## 5. Reglas estrictas

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
7. Los estados de Pedido (`pendiente → confirmado → en_preparacion →
   enviado → entregado`, y el estado final `cancelado`) deben validarse
   según el diagrama de estados del documento antes de aplicar cualquier
   transición.

## 6. Mapeo de módulos (según la documentación)

| Carpeta        | Módulo (doc.)                     | CUs             |
|-----------------|-----------------------------------|-----------------|
| Seguridad       | Control de Acceso y Seguridad     | CU-001 a CU-005 |
| Clientes        | Administración de Clientes        | CU-006 a CU-010 |
| Pedidos         | Gestión de Pedidos                | CU-011 a CU-016 |
| Cancelacion     | Cancelación de Pedidos            | CU-017 a CU-019 |
| Pagos           | Pagos                             | CU-020 a CU-023 |
| Dashboard       | Reportería y Dashboard            | CU-024 a CU-028 |

## 7. Pendientes conocidos (no resolver salvo pedido explícito)

- Confirmación automática de pago vía webhook de MercadoPago
  (actualmente el pedido no cambia de estado solo con la notificación).
- Módulos evolutivos "Gestión de Insumos" y "Producción" (CU-E01 a
  CU-E08) están fuera de alcance de esta versión — no crear sus carpetas
  a menos que el usuario lo pida.
