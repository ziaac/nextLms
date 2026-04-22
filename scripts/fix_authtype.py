"""
FIX — Sesuaikan type AuthUser dengan response backend aktual

Response aktual:
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": "uuid",
    "email": "...",
    "role": "SUPER_ADMIN",
    "namaLengkap": "Super Administrator",
    "fotoUrl": null,
    "isVerified": true
  }
}

Cara pakai:
  Letakkan di: nextjslms/scripts/fix_auth_types.py
  Jalankan dari root project:
    python scripts/fix_auth_types.py
"""

import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

files = {}

# ============================================================
# src/types/auth.types.ts  — sesuai response backend aktual
# ============================================================

files["src/types/auth.types.ts"] = """\
import { UserRole } from './enums'

/** Struktur user sesuai response backend */
export interface AuthUser {
  id: string
  email: string
  role: UserRole
  namaLengkap: string
  fotoUrl: string | null
  isVerified: boolean
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
# src/lib/utils.ts  — getInitials tetap, tambah helper nama
# ============================================================

files["src/lib/utils.ts"] = """\
import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

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

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

/** Ambil 2 inisial dari namaLengkap */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
"""

# ============================================================
# src/lib/constants.ts  — getPublicFileUrl tetap
# ============================================================

files["src/lib/constants.ts"] = """\
export const API_URL = process.env.NEXT_PUBLIC_API_URL!
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL!
export const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL!
export const TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE ?? 'Asia/Makassar'
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'LMS MAN 2 Kota Makassar'
export const APP_SHORT_NAME = process.env.NEXT_PUBLIC_APP_SHORT_NAME ?? 'LMS MAN 2'

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 10

/**
 * Akses file public MinIO.
 * Jika fotoUrl sudah berupa full URL (http/https), kembalikan langsung.
 * Jika berupa key saja, gabungkan dengan STORAGE_URL.
 */
export const getPublicFileUrl = (urlOrKey: string): string => {
  if (!urlOrKey) return ''
  if (urlOrKey.startsWith('http')) return urlOrKey
  return `${STORAGE_URL}/lms-public/${urlOrKey}`
}
"""

# ============================================================
# src/hooks/useAuth.ts  — pakai namaLengkap, hapus debug log
# ============================================================

files["src/hooks/useAuth.ts"] = """\
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import { getErrorMessage } from '@/lib/utils'
import type { LoginDto } from '@/types'

export function useAuth() {
  const router = useRouter()
  const { setAuth, logout: storeLogout, user, isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (dto: LoginDto) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await authApi.login(dto)

      if (!res?.user?.id) throw new Error('Response login tidak valid')

      setAuth(res.user, res.accessToken, res.refreshToken)
      connectSocket(res.user.id)
      router.push('/dashboard')
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
      storeLogout()
      router.push('/login')
    }
  }

  return { login, logout, isLoading, error, user, isAuthenticated }
}
"""

# ============================================================
# src/lib/api/auth.api.ts  — hapus debug log
# ============================================================

files["src/lib/api/auth.api.ts"] = """\
import api from '@/lib/axios'
import type { LoginDto, LoginResponse, RefreshResponse } from '@/types'

