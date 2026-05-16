/**
 * Session token utilities — HMAC-SHA256 usando Web Crypto API.
 *
 * Usa `globalThis.crypto.subtle` que está disponible en:
 *  - Edge Runtime (Next.js middleware)
 *  - Node.js 18+ (Server Actions, Server Components)
 *
 * Sin dependencias externas. Funciones asíncronas.
 */

const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      '[session] SESSION_SECRET no está configurada. Añádela al .env antes de iniciar la app.'
    );
  }
  return secret;
}

/** Importa el secreto como CryptoKey para HMAC-SHA256 */
async function getKey(secret: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/** Convierte un ArrayBuffer a base64 de forma segura */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

/**
 * Crea un token de sesión firmado con HMAC-SHA256.
 * Formato: base64(userId).base64(hmac_signature)
 */
export async function createSessionToken(userId: string): Promise<string> {
  const key = await getKey(getSecret());
  const payload = btoa(userId);
  const signature = await globalThis.crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  return `${payload}.${bufferToBase64(signature)}`;
}

/**
 * Verifica un token de sesión.
 * El método `subtle.verify` usa comparación en tiempo constante internamente,
 * previniendo ataques de timing.
 *
 * @returns El userId original si el token es válido, null en caso contrario.
 */
export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const key = await getKey(getSecret());
    const dotIndex = token.lastIndexOf('.');
    if (dotIndex === -1) return null;

    const payload = token.substring(0, dotIndex);
    const sig = token.substring(dotIndex + 1);

    // Decodificar la firma base64 a bytes
    const sigBytes = Uint8Array.from(atob(sig), (c) => c.charCodeAt(0));

    const isValid = await globalThis.crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      encoder.encode(payload)
    );

    if (!isValid) return null;
    return atob(payload);
  } catch {
    return null;
  }
}

