# Consultas SQL Comunes para SonimaX

Este documento contiene ejemplos de consultas SQL útiles para el sistema SonimaX, organizadas por categorías funcionales.

## 1. Consultas de Proyectos y Rutas

### 1.1 Listar todos los proyectos con estadísticas básicas
```sql
SELECT 
    p.nombre as proyecto,
    p.estado,
    COUNT(r.id) as total_rutas,
    COUNT(pg.id) as total_puntos,
    COUNT(g.id) as total_grabaciones,
    SUM(g.duracion_segundos) as duracion_total_segundos,
    p.created_at::date as fecha_creacion
FROM proyectos p
LEFT JOIN rutas r ON r.proyecto_id = p.id
LEFT JOIN puntos_grabacion pg ON pg.ruta_id = r.id
LEFT JOIN grabaciones g ON g.punto_id = pg.id
GROUP BY p.id, p.nombre, p.estado, p.created_at
ORDER BY p.created_at DESC;
```

### 1.2 Obtener el progreso de un proyecto específico
```sql
SELECT 
    p.nombre,
    p.estado,
    COUNT(DISTINCT r.id) as rutas_planificadas,
    COUNT(DISTINCT CASE WHEN g.id IS NOT NULL THEN r.id END) as rutas_con_grabaciones,
    COUNT(DISTINCT pg.id) as puntos_planificados,
    COUNT(DISTINCT CASE WHEN g.id IS NOT NULL THEN pg.id END) as puntos_grabados,
    ROUND(
        (COUNT(DISTINCT CASE WHEN g.id IS NOT NULL THEN pg.id END) * 100.0 / NULLIF(COUNT(DISTINCT pg.id), 0)), 
        2
    ) as porcentaje_completado
FROM proyectos p
LEFT JOIN rutas r ON r.proyecto_id = p.id
LEFT JOIN puntos_grabacion pg ON pg.ruta_id = r.id
LEFT JOIN grabaciones g ON g.punto_id = pg.id
WHERE p.id = $1
GROUP BY p.id, p.nombre, p.estado;
```

## 2. Consultas de Grabaciones y Metadatos

### 2.1 Buscar grabaciones por criterios múltiples
```sql
SELECT 
    g.id,
    g.nombre_archivo,
    pg.nombre as punto_grabacion,
    r.nombre as ruta_nombre,
    g.inicio_grabacion,
    g.duracion_segundos,
    g.estado,
    ma.codec,
    ma.sample_rate,
    ma.calidad_audio,
    ma.snr_estimado,
    COUNT(gt.id) as tags_asociados
FROM grabaciones g
JOIN puntos_grabacion pg ON g.punto_id = pg.id
JOIN rutas r ON pg.ruta_id = r.id
JOIN proyectos p ON r.proyecto_id = p.id
LEFT JOIN metadatos_audio ma ON ma.grabacion_id = g.id
LEFT JOIN grabaciones_tags gt ON gt.grabacion_id = g.id
WHERE (
    $1 IS NULL OR pg.nombre ILIKE '%' || $1 || '%' OR
    r.nombre ILIKE '%' || $1 || '%' OR
    g.nombre_archivo ILIKE '%' || $1 || '%'
)
AND (
    $2 IS NULL OR g.estado = $2
)
AND (
    $3 IS NULL OR g.inicio_grabacion::date BETWEEN $3 AND $4
)
GROUP BY g.id, pg.nombre, r.nombre, ma.codec, ma.sample_rate, ma.calidad_audio, ma.snr_estimado
ORDER BY g.inicio_grabacion DESC
LIMIT $5 OFFSET $6;
```

