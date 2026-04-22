'use client'

import { Menu } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { NotificationBadge } from './NotificationBadge'
import { UserMenu } from './UserMenu'

interface TopbarProps { onMenuClick: () => void }

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="
      sticky top-0 z-40 flex items-center justify-between
      h-16 px-4 gap-3
      bg-white/80 dark:bg-gray-900/80 backdrop-blur-md
      border-b border-gray-200/60 dark:border-gray-200
    ">
      <button
        onClick={onMenuClick}
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Buka menu"
      >
        <Menu size={20} />
      </button>

      <div className="lg:hidden flex-1 text-center">
        <span className="text-sm font-bold text-emerald-600">LMS MAN 2</span>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationBadge />
        <UserMenu />
      </div>
    </header>
  )
}
