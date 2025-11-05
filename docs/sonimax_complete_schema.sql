-- ================================================
-- ESQUEMA BASE DE DATOS SONIMAX - SQL COMPLETO
-- Sistema de Grabación de Audio con Análisis de IA
-- Fecha: 2025-11-05
-- ================================================

-- Configuración general de la base de datos
-- CREATE DATABASE sonimaxdb ENCODING 'UTF8' LC_COLLATE='es_ES.UTF-8' LC_CTYPE='es_ES.UTF-8';

-- Extensiones necesarias
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "postgis";
-- CREATE EXTENSION IF NOT EXISTS "timescaledb";
-- CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ================================================
-- 1. ESQUEMA DE USUARIOS Y AUTENTICACIÓN
-- ================================================

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'operador' CHECK (rol IN ('administrador', 'investigador', 'operador', 'analista')),
    salt VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    last_login_at TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMPTZ,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    preferences JSONB DEFAULT '{}',
    session_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 2. ESQUEMA DE PROYECTOS Y ORGANIZACIÓN
-- ================================================

CREATE TABLE proyectos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES usuarios(id),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    objetivos TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    ubicacion VARCHAR(255),
    coordenadas_geograficas POINT,
    estado VARCHAR(20) DEFAULT 'planificado' CHECK (estado IN ('planificado', 'activo', 'completado', 'suspendido')),
    budget DECIMAL(12,2),
    nivel_confidencialidad VARCHAR(20) DEFAULT 'interno' CHECK (nivel_confidencialidad IN ('publico', 'interno', 'confidencial', 'restringido')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_proyectos_user_id ON proyectos(user_id);
CREATE INDEX idx_proyectos_estado ON proyectos(estado);
CREATE INDEX idx_proyectos_nombre ON proyectos USING gin(nombre gin_trgm_ops);
CREATE INDEX idx_proyectos_coordenadas ON proyectos USING gist(coordenadas_geograficas);

CREATE TABLE rutas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo_ruta VARCHAR(50) DEFAULT 'transecto' CHECK (tipo_ruta IN ('transecto', 'punto_fijo', 'aleatorio', 'sistematico')),
    geometria JSONB, -- GeoJSON para almacenar la geometría de la ruta
    configuracion JSONB DEFAULT '{}', -- Configuraciones específicas de la ruta
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rutas_proyecto_id ON rutas(proyecto_id);
CREATE INDEX idx_rutas_tipo ON rutas(tipo_ruta);
CREATE INDEX idx_rutas_nombre ON rutas USING gin(nombre gin_trgm_ops);

CREATE TABLE puntos_grabacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ruta_id UUID NOT NULL REFERENCES rutas(id) ON DELETE CASCADE,
    nombre VARCHAR(200),
    descripcion TEXT,
    latitud DECIMAL(10,7) NOT NULL,
    longitud DECIMAL(10,7) NOT NULL,
    altitud DECIMAL(7,2),
    precision_gps DECIMAL(5,2), -- Error GPS en metros
    velocidad_kmh DECIMAL(5,2),
    direccion_grados DECIMAL(5,2),
    timestamp_gps TIMESTAMPTZ,
    horizonte_visible DECIMAL(3,1), -- Porcentaje de horizonte visible
    obstaculos_cercanos TEXT,
    condiciones_ambientales JSONB DEFAULT '{}', -- Condiciones del punto
    metadata_extras JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT coords_validas CHECK (latitud BETWEEN -90 AND 90 AND longitud BETWEEN -180 AND 180)
);

CREATE INDEX idx_puntos_grabacion_ruta_id ON puntos_grabacion(ruta_id);
CREATE INDEX idx_puntos_grabacion_coordenadas ON puntos_grabacion(latitud, longitud);
CREATE INDEX idx_puntos_grabacion_geografia ON puntos_grabacion USING gist(
    ST_SetSRID(ST_MakePoint(longitud, latitud), 4326)
);

-- ================================================
-- 3. ESQUEMA DE EQUIPOS Y CALIBRACIÓN
-- ================================================

