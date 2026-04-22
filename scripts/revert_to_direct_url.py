"""
REVERT — Kembalikan ke direct backend URL setelah CORS difix di backend

Cara pakai:
  python scripts/revert_to_direct_url.py
"""

import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

files = {}

files[".env.local"] = """\
# ─── API & Socket ─────────────────────────────────────────────
NEXT_PUBLIC_API_URL=https://apilms.man2kotamakassar.sch.id/api/v1
NEXT_PUBLIC_SOCKET_URL=https://socketlms.man2kotamakassar.sch.id
NEXT_PUBLIC_STORAGE_URL=https://storagelms.man2kotamakassar.sch.id

# ─── App Info ─────────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME=LMS MAN 2 Kota Makassar
NEXT_PUBLIC_APP_SHORT_NAME=LMS MAN 2
NEXT_PUBLIC_TIMEZONE=Asia/Makassar
"""

files["next.config.ts"] = """\
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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

  if (isPublicRoute(pathname)) return NextResponse.next()

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

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

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
    '/((?!_next/static|_next/image|favicon.ico|icons|images|fonts).*)',
  ],
}
"""

def write_files(files_dict, base):
    for path, content in files_dict.items():
        full = os.path.join(base, path.replace("/", os.sep))
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  ✅ {path}")
    print("\n🎉 Selesai! Tunggu backend deploy, lalu npm run dev")

if __name__ == "__main__":
    print("🔧 Revert ke direct backend URL\n")
    write_files(files, BASE)