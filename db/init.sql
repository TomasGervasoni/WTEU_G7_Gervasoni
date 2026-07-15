-- =============================================================================
-- db/init.sql — Esquema inicial WTEU_G7_Gervasoni
-- Se monta en /docker-entrypoint-initdb.d/ y PostgreSQL lo ejecuta UNA sola
-- vez al crear el volumen. Para cambios posteriores usá db/migrations/.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONES
-- ---------------------------------------------------------------------------
-- pgcrypto disponible si en algún módulo se necesita gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ===========================================================================
-- 1. USUARIOS (Módulo Seguridad — CU-001 a CU-005)
-- ===========================================================================
-- Registra TODOS los usuarios del sistema, independientemente del rol.
-- Los clientes tienen además un registro en la tabla `clientes`.
CREATE TABLE IF NOT EXISTS usuarios (
    id              SERIAL PRIMARY KEY,
    usuario         VARCHAR(50)  NOT NULL UNIQUE,          -- nombre de login
    nombre          VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   TEXT         NOT NULL,                  -- bcrypt
    rol             VARCHAR(20)  NOT NULL DEFAULT 'cliente' -- 'cliente' | 'administrador'
                    CHECK (rol IN ('cliente', 'administrador')),
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índice para búsquedas por email en login y recuperación de contraseña
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);