CREATE TABLE equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES usuarios(id),
    proyecto_id UUID REFERENCES proyectos(id),
    nombre VARCHAR(200) NOT NULL,
    tipo_equipo VARCHAR(50) NOT NULL CHECK (tipo_equipo IN ('grabadora', 'microfono', 'sensor_meteorologico', 'gps', 'computadora', 'bateria', 'accesorio')),
    marca VARCHAR(100),
    modelo VARCHAR(100),
    numero_serie VARCHAR(100),
    descripcion TEXT,
    fecha_adquisicion DATE,
    fecha_ultimo_mantenimiento DATE,
    costo_adquisicion DECIMAL(10,2),
    estado VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'en_uso', 'mantenimiento', 'fuera_servicio')),
    notas_mantenimiento TEXT,
    ubicacion_almacen VARCHAR(200),
    calibracion_actual JSONB DEFAULT '{}', -- Estado actual de calibración
    metadata_tecnicos JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_equipos_user_id ON equipos(user_id);
CREATE INDEX idx_equipos_proyecto_id ON equipos(proyecto_id);
CREATE INDEX idx_equipos_tipo ON equipos(tipo_equipo);
CREATE INDEX idx_equipos_estado ON equipos(estado);
CREATE INDEX idx_equipos_numero_serie ON equipos(numero_serie);

CREATE TABLE equipos_calibraciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    fecha_calibracion DATE NOT NULL,
    tipo_calibracion VARCHAR(50) NOT NULL CHECK (tipo_calibracion IN ('periodica', 'correctiva', 'inicial', 'verificacion')),
    procedimiento VARCHAR(100),
    parametros_antes JSONB,
    parametros_despues JSONB,
    resultados_calibracion JSONB, -- Resultados detallados de la calibración
    diferencia_promedio DECIMAL(8,4),
    tolerancia_permitida DECIMAL(8,4),
    resultado VARCHAR(20) NOT NULL CHECK (resultado IN ('aprobado', 'rechazado', 'ajustar')),
    certificacion_vigente BOOLEAN DEFAULT TRUE,
    proxima_calibracion DATE,
    observaciones_calibracion TEXT,
    calibrado_por UUID REFERENCES usuarios(id),
    documento_calibracion VARCHAR(255), -- Ruta al archivo de calibración
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT calibracion_fecha_valida CHECK (fecha_calibracion <= CURRENT_DATE)
);

CREATE INDEX idx_calibraciones_equipo_id ON equipos_calibraciones(equipo_id);
CREATE INDEX idx_calibraciones_fecha ON equipos_calibraciones(fecha_calibracion);
CREATE INDEX idx_calibraciones_resultado ON equipos_calibraciones(resultado);

-- ================================================
-- 4. ESQUEMA DE GRABACIONES Y METADATOS DE AUDIO
-- ================================================

CREATE TABLE grabaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    punto_id UUID NOT NULL REFERENCES puntos_grabacion(id) ON DELETE RESTRICT,
    equipo_id UUID REFERENCES equipos(id),
    usuario_id UUID REFERENCES usuarios(id),
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo TEXT NOT NULL,
    tamano_archivo BIGINT,
    hash_archivo VARCHAR(64), -- SHA-256 hash del archivo
    inicio_grabacion TIMESTAMPTZ NOT NULL,
    fin_grabacion TIMESTAMPTZ NOT NULL,
    duracion_segundos INTEGER NOT NULL CHECK (duracion_segundos > 0),
    estado VARCHAR(20) DEFAULT 'grabada' CHECK (estado IN ('grabada', 'procesando', 'procesada', 'publicada', 'archivada')),
    nivel_ruido_promedio DECIMAL(8,4),
    snr_estimado DECIMAL(8,4),
    notas_campo TEXT,
    notas_operador TEXT,
    contexto_grabacion TEXT,
    configuracion_captura JSONB DEFAULT '{}', -- Configuración al momento de la grabación
    metadata_extras JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tiempos_validos CHECK (fin_grabacion > inicio_grabacion),
    CONSTRAINT nombre_archivo_unico UNIQUE(punto_id, nombre_archivo)
);

