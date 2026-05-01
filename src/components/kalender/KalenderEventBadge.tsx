import { TIPE_KALENDER_COLOR, TIPE_KALENDER_LABEL } from '@/types/kalender-akademik.types'
import type { TipeKalender } from '@/types/kalender-akademik.types'

interface KalenderEventBadgeProps {
  tipe: TipeKalender
  isLibur?: boolean
  size?: 'sm' | 'md'
}

export function KalenderEventBadge({ tipe, isLibur, size = 'md' }: KalenderEventBadgeProps) {
  const colorClass = TIPE_KALENDER_COLOR[tipe]
  const label = TIPE_KALENDER_LABEL[tipe]
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${colorClass} ${sizeClass}`}
    >
      {isLibur && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  )
}