### 2.2 Análisis de calidad de audio por proyecto
```sql
SELECT 
    p.nombre as proyecto,
    ma.codec,
    ma.sample_rate,
    ma.calidad_audio,
    COUNT(*) as num_grabaciones,
    AVG(ma.rms_db) as rms_promedio,
    AVG(ma.peak_db) as peak_promedio,
    AVG(ma.snr_estimado) as snr_promedio,
    AVG(g.duracion_segundos) as duracion_promedio
FROM proyectos p
JOIN rutas r ON r.proyecto_id = p.id
JOIN puntos_grabacion pg ON pg.ruta_id = r.id
JOIN grabaciones g ON g.punto_id = pg.id
JOIN metadatos_audio ma ON ma.grabacion_id = g.id
WHERE p.id = $1
GROUP BY p.nombre, ma.codec, ma.sample_rate, ma.calidad_audio
ORDER BY num_grabaciones DESC;
```

## 3. Consultas de Análisis de IA

### 3.1 Resumen de análisis de IA por proyecto
```sql
SELECT 
    p.nombre as proyecto,
    ai.modelo_ia,
    ai.version_modelo,
    COUNT(*) as total_analisis,
    COUNT(CASE WHEN ai.estado_procesamiento = 'completado' THEN 1 END) as analisis_exitosos,
    AVG(ai.nivel_confianza_promedio) as confianza_promedio,
    AVG(ai.tiempo_procesamiento_segundos) as tiempo_promedio_segundos,
    COUNT(DISTINCT g.id) as grabaciones_analizadas
FROM proyectos p
JOIN rutas r ON r.proyecto_id = p.id
JOIN puntos_grabacion pg ON pg.ruta_id = r.id
JOIN grabaciones g ON g.punto_id = pg.id
JOIN analisis_ia ai ON ai.grabacion_id = g.id
WHERE p.id = $1
GROUP BY p.nombre, ai.modelo_ia, ai.version_modelo
ORDER BY total_analisis DESC;
```

### 3.2 Detección de especies más frecuentes
```sql
SELECT 
    t.nombre as especie,
    t.categoria,
    COUNT(gt.id) as detecciones,
    AVG(gt.confianza) as confianza_promedio,
    COUNT(DISTINCT g.id) as grabaciones_unicas,
    MIN(gt.timestamp_evento) as primera_deteccion,
    MAX(gt.timestamp_evento) as ultima_deteccion
FROM tags t
JOIN grabaciones_tags gt ON gt.tag_id = t.id
JOIN grabaciones g ON g.id = gt.grabacion_id
JOIN puntos_grabacion pg ON g.punto_id = pg.id
JOIN rutas r ON pg.ruta_id = r.id
JOIN proyectos p ON r.proyecto_id = p.id
WHERE t.categoria = 'especie'
AND p.id = $1
AND gt.confianza >= $2
GROUP BY t.id, t.nombre, t.categoria
ORDER BY detecciones DESC
LIMIT $3;
```

## 4. Consultas de Condiciones Meteorológicas

### 4.1 Análisis de correlación entre condiciones meteorológicas y calidad de grabación
```sql
SELECT 
    cm.condiciones_cielo,
    cm.intensidad_viento,
    cm.precipitacion_tipo,
    COUNT(g.id) as num_grabaciones,
    AVG(cm.temperatura_celsius) as temp_promedio,
    AVG(cm.humedad_pct) as humedad_promedio,
    AVG(ma.snr_estimado) as snr_promedio,
    AVG(g.nivel_ruido_promedio) as ruido_promedio
FROM grabaciones g
JOIN condiciones_meteorologicas cm ON cm.grabacion_id = g.id
JOIN metadatos_audio ma ON ma.grabacion_id = g.id
WHERE cm.timestamp_medicion IS NOT NULL
AND ma.snr_estimado IS NOT NULL
GROUP BY cm.condiciones_cielo, cm.intensidad_viento, cm.precipitacion_tipo
HAVING COUNT(g.id) >= $1
ORDER BY snr_promedio DESC;
```