CREATE INDEX idx_grabaciones_punto_id ON grabaciones(punto_id);
CREATE INDEX idx_grabaciones_equipo_id ON grabaciones(equipo_id);
CREATE INDEX idx_grabaciones_usuario_id ON grabaciones(usuario_id);
CREATE INDEX idx_grabaciones_inicio ON grabaciones(inicio_grabacion);
CREATE INDEX idx_grabaciones_duracion ON grabaciones(duracion_segundos);
CREATE INDEX idx_grabaciones_estado ON grabaciones(estado);
CREATE INDEX idx_grabaciones_archivo_hash ON grabaciones(hash_archivo);

CREATE TABLE metadatos_audio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grabacion_id UUID UNIQUE NOT NULL REFERENCES grabaciones(id) ON DELETE CASCADE,
    codec VARCHAR(20) NOT NULL, -- 'pcm_s16le', 'flac', 'mp3', 'aac', etc.
    sample_rate INTEGER NOT NULL CHECK (sample_rate > 0),
    bit_depth VARCHAR(10), -- '16', '24', '32', 'float', etc.
    canales VARCHAR(10) NOT NULL, -- 'mono', 'stereo', '5.1', etc.
    bit_rate INTEGER, -- Para formatos comprimidos (bps)
    contenedor VARCHAR(20) NOT NULL, -- 'wav', 'flac', 'mp3', 'aiff', etc.
    compresion_ratio DECIMAL(5,2),
    calidad_audio VARCHAR(20) DEFAULT 'buena' CHECK (calidad_audio IN ('excelente', 'buena', 'regular', 'mala')),
    
    -- Análisis de nivel
    rms_db DECIMAL(6,2),
    peak_db DECIMAL(6,2),
    lufs_evaluados DECIMAL(6,2), -- Loudness units relative to Full Scale
    
    -- Análisis espectral
    frecuencia_central_hz DECIMAL(10,2),
    banda_frecuencial_principal VARCHAR(50),
    frecuencias_destacadas JSONB, -- Array de frecuencias prominentes
    
    -- Calidad de grabación
    distorsiones_detectadas INTEGER DEFAULT 0,
    recorte_detectado BOOLEAN DEFAULT FALSE,
    ruido_ambiental_promedio DECIMAL(6,2),
    snr_estimado DECIMAL(6,2),
    
    -- Procesamiento
    procesado BOOLEAN DEFAULT FALSE,
    aplicacion_filtros JSONB DEFAULT '{}',
    mejoras_aplicadas JSONB DEFAULT '{}',
    
    -- Metadatos estandarizados
    espectrograma_hash VARCHAR(64),
    espectrograma_dimensiones VARCHAR(20), -- '512x256', '1024x512', etc.
    
    -- Etiquetas de terceros
    metadata_id3 JSONB, -- Metadatos ID3 en formato JSON
    metadata_xmp JSONB, -- Metadatos XMP
    metadata_vorbis JSONB, -- Para FLAC/OGG
    
    -- Hashes y validaciones
    audio_hash_md5 VARCHAR(32),
    audio_hash_sha256 VARCHAR(64),
    checksum_integridad VARCHAR(64),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metadatos_codec ON metadatos_audio(codec);
CREATE INDEX idx_metadatos_sample_rate ON metadatos_audio(sample_rate);
CREATE INDEX idx_metadatos_calidad ON metadatos_audio(calidad_audio);
CREATE INDEX idx_metadatos_rms_db ON metadatos_audio(rms_db);
CREATE INDEX idx_metadatos_peak_db ON metadatos_audio(peak_db);

-- ================================================
-- 5. ESQUEMA DE CONDICIONES METEOROLÓGICAS
-- ================================================

