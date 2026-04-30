'use client'

import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getTipeIcon, getTipeLabel } from '@/components/dashboard/notifikasi-utils'
import { useMarkAsRead, useRemoveNotifikasi } from '@/hooks/notifikasi'
import { formatTanggalLengkap } from '@/lib/helpers/timezone'
import type { NotifikasiItem as NotifikasiItemType } from '@/types/notifikasi.types'

interface NotifikasiItemProps {
  item: NotifikasiItemType
}

export function NotifikasiItem({ item }: NotifikasiItemProps) {
  const router = useRouter()
  const markAsRead = useMarkAsRead()
  const removeNotifikasi = useRemoveNotifikasi()

  const handleClick = () => {
    if (!item.isRead) {
      markAsRead.mutate(item.id)
    }
    if (item.actionUrl) {
      router.push(item.actionUrl)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeNotifikasi.mutate(item.id, {
      onError: () => toast.error('Gagal menghapus notifikasi'),
    })
  }

  return (
    <div
      className={`
        group flex gap-3 p-4 rounded-xl border transition-colors cursor-pointer
        ${item.isRead
          ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60'
          : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/20'
        }
      `}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Ikon tipe atau gambar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className="w-full h-full object-contain p-1"
          />
        ) : (
          getTipeIcon(item.tipe)
        )}
      </div>

      {/* Konten */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-sm leading-snug ${!item.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                {item.judul}
              </p>
              {!item.isRead && (
                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
              {item.pesan}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                {getTipeLabel(item.tipe)}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-600">
                {formatTanggalLengkap(item.createdAt)}
              </span>
            </div>
          </div>

          {/* Tombol hapus */}
          <button
            onClick={handleDelete}
            disabled={removeNotifikasi.isPending}
            className="
              opacity-0 group-hover:opacity-100
              flex-shrink-0 w-7 h-7 rounded-lg
              flex items-center justify-center
              text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
              transition-all disabled:opacity-30
            "
            aria-label="Hapus notifikasi"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
