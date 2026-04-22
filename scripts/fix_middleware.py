"""
FIX — Middleware memblokir proxy /api/v1/*
Tambahkan pengecualian /api/v1/* di middleware matcher
agar Next.js rewrite bisa forward ke backend.

Cara pakai:
  Letakkan di: nextjslms/scripts/fix_middleware_proxy.py
  Jalankan dari root project:
    python scripts/fix_middleware_proxy.py
"""

import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

files = {}

# ============================================================
# src/middleware.ts  — exclude /api/v1/* dari middleware
# ============================================================

files["src/middleware.ts"] = """\
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { UserRole } from '@/types/enums'

const PUBLIC_ROUTES = [
  '/',
  '/berita',
  '/profil',
  '/galeri',
  '/guru',
  '/siswa',
  '/prestasi',
  '/ekskul',
  '/pendaftaran-ulang',
  '/login',
]

const PUBLIC_PREFIXES = ['/berita/', '/galeri/']

const ROLE_ROUTES: Record<string, UserRole[]> = {
  '/dashboard/users':                  ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/tahun-ajaran':           ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/master-sikap':           ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/kategori-pembayaran':    ['SUPER_ADMIN', 'ADMIN', 'STAFF_KEUANGAN'],
  '/dashboard/homepage':               ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/pendaftaran-ulang':      ['SUPER_ADMIN', 'ADMIN', 'STAFF_TU'],
  '/dashboard/report':                 ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA'],
  '/dashboard/mata-pelajaran-tingkat': ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/kelas':                  ['SUPER_ADMIN', 'ADMIN', 'WALI_KELAS', 'GURU'],
  '/dashboard/penilaian':              ['GURU', 'WALI_KELAS', 'ADMIN', 'SUPER_ADMIN'],
  '/dashboard/tagihan':                ['STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN', 'SISWA', 'ORANG_TUA'],
  '/dashboard/pembayaran':             ['STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN', 'SISWA', 'ORANG_TUA'],
}

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true
  return false
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ✅ Izinkan semua request ke /api/* (proxy ke backend)
  if (pathname.startsWith('/api/')) return NextResponse.next()

  // Izinkan route public
  if (isPublicRoute(pathname)) return NextResponse.next()

  // Ambil auth dari cookie
  const authCookie = request.cookies.get('lms-auth')
  let isAuthenticated = false
  let userRole: UserRole | null = null

  if (authCookie?.value) {
    try {
      const parsed = JSON.parse(decodeURIComponent(authCookie.value))
      const state = parsed?.state
      isAuthenticated = state?.isAuthenticated === true
      userRole = state?.user?.role ?? null
    } catch {
      isAuthenticated = false
    }
  }

  // Belum login → redirect ke /login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Cek role untuk route tertentu
  if (userRole) {
    const matchedRoute = Object.keys(ROLE_ROUTES).find((r) =>
      pathname.startsWith(r),
    )
    if (matchedRoute) {
      const allowed = ROLE_ROUTES[matchedRoute]
      if (!allowed.includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match semua path KECUALI:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - /api/*        (proxy ke backend — JANGAN diinterrupt middleware)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
"""

# ============================================================
# next.config.ts  — pastikan rewrite sudah benar
# ============================================================

files["next.config.ts"] = """\
import type { NextConfig } from 'next'

const BACKEND_URL = 'https://apilms.man2kotamakassar.sch.id'

const nextConfig: NextConfig = {
  async rewrites() {
    // Proxy aktif di semua environment (dev & prod frontend)
    // Production: ganti NEXT_PUBLIC_API_URL ke URL backend langsung
    // agar tidak melalui proxy (lihat catatan di bawah)
    return [
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
    ]
  },

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
# .env.local  — API_URL pakai proxy lokal
# ============================================================

files[".env.local"] = """\
# ─── Development: pakai proxy Next.js (/api/v1/* → backend) ──
NEXT_PUBLIC_API_URL=http://localhost:3005/api/v1
NEXT_PUBLIC_SOCKET_URL=https://socketlms.man2kotamakassar.sch.id
NEXT_PUBLIC_STORAGE_URL=https://storagelms.man2kotamakassar.sch.id

# ─── Production (uncomment saat deploy ke Coolify) ───────────
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

Langkah:
  1. Stop dev server (Ctrl+C)
  2. Hapus .next cache:
       rd /s /q .next        (Windows)
       rm -rf .next          (Mac/Linux)
  3. npm run dev
  4. Login ulang
""")

if __name__ == "__main__":
    print("🔧 Fix middleware — exclude /api/* dari route protection\n")
    write_files(files, BASE)