CREATE TABLE condiciones_meteorologicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    punto_id UUID REFERENCES puntos_grabacion(id),
    grabacion_id UUID REFERENCES grabaciones(id),
    timestamp_medicion TIMESTAMPTZ NOT NULL,
    
    -- Variables primarias (conformes EPA)
    temperatura_celsius DECIMAL(4,1),
    humedad_pct DECIMAL(5,2) CHECK (humedad_pct >= 0 AND humedad_pct <= 100),
    presion_hectopascales DECIMAL(7,2) CHECK (presion_hectopascales > 0),
    velocidad_viento_ms DECIMAL(4,1) CHECK (velocidad_viento_ms >= 0),
    direccion_viento_grados DECIMAL(5,2) CHECK (direccion_viento_grados >= 0 AND direccion_viento_grados < 360),
    precipitacion_mm DECIMAL(4,1) CHECK (precipitacion_mm >= 0),
    radiacion_solar DECIMAL(6,2), -- W/m²
    
    -- Variables derivadas y de calidad
    velocidad_viento_rachas_ms DECIMAL(4,1),
    direccion_viento_rachas_grados DECIMAL(5,2),
    temperatura_sensacion_termica_celsius DECIMAL(4,1),
    indice_uv DECIMAL(3,1) CHECK (indice_uv >= 0),
    visibilidad_metros DECIMAL(7,1),
    nubosidad_pct DECIMAL(3,0) CHECK (nubosidad_pct >= 0 AND nubosidad_pct <= 100),
    
    -- Condiciones categóricas
    condiciones_cielo VARCHAR(20) CHECK (condiciones_cielo IN ('despejado', 'parcialmente_nublado', 'nublado', 'lluvioso', 'nieve', 'niebla')),
    precipitacion_tipo VARCHAR(20) CHECK (precipitacion_tipo IN ('ninguna', 'llovizna', 'lluvia', 'granizo', 'nieve')),
    intensidad_lluvia VARCHAR(15) CHECK (intensidad_lluvia IN ('sin_lluvia', 'ligera', 'moderada', 'fuerte')),
    intensidad_viento VARCHAR(15) CHECK (intensidad_viento IN ('calma', 'ligero', 'moderado', 'fuerte', 'tempestuoso')),
    
    -- Metadatos de medición
    fuente_datos VARCHAR(30) DEFAULT 'manual' CHECK (fuente_datos IN ('manual', 'automatico', 'sensor_remoto', 'estacion_meteorologica')),
    latitud_medicion DECIMAL(10,7),
    longitud_medicion DECIMAL(10,7),
    altitud_medicion DECIMAL(7,2),
    precision_gps_medicion DECIMAL(5,2),
    
    -- Control de calidad
    validacion_manual BOOLEAN DEFAULT FALSE,
    validado_por UUID REFERENCES usuarios(id),
    fecha_validacion TIMESTAMPTZ,
    calidad_medicion VARCHAR(20) DEFAULT 'pendiente' CHECK (calidad_medicion IN ('pendiente', 'valida', 'sospechosa', 'invalida')),
    notas_calidad TEXT,
    
    -- Procesamiento de datos
    variables_atmosfericas JSONB DEFAULT '{}', -- Variables adicionales específicas del sitio
    procesamiento_calidad JSONB DEFAULT '{}', -- Flags y correcciones aplicadas
    
    -- Metadatos del instrumento
    equipo_meteo_usado VARCHAR(100),
    calibracion_vigente BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT temperatura_rango CHECK (temperatura_celsius BETWEEN -50 AND 60),
    CONSTRAINT presion_rango CHECK (presion_hectopascales BETWEEN 800 AND 1200),
    CONSTRAINT visibilidad_minima CHECK (visibilidad_metros IS NULL OR visibilidad_metros >= 0)
);

CREATE INDEX idx_meteo_punto_id ON condiciones_meteorologicas(punto_id);
CREATE INDEX idx_meteo_grabacion_id ON condiciones_meteorologicas(grabacion_id);
CREATE INDEX idx_meteo_timestamp ON condiciones_meteorologicas(timestamp_medicion);
CREATE INDEX idx_meteo_coordenadas ON condiciones_meteorologicas(latitud_medicion, longitud_medicion);
CREATE INDEX idx_meteo_calidad ON condiciones_meteorologicas(calidad_medicion);
CREATE INDEX idx_meteo_equipo ON condiciones_meteorologicas(equipo_meteo_usado);

-- ================================================
-- 6. ESQUEMA DE ANÁLISIS DE IA
-- ================================================

