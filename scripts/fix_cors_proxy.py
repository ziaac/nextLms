"""
FIX CORS — Alternatif cepat via Next.js Proxy
Tidak perlu deploy backend, langsung jalan di lokal.

Cara pakai:
  Jalankan di root project FRONTEND (nextjslms/):
    python scripts/fix_cors_proxy.py

Cara kerja:
  Browser → localhost:3005/api/v1/* 
          → Next.js rewrites 
          → https://apilms.man2kotamakassar.sch.id/api/v1/*
  
  Karena request ke backend dilakukan server-side (Next.js),
  tidak ada CORS sama sekali.

  .env.local juga diupdate agar API_URL mengarah ke proxy lokal
  saat development.
"""

import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

files = {}

# ============================================================
# next.config.ts
# ============================================================

files["next.config.ts"] = """\
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ── API Proxy (Development) ────────────────────────────────
  // Menghindari CORS saat development lokal.
  // Browser hit /api/v1/* → Next.js forward ke backend production.
  async rewrites() {
    // Hanya aktif saat development
    if (process.env.NODE_ENV !== 'development') return []

    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://apilms.man2kotamakassar.sch.id/api/v1/:path*',
      },
    ]
  },

  // ── Image domains ─────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storagelms.man2kotamakassar.sch.id',
      },
    ],
  },
}

export default nextConfig
"""

# ============================================================
# .env.local  — update API_URL untuk pakai proxy saat dev
# ============================================================

files[".env.local"] = """\
# ─── Development: pakai proxy Next.js (no CORS) ──────────────
NEXT_PUBLIC_API_URL=http://localhost:3005/api/v1
NEXT_PUBLIC_SOCKET_URL=https://socketlms.man2kotamakassar.sch.id
NEXT_PUBLIC_STORAGE_URL=https://storagelms.man2kotamakassar.sch.id

# ─── Production (uncomment saat build production) ────────────
# NEXT_PUBLIC_API_URL=https://apilms.man2kotamakassar.sch.id/api/v1
# NEXT_PUBLIC_SOCKET_URL=https://socketlms.man2kotamakassar.sch.id
# NEXT_PUBLIC_STORAGE_URL=https://storagelms.man2kotamakassar.sch.id

# ─── App Info ────────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME=LMS MAN 2 Kota Makassar
NEXT_PUBLIC_APP_SHORT_NAME=LMS MAN 2
NEXT_PUBLIC_TIMEZONE=Asia/Makassar
"""

# ============================================================
# WRITE
# ============================================================

def write_files(files_dict: dict, base: str) -> None:
    for path, content in files_dict.items():
        full = os.path.join(base, path.replace("/", os.sep))
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  ✅ {path}")

    print("""
🎉 Fix selesai!

Langkah selanjutnya:
  1. Restart dev server:
       npm run dev

  2. Coba login lagi dari http://localhost:3005

  3. Untuk production nanti:
     - Fix CORS di backend (fix_cors_main.py)
     - Kembalikan .env.local ke URL production
     - next.config.ts sudah handle otomatis (cek NODE_ENV)
""")

if __name__ == "__main__":
    print("🔧 Fix CORS via Next.js Proxy\n")
    write_files(files, BASE)