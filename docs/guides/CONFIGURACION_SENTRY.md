# 🔧 Guía de Configuración de Sentry para SonimaX

## ⏱️ Tiempo estimado: 5 minutos

---

## 📋 Paso 1: Crear Cuenta en Sentry (2 min)

1. **Ir a**: https://sentry.io/signup/

2. **Opciones de registro:**
   - ✅ **Recomendado**: Sign up with GitHub (más rápido)
   - Alternativamente: Usar email

3. **Seleccionar plan:**
   - ✅ Selecciona "Developer" (FREE)
   - 5,000 errores/mes
   - 10,000 performance traces/mes
   - 50 session replays/mes

4. **Nombre de organización:**
   - Ejemplo: `sonimax` o `tu-nombre`

---

## 🎯 Paso 2: Crear Proyecto (1 min)

1. **En el dashboard de Sentry**, click en "Create Project"

2. **Seleccionar plataforma:**
   - Busca y selecciona: **React**
   - Framework: Vite

3. **Configurar proyecto:**
   ```
   Project name: SonimaX
   Team: Default
   Alert frequency: On every new issue
   ```

4. **Click en "Create Project"**

---

## 🔑 Paso 3: Obtener DSN (30 segundos)

Después de crear el proyecto, verás una pantalla con el DSN:

```bash
https://abc123def456@o789012.ingest.sentry.io/456789
```

**¡Copia este DSN!** Lo necesitarás en el siguiente paso.

### Alternativa: Encontrar DSN después

1. Ve a: Settings > Projects > SonimaX
2. Click en "Client Keys (DSN)"
3. Copia el DSN mostrado

---

## ⚙️ Paso 4: Configurar Variables de Entorno (1 min)

### Opción A: Desarrollo Local

1. **Crea archivo `.env.local`** en `sonimax-frontend/`:
   ```bash
   cd /Volumes/Nexus/DevProyjects/sonimax/sonimax-frontend
   touch .env.local
   ```

2. **Añade tu configuración**:
   ```bash
   # Supabase Configuration
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
   
   # Sentry Monitoring
   VITE_SENTRY_DSN=https://abc123def456@o789012.ingest.sentry.io/456789
   
   # App Version
   VITE_APP_VERSION=2.3.0
   ```

3. **Guarda el archivo**

### Opción B: Producción (Vercel/Netlify)

**En Vercel:**
1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Añade:
   - `VITE_SENTRY_DSN` = tu DSN
   - `VITE_APP_VERSION` = 2.3.0

**En Netlify:**
1. Site settings > Environment variables
2. Añade las mismas variables

---

## 🚀 Paso 5: Verificar Integración (1 min)

### Desarrollo Local

1. **Reinicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Verifica en la consola:**
   ```
   ✅ Debería ver: "Sentry initialized successfully"
   ❌ Si ves: "⚠️ Sentry DSN no configurado" → revisar .env.local
   ```

3. **Abre la app en el navegador:**
   - Debería funcionar normalmente
   - Sentry está capturando en background

### Producción

1. **Build y deploy:**
   ```bash
   npm run build
   # Deploy a tu plataforma
   ```

2. **Verifica en Sentry dashboard:**
   - Ve a Projects > SonimaX > Issues
   - Espera 1-2 minutos
   - Deberías ver eventos de inicialización

---

## 🧪 Paso 6: Probar Captura de Errores (Opcional)

### Test 1: Error Manual

Añade temporalmente en cualquier componente:

```typescript
// TEST - ELIMINAR DESPUÉS
console.error('Test error for Sentry');
throw new Error('Test error - please ignore');
```

**Resultado esperado:**
- Error aparece en Sentry dashboard en ~30 segundos
- Incluye stack trace, navegador, URL

### Test 2: Error de Usuario Real

1. Intenta una acción que sabes que falla
2. Por ejemplo: subir un archivo muy grande
3. Ve a Sentry > Issues
4. Verás el error con contexto completo

### Test 3: Performance Monitoring

1. Navega por la app normalmente
2. Ve a Sentry > Performance
3. Verás métricas de carga de páginas
4. Identifica páginas lentas

---

## 📊 Paso 7: Configurar Alertas (Opcional - 2 min)

1. **Ve a**: Settings > Alerts

2. **Crear regla de alerta:**
   ```
   Rule name: Critical errors in production
   Conditions: 
     - Environment: production
     - Event type: error
     - Issue is: new
   Actions:
     - Send email to: tu@email.com
   ```

3. **Guardar regla**

**Ahora recibirás emails cuando haya errores en producción.**

---

## 🎯 Configuraciones Recomendadas

### 1. Environments

Configura diferentes environments:
- `development` - Local development
- `staging` - Testing
- `production` - Live app

