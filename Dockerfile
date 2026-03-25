FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Production image ---
FROM node:20-slim

# Install Python for TTS worker
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built output from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 10000

ENV NODE_ENV=production
ENV PORT=10000

CMD ["node", "dist/index.cjs"]
