# ==========================================
# Stage 1: Install Dependencies
# ==========================================
FROM node:24-alpine AS deps
# Alpine butuh libc6-compat untuk beberapa package Next.js (seperti SWC)
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Paksa NPM agar lebih kebal terhadap jaringan yang lambat/putus-nyambung
RUN npm config set fetch-retries 3 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000
    
# Copy package.json dan package-lock.json
COPY package.json package-lock.json* ./
# Install semua depedensi (termasuk devDependencies untuk build)
RUN npm ci

# ==========================================
# Stage 2: Build Aplikasi Next.js
# ==========================================
FROM node:24-alpine AS builder
WORKDIR /app

# Ambil node_modules dari tahap deps
COPY --from=deps /app/node_modules ./node_modules
# Copy seluruh kode frontend bos
COPY . .

# Nonaktifkan telemetry Next.js (opsional, mempercepat build)
ENV NEXT_TELEMETRY_DISABLED=1

# Lakukan proses build
RUN npm run build

# ==========================================
# Stage 3: Production Runner (Super Ringan)
# ==========================================
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Bikin user non-root agar lebih aman di server
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy folder public (gambar statis, favicon, dll)
COPY --from=builder /app/public ./public

# Bikin folder cache dan set permission
RUN mkdir .next && chown nextjs:nodejs .next

# ✅ INI KUNCINYA: Copy hasil build standalone (sangat ringan)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Gunakan user non-root yang tadi dibuat
USER nextjs

EXPOSE 3000

# Jalankan server Next.js standalone
CMD ["node", "server.js"]