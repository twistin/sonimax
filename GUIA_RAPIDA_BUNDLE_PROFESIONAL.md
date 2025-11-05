# SonimaX Pro - Guía Rápida de Nuevas Funcionalidades

## URL de Acceso
**https://zvyhimrqcrs2.space.minimax.io**

**Credenciales de prueba**: ntvgekwj@minimax.com / qXgGPXw8Dp

---

## 1. Exportación Profesional de Datos

### Acceso
1. Ir al **Dashboard** (página principal tras login)
2. Click en el botón **"Exportar Datos"** (gradiente azul-morado, esquina superior derecha)

### Uso Paso a Paso

**Paso 1: Seleccionar Formato**
- **CSV**: Para Excel, R, Python
  - Ideal para análisis estadístico
  - Abre directamente en Excel
  
- **GeoJSON**: Para QGIS, ArcGIS
  - Ideal para mapas profesionales
  - Importa en cualquier software GIS
  
- **KML**: Para Google Earth
  - Ideal para visualizaciones 3D
  - Abre directamente en Google Earth

**Paso 2: Aplicar Filtros** (opcional)
- **Proyectos**: Selecciona uno o varios (checkbox)
- **Fecha Desde**: Filtra grabaciones desde una fecha
- **Fecha Hasta**: Filtra grabaciones hasta una fecha
- Si no seleccionas filtros, exportará TODOS tus datos

**Paso 3: Exportar**
- Click en **"Exportar [FORMATO]"**
- Espera 2-5 segundos
- El archivo se descargará automáticamente
- Mensaje de confirmación: "Exportación completada"

### Qué Datos se Exportan

**Todos los metadatos**:
- Nombre de archivo
- Proyecto asociado
- Fecha de grabación
- Coordenadas GPS (lat, lng, altitud, precisión)
- Condiciones meteorológicas
- Temperatura y humedad
- Especies detectadas con BirdNET (si disponible)
- URL para descargar audio

### Uso de Archivos Exportados

**CSV en Excel**:
1. Descargar archivo `sonimax_export_YYYY-MM-DD.csv`
2. Abrir Excel
3. Archivo → Abrir → Seleccionar CSV
4. Analizar con tablas dinámicas, gráficos, fórmulas

**GeoJSON en QGIS**:
1. Descargar archivo `sonimax_export_YYYY-MM-DD.geojson`
2. Abrir QGIS
3. Capa → Agregar Capa → Capa Vectorial
4. Seleccionar archivo GeoJSON
5. Visualizar puntos en mapa

**KML en Google Earth**:
1. Descargar archivo `sonimax_export_YYYY-MM-DD.kml`
2. Abrir Google Earth (web o desktop)
3. Arrastrar archivo KML a la ventana
4. Explorar puntos en 3D
5. Click en marcadores para ver detalles

---

## 2. Espectrogramas en Tiempo Real

### Acceso
1. Ir a **Grabaciones** (menú lateral)
2. Click en el botón **Play** de cualquier grabación
3. El espectrograma aparece automáticamente bajo el reproductor

### Qué es un Espectrograma

Es una representación visual de las **frecuencias** del sonido a lo largo del tiempo:
- **Eje Horizontal**: Tiempo (segundos)
- **Eje Vertical**: Frecuencia (Hz)
- **Colores**: Intensidad del sonido (dB)
  - Amarillo/Blanco = Sonidos fuertes
  - Azul/Morado = Sonidos débiles
  - Negro = Silencio

### Controles Disponibles

**Botones Principales**:
- **Play/Pause**: Reproducir/pausar el espectrograma
- **Download**: Descargar imagen PNG del espectrograma
- **Settings**: Abrir configuración avanzada

**Configuración Avanzada** (botón Settings):

1. **FFT Size**: Resolución de frecuencia
   - 1024: Rápido, menos detalle
   - 2048: Balance (recomendado)
   - 4096: Más detalle
   - 8192: Máximo detalle

2. **Escala de Color**:
   - Viridis: Científica estándar (verde-amarillo)
   - Jet: Clásica (azul-rojo)
   - Plasma: Moderna (morado-amarillo)

3. **Min dB / Max dB**:
   - Ajusta el rango de intensidad visible
   - Min: -100 a -20 (sonidos más débiles)
   - Max: -50 a 0 (sonidos más fuertes)

### Interpretación del Espectrograma

**Patrones Comunes**:
- **Líneas horizontales**: Cantos de aves (2-8 kHz típico)
- **Bandas anchas**: Ruido ambiental, viento
- **Pulsos verticales**: Sonidos breves (clicks, pasos)
- **Barras gruesas**: Voces humanas (100-300 Hz fundamental)

**Identificación de Especies** (ejemplos):
- Jilguero: Líneas finas onduladas en 2.5-4 kHz
- Gorrión: Chirps breves en 3-6 kHz
- Mirlo: Silbidos melódicos en 2-4 kHz
- Ruiseñor: Secuencias complejas en 1.5-6 kHz

### Uso Profesional

**Para Investigación**:
1. Reproducir grabación con espectrograma
2. Identificar visualmente patrones de especies
3. Screenshot de segmentos interesantes
4. Incluir imágenes en papers científicos

