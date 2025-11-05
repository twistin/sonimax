-- Migration: add_birdnet_and_export_tables
-- Created at: 1762346017

-- Tabla para almacenar detecciones de BirdNET
CREATE TABLE IF NOT EXISTS birdnet_detections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grabacion_id UUID REFERENCES grabaciones(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  species_name VARCHAR(255) NOT NULL,
  common_name VARCHAR(255),
  scientific_name VARCHAR(255),
  confidence_score DECIMAL(4,3) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  start_time_seconds DECIMAL(7,2),
  end_time_seconds DECIMAL(7,2),
  frequency_range VARCHAR(50),
  detection_metadata JSONB,
  analysis_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance en BirdNET
CREATE INDEX idx_birdnet_grabacion ON birdnet_detections(grabacion_id);
CREATE INDEX idx_birdnet_species ON birdnet_detections(species_name);
CREATE INDEX idx_birdnet_confidence ON birdnet_detections(confidence_score DESC);
CREATE INDEX idx_birdnet_usuario ON birdnet_detections(usuario_id);
CREATE INDEX idx_birdnet_date ON birdnet_detections(analysis_date);

-- Tabla para log de exportaciones
CREATE TABLE IF NOT EXISTS export_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type VARCHAR(50) NOT NULL, -- 'csv', 'geojson', 'kml', 'pdf'
  export_filters JSONB,
  num_records INTEGER,
  file_size_bytes INTEGER,
  download_url TEXT,
  export_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para export_logs
CREATE INDEX idx_export_usuario ON export_logs(usuario_id);
CREATE INDEX idx_export_type ON export_logs(export_type);
CREATE INDEX idx_export_date ON export_logs(export_date DESC);

-- Trigger para updated_at en birdnet_detections
CREATE OR REPLACE FUNCTION update_birdnet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_birdnet_updated_at
  BEFORE UPDATE ON birdnet_detections
  FOR EACH ROW
  EXECUTE FUNCTION update_birdnet_updated_at();

-- RLS policies para birdnet_detections
ALTER TABLE birdnet_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own birdnet detections"
  ON birdnet_detections FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own birdnet detections"
  ON birdnet_detections FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own birdnet detections"
  ON birdnet_detections FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own birdnet detections"
  ON birdnet_detections FOR DELETE
  USING (auth.uid() = usuario_id);

-- RLS policies para export_logs
ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own export logs"
  ON export_logs FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own export logs"
  ON export_logs FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Comentarios para documentación
COMMENT ON TABLE birdnet_detections IS 'Almacena los resultados de análisis de especies de aves usando BirdNET';
COMMENT ON TABLE export_logs IS 'Registra las exportaciones de datos realizadas por los usuarios';
COMMENT ON COLUMN birdnet_detections.confidence_score IS 'Nivel de confianza de la detección (0-1)';
COMMENT ON COLUMN birdnet_detections.detection_metadata IS 'Metadatos adicionales del análisis en formato JSON';;