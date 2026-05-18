-- ============================================================
-- SAE - Schema inicial
-- Flyway ejecuta este archivo UNA sola vez, en orden por version
-- V1 = version 1, el doble guion __ separa version de descripcion
-- ============================================================


-- ─── Usuarios ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    activo        INTEGER NOT NULL DEFAULT 1
);


-- ─── Configuracion del negocio (siempre 1 registro) ─────────
CREATE TABLE IF NOT EXISTS configuracion_negocio (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    razon_social            TEXT,
    cuit                    TEXT,
    domicilio               TEXT,
    telefono                TEXT,
    email                   TEXT,
    logo_path               TEXT,
    condicion_fiscal_emisor TEXT,  -- MONOTRIBUTISTA | RESPONSABLE_INSCRIPTO
    ingresos_brutos         TEXT,
    inicio_actividades      TEXT,  -- fecha ISO: 2020-01-15
    punto_venta_afip        INTEGER DEFAULT 1,
    certificado_afip_path   TEXT,  -- ruta al .p12 (Fase 4)
    clave_privada_path      TEXT   -- ruta a la clave (Fase 4)
);


-- ─── Productos ──────────────────────────────────────────────
-- Solo productos fisicos. Los servicios son texto libre en los detalles de venta.
CREATE TABLE IF NOT EXISTS productos (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo             TEXT,           -- opcional, para busqueda rapida
    nombre             TEXT    NOT NULL,
    descripcion        TEXT,
    marca              TEXT,
    precio_costo_neto  REAL,           -- costo sin IVA (opcional, para reportes de margen)
    precio_venta_neto  REAL    NOT NULL, -- precio sin IVA → se envia a AFIP
    alicuota_iva       INTEGER NOT NULL DEFAULT 21, -- 21 | 10 | 0
    precio_venta       REAL    NOT NULL, -- precio con IVA → muestra al cliente
    activo             INTEGER NOT NULL DEFAULT 1
);


-- ─── Stock ──────────────────────────────────────────────────
-- Un registro por producto. Se actualiza con cada movimiento.
CREATE TABLE IF NOT EXISTS stock (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id     INTEGER NOT NULL UNIQUE,
    cantidad_actual REAL    NOT NULL DEFAULT 0,
    stock_minimo    REAL    NOT NULL DEFAULT 0,  -- para alertas futuras
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);


-- ─── Movimientos de stock ────────────────────────────────────
-- Historial completo: cada cambio de stock queda registrado aqui.
CREATE TABLE IF NOT EXISTS stock_movimientos (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id    INTEGER NOT NULL,
    tipo           TEXT    NOT NULL, -- ENTRADA | SALIDA | AJUSTE
    cantidad       REAL    NOT NULL,
    stock_antes    REAL    NOT NULL,
    stock_despues  REAL    NOT NULL,
    fecha          TEXT    NOT NULL, -- ISO datetime: 2025-04-30T14:30:00
    venta_id       INTEGER,          -- referencia si el movimiento fue por una venta
    observacion    TEXT,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);


-- ─── Clientes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre           TEXT    NOT NULL,
    apellido         TEXT    NOT NULL,
    dni_cuil         TEXT,
    telefono         TEXT,
    razon_social     TEXT,
    condicion_fiscal TEXT,  -- CONSUMIDOR_FINAL | RESPONSABLE_INSCRIPTO | MONOTRIBUTISTA | EXENTO
    observaciones    TEXT,
    activo           INTEGER NOT NULL DEFAULT 1
);


-- ─── Presupuestos ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS presupuestos (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    numero                TEXT    NOT NULL UNIQUE, -- P-2025-04-0001
    cliente_id            INTEGER,                 -- NULL si cliente fue ingresado a mano
    cliente_nombre        TEXT    NOT NULL,        -- siempre requerido (snapshot del nombre)
    fecha                 TEXT    NOT NULL,
    estado                TEXT    NOT NULL DEFAULT 'BORRADOR', -- BORRADOR | CONFIRMADO | CONVERTIDO
    venta_id              INTEGER,                 -- referencia a la venta si fue convertido
    descuento_porcentaje  REAL    NOT NULL DEFAULT 0,
    subtotal_neto         REAL    NOT NULL DEFAULT 0,
    total_iva             REAL    NOT NULL DEFAULT 0,
    total                 REAL    NOT NULL DEFAULT 0,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);


