-- Migration: create_advanced_features_tables
-- Created at: 1762323715

-- ================================================
-- TABLAS PARA FUNCIONALIDADES AVANZADAS SONIMAX
-- ================================================

-- Tabla para imágenes de lugares
CREATE TABLE IF NOT EXISTS imagenes_lugares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    punto_id UUID REFERENCES puntos_grabacion(id) ON DELETE SET NULL,
    grabacion_id UUID REFERENCES grabaciones(id) ON DELETE SET NULL,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_storage TEXT NOT NULL,
    url_publica TEXT,
    tamano_archivo BIGINT,
    tipo_mime VARCHAR(100),
    ancho_px INTEGER,
    alto_px INTEGER,
    latitud DECIMAL(10,7),
    longitud DECIMAL(10,7),
    altitud DECIMAL(7,2),
    timestamp_captura TIMESTAMPTZ,
    descripcion TEXT,
    tags TEXT[],
    metadata_exif JSONB DEFAULT '{}',
    metadata_extras JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT imagenes_coords_validas CHECK (
        (latitud IS NULL AND longitud IS NULL) OR 
        (latitud BETWEEN -90 AND 90 AND longitud BETWEEN -180 AND 180)
    )
);

CREATE INDEX idx_imagenes_proyecto_id ON imagenes_lugares(proyecto_id);
CREATE INDEX idx_imagenes_punto_id ON imagenes_lugares(punto_id);
CREATE INDEX idx_imagenes_grabacion_id ON imagenes_lugares(grabacion_id);
CREATE INDEX idx_imagenes_usuario_id ON imagenes_lugares(usuario_id);
CREATE INDEX idx_imagenes_timestamp ON imagenes_lugares(timestamp_captura);
CREATE INDEX idx_imagenes_tags ON imagenes_lugares USING gin(tags);

-- Tabla para colaboradores de proyectos
CREATE TABLE IF NOT EXISTS proyecto_colaboradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rol VARCHAR(20) NOT NULL DEFAULT 'visualizador' CHECK (rol IN ('propietario', 'editor', 'visualizador')),
    permisos JSONB DEFAULT '{"ver": true, "editar": false, "eliminar": false, "compartir": false, "configurar": false}',
    invitado_por UUID REFERENCES auth.users(id),
    fecha_invitacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fecha_aceptacion TIMESTAMPTZ,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('pendiente', 'activo', 'suspendido', 'rechazado')),
    notificaciones_activas BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(proyecto_id, usuario_id)
);

CREATE INDEX idx_colaboradores_proyecto_id ON proyecto_colaboradores(proyecto_id);
CREATE INDEX idx_colaboradores_usuario_id ON proyecto_colaboradores(usuario_id);
CREATE INDEX idx_colaboradores_rol ON proyecto_colaboradores(rol);
CREATE INDEX idx_colaboradores_estado ON proyecto_colaboradores(estado);

-- Tabla para comentarios en grabaciones e imágenes
CREATE TABLE IF NOT EXISTS comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    grabacion_id UUID REFERENCES grabaciones(id) ON DELETE CASCADE,
    imagen_id UUID REFERENCES imagenes_lugares(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contenido TEXT NOT NULL,
    timestamp_audio DECIMAL(10,3), -- Timestamp en segundos si es comentario en audio
    respuesta_a UUID REFERENCES comentarios(id) ON DELETE CASCADE,
    mencionados UUID[],
    editado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT comentario_tiene_referencia CHECK (
        grabacion_id IS NOT NULL OR imagen_id IS NOT NULL
    )
);

CREATE INDEX idx_comentarios_proyecto_id ON comentarios(proyecto_id);
CREATE INDEX idx_comentarios_grabacion_id ON comentarios(grabacion_id);
CREATE INDEX idx_comentarios_imagen_id ON comentarios(imagen_id);
CREATE INDEX idx_comentarios_usuario_id ON comentarios(usuario_id);
CREATE INDEX idx_comentarios_respuesta_a ON comentarios(respuesta_a);

-- Tabla para actividad del proyecto (log de colaboración)
CREATE TABLE IF NOT EXISTS actividad_proyecto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo_actividad VARCHAR(50) NOT NULL CHECK (tipo_actividad IN (
        'creacion_proyecto', 'edicion_proyecto', 'eliminacion_proyecto',
        'creacion_ruta', 'edicion_ruta', 'eliminacion_ruta',
        'creacion_grabacion', 'edicion_grabacion', 'eliminacion_grabacion',
        'creacion_imagen', 'edicion_imagen', 'eliminacion_imagen',
        'creacion_comentario', 'edicion_comentario', 'eliminacion_comentario',
        'compartir_proyecto', 'cambio_permisos', 'acceso_proyecto',
        'analisis_completado', 'configuracion_modificada', 'exportacion_datos'
    )),
    entidad_tipo VARCHAR(50), -- Tipo de entidad afectada (grabacion, imagen, comentario, etc.)
    entidad_id UUID, -- ID de la entidad afectada
    descripcion TEXT,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_actividad_proyecto_id ON actividad_proyecto(proyecto_id);
CREATE INDEX idx_actividad_usuario_id ON actividad_proyecto(usuario_id);
CREATE INDEX idx_actividad_tipo ON actividad_proyecto(tipo_actividad);
CREATE INDEX idx_actividad_entidad ON actividad_proyecto(entidad_tipo, entidad_id);
CREATE INDEX idx_actividad_created_at ON actividad_proyecto(created_at DESC);

