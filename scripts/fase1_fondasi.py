"""
FASE 1 — Fondasi & Infrastruktur
LMS MAN 2 Kota Makassar — Next.js Frontend

Cara pakai:
  1. Letakkan file ini di: nextjslms/scripts/fase1_fondasi.py
  2. Jalankan dari root project (nextjslms/):
       python scripts/fase1_fondasi.py
  3. Setelah selesai, jalankan perintah install di terminal:
       npm install @heroui/styles @heroui/react next-themes zustand @tanstack/react-query axios react-hook-form zod @hookform/resolvers socket.io-client lucide-react recharts date-fns date-fns-tz
"""

import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

files = {}

# ============================================================
# .env.local
# ============================================================

files[".env.local"] = """\
# ─── API & Socket — Production ───────────────────────────────
NEXT_PUBLIC_API_URL=https://apilms.man2kotamakassar.sch.id/api/v1
NEXT_PUBLIC_SOCKET_URL=https://socketlms.man2kotamakassar.sch.id
NEXT_PUBLIC_STORAGE_URL=https://storagelms.man2kotamakassar.sch.id

# ─── API & Socket — Development (uncomment saat lokal) ───────
# NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
# NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
# NEXT_PUBLIC_STORAGE_URL=http://localhost:9000

# ─── App Info ────────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME=LMS MAN 2 Kota Makassar
NEXT_PUBLIC_APP_SHORT_NAME=LMS MAN 2
NEXT_PUBLIC_TIMEZONE=Asia/Makassar
"""

# ============================================================
# src/lib/constants.ts
# ============================================================

files["src/lib/constants.ts"] = """\
export const API_URL = process.env.NEXT_PUBLIC_API_URL!
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL!
export const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL!
export const TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE ?? 'Asia/Makassar'
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'LMS MAN 2 Kota Makassar'
export const APP_SHORT_NAME = process.env.NEXT_PUBLIC_APP_SHORT_NAME ?? 'LMS MAN 2'

/** Akses file public MinIO */
export const getPublicFileUrl = (key: string) =>
  `${STORAGE_URL}/lms-public/${key}`

/** Pagination default */
export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 10
"""

# ============================================================
# src/lib/utils.ts
# ============================================================

files["src/lib/utils.ts"] = """\
import { type ClassValue, clsx } from 'clsx'

/** Gabungkan class names (seperti cn() di shadcn) */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/** Ambil pesan error dari response API */
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const res = (error as { response?: { data?: { message?: string | string[] } } }).response
    const msg = res?.data?.message
    if (Array.isArray(msg)) return msg.join(', ')
    if (typeof msg === 'string') return msg
  }
  if (error instanceof Error) return error.message
  return 'Terjadi kesalahan yang tidak diketahui'
}

/** Format angka ke Rupiah */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

/** Inisial nama untuk avatar */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

/** Truncate teks */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
"""

# ============================================================
# src/lib/helpers/timezone.ts
# ============================================================

files["src/lib/helpers/timezone.ts"] = """\
import { TIMEZONE } from '../constants'

/**
 * Format tanggal ke locale Indonesia dengan timezone WITA (Asia/Makassar)
 */
export const formatTanggal = (
  date: string | Date,
  opts?: Intl.DateTimeFormatOptions,
): string =>
  new Intl.DateTimeFormat('id-ID', { timeZone: TIMEZONE, ...opts }).format(
    new Date(date),
  )

export const formatTanggalLengkap = (date: string | Date): string =>
  formatTanggal(date, { dateStyle: 'full', timeStyle: 'short' })

export const formatTanggalSaja = (date: string | Date): string =>
  formatTanggal(date, { dateStyle: 'long' })

export const formatWaktu = (date: string | Date): string =>
  formatTanggal(date, { timeStyle: 'short' })

export const formatTanggalPendek = (date: string | Date): string =>
  formatTanggal(date, { dateStyle: 'medium' })

/** Cek apakah tanggal sudah lewat */
export const isPast = (date: string | Date): boolean =>
  new Date(date) < new Date()

/** Cek apakah tanggal hari ini */
export const isToday = (date: string | Date): boolean => {
  const d = new Date(date)
  const now = new Date()
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
}
"""

