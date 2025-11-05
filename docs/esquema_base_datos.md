# Blueprint del Esquema de Base de Datos para SonimaX: Grabaciones de Campo, Metadatos, IA y Meteorología

## 1. Resumen ejecutivo y alcance

Este documento define el diseño lógico y físico de la base de datos de SonimaX, un sistema para gestionar grabaciones acústicas de campo con contexto geoespacial, metadatos técnicos de audio, condiciones meteorológicas sincronizadas, y resultados de análisis de inteligencia artificial (IA). El objetivo es ofrecer una base de datos consistente, trazable y extensible que soporte casos de uso operativos y científicos, facilitando la captura en campo, el aseguramiento de calidad (QA/QC) y la consulta analítica.

El alcance incluye las entidades nucleares del dominio —usuarios, proyectos, rutas, puntos de grabación, grabaciones, metadatos de audio, tags, análisis de IA, condiciones meteorológicas, equipos y configuraciones— así como sus relaciones jerárquicas, las reglas de integridad, los índices recomendados y una propuesta de diccionario de datos. Se adoptan principios de modelado respaldados por guías de mejores prácticas de organización de grabaciones de campo y estándares de metadatos, con un énfasis especial en la captura estandarizada de coordenadas, altura, timestamp y condiciones ambientales en el lugar de grabación[^2].

El resultado esperado es doble: primero, un documento narrativo y técnico con el diccionario de datos y las consideraciones de QA/QC; segundo, scripts SQL para crear el esquema, índices y vistas de ejemplo. Se incorporan además recomendaciones de respaldo y archivado consistentes con prácticas de manejo de datos de campo de alta calidad[^2].

Brechas de información relevantes:
- El motor de base de datos objetivo no se ha especificado; se presenta un diseño SQL abstracto con notas de portabilidad.
- El volumen esperado de datos (grabaciones/día, tasas de muestreo, retención) es desconocido; se proponen índices y estrategias genéricas.
- No se ha definido el catálogo de modelos de IA, ni sus etiquetas/métricas; se modela de forma flexible con versionado.
- No se han establecido políticas regulatorias ni latencias de ingestión; se sugieren campos y flujos sin fijar SLA.
- No se provee un listado de formatos de audio ni codecs exactos; se diseñan campos técnicos suficientes para cubrir formatos comunes.
- No se conocen formatos/entidades de meteorología en tiempo real; se alinea el diseño con variables primarias recomendadas por la EPA[^1].
- Se contemplan metadatos GPS (latitud, longitud, altitud, velocidad, heading, precisión HDOP/PDOP), pero no se fijan dispositivos ni fuentes.
- No hay requerimientos de seguridad (cifrado, RBAC detallado, PII); se proponen campos y auditoría mínimos.
- La política de versionado de configuraciones no está definida; se adopta un enfoque de “config effective”.
- No se especifican formatos obligatorios para tags ni taxonomías; se contemplan namespaces y slugs.
- No hay requerimientos de multitenencia; se sugiere un campo tenant_id opcional por si aplica.

En síntesis, este blueprint entrega un diseño robusto y pragmático, adaptable a distintos motores SQL, orientado a la calidad y trazabilidad, y preparado para crecer con las necesidades del programa de SonimaX[^2][^1].

---

## 2. Contexto, supuestos y principios de diseño

El contexto operativo de SonimaX combina tareas de campo y analítica. En campo, equipos de grabación capturan audio en ubicaciones definidas por rutas y puntos de interés, acompañados de metadatos de audio y condiciones meteorológicas en el momento de la toma. De regreso, los datos pasan por procesos de validación y control de calidad, y se integran con análisis de IA (p. ej., detección de especies o clasificación de fuentes sonoras), lo que a su vez enriquece el conocimiento del paisaje acústico[^2].

Principios rectores:
- Normalización razonable: evitar redundancias, pero mantener campos derivados cuando aporten valor analítico o QA/QC.
- Trazabilidad y auditoría: registrar quién, cuándo y qué cambios, con bitácora y campos de estado.
- Representación jerárquica: proyectos → rutas → puntos → grabaciones → metadatos, con enlaces a equipos y meteorología.
- Extensibilidad y portabilidad: diseño agnóstico de motor; uso de JSON para metadatos flexibles.
- Cohesión temporal y geoespacial: timestamps con zona horaria; coordenadas y precisión GPS.
- Estándares de metadatos: considerar prácticas IASA y compatibilidad con etiquetas ID3 cuando aplique, sin duplicar información crítica en la base[^4][^3].
- Meteorología alineada a buenas prácticas: variables primarias y procedimientos de validación consistentes con guías de la EPA[^1].
- Organización y respaldo: estructura consistente con prácticas de campo probadas[^2].

Políticas mínimas:
- Conventions de nombres en minúsculas con snake_case.
- Timestamps con zona horaria (TIMESTAMP WITH TIME ZONE).
- Estados normalizados en catálogos (p. ej., grabaciones: draft, ingestado, validado, publicado).
- Catalogar metadatos GPS y QA en columnas explícitas (hdop, pdop, fix_type).
- Emplear JSON para metadatos estandarizados extensibles (ID3, BWF/XMP, anotaciones de herramientas).

### 2.1 Dominio del problema y entidades principales

El dominio abarca:

- Usuarios y roles: quienes organizan, capturan, validan y publican datos.
- Proyectos y rutas: organización jerárquica del trabajo de campo; las rutas agregan puntos de grabación.
- Puntos de grabación: ubicaciones georreferenciadas donde se realiza una toma.
- Grabaciones: archivos de audio con inicio/fin, duración y vínculo al punto.
- Metadatos de audio: codec, sample_rate, bit_rate, channels, bit_depth, formato contenedor, RMS/Peak, Notes.
- Tags: etiquetas temáticas y operativas asociadas a grabaciones o puntos.
- Análisis de IA: modelos con versión, resultados, métricas y enlaces a segmentos temporales.
- Meteorología: observaciones sincronizadas con variables primarias y metadatos de QA.
- Equipos: grabadoras, micrófonos, sensores y sus calibraciones.
- Configuraciones: plantillas o presets reutilizables por proyecto o ruta (p. ej., gain, filtros, parámetros de dispositivos).
- Auditoría: bitácoras de cambios sobre entidades críticas.

### 2.2 Convenciones y tipos de datos

