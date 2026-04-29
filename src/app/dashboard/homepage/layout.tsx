'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { Globe, Image, Newspaper, GalleryHorizontal, Sparkles, Menu } from 'lucide-react'

const TABS = [
  { label: 'Profil',   href: '/dashboard/homepage/profil',  icon: Globe },
  { label: 'Slider',   href: '/dashboard/homepage/slider',  icon: Image },
  { label: 'Berita',   href: '/dashboard/homepage/berita',  icon: Newspaper },
  { label: 'Galeri',   href: '/dashboard/homepage/galeri',  icon: GalleryHorizontal },
  { label: 'Fitur',    href: '/dashboard/homepage/fitur',   icon: Sparkles },
  { label: 'Menu Nav', href: '/dashboard/homepage/menu',    icon: Menu },
]

// Role yang boleh write (create/edit/delete)
const WRITE_ROLES = new Set([
  'SUPER_ADMIN', 'ADMIN', 'STAFF_TU',
])

export default function HomepageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const user     = useAuthStore((s) => s.user)

  // Guard: hanya role yang diizinkan
  const allowedRoles = new Set([
    'SUPER_ADMIN', 'ADMIN', 'STAFF_TU', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA',
  ])
  if (user && !allowedRoles.has(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Anda tidak memiliki akses ke halaman ini.
        </p>
      </div>
    )
  }

  const canWrite = user ? WRITE_ROLES.has(user.role) : false

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Homepage CMS</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Kelola konten halaman publik madrasah
          {!canWrite && (
            <span className="ml-2 text-amber-500 dark:text-amber-400 text-xs">(Mode baca)</span>
          )}
        </p>
      </div>

      {/* Tab navigasi */}
      <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
        <div className="flex gap-1 min-w-max border-b border-gray-200 dark:border-gray-700 pb-0">
          {TABS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap border-b-2 -mb-px',
                  active
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                )}
              >
                <Icon size={15} className="shrink-0" />
                {label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Konten halaman */}
      <div>{children}</div>
    </div>
  )
}
