-- Migration: make_grabaciones_columns_nullable
-- Created at: 1762300520

-- Hacer columnas nullable en tabla grabaciones para permitir carga parcial de datos
ALTER TABLE grabaciones ALTER COLUMN inicio_grabacion DROP NOT NULL;
ALTER TABLE grabaciones ALTER COLUMN fin_grabacion DROP NOT NULL;
ALTER TABLE grabaciones ALTER COLUMN duracion_segundos DROP NOT NULL;;