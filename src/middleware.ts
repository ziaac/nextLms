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
  '/siswa-baru',        // formulir daftar ulang — publik, tanpa login
]

const PUBLIC_PREFIXES = ['/berita/', '/galeri/', '/jadwal-publik/', '/siswa-baru/']

// File statis publik di-root yang tidak butuh auth
const PUBLIC_FILES = [
  '/manifest.webmanifest',
  '/site.webmanifest',
  '/sw.js',
  '/robots.txt',
  '/sitemap.xml',
]

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
  '/dashboard/master-dimensi-profil':  ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/homepage':               ['SUPER_ADMIN', 'ADMIN', 'STAFF_TU', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA'],
  '/dashboard/announcement':           ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'GURU', 'WALI_KELAS'],
  '/dashboard/pendaftaran-ulang':      ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU'],
  '/dashboard/kategori-pembayaran':    ['SUPER_ADMIN', 'ADMIN', 'STAFF_KEUANGAN'],
  '/dashboard/report':                 ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA'],
  '/dashboard/dokumen-pengajaran':     ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'GURU', 'WALI_KELAS'],
  '/dashboard/perizinan':              ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU', 'GURU', 'WALI_KELAS'],
  '/dashboard/sikap':                  ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'GURU', 'WALI_KELAS', 'SISWA'],
  '/dashboard/prestasi':               ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'GURU', 'WALI_KELAS', 'SISWA'],
  '/dashboard/ekskul':                 ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'GURU', 'SISWA'],
  '/dashboard/penilaian':              ['GURU', 'WALI_KELAS', 'ADMIN', 'SUPER_ADMIN'],
  '/dashboard/log-lckh/manajemen':     ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA'],
  '/dashboard/log-lckh':               ['GURU', 'WALI_KELAS', 'SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU'],

  // ── Keuangan ───────────────────────────────────────────────────────────────
  '/dashboard/tagihan':                ['STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN', 'SISWA', 'ORANG_TUA'],
  '/dashboard/pembayaran':             ['STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN', 'SISWA', 'ORANG_TUA'],
}

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true
  if (PUBLIC_FILES.includes(pathname)) return true
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true
  return false
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Parse cookie auth sekali di awal — dipakai untuk dua pengecekan
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

  // Jika sudah login dan mencoba akses /login → redirect ke /dashboard
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (isPublicRoute(pathname)) return NextResponse.next()

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
    // Kecualikan: Next.js internals, file statis publik (gambar, manifest, SW, dll)
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|webmanifest)|sw\\.js|robots\\.txt|sitemap\\.xml|icons|images|fonts).*)',
  ],
}