# ============================================================
# src/types/enums.ts
# ============================================================

files["src/types/enums.ts"] = """\
export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'KEPALA_SEKOLAH'
  | 'WAKIL_KEPALA'
  | 'GURU'
  | 'WALI_KELAS'
  | 'SISWA'
  | 'ORANG_TUA'
  | 'STAFF_TU'
  | 'STAFF_KEUANGAN'

export type NamaSemester = 'GANJIL' | 'GENAP'

export type Hari =
  | 'SENIN'
  | 'SELASA'
  | 'RABU'
  | 'KAMIS'
  | 'JUMAT'
  | 'SABTU'
  | 'MINGGU'

export type StatusAbsensi =
  | 'HADIR'
  | 'SAKIT'
  | 'IZIN'
  | 'ALPA'
  | 'TERLAMBAT'
  | 'TAP'

export type StatusTagihan =
  | 'BELUM_BAYAR'
  | 'CICILAN'
  | 'LUNAS'
  | 'TERLAMBAT'

export type StatusPembayaran = 'PENDING' | 'VERIFIED' | 'REJECTED'

export type MetodePembayaran =
  | 'TUNAI'
  | 'TRANSFER'
  | 'VIRTUAL_ACCOUNT'
  | 'QRIS'
  | 'EDC'
  | 'MOBILE_BANKING'

export type TingkatLomba =
  | 'SEKOLAH'
  | 'KECAMATAN'
  | 'KABUPATEN_KOTA'
  | 'PROVINSI'
  | 'NASIONAL'
  | 'INTERNASIONAL'

export type HasilPrestasi =
  | 'JUARA_1'
  | 'JUARA_2'
  | 'JUARA_3'
  | 'JUARA_HARAPAN'
  | 'FINALIS'
  | 'PESERTA'
  | 'LAINNYA'

export type StatusPerizinan = 'PENDING' | 'APPROVED' | 'REJECTED'

export type JenisPerizinan =
  | 'SAKIT'
  | 'IZIN'
  | 'CUTI'
  | 'DINAS'
  | 'KEPERLUAN_KELUARGA'

export type StatusBerita = 'DRAFT' | 'PUBLISHED'

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export type StatusPengumpulan = 'DRAFT' | 'SUBMITTED' | 'DINILAI' | 'REVISI'

export type JenisSikap = 'POSITIF' | 'NEGATIF'

export type StatusAnggota = 'AKTIF' | 'NONAKTIF' | 'KELUAR'

export type StatusBiodata =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'DIVERIFIKASI'
  | 'DITOLAK'

export type StatusAkhirTahun =
  | 'NAIK_KELAS'
  | 'TIDAK_NAIK'
  | 'LULUS'
  | 'DO'
  | 'MENGUNDURKAN_DIRI'

export type TipeKalender =
  | 'LIBUR_NASIONAL'
  | 'LIBUR_SEKOLAH'
  | 'UJIAN'
  | 'KEGIATAN_SEKOLAH'
  | 'RAPAT'
  | 'LAINNYA'

export type TipeNotifikasi =
  | 'INFO'
  | 'TUGAS'
  | 'PENILAIAN'
  | 'PEMBAYARAN'
  | 'ABSENSI'
  | 'PENGUMUMAN'
  | 'SIKAP'
  | 'PERIZINAN'
  | 'EKSTRAKURIKULER'
  | 'SISTEM'

export type JenisKelamin = 'L' | 'P'

export type Agama = 'ISLAM'
"""

# ============================================================
# src/types/api.types.ts
# ============================================================

files["src/types/api.types.ts"] = """\
/** Response list dengan pagination */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

/** Response error standar dari API */
export interface ApiError {
  statusCode: number
  message: string | string[]
  error: string
  timestamp: string
  path: string
}

/** Query params pagination */
export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}

/** Response upload file public */
export interface UploadPublicResponse {
  url: string
  key: string
}

/** Response upload file private */
export interface UploadPrivateResponse {
  key: string
  bucket: string
}

/** Response presigned URL */
export interface PresignedResponse {
  url: string
  expiresAt: string
}
"""

# ============================================================
# src/types/auth.types.ts
# ============================================================

