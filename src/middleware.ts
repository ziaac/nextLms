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
  '/jadwal-publik',
]

const PUBLIC_PREFIXES = ['/berita/', '/galeri/', '/jadwal-publik/']

// PENTING: Urutan dari yang paling spesifik ke yang paling umum
// karena matching pakai .startsWith()
const ROLE_ROUTES: Record<string, UserRole[]> = {

  // ── Absensi ────────────────────────────────────────────────────────────────
  '/dashboard/absensi/manajemen':   ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU'],
  '/dashboard/absensi/wali-kelas':  ['GURU', 'WALI_KELAS'],
  '/dashboard/absensi/guru':        ['GURU', 'WALI_KELAS'],
  '/dashboard/absensi/siswa':       ['SISWA', 'ORANG_TUA'],
  // /dashboard/absensi/scan — tidak dibatasi role (semua yg login bisa akses)

  // ── Jadwal ─────────────────────────────────────────────────────────────────
  '/dashboard/jadwal/manajemen':    ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU'],
  '/dashboard/jadwal/wali-kelas':   ['GURU', 'WALI_KELAS'],
  '/dashboard/jadwal/guru':         ['GURU', 'WALI_KELAS'],
  '/dashboard/jadwal/kelas':        ['SISWA', 'ORANG_TUA', 'WALI_KELAS'],

  // ── Pembelajaran ───────────────────────────────────────────────────────────
  '/dashboard/pembelajaran/manajemen': ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU'],
  '/dashboard/pembelajaran/guru':      ['GURU', 'WALI_KELAS'],
  '/dashboard/pembelajaran/siswa':     ['SISWA'],

  // ── Kelas ──────────────────────────────────────────────────────────────────
  '/dashboard/kelas-belajar/manajemen': ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU'],
  '/dashboard/kelas-belajar':            ['SISWA', 'GURU', 'WALI_KELAS'],
  '/dashboard/kelas':                    ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU'],

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
  '/dashboard/pendaftaran-ulang':      ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU'],
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
    const roleUpper = (userRole as string).toUpperCase()
    const matchedRoute = Object.keys(ROLE_ROUTES).find((r) =>
      pathname.startsWith(r),
    )
    if (matchedRoute) {
      const allowed = ROLE_ROUTES[matchedRoute]
      if (!allowed.includes(roleUpper as any)) {
        console.warn(`[Middleware] Access denied for role ${roleUpper} to ${pathname}`)
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
