'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, ClipboardList,
  QrCode, ListTodo,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'

// Dashboard | Materi | Tugas | Absensi | ToDo
const BOTTOM_NAV = [
  { label: 'Dashboard', href: '/dashboard',                icon: LayoutDashboard },
  { label: 'Materi',    href: '/dashboard/materi-pelajaran', icon: BookOpen },
  { label: 'Tugas',     href: '/dashboard/tugas',          icon: ClipboardList },
  { label: 'Absensi',   href: '/dashboard/absensi',        icon: QrCode },
  { label: 'ToDo',      href: '/dashboard/todo',           icon: ListTodo },
]

export function MobileNav() {
  const pathname = usePathname()
  const user     = useAuthStore((s) => s.user)

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
        let href = item.href

        // ── Dynamic routing per role ──
        if (item.label === 'Absensi') {
          if (user?.role === 'GURU' || user?.role === 'WALI_KELAS') href = '/dashboard/absensi/guru'
          else if (user?.role === 'SISWA') href = '/dashboard/jadwal/kelas'
          else href = '/dashboard/absensi/manajemen'
        }

        const active = isActive(href)
        const Icon   = item.icon

        return (
          <Link
            key={item.label}
            href={href}
            className={cn(
              'relative flex-1 flex flex-col items-center justify-center gap-1 py-1',
              'min-h-[44px] rounded-xl transition-colors',
              active
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-gray-500 dark:text-gray-400',
            )}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
