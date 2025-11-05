-- Migration: create_supporting_tables
-- Created at: 1762298247

-- Crear tablas de soporte y configuración

-- Tabla de configuraciones
CREATE TABLE IF NOT EXISTS configuraciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    proyecto_id UUID,
    ruta_id UUID,
    tipo_configuracion VARCHAR(50) NOT NULL CHECK (tipo_configuracion IN ('grabacion', 'analisis', 'procesamiento', 'exportacion', 'ui', 'sistema')),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    version VARCHAR(20) DEFAULT '1.0',
    parametros_audio JSONB DEFAULT '{}',
    configuracion_gps JSONB DEFAULT '{}',
    configuracion_meteorologia JSONB DEFAULT '{}',
    configuracion_analisis_ia JSONB DEFAULT '{}',
    activa BOOLEAN DEFAULT TRUE,
    por_defecto BOOLEAN DEFAULT FALSE,
    herencia_permitida BOOLEAN DEFAULT TRUE,
    plantillas_aplicables JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de procesamiento de señales
CREATE TABLE IF NOT EXISTS procesamiento_senales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grabacion_id UUID NOT NULL,
    tipo_procesamiento VARCHAR(50) NOT NULL CHECK (tipo_procesamiento IN ('reduccion_ruido', 'normalizacion', 'ecualizacion', 'mejora_snr', 'eliminacion_eco', 'compresion', 'limitacion', 'filtros_paso', 'detector_eventos')),
    algoritmo_usado VARCHAR(100) NOT NULL,
    version_algoritmo VARCHAR(50),
    parametros_procesamiento JSONB NOT NULL,
    parametros_optimizacion JSONB DEFAULT '{}',
    resultados_procesamiento JSONB,
    mejora_snr DECIMAL(6,2),
    reduccion_ruido_db DECIMAL(6,2),
    cambio_calidad_percibida TEXT,
    estado_procesamiento VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_procesamiento IN ('pendiente', 'procesando', 'completado', 'fallido')),
    tiempo_procesamiento_segundos DECIMAL(8,3),
    porcentaje_mejora_calidad DECIMAL(5,2),
    recursos_utilizados JSONB DEFAULT '{}',
    archivo_procesado_path TEXT,
    archivo_diferencias_path TEXT,
    hash_archivo_original VARCHAR(64),
    hash_archivo_procesado VARCHAR(64),
    validado_por UUID,
    fecha_validacion TIMESTAMPTZ,
    aprobado BOOLEAN DEFAULT FALSE,
    notas_validacion TEXT,
    metadata_extras JSONB DEFAULT '{}',
    creado_por UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de calibraciones de equipos
CREATE TABLE IF NOT EXISTS equipos_calibraciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id UUID NOT NULL,
    fecha_calibracion DATE NOT NULL,
    tipo_calibracion VARCHAR(50) NOT NULL CHECK (tipo_calibracion IN ('periodica', 'correctiva', 'inicial', 'verificacion')),
    procedimiento VARCHAR(100),
    parametros_antes JSONB,
    parametros_despues JSONB,
    resultados_calibracion JSONB,
    diferencia_promedio DECIMAL(8,4),
    tolerancia_permitida DECIMAL(8,4),
    resultado VARCHAR(20) NOT NULL CHECK (resultado IN ('aprobado', 'rechazado', 'ajustar')),
    certificacion_vigente BOOLEAN DEFAULT TRUE,
    proxima_calibracion DATE,
    observaciones_calibracion TEXT,
    calibrado_por UUID,
    documento_calibracion VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT calibracion_fecha_valida CHECK (fecha_calibracion <= CURRENT_DATE)
);

-- Crear índices para configuraciones y procesamiento
CREATE INDEX IF NOT EXISTS idx_configuraciones_user_id ON configuraciones(user_id);
CREATE INDEX IF NOT EXISTS idx_configuraciones_proyecto_id ON configuraciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_configuraciones_ruta_id ON configuraciones(ruta_id);
CREATE INDEX IF NOT EXISTS idx_configuraciones_tipo ON configuraciones(tipo_configuracion);
CREATE INDEX IF NOT EXISTS idx_configuraciones_activa ON configuraciones(activa);
CREATE INDEX IF NOT EXISTS idx_procesamiento_grabacion_id ON procesamiento_senales(grabacion_id);
CREATE INDEX IF NOT EXISTS idx_procesamiento_tipo ON procesamiento_senales(tipo_procesamiento);
CREATE INDEX IF NOT EXISTS idx_procesamiento_estado ON procesamiento_senales(estado_procesamiento);
CREATE INDEX IF NOT EXISTS idx_calibraciones_equipo_id ON equipos_calibraciones(equipo_id);
CREATE INDEX IF NOT EXISTS idx_calibraciones_fecha ON equipos_calibraciones(fecha_calibracion);
CREATE INDEX IF NOT EXISTS idx_calibraciones_resultado ON equipos_calibraciones(resultado);;