CREATE TABLE analisis_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grabacion_id UUID NOT NULL REFERENCES grabaciones(id) ON DELETE CASCADE,
    modelo_ia VARCHAR(100) NOT NULL,
    version_modelo VARCHAR(50) NOT NULL,
    configuracion_modelo JSONB DEFAULT '{}',
    
    -- Resultados del análisis
    resultados_json JSONB NOT NULL,
    tiempo_procesamiento_segundos INTEGER,
    nivel_confianza_promedio DECIMAL(5,4),
    algoritmo_usado VARCHAR(100),
    
    -- Estados del procesamiento
    estado_procesamiento VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_procesamiento IN ('pendiente', 'procesando', 'completado', 'fallido', 'cancelado')),
    intentos_procesamiento INTEGER DEFAULT 0,
    fecha_inicio_procesamiento TIMESTAMPTZ,
    fecha_fin_procesamiento TIMESTAMPTZ,
    error_mensaje TEXT,
    
    -- Metadatos técnicos
    recursos_computacionales JSONB DEFAULT '{}',
    parametros_entrenamiento JSONB DEFAULT '{}',
    metricas_rendimiento JSONB DEFAULT '{}',
    validacion_cruzada DECIMAL(3,2), -- Porcentaje de accuracy
    matriz_confusion JSONB, -- Para análisis de clasificación
    
    -- Metadatos del análisis
    notas_ia TEXT,
    limitaciones_detectadas TEXT,
    limitaciones_modelo TEXT,
    recomendaciones_uso TEXT,
    
    metadata_extras JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tiempo_procesamiento_positivo CHECK (tiempo_procesamiento_segundos IS NULL OR tiempo_procesamiento_segundos >= 0)
);

CREATE INDEX idx_analisis_grabacion_id ON analisis_ia(grabacion_id);
CREATE INDEX idx_analisis_modelo ON analisis_ia(modelo_ia, version_modelo);
CREATE INDEX idx_analisis_estado ON analisis_ia(estado_procesamiento);
CREATE INDEX idx_analisis_confianza ON analisis_ia(nivel_confianza_promedio);
CREATE INDEX idx_analisis_fecha ON analisis_ia(fecha_inicio_procesamiento);

-- ================================================
-- 7. ESQUEMA DE TAGS Y CLASIFICACIÓN
-- ================================================

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('especie', 'fuente_sonora', 'ubicacion', 'tecnica_grabacion', 'condiciones', 'evento', 'tipo_ambiente')),
    descripcion TEXT,
    color_hex VARCHAR(7) DEFAULT '#000000',
    icono VARCHAR(50),
    nivel_confianza_default DECIMAL(3,2) DEFAULT 0.5,
    activo BOOLEAN DEFAULT TRUE,
    es_sistemico BOOLEAN DEFAULT FALSE, -- Tags creados por el sistema
    taxonomias_relacionadas JSONB DEFAULT '{}',
    metadata_schema JSONB DEFAULT '{}',
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT slug_formato CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT color_hex_valido CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_categoria ON tags(categoria);
CREATE INDEX idx_tags_activo ON tags(activo);
CREATE INDEX idx_tags_created_by ON tags(created_by);

CREATE TABLE grabaciones_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grabacion_id UUID NOT NULL REFERENCES grabaciones(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    confianza DECIMAL(3,2) CHECK (confianza >= 0 AND confianza <= 1),
    timestamp_evento TIMESTAMPTZ,
    duracion_evento INTEGER, -- Duración del evento en segundos
    frecuencia_inicial INTEGER, -- Hz
    frecuencia_final INTEGER, -- Hz
    nivel_db DECIMAL(6,2),
    notas_tag TEXT,
    contexto_deteccion JSONB DEFAULT '{}',
    metadata_contexto JSONB DEFAULT '{}',
    creado_automaticamente BOOLEAN DEFAULT FALSE,
    confirmado_usuario BOOLEAN DEFAULT FALSE,
    creado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(grabacion_id, tag_id, timestamp_evento)
);

