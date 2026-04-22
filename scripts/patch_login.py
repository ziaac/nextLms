import os

ROOT = r"D:\projects\LMS-MAN\Code\nextjslms\src"

FILES = {}

# ─────────────────────────────────────────────────────────────────────────────
# 1. middleware.ts — fix redirect query string + tambah semua ROLE_ROUTES
# ─────────────────────────────────────────────────────────────────────────────
FILES["middleware.ts"] = """import { NextResponse } from 'next/server'
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

// PENTING: Urutan dari yang paling spesifik ke yang paling umum
// karena matching pakai .startsWith()
const ROLE_ROUTES: Record<string, UserRole[]> = {

  // ── Absensi ────────────────────────────────────────────────────────────────
  '/dashboard/absensi/manajemen':   ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU'],
  '/dashboard/absensi/wali-kelas':  ['GURU'],
  '/dashboard/absensi/guru':        ['GURU'],
  '/dashboard/absensi/siswa':       ['SISWA', 'ORANG_TUA'],
  // /dashboard/absensi/scan — tidak dibatasi role (semua yg login bisa akses)

  // ── Jadwal ─────────────────────────────────────────────────────────────────
  '/dashboard/jadwal/manajemen':    ['SUPER_ADMIN', 'ADMIN', 'WAKIL_KEPALA'],
  '/dashboard/jadwal/wali-kelas':   ['GURU'],
  '/dashboard/jadwal/guru':         ['GURU'],
  '/dashboard/jadwal/kelas':        ['SISWA', 'ORANG_TUA', 'WALI_KELAS'],

  // ── Pembelajaran ───────────────────────────────────────────────────────────
  '/dashboard/pembelajaran/manajemen': ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/pembelajaran/guru':      ['GURU'],
  '/dashboard/pembelajaran/siswa':     ['SISWA'],

  // ── Kelas ──────────────────────────────────────────────────────────────────
  '/dashboard/kelas-belajar':       ['SISWA'],
  '/dashboard/kelas':               ['SUPER_ADMIN', 'ADMIN', 'WALI_KELAS', 'GURU'],

  // ── Master Data ────────────────────────────────────────────────────────────
  '/dashboard/master-jam':             ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/mata-pelajaran-tingkat': ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/mata-pelajaran':         ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/ruangan':                ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/tingkat-kelas':          ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/tahun-ajaran':           ['SUPER_ADMIN', 'ADMIN'],

  // ── Admin & Manajemen ──────────────────────────────────────────────────────
  '/dashboard/users':                  ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/master-sikap':           ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/homepage':               ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/pendaftaran-ulang':      ['SUPER_ADMIN', 'ADMIN', 'STAFF_TU'],
  '/dashboard/kategori-pembayaran':    ['SUPER_ADMIN', 'ADMIN', 'STAFF_KEUANGAN'],
  '/dashboard/report':                 ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA'],
  '/dashboard/penilaian':              ['GURU', 'WALI_KELAS', 'ADMIN', 'SUPER_ADMIN'],

  // ── Keuangan ───────────────────────────────────────────────────────────────
  '/dashboard/tagihan':                ['STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN', 'SISWA', 'ORANG_TUA'],
  '/dashboard/pembayaran':             ['STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN', 'SISWA', 'ORANG_TUA'],
}

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true
  return false
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

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
    // FIX: sertakan query string agar token QR tidak hilang setelah login
    loginUrl.searchParams.set('redirect', pathname + search)
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

# ─────────────────────────────────────────────────────────────────────────────
# 2. hooks/useAuth.ts — fix redirect setelah login baca ?redirect=
# ─────────────────────────────────────────────────────────────────────────────
FILES["hooks/useAuth.ts"] = """'use client'
import { useState } from 'react'
import { authApi } from '@/lib/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import { clearAuthCookie } from '@/lib/cookie'
import { getErrorMessage } from '@/lib/utils'
import type { LoginDto } from '@/types'

export function useAuth() {
  const { setAuth, logout: storeLogout, user, isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (dto: LoginDto) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await authApi.login(dto)
      if (!res?.user?.id) throw new Error('Response login tidak valid')

      // 1. Simpan ke store + cookie
      setAuth(res.user, res.accessToken, res.refreshToken)

      // 2. Connect socket
      connectSocket(res.user.id)

      // 3. Baca ?redirect= dari URL — fallback ke /dashboard
      //    Pakai window.location.search karena useSearchParams tidak tersedia
      //    di konteks ini (dipanggil dari form, bukan page)
      const params   = new URLSearchParams(window.location.search)
      const rawRedirect = params.get('redirect') ?? '/dashboard'

      // Keamanan: hanya izinkan relative path (cegah open-redirect)
      const safePath = rawRedirect.startsWith('/') ? rawRedirect : '/dashboard'

      // Pakai window.location.href agar middleware baca cookie yang baru ditulis
      window.location.href = safePath
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    } finally {
      disconnectSocket()
      clearAuthCookie()
      storeLogout()
      window.location.href = '/login'
    }
  }

  return { login, logout, isLoading, error, user, isAuthenticated }
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# WRITER
# ─────────────────────────────────────────────────────────────────────────────
def write_files():
    for relative_path, content in FILES.items():
        full_path = os.path.join(ROOT, relative_path.replace('/', os.sep))
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[OK] {relative_path}")

if __name__ == '__main__':
    write_files()
    print("\n✅ Middleware fix selesai — 2 file diupdate.")
    print("   Verifikasi: npx tsc --noEmit 2>&1 | Select-String 'middleware|useAuth'")