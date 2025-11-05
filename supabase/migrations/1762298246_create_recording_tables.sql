-- Migration: create_recording_tables
-- Created at: 1762298246

-- Crear tablas relacionadas con grabaciones y equipos

-- Tabla de equipos
CREATE TABLE IF NOT EXISTS equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    proyecto_id UUID,
    nombre VARCHAR(200) NOT NULL,
    tipo_equipo VARCHAR(50) NOT NULL CHECK (tipo_equipo IN ('grabadora', 'microfono', 'sensor_meteorologico', 'gps', 'computadora', 'bateria', 'accesorio')),
    marca VARCHAR(100),
    modelo VARCHAR(100),
    numero_serie VARCHAR(100),
    descripcion TEXT,
    fecha_adquisicion DATE,
    fecha_ultimo_mantenimiento DATE,
    estado VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'en_uso', 'mantenimiento', 'fuera_servicio')),
    calibracion_actual JSONB DEFAULT '{}',
    metadata_tecnicos JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de grabaciones
CREATE TABLE IF NOT EXISTS grabaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    punto_id UUID NOT NULL,
    equipo_id UUID,
    usuario_id UUID,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo TEXT NOT NULL,
    tamano_archivo BIGINT,
    hash_archivo VARCHAR(64),
    inicio_grabacion TIMESTAMPTZ NOT NULL,
    fin_grabacion TIMESTAMPTZ NOT NULL,
    duracion_segundos INTEGER NOT NULL CHECK (duracion_segundos > 0),
    estado VARCHAR(20) DEFAULT 'grabada' CHECK (estado IN ('grabada', 'procesando', 'procesada', 'publicada', 'archivada')),
    nivel_ruido_promedio DECIMAL(8,4),
    snr_estimado DECIMAL(8,4),
    notas_campo TEXT,
    notas_operador TEXT,
    contexto_grabacion TEXT,
    configuracion_captura JSONB DEFAULT '{}',
    metadata_extras JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tiempos_validos CHECK (fin_grabacion > inicio_grabacion)
);

-- Tabla de metadatos de audio
CREATE TABLE IF NOT EXISTS metadatos_audio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grabacion_id UUID UNIQUE NOT NULL,
    codec VARCHAR(20) NOT NULL,
    sample_rate INTEGER NOT NULL CHECK (sample_rate > 0),
    bit_depth VARCHAR(10),
    canales VARCHAR(10) NOT NULL,
    bit_rate INTEGER,
    contenedor VARCHAR(20) NOT NULL,
    compresion_ratio DECIMAL(5,2),
    calidad_audio VARCHAR(20) DEFAULT 'buena' CHECK (calidad_audio IN ('excelente', 'buena', 'regular', 'mala')),
    rms_db DECIMAL(6,2),
    peak_db DECIMAL(6,2),
    lufs_evaluados DECIMAL(6,2),
    frecuencia_central_hz DECIMAL(10,2),
    banda_frecuencial_principal VARCHAR(50),
    frecuencias_destacadas JSONB,
    distorsiones_detectadas INTEGER DEFAULT 0,
    recorte_detectado BOOLEAN DEFAULT FALSE,
    ruido_ambiental_promedio DECIMAL(6,2),
    snr_estimado DECIMAL(6,2),
    procesado BOOLEAN DEFAULT FALSE,
    aplicacion_filtros JSONB DEFAULT '{}',
    mejoras_aplicadas JSONB DEFAULT '{}',
    espectrograma_hash VARCHAR(64),
    metadata_id3 JSONB,
    metadata_xmp JSONB,
    metadata_vorbis JSONB,
    audio_hash_md5 VARCHAR(32),
    audio_hash_sha256 VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para grabaciones y equipos
CREATE INDEX IF NOT EXISTS idx_equipos_user_id ON equipos(user_id);
CREATE INDEX IF NOT EXISTS idx_equipos_proyecto_id ON equipos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_equipos_tipo ON equipos(tipo_equipo);
CREATE INDEX IF NOT EXISTS idx_equipos_estado ON equipos(estado);
CREATE INDEX IF NOT EXISTS idx_grabaciones_punto_id ON grabaciones(punto_id);
CREATE INDEX IF NOT EXISTS idx_grabaciones_equipo_id ON grabaciones(equipo_id);
CREATE INDEX IF NOT EXISTS idx_grabaciones_usuario_id ON grabaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_grabaciones_inicio ON grabaciones(inicio_grabacion);
CREATE INDEX IF NOT EXISTS idx_grabaciones_estado ON grabaciones(estado);
CREATE INDEX IF NOT EXISTS idx_metadatos_grabacion_id ON metadatos_audio(grabacion_id);
CREATE INDEX IF NOT EXISTS idx_metadatos_codec ON metadatos_audio(codec);
CREATE INDEX IF NOT EXISTS idx_metadatos_calidad ON metadatos_audio(calidad_audio);;