-- ===========================================================================
-- 2. CLIENTES (Módulo Clientes — CU-006 a CU-010)
-- ===========================================================================
-- Datos adicionales del cliente (perfil de comprador).
-- Se crea automáticamente al registrarse como usuario con rol 'cliente'.
CREATE TABLE IF NOT EXISTS clientes (
    id              SERIAL PRIMARY KEY,
    usuario_id      INT          NOT NULL UNIQUE
                    REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_completo VARCHAR(150) NOT NULL,
    cuil            VARCHAR(20),                            -- CUIL/CUIT sin formato
    whatsapp        VARCHAR(30),
    direccion       TEXT,
    codigo_postal   VARCHAR(10),
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índice para búsquedas en el panel admin (CU-008)
CREATE INDEX IF NOT EXISTS idx_clientes_usuario_id ON clientes(usuario_id);


-- ===========================================================================
-- 3. PRODUCTOS (Módulo Pedidos — CU-011, CU-016; Gestión de Productos)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS productos (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    descripcion     TEXT,
    categoria       VARCHAR(50),                            -- 'Hombre', 'Mujer', 'Niños/as', etc.
    tipo_tela       VARCHAR(80),
    precio          NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    activo          BOOLEAN       NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Índice para búsquedas por nombre en el catálogo y panel admin
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos USING GIN (to_tsvector('spanish', nombre));


-- ===========================================================================
-- 4. VARIANTES DE PRODUCTO (colores y talles disponibles por producto)
-- ===========================================================================
-- Cada fila representa una combinación color+talle de un producto.
-- Permite al catálogo mostrar opciones y al carrito elegir una específica.
CREATE TABLE IF NOT EXISTS producto_variantes (
    id              SERIAL PRIMARY KEY,
    producto_id     INT          NOT NULL
                    REFERENCES productos(id) ON DELETE CASCADE,
    color           VARCHAR(50),
    talle           VARCHAR(10),                            -- 'S','M','L','XL','2XL'
    stock           INT          NOT NULL DEFAULT 0 CHECK (stock >= 0),
    UNIQUE (producto_id, color, talle)
);

CREATE INDEX IF NOT EXISTS idx_variantes_producto ON producto_variantes(producto_id);


-- ===========================================================================
-- 5. IMÁGENES DE PRODUCTO
-- ===========================================================================
CREATE TABLE IF NOT EXISTS producto_imagenes (
    id              SERIAL PRIMARY KEY,
    producto_id     INT          NOT NULL
                    REFERENCES productos(id) ON DELETE CASCADE,
    url             TEXT         NOT NULL,
    es_principal    BOOLEAN      NOT NULL DEFAULT FALSE,
    orden           INT          NOT NULL DEFAULT 0,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_imagenes_producto ON producto_imagenes(producto_id);


-- ===========================================================================
-- 6. PEDIDOS (Módulo Pedidos — CU-013 a CU-016)
-- ===========================================================================
-- Estado sigue el diagrama del documento:
--   pendiente → confirmado → en_preparacion → enviado → entregado
--   (cualquier estado no-final) → cancelado
CREATE TABLE IF NOT EXISTS pedidos (
    id              SERIAL PRIMARY KEY,
    usuario_id      INT          NOT NULL
                    REFERENCES usuarios(id) ON DELETE RESTRICT,
    -- Datos del cliente al momento de la compra (desnormalizados para auditoría)
    nombre_cliente  VARCHAR(150) NOT NULL,
    cuil            VARCHAR(20),
    whatsapp        VARCHAR(30),
    email           VARCHAR(150),
    direccion       TEXT,
    codigo_postal   VARCHAR(10),
    -- Estado del pedido
    estado          VARCHAR(20)  NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente','confirmado','en_preparacion','enviado','entregado','cancelado')),
    total           NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    -- Metadatos
    notas           TEXT,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario    ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado     ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_creado_en  ON pedidos(creado_en);


-- ===========================================================================
-- 7. PEDIDO_ITEMS (detalle de cada pedido — desnormalizado)
-- ===========================================================================
-- Los datos nombre/color/talle/precio se copian del producto al crear el
-- pedido (CU-013) para que el historial no cambie si el producto se edita.
CREATE TABLE IF NOT EXISTS pedido_items (
    id                  SERIAL PRIMARY KEY,
    pedido_id           INT          NOT NULL
                        REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id         INT                                     -- puede quedar NULL si el producto se elimina
                        REFERENCES productos(id) ON DELETE SET NULL,
    -- Snapshot del momento de la compra
    nombre_producto     VARCHAR(150) NOT NULL,
    imagen_url          TEXT,
    color               VARCHAR(50),
    talle               VARCHAR(10),
    precio_unitario     NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
    cantidad            INT          NOT NULL CHECK (cantidad > 0),
    subtotal            NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_items_pedido ON pedido_items(pedido_id);


-- ===========================================================================
-- 8. SOLICITUDES_CANCELACION (Módulo Cancelación — CU-017 a CU-019)
-- ===========================================================================
-- Estado: 'solicitada' → 'aprobada' | 'rechazada'
CREATE TABLE IF NOT EXISTS solicitudes_cancelacion (
    id              SERIAL PRIMARY KEY,
    pedido_id       INT          NOT NULL UNIQUE              -- solo 1 solicitud activa por pedido
                    REFERENCES pedidos(id) ON DELETE CASCADE,
    usuario_id      INT          NOT NULL                     -- quien solicita (cliente)
                    REFERENCES usuarios(id) ON DELETE RESTRICT,
    motivo          TEXT,
    estado          VARCHAR(20)  NOT NULL DEFAULT 'solicitada'
                    CHECK (estado IN ('solicitada','aprobada','rechazada')),
    -- Admin que resuelve
    resuelto_por    INT
                    REFERENCES usuarios(id) ON DELETE SET NULL,
    motivo_rechazo  TEXT,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    resuelto_en     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cancelacion_pedido ON solicitudes_cancelacion(pedido_id);
CREATE INDEX IF NOT EXISTS idx_cancelacion_estado ON solicitudes_cancelacion(estado);


-- ===========================================================================
-- 9. PAGOS (Módulo Pagos — CU-020 a CU-023)
-- ===========================================================================
-- Registra tanto pagos manuales (CU-020) como pagos MercadoPago (CU-021/022).
CREATE TABLE IF NOT EXISTS pagos (
    id                      SERIAL PRIMARY KEY,
    pedido_id               INT          NOT NULL
                            REFERENCES pedidos(id) ON DELETE RESTRICT,
    metodo                  VARCHAR(30)  NOT NULL
                            CHECK (metodo IN ('mercadopago','transferencia','efectivo','otro')),
    estado                  VARCHAR(20)  NOT NULL DEFAULT 'pendiente'
                            CHECK (estado IN ('pendiente','aprobado','rechazado','en_proceso','devuelto')),
    monto                   NUMERIC(10,2) NOT NULL CHECK (monto >= 0),
    -- Datos MercadoPago (CU-021 / CU-022)
    mp_preference_id        TEXT,                             -- ID de preferencia MP
    mp_payment_id           TEXT,                             -- ID de pago MP (del webhook)
    mp_status               TEXT,                             -- status raw de MP
    mp_status_detail        TEXT,                             -- status_detail raw de MP
    -- Para pagos manuales (CU-020)
    comprobante_url         TEXT,
    notas                   TEXT,
    -- Metadatos
    creado_en               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    actualizado_en          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pagos_pedido   ON pagos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado   ON pagos(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_mp_pid   ON pagos(mp_payment_id);


-- ===========================================================================
-- FIN DEL ESQUEMA
-- ===========================================================================
-- Para agregar tablas o columnas en el futuro, NO edites este archivo si ya
-- tenés datos en el volumen. Creá un script nuevo en db/migrations/ con el
-- nombre 002_descripcion.sql, 003_descripcion.sql, etc.