files["src/types/auth.types.ts"] = """\
import { UserRole } from './enums'

export interface UserProfile {
  id: string
  nama: string
  foto?: string | null
  nip?: string | null
  nis?: string | null
}

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  profile: UserProfile
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface LoginDto {
  email: string
  password: string
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
}
"""

# ============================================================
# src/types/index.ts
# ============================================================

files["src/types/index.ts"] = """\
export * from './enums'
export * from './api.types'
export * from './auth.types'
"""

# ============================================================
# src/stores/auth.store.ts
# ============================================================

files["src/stores/auth.store.ts"] = """\
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthUser } from '@/types'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean

  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setUser: (user) => set({ user }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'lms-auth',
      storage: createJSONStorage(() => localStorage),
      // Hanya persist refreshToken — accessToken di-rebuild via refresh
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
"""

# ============================================================
# src/stores/notification.store.ts
# ============================================================

files["src/stores/notification.store.ts"] = """\
import { create } from 'zustand'
import type { Socket } from 'socket.io-client'

interface NotificationState {
  unreadCount: number
  socket: Socket | null

  setSocket: (socket: Socket | null) => void
  setUnreadCount: (count: number) => void
  incrementUnread: () => void
  resetUnread: () => void
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  unreadCount: 0,
  socket: null,

  setSocket: (socket) => set({ socket }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  resetUnread: () => set({ unreadCount: 0 }),
}))
"""

# ============================================================
# src/stores/index.ts
# ============================================================

files["src/stores/index.ts"] = """\
export * from './auth.store'
export * from './notification.store'
"""

# ============================================================
# src/lib/axios.ts
# ============================================================

files["src/lib/axios.ts"] = """\
import axios from 'axios'
import { API_URL } from './constants'
import { useAuthStore } from '@/stores/auth.store'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: tambah Bearer token ──────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor: auto-refresh saat 401 ───────────────
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: string) => void
  reject: (reason: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        })

        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken)
        processQueue(null, data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch (err) {
        processQueue(err, null)
        useAuthStore.getState().logout()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
"""

# ============================================================
# src/lib/socket.ts
# ============================================================

files["src/lib/socket.ts"] = """\
import { io, type Socket } from 'socket.io-client'
import { SOCKET_URL } from './constants'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
      autoConnect: false,
    })
  }
  return socket
}

export const connectSocket = (userId: string, kelasId?: string): Socket => {
  const s = getSocket()
  if (!s.connected) s.connect()
  s.emit('join', userId)
  if (kelasId) s.emit('join:kelas', kelasId)
  return s
}

export const disconnectSocket = (): void => {
  if (socket?.connected) {
    socket.disconnect()
    socket = null
  }
}
"""

# ============================================================
# src/lib/query-client.ts
# ============================================================

files["src/lib/query-client.ts"] = """\
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,       // 5 menit
      gcTime: 1000 * 60 * 10,          // 10 menit
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
"""

# ============================================================
# src/app/providers.tsx
# ============================================================

files["src/app/providers.tsx"] = """\
'use client'

import { HeroUIProvider } from '@heroui/react'
import { ThemeProvider } from 'next-themes'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <HeroUIProvider>
          {children}
        </HeroUIProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
"""

# ============================================================
# src/app/globals.css
# ============================================================

files["src/app/globals.css"] = """\
@import "tailwindcss";
@import "@heroui/styles";

/* ── Custom CSS Variables ────────────────────────────────────── */
:root {
  --color-primary: theme(colors.emerald.600);
  --color-primary-light: theme(colors.emerald.500);
}

/* ── Base ────────────────────────────────────────────────────── */
* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ── Mobile: cegah auto-zoom pada input ──────────────────────── */
input,
select,
textarea {
  font-size: 16px;
}

/* ── Scrollbar styling ───────────────────────────────────────── */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: oklch(0.7 0 0 / 0.4);
  border-radius: 999px;
}

::-webkit-scrollbar-thumb:hover {
  background: oklch(0.7 0 0 / 0.6);
}
"""

# ============================================================
# src/app/layout.tsx
# ============================================================