- Tipos: UUID para claves primarias; TIMESTAMPTZ para tiempos con zona; DOUBLE PRECISION para coordenadas y métricas; BOOLEAN; INTEGER; TEXT/VARCHAR; JSON; ENUM o catálogo de texto para estados y tipos.
- Nombrado: tablas en plural (p. ej., proyectos, grabaciones); claves primarias id; claves foráneas <entidad>_id; índices con prefijo idx_; restricciones con sufijo _chk o un nombre explícito.
- Timestamps: created_at y updated_at en todas las tablas principales; adoptado de manera uniforme.
- Zona horaria: almacenar en UTC y preservar la zona original en metadatos JSON cuando aplique.
- Normalización: separar entidades de relación many-to-many mediante tablas puente (p. ej., grabaciones_tags).
- Metadatos flexibles: emplear JSONB cuando el motor lo permita; si no, TEXT/JSON.

---

## 3. Modelo conceptual global (ER narrativo)

La jerarquía base del modelo es: Usuario 1—N Proyecto 1—N Ruta 1—N PuntoGrabación 1—N Grabación. Cada Grabación tiene 1—1 MetadatosAudio, 0—N AnálisisIA y 0—N Tags. Cada Grabación puede asociarse a una ObservaciónMeteorológica en el mismo instante o ventana temporal. La entidad Equipo se relaciona con Grabación (uso) y con CalibracionEquipo (historiales). La entidad Configuracion se vincula opcionalmente a Proyecto o Ruta y, si se define como preset, puede aplicarse a Grabaciones posteriores.

Las relaciones many-to-many (p. ej., grabación-tag, punto-tag) se materializan con tablas puente. Para consultas analíticas, se proponen vistas materializadas —p. ej., vw_resumen_ruta— que agreguen métricas de grabaciones por ruta.

Para ilustrar la cardinalidad y dependencias, la siguiente matriz sintetiza las relaciones principales.

Tabla 1. Matriz de relaciones y cardinalidades

| Entidad A           | Entidad B        | Tipo relación | Cardinalidad | Clave foránea                        | Notas                                                                 |
|---------------------|------------------|---------------|--------------|--------------------------------------|------------------------------------------------------------------------|
| proyectos           | usuarios         | 1—N           | N/A          | proyectos.usuario_id → usuarios.id   | El proyecto pertenece a un usuario (owner)                             |
| rutas               | proyectos        | 1—N           | N/A          | rutas.proyecto_id → proyectos.id     | Ruta hija de proyecto                                                  |
| puntos_grabacion    | rutas            | 1—N           | N/A          | puntos_grabacion.ruta_id → rutas.id  | Punto en una ruta                                                      |
| grabaciones         | puntos_grabacion | 1—N           | N/A          | grabaciones.punto_id → puntos.id     | Grabación ejecutada en un punto                                        |
| metadatos_audio     | grabaciones      | 1—1           | N/A          | metadatos_audio.grabacion_id → ...   | 1:1 por grabación                                                      |
| grabaciones_tags    | grabaciones      | N—1           | N/A          | grabaciones_tags.grabacion_id        | Tabla puente                                                           |
| grabaciones_tags    | tags             | N—1           | N/A          | grabaciones_tags.tag_id              | Tabla puente                                                           |
| analisis_ia         | grabaciones      | 1—N           | N/A          | analisis_ia.grabacion_id → grabaciones.id | Un análisis por segmento/resultado                                     |
| observaciones_meteo | grabaciones      | 1—N (opt.)    | N/A          | observaciones_meteo.grabacion_id     | Asociación opcional a una grabación                                    |
| equipos             | grabaciones      | 1—N (opt.)    | N/A          | equipos.grabacion_id (nullable)      | Equipo usado en la grabación                                           |
| calibraciones       | equipos          | 1—N           | N/A          | calibraciones.equipo_id → equipos.id | Historial por equipo                                                   |
| configuraciones     | proyectos        | 1—N (opt.)    | N/A          | configuraciones.proyecto_id          | Config preset aplicada al proyecto o ruta                              |
| configuraciones     | rutas            | 1—N (opt.)    | N/A          | configuraciones.ruta_id              | Config preset aplicada a la ruta                                       |
| rutas_tags          | rutas            | N—1           | N/A          | rutas_tags.ruta_id                   | Tabla puente                                                           |
| rutas_tags          | tags             | N—1           | N/A          | rutas_tags.tag_id                    | Tabla puente                                                           |

Esta estructura es consistente con esquemas de proyectos de campo y ensayos, donde proyectos contienen ubicaciones y mediciones agregadas en jerarquías lógicas[^5], y se alinea con patrones de organización operativa en campo[^2].

---

## 4. Diseño lógico y diccionario de datos por entidad

A continuación se detallan tablas y columnas clave, con tipos de datos, nulabilidad y restricciones. Se emplean tipos estándar SQL para portabilidad.

### 4.1 Usuarios

Tabla usuarios

| Columna          | Tipo           | Nulo | Por defecto                   | Descripción                                                                 |
|------------------|----------------|------|-------------------------------|------------------------------------------------------------------------------|
| id               | UUID           | No   | gen_random_uuid()             | PK                                                                           |
| email            | VARCHAR(255)   | No   |                               | Único                                                                        |
| nombre           | VARCHAR(120)   | No   |                               |                                                                              |
| apellido         | VARCHAR(120)   | No   |                               |                                                                              |
| rol              | VARCHAR(50)    | Sí   | 'operador'                    | p. ej., admin, analista, operador                                            |
| estado           | VARCHAR(20)    | Sí   | 'activo'                      | activo, inactivo                                                             |
| password_hash    | TEXT           | No   |                               | Hash de contraseña                                                           |
| last_login_at    | TIMESTAMPTZ    | Sí   |                               |                                                                              |
| created_at       | TIMESTAMPTZ    | No   | now()                         |                                                                              |
| updated_at       | TIMESTAMPTZ    | No   | now()                         |                                                                              |
| metadata         | JSON           | Sí   | '{}'                          | Metadatos adicionales (p. ej., preferencias)                                 |

Claves y restricciones:
- PK (id), UK (email), CHK estado ∈ {'activo','inactivo'}

Índices recomendados:
- idx_usuarios_email (UNIQUE)
- idx_usuarios_rol

Justificación: centraliza autenticación y auditoría; rol facilita RBAC básico[^2].

### 4.2 Proyectos

Tabla proyectos

| Columna       | Tipo           | Nulo | Por defecto   | Descripción                                               |
|---------------|----------------|------|---------------|-----------------------------------------------------------|
| id            | UUID           | No   | gen_random_uuid() | PK                                                    |
| nombre        | VARCHAR(200)   | No   |               |                                                           |
| descripcion   | TEXT           | Sí   |               |                                                           |
| owner_id      | UUID           | No   |               | FK → usuarios.id                                         |
| fecha_inicio  | DATE           | Sí   |               |                                                           |
| fecha_fin     | DATE           | Sí   |               |                                                           |
| status        | VARCHAR(20)    | Sí   | 'planificado' | planificado, activo, pausado, completado                 |
| created_at    | TIMESTAMPTZ    | No   | now()         |                                                           |
| updated_at    | TIMESTAMPTZ    | No   | now()         |                                                           |
| metadata      | JSON           | Sí   | '{}'          | Campos flexibles                                         |

