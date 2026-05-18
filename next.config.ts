import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  // experimental: {
  //   trustHost: true,
  // },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    // [ALTA-5] Origen específico en lugar de wildcard "*".
    // NEXT_PUBLIC_APP_URL es la única variable ssegura en el cliente (no contiene secretos).
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' || 'http://localhost:9002';

    return [
      // [ALTA-5] CORS restringido al origen de la propia app
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: allowedOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,POST,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
      // [MEDIA-4] Headers de seguridad HTTP para todas las rutas
      {
        source: '/(.*)',
        headers: [
          // Evita que la app sea embebida en iframes (clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Desactiva el MIME-sniffing del navegador
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Controla el referrer en navegaciones cross-origin
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Fuerza HTTPS por 2 años (activar solo cuando el dominio sea 100% HTTPS)
          // { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
  // [ALTA-4] ELIMINADO: el bloque `env: {}` inyectaba secretos del servidor
  // (NOTION_TOKEN, BINANCE_API_KEY, etc.) en el bundle de JavaScript del cliente,
  // haciéndolos visibles en DevTools para cualquier usuario.
  //
  // Las Server Actions y Server Components acceden a process.env directamente
  // desde el servidor — este bloque nunca fue necesario.
};

export default nextConfig;
