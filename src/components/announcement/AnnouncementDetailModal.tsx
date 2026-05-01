'use client'

import { Modal, Button, Skeleton } from '@/components/ui'
import { formatTanggalLengkap } from '@/lib/helpers/timezone'
import { useAnnouncementDetail } from '@/hooks/announcement'
import { AnnouncementPriorityBadge } from './AnnouncementPriorityBadge'

interface AnnouncementDetailModalProps {
  open: boolean
  onClose: () => void
  announcementId: string | null
}

export function AnnouncementDetailModal({ open, onClose, announcementId }: AnnouncementDetailModalProps) {
  const { data: announcement, isLoading } = useAnnouncementDetail(announcementId)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={announcement?.judul ?? 'Detail Pengumuman'}
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose} type="button">
          Tutup
        </Button>
      }
    >
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : announcement ? (
          <div className="space-y-4">
            {/* Prioritas & meta */}
            <div className="flex flex-wrap items-center gap-2">
              <AnnouncementPriorityBadge priority={announcement.priority} />
              {announcement.isPinned && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">📌 Disematkan</span>
              )}
            </div>

            {/* Meta info */}
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p>
                Oleh:{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {announcement.createdByUser.profile?.namaLengkap ?? 'Unknown'}
                </span>
              </p>
              <p>
                Dibuat:{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {formatTanggalLengkap(announcement.createdAt)}
                </span>
              </p>
              <p>
                Berlaku:{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {formatTanggalLengkap(announcement.startDate)}
                  {announcement.endDate
                    ? ` — ${formatTanggalLengkap(announcement.endDate)}`
                    : ' (tidak ada batas)'}
                </span>
              </p>
            </div>

            {/* Konten rich-text */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: announcement.konten }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