### 4.2 Seguimiento meteorológico durante grabación extendida
```sql
SELECT 
    g.nombre_archivo,
    cm.timestamp_medicion,
    cm.temperatura_celsius,
    cm.humedad_pct,
    cm.velocidad_viento_ms,
    cm.direccion_viento_grados,
    cm.presion_hectopascales,
    cm.condiciones_cielo,
    EXTRACT(epoch FROM (cm.timestamp_medicion - g.inicio_grabacion))/60 as minutos_desde_inicio
FROM grabaciones g
JOIN condiciones_meteorologicas cm ON cm.grabacion_id = g.id
WHERE g.id = $1
AND cm.timestamp_medicion BETWEEN g.inicio_grabacion AND g.fin_grabacion
ORDER BY cm.timestamp_medicion;
```

## 5. Consultas de Equipos y Mantenimiento

### 5.1 Estado de equipos por proyecto
```sql
SELECT 
    e.nombre,
    e.tipo_equipo,
    e.marca,
    e.modelo,
    e.estado,
    COUNT(g.id) as grabaciones_realizadas,
    MAX(g.created_at) as ultima_uso,
    ec.fecha_calibracion as ultima_calibracion,
    ec.resultado as resultado_calibracion,
    CASE 
        WHEN ec.fecha_calibracion IS NULL THEN 'Sin calibrar'
        WHEN ec.fecha_calibracion < CURRENT_DATE - INTERVAL '1 year' THEN 'Calibración vencida'
        ELSE 'Calibración vigente'
    END as estado_calibracion
FROM equipos e
LEFT JOIN grabaciones g ON g.equipo_id = e.id
LEFT JOIN equipos_calibraciones ec ON ec.equipo_id = e.id
WHERE e.proyecto_id = $1
GROUP BY e.id, ec.fecha_calibracion, ec.resultado
ORDER BY e.tipo_equipo, e.nombre;
```

### 5.2 Próximas calibraciones pendientes
```sql
SELECT 
    e.nombre as equipo,
    e.tipo_equipo,
    e.marca,
    e.modelo,
    ec.fecha_calibracion as ultima_calibracion,
    ec.proxima_calibracion as proxima_programada,
    (ec.proxima_calibracion - CURRENT_DATE) as dias_restantes,
    CASE 
        WHEN ec.proxima_calibracion < CURRENT_DATE THEN 'VENCIDA'
        WHEN (ec.proxima_calibracion - CURRENT_DATE) <= 7 THEN 'URGENTE'
        WHEN (ec.proxima_calibracion - CURRENT_DATE) <= 30 THEN 'PRÓXIMA'
        ELSE 'VIGENTE'
    END as prioridad_mantenimiento
FROM equipos e
JOIN equipos_calibraciones ec ON ec.equipo_id = e.id
WHERE ec.proxima_calibracion IS NOT NULL
AND ec.proxima_calibracion <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY ec.proxima_calibracion;
```

## 6. Consultas de Tags y Clasificación

### 6.1 Análisis de biodiversidad por ubicación
```sql
SELECT 
    pg.nombre as punto_grabacion,
    pg.latitud,
    pg.longitud,
    t.nombre as especie,
    t.categoria,
    COUNT(gt.id) as detecciones,
    AVG(gt.confianza) as confianza_promedio,
    MIN(gt.timestamp_evento) as primera_observacion,
    MAX(gt.timestamp_evento) as ultima_observacion,
    COUNT(DISTINCT g.id) as grabaciones_con_especie
FROM puntos_grabacion pg
JOIN grabaciones g ON g.punto_id = pg.id
JOIN grabaciones_tags gt ON gt.grabacion_id = g.id
JOIN tags t ON gt.tag_id = t.id
WHERE t.categoria = 'especie'
AND g.estado = 'procesada'
GROUP BY pg.id, pg.nombre, pg.latitud, pg.longitud, t.id, t.nombre, t.categoria
HAVING COUNT(gt.id) >= $1
ORDER BY detecciones DESC;
```

