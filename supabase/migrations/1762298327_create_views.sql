-- Migration: create_views
-- Created at: 1762298327

-- Crear vistas útiles para reportes y análisis

-- Vista para resumen de proyectos
CREATE OR REPLACE VIEW vista_resumen_proyectos AS
SELECT 
    p.id,
    p.nombre,
    p.estado,
    p.fecha_inicio,
    p.fecha_fin,
    p.user_id,
    COUNT(DISTINCT r.id) as total_rutas,
    COUNT(DISTINCT pg.id) as total_puntos,
    COUNT(DISTINCT g.id) as total_grabaciones,
    SUM(g.duracion_segundos) as duracion_total_segundos,
    COUNT(DISTINCT ai.id) as total_analisis_ia,
    AVG(cm.temperatura_celsius) as temperatura_promedio,
    COUNT(DISTINCT t.id) as tags_utilizados
FROM proyectos p
LEFT JOIN rutas r ON r.proyecto_id = p.id
LEFT JOIN puntos_grabacion pg ON pg.ruta_id = r.id
LEFT JOIN grabaciones g ON g.punto_id = pg.id
LEFT JOIN analisis_ia ai ON ai.grabacion_id = g.id
LEFT JOIN condiciones_meteorologicas cm ON cm.punto_id = pg.id
LEFT JOIN grabaciones_tags gt ON gt.grabacion_id = g.id
LEFT JOIN tags t ON t.id = gt.tag_id AND t.activo IS TRUE
GROUP BY p.id, p.nombre, p.estado, p.fecha_inicio, p.fecha_fin, p.user_id;

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
    COUNT(DISTINCT gt.id) as tags_encontrados,
    cm.temperatura_celsius as temp_grabacion,
    cm.humedad_pct as humedad_grabacion,
    cm.velocidad_viento_ms as viento_grabacion
FROM grabaciones g
LEFT JOIN puntos_grabacion pg ON g.punto_id = pg.id
LEFT JOIN rutas r ON pg.ruta_id = r.id
LEFT JOIN proyectos p ON r.proyecto_id = p.id
LEFT JOIN metadatos_audio ma ON ma.grabacion_id = g.id
LEFT JOIN analisis_ia ai ON ai.grabacion_id = g.id AND ai.estado_procesamiento = 'completado'
LEFT JOIN grabaciones_tags gt ON gt.grabacion_id = g.id
LEFT JOIN condiciones_meteorologicas cm ON cm.grabacion_id = g.id
GROUP BY g.id, g.nombre_archivo, pg.nombre, r.nombre, p.nombre, 
         g.inicio_grabacion, g.duracion_segundos, g.estado,
         ma.codec, ma.sample_rate, ma.calidad_audio, ma.rms_db, ma.peak_db, ma.snr_estimado,
         ai.modelo_ia, ai.nivel_confianza_promedio,
         cm.temperatura_celsius, cm.humedad_pct, cm.velocidad_viento_ms;

-- Vista para estadísticas de equipos
CREATE OR REPLACE VIEW vista_estadisticas_equipos AS
SELECT 
    e.id,
    e.nombre,
    e.tipo_equipo,
    e.marca,
    e.modelo,
    e.estado,
    COUNT(DISTINCT g.id) as total_grabaciones,
    SUM(g.duracion_segundos) as duracion_total_grabada,
    COUNT(DISTINCT ec.id) as total_calibraciones,
    MAX(ec.fecha_calibracion) as ultima_calibracion,
    MAX(ec.proxima_calibracion) as proxima_calibracion
FROM equipos e
LEFT JOIN grabaciones g ON g.equipo_id = e.id
LEFT JOIN equipos_calibraciones ec ON ec.equipo_id = e.id
GROUP BY e.id, e.nombre, e.tipo_equipo, e.marca, e.modelo, e.estado;;