import * as Sentry from "@sentry/react";

/**
 * Inicializa Sentry para monitoreo de errores
 * Solo se activa en producción si hay DSN configurado
 */
export function initSentry() {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE || 'development';
  const appVersion = import.meta.env.VITE_APP_VERSION || '2.2.0';

  // Solo inicializar si hay DSN configurado
  if (!sentryDsn) {
    console.warn('⚠️ Sentry DSN no configurado. Monitoring deshabilitado.');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment,
    release: `sonimax@${appVersion}`,
    
    // Integrations
    integrations: [
      // Browser Tracing para performance monitoring
      Sentry.browserTracingIntegration(),
      
      // Session Replay para reproducir errores
      Sentry.replayIntegration({
        // Enmascara información sensible
        maskAllText: true,
        blockAllMedia: true,
      } as any),

      // Captura errores de console.error
      Sentry.captureConsoleIntegration({
        levels: ['error'],
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
    
    // Session Replay sample rates
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Filtrar errores conocidos/no importantes
    beforeSend(event, hint) {
      const error = hint.originalException;
      
      // Ignorar errores de extensiones de navegador
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
      ) {
        if (
          error.message.includes('chrome-extension://') ||
          error.message.includes('moz-extension://') ||
          error.message.includes('ResizeObserver loop limit exceeded')
        ) {
          return null;
        }
      }

      return event;
    },

    // Agregar contexto adicional
    initialScope: {
      tags: {
        app: 'sonimax',
        component: 'frontend',
      },
    },
  });

  console.log('✅ Sentry inicializado correctamente');
}

/**
 * Reporta un error manualmente a Sentry
 */
export function reportError(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
}

/**
 * Reporta un mensaje informativo
 */
export function reportMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Añade información de usuario a los reportes
 */
export function setUserContext(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Limpia información de usuario (al hacer logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Añade breadcrumb (rastro de acciones del usuario)
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}


