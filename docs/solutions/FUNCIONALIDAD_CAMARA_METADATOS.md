# Funcionalidad de Captura de Camara y Metadatos Detallados - SonimaX

## URL de Despliegue
**https://q3ovebo6yhw9.space.minimax.io**

## Cuenta de Prueba
- **Email**: ntvgekwj@minimax.com
- **Password**: qXgGPXw8Dp

---

## Funcionalidad Implementada

### 1. Captura de Camara Integrada

**Acceso a Camara del Navegador**:
- Utiliza MediaDevices API para acceso a camara
- Resolucion: 1920x1080 (Full HD)
- Modo: Camara trasera (environment) para dispositivos moviles
- Preview en tiempo real antes de capturar

**Funcionalidades de Captura**:
- Boton "Tomar Foto" para capturar imagen
- Preview de imagen capturada
- Boton "Repetir" para nueva toma
- Conversion automatica a JPEG (90% calidad)

**Almacenamiento**:
- Upload automatico a Supabase Storage
- Bucket: `imagenes-lugares`
- Formato: JPEG con compresion optimizada
- Ruta organizada por usuario

---

### 2. Formulario de Metadatos Detallados

**Campos Implementados**:

1. **Nombre del Sitio**
   - Campo de texto libre
   - Placeholder: "Ej: Bosque de Pinos - Entrada Norte"
   - Almacenado en: `nombre_sitio`

2. **Condiciones Atmosfericas** (Selector)
   - Opciones disponibles:
     - Soleado
     - Parcialmente nublado
     - Nublado
     - Lluvioso
     - Ventoso
     - Tormentoso
     - Nevado
     - Niebla
     - Caluroso
     - Frio
   - Almacenado en: `condiciones_atmosfericas`

3. **Caracteristicas del Sitio** (Seleccion Multiple)
   - Sistema de tags visuales (pills)
   - Opciones disponibles:
     - Bosque
     - Playa
     - Urbano
     - Rural
     - Montaña
     - Rio
     - Lago
     - Parque
     - Desierto
     - Humedal
     - Acantilado
     - Valle
     - Campo abierto
     - Jardin
     - Zona industrial
   - Seleccion multiple ilimitada
   - Almacenado en: `caracteristicas_sitio` (array)

4. **Descripcion Adicional y Notas**
   - Textarea de texto libre
   - 4 lineas visibles
   - Placeholder: "Observaciones adicionales, condiciones especiales, fauna observada, etc."
   - Almacenado en: `notas_campo` y `descripcion`

5. **Fecha y Hora** (Automatico)
   - Captura automatica al momento de la foto
   - Formato: DD/MM/YYYY HH:MM
   - Almacenado en: `timestamp_captura`

6. **Datos GPS** (Automatico)
   - Latitud (6 decimales)
   - Longitud (6 decimales)
   - Altitud (metros)
   - Precision GPS (metros)
   - Visualizacion en panel informativo
   - Almacenado en: `latitud`, `longitud`, `altitud`, `precision_gps`

---

### 3. Integracion con Sistema GPS

**Fuentes de GPS**:
1. **MapPlanner**: Coordenadas del punto de ruta seleccionado
2. **RealTimeRecorder**: Ubicacion GPS en tiempo real

**Visualizacion GPS**:
- Panel verde con icono de ubicacion
- Coordenadas completas (lat, lng)
- Altitud (si disponible)
- Precision (±X metros)

**Asociacion Automatica**:
- Imagen asociada automaticamente con punto de ruta (si disponible)
- Proyecto asociado automaticamente
- Grabacion asociada automaticamente (si disponible)

---

### 4. Interfaz de Usuario

**MapPlanner - Planificador de Rutas**:
- **Boton "Camara" en InfoWindow**: Al hacer click en un punto del mapa, aparece boton verde "Camara"
- **Boton "Camara" en Lista**: Cada punto en la lista tiene icono de camara verde
- **Apertura Modal**: Click en boton abre modal de captura

