
import { TujuanTugas, BentukTugas, StatusPengumpulan } from '@/types/tugas.types'

export function TujuanBadge({ tujuan }: { tujuan: TujuanTugas }) {
  const mapping: Record<TujuanTugas, { label: string; color: string }> = {
    [TujuanTugas.TUGAS_HARIAN]: { label: 'Tugas Harian', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    [TujuanTugas.PENGAYAAN]:    { label: 'Pengayaan', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    [TujuanTugas.REMEDIAL]:     { label: 'Remedial', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    [TujuanTugas.PROYEK]:       { label: 'Proyek', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    [TujuanTugas.UTS]:          { label: 'UTS', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
    [TujuanTugas.UAS]:          { label: 'UAS', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
    [TujuanTugas.PORTOFOLIO]:   { label: 'Portofolio', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
    [TujuanTugas.PRAKTIKUM]:    { label: 'Praktikum', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
    [TujuanTugas.LAINNYA]:      { label: 'Lainnya', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  }

  const { label, color } = mapping[tujuan] || mapping[TujuanTugas.LAINNYA]

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${color}`}>
      {label}
    </span>
  )
}

export function BentukBadge({ bentuk }: { bentuk: BentukTugas }) {
  const mapping: Record<BentukTugas, { label: string; color: string }> = {
    [BentukTugas.FILE_SUBMISSION]:      { label: 'File Upload', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    [BentukTugas.RICH_TEXT]:            { label: 'Ketik Langsung', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    [BentukTugas.HYBRID]:               { label: 'Hybrid', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    [BentukTugas.QUIZ_MULTIPLE_CHOICE]: { label: 'Quiz (PG)', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    [BentukTugas.QUIZ_MIX]:             { label: 'Quiz (Mix)', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  }

  const { label, color } = mapping[bentuk] || mapping[BentukTugas.FILE_SUBMISSION]

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${color}`}>
      {label}
    </span>
  )
}

export function StatusPengumpulanBadge({ status, isLate }: { status: StatusPengumpulan, isLate?: boolean }) {
  const mapping: Record<StatusPengumpulan, { label: string; color: string }> = {
    [StatusPengumpulan.DRAFT]:     { label: 'Draft', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    [StatusPengumpulan.SUBMITTED]: { label: 'Dikumpulkan', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    [StatusPengumpulan.DINILAI]:   { label: 'Dinilai', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    [StatusPengumpulan.REVISI]:    { label: 'Revisi', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  }

  const { label, color } = mapping[status] || mapping[StatusPengumpulan.DRAFT]

  return (
    <div className="flex gap-1 items-center flex-wrap">
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${color}`}>
        {label}
      </span>
      {isLate && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Terlambat
        </span>
      )}
    </div>
  )
}
