'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarDays, ClipboardList,
  QrCode, Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
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
  const user = useAuthStore((s) => s.user)

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

        // ── Dynamic Mapping untuk Mobile Nav ──
        if (item.label === 'Absensi') {
          if (user?.role === 'GURU' || user?.role === 'WALI_KELAS') href = '/dashboard/absensi/guru'
          else if (user?.role === 'SISWA') href = '/dashboard/absensi/siswa'
          else href = '/dashboard/absensi/manajemen'
        }
        if (item.label === 'Jadwal') {
          if (user?.role === 'GURU' || user?.role === 'WALI_KELAS') {
            href = user.isWaliKelas ? '/dashboard/jadwal/wali-kelas' : '/dashboard/jadwal/guru'
          }
          else if (user?.role === 'SISWA') href = '/dashboard/jadwal/kelas'
          else href = '/dashboard/jadwal/manajemen'
        }
        if (item.label === 'Kelas & Siswa') {
          if (user?.role === 'GURU' || user?.role === 'WALI_KELAS') {
            href = '/dashboard/kelas-belajar/guru'
          }
        }

        const active = isActive(href)
        const Icon = item.icon
        const isNotif = item.href.includes('notifikasi')

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
