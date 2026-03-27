# ─── Stage 1: Build ───────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Create logs directory
RUN mkdir -p logs

# ─── Production image ─────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S billflow -u 1001

WORKDIR /app

COPY --from=base --chown=billflow:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=billflow:nodejs /app .

USER billflow

EXPOSE 5000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "server.js"]
