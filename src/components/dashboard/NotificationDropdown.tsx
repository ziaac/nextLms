'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, Check, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui'
import { useNotifikasi, useMarkAsRead, useMarkAllAsRead } from '@/hooks/notifikasi'
import { formatTanggalLengkap } from '@/lib/helpers/timezone'
import { getTipeIcon } from './notifikasi-utils'

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useNotifikasi({ limit: 5, page: 1 })
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const notifikasi = data?.data ?? []

  const handleItemClick = async (id: string, actionUrl: string | null) => {
    onClose()
    if (!markAsRead.isPending) {
      markAsRead.mutate(id)
    }
    if (actionUrl) {
      router.push(actionUrl)
    }
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate()
  }

  return (
    <div
      ref={ref}
      className="
        absolute right-0 top-full mt-2 w-80 z-50
        bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-700
        rounded-2xl shadow-xl overflow-hidden
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Notifikasi
          </span>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          disabled={markAllAsRead.isPending}
          className="
            flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400
            hover:text-blue-700 dark:hover:text-blue-300
            disabled:opacity-50 transition-colors
          "
        >
          <Check size={12} />
          Tandai semua dibaca
        </button>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifikasi.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-600">
            <Bell size={32} className="mb-2 opacity-40" />
            <p className="text-sm">Tidak ada notifikasi</p>
          </div>
        ) : (
          <ul>
            {notifikasi.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleItemClick(item.id, item.actionUrl)}
                  className={`
                    w-full text-left px-4 py-3 flex gap-3 items-start
                    hover:bg-gray-50 dark:hover:bg-gray-800/60
                    transition-colors border-b border-gray-50 dark:border-gray-800/50
                    last:border-b-0
                    ${!item.isRead ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}
                  `}
                >
                  {/* Ikon tipe atau gambar */}
                  <span className="text-lg flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-full h-full object-contain p-0.5"
                      />
                    ) : (
                      getTipeIcon(item.tipe)
                    )}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug truncate ${!item.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                        {item.judul}
                      </p>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {item.pesan}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">
                      {formatTanggalLengkap(item.createdAt)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800">
        <Link
          href="/dashboard/notifikasi"
          onClick={onClose}
          className="
            block text-center text-xs font-medium
            text-blue-600 dark:text-blue-400
            hover:text-blue-700 dark:hover:text-blue-300
            transition-colors
          "
        >
          Lihat semua notifikasi →
        </Link>
      </div>
    </div>
  )
}