**RealTimeRecorder - Grabacion en Tiempo Real**:
- **Boton "Capturar Imagen"**: Boton prominente verde junto a botones de grabacion
- **Posicion**: Centrado, antes del boton de iniciar grabacion
- **Estado**: Deshabilitado hasta obtener GPS

**CameraCaptureModal - Modal de Captura**:
- **Diseño**: Modal fullscreen responsive con scroll
- **Header Sticky**: Titulo y boton cerrar siempre visibles
- **Secciones**:
  1. Captura de camara (16:9 aspect ratio)
  2. Informacion GPS (panel verde)
  3. Formulario de metadatos (4 secciones)
  4. Botones de accion (Cancelar / Guardar)

**Estados Visuales**:
- Loading: "Iniciando camara..."
- Activa: Preview en vivo
- Capturada: Imagen estatica con opcion de repetir
- Guardando: Boton deshabilitado con "Guardando..."

---

### 5. Base de Datos

**Tabla Extendida**: `imagenes_lugares`

**Campos Nuevos Agregados**:
```sql
- nombre_sitio VARCHAR(255)
- condiciones_atmosfericas VARCHAR(100)
- caracteristicas_sitio TEXT[] 
- precision_gps NUMERIC(10,2)
- notas_campo TEXT
```

**Indices Creados**:
- `idx_imagenes_condiciones`: Indice en condiciones_atmosfericas
- `idx_imagenes_caracteristicas`: Indice GIN en caracteristicas_sitio (array)

**Campos Existentes Utilizados**:
- `proyecto_id`: Asociacion con proyecto
- `punto_id`: Asociacion con punto de ruta
- `grabacion_id`: Asociacion con grabacion
- `usuario_id`: Propietario
- `nombre_archivo`: Nombre del archivo en storage
- `ruta_storage`: Ruta completa en bucket
- `url_publica`: URL publica accesible
- `latitud`, `longitud`, `altitud`: Coordenadas GPS
- `timestamp_captura`: Fecha y hora de captura
- `descripcion`: Descripcion general
- `tags`: Tags adicionales (usa caracteristicas_sitio)

---

## Flujo de Uso

### Desde MapPlanner (Planificador de Rutas)

1. **Crear o Editar Ruta**
   - Ir a Rutas > Nueva ruta o editar existente
   - Agregar puntos en el mapa

2. **Capturar Imagen de Punto**
   - Hacer click en un punto del mapa
   - En el InfoWindow, click en "Camara"
   - O en la lista de puntos, click en icono de camara verde

3. **Tomar Foto**
   - El modal se abre con la camara activa
   - Click en "Tomar Foto"
   - Verificar preview
   - (Opcional) Click en "Repetir" para nueva toma

4. **Completar Metadatos**
   - Ingresar nombre del sitio
   - Seleccionar condiciones atmosfericas
   - Seleccionar caracteristicas del sitio (multiples)
   - Agregar descripcion adicional
   - Verificar datos GPS (automaticos)

5. **Guardar**
   - Click en "Guardar Imagen y Metadatos"
   - Confirmacion de exito
   - Imagen guardada y asociada al punto

### Desde RealTimeRecorder (Grabacion en Tiempo Real)

1. **Iniciar Sesion de Grabacion**
   - Ir a cualquier proyecto > Ver grabaciones
   - O usar el modulo de grabacion en tiempo real
   - Seleccionar proyecto
   - Esperar GPS

2. **Capturar Imagen del Lugar**
   - Click en "Capturar Imagen" (boton verde)
   - Tomar foto
   - Completar metadatos
   - Guardar

3. **Continuar con Grabacion**
   - Iniciar grabacion de audio si es necesario
   - La imagen queda asociada al proyecto

---

## Validaciones y Manejo de Errores

**Permisos de Camara**:
- Solicitud automatica de permisos al abrir modal
- Mensaje claro si se deniegan permisos
- Instrucciones para habilitar en configuracion