-- Tabla para waypoints de rutas planificadas
CREATE TABLE IF NOT EXISTS puntos_ruta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ruta_id UUID NOT NULL REFERENCES rutas(id) ON DELETE CASCADE,
    orden INTEGER NOT NULL,
    tipo_punto VARCHAR(50) DEFAULT 'waypoint' CHECK (tipo_punto IN ('inicio', 'waypoint', 'punto_interes', 'fin')),
    nombre VARCHAR(200),
    descripcion TEXT,
    latitud DECIMAL(10,7) NOT NULL,
    longitud DECIMAL(10,7) NOT NULL,
    altitud DECIMAL(7,2),
    distancia_desde_anterior DECIMAL(10,2), -- Distancia en metros
    tiempo_estimado_desde_anterior INTEGER, -- Tiempo en segundos
    actividades_planificadas TEXT[],
    duracion_estimada_minutos INTEGER,
    notas TEXT,
    completado BOOLEAN DEFAULT FALSE,
    fecha_completado TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT puntos_ruta_coords_validas CHECK (
        latitud BETWEEN -90 AND 90 AND longitud BETWEEN -180 AND 180
    ),
    UNIQUE(ruta_id, orden)
);

CREATE INDEX idx_puntos_ruta_ruta_id ON puntos_ruta(ruta_id);
CREATE INDEX idx_puntos_ruta_orden ON puntos_ruta(ruta_id, orden);
CREATE INDEX idx_puntos_ruta_tipo ON puntos_ruta(tipo_punto);
CREATE INDEX idx_puntos_ruta_completado ON puntos_ruta(completado);
CREATE INDEX idx_puntos_ruta_coordenadas ON puntos_ruta(latitud, longitud);

-- Trigger para updated_at en nuevas tablas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_imagenes_lugares_updated_at BEFORE UPDATE ON imagenes_lugares
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proyecto_colaboradores_updated_at BEFORE UPDATE ON proyecto_colaboradores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comentarios_updated_at BEFORE UPDATE ON comentarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_puntos_ruta_updated_at BEFORE UPDATE ON puntos_ruta
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Configurar RLS para las nuevas tablas
ALTER TABLE imagenes_lugares ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyecto_colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividad_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE puntos_ruta ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para imagenes_lugares
CREATE POLICY "Los usuarios pueden ver sus propias imágenes" ON imagenes_lugares
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Los usuarios pueden ver imágenes de proyectos compartidos" ON imagenes_lugares
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM proyecto_colaboradores
            WHERE proyecto_id = imagenes_lugares.proyecto_id
            AND usuario_id = auth.uid()
            AND estado = 'activo'
        )
    );

CREATE POLICY "Los usuarios pueden insertar sus propias imágenes" ON imagenes_lugares
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias imágenes" ON imagenes_lugares
    FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Los usuarios pueden eliminar sus propias imágenes" ON imagenes_lugares
    FOR DELETE USING (auth.uid() = usuario_id);

-- Políticas RLS para proyecto_colaboradores
CREATE POLICY "Los usuarios pueden ver colaboradores de sus proyectos" ON proyecto_colaboradores
    FOR SELECT USING (
        auth.uid() = usuario_id OR
        EXISTS (
            SELECT 1 FROM proyectos
            WHERE id = proyecto_colaboradores.proyecto_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Los propietarios pueden gestionar colaboradores" ON proyecto_colaboradores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM proyectos
            WHERE id = proyecto_colaboradores.proyecto_id
            AND user_id = auth.uid()
        )
    );

-- Políticas RLS para comentarios
CREATE POLICY "Los usuarios pueden ver comentarios de proyectos compartidos" ON comentarios
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM proyecto_colaboradores
            WHERE proyecto_id = comentarios.proyecto_id
            AND usuario_id = auth.uid()
            AND estado = 'activo'
        )
    );

CREATE POLICY "Los usuarios pueden crear comentarios en proyectos compartidos" ON comentarios
    FOR INSERT WITH CHECK (
        auth.uid() = usuario_id AND
        EXISTS (
            SELECT 1 FROM proyecto_colaboradores
            WHERE proyecto_id = comentarios.proyecto_id
            AND usuario_id = auth.uid()
            AND estado = 'activo'
        )
    );

CREATE POLICY "Los usuarios pueden editar sus propios comentarios" ON comentarios
    FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios comentarios" ON comentarios
    FOR DELETE USING (auth.uid() = usuario_id);

-- Políticas RLS para actividad_proyecto
CREATE POLICY "Los usuarios pueden ver actividad de sus proyectos" ON actividad_proyecto
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM proyecto_colaboradores
            WHERE proyecto_id = actividad_proyecto.proyecto_id
            AND usuario_id = auth.uid()
            AND estado = 'activo'
        )
    );

CREATE POLICY "Solo el sistema puede insertar actividad" ON actividad_proyecto
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Políticas RLS para puntos_ruta
CREATE POLICY "Los usuarios pueden ver puntos de ruta de proyectos compartidos" ON puntos_ruta
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rutas r
            JOIN proyecto_colaboradores pc ON pc.proyecto_id = r.proyecto_id
            WHERE r.id = puntos_ruta.ruta_id
            AND pc.usuario_id = auth.uid()
            AND pc.estado = 'activo'
        )
    );

CREATE POLICY "Los editores pueden gestionar puntos de ruta" ON puntos_ruta
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM rutas r
            JOIN proyecto_colaboradores pc ON pc.proyecto_id = r.proyecto_id
            WHERE r.id = puntos_ruta.ruta_id
            AND pc.usuario_id = auth.uid()
            AND pc.estado = 'activo'
            AND pc.rol IN ('propietario', 'editor')
        )
    );;