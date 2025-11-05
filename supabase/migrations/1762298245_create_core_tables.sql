-- Migration: create_core_tables
-- Created at: 1762298245

-- Crear tablas principales del sistema SonimaX

-- Tabla de usuarios (Supabase Auth se encarga de la autenticación, esto es perfil extendido)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'operador' CHECK (rol IN ('administrador', 'investigador', 'operador', 'analista')),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de proyectos
CREATE TABLE IF NOT EXISTS proyectos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    objetivos TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    ubicacion VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'planificado' CHECK (estado IN ('planificado', 'activo', 'completado', 'suspendido')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de rutas
CREATE TABLE IF NOT EXISTS rutas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo_ruta VARCHAR(50) DEFAULT 'transecto' CHECK (tipo_ruta IN ('transecto', 'punto_fijo', 'aleatorio', 'sistematico')),
    geometria JSONB,
    configuracion JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de puntos de grabación
CREATE TABLE IF NOT EXISTS puntos_grabacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ruta_id UUID NOT NULL,
    nombre VARCHAR(200),
    descripcion TEXT,
    latitud DECIMAL(10,7) NOT NULL,
    longitud DECIMAL(10,7) NOT NULL,
    altitud DECIMAL(7,2),
    precision_gps DECIMAL(5,2),
    velocidad_kmh DECIMAL(5,2),
    direccion_grados DECIMAL(5,2),
    timestamp_gps TIMESTAMPTZ,
    horizonte_visible DECIMAL(3,1),
    obstaculos_cercanos TEXT,
    condiciones_ambientales JSONB DEFAULT '{}',
    metadata_extras JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT coords_validas CHECK (latitud BETWEEN -90 AND 90 AND longitud BETWEEN -180 AND 180)
);

-- Crear índices para las tablas principales
CREATE INDEX IF NOT EXISTS idx_proyectos_user_id ON proyectos(user_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_rutas_proyecto_id ON rutas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_rutas_tipo ON rutas(tipo_ruta);
CREATE INDEX IF NOT EXISTS idx_puntos_ruta_id ON puntos_grabacion(ruta_id);
CREATE INDEX IF NOT EXISTS idx_puntos_coordenadas ON puntos_grabacion(latitud, longitud);;