-- ─── Detalle de presupuestos ─────────────────────────────────
CREATE TABLE IF NOT EXISTS presupuesto_detalles (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    presupuesto_id       INTEGER NOT NULL,
    producto_id          INTEGER,          -- NULL si tipo_item = SERVICIO
    tipo_item            TEXT    NOT NULL, -- PRODUCTO | SERVICIO
    descripcion_item     TEXT    NOT NULL, -- editable, snapshot del nombre del producto
    cantidad             REAL    NOT NULL,
    precio_unitario_neto REAL    NOT NULL, -- sin IVA, editable
    alicuota_iva         INTEGER NOT NULL DEFAULT 21,
    precio_unitario      REAL    NOT NULL, -- con IVA, editable
    subtotal_neto        REAL    NOT NULL,
    subtotal             REAL    NOT NULL,
    FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id),
    FOREIGN KEY (producto_id)   REFERENCES productos(id)
);


-- ─── Ventas ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ventas (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    numero               TEXT    NOT NULL UNIQUE, -- V-2025-04-0001
    cliente_id           INTEGER,                 -- NULL si cliente fue ingresado a mano
    cliente_nombre       TEXT    NOT NULL,
    presupuesto_id       INTEGER,                 -- NULL si es venta directa (sin presupuesto previo)
    fecha                TEXT    NOT NULL,
    estado               TEXT    NOT NULL DEFAULT 'ACTIVA', -- ACTIVA | ANULADA
    motivo_anulacion     TEXT,
    fecha_anulacion      TEXT,
    forma_pago           TEXT,    -- EFECTIVO | TRANSFERENCIA | TARJETA | OTRO (informativo)
    descuento_porcentaje REAL    NOT NULL DEFAULT 0,
    subtotal_neto        REAL    NOT NULL DEFAULT 0,
    total_iva            REAL    NOT NULL DEFAULT 0,
    total                REAL    NOT NULL DEFAULT 0,
    FOREIGN KEY (cliente_id)      REFERENCES clientes(id),
    FOREIGN KEY (presupuesto_id)  REFERENCES presupuestos(id)
);


-- ─── Detalle de ventas ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS venta_detalles (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id              INTEGER NOT NULL,
    producto_id           INTEGER,          -- NULL si tipo_item = SERVICIO
    tipo_item             TEXT    NOT NULL, -- PRODUCTO | SERVICIO
    descripcion_item      TEXT    NOT NULL,
    cantidad              REAL    NOT NULL,
    precio_costo_unitario REAL,             -- NULL para servicios, snapshot del costo
    precio_unitario_neto  REAL    NOT NULL,
    alicuota_iva          INTEGER NOT NULL DEFAULT 21,
    precio_unitario       REAL    NOT NULL,
    subtotal_neto         REAL    NOT NULL,
    subtotal              REAL    NOT NULL,
    FOREIGN KEY (venta_id)    REFERENCES ventas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);


-- ─── Gastos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gastos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    descripcion TEXT    NOT NULL,
    monto       REAL    NOT NULL,
    fecha       TEXT    NOT NULL,
    categoria   TEXT,
    forma_pago  TEXT    -- EFECTIVO | TRANSFERENCIA | TARJETA | OTRO
);


-- ─── Facturas AFIP ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS facturas (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id             INTEGER NOT NULL UNIQUE, -- relacion 1 a 1 con venta
    tipo_comprobante     TEXT    NOT NULL,         -- A | B | C
    punto_venta          INTEGER NOT NULL,
    numero_comprobante   INTEGER NOT NULL,
    cae                  TEXT,
    cae_vencimiento      TEXT,
    fecha_emision        TEXT    NOT NULL,
    total                REAL    NOT NULL,
    estado               TEXT    NOT NULL DEFAULT 'EMITIDA', -- EMITIDA | ANULADA
    nota_credito_cae     TEXT,    -- preparado para futura implementacion
    nota_credito_numero  INTEGER,
    nota_credito_fecha   TEXT,
    FOREIGN KEY (venta_id) REFERENCES ventas(id)
);


-- ─── Datos iniciales ────────────────────────────────────────
-- Configuracion basica del negocio (el usuario completa el resto desde la app)
INSERT INTO configuracion_negocio (razon_social, punto_venta_afip)
VALUES ('Mi Taller', 1);

-- NOTA: El usuario administrador se crea automaticamente al iniciar la app
-- (ver DataInitializer.java) con usuario: admin / contrasena: admin123
