import { PRIORITY_COLOR, PRIORITY_LABEL } from '@/types/announcement.types'
import type { AnnouncementPriority } from '@/types/announcement.types'

interface AnnouncementPriorityBadgeProps {
  priority: AnnouncementPriority
  size?: 'sm' | 'md'
}

export function AnnouncementPriorityBadge({ priority, size = 'md' }: AnnouncementPriorityBadgeProps) {
  const colorClass = PRIORITY_COLOR[priority]
  const label = PRIORITY_LABEL[priority]
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClass}`}>
      {label}
    </span>
  )
}
