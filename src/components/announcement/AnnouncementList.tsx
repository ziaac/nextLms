'use client'

import { Skeleton, EmptyState } from '@/components/ui'
import { AnnouncementCard } from './AnnouncementCard'
import type { Announcement } from '@/types/announcement.types'

interface AnnouncementListProps {
  items: Announcement[]
  isLoading: boolean
  canEdit: boolean
  canDelete: boolean
  onEditClick: (item: Announcement) => void
  onDeleteClick: (item: Announcement) => void
  onDetailClick: (item: Announcement) => void
}

export function AnnouncementList({
  items,
  isLoading,
  canEdit,
  canDelete,
  onEditClick,
  onDeleteClick,
  onDetailClick,
}: AnnouncementListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Belum ada pengumuman"
        description="Pengumuman akan muncul di sini."
      />
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <AnnouncementCard
          key={item.id}
          item={item}
          canEdit={canEdit}
          canDelete={canDelete}
          onDetailClick={onDetailClick}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
        />
      ))}
    </div>
  )
}
