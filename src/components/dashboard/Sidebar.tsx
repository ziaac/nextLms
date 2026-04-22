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

  const navGroups = getNavForRole(user)

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <aside className={cn(
      'hidden lg:flex flex-col h-screen sticky top-0 relative flex-shrink-0',
      'bg-white dark:bg-gray-900',
      'border-r border-gray-200/60 dark:border-gray-700/60',
      'transition-all duration-300 ease-in-out',
      collapsed ? 'w-[68px]' : 'w-[240px]',
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 h-16 px-4',
        'border-b border-gray-200/60 dark:border-gray-700/60 flex-shrink-0',
        collapsed && 'justify-center px-0',
      )}>
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">M2</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight whitespace-nowrap">LMS MAN 2</p>
            <p className="text-[10px] text-gray-400 whitespace-nowrap">Kota Makassar</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.label}
              </p>
            )}
            {collapsed && <div className="border-t border-gray-200/40 dark:border-gray-700/40 my-2 mx-1" />}

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
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]',
                        active
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                        collapsed && 'justify-center px-0',
                      )}
                    >
                      <Icon size={18} className={cn('flex-shrink-0', active ? 'text-emerald-600 dark:text-emerald-400' : '')} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Floating collapse toggle — di tepi kanan sidebar */}
      <button
        onClick={toggleCollapse}
        title={collapsed ? 'Buka menu' : 'Ciutkan menu'}
        className={cn(
          'absolute -right-3 top-[72px] z-10',
          'h-6 w-6 rounded-full',
          'bg-white dark:bg-gray-900',
          'border border-gray-200 dark:border-gray-700',
          'shadow-sm',
          'flex items-center justify-center',
          'text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400',
          'hover:border-emerald-300 dark:hover:border-emerald-700',
          'transition-colors',
        )}
      >
        {collapsed
          ? <ChevronRight size={12} />
          : <ChevronLeft size={12} />
        }
      </button>
    </aside>
  )
}
