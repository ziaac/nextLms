'use client'

import { Pin, Pencil, Trash2 } from 'lucide-react'
import { formatTanggalLengkap } from '@/lib/helpers/timezone'
import { AnnouncementPriorityBadge } from './AnnouncementPriorityBadge'
import type { Announcement } from '@/types/announcement.types'

interface AnnouncementCardProps {
  item: Announcement
  canEdit: boolean
  canDelete: boolean
  onDetailClick: (item: Announcement) => void
  onEditClick: (item: Announcement) => void
  onDeleteClick: (item: Announcement) => void
}

export function AnnouncementCard({
  item,
  canEdit,
  canDelete,
  onDetailClick,
  onEditClick,
  onDeleteClick,
}: AnnouncementCardProps) {
  return (
    <div
      className={`relative rounded-xl border bg-white dark:bg-gray-900 p-4 shadow-sm transition-shadow hover:shadow-md ${
        item.isPinned
          ? 'border-blue-200 dark:border-blue-800/50'
          : 'border-gray-200 dark:border-gray-800'
      }`}
    >
      {/* Pin indicator */}
      {item.isPinned && (
        <div className="absolute right-3 top-3 text-blue-500 dark:text-blue-400">
          <Pin className="h-4 w-4 fill-current" aria-label="Disematkan" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 pr-6">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onDetailClick(item)}
            className="w-full text-left"
          >
            <h3 className="line-clamp-2 font-semibold text-gray-900 transition-colors hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
              {item.judul}
            </h3>
          </button>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <AnnouncementPriorityBadge priority={item.priority} size="sm" />
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatTanggalLengkap(item.createdAt)}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              oleh {item.createdByUser.profile?.namaLengkap ?? 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {(canEdit || canDelete) && (
        <div className="mt-3 flex items-center justify-end gap-1 border-t border-gray-100 pt-2 dark:border-gray-800">
          {canEdit && (
            <button
              type="button"
              onClick={() => onEditClick(item)}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
              aria-label={`Edit ${item.judul}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDeleteClick(item)}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
              aria-label={`Hapus ${item.judul}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
