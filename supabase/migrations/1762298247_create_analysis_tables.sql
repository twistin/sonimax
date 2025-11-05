-- Migration: create_analysis_tables
-- Created at: 1762298247

-- Crear tablas de análisis, tags y meteorología

-- Tabla de tags
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('especie', 'fuente_sonora', 'ubicacion', 'tecnica_grabacion', 'condiciones', 'evento', 'tipo_ambiente')),
    descripcion TEXT,
    color_hex VARCHAR(7) DEFAULT '#000000',
    icono VARCHAR(50),
    nivel_confianza_default DECIMAL(3,2) DEFAULT 0.5,
    activo BOOLEAN DEFAULT TRUE,
    es_sistemico BOOLEAN DEFAULT FALSE,
    taxonomias_relacionadas JSONB DEFAULT '{}',
    metadata_schema JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT slug_formato CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT color_hex_valido CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$')
);

-- Tabla de relación grabaciones-tags
CREATE TABLE IF NOT EXISTS grabaciones_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grabacion_id UUID NOT NULL,
    tag_id UUID NOT NULL,
    confianza DECIMAL(3,2) CHECK (confianza >= 0 AND confianza <= 1),
    timestamp_evento TIMESTAMPTZ,
    duracion_evento INTEGER,
    frecuencia_inicial INTEGER,
    frecuencia_final INTEGER,
    nivel_db DECIMAL(6,2),
    notas_tag TEXT,
    contexto_deteccion JSONB DEFAULT '{}',
    metadata_contexto JSONB DEFAULT '{}',
    creado_automaticamente BOOLEAN DEFAULT FALSE,
    confirmado_usuario BOOLEAN DEFAULT FALSE,
    creado_por UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(grabacion_id, tag_id, timestamp_evento)
);

-- Tabla de análisis de IA
CREATE TABLE IF NOT EXISTS analisis_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grabacion_id UUID NOT NULL,
    modelo_ia VARCHAR(100) NOT NULL,
    version_modelo VARCHAR(50) NOT NULL,
    configuracion_modelo JSONB DEFAULT '{}',
    resultados_json JSONB NOT NULL,
    tiempo_procesamiento_segundos INTEGER,
    nivel_confianza_promedio DECIMAL(5,4),
    algoritmo_usado VARCHAR(100),
    estado_procesamiento VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_procesamiento IN ('pendiente', 'procesando', 'completado', 'fallido', 'cancelado')),
    intentos_procesamiento INTEGER DEFAULT 0,
    fecha_inicio_procesamiento TIMESTAMPTZ,
    fecha_fin_procesamiento TIMESTAMPTZ,
    error_mensaje TEXT,
    recursos_computacionales JSONB DEFAULT '{}',
    parametros_entrenamiento JSONB DEFAULT '{}',
    metricas_rendimiento JSONB DEFAULT '{}',
    validacion_cruzada DECIMAL(3,2),
    matriz_confusion JSONB,
    notas_ia TEXT,
    limitaciones_detectadas TEXT,
    recomendaciones_uso TEXT,
    metadata_extras JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tiempo_procesamiento_positivo CHECK (tiempo_procesamiento_segundos IS NULL OR tiempo_procesamiento_segundos >= 0)
);

-- Tabla de condiciones meteorológicas
CREATE TABLE IF NOT EXISTS condiciones_meteorologicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    punto_id UUID,
    grabacion_id UUID,
    timestamp_medicion TIMESTAMPTZ NOT NULL,
    temperatura_celsius DECIMAL(4,1),
    humedad_pct DECIMAL(5,2) CHECK (humedad_pct >= 0 AND humedad_pct <= 100),
    presion_hectopascales DECIMAL(7,2) CHECK (presion_hectopascales > 0),
    velocidad_viento_ms DECIMAL(4,1) CHECK (velocidad_viento_ms >= 0),
    direccion_viento_grados DECIMAL(5,2) CHECK (direccion_viento_grados >= 0 AND direccion_viento_grados < 360),
    precipitacion_mm DECIMAL(4,1) CHECK (precipitacion_mm >= 0),
    radiacion_solar DECIMAL(6,2),
    velocidad_viento_rachas_ms DECIMAL(4,1),
    temperatura_sensacion_termica_celsius DECIMAL(4,1),
    indice_uv DECIMAL(3,1) CHECK (indice_uv >= 0),
    visibilidad_metros DECIMAL(7,1),
    nubosidad_pct DECIMAL(3,0) CHECK (nubosidad_pct >= 0 AND nubosidad_pct <= 100),
    condiciones_cielo VARCHAR(20) CHECK (condiciones_cielo IN ('despejado', 'parcialmente_nublado', 'nublado', 'lluvioso', 'nieve', 'niebla')),
    precipitacion_tipo VARCHAR(20) CHECK (precipitacion_tipo IN ('ninguna', 'llovizna', 'lluvia', 'granizo', 'nieve')),
    intensidad_lluvia VARCHAR(15) CHECK (intensidad_lluvia IN ('sin_lluvia', 'ligera', 'moderada', 'fuerte')),
    intensidad_viento VARCHAR(15) CHECK (intensidad_viento IN ('calma', 'ligero', 'moderado', 'fuerte', 'tempestuoso')),
    fuente_datos VARCHAR(30) DEFAULT 'manual' CHECK (fuente_datos IN ('manual', 'automatico', 'sensor_remoto', 'estacion_meteorologica', 'api')),
    latitud_medicion DECIMAL(10,7),
    longitud_medicion DECIMAL(10,7),
    altitud_medicion DECIMAL(7,2),
    calidad_medicion VARCHAR(20) DEFAULT 'pendiente' CHECK (calidad_medicion IN ('pendiente', 'valida', 'sospechosa', 'invalida')),
    notas_calidad TEXT,
    variables_atmosfericas JSONB DEFAULT '{}',
    procesamiento_calidad JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT temperatura_rango CHECK (temperatura_celsius BETWEEN -50 AND 60),
    CONSTRAINT presion_rango CHECK (presion_hectopascales BETWEEN 800 AND 1200)
);

-- Crear índices para análisis y tags
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_categoria ON tags(categoria);
CREATE INDEX IF NOT EXISTS idx_tags_activo ON tags(activo);
CREATE INDEX IF NOT EXISTS idx_grabaciones_tags_grabacion_id ON grabaciones_tags(grabacion_id);
CREATE INDEX IF NOT EXISTS idx_grabaciones_tags_tag_id ON grabaciones_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_analisis_grabacion_id ON analisis_ia(grabacion_id);
CREATE INDEX IF NOT EXISTS idx_analisis_modelo ON analisis_ia(modelo_ia, version_modelo);
CREATE INDEX IF NOT EXISTS idx_analisis_estado ON analisis_ia(estado_procesamiento);
CREATE INDEX IF NOT EXISTS idx_meteo_punto_id ON condiciones_meteorologicas(punto_id);
CREATE INDEX IF NOT EXISTS idx_meteo_grabacion_id ON condiciones_meteorologicas(grabacion_id);
CREATE INDEX IF NOT EXISTS idx_meteo_timestamp ON condiciones_meteorologicas(timestamp_medicion);
CREATE INDEX IF NOT EXISTS idx_meteo_coordenadas ON condiciones_meteorologicas(latitud_medicion, longitud_medicion);;