Claves y restricciones:
- PK (id), UK (nombre), CHK status ∈ {'planificado','activo','pausado','completado'}

Índices:
- idx_proyectos_owner_id
- idx_proyectos_status

### 4.3 Rutas

Tabla rutas

| Columna       | Tipo           | Nulo | Por defecto   | Descripción                                               |
|---------------|----------------|------|---------------|-----------------------------------------------------------|
| id            | UUID           | No   | gen_random_uuid() | PK                                                    |
| proyecto_id   | UUID           | No   |               | FK → proyectos.id                                        |
| nombre        | VARCHAR(200)   | No   |               |                                                           |
| descripcion   | TEXT           | Sí   |               |                                                           |
| created_at    | TIMESTAMPTZ    | No   | now()         |                                                           |
| updated_at    | TIMESTAMPTZ    | No   | now()         |                                                           |
| metadata      | JSON           | Sí   | '{}'          |                                                           |

Claves y restricciones:
- PK (id), FK (proyecto_id)

Índices:
- idx_rutas_proyecto_id
- idx_rutas_nombre (UNIQUE con proyecto_id opcional para unicidad lógica)

Tabla puente opcional rutas_tags

| Columna   | Tipo  | Nulo | Descripción           |
|-----------|-------|------|-----------------------|
| ruta_id   | UUID  | No   | FK → rutas.id         |
| tag_id    | UUID  | No   | FK → tags.id          |
| PRIMARY KEY (ruta_id, tag_id) |  |     |                       |

### 4.4 Puntos de grabación

Tabla puntos_grabacion

| Columna         | Tipo            | Nulo | Por defecto   | Descripción                                                                 |
|-----------------|-----------------|------|---------------|-----------------------------------------------------------------------------|
| id              | UUID            | No   | gen_random_uuid() | PK                                                          |
| ruta_id         | UUID            | No   |               | FK → rutas.id                                                             |
| nombre          | VARCHAR(200)    | Sí   |               |                                                                           |
| latitud         | DOUBLE PRECISION| No   |               | Grados decimales                                                          |
| longitud        | DOUBLE PRECISION| No   |               | Grados decimales                                                          |
| altitud_m       | DOUBLE PRECISION| Sí   |               | Metros                                                                     |
| hdop            | DOUBLE PRECISION| Sí   |               | Dilución horizontal de precisión                                           |
| pdop            | DOUBLE PRECISION| Sí   |               | Dilución vertical de precisión                                             |
| velocidad_kmh   | DOUBLE PRECISION| Sí   |               | Velocidad de desplazamiento en captura                                    |
| heading_grados  | DOUBLE PRECISION| Sí   |               | Rumbo de movimiento                                                        |
| fix_type        | VARCHAR(20)     | Sí   |               | p. ej., 2D, 3D, no_fix                                                     |
| timestamp_gps   | TIMESTAMPTZ     | Sí   |               | Timestamp del receptor GPS                                                 |
| created_at      | TIMESTAMPTZ     | No   | now()         |                                                                           |
| updated_at      | TIMESTAMPTZ     | No   | now()         |                                                                           |
| metadata_gps    | JSON            | Sí   | '{}'          | Metadatos adicionales (fuente, notas, calidad señal)                       |

Claves y restricciones:
- PK (id), FK (ruta_id)
- CHK fix_type ∈ {'no_fix','2D','3D'}
- CHK latitud ∈ [-90, 90], longitud ∈ [-180, 180]

Índices:
- idx_pg_ruta_id
- idx_pg_coords (latitud, longitud) para consultas geográficas

Justificación: metadatos GPS detallados reflejan prácticas de campo (coordenadas, altitud, precisión) y permiten QA/QC posterior[^2].

### 4.5 Grabaciones

Tabla grabaciones

| Columna         | Tipo            | Nulo | Por defecto   | Descripción                                                                 |
|-----------------|-----------------|------|---------------|-----------------------------------------------------------------------------|
| id              | UUID            | No   | gen_random_uuid() | PK                                                          |
| punto_id        | UUID            | No   |               | FK → puntos_grabacion.id                                               |
| equipo_id       | UUID            | Sí   |               | FK → equipos.id (nullable)                                            |
| timestamp_inicio| TIMESTAMPTZ     | No   |               | Inicio de la toma                                                         |
| timestamp_fin   | TIMESTAMPTZ     | No   |               | Fin de la toma                                                            |
| duracion_seg    | INTEGER         | No   |               | Duración redondeada                                                       |
| formato_archivo | VARCHAR(20)     | Sí   |               | p. ej., WAV, FLAC, MP3                                                    |
| path_archivo    | TEXT            | Sí   |               | Ruta lógica en almacenamiento                                             |
| estado          | VARCHAR(20)     | Sí   | 'draft'       | draft, ingestado, validado, publicado                                     |
| created_at      | TIMESTAMPTZ     | No   | now()         |                                                                           |
| updated_at      | TIMESTAMPTZ     | No   | now()         |                                                                           |
| metadata        | JSON            | Sí   | '{}'          | Metadatos libres (p. ej., notas de sesión)                                |

Claves y restricciones:
- PK (id), FK (punto_id), FK (equipo_id) opcional
- CHK estado ∈ {'draft','ingestado','validado','publicado'}
- CHK timestamp_fin > timestamp_inicio

Índices:
- idx_grabaciones_punto_id
- idx_grabaciones_tiempo (timestamp_inicio, timestamp_fin)
- idx_grabaciones_estado
- idx_grabaciones_formato (formato_archivo)
- Opcional GIN/GIST sobre metadata para búsqueda flexible

Justificación: campos temporales y estado permiten flujos de QA/QC y reporte; se alinea con requerimientos de organización de sesiones y metadatos esenciales en campo[^2].

### 4.6 Metadatos de audio

Tabla metadatos_audio