**Para Validación de Calidad**:
1. Verificar ausencia de ruido eléctrico (líneas rectas en múltiples frecuencias)
2. Confirmar rango de frecuencias capturado
3. Identificar problemas de saturación (colores uniformes)

---

## 3. Análisis Automático con BirdNET (IA)

### Acceso
1. Ir a **Grabaciones**
2. Click en **Play** de cualquier grabación
3. Scroll down hasta el panel **"Análisis BirdNET"**
4. Click en **"Analizar Especies"**

### Proceso de Análisis

**Duración**: 2-5 segundos

**Qué hace BirdNET**:
1. Descarga el archivo de audio
2. Analiza frecuencias y patrones
3. Compara con base de datos de 6000+ especies
4. Filtra por ubicación GPS (si disponible)
5. Filtra por época del año
6. Devuelve especies con % de confianza

**Resultado**:
- Lista de especies detectadas
- Nombre común y científico
- Confianza de detección (%)
- Momento exacto (timestamp inicio-fin)
- Rango de frecuencia

### Interpretación de Resultados

**Niveles de Confianza**:
- **>90% (Verde)**: Muy confiable, casi seguro
- **80-90% (Azul)**: Alta confianza, probable
- **70-80% (Amarillo)**: Media confianza, posible
- **<70% (Gris)**: Baja confianza, dudoso

**Recomendaciones**:
- Confianza >85%: Aceptar como válida
- Confianza 70-85%: Verificar manualmente con espectrograma
- Confianza <70%: Considerar como sugerencia, no confirmación

### Información de Especies

Para cada especie detectada:

**Datos Mostrados**:
- Nombre común: "Jilguero europeo"
- Nombre científico: "Carduelis carduelis"
- Confianza: "87%" (con badge de color)
- Tiempo: "00:01:23 - 00:01:45"
- Frecuencia: "2.5-4.2 kHz"

**Links Externos**:
- **Ver en eBird**: Base de datos científica de aves
- **Ver en iNaturalist**: Plataforma de ciencia ciudadana

### Re-análisis

Si quieres analizar nuevamente:
1. Click en **"Re-analizar"**
2. Espera 2-5 segundos
3. Nuevos resultados reemplazarán los anteriores

**Cuándo re-analizar**:
- Si actualizaste metadatos GPS
- Si quieres segunda opinión
- Si el resultado inicial fue insatisfactorio

### Uso Avanzado

**Para Investigación**:
1. Analizar todas tus grabaciones
2. Exportar datos a CSV con especies incluidas
3. Analizar en R/Python:
   ```python
   import pandas as pd
   df = pd.read_csv('sonimax_export.csv')
   species_counts = df['especies_detectadas'].value_counts()
   ```

**Para Monitoreo**:
1. Grabar periódicamente en un sitio
2. Analizar con BirdNET
3. Comparar diversidad a lo largo del tiempo
4. Identificar cambios estacionales

**Para Educación**:
1. Escuchar grabación
2. Intentar identificar especies por oído
3. Comparar con resultado de BirdNET
4. Aprender vocalizaciones

---

## 4. Workflow Completo Recomendado

### Workflow Investigación Científica

**Paso 1: Planificación**
1. Crear proyecto en SonimaX
2. Definir rutas con MapPlanner
3. Agregar puntos de muestreo

**Paso 2: Grabación en Campo**
1. Usar RealTimeRecorder con GPS
2. Capturar imágenes del sitio
3. Documentar condiciones meteorológicas

**Paso 3: Análisis**
1. Subir grabaciones (si no se hizo en tiempo real)
2. Analizar con BirdNET
3. Revisar espectrogramas manualmente
4. Validar identificaciones

**Paso 4: Export y Análisis Estadístico**
1. Exportar a CSV con todas las detecciones
2. Importar en R/Python
3. Calcular índices de diversidad:
   ```R
   library(vegan)
   species_data <- read.csv('sonimax_export.csv')
   shannon_index <- diversity(species_data, index="shannon")
   ```

**Paso 5: Visualización Geográfica**
1. Exportar a GeoJSON
2. Importar en QGIS
3. Crear mapas de densidad de especies
4. Generar figuras para paper

**Paso 6: Comunicación**
1. Exportar a KML
2. Compartir con colaboradores vía Google Earth
3. Presentar en reuniones con visualizaciones 3D

### Workflow Consultoría Ambiental

**Fase 1: Baseline**
1. Crear proyecto por cliente/sitio
2. Grabar durante 5-7 días
3. Analizar automáticamente con BirdNET

**Fase 2: Impacto**
1. Comparar antes/después de intervención
2. Exportar estadísticas a CSV
3. Generar gráficos comparativos

**Fase 3: Reporte**
1. Exportar a KML para cliente
2. Incluir screenshots de espectrogramas
3. Listar especies detectadas con confianza
4. Entregar informe PDF (próximamente)

### Workflow Educativo

**Para Estudiantes**:
1. Asignar proyectos individuales
2. Cada estudiante graba en un sitio diferente
3. Analizar con BirdNET
4. Comparar resultados en clase
5. Exportar datos para análisis grupal

**Para Profesores**:
1. Crear proyecto maestro
2. Invitar estudiantes como colaboradores
3. Supervisar análisis
4. Exportar datos consolidados
5. Usar en clases de ecología/bioacústica

---

## 5. Tips y Trucos

### Optimizar Análisis BirdNET

**Mejores Resultados**:
- Grabar con GPS activo (mejora precisión)
- Grabar en horas de actividad (amanecer/atardecer)
- Evitar días con viento fuerte
- Usar grabadora con micrófono direccional

**Si No Hay Detecciones**:
- Verificar que el audio tenga sonidos (no silencio)
- Revisar espectrograma para confirmar vocalizaciones
- Considerar que puede no haber aves en la grabación
- Probar re-análisis después de agregar GPS

### Optimizar Espectrogramas

**Para Mejor Visualización**:
- FFT 2048: Balance óptimo
- Color Scale Viridis: Mejor para identificación científica
- Color Scale Jet: Mejor para presentaciones
- Ajustar Min/Max dB según ruido de fondo

**Para Screenshots**:
1. Pausar en momento interesante
2. Ajustar configuración para máximo contraste
3. Click en Download
4. Editar en software de imagen si necesario

### Optimizar Exportaciones

**CSV para Análisis**:
- Exportar solo proyectos completados
- Filtrar por fecha para análisis temporal
- Abrir en Excel para limpieza inicial
- Importar en R/Python para análisis

**GeoJSON para Mapas**:
- Exportar todos los puntos sin filtro
- Importar en QGIS
- Aplicar estilos por proyecto o especie
- Generar mapas de alta calidad

**KML para Comunicación**:
- Exportar con imágenes y audio
- Compartir link de Google Earth
- Presentar en reuniones
- Mostrar a stakeholders no-técnicos

---

## 6. Solución de Problemas

### Export No Descarga

**Problema**: Click en "Exportar" pero no descarga archivo

**Soluciones**:
1. Verificar que tienes grabaciones en los filtros seleccionados
2. Desactivar bloqueador de pop-ups en navegador
3. Probar en modo incógnito
4. Verificar conexión a internet
5. Intentar formato diferente (CSV más liviano)

### Espectrograma No Aparece

**Problema**: Reproductor funciona pero no hay espectrograma

**Soluciones**:
1. Verificar que el audio tiene URL válida
2. Refrescar la página (F5)
3. Probar en navegador diferente (Chrome recomendado)
4. Verificar que el audio no esté corrupto
5. Esperar a que cargue completamente (spinner debe desaparecer)

### BirdNET Sin Resultados

**Problema**: Análisis completa pero no detecta especies

**Posibles Causas**:
1. La grabación no contiene vocalizaciones de aves
2. El audio tiene mucho ruido de fondo
3. Las aves están fuera del rango de frecuencia
4. El audio es muy corto (<10 segundos)

**Soluciones**:
1. Revisar espectrograma manualmente
2. Confirmar presencia de vocalizaciones visuales
3. Probar con otra grabación del mismo sitio
4. Re-analizar después de agregar GPS

### Especies Incorrectas

**Problema**: BirdNET detecta especies que no existen en la zona

**Explicación**: 
- El sistema puede dar falsos positivos (<30% de los casos)
- Sonidos similares pueden confundir la IA
- Falta de contexto geográfico (sin GPS)

**Soluciones**:
1. Ignorar detecciones con confianza <70%
2. Verificar manualmente con espectrograma
3. Consultar con experto en aves locales
4. Agregar coordenadas GPS para mejorar precisión

---

## 7. Contacto y Soporte

**Para Problemas Técnicos**:
1. Captura screenshot del error
2. Abre DevTools (F12) → Consola
3. Copia mensajes de error
4. Envía a soporte con descripción detallada

**Para Sugerencias**:
- Describe la funcionalidad deseada
- Explica el caso de uso
- Proporciona ejemplos de otras herramientas

---

## 8. Recursos Externos Útiles

### Para Análisis de Datos
- **R**: https://www.r-project.org/
- **Python Pandas**: https://pandas.pydata.org/
- **Vegan Package (R)**: https://cran.r-project.org/web/packages/vegan/

### Para Mapas
- **QGIS**: https://qgis.org/ (gratis)
- **ArcGIS**: https://www.arcgis.com/ (pago)
- **Google Earth**: https://earth.google.com/ (gratis)

### Para Identificación de Aves
- **eBird**: https://ebird.org/
- **iNaturalist**: https://www.inaturalist.org/
- **Xeno-canto**: https://www.xeno-canto.org/ (sonidos de aves)

### Para Bioacústica
- **Raven Pro**: https://ravensoundsoftware.com/ (pago)
- **Audacity**: https://www.audacityteam.org/ (gratis)
- **BirdNET**: https://birdnet.cornell.edu/ (gratis)

---

**¡Disfruta de las nuevas funcionalidades profesionales de SonimaX!**

Si tienes preguntas o necesitas ayuda, no dudes en contactar.

**Versión**: 2.1.0 (Bundle Profesional)
**Última actualización**: 2025-11-05
