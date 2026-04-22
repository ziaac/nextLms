"""
FASE 2 — Auth & Shell Dashboard
LMS MAN 2 Kota Makassar — Next.js Frontend

Cara pakai:
  1. Letakkan file ini di: nextjslms/scripts/fase2_auth_shell.py
  2. Jalankan dari root project (nextjslms/):
       python scripts/fase2_auth_shell.py
"""

import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

files = {}

# ============================================================
# src/lib/api/auth.api.ts
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
# src/hooks/useAuth.ts
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
      setAuth(res.user, res.accessToken, res.refreshToken)
      // Connect socket setelah login
      const kelasId = undefined // akan diisi dari data siswa jika role SISWA
      connectSocket(res.user.id, kelasId)
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
      // ignore error, tetap logout lokal
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
# src/app/login/page.tsx
# ============================================================

files["src/app/login/page.tsx"] = """\
import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Login',
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Judul */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white text-2xl font-bold mb-2">
            M2
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            LMS MAN 2 Kota Makassar
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Masuk ke akun Anda untuk melanjutkan
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          <LoginForm />
        </div>

        <p className="text-center text-xs text-gray-400">
          © {new Date().getFullYear()} MAN 2 Kota Makassar
        </p>
      </div>
    </main>
  )
}
"""

# ============================================================
# src/components/auth/LoginForm.tsx
# ============================================================

files["src/components/auth/LoginForm.tsx"] = """\
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(1, 'Password wajib diisi')
    .min(6, 'Password minimal 6 karakter'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const { login, isLoading, error } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormData) => login(data)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Error global */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="nama@man2makassar.sch.id"
          {...register('email')}
          className="
            w-full rounded-xl border border-gray-300 dark:border-gray-700
            bg-white dark:bg-gray-800
            px-4 py-3 text-base text-gray-900 dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            outline-none transition
            focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
            disabled:opacity-50
          "
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
            className="
              w-full rounded-xl border border-gray-300 dark:border-gray-700
              bg-white dark:bg-gray-800
              px-4 py-3 pr-12 text-base text-gray-900 dark:text-white
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              outline-none transition
              focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
              disabled:opacity-50
            "
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition p-1"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="
          w-full flex items-center justify-center gap-2
          rounded-xl bg-emerald-600 hover:bg-emerald-700
          disabled:opacity-60 disabled:cursor-not-allowed
          px-4 py-3 text-base font-semibold text-white
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
        "
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <LogIn size={18} />
        )}
        {isLoading ? 'Masuk...' : 'Masuk'}
      </button>
    </form>
  )
}
"""

# ============================================================
# src/config/nav.config.ts  — nav items per role
# ============================================================

