-- Migration: add_detailed_metadata_to_images
-- Created at: 1762333368

-- Agregar campos de metadatos detallados a imagenes_lugares
ALTER TABLE imagenes_lugares
ADD COLUMN IF NOT EXISTS nombre_sitio VARCHAR(255),
ADD COLUMN IF NOT EXISTS condiciones_atmosfericas VARCHAR(100),
ADD COLUMN IF NOT EXISTS caracteristicas_sitio TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS precision_gps NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS notas_campo TEXT;

-- Crear indice para busqueda por condiciones
CREATE INDEX IF NOT EXISTS idx_imagenes_condiciones ON imagenes_lugares(condiciones_atmosfericas);

-- Crear indice GIN para caracteristicas del sitio (array)
CREATE INDEX IF NOT EXISTS idx_imagenes_caracteristicas ON imagenes_lugares USING GIN (caracteristicas_sitio);

-- Comentarios de documentacion
COMMENT ON COLUMN imagenes_lugares.nombre_sitio IS 'Nombre descriptivo del lugar de captura';
COMMENT ON COLUMN imagenes_lugares.condiciones_atmosfericas IS 'Condiciones climaticas durante la captura (Soleado, Nublado, Lluvioso, Ventoso, etc.)';
COMMENT ON COLUMN imagenes_lugares.caracteristicas_sitio IS 'Etiquetas que describen el tipo de lugar (Bosque, Playa, Urbano, Rural, Montaña, Rio, etc.)';
COMMENT ON COLUMN imagenes_lugares.precision_gps IS 'Precision del GPS en metros al momento de la captura';
COMMENT ON COLUMN imagenes_lugares.notas_campo IS 'Descripcion adicional y observaciones del lugar';;