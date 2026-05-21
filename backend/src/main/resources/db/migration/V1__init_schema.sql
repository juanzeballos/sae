-- ============================================================
-- SAE - Schema inicial (PostgreSQL)
-- ============================================================


-- ─── Usuarios ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id            BIGSERIAL   PRIMARY KEY,
    username      TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    activo        BOOLEAN     NOT NULL DEFAULT TRUE
);


-- ─── Configuracion del negocio (siempre 1 registro) ─────────
CREATE TABLE IF NOT EXISTS configuracion_negocio (
    id                      BIGSERIAL PRIMARY KEY,
    razon_social            TEXT,
    cuit                    TEXT,
    domicilio               TEXT,
    telefono                TEXT,
    email                   TEXT,
    logo_path               TEXT,
    condicion_fiscal_emisor TEXT,
    ingresos_brutos         TEXT,
    inicio_actividades      TEXT,
    punto_venta_afip        INTEGER DEFAULT 1,
    certificado_afip_path   TEXT,
    clave_privada_path      TEXT
);


-- ─── Productos ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
    id                 BIGSERIAL PRIMARY KEY,
    codigo             TEXT,
    nombre             TEXT        NOT NULL,
    descripcion        TEXT,
    marca              TEXT,
    precio_costo_neto  REAL,
    precio_venta_neto  REAL        NOT NULL,
    alicuota_iva       INTEGER     NOT NULL DEFAULT 21,
    precio_venta       REAL        NOT NULL,
    activo             BOOLEAN     NOT NULL DEFAULT TRUE
);


-- ─── Stock ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock (
    id              BIGSERIAL PRIMARY KEY,
    producto_id     BIGINT      NOT NULL UNIQUE,
    cantidad_actual REAL        NOT NULL DEFAULT 0,
    stock_minimo    REAL        NOT NULL DEFAULT 0,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);


-- ─── Movimientos de stock ────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_movimientos (
    id             BIGSERIAL PRIMARY KEY,
    producto_id    BIGINT      NOT NULL,
    tipo           TEXT        NOT NULL,
    cantidad       REAL        NOT NULL,
    stock_antes    REAL        NOT NULL,
    stock_despues  REAL        NOT NULL,
    fecha          TEXT        NOT NULL,
    venta_id       BIGINT,
    observacion    TEXT,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);


-- ─── Clientes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
    id               BIGSERIAL PRIMARY KEY,
    nombre           TEXT        NOT NULL,
    apellido         TEXT        NOT NULL DEFAULT '',
    dni_cuil         TEXT,
    telefono         TEXT,
    razon_social     TEXT,
    condicion_fiscal TEXT,
    observaciones    TEXT,
    activo           BOOLEAN     NOT NULL DEFAULT TRUE
);


-- ─── Presupuestos ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS presupuestos (
    id                    BIGSERIAL PRIMARY KEY,
    numero                TEXT        NOT NULL UNIQUE,
    cliente_id            BIGINT,
    cliente_nombre        TEXT        NOT NULL,
    fecha                 TEXT        NOT NULL,
    estado                TEXT        NOT NULL DEFAULT 'BORRADOR',
    venta_id              BIGINT,
    descuento_porcentaje  REAL        NOT NULL DEFAULT 0,
    subtotal_neto         REAL        NOT NULL DEFAULT 0,
    total_iva             REAL        NOT NULL DEFAULT 0,
    total                 REAL        NOT NULL DEFAULT 0,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);


-- ─── Detalle de presupuestos ─────────────────────────────────
CREATE TABLE IF NOT EXISTS presupuesto_detalles (
    id                   BIGSERIAL PRIMARY KEY,
    presupuesto_id       BIGINT      NOT NULL,
    producto_id          BIGINT,
    tipo_item            TEXT        NOT NULL,
    descripcion_item     TEXT        NOT NULL,
    cantidad             REAL        NOT NULL,
    precio_unitario_neto REAL        NOT NULL,
    alicuota_iva         INTEGER     NOT NULL DEFAULT 21,
    precio_unitario      REAL        NOT NULL,
    subtotal_neto        REAL        NOT NULL,
    subtotal             REAL        NOT NULL,
    FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id),
    FOREIGN KEY (producto_id)   REFERENCES productos(id)
);


-- ─── Ventas ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ventas (
    id                   BIGSERIAL PRIMARY KEY,
    numero               TEXT        NOT NULL UNIQUE,
    cliente_id           BIGINT,
    cliente_nombre       TEXT        NOT NULL,
    presupuesto_id       BIGINT,
    fecha                TEXT        NOT NULL,
    estado               TEXT        NOT NULL DEFAULT 'ACTIVA',
    motivo_anulacion     TEXT,
    fecha_anulacion      TEXT,
    forma_pago           TEXT,
    descuento_porcentaje REAL        NOT NULL DEFAULT 0,
    subtotal_neto        REAL        NOT NULL DEFAULT 0,
    total_iva            REAL        NOT NULL DEFAULT 0,
    total                REAL        NOT NULL DEFAULT 0,
    FOREIGN KEY (cliente_id)      REFERENCES clientes(id),
    FOREIGN KEY (presupuesto_id)  REFERENCES presupuestos(id)
);


-- ─── Detalle de ventas ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS venta_detalles (
    id                    BIGSERIAL PRIMARY KEY,
    venta_id              BIGINT      NOT NULL,
    producto_id           BIGINT,
    tipo_item             TEXT        NOT NULL,
    descripcion_item      TEXT        NOT NULL,
    cantidad              REAL        NOT NULL,
    precio_costo_unitario REAL,
    precio_unitario_neto  REAL        NOT NULL,
    alicuota_iva          INTEGER     NOT NULL DEFAULT 21,
    precio_unitario       REAL        NOT NULL,
    subtotal_neto         REAL        NOT NULL,
    subtotal              REAL        NOT NULL,
    FOREIGN KEY (venta_id)    REFERENCES ventas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);


-- ─── Gastos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gastos (
    id          BIGSERIAL PRIMARY KEY,
    descripcion TEXT        NOT NULL,
    monto       REAL        NOT NULL,
    fecha       TEXT        NOT NULL,
    categoria   TEXT,
    forma_pago  TEXT
);


-- ─── Facturas AFIP ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS facturas (
    id                   BIGSERIAL PRIMARY KEY,
    venta_id             BIGINT      NOT NULL UNIQUE,
    tipo_comprobante     TEXT        NOT NULL,
    punto_venta          INTEGER     NOT NULL,
    numero_comprobante   INTEGER     NOT NULL,
    cae                  TEXT,
    cae_vencimiento      TEXT,
    fecha_emision        TEXT        NOT NULL,
    total                REAL        NOT NULL,
    estado               TEXT        NOT NULL DEFAULT 'EMITIDA',
    nota_credito_cae     TEXT,
    nota_credito_numero  INTEGER,
    nota_credito_fecha   TEXT,
    FOREIGN KEY (venta_id) REFERENCES ventas(id)
);


-- ─── Datos iniciales ────────────────────────────────────────
INSERT INTO configuracion_negocio (razon_social, punto_venta_afip)
VALUES ('Mi Taller', 1);
