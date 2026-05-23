-- ============================================================
-- SAE - Agrega campos a tabla clientes
-- V2: email, direccion, fecha_alta
-- ============================================================

ALTER TABLE clientes ADD COLUMN email      TEXT;
ALTER TABLE clientes ADD COLUMN direccion  TEXT;
ALTER TABLE clientes ADD COLUMN fecha_alta TEXT;
