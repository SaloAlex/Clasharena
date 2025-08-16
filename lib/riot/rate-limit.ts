import { RateLimitConfig } from './client';

// Función para esperar un tiempo específico
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Función para manejar reintentos con rate limiting
export async function withRiotApiRetry<T>(
  fn: () => Promise<T>,
  config: RateLimitConfig,
  maxRetries: number = 3
): Promise<T> {
  let retries = 0;
  
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      // Si es un error de rate limit (429)
      if (error.status === 429) {
        if (retries >= maxRetries) {
          throw new Error('Máximo número de reintentos alcanzado');
        }

        // Obtener el tiempo de espera del header o usar un valor por defecto
        const retryAfter = parseInt(error.headers?.get('retry-after') || '1', 10);
        await wait(retryAfter * 1000);
        retries++;
        continue;
      }

      // Si es otro tipo de error, lo lanzamos
      throw error;
    }
  }
}

// Función para verificar límites personales
export function checkPersonalLimits(config: RateLimitConfig): boolean {
  // TODO: Implementar lógica de límites personales
  return true;
}