### 6.2 Patrones de actividad por hora del día
```sql
SELECT 
    EXTRACT(hour FROM gt.timestamp_evento) as hora_dia,
    COUNT(*) as detecciones_totales,
    COUNT(DISTINCT t.id) as especies_diferentes,
    AVG(gt.confianza) as confianza_promedio,
    COUNT(DISTINCT g.id) as grabaciones_activas
FROM grabaciones g
JOIN grabaciones_tags gt ON g.id = gt.grabacion_id
JOIN tags t ON gt.tag_id = t.id
WHERE t.categoria = 'especie'
AND gt.timestamp_evento IS NOT NULL
AND g.inicio_grabacion::date BETWEEN $1 AND $2
GROUP BY EXTRACT(hour FROM gt.timestamp_evento)
ORDER BY hora_dia;
```

## 7. Consultas de Procesamiento de Señales

### 7.1 Efectividad del procesamiento de señales
```sql
SELECT 
    ps.tipo_procesamiento,
    ps.algoritmo_usado,
    COUNT(*) as procesos_realizados,
    AVG(ps.mejora_snr) as mejora_snr_promedio,
    AVG(ps.reduccion_ruido_db) as reduccion_ruido_promedio,
    COUNT(CASE WHEN ps.estado_procesamiento = 'completado' THEN 1 END) as exitosos,
    AVG(ps.tiempo_procesamiento_segundos) as tiempo_promedio,
    COUNT(CASE WHEN ps.aprobado = TRUE THEN 1 END) as aprobados_usuario
FROM procesamiento_senales ps
WHERE ps.created_at::date BETWEEN $1 AND $2
GROUP BY ps.tipo_procesamiento, ps.algoritmo_usado
ORDER BY procesos_realizados DESC;
```

## 8. Consultas de Monitoreo y Alertas

### 8.1 Alertas de calidad de datos
```sql
SELECT 
    'Grabación sin analizar' as tipo_alerta,
    g.id,
    g.nombre_archivo,
    pg.nombre as punto,
    g.created_at::date as fecha,
    'Alta' as prioridad
FROM grabaciones g
JOIN puntos_grabacion pg ON g.punto_id = pg.id
WHERE g.estado = 'grabada'
AND g.created_at < CURRENT_DATE - INTERVAL '7 days'
AND NOT EXISTS (SELECT 1 FROM analisis_ia ai WHERE ai.grabacion_id = g.id)

UNION ALL

SELECT 
    'Equipo sin calibrar' as tipo_alerta,
    e.id::text,
    e.nombre,
    e.tipo_equipo,
    ec.fecha_calibracion::date as fecha,
    CASE 
        WHEN ec.fecha_calibracion < CURRENT_DATE - INTERVAL '1 year' THEN 'Crítica'
        ELSE 'Media'
    END as prioridad
FROM equipos e
JOIN equipos_calibraciones ec ON ec.equipo_id = e.id
WHERE ec.resultado = 'aprobado'
AND ec.proxima_calibracion IS NOT NULL
AND ec.proxima_calibracion < CURRENT_DATE

ORDER BY 
    CASE prioridad 
        WHEN 'Crítica' THEN 1 
        WHEN 'Alta' THEN 2 
        WHEN 'Media' THEN 3 
        ELSE 4 
    END,
    fecha DESC;
```

### 8.2 Métricas de rendimiento del sistema
```sql
SELECT 
    DATE(g.created_at) as fecha,
    COUNT(*) as grabaciones_totales,
    COUNT(CASE WHEN g.estado = 'procesada' THEN 1 END) as grabaciones_procesadas,
    COUNT(CASE WHEN g.estado = 'grabada' THEN 1 END) as grabaciones_pendientes,
    AVG(EXTRACT(epoch FROM (ai.created_at - g.created_at))/3600) as tiempo_promedio_analisis_horas,
    COUNT(DISTINCT ai.modelo_ia) as modelos_ia_utilizados,
    AVG(ai.nivel_confianza_promedio) as confianza_promedio_dia
FROM grabaciones g
LEFT JOIN analisis_ia ai ON ai.grabacion_id = g.id AND ai.estado_procesamiento = 'completado'
WHERE g.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(g.created_at)
ORDER BY fecha DESC;
```

