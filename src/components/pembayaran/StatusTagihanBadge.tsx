'use client'

import { Badge } from '@/components/ui'
import type { StatusTagihan } from '@/types/enums'

interface StatusTagihanBadgeProps {
  status: StatusTagihan
}

const STATUS_CONFIG: Record<
  StatusTagihan,
  { variant: 'danger' | 'warning' | 'success' | 'default'; label: string; isOrange?: boolean }
> = {
  BELUM_BAYAR: { variant: 'danger', label: 'Belum Bayar' },
  CICILAN: { variant: 'warning', label: 'Cicilan' },
  LUNAS: { variant: 'success', label: 'Lunas' },
  TERLAMBAT: { variant: 'default', label: 'Terlambat', isOrange: true },
}

export function StatusTagihanBadge({ status }: StatusTagihanBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span data-status={status} aria-label={`Status tagihan: ${config.label}`}>
      <Badge
        variant={config.variant}
        className={
          config.isOrange
            ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
            : undefined
        }
      >
        {config.label}
      </Badge>
    </span>
  )
}
