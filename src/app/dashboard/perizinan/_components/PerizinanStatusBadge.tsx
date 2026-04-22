import type { StatusPerizinan, JenisPerizinan } from '@/types/enums'

const STATUS_CONFIG: Record<StatusPerizinan, { label: string; className: string }> = {
  PENDING:            { label: 'Menunggu',      className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800' },
  APPROVED:           { label: 'Disetujui',     className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' },
  REJECTED:           { label: 'Ditolak',       className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' },
  REVISION_REQUESTED: { label: 'Perlu Revisi',  className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' },
}

const JENIS_CONFIG: Record<JenisPerizinan, { label: string; className: string }> = {
  SAKIT:              { label: 'Sakit',          className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300' },
  IZIN:               { label: 'Izin',           className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300' },
  CUTI:               { label: 'Cuti',           className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300' },
  DINAS:              { label: 'Dinas',          className: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300' },
  KEPERLUAN_KELUARGA: { label: 'Kep. Keluarga', className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300' },
}

export function PerizinanStatusBadge({ status }: { status: StatusPerizinan }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={[
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
      cfg.className,
    ].join(' ')}>
      {cfg.label}
    </span>
  )
}

export function PerizinanJenisBadge({ jenis }: { jenis: JenisPerizinan }) {
  const cfg = JENIS_CONFIG[jenis]
  return (
    <span className={[
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
      cfg.className,
    ].join(' ')}>
      {cfg.label}
    </span>
  )
}