## 9. Consultas Geoespaciales

### 9.1 Puntos de grabación cercanos a coordenadas
```sql
SELECT 
    pg.id,
    pg.nombre,
    pg.latitud,
    pg.longitud,
    ST_DistanceSphere(
        ST_MakePoint($1, $2),
        ST_MakePoint(pg.longitud, pg.latitud)
    ) as distancia_metros,
    r.nombre as ruta,
    p.nombre as proyecto
FROM puntos_grabacion pg
JOIN rutas r ON pg.ruta_id = r.id
JOIN proyectos p ON r.proyecto_id = p.id
WHERE ST_DWithin(
    ST_MakePoint(pg.longitud, pg.latitud)::geography,
    ST_MakePoint($1, $2)::geography,
    $3 * 1000 -- Radio en kilómetros convertido a metros
)
ORDER BY distancia_metros ASC;
```

### 9.2 Análisis de densidad de grabaciones por área
```sql
SELECT 
    ST_ClusterDBSCAN(
        ST_MakePoint(pg.longitud, pg.latitud)::geography,
        0.01, -- Radio de clustering en grados (aproximadamente 1km)
        3 -- Mínimo de puntos por cluster
    ) OVER() as cluster_id,
    pg.nombre,
    pg.latitud,
    pg.longitud,
    COUNT(g.id) as grabaciones_en_zona,
    AVG(cm.temperatura_celsius) as temp_promedio_zona
FROM puntos_grabacion pg
JOIN grabaciones g ON g.punto_id = pg.id
LEFT JOIN condiciones_meteorologicas cm ON cm.grabacion_id = g.id
WHERE pg.latitud BETWEEN $1 AND $2
AND pg.longitud BETWEEN $3 AND $4
GROUP BY cluster_id, pg.id, pg.nombre, pg.latitud, pg.longitud
ORDER BY cluster_id, grabaciones_en_zona DESC;
```

## 10. Consultas de Configuración y Plantillas

### 10.1 Configuraciones más utilizadas
```sql
SELECT 
    c.tipo_configuracion,
    c.nombre,
    c.version,
    c.activa,
    COUNT(g.id) as grabaciones_con_config,
    COUNT(DISTINCT g.punto_id) as puntos_diferentes,
    AVG(g.duracion_segundos) as duracion_promedio,
    AVG(ma.snr_estimado) as snr_promedio_con_config
FROM configuraciones c
JOIN grabaciones g ON g.configuracion_captura->>'config_id' = c.id::text
JOIN metadatos_audio ma ON ma.grabacion_id = g.id
WHERE c.activa = true
GROUP BY c.id, c.tipo_configuracion, c.nombre, c.version, c.activa
ORDER BY grabaciones_con_config DESC
LIMIT 10;
```

---

## Notas de Implementación

1. **Reemplazar parámetros**: Los `$1, $2, etc.` deben reemplazarse con valores específicos o usar prepared statements.

2. **Optimización de índices**: Asegurarse de que los índices correspondientes existan para las columnas utilizadas en WHERE y JOIN.

3. **Manejo de timezones**: Todas las consultas de timestamps asumen que los datos están almacenados en UTC.

4. **Paginación**: Para consultas con muchos resultados, implementar LIMIT y OFFSET para mejorar el rendimiento.

5. **Aggregaciones complejas**: Para análisis estadísticos avanzados, considerar vistas materializadas que se actualicen periódicamente.

6. **Seguridad**: Siempre validar y sanitizar parámetros de entrada para prevenir inyecciones SQL.