| Columna       | Tipo            | Nulo | Por defecto   | Descripción                                                                 |
|---------------|-----------------|------|---------------|-----------------------------------------------------------------------------|
| id            | UUID            | No   | gen_random_uuid() | PK                                                          |
| grabacion_id  | UUID            | No   |               | UNIQUE FK → grabaciones.id                                              |
| codec         | VARCHAR(20)     | No   |               | p. ej., PCM, AAC, MP3                                                      |
| sample_rate_hz| INTEGER         | No   |               | Frecuencia de muestreo                                                     |
| bit_rate_kbps | INTEGER         | Sí   |               | Tasa de bits (para códecs comprimidos)                                     |
| channels      | INTEGER         | No   |               | Mono, estéreo, etc.                                                        |
| bit_depth     | INTEGER         | Sí   |               | Profundidad de bits (p. ej., 16, 24)                                        |
| contenedor    | VARCHAR(20)     | Sí   |               | p. ej., WAV, FLAC, MP4                                                     |
| rms_db        | DOUBLE PRECISION| Sí   |               | Nivel RMS aproximado                                                       |
| peak_db       | DOUBLE PRECISION| Sí   |               | Pico aproximado                                                             |
| notes         | TEXT            | Sí   |               | Notas técnicas                                                              |
| id3_raw       | JSON            | Sí   | '{}'          | Etiquetas ID3 cuando aplique (compatibilidad), sin duplicar campos         |

Claves y restricciones:
- PK (id), UNIQUE (grabacion_id)

Índices:
- idx_meta_codec_sample (codec, sample_rate_hz)

Justificación: se cubren los metadatos técnicos habituales; compatibilidad con ID3 se almacena como JSON para flexibilidad y alineación con estándares[^3][^4].

### 4.7 Tags

Tabla tags