files["src/app/layout.tsx"] = """\
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'LMS MAN 2 Kota Makassar',
    template: '%s | LMS MAN 2 Makassar',
  },
  description:
    'Sistem Manajemen Pembelajaran & ERP MAN 2 Kota Makassar',
  keywords: ['LMS', 'MAN 2', 'Makassar', 'Madrasah', 'E-Learning'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
"""

# ============================================================
# src/middleware.ts  (route protection)
# ============================================================

files["src/middleware.ts"] = """\
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { UserRole } from '@/types/enums'

// Route yang bisa diakses tanpa login
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

// Prefix yang diizinkan tanpa login
const PUBLIC_PREFIXES = ['/berita/', '/galeri/']

// Role yang boleh akses route tertentu
const ROLE_ROUTES: Record<string, UserRole[]> = {
  '/dashboard/users':               ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/tahun-ajaran':        ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/master-sikap':        ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/kategori-pembayaran': ['SUPER_ADMIN', 'ADMIN', 'STAFF_KEUANGAN'],
  '/dashboard/homepage':            ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/pendaftaran-ulang':   ['SUPER_ADMIN', 'ADMIN', 'STAFF_TU'],
  '/dashboard/report':              ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA'],
  '/dashboard/mata-pelajaran-tingkat': ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/kelas':               ['SUPER_ADMIN', 'ADMIN', 'WALI_KELAS', 'GURU'],
  '/dashboard/penilaian':           ['GURU', 'WALI_KELAS', 'ADMIN', 'SUPER_ADMIN'],
  '/dashboard/tagihan':             ['STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN', 'SISWA', 'ORANG_TUA'],
  '/dashboard/pembayaran':          ['STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN', 'SISWA', 'ORANG_TUA'],
}

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true
  return false
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Izinkan route public
  if (isPublicRoute(pathname)) return NextResponse.next()

  // Ambil auth dari cookie (set saat login)
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
    '/((?!_next/static|_next/image|favicon.ico|icons|images|fonts).*)',
  ],
}
"""

# ============================================================
# src/app/page.tsx  (placeholder homepage)
# ============================================================

files["src/app/page.tsx"] = """\
export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-emerald-600">
          LMS MAN 2 Kota Makassar
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Fondasi berhasil dipasang ✅ — Lanjut ke Fase 2
        </p>
      </div>
    </main>
  )
}
"""

# ============================================================
# src/app/login/page.tsx  (placeholder login)
# ============================================================

files["src/app/login/page.tsx"] = """\
export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="text-gray-400 text-sm">Halaman login — dikerjakan di Fase 2</p>
      </div>
    </main>
  )
}
"""

# ============================================================
# src/app/dashboard/page.tsx  (placeholder dashboard)
# ============================================================

files["src/app/dashboard/page.tsx"] = """\
export default function DashboardPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-gray-400 text-sm">Dashboard — dikerjakan di Fase 2</p>
      </div>
    </main>
  )
}
"""

# ============================================================
# tsconfig.json  (pastikan path alias @ tersedia)
# ============================================================

files["tsconfig.json"] = """\
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
"""

# ============================================================
# WRITE FILES
# ============================================================

def write_files(files_dict: dict, base: str) -> None:
    print(f"📁 Base directory: {base}\n")
    created = 0
    for path, content in files_dict.items():
        full = os.path.join(base, path.replace("/", os.sep))
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  ✅ {path}")
        created += 1

    print(f"\n🎉 {created} file berhasil dibuat!")
    print("\n" + "=" * 60)
    print("📦 LANGKAH SELANJUTNYA — jalankan di terminal:")
    print("=" * 60)
    print("""
1. Install dependencies:

   npm install @heroui/styles @heroui/react next-themes zustand @tanstack/react-query axios react-hook-form zod @hookform/resolvers socket.io-client lucide-react recharts date-fns date-fns-tz clsx

2. Install dev dependencies:

   npm install -D @types/node

3. Jalankan dev server:

   npm run dev

4. Buka browser: http://localhost:3005
""")
    print("=" * 60)
    print("✅ FASE 1 selesai! Lanjut ke FASE 2 — Auth & Shell Dashboard")
    print("=" * 60)


if __name__ == "__main__":
    print("🚀 FASE 1 — Fondasi & Infrastruktur LMS MAN 2\n")
    write_files(files, BASE)