CREATE INDEX idx_grabaciones_tags_grabacion_id ON grabaciones_tags(grabacion_id);
CREATE INDEX idx_grabaciones_tags_tag_id ON grabaciones_tags(tag_id);
CREATE INDEX idx_grabaciones_tags_confianza ON grabaciones_tags(confianza);
CREATE INDEX idx_grabaciones_tags_timestamp ON grabaciones_tags(timestamp_evento);
CREATE INDEX idx_grabaciones_tags_frecuencia ON grabaciones_tags(frecuencia_inicial, frecuencia_final);

-- ================================================
-- 8. ESQUEMA DE PROCESAMIENTO DE SEÑALES
-- ================================================

CREATE TABLE procesamiento_senales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grabacion_id UUID NOT NULL REFERENCES grabaciones(id) ON DELETE CASCADE,
    tipo_procesamiento VARCHAR(50) NOT NULL CHECK (tipo_procesamiento IN ('reduccion_ruido', 'normalizacion', 'ecualizacion', 'mejora_snr', 'eliminacion_eco', 'compresion', 'limitacion', 'filtros_paso', 'detector_eventos')),
    algoritmo_usado VARCHAR(100) NOT NULL,
    version_algoritmo VARCHAR(50),
    
    -- Parámetros del procesamiento
    parametros_procesamiento JSONB NOT NULL,
    parametros_optimizacion JSONB DEFAULT '{}',
    
    -- Resultados del procesamiento
    resultados_procesamiento JSONB,
    mejora_snr DECIMAL(6,2),
    reduccion_ruido_db DECIMAL(6,2),
    cambio_calidad_percibida TEXT,
    
    -- Estados y métricas
    estado_procesamiento VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_procesamiento IN ('pendiente', 'procesando', 'completado', 'fallido')),
    tiempo_procesamiento_segundos DECIMAL(8,3),
    porcentaje_mejora_calidad DECIMAL(5,2),
    recursos_utilizados JSONB DEFAULT '{}',
    
    -- Archivos de salida
    archivo_procesado_path TEXT,
    archivo_diferencias_path TEXT,
    hash_archivo_original VARCHAR(64),
    hash_archivo_procesado VARCHAR(64),
    
    -- Validación
    validado_por UUID REFERENCES usuarios(id),
    fecha_validacion TIMESTAMPTZ,
    aprobado BOOLEAN DEFAULT FALSE,
    notas_validacion TEXT,
    
    metadata_extras JSONB DEFAULT '{}',
    creado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_procesamiento_grabacion_id ON procesamiento_senales(grabacion_id);
CREATE INDEX idx_procesamiento_tipo ON procesamiento_senales(tipo_procesamiento);
CREATE INDEX idx_procesamiento_estado ON procesamiento_senales(estado_procesamiento);
CREATE INDEX idx_procesamiento_mejora_snr ON procesamiento_senales(mejora_snr);

-- ================================================
-- 9. ESQUEMA DE CONFIGURACIONES
-- ================================================

CREATE TABLE configuraciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES usuarios(id),
    proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
    ruta_id UUID REFERENCES rutas(id) ON DELETE CASCADE,
    
    tipo_configuracion VARCHAR(50) NOT NULL CHECK (tipo_configuracion IN ('grabacion', 'analisis', 'procesamiento', 'exportacion', 'ui', 'sistema')),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    version VARCHAR(20) DEFAULT '1.0',
    
    -- Configuraciones específicas por tipo
    parametros_audio JSONB DEFAULT '{}', -- Configuración para grabación de audio
    configuracion_gps JSONB DEFAULT '{}', -- Configuración GPS
    configuracion_meteorologia JSONB DEFAULT '{}', -- Configuración sensores meteorológicos
    configuracion_analisis_ia JSONB DEFAULT '{}', -- Configuración modelos de IA
    
    -- Metadatos de configuración
    activa BOOLEAN DEFAULT TRUE,
    por_defecto BOOLEAN DEFAULT FALSE,
    herencia_permitida BOOLEAN DEFAULT TRUE,
    plantillas_aplicables JSONB DEFAULT '{}',
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, proyecto_id, ruta_id, tipo_configuracion, nombre, version)
);