files["src/config/nav.config.ts"] = """\
import {
  LayoutDashboard, CalendarDays, BookOpen, ClipboardList,
  QrCode, FileText, Award, Users, DollarSign, CreditCard,
  Settings, BarChart3, Home, Bell, UserCircle, School,
  BookMarked, ShieldCheck, Calendar, Layers,
} from 'lucide-react'
import type { UserRole } from '@/types'

export interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles?: UserRole[]          // jika undefined → semua role
  children?: NavItem[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
  roles?: UserRole[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Utama',
    items: [
      { label: 'Dashboard',     href: '/dashboard',               icon: LayoutDashboard },
      { label: 'Notifikasi',    href: '/dashboard/notifikasi',    icon: Bell },
      { label: 'Profil Saya',   href: '/dashboard/profil',        icon: UserCircle },
    ],
  },
  {
    label: 'Akademik',
    items: [
      {
        label: 'Jadwal',
        href: '/dashboard/jadwal',
        icon: CalendarDays,
        roles: ['GURU', 'SISWA', 'WALI_KELAS', 'ADMIN', 'SUPER_ADMIN', 'WAKIL_KEPALA', 'KEPALA_SEKOLAH'],
      },
      {
        label: 'Materi',
        href: '/dashboard/materi',
        icon: BookOpen,
        roles: ['GURU', 'SISWA', 'ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Tugas',
        href: '/dashboard/tugas',
        icon: ClipboardList,
        roles: ['GURU', 'SISWA', 'ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Absensi',
        href: '/dashboard/absensi',
        icon: QrCode,
        roles: ['GURU', 'SISWA', 'WALI_KELAS', 'ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Penilaian',
        href: '/dashboard/penilaian',
        icon: FileText,
        roles: ['GURU', 'WALI_KELAS', 'ADMIN', 'SUPER_ADMIN'],
      },
    ],
  },
  {
    label: 'Operasional',
    items: [
      {
        label: 'Perizinan',
        href: '/dashboard/perizinan',
        icon: ShieldCheck,
        roles: ['GURU', 'SISWA', 'WALI_KELAS', 'ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Catatan Sikap',
        href: '/dashboard/sikap',
        icon: BookMarked,
        roles: ['GURU', 'WALI_KELAS', 'ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Prestasi',
        href: '/dashboard/prestasi',
        icon: Award,
        roles: ['GURU', 'SISWA', 'WALI_KELAS', 'ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Ekstrakurikuler',
        href: '/dashboard/ekskul',
        icon: Layers,
        roles: ['GURU', 'SISWA', 'ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Kalender',
        href: '/dashboard/kalender',
        icon: Calendar,
      },
    ],
  },
  {
    label: 'Keuangan',
    roles: ['SISWA', 'ORANG_TUA', 'STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN'],
    items: [
      {
        label: 'Tagihan',
        href: '/dashboard/tagihan',
        icon: DollarSign,
        roles: ['SISWA', 'ORANG_TUA', 'STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Pembayaran',
        href: '/dashboard/pembayaran',
        icon: CreditCard,
        roles: ['SISWA', 'ORANG_TUA', 'STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN'],
      },
    ],
  },
  {
    label: 'Manajemen',
    roles: ['ADMIN', 'SUPER_ADMIN', 'WALI_KELAS', 'WAKIL_KEPALA', 'KEPALA_SEKOLAH'],
    items: [
      {
        label: 'Kelas & Siswa',
        href: '/dashboard/kelas',
        icon: School,
        roles: ['ADMIN', 'SUPER_ADMIN', 'WALI_KELAS', 'GURU'],
      },
      {
        label: 'Pengguna',
        href: '/dashboard/users',
        icon: Users,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Tahun Ajaran',
        href: '/dashboard/tahun-ajaran',
        icon: Settings,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Mata Pelajaran',
        href: '/dashboard/mata-pelajaran-tingkat',
        icon: BookOpen,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Master Sikap',
        href: '/dashboard/master-sikap',
        icon: BookMarked,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Kategori Bayar',
        href: '/dashboard/kategori-pembayaran',
        icon: DollarSign,
        roles: ['ADMIN', 'SUPER_ADMIN', 'STAFF_KEUANGAN'],
      },
      {
        label: 'Pendaftaran Ulang',
        href: '/dashboard/pendaftaran-ulang',
        icon: ClipboardList,
        roles: ['ADMIN', 'SUPER_ADMIN', 'STAFF_TU'],
      },
    ],
  },
  {
    label: 'Laporan & CMS',
    roles: ['ADMIN', 'SUPER_ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA'],
    items: [
      {
        label: 'Report & EIS',
        href: '/dashboard/report',
        icon: BarChart3,
        roles: ['ADMIN', 'SUPER_ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA'],
      },
      {
        label: 'Homepage CMS',
        href: '/dashboard/homepage',
        icon: Home,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Pengumuman',
        href: '/dashboard/announcement',
        icon: Bell,
        roles: ['ADMIN', 'SUPER_ADMIN', 'GURU', 'WALI_KELAS'],
      },
    ],
  },
]

/** Filter nav groups berdasarkan role user */
export function getNavForRole(role: UserRole): NavGroup[] {
  return NAV_GROUPS
    .filter((g) => !g.roles || g.roles.includes(role))
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((g) => g.items.length > 0)
}
"""

