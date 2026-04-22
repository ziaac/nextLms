import type { StatusMateri } from '@/types/materi-pelajaran.types'
import { getStatusMateri }   from '@/types/materi-pelajaran.types'
import type { MateriItem }   from '@/types/materi-pelajaran.types'

const CONFIG: Record<StatusMateri, { label: string; className: string }> = {
  DRAFT: {
    label:     'Draft',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
  DIJADWALKAN: {
    label:     'Dijadwalkan',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  TERPUBLIKASI: {
    label:     'Terpublikasi',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
}

interface Props {
  item?:   Pick<MateriItem, 'isPublished' | 'tanggalPublikasi'>
  status?: StatusMateri
}

export function MateriStatusBadge({ item, status }: Props) {
  const s   = status ?? (item ? getStatusMateri(item) : 'DRAFT')
  const cfg = CONFIG[s]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