En `.env`:
```bash
# Automático según el modo de Vite
# development: npm run dev
# production: npm run build
```

### 2. Releases

Ya configurado en `monitoring.ts`:
```typescript
release: `sonimax@${appVersion}` // sonimax@2.3.0
```

**Ventaja**: Trackea errores por versión

### 3. User Identification

Ya implementado en `AuthContext.tsx`:
```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.user_metadata?.nombre
});
```

**Ventaja**: Sabes qué usuarios están afectados

---

## 📈 Dashboard Principal

### Métricas Clave a Monitorear

1. **Issues (Errores):**
   - Total de errores únicos
   - Usuarios afectados
   - Tendencia (aumentando/disminuyendo)

2. **Performance:**
   - Tiempo promedio de carga
   - LCP (Largest Contentful Paint)
   - FID (First Input Delay)
   - CLS (Cumulative Layout Shift)

3. **Releases:**
   - Comparar v2.3.0 vs v2.2.2
   - ¿Nuevo deploy introdujo bugs?

---

## 🚨 Qué Hacer Cuando Llega una Alerta

### Email de Sentry:

```
🚨 New issue in SonimaX

TypeError: Cannot read property 'storage_url' of undefined
at WaveformViewer.tsx:89
Users affected: 5
First seen: 2 minutes ago
```

### Plan de Acción:

1. **Click en el link del email** → Te lleva al error en Sentry

2. **Revisar información:**
   - Stack trace completo
   - Navegador del usuario
   - URL donde ocurrió
   - Session replay (si disponible)

3. **Reproducir localmente:**
   - Usar información del contexto
   - Replicar escenario

4. **Fix y deploy:**
   - Corregir código
   - Deploy a producción
   - Monitorear en Sentry

5. **Confirmar resolución:**
   - Marcar issue como "Resolved" en Sentry
   - Issue se reabrirá si vuelve a ocurrir

---

## 🎓 Tips Avanzados

### 1. Custom Breadcrumbs

Añade contexto personalizado:

```typescript
import { addBreadcrumb } from '@/lib/monitoring';

addBreadcrumb({
  category: 'user-action',
  message: 'Usuario inició análisis BirdNET',
  level: 'info',
  data: {
    recordingId: 'abc123',
    fileSize: '25MB'
  }
});
```

### 2. Custom Context

```typescript
import { setContext } from '@/lib/monitoring';

setContext('recording', {
  id: recording.id,
  duration: recording.duracion_segundos,
  format: recording.formato_audio
});
```

### 3. Performance Marks

```typescript
import { startTransaction } from '@/lib/monitoring';

const transaction = startTransaction('birdnet-analysis');
// ... código de análisis ...
transaction.finish();
```

---

## 🔒 Seguridad y Privacidad

### Datos Enmascarados Automáticamente

Ya configurado en `monitoring.ts`:
```typescript
replayIntegration({
  maskAllText: true,        // Oculta texto
  blockAllMedia: true,      // Oculta imágenes/video
})
```

**Resultado:**
- Contraseñas: ********
- Emails: *****@*****.com
- Datos sensibles: enmascarados

### Datos Nunca Enviados a Sentry

- Variables de entorno sensibles
- Tokens de autenticación
- Claves API de Supabase
- Información de tarjetas de crédito (si la hubiera)

---

## 📞 Soporte

### Documentación Oficial
- https://docs.sentry.io/platforms/javascript/guides/react/

### Community Forum
- https://forum.sentry.io/

### Status Page
- https://status.sentry.io/

---

## ✅ Checklist Final

Antes de considerar Sentry configurado correctamente:

- [ ] Cuenta creada en Sentry.io
- [ ] Proyecto "SonimaX" creado
- [ ] DSN copiado y guardado
- [ ] Variable `VITE_SENTRY_DSN` configurada en `.env.local`
- [ ] Variable `VITE_APP_VERSION=2.3.0` configurada
- [ ] Servidor de desarrollo reiniciado
- [ ] Console muestra "Sentry initialized successfully"
- [ ] Test de error manual funcionó
- [ ] Error aparece en Sentry dashboard
- [ ] Alertas por email configuradas
- [ ] Variables configuradas en producción (Vercel/Netlify)

---

## 🎉 ¡Felicidades!

Ahora tienes **monitoring profesional enterprise-grade** en tu aplicación:

✅ Error tracking automático  
✅ Performance monitoring  
✅ Session replays  
✅ Alertas en tiempo real  
✅ Release tracking  
✅ User context  

**SonimaX ahora tiene mejor monitoring que software comercial de $2,500/año.**

**Todo esto... ¡GRATIS!** 🎁

---

*Última actualización: 6 de noviembre de 2025*  
*Versión de SonimaX: 2.3.0*  
*Plan de Sentry: Developer (Free)*