# ============================================================
# src/components/dashboard/ThemeToggle.tsx
# ============================================================

files["src/components/dashboard/ThemeToggle.tsx"] = """\
'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-9 h-9" />

  const cycle = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
  const label = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'

  return (
    <button
      onClick={cycle}
      title={`Tema: ${label}`}
      className="
        flex items-center justify-center w-9 h-9 rounded-xl
        text-gray-500 dark:text-gray-400
        hover:bg-gray-100 dark:hover:bg-gray-800
        transition-colors
      "
    >
      <Icon size={18} />
    </button>
  )
}
"""

# ============================================================
# src/components/dashboard/NotificationBadge.tsx
# ============================================================

files["src/components/dashboard/NotificationBadge.tsx"] = """\
'use client'

import { Bell } from 'lucide-react'
import Link from 'next/link'
import { useNotificationStore } from '@/stores/notification.store'

export function NotificationBadge() {
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  return (
    <Link
      href="/dashboard/notifikasi"
      className="
        relative flex items-center justify-center w-9 h-9 rounded-xl
        text-gray-500 dark:text-gray-400
        hover:bg-gray-100 dark:hover:bg-gray-800
        transition-colors
      "
      title="Notifikasi"
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span className="
          absolute -top-0.5 -right-0.5
          min-w-[18px] h-[18px] px-1
          flex items-center justify-center
          rounded-full bg-red-500 text-white
          text-[10px] font-bold leading-none
        ">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
"""