| Columna    | Tipo         | Nulo | Por defecto   | Descripción                                            |
|------------|--------------|------|---------------|--------------------------------------------------------|
| id         | UUID         | No   | gen_random_uuid() | PK                                                 |
| nombre     | VARCHAR(100) | No   |               |                                                        |
| slug       | VARCHAR(100) | No   |               | Único, kebab-case                                      |
| tipo       | VARCHAR(50)  | Sí   | 'tema'        | p. ej., especie, evento, location, tecnica             |
| color      | VARCHAR(7)   | Sí   |               | Código hex (#RRGGBB)                                   |
| created_at | TIMESTAMPTZ  | No   | now()         |                                                        |

Claves y restricciones:
- PK (id), UK (slug), CHK tipo ∈ {'tema','especie','evento','location','tecnica'}

Índices:
- idx_tags_slug (UNIQUE)
- idx_tags_tipo

Tabla puente grabaciones_tags

| Columna       | Tipo | Nulo | Descripción           |
|---------------|------|------|-----------------------|
| grabacion_id  | UUID | No   | FK → grabaciones.id   |
| tag_id        | UUID | No   | FK → tags.id          |
| PRIMARY KEY (grabacion_id, tag_id) |  |     |                       |

Justificación: los tags son esenciales para describir contenido y hallazgos; su estructura N—N y slugs favorecen consistencia[^2].

### 4.8 Análisis de IA

Tabla analisis_ia

| Columna       | Tipo         | Nulo | Por defecto   | Descripción                                                         |
|---------------|--------------|------|---------------|---------------------------------------------------------------------|
| id            | UUID         | No   | gen_random_uuid() | PK                                                              |
| grabacion_id  | UUID         | No   |               | FK → grabaciones.id                                               |
| modelo_nombre | VARCHAR(100) | No   |               | Nombre del modelo                                                  |
| modelo_version| VARCHAR(50)  | No   |               | Versión del modelo                                                 |
| tipo_analisis | VARCHAR(50)  | No   |               | p. ej., deteccion_especies, clasificacion_fuente                   |
| score         | DOUBLE PRECISION | Sí|               | Confianza global                                                   |
| time_offset_inicio_seg | INTEGER | Sí|               | Offset de inicio del segmento relevante                           |
| time_offset_fin_seg   | INTEGER | Sí|               | Offset de fin                                                     |
| label         | VARCHAR(100) | Sí   |               | Etiqueta o clase detectada                                         |
| metadatos     | JSON         | Sí   | '{}'          | Métricas adicionales, parámetros                                  |
| created_at    | TIMESTAMPTZ  | No   | now()         |                                                                     |

Claves y restricciones:
- PK (id), FK (grabacion_id)
- CHK time_offset_fin_seg ≥ time_offset_inicio_seg

Índices:
- idx_ia_grabacion_id
- idx_ia_modelo (modelo_nombre, modelo_version)
- idx_ia_time (time_offset_inicio_seg, time_offset_fin_seg)

Justificación: el versionado de modelos y segmentos temporales permite reproducibilidad y análisis de resultados por segmento[^2].

### 4.9 Condiciones meteorológicas

Tabla observaciones_meteo

| Columna             | Tipo            | Nulo | Por defecto   | Descripción                                                                                 |
|---------------------|-----------------|------|---------------|---------------------------------------------------------------------------------------------|
| id                  | UUID            | No   | gen_random_uuid() | PK                                                                                      |
| proyecto_id         | UUID            | Sí   |               | FK → proyectos.id (opcional)                                                               |
| ruta_id             | UUID            | Sí   |               | FK → rutas.id (opcional)                                                                   |
| punto_id            | UUID            | Sí   |               | FK → puntos_grabacion.id (opcional)                                                        |
| grabacion_id        | UUID            | Sí   |               | FK → grabaciones.id (opcional)                                                             |
| timestamp_obs       | TIMESTAMPTZ     | No   |               | Timestamp de la observación                                                                |
| latitud             | DOUBLE PRECISION| Sí   |               | Grados decimales                                                                           |
| longitud            | DOUBLE PRECISION| Sí   |               | Grados decimales                                                                           |
| altitud_m           | DOUBLE PRECISION| Sí   |               | Metros                                                                                     |
| velocidad_viento_ms | DOUBLE PRECISION| Sí   |               | m/s                                                                                        |
| direccion_viento_grados | DOUBLE PRECISION| Sí|               | Grados (0–360)                                                                             |
| temperatura_c       | DOUBLE PRECISION| Sí   |               | Grados Celsius                                                                             |
| humedad_pct         | DOUBLE PRECISION| Sí   |               | % (0–100)                                                                                  |
| precipitacion_mm    | DOUBLE PRECISION| Sí   |               | mm                                                                                         |
| presion_hpa         | DOUBLE PRECISION| Sí   |               | hPa                                                                                        |
| radiacion_wm2       | DOUBLE PRECISION| Sí   |               | W/m²                                                                                       |
| cielo               | VARCHAR(20)     | Sí   |               | despejado, nublado, lluvia, nieve                                                          |
| precipitacion_tipo  | VARCHAR(20)     | Sí   |               | none, drizzle, rain, snow, hail                                                            |
| condiciones_especiales | VARCHAR(100) | Sí   |               | niebla, tormenta, viento fuerte                                                             |
| source              | VARCHAR(20)     | Sí   | 'manual'      | manual, api, estacion, sensor                                                               |
| qa_status           | VARCHAR(20)     | Sí   | 'pendiente'   | pendiente, validado, rechazado                                                              |
| notas               | TEXT            | Sí   |               |                                                                                           |
| created_at          | TIMESTAMPTZ     | No   | now()         |                                                                                           |

Claves y restricciones:
- PK (id); FK opcionales (proyecto_id, ruta_id, punto_id, grabacion_id)
- CHK cielo ∈ {'despejado','nublado','lluvia','nieve'}
- CHK precipitacion_tipo ∈ {'none','drizzle','rain','snow','hail'}
- CHK qa_status ∈ {'pendiente','validado','rechazado'}

Índices:
- idx_meteo_timestamp (timestamp_obs)
- idx_meteo_coords (latitud, longitud)
- idx_meteo_proyecto_ruta (proyecto_id, ruta_id)

Justificación: variables y qa_status siguen buenas prácticas de la EPA para monitoreo meteorológico y validación[^1].

### 4.10 Equipos

Tabla equipos

| Columna      | Tipo         | Nulo | Por defecto   | Descripción                                           |
|--------------|--------------|------|---------------|-------------------------------------------------------|
| id           | UUID         | No   | gen_random_uuid() | PK                                                |
| tipo         | VARCHAR(30)  | No   |               | grabadora, microfono, sensor_meteo                   |
| marca        | VARCHAR(50)  | Sí   |               |                                                       |
| modelo       | VARCHAR(50)  | Sí   |               |                                                       |
| serie        | VARCHAR(50)  | Sí   |               | Número de serie                                      |
| firmware     | VARCHAR(50)  | Sí   |               |                                                       |
| config_actual| JSON         | Sí   | '{}'          | Configuración vigente                                |
| status       | VARCHAR(20)  | Sí   | 'activo'      | activo, mantenimiento, baja                          |
| owner_user_id| UUID         | Sí   |               | FK → usuarios.id                                     |
| created_at   | TIMESTAMPTZ  | No   | now()         |                                                       |
| updated_at   | TIMESTAMPTZ  | No   | now()         |                                                       |

Claves y restricciones:
- PK (id), CHK tipo ∈ {'grabadora','microfono','sensor_meteo'}
- CHK status ∈ {'activo','mantenimiento','baja'}

Índices:
- idx_equipos_tipo
- idx_equipos_status

Tabla calibraciones

| Columna        | Tipo         | Nulo | Por defecto   | Descripción                                   |
|----------------|--------------|------|---------------|-----------------------------------------------|
| id             | UUID         | No   | gen_random_uuid() | PK                                        |
| equipo_id      | UUID         | No   |               | FK → equipos.id                               |
| fecha_cal      | DATE         | No   |               |                                               |
| procedimiento  | VARCHAR(100) | Sí   |               |                                               |
| resultado      | VARCHAR(20)  | Sí   |               | pasado, fallido                               |
| certificado_no | VARCHAR(50)  | Sí   |               |                                               |
| notes          | TEXT         | Sí   |               |                                               |
| created_at     | TIMESTAMPTZ  | No   | now()         |                                               |

Claves y restricciones:
- PK (id), FK (equipo_id), CHK resultado ∈ {'pasado','fallido'}

Índices:
- idx_cal_equipo_id (equipo_id)

Justificación: el estado de equipos y su historial de calibración son críticos para QA/QC y para atribuir posibles sesgos a datos de campo[^1].

### 4.11 Configuraciones

Tabla configuraciones

| Columna     | Type          | Nulo | Por defecto   | Descripción                                               |
|-------------|---------------|------|---------------|-----------------------------------------------------------|
| id          | UUID          | No   | gen_random_uuid() | PK                                                    |
| scope       | VARCHAR(20)   | No   | 'global'      | global, proyecto, ruta                                   |
| proyecto_id | UUID          | Sí   |               | FK → proyectos.id (si scope=proyecto)                    |
| ruta_id     | UUID          | Sí   |               | FK → rutas.id (si scope=ruta)                            |
| nombre      | VARCHAR(100)  | No   |               | Nombre de la configuración                               |
| payload     | JSON          | No   | '{}'          | Contenido de configuración (gain, filtros, etc.)         |
| version     | INTEGER       | Sí   | 1             |                                                           |
| activa      | BOOLEAN       | Sí   | true          |                                                           |
| created_at  | TIMESTAMPTZ   | No   | now()         |                                                           |
| updated_at  | TIMESTAMPTZ   | No   | now()         |                                                           |

Claves y restricciones:
- PK (id)
- CHK scope ∈ {'global','proyecto','ruta'}
- FK condicionales (si scope='proyecto', proyecto_id not null; si scope='ruta', ruta_id not null)

Índices:
- idx_config_scope (scope)
- idx_config_proyecto_ruta (proyecto_id, ruta_id)
- idx_config_version (version)

Justificación: el versionado y el alcance permiten trazabilidad de configuraciones y su impacto en grabaciones.

---

## 5. Relaciones, integridad referencial y reglas de borrado/actualización

El esquema privilegia la integridad referencial con cascadas controladas.

- Borrado:
  - proyectos: RESTRICT sobre rutas; cascada en cascada sobre puntos y grabaciones si se define eliminación controlada.
  - rutas: RESTRICT sobre puntos; cascada opcional sobre grabaciones si se autoriza eliminación en cascada.
  - puntos_grabacion: RESTRICT sobre grabaciones; cascada sobre metadatos_audio, analisis_ia y relaciones de tags.
  - grabaciones: cascada sobre metadatos_audio y analisis_ia; para grabaciones_tags se emplean reglas ON DELETE CASCADE sobre el lado de grabación.
- Actualización:
  - Las claves primarias no se actualizan (UUID).
  - ON UPDATE RESTRICT por defecto.

Restricciones y checks:
- Estados y tipos enumerados vía checks (estado de grabaciones, tipo de tag, status de equipos, cielo y qa_status meteorológicos).
- Rango de coordenadas y valores plausibles (humedad 0–100, velocidad_viento_ms ≥ 0).
- Validación temporal: fin > inicio en grabaciones.

La siguiente tabla sintetiza políticas de borrado/actualización por relación.

Tabla 2. Políticas de borrado/actualización

| Relación                               | ON DELETE         | ON UPDATE | Justificación                                               |
|----------------------------------------|-------------------|-----------|-------------------------------------------------------------|
| proyectos → rutas                      | RESTRICT          | RESTRICT  | Evitar pérdida accidental de jerarquía                      |
| rutas → puntos_grabacion               | RESTRICT          | RESTRICT  | Preservar puntos si la ruta cambia                          |
| puntos_grabacion → grabaciones         | RESTRICT          | RESTRICT  | Evitar huérfanas; forzar revisión                           |
| grabaciones → metadatos_audio          | CASCADE           | RESTRICT  | Eliminación controlada de 1:1                               |
| grabaciones → analisis_ia              | CASCADE           | RESTRICT  | Eliminación controlada de resultados                        |
| grabaciones → grabaciones_tags         | CASCADE (en grabación) | RESTRICT | Dependencia directa                                         |
| equipos → grabaciones                  | SET NULL          | RESTRICT  | Conservar grabaciones aunque el equipo cambie de estado     |
| equipos → calibraciones                | CASCADE           | RESTRICT  | Eliminación del historial al retirar equipo                 |
| configuraciones → proyectos/rutas      | SET NULL          | RESTRICT  | Evitar borrado en cascada de configuraciones asociadas      |

---

## 6. Índices, performance y consultas típicas

La estrategia de índices se orienta a consultas de tiempo, jerarquía, geolocalización y búsqueda por metadatos.

- B-tree:
  - idx_usuarios_email (UNIQUE) para autenticación.
  - idx_proyectos_owner_id; idx_rutas_proyecto_id; idx_pg_ruta_id; idx_grabaciones_punto_id; idx_grabaciones_tiempo (timestamp_inicio, timestamp_fin).
  - idx_grabaciones_estado; idx_meta_codec_sample; idx_ia_grabacion_id.
  - idx_meteo_timestamp; idx_meteo_proyecto_ruta.
  - idx_config_scope.
- Índices geométricos:
  - idx_pg_coords (latitud, longitud) para bounding-box; GIST/GIN si el motor soporta tipos espaciales y se decide geometrías.
- Búsqueda textual y JSON:
  - idx_tags_slug (UNIQUE).
  - Índices GIN/GINP sobre metadata JSON de grabaciones y metadatos_audio.id3_raw para búsqueda por etiquetas y claves.

Ejemplos de consultas típicas:

- Grabaciones por rango temporal:
  - SELECT ... FROM grabaciones WHERE timestamp_inicio BETWEEN :inicio AND :fin;
- Listado de grabaciones por ruta:
  - SELECT g.* FROM grabaciones g JOIN puntos_grabacion pg ON g.punto_id = pg.id WHERE pg.ruta_id = :ruta_id ORDER BY g.timestamp_inicio;
- IA por etiqueta y ventana temporal:
  - SELECT ai.* FROM analisis_ia ai JOIN grabaciones g ON ai.grabacion_id = g.id WHERE ai.modelo_nombre = :modelo AND g.timestamp_inicio BETWEEN :inicio AND :fin;
- Observaciones meteorológicas por bounding box:
  - SELECT * FROM observaciones_meteo WHERE latitud BETWEEN :lat_min AND :lat_max AND longitud BETWEEN :lon_min AND :lon_max;

Consideraciones de performance:
- Particionamiento temporal por grabaciones y/o meteorología si los volúmenes son elevados (p. ej., monthly partitions).
- Mantenimiento de estadísticas y reindexación periódica.
- Uso de vistas materializadas para agregados comunes por proyecto/ruta.

---

## 7. Metadatos GPS y estándares de audio

El diseño captura metadatos GPS detallados en puntos_grabacion (latitud, longitud, altitud, precisión, velocidad, heading, fix_type, timestamp_gps) y repite coordenadas en observaciones_meteo cuando sea relevante para la observación. Esto habilita QA/QC de ubicación y reproducibilidad.

En metadatos de audio, el modelo registra parámetros técnicos relevantes (codec, sample_rate, bit_rate, channels, bit_depth, contenedor, RMS, Peak) y almacea etiquetas ID3 en formato JSON cuando aplican. Se evita duplicar campos existentes (título, artista, fecha) en columnas redundantes y se centraliza información crítica (timestamps, coordenadas) en la estructura relacional. Esta decisión busca compatibilidad con estándares y facilidad de auditoría[^3][^4][^2].

Tabla 3. Mapa de campos de metadatos GPS

| Entidad             | Columna             | Tipo            | Unidad        | Observaciones                         |
|---------------------|---------------------|-----------------|---------------|--------------------------------------|
| puntos_grabacion    | latitud             | DOUBLE PRECISION| grados        | CHK ∈ [-90, 90]                      |
| puntos_grabacion    | longitud            | DOUBLE PRECISION| grados        | CHK ∈ [-180, 180]                    |
| puntos_grabacion    | altitud_m           | DOUBLE PRECISION| m             |                                       |
| puntos_grabacion    | hdop                | DOUBLE PRECISION| adimensional  | Calidad de precisión horizontal      |
| puntos_grabacion    | pdop                | DOUBLE PRECISION| adimensional  | Calidad de precisión vertical        |
| puntos_grabacion    | velocidad_kmh       | DOUBLE PRECISION| km/h          | Velocidad de captura                 |
| puntos_grabacion    | heading_grados      | DOUBLE PRECISION| grados        | Rumbo 0–360                          |
| puntos_grabacion    | fix_type            | VARCHAR(20)     | categorical   | 2D, 3D, no_fix                       |
| puntos_grabacion    | timestamp_gps       | TIMESTAMPTZ     | timestamp     |                                       |
| observaciones_meteo | latitud             | DOUBLE PRECISION| grados        | Puede repetirse para contexto        |
| observaciones_meteo | longitud            | DOUBLE PRECISION| grados        |                                       |
| observaciones_meteo | altitud_m           | DOUBLE PRECISION| m             |                                       |

Tabla 4. Mapa de metadatos de audio

| Campo               | Descripción                                  | Formato/Estándar relacionado |
|---------------------|----------------------------------------------|------------------------------|
| codec               | Algoritmo de compresión                       | ID3/IA SA (compatibilidad)   |
| sample_rate_hz      | Frecuencia de muestreo                        | Práctica común               |
| bit_rate_kbps       | Tasa de bits                                  | ID3/IA SA                    |
| channels            | Número de canales                             | Práctica común               |
| bit_depth           | Profundidad de bits                           | Práctica común               |
| contenedor          | Formato contenedor                            | ID3/IA SA                    |
| rms_db, peak_db     | Niveles de audio                              | QA técnico                   |
| id3_raw             | Etiquetas ID3 embebidas                       | ID3 v2                       |

Justificación: la combinación de datos técnicos y metadatos embebidos facilita interoperabilidad y trazabilidad sin comprometer el núcleo relacional[^3][^4][^2].

---

## 8. Condiciones meteorológicas: diccionario de variables y QA/QC

Se adoptan variables primarias recomendadas por la EPA: velocidad y dirección del viento, temperatura, humedad, precipitación, presión y radiación, además de clasificación de cielo y tipo de precipitación. El modelo incorpora qa_status y source para auditoría, en línea con niveles y procedimientos de validación (pendiente, validado, rechazado) y recomendaciones de registro y archivo[^1].

La estandarización de unidades (m/s, °C, %, mm, hPa, W/m²) y el uso de timestamps con zona horaria posibilitan comparabilidad y agregación. Para toma de decisiones operativas, se incluyen notas y condiciones especiales (niebla, tormenta, viento fuerte).

Tabla 5. Lista de variables meteorológicas

| Nombre                  | Unidad     | Tipo de dato         | Rango típico           | QA/QC aplicable                      |
|------------------------|------------|----------------------|------------------------|--------------------------------------|
| velocidad_viento_ms    | m/s        | DOUBLE PRECISION     | ≥ 0                    | Validación de plausibilidad          |
| direccion_viento_grados| grados     | DOUBLE PRECISION     | 0–360                  | Consistencia de vector               |
| temperatura_c          | °C         | DOUBLE PRECISION     | -50 a 60               | Validación de extremos               |
| humedad_pct            | %          | DOUBLE PRECISION     | 0–100                  | Validación de rango                  |
| precipitacion_mm       | mm         | DOUBLE PRECISION     | ≥ 0                    | Validación de acumulación            |
| presion_hpa            | hPa        | DOUBLE PRECISION     | 800–1200               | Validación de variación              |
| radiacion_wm2          | W/m²       | DOUBLE PRECISION     | ≥ 0                    | Validación deirradiancia             |
| cielo                  | categorical| VARCHAR(20)          | despejado, nublado, lluvia, nieve | Control de coherencia       |
| precipitacion_tipo     | categorical| VARCHAR(20)          | none, drizzle, rain, snow, hail   | Control de coherencia       |
| condiciones_especiales | texto      | VARCHAR(100)         | libre                  | Flags operativos                     |
| qa_status              | categorical| VARCHAR(20)          | pendiente, validado, rechazado     | Procedimientos EPA         |

Tabla 6. Niveles de validación (resumen)

| Nivel            | Descripción                                        | Procedimiento resumido                                          |
|------------------|----------------------------------------------------|------------------------------------------------------------------|
| Pendiente        | Observación sin validar                            | Asignación automática; cola de validación                        |
| Validado         | Observación aprobada                               | Revisión automatizada y manual; registro de evidencias           |
| Rechazado        | Observación descartada                              | Motivo documentado; exclusión de análisis                        |

La guía EPA enfatiza además estrategias de muestreo, promediado, tratamiento de calmas y datos faltantes; si bien la implementación específica se definirá por políticas, el esquema deja espacio para capturar parámetros procesados y flags de QA/QC en metadatos[^1].

---

## 9. Análisis de IA: modelos, resultados y trazabilidad

Para asegurar trazabilidad, cada registro de análisis de IA referencia la grabación, el modelo y su versión, el tipo de análisis, etiquetas y score, y —cuando aplique— el offset temporal del segmento analizado. Esto permite auditoría y reproducibilidad al vincular hallazgos con segmentos de audio concretos y condiciones de captura[^2].

La extensibilidad se logra mediante campos JSON para métricas específicas de cada modelo (p. ej., valor de probabilidad por clase, parámetros, umbrales). El versionado de modelos, separado del registro de análisis, facilita gestionar cambios y comparar resultados a lo largo del tiempo.

Tabla 7. Estructura de resultados de IA

| Campo                 | Tipo         | Descripción                                              |
|-----------------------|--------------|----------------------------------------------------------|
| modelo_nombre         | VARCHAR(100) | Nombre del modelo                                        |
| modelo_version        | VARCHAR(50)  | Versión del modelo                                       |
| tipo_analisis         | VARCHAR(50)  | Deteccion_especies, clasificacion_fuente, etc.           |
| label                 | VARCHAR(100) | Clase/etiqueta                                           |
| score                 | DOUBLE PRECISION | Confianza global                                     |
| time_offset_inicio_seg| INTEGER      | Inicio del segmento relevante                            |
| time_offset_fin_seg   | INTEGER      | Fin del segmento                                         |
| metadatos             | JSON         | Métricas adicionales                                     |

Esta estructura se integra con vistas para búsquedas por etiqueta o proyecto, favoreciendo flujos de identificación y curaduría.

---

## 10. Seguridad, control de acceso y auditoría

Se adopta un control de acceso basado en roles (RBAC) mínimo, con roles como administrador, analista, operador y solo lectura. La propiedad de proyectos recae en un owner, y se registra información de auditoría en campos created_by y updated_by cuando sea pertinente. A nivel de plataforma, se recomienda cifrado en tránsito y reposo, e implementar hashing robusto de contraseñas; no obstante, estos aspectos de seguridad quedan fuera del diseño de base de datos y deben definirse por política.

La bitácora de auditoría se modela con una tabla de eventos que cubre acciones sobre entidades críticas.

Tabla 8. Roles vs. permisos (alto nivel)

| Rol        | Alcance de acceso                         | Operaciones permitidas                                 |
|------------|-------------------------------------------|--------------------------------------------------------|
| admin      | Global                                    | Crear/leer/actualizar/borrar (según políticas)         |
| analista   | Proyectos asignados                       | Leer, escribir metadatos, registrar análisis IA        |
| operador   | Proyectos asignados                       | Capturar, ingestión, actualización de estado           |
| solo_lectura| Proyectos visibles                        | Lectura                                                |

Tabla 9. Catálogo de eventos de auditoría

| Campo        | Tipo         | Descripción                         |
|--------------|--------------|-------------------------------------|
| id           | UUID         | PK                                  |
| usuario_id   | UUID         | FK → usuarios.id                    |
| entidad      | VARCHAR(50)  | Tipo de entidad                     |
| entidad_id   | UUID         | ID de la entidad                    |
| accion       | VARCHAR(20)  | create, update, delete, publish     |
| timestamp    | TIMESTAMPTZ  | Momento del evento                  |
| detalles     | JSON         | Campos modificados o contexto       |

Estos elementos proporcionan un marco de trazabilidad mínimo para cumplimiento y auditoría operativa[^2].

---

## 11. Estrategia de versionado, migración y extensibilidad

El versionado se aborda de tres maneras:

- Modelos de IA: versionado explícito (modelo_nombre, modelo_version).
- Configuraciones: campo version y alcance (global, proyecto, ruta) con timestamps para “config effective”.
- Esquema de base de datos: migraciones incrementales numeradas, con scripts de avance (upgrade) y rollback, y notas de cambio (changelog).

Se recomienda identificar claramente los metadatos flexibles (JSON) para extensiones sin romper el esquema, manteniendo catálogos para estados y tipos. La estrategia de retrocompatibilidad contempla vistas y columnas calculadas que evitan interrumpir integraciones existentes.

La portabilidad del esquema se favorece al evitar tipos propietarios y priorizar construcciones estándar SQL.

---

## 12. Plan de entrega: scripts SQL y artefactos

Los artefactos incluyen:

- ddl.sql: creación de esquemas, tablas, restricciones, checks y catálogos.
- idx.sql: índices por tabla.
- vw.sql: vistas analíticas (p. ej., vw_resumen_ruta).
- sample_data.sql: filas de ejemplo para pruebas.
- README.md: guía de uso y migración.

La estructura de artefactos se resume a continuación.

Tabla 10. Estructura de artefactos

| Archivo        | Propósito                                | Orden de ejecución |
|----------------|------------------------------------------|--------------------|
| ddl.sql        | Definir tablas, claves, checks           | 1                  |
| idx.sql        | Crear índices                            | 2                  |
| vw.sql         | Crear vistas                             | 3                  |
| sample_data.sql| Poblar datos de ejemplo                  | 4                  |
| README.md      | Documentación y guía                     | N/A                |

Esta organización facilita implementación, pruebas y mantenimiento. La referencia a esquemas de proyectos de campo en repositorios públicos inspira la estructura y consistencia de artefactos[^5].

---

## 13. Anexos: diccionario de datos y glossary

Diccionario de datos (resumen por entidad):

- usuarios: id, email (UK), nombre, apellido, rol, estado, password_hash, last_login_at, created_at, updated_at, metadata.
- proyectos: id, nombre (UK), descripcion, owner_id (FK), fecha_inicio, fecha_fin, status, created_at, updated_at, metadata.
- rutas: id, proyecto_id (FK), nombre, descripcion, created_at, updated_at, metadata.
- puntos_grabacion: id, ruta_id (FK), nombre, latitud, longitud, altitud_m, hdop, pdop, velocidad_kmh, heading_grados, fix_type, timestamp_gps, created_at, updated_at, metadata_gps.
- grabaciones: id, punto_id (FK), equipo_id (FK opt.), timestamp_inicio, timestamp_fin, duracion_seg, formato_archivo, path_archivo, estado, created_at, updated_at, metadata.
- metadatos_audio: id, grabacion_id (UNIQUE FK), codec, sample_rate_hz, bit_rate_kbps, channels, bit_depth, contenedor, rms_db, peak_db, notes, id3_raw.
- tags: id, nombre, slug (UK), tipo, color, created_at.
- grabaciones_tags: grabacion_id (FK), tag_id (FK), PK compuesta (grabacion_id, tag_id).
- analisis_ia: id, grabacion_id (FK), modelo_nombre, modelo_version, tipo_analisis, score, time_offset_inicio_seg, time_offset_fin_seg, label, metadatos, created_at.
- observaciones_meteo: id, proyecto_id (FK opt.), ruta_id (FK opt.), punto_id (FK opt.), grabacion_id (FK opt.), timestamp_obs, latitud, longitud, altitud_m, velocidad_viento_ms, direccion_viento_grados, temperatura_c, humedad_pct, precipitacion_mm, presion_hpa, radiacion_wm2, cielo, precipitacion_tipo, condiciones_especiales, source, qa_status, notas, created_at.
- equipos: id, tipo, marca, modelo, serie, firmware, config_actual, status, owner_user_id, created_at, updated_at.
- calibraciones: id, equipo_id (FK), fecha_cal, procedimiento, resultado, certificado_no, notes, created_at.
- configuraciones: id, scope, proyecto_id (FK opt.), ruta_id (FK opt.), nombre, payload, version, activa, created_at, updated_at.
- auditoria_eventos: id, usuario_id, entidad, entidad_id, accion, timestamp, detalles.

Glossary:
- HDOP/PDOP: diluciones de precisión horizontal/vertical; miden calidad geométrica de la solución GPS.
- QA/QC: aseguramiento/control de calidad; niveles y procedimientos para validar datos.
- ID3: estándar de etiquetas en archivos MP3; se almacenan como JSON para compatibilidad.
- RMS/Peak: métricas de nivel de audio; útiles para control técnico.
- TIMESTAMPTZ: tipo de timestamp con zona horaria; recomendado para trazabilidad temporal.

---

## Referencias

[^1]: EPA Meteorological Monitoring Guidance for Regulatory Modeling Applications. https://www.epa.gov/sites/default/files/2020-10/documents/mmgrma_0.pdf

[^2]: How to organize your field recordings: A revised method - Earth.fm. https://earth.fm/recording-advice/how-to-organize-your-field-recordings/

[^3]: ID3.org: Home. https://id3.org/

[^4]: IASA TC-04: Metadata Introduction. https://www.iasa-web.org/tc04/metadata-introduction

[^5]: Database schema for recording field trial data for DFW - TGAC/grassroots-field-trial-database-schema. https://github.com/TGAC/grassroots-field-trial-database-schema

---

## Apéndice: Ejemplo de vistas SQL y consultas

vw_resumen_ruta

```
-- Vista: Resumen de grabaciones por ruta (conteos y duraciones)
CREATE VIEW vw_resumen_ruta AS
SELECT
  r.id AS ruta_id,
  r.nombre AS ruta_nombre,
  COUNT(g.id) AS total_grabaciones,
  SUM(g.duracion_seg) AS duracion_total_seg,
  AVG(g.duracion_seg) AS duracion_promedio_seg,
  COUNT(DISTINCT p.id) AS total_puntos
FROM rutas r
JOIN puntos_grabacion p ON p.ruta_id = r.id
JOIN grabaciones g ON g.punto_id = p.id
GROUP BY r.id, r.nombre;
```

Consultas de ejemplo

- Grabaciones por proyecto en rango de fechas:
```
SELECT g.*
FROM proyectos pr
JOIN rutas ru ON ru.proyecto_id = pr.id
JOIN puntos_grabacion pg ON pg.ruta_id = ru.id
JOIN grabaciones g ON g.punto_id = pg.id
WHERE pr.id = :proyecto_id
  AND g.timestamp_inicio BETWEEN :inicio AND :fin
ORDER BY g.timestamp_inicio;
```

- IA por etiqueta:
```
SELECT ai.*
FROM analisis_ia ai
JOIN grabaciones g ON g.id = ai.grabacion_id
JOIN grabaciones_tags gt ON gt.grabacion_id = g.id
JOIN tags t ON t.id = gt.tag_id
WHERE t.slug = :slug
  AND g.timestamp_inicio BETWEEN :inicio AND :fin;
```

- Meteorología validada por proyecto:
```
SELECT om.*
FROM observaciones_meteo om
WHERE om.proyecto_id = :proyecto_id
  AND om.qa_status = 'validado'
  AND om.timestamp_obs BETWEEN :inicio AND :fin;
```

Estas vistas y consultas, junto con la estrategia de índices, aportan un marco operativo para monitoreo acústico de campo, integración con meteorología y resultados de IA, cumpliendo con estándares y mejores prácticas descritas.