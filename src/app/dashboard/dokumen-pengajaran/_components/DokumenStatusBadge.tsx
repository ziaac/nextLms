'use client'

import type { JenisDokumen, StatusDokumenPengajaran } from '@/types/enums'

const STATUS_MAP: Record<StatusDokumenPengajaran, { label: string; className: string }> = {
  DRAFT:              { label: 'Draft',        className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  SUBMITTED:          { label: 'Diajukan',     className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  APPROVED:           { label: 'Disetujui',    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  REVISION_REQUESTED: { label: 'Perlu Revisi', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
}

const JENIS_MAP: Record<JenisDokumen, { label: string; className: string }> = {
  CP:                     { label: 'CP',                   className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  ATP:                    { label: 'ATP',                  className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  MODUL_AJAR_RPP:         { label: 'Modul Ajar / RPP',    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  MODUL_PROJEK_P5:        { label: 'Modul Projek P5',     className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  KKTP:                   { label: 'KKTP',                className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  RINCIAN_MINGGU_EFEKTIF: { label: 'Rincian Minggu Efektif', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  BUKU_PEGANGAN:          { label: 'Buku Pegangan',       className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  LAINNYA:                { label: 'Lainnya',             className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

export function DokumenStatusBadge({ status }: { status: StatusDokumenPengajaran }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.SUBMITTED
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

export function DokumenJenisBadge({ jenis }: { jenis: JenisDokumen }) {
  const cfg = JENIS_MAP[jenis] ?? JENIS_MAP.LAINNYA
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
