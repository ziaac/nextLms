'use client'

import { useState } from 'react'
import { Pin, Calendar, User, ChevronDown, ChevronUp } from 'lucide-react'
import { formatTanggalLengkap } from '@/lib/helpers/timezone'
import { PRIORITY_COLOR, PRIORITY_LABEL } from '@/types/announcement.types'
import type { Announcement } from '@/types/announcement.types'

interface Props {
  announcements: Announcement[]
}

export function PengumumanPublikContent({ announcements }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  // Pisahkan pinned dan non-pinned
  const pinned = announcements.filter((a) => a.isPinned)
  const regular = announcements.filter((a) => !a.isPinned)

  if (announcements.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Belum Ada Pengumuman
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Saat ini tidak ada pengumuman aktif yang tersedia.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Pinned announcements */}
      {pinned.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Pin size={18} className="text-red-600 dark:text-red-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Pengumuman Penting
            </h2>
          </div>
          <div className="space-y-3">
            {pinned.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                isExpanded={expandedId === announcement.id}
                onToggle={() => toggleExpand(announcement.id)}
                isPinned
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular announcements */}
      {regular.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Pengumuman Lainnya
            </h2>
          )}
          <div className="space-y-3">
            {regular.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                isExpanded={expandedId === announcement.id}
                onToggle={() => toggleExpand(announcement.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface CardProps {
  announcement: Announcement
  isExpanded: boolean
  onToggle: () => void
  isPinned?: boolean
}

function AnnouncementCard({ announcement, isExpanded, onToggle, isPinned }: CardProps) {
  const creatorName = announcement.createdByUser?.profile?.namaLengkap || 'Admin'

  return (
    <article
      className={`rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border transition-all ${
        isPinned
          ? 'border-red-200 dark:border-red-800 shadow-md'
          : 'border-gray-200 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800'
      }`}
    >
      {/* Header - Always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title with pin icon */}
            <div className="flex items-start gap-2 mb-2">
              {isPinned && (
                <Pin size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-1" />
              )}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
                {announcement.judul}
              </h3>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              {/* Priority badge */}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  PRIORITY_COLOR[announcement.priority]
                }`}
              >
                {PRIORITY_LABEL[announcement.priority]}
              </span>

              {/* Date */}
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {formatTanggalLengkap(announcement.startDate)}
              </span>

              {/* Creator */}
              <span className="flex items-center gap-1.5">
                <User size={14} />
                {creatorName}
              </span>
            </div>
          </div>

          {/* Expand/collapse icon */}
          <div className="shrink-0 mt-1">
            {isExpanded ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {/* Content - Expandable */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800">
          <div
            className="prose prose-sm dark:prose-invert max-w-none mt-4"
            dangerouslySetInnerHTML={{ __html: announcement.konten }}
          />

          {/* End date if exists */}
          {announcement.endDate && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Berlaku hingga: {formatTanggalLengkap(announcement.endDate)}
              </p>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