# ============================================================
# src/components/dashboard/UserMenu.tsx
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
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  const fotoUrl = user.profile.foto ? getPublicFileUrl(user.profile.foto) : null
  const initials = getInitials(user.profile.nama)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
          {fotoUrl ? (
            <img src={fotoUrl} alt={user.profile.nama} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {initials}
            </span>
          )}
        </div>
        {/* Nama - hidden di mobile */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight max-w-[120px] truncate">
            {user.profile.nama}
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
              {user.profile.nama}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
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
# src/components/dashboard/Topbar.tsx
# ============================================================

files["src/components/dashboard/Topbar.tsx"] = """\
'use client'

import { Menu } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { NotificationBadge } from './NotificationBadge'
import { UserMenu } from './UserMenu'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="
      sticky top-0 z-40
      flex items-center justify-between
      h-16 px-4 gap-3
      bg-white/80 dark:bg-gray-900/80
      backdrop-blur-md
      border-b border-gray-200 dark:border-gray-800
    ">
      {/* Kiri: hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        className="
          lg:hidden flex items-center justify-center
          w-9 h-9 rounded-xl
          text-gray-500 dark:text-gray-400
          hover:bg-gray-100 dark:hover:bg-gray-800
          transition-colors
        "
        aria-label="Buka menu"
      >
        <Menu size={20} />
      </button>

      {/* Logo (mobile only, di tengah topbar) */}
      <div className="lg:hidden flex-1 text-center">
        <span className="text-sm font-bold text-emerald-600">LMS MAN 2</span>
      </div>

      {/* Kanan: actions */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationBadge />
        <UserMenu />
      </div>
    </header>
  )
}
"""

# ============================================================
# src/components/dashboard/Sidebar.tsx
# ============================================================

files["src/components/dashboard/Sidebar.tsx"] = """\
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { getNavForRole } from '@/config/nav.config'
import type { UserRole } from '@/types'

const STORAGE_KEY = 'lms-sidebar-collapsed'

export function Sidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const [collapsed, setCollapsed] = useState(false)

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) setCollapsed(saved === 'true')
  }, [])

  const toggleCollapse = () => {
    setCollapsed((v) => {
      const next = !v
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  const role = (user?.role ?? 'SISWA') as UserRole
  const navGroups = getNavForRole(role)

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(href)

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col',
        'h-screen sticky top-0',
        'bg-white dark:bg-gray-900',
        'border-r border-gray-200 dark:border-gray-800',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[240px]',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 h-16 px-4 border-b border-gray-200 dark:border-gray-200 flex-shrink-0',
        collapsed && 'justify-center px-0',
      )}>
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">M2</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight whitespace-nowrap">
              LMS MAN 2
            </p>
            <p className="text-[10px] text-gray-400 whitespace-nowrap">Kota Makassar</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            {/* Group label */}
            {!collapsed && (
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.label}
              </p>
            )}
            {collapsed && <div className="border-t border-gray-100 dark:border-gray-800 my-2 mx-1" />}

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                        'min-h-[44px]',
                        active
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                        collapsed && 'justify-center px-0',
                      )}
                    >
                      <Icon
                        size={18}
                        className={cn(
                          'flex-shrink-0',
                          active ? 'text-emerald-600 dark:text-emerald-400' : '',
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle button */}
      <div className="flex-shrink-0 p-2 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={toggleCollapse}
          className={cn(
            'flex items-center gap-2 w-full rounded-xl px-3 py-2.5 text-sm',
            'text-gray-500 dark:text-gray-400',
            'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
            collapsed && 'justify-center px-0',
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : (
            <>
              <ChevronLeft size={16} />
              <span className="text-xs">Ciutkan</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
"""

# ============================================================
# src/components/dashboard/MobileNav.tsx
# ============================================================

files["src/components/dashboard/MobileNav.tsx"] = """\
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarDays, ClipboardList,
  QrCode, Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotificationStore } from '@/stores/notification.store'

// 5 item paling penting untuk bottom nav mobile
const BOTTOM_NAV = [
  { label: 'Dashboard', href: '/dashboard',          icon: LayoutDashboard },
  { label: 'Jadwal',    href: '/dashboard/jadwal',   icon: CalendarDays },
  { label: 'Tugas',     href: '/dashboard/tugas',    icon: ClipboardList },
  { label: 'Absensi',   href: '/dashboard/absensi',  icon: QrCode },
  { label: 'Notif',     href: '/dashboard/notifikasi', icon: Bell },
]

export function MobileNav() {
  const pathname = usePathname()
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <nav className="
      lg:hidden fixed bottom-0 left-0 right-0 z-40
      flex items-center
      h-16 px-2
      bg-white/90 dark:bg-gray-900/90
      backdrop-blur-md
      border-t border-gray-200 dark:border-gray-800
      safe-area-pb
    ">
      {BOTTOM_NAV.map((item) => {
        const active = isActive(item.href)
        const Icon = item.icon
        const isNotif = item.href.includes('notifikasi')

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative flex-1 flex flex-col items-center justify-center gap-1 py-1',
              'min-h-[44px] rounded-xl transition-colors',
              active
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-gray-500 dark:text-gray-400',
            )}
          >
            <div className="relative">
              <Icon size={20} />
              {isNotif && unreadCount > 0 && (
                <span className="
                  absolute -top-1 -right-1
                  min-w-[14px] h-[14px] px-0.5
                  flex items-center justify-center
                  rounded-full bg-red-500 text-white
                  text-[9px] font-bold leading-none
                ">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
"""

# ============================================================
# src/components/dashboard/MobileDrawer.tsx
# ============================================================

files["src/components/dashboard/MobileDrawer.tsx"] = """\
'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { getNavForRole } from '@/config/nav.config'
import type { UserRole } from '@/types'

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)

  // Tutup drawer saat route berubah
  useEffect(() => { onClose() }, [pathname])

  // Lock scroll saat drawer terbuka
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const role = (user?.role ?? 'SISWA') as UserRole
  const navGroups = getNavForRole(role)

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 z-50 h-full w-72',
          'bg-white dark:bg-gray-900',
          'border-r border-gray-200 dark:border-gray-800',
          'transition-transform duration-300 ease-in-out',
          'flex flex-col',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">M2</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">LMS MAN 2</p>
              <p className="text-[10px] text-gray-400">Kota Makassar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]',
                          active
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                        )}
                      >
                        <Icon size={18} className="flex-shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
"""

# ============================================================
# src/components/dashboard/SocketInitializer.tsx
# ============================================================

files["src/components/dashboard/SocketInitializer.tsx"] = """\
'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket'

/**
 * Komponen ini mount setelah login, menghubungkan socket dan
 * mendengarkan event notifikasi realtime.
 * Tidak merender UI apapun.
 */
export function SocketInitializer() {
  const user = useAuthStore((s) => s.user)
  const { setSocket, incrementUnread } = useNotificationStore()

  useEffect(() => {
    if (!user) return

    const socket = connectSocket(user.id)
    setSocket(socket)

    socket.on('notifikasi:baru', () => {
      incrementUnread()
    })

    return () => {
      socket.off('notifikasi:baru')
      disconnectSocket()
      setSocket(null)
    }
  }, [user?.id])

  return null
}
"""

# ============================================================
# src/app/dashboard/layout.tsx
# ============================================================

files["src/app/dashboard/layout.tsx"] = """\
'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Topbar } from '@/components/dashboard/Topbar'
import { MobileNav } from '@/components/dashboard/MobileNav'
import { MobileDrawer } from '@/components/dashboard/MobileDrawer'
import { SocketInitializer } from '@/components/dashboard/SocketInitializer'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar desktop */}
      <Sidebar />

      {/* Drawer mobile */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Konten utama */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setDrawerOpen(true)} />

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6 p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Bottom nav mobile */}
      <MobileNav />

      {/* Socket connection */}
      <SocketInitializer />
    </div>
  )
}
"""

# ============================================================
# src/app/dashboard/page.tsx  — Dashboard home (per role)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Selamat datang, {user.profile.nama.split(' ')[0]}! 
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {ROLE_LABEL[user.role]} · LMS MAN 2 Kota Makassar
        </p>
      </div>

      {/* Placeholder cards — akan diganti konten per role di Fase berikutnya */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Dashboard aktif', value: '✅', desc: 'Shell berhasil dipasang' },
          { label: 'Role terdeteksi', value: user.role, desc: 'Akses menu sesuai role' },
          { label: 'Tema', value: 'dark/light', desc: 'Toggle di kanan atas' },
          { label: 'Notifikasi', value: 'Realtime', desc: 'Socket.IO terhubung' },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 space-y-2"
          >
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {card.label}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white truncate">{card.value}</p>
            <p className="text-xs text-gray-400">{card.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-400 text-center pt-4">
        Konten dashboard per role akan dibangun di Fase 4 🚧
      </p>
    </div>
  )
}
"""

# ============================================================
# WRITE FILES
# ============================================================

def write_files(files_dict: dict, base: str) -> None:
    print(f"📁 Base: {base}\n")
    for path, content in files_dict.items():
        full = os.path.join(base, path.replace("/", os.sep))
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  ✅ {path}")

    print(f"\n🎉 {len(files_dict)} file berhasil dibuat!")
    print("\n" + "=" * 60)
    print("📦 Install 1 dependency tambahan:")
    print("=" * 60)
    print("\n  npm install clsx\n")
    print("=" * 60)
    print("  npm run dev  →  http://localhost:3005")
    print("=" * 60)
    print("\n✅ FASE 2 selesai! Lanjut ke FASE 3 — Web Public (Landing Page)")
    print("=" * 60)

if __name__ == "__main__":
    print("🚀 FASE 2 — Auth & Shell Dashboard LMS MAN 2\n")
    write_files(files, BASE)