**Validaciones de Formulario**:
- Imagen requerida: No se puede guardar sin captura
- Nombre sitio: Opcional
- Condiciones: Opcional
- Caracteristicas: Opcional (minimo 0)
- Descripcion: Opcional

**Errores de Upload**:
- Manejo de errores de red
- Manejo de errores de storage
- Mensajes claros al usuario
- No se pierde la imagen capturada si falla

**Estados de GPS**:
- Modal se puede abrir sin GPS (para testing)
- GPS se captura si esta disponible
- Campos GPS se muestran si hay datos

---

## Consideraciones Tecnicas

**Compatibilidad**:
- Navegadores modernos con MediaDevices API
- Movil: Acceso a camara trasera por defecto
- Desktop: Acceso a webcam

**Performance**:
- Compresion JPEG 90% para balance calidad/tamaño
- Conversion a base64 solo para upload
- Canvas para captura eficiente

**Seguridad**:
- RLS policies en tabla imagenes_lugares
- Upload via cliente Supabase autenticado
- Bucket con politicas de acceso configuradas

**Almacenamiento**:
- Bucket: `imagenes-lugares`
- Organizacion: `{user_id}/captura_{timestamp}.jpg`
- URLs publicas generadas automaticamente

---

## Archivos Creados/Modificados

### Nuevos Archivos
- `/workspace/sonimax-frontend/src/components/CameraCaptureModal.tsx` (467 lineas)

### Archivos Modificados
- `/workspace/sonimax-frontend/src/components/MapPlanner.tsx`
  - Import de CameraCaptureModal
  - Estados para modal de camara
  - Boton camara en InfoWindow
  - Boton camara en lista de puntos
  - Modal integrado
  
- `/workspace/sonimax-frontend/src/components/RealTimeRecorder.tsx`
  - Import de CameraCaptureModal
  - Estado para modal de camara
  - Boton "Capturar Imagen"
  - Modal integrado con GPS en tiempo real

### Base de Datos
- Migracion: `add_detailed_metadata_to_images`
- Tabla extendida: `imagenes_lugares`
- 5 campos nuevos agregados
- 2 indices creados

---

## Testing Sugerido

### Pruebas Funcionales

1. **Captura desde MapPlanner**
   - Crear ruta con 3 puntos
   - Capturar imagen en cada punto
   - Verificar metadatos diferentes para cada uno
   - Verificar asociacion con puntos

2. **Captura desde RealTimeRecorder**
   - Iniciar sesion
   - Capturar imagen antes de grabar
   - Capturar imagen durante grabacion
   - Verificar GPS automatico

3. **Metadatos Completos**
   - Llenar todos los campos
   - Seleccionar multiples caracteristicas
   - Verificar guardado correcto
   - Consultar desde base de datos

4. **Permisos y Errores**
   - Denegar permisos de camara
   - Verificar mensaje de error
   - Simular fallo de red
   - Verificar manejo de errores

### Pruebas de Integracion

1. **GPS + Camara**
   - Verificar precision GPS en metadata
   - Verificar altitud si disponible
   - Verificar coordenadas correctas

2. **Proyecto + Ruta + Imagen**
   - Crear proyecto
   - Crear ruta
   - Capturar imagenes
   - Verificar relaciones en BD

3. **Multiples Imagenes**
   - Capturar 5+ imagenes
   - Verificar almacenamiento
   - Verificar consultas

---

## Estado Final

**Implementacion**: COMPLETA
**Testing Backend**: PENDIENTE
**Testing Frontend**: PENDIENTE
**Despliegue**: COMPLETADO

**URL de Produccion**: https://q3ovebo6yhw9.space.minimax.io

**Proximos Pasos Sugeridos**:
1. Testing exhaustivo de captura de camara
2. Verificar permisos en diferentes navegadores
3. Testing en dispositivos moviles reales
4. Validar almacenamiento y consultas de imagenes
5. Testing de metadatos completos
