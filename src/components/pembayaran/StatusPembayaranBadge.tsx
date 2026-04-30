'use client'

import { Badge } from '@/components/ui'
import type { StatusPembayaran } from '@/types/enums'

interface StatusPembayaranBadgeProps {
  status: StatusPembayaran
}

const STATUS_CONFIG: Record<
  StatusPembayaran,
  { variant: 'warning' | 'success' | 'danger'; label: string }
> = {
  PENDING: { variant: 'warning', label: 'Pending' },
  VERIFIED: { variant: 'success', label: 'Terverifikasi' },
  REJECTED: { variant: 'danger', label: 'Ditolak' },
}

export function StatusPembayaranBadge({ status }: StatusPembayaranBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span data-status={status} aria-label={`Status pembayaran: ${config.label}`}>
      <Badge variant={config.variant}>{config.label}</Badge>
    </span>
  )
}
