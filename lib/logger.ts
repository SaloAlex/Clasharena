const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: any[]) => {
    // Los errores siempre se registran, pero en producción sin detalles sensibles
    if (isDevelopment) {
      console.error('[ERROR]', ...args);
    } else {
      // En producción, solo registramos mensajes de error genéricos
      console.error('[ERROR] Se produjo un error en la aplicación');
    }
  }
};