export const authApi = {
  login: async (dto: LoginDto): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', dto)
    return data
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },

  logoutAll: async (): Promise<void> => {
    await api.post('/auth/logout-all')
  },

  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const { data } = await api.post<RefreshResponse>('/auth/refresh', {
      refreshToken,
    })
    return data
  },
}
"""

# ============================================================
# src/stores/auth.store.ts  — pakai AuthUser baru (tanpa profile)
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

      setAuth: (user, accessToken, refreshToken) => {
        if (!user?.id) {
          console.error('[authStore] user tidak valid:', user)
          return
        }
        set({ user, accessToken, refreshToken, isAuthenticated: true })
      },

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
# src/components/dashboard/UserMenu.tsx
# — pakai namaLengkap & fotoUrl langsung (bukan profile.nama)
# ============================================================

files["src/components/dashboard/UserMenu.tsx"] = """\
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { UserCircle, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/lib/utils'
import { getPublicFileUrl } from '@/lib/constants'

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN:    'Super Admin',
  ADMIN:          'Admin',
  KEPALA_SEKOLAH: 'Kepala Sekolah',
  WAKIL_KEPALA:   'Wakil Kepala',
  GURU:           'Guru',
  WALI_KELAS:     'Wali Kelas',
  SISWA:          'Siswa',
  ORANG_TUA:      'Orang Tua',
  STAFF_TU:       'Staff TU',
  STAFF_KEUANGAN: 'Staff Keuangan',
}

export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  const fotoUrl = user.fotoUrl ? getPublicFileUrl(user.fotoUrl) : null
  const initials = getInitials(user.namaLengkap)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt={user.namaLengkap}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {initials}
            </span>
          )}
        </div>

        {/* Nama — hidden di mobile */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight max-w-[120px] truncate">
            {user.namaLengkap}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {ROLE_LABEL[user.role] ?? user.role}
          </p>
        </div>
        <ChevronDown
          size={14}
          className={`hidden md:block text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="
          absolute right-0 top-full mt-2 w-52
          bg-white dark:bg-gray-900
          border border-gray-200 dark:border-gray-800
          rounded-2xl shadow-lg py-1 z-50
        ">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user.namaLengkap}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>

          <Link
            href="/dashboard/profil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <UserCircle size={16} />
            Profil Saya
          </Link>

          <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); logout() }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut size={16} />
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
"""

# ============================================================
# src/app/dashboard/page.tsx  — pakai namaLengkap
# ============================================================

files["src/app/dashboard/page.tsx"] = """\
'use client'

import { useAuthStore } from '@/stores/auth.store'

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN:    'Super Admin',
  ADMIN:          'Admin',
  KEPALA_SEKOLAH: 'Kepala Sekolah',
  WAKIL_KEPALA:   'Wakil Kepala',
  GURU:           'Guru',
  WALI_KELAS:     'Wali Kelas',
  SISWA:          'Siswa',
  ORANG_TUA:      'Orang Tua',
  STAFF_TU:       'Staff TU',
  STAFF_KEUANGAN: 'Staff Keuangan',
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null

  const firstName = user.namaLengkap.split(' ')[0]

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Selamat datang, {firstName}! 
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {ROLE_LABEL[user.role]} · LMS MAN 2 Kota Makassar
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Status',        value: '✅ Login',      desc: 'Autentikasi berhasil' },
          { label: 'Role',          value: ROLE_LABEL[user.role] ?? user.role, desc: 'Akses sesuai role' },
          { label: 'Tema',          value: 'Dark / Light',  desc: 'Toggle di kanan atas' },
          { label: 'Notifikasi',    value: 'Realtime',      desc: 'Socket.IO siap' },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 space-y-2"
          >
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {card.label}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {card.value}
            </p>
            <p className="text-xs text-gray-400">{card.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-400 text-center pt-4">
        Konten dashboard per role — Fase 4 🚧
      </p>
    </div>
  )
}
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

    print(f"""
🎉 {len(files_dict)} file berhasil diupdate!

Langkah:
  1. Hapus localStorage dulu (DevTools → Application → Local Storage → Clear)
     supaya state lama tidak konflik
  2. npm run dev
  3. Login ulang — seharusnya langsung masuk dashboard
""")

if __name__ == "__main__":
    print("🔧 Fix AuthUser type — sesuaikan dengan response backend aktual\n")
    print("Backend structure:")
    print("  user.namaLengkap  (bukan user.profile.nama)")
    print("  user.fotoUrl      (bukan user.profile.foto)")
    print("  user.isVerified   (field tambahan)\n")
    write_files(files, BASE)