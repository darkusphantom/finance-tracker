# === STAGE 1: DEPENDENCIES ===
FROM node:20-alpine AS deps

# Instalar pnpm globalmente
RUN npm install -g pnpm@latest

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias con caché optimizado
RUN pnpm config set store-dir /root/.pnpm-store && \
    pnpm install --frozen-lockfile --prod=false

# === STAGE 2: BUILDER ===
FROM node:20-alpine AS builder

# Instalar pnpm
RUN npm install -g pnpm@latest

WORKDIR /app

# Copiar dependencias desde la etapa anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar archivos de configuración primero (para mejor caché)
COPY package.json pnpm-lock.yaml ./
COPY next.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.mjs ./
COPY tsconfig.json ./

# Copiar código fuente
COPY src ./src
COPY components.json ./

# Configurar Next.js para standalone output
ENV NEXT_TELEMETRY_DISABLED=1

# Construir la aplicación
RUN pnpm run build

# === STAGE 3: RUNNER ===
FROM node:20-alpine AS runner

# Configurar entorno de producción
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# Copiar archivos necesarios para producción (Next.js App Router no usa directorio public)

# Crear directorio .next y copiar archivos con permisos correctos
RUN mkdir .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Variables de entorno para el servidor
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando para iniciar el servidor
CMD ["node", "server.js"]
