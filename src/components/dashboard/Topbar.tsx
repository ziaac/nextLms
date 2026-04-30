'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { NotificationBadge } from './NotificationBadge'
import { NotificationDropdown } from './NotificationDropdown'
import { UserMenu } from './UserMenu'

interface TopbarProps { onMenuClick: () => void }

export function Topbar({ onMenuClick }: TopbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  return (
    <header className="
      sticky top-0 z-40 flex items-center justify-between
      h-16 px-4 gap-3
      bg-white/80 dark:bg-gray-900/80 backdrop-blur-md
      border-b border-gray-200/60 dark:border-gray-700/60
    ">
      <button
        onClick={onMenuClick}
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Buka menu"
      >
        <Menu size={20} />
      </button>

      <div className="lg:hidden flex-1 flex items-center justify-center gap-2.5">
        <img
          src="https://storagelms.man2kotamakassar.sch.id/static-assets/static_logoman-150h.png"
          alt="Logo MAN 2"
          className="h-8 w-auto object-contain flex-shrink-0"
        />
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">LMS MAN 2</p>
          <p className="text-[10px] text-gray-400">Kota Makassar</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        {/* Wrapper relative untuk positioning dropdown */}
        <div className="relative">
          <NotificationBadge
            onClick={() => setIsDropdownOpen((prev) => !prev)}
          />
          <NotificationDropdown
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
          />
        </div>
        <UserMenu />
      </div>
    </header>
  )
}
