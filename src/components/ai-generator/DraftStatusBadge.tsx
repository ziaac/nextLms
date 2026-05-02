'use client'

import { Badge } from '@/components/ui'
import type { StatusDraftAI } from '@/types/ai-generator.types'

const STATUS_VARIANT: Record<StatusDraftAI, 'warning' | 'info' | 'success' | 'danger' | 'default'> = {
  PENDING:    'warning',
  PROCESSING: 'info',
  COMPLETED:  'success',
  FAILED:     'danger',
  SAVED:      'default',
}

const STATUS_LABEL: Record<StatusDraftAI, string> = {
  PENDING:    'Menunggu',
  PROCESSING: 'Memproses',
  COMPLETED:  'Selesai',
  FAILED:     'Gagal',
  SAVED:      'Tersimpan',
}

export function DraftStatusBadge({ status }: { status: StatusDraftAI }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
}
