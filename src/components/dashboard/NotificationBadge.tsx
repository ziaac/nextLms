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
