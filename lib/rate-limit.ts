interface RateLimitConfig {
  windowMs: number; // Ventana de tiempo en milisegundos
  maxRequests: number; // Máximo número de requests por ventana
  keyGenerator?: (identifier: string) => string; // Función para generar claves únicas
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

class MemoryRateLimiter {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    const now = Date.now();
    
    // Limpiar entradas expiradas
    this.cleanup();
    
    const entry = this.store.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Primera request o ventana expirada
      this.store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      
      return {
        success: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      };
    }
    
    if (entry.count >= this.config.maxRequests) {
      // Límite excedido
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      };
    }
    
    // Incrementar contador
    entry.count++;
    this.store.set(key, entry);
    
    return {
      success: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Configuraciones predefinidas para diferentes tipos de endpoints
export const RATE_LIMIT_CONFIGS = {
  // Límites para API de Riot (respetando sus límites)
  RIOT_API: {
    windowMs: 2 * 60 * 1000, // 2 minutos
    maxRequests: 100, // 100 requests por 2 minutos
  },
  
  // Límites para endpoints públicos
  PUBLIC: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 60, // 60 requests por minuto
  },
  
  // Límites para endpoints autenticados
  AUTHENTICATED: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 120, // 120 requests por minuto
  },
  
  // Límites para endpoints de administración
  ADMIN: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 300, // 300 requests por minuto
  },
  
  // Límites para endpoints de autenticación
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5, // 5 intentos por 15 minutos
  },
} as const;

// Instancias de rate limiters
const rateLimiters = {
  riotApi: new MemoryRateLimiter(RATE_LIMIT_CONFIGS.RIOT_API),
  public: new MemoryRateLimiter(RATE_LIMIT_CONFIGS.PUBLIC),
  authenticated: new MemoryRateLimiter(RATE_LIMIT_CONFIGS.AUTHENTICATED),
  admin: new MemoryRateLimiter(RATE_LIMIT_CONFIGS.ADMIN),
  auth: new MemoryRateLimiter(RATE_LIMIT_CONFIGS.AUTH),
};

// Función helper para obtener IP del request
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback para desarrollo local
  return '127.0.0.1';
}

// Función helper para generar clave de rate limiting
export function generateRateLimitKey(type: keyof typeof rateLimiters, identifier: string): string {
  return `${type}:${identifier}`;
}

// Función principal para verificar rate limits
export async function checkRateLimit(
  type: keyof typeof rateLimiters,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = rateLimiters[type];
  const key = generateRateLimitKey(type, identifier);
  
  return await limiter.checkLimit(key);
}

// Middleware para Next.js API routes
export function withRateLimit(
  type: keyof typeof rateLimiters,
  handler: (request: Request) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    const identifier = getClientIP(request);
    const result = await checkRateLimit(type, identifier);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': RATE_LIMIT_CONFIGS[type].maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': result.retryAfter?.toString() || '60',
          },
        }
      );
    }
    
    // Agregar headers de rate limit a la respuesta
    const response = await handler(request);
    
    // Clonar la respuesta para agregar headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'X-RateLimit-Limit': RATE_LIMIT_CONFIGS[type].maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString(),
      },
    });
    
    return newResponse;
  };
}

// Función específica para Riot API con backoff exponencial
export async function checkRiotApiRateLimit(): Promise<boolean> {
  const identifier = 'riot-api-global';
  const result = await checkRateLimit('riotApi', identifier);
  
  if (!result.success) {
    console.warn(`Riot API rate limit exceeded. Retry after ${result.retryAfter} seconds.`);
    return false;
  }
  
  return true;
}

// Función para esperar cuando se excede el rate limit
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Función con retry automático para Riot API
export async function withRiotApiRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Verificar rate limit antes de cada intento
      const canProceed = await checkRiotApiRateLimit();
      if (!canProceed) {
        // Esperar antes del siguiente intento
        await sleep(2000 * attempt); // Backoff exponencial
        continue;
      }
      
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Si es un error de rate limit (429), esperar y reintentar
      if (error.status === 429 || error.message?.includes('rate limit')) {
        const retryAfter = error.headers?.get('retry-after') || '60';
        const waitTime = parseInt(retryAfter) * 1000 * attempt;
        
        console.warn(`Riot API rate limit hit on attempt ${attempt}. Waiting ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }
      
      // Para otros errores, no reintentar
      throw error;
    }
  }
  
  throw lastError!;
}