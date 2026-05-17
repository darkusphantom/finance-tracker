import { headers } from 'next/headers';

type RateLimitInfo = {
  count: number;
  lastReset: number;
};

// Utilizamos el objeto global para mantener el estado en desarrollo (Hot Reload) 
// y entre ejecuciones en el mismo contenedor serverless.
const globalRateLimitMap = globalThis as unknown as {
  __rateLimitMap: Map<string, RateLimitInfo>;
};

if (!globalRateLimitMap.__rateLimitMap) {
  globalRateLimitMap.__rateLimitMap = new Map();
}
const rateLimits = globalRateLimitMap.__rateLimitMap;

/**
 * Obtiene la IP del cliente a partir de los headers HTTP.
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return headersList.get('x-real-ip') || '127.0.0.1';
}

/**
 * Valida si una clave (como una IP) ha excedido su límite en el intervalo de tiempo (best-effort).
 * @param key Clave única (ej. 'login_192.168.1.1')
 * @param limit Límite de intentos
 * @param windowMs Ventana de tiempo en milisegundos
 * @returns true si se permite la petición, false si excede el límite
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimits.get(key);

  if (!record) {
    rateLimits.set(key, { count: 1, lastReset: now });
    return true;
  }

  // Si ya pasó la ventana de tiempo, reseteamos el contador
  if (now - record.lastReset > windowMs) {
    record.count = 1;
    record.lastReset = now;
    return true;
  }

  // Si excedió el límite dentro de la ventana de tiempo
  if (record.count >= limit) {
    return false;
  }

  // Incrementamos el contador
  record.count++;
  return true;
}
