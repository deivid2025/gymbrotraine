# syntax=docker/dockerfile:1

# ============================================================================
# GymBro Trainee — Dockerfile para Dokploy
# Build multi-stage con Bun + Next.js 16 standalone output.
# ============================================================================

# ---------------------------------------------------------------------------
# Stage 1: deps — instala dependencias
# ---------------------------------------------------------------------------
FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 2: builder — compila la app Next.js (standalone output)
# ---------------------------------------------------------------------------
FROM oven/bun:1 AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# El script "build" de package.json ejecuta:
#   next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
# lo que deja un server.js standalone auto-contenido en .next/standalone/
RUN bun run build

# ---------------------------------------------------------------------------
# Stage 3: runner — runtime slim con Bun
# ---------------------------------------------------------------------------
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copia el build standalone (incluye server.js, .next/ y public/)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/standalone/public ./public

EXPOSE 3000

# Healthcheck usando bun (no depende de wget/curl que no están en slim)
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=30s \
  CMD bun -e "fetch('http://127.0.0.1:3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "server.js"]
