# syntax=docker/dockerfile:1

# =============================================================================
# Multi-stage Dockerfile for Nuxt.js Application
# Optimized for security and production deployment in Kubernetes
# =============================================================================

# Stage 1: Base image with Node.js and pnpm
# -----------------------------------------------------------------------------
FROM node:20.19.5-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate


# Stage 2: Dependencies installation
# -----------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies with frozen lockfile for reproducible builds
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod=false


# Stage 3: Development stage
# -----------------------------------------------------------------------------
FROM base AS dev
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Nuxt types and prepare for development
RUN pnpm postinstall

EXPOSE 8080
ENV NODE_ENV=development
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=8080

CMD ["pnpm", "dev"]


# Stage 4: Build stage
# -----------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

# Copy dependencies and source code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Nuxt types
RUN pnpm postinstall

# Build the application
ENV NODE_ENV=production
RUN pnpm build

# Clean up development dependencies to reduce size
RUN pnpm prune --prod


# Stage 5: Production stage with security hardening
# -----------------------------------------------------------------------------
FROM node:20.19.5-alpine AS prod

# Install security updates and create non-root user
RUN apk --no-cache upgrade && \
    apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nuxt -u 1001

# Set working directory and ownership
WORKDIR /app
RUN chown nuxt:nodejs /app

# Copy built application and dependencies
COPY --from=builder --chown=nuxt:nodejs /app/.output /app/.output
COPY --from=builder --chown=nuxt:nodejs /app/node_modules /app/node_modules

# Security: Remove unnecessary packages and create non-writable filesystem
RUN rm -rf /tmp/* /var/cache/apk/* && \
    chmod -R 555 /app && \
    chmod -R 755 /app/.output

# Switch to non-root user
USER nuxt

# Expose port
EXPOSE 8080

# Environment variables
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=8080
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node /app/.output/server/index.mjs --health-check || exit 1

# Use dumb-init to handle signals properly in containers
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "/app/.output/server/index.mjs"]


# =============================================================================
# Security Labels (Optional - for compliance and monitoring)
# =============================================================================
LABEL \
    org.opencontainers.image.title="Keycloak Community App" \
    org.opencontainers.image.description="Application for self-managed Keycloak community" \
    org.opencontainers.image.vendor="Ministère de l'Interieur" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.source="https://github.com/IA-Generative/keycloak-comu" \
    security.scan="enabled" \
    security.non-root="true"
