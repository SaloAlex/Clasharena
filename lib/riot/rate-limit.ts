import { RateLimitConfig } from './client';

// Cache para almacenar timestamps de las últimas peticiones
const requestCache = new Map<string, number[]>();

// Función para esperar un tiempo específico
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Función para limpiar peticiones antiguas
const cleanOldRequests = (key: string, windowMs: number) => {
  const now = Date.now();
  const requests = requestCache.get(key) || [];
  const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
  requestCache.set(key, validRequests);
  return validRequests;
};

// Función para verificar y registrar una petición
const checkAndRegisterRequest = (key: string, limit: number, windowMs: number): boolean => {
  const requests = cleanOldRequests(key, windowMs);
  if (requests.length >= limit) {
    return false;
  }
  requests.push(Date.now());
  requestCache.set(key, requests);
  return true;
};

// Función para manejar reintentos con rate limiting
export async function withRiotApiRetry<T>(
  fn: () => Promise<T>,
  config: RateLimitConfig,
  maxRetries: number = 3
): Promise<T> {
  let retries = 0;
  const methodKey = `${config.method}-${config.endpoint}`;
  
  while (true) {
    try {
      // Verificar límites antes de hacer la petición
      if (!checkAndRegisterRequest(methodKey, config.limit, config.windowMs)) {
        await wait(config.windowMs);
        continue;
      }

      return await fn();
    } catch (error: any) {
      // Si es un error de rate limit (429)
      if (error.status === 429 || (error.message && error.message.includes('Rate limited'))) {
        if (retries >= maxRetries) {
          throw new Error(`Máximo número de reintentos alcanzado para ${methodKey}`);
        }

        // Obtener el tiempo de espera del header o usar un valor por defecto
        const retryAfter = parseInt(error.headers?.get('retry-after') || '60', 10);
        await wait(retryAfter * 1000);
        retries++;
        continue;
      }

      // Si es otro tipo de error, lo lanzamos
      throw error;
    }
  }
}

// Configuraciones predeterminadas para diferentes endpoints
export const DEFAULT_LIMITS: { [key: string]: RateLimitConfig } = {
  'GET-matches': {
    method: 'GET',
    endpoint: 'matches',
    limit: 500,
    windowMs: 10000, // 10 segundos
  },
  'GET-matchIds': {
    method: 'GET',
    endpoint: 'matchIds',
    limit: 500,
    windowMs: 10000, // 10 segundos
  },
  'GET-summoner': {
    method: 'GET',
    endpoint: 'summoner',
    limit: 500,
    windowMs: 10000, // 10 segundos
  }
};