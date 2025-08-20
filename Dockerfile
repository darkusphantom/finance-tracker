# === STAGE 1: DEPENDENCIES ===
# Get base image
FROM node:20-alpine AS deps

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./

# Install dependencies
RUN npm install

# === STAGE 2: BUILDER ===
# Get base image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy all other source files
COPY . .

# Set build-time environment variables
# Docker will look for a .env file in the build context.
# Make sure to create this file on your server before building.
ARG NOTION_TOKEN
ARG NOTION_AUTH_DB
ARG NOTION_TRANSACTIONS_DB
ARG NOTION_INCOME_DB
ARG NOTION_TOTAL_SAVINGS_DB
ARG NOTION_ACCOUNTS_DB
ARG NOTION_DEBTS_DB
ARG NOTION_BUDGET_DB

# Build the app
RUN npm run build

# === STAGE 3: RUNNER ===
# Get base image
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy the standalone Next.js server output from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# The server is started in docker-compose.yml using the command
# This ensures environment variables are passed correctly at runtime.
CMD ["node", "server.js"]
