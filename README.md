# WTEU_G7_Gervasoni — Web Town Estilo Urbano

E-commerce de indumentaria personalizada con estampado DTF.  
**Trabajo Práctico Final · PP3 · Analista de Sistemas · IES · Ciclo 2026**

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Node.js 20 + Express (JS puro) |
| Base de datos | PostgreSQL 16 (pool `pg`, SQL crudo) |
| Autenticación | JWT en cookie `httpOnly` (`sameSite: 'none'`, `secure: true`) |
| Contraseñas | bcrypt |
| Frontend | HTML + CSS + JS vanilla (sin frameworks ni bundlers) |
| Infra local | Docker Compose (`db` + `api`) |
| Infra producción | Railway |

---

## Comandos de trabajo diario

> **Requisito previo:** tener Docker Desktop corriendo.

```bash
# 1) Levantá el entorno (primera vez o después de un reinicio)
docker compose up -d

# 2) Ver logs de la API en tiempo real (nodemon recarga automáticamente)
docker compose logs -f api

# 3) Apagar todo (los datos de Postgres persisten en el volumen wteu_pgdata)
docker compose down

# 4) Apagar Y borrar los datos de la base (reinicio limpio)
docker compose down -v && docker compose up -d
```

---

## Configuración inicial

1. Copiá `.env.example` a `.env` y completá los valores:
   ```bash
   copy .env.example .env
   ```
2. Completá al menos:
   - `DB_USER`, `DB_PASSWORD`, `DB_NAME` (puede ser cualquier valor para local)
   - `JWT_SECRET` (cadena larga y aleatoria)
3. Levantá con `docker compose up -d`.

---

## Verificar que las tablas se crearon correctamente

```bash
# Conectarse al contenedor de Postgres
docker exec -it wteu_db psql -U <DB_USER> -d <DB_NAME>

# Dentro de psql, listar tablas:
\dt

# Deberías ver: usuarios, clientes, productos, producto_variantes,
#               producto_imagenes, pedidos, pedido_items,
#               solicitudes_cancelacion, pagos
```

---

## Estructura del proyecto

```
WTEU_G7_Gervasoni/
├── docker-compose.yml        ← orquestación de servicios db + api
├── Dockerfile                ← imagen del servicio api
├── app.js                    ← composition root (Express)
├── package.json
├── .env.example              ← variables necesarias (sin valores)
├── .gitignore
│
├── config/
│   ├── db.js                 ← pool de PostgreSQL (lee variables de entorno)
│   └── config.js             ← switcher window.API_URL para el frontend
│
├── db/
│   ├── init.sql              ← esquema inicial (9 tablas)
│   └── migrations/           ← scripts de cambios futuros (002_xxx.sql, ...)
│
├── Seguridad/                ← CU-001 a CU-005
├── Clientes/                 ← CU-006 a CU-010
├── Pedidos/                  ← CU-011 a CU-016
├── Cancelacion/              ← CU-017 a CU-019
├── Pagos/                    ← CU-020 a CU-023
└── Dashboard/                ← CU-024 a CU-028
```

---

## Endpoints de verificación

- `GET http://localhost:3000/api/health` → `{ "status": "ok", ... }`

---

## Flujo de desarrollo recomendado

1. `docker compose up -d` una vez al empezar a trabajar.
2. Abrir una terminal separada con `docker compose logs -f api` para ver errores en vivo.
3. Implementar módulo por módulo siguiendo el orden del documento:  
   **Seguridad → Clientes → Pedidos → Cancelación → Pagos → Dashboard**
4. Al terminar: `docker compose down`.

> Para migraciones de tablas, agregar script en `db/migrations/` — no editar `init.sql`
> si ya hay datos en el volumen.