CREATE INDEX idx_configuraciones_user_id ON configuraciones(user_id);
CREATE INDEX idx_configuraciones_proyecto_id ON configuraciones(proyecto_id);
CREATE INDEX idx_configuraciones_ruta_id ON configuraciones(ruta_id);
CREATE INDEX idx_configuraciones_tipo ON configuraciones(tipo_configuracion);
CREATE INDEX idx_configuraciones_activa ON configuraciones(activa);

-- ================================================
-- 10. FUNCIONES Y TRIGGERS AUXILIARES
-- ================================================

-- Función para actualizar timestamp de modificación
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar timestamps automáticamente
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proyectos_updated_at 
    BEFORE UPDATE ON proyectos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rutas_updated_at 
    BEFORE UPDATE ON rutas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_puntos_grabacion_updated_at 
    BEFORE UPDATE ON puntos_grabacion 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grabaciones_updated_at 
    BEFORE UPDATE ON grabaciones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metadatos_audio_updated_at 
    BEFORE UPDATE ON metadatos_audio 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analisis_ia_updated_at 
    BEFORE UPDATE ON analisis_ia 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_condiciones_meteorologicas_updated_at 
    BEFORE UPDATE ON condiciones_meteorologicas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipos_updated_at 
    BEFORE UPDATE ON equipos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuraciones_updated_at 
    BEFORE UPDATE ON configuraciones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_procesamiento_senales_updated_at 
    BEFORE UPDATE ON procesamiento_senales 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at 
    BEFORE UPDATE ON tags 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 11. ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ================================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_grabaciones_complejo ON grabaciones(punto_id, inicio_grabacion, estado);
CREATE INDEX idx_analisis_ia_complejo ON analisis_ia(modelo_ia, version_modelo, estado_procesamiento);
CREATE INDEX idx_meteo_temporal ON condiciones_meteorologicas(timestamp_medicion, calidad_medicion);
CREATE INDEX idx_procesamiento_grabacion_tipo ON procesamiento_senales(grabacion_id, tipo_procesamiento);

-- Índices para búsquedas de texto completo
CREATE INDEX idx_grabaciones_search ON grabaciones USING gin(to_tsvector('spanish', nombre_archivo || ' ' || COALESCE(notas_campo, '')));
CREATE INDEX idx_tags_search ON tags USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(descripcion, '')));
CREATE INDEX idx_proyectos_search ON proyectos USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(descripcion, '')));

-- ================================================
-- 12. VISTAS ÚTILES PARA REPORTES
-- ================================================

-- Vista para resumen de proyectos
CREATE OR REPLACE VIEW vista_resumen_proyectos AS
SELECT 
    p.id,
    p.nombre,
    p.estado,
    p.fecha_inicio,
    p.fecha_fin,
    u.nombre || ' ' || u.apellido as owner,
    COUNT(r.id) as total_rutas,
    COUNT(pg.id) as total_puntos,
    COUNT(g.id) as total_grabaciones,
    SUM(g.duracion_segundos) as duracion_total_segundos,
    COUNT(DISTINCT ai.id) as total_analisis_ia,
    AVG(cm.temperatura_celsius) as temperatura_promedio,
    COUNT(DISTINCT t.id) as tags_utilizados
FROM proyectos p
JOIN usuarios u ON p.user_id = u.id
LEFT JOIN rutas r ON r.proyecto_id = p.id
LEFT JOIN puntos_grabacion pg ON pg.ruta_id = r.id
LEFT JOIN grabaciones g ON g.punto_id = pg.id
LEFT JOIN analisis_ia ai ON ai.grabacion_id = g.id
LEFT JOIN condiciones_meteorologicas cm ON cm.punto_id = pg.id
LEFT JOIN grabaciones_tags gt ON gt.grabacion_id = g.id
LEFT JOIN tags t ON t.id = gt.tag_id
WHERE t.activo IS TRUE OR t.id IS NULL
GROUP BY p.id, p.nombre, p.estado, p.fecha_inicio, p.fecha_fin, u.nombre, u.apellido;

-- Vista para análisis de calidad de grabaciones
CREATE OR REPLACE VIEW vista_calidad_grabaciones AS
SELECT 
    g.id,
    g.nombre_archivo,
    pg.nombre as punto_grabacion,
    r.nombre as ruta_nombre,
    p.nombre as proyecto_nombre,
    g.inicio_grabacion,
    g.duracion_segundos,
    g.estado,
    ma.codec,
    ma.sample_rate,
    ma.calidad_audio,
    ma.rms_db,
    ma.peak_db,
    ma.snr_estimado,
    ai.modelo_ia,
    ai.nivel_confianza_promedio,
    COUNT(gt.id) as tags_encontrados,
    cm.temperatura_celsius as temp_grabacion,
    cm.humedad_pct as humedad_grabacion,
    cm.velocidad_viento_ms as viento_grabacion
FROM grabaciones g
JOIN puntos_grabacion pg ON g.punto_id = pg.id
JOIN rutas r ON pg.ruta_id = r.id
JOIN proyectos p ON r.proyecto_id = p.id
LEFT JOIN metadatos_audio ma ON ma.grabacion_id = g.id
LEFT JOIN analisis_ia ai ON ai.grabacion_id = g.id
LEFT JOIN grabaciones_tags gt ON gt.grabacion_id = g.id
LEFT JOIN condiciones_meteorologicas cm ON cm.grabacion_id = g.id
GROUP BY g.id, g.nombre_archivo, pg.nombre, r.nombre, p.nombre, 
         g.inicio_grabacion, g.duracion_segundos, g.estado,
         ma.codec, ma.sample_rate, ma.calidad_audio, ma.rms_db, ma.peak_db, ma.snr_estimado,
         ai.modelo_ia, ai.nivel_confianza_promedio,
         cm.temperatura_celsius, cm.humedad_pct, cm.velocidad_viento_ms;

-- ================================================
-- 13. DATOS DE EJEMPLO (OPCIONAL)
-- ================================================

-- Usuarios de ejemplo
INSERT INTO usuarios (id, email, nombre, apellido, rol, salt, password_hash) VALUES
(gen_random_uuid(), 'admin@sonimax.com', 'Administrador', 'Sistema', 'administrador', 'salt1', 'hashed_password_1'),
(gen_random_uuid(), 'investigador@sonimax.com', 'Dr. Juan', 'Pérez', 'investigador', 'salt2', 'hashed_password_2'),
(gen_random_uuid(), 'operador@sonimax.com', 'María', 'García', 'operador', 'salt3', 'hashed_password_3');

-- Tags de ejemplo
INSERT INTO tags (id, nombre, slug, categoria, descripcion, color_hex) VALUES
(gen_random_uuid(), 'Pájaros', 'pajaros', 'especie', 'Grabaciones que contienen sonidos de aves', '#FF6B6B'),
(gen_random_uuid(), 'Insectos', 'insectos', 'especie', 'Sonidos de insectos', '#4ECDC4'),
(gen_random_uuid(), 'Viento', 'viento', 'fuente_sonora', 'Sonidos del viento', '#45B7D1'),
(gen_random_uuid(), 'Lluvia', 'lluvia', 'fuente_sonora', 'Sonidos de lluvia', '#96CEB4'),
(gen_random_uuid(), 'Bosque', 'bosque', 'tipo_ambiente', 'Ambiente de bosque', '#FECA57'),
(gen_random_uuid(), 'Urbano', 'urbano', 'tipo_ambiente', 'Ambiente urbano', '#FF9FF3');

-- Configuraciones por defecto
INSERT INTO configuraciones (id, user_id, tipo_configuracion, nombre, parametros_audio, configuracion_gps, configuracion_meteorologia) 
SELECT 
    gen_random_uuid(),
    u.id,
    'grabacion',
    'Configuración Básica',
    '{"sample_rate": 44100, "bit_depth": 16, "channels": "stereo", "gain": 0.8}'::jsonb,
    '{"gps_enabled": true, "accuracy_threshold": 10, "log_interval": 1}'::jsonb,
    '{"sensors_enabled": true, "log_interval": 60, "temp_compensation": true}'::jsonb
FROM usuarios u WHERE u.rol = 'administrador' LIMIT 1;

-- ================================================
-- FIN DEL ESQUEMA
-- ================================================