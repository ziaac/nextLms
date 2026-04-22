'use client'

import { Select } from '@/components/ui'
import type { StatusPerizinan, JenisPerizinan } from '@/types/enums'

const STATUS_OPTIONS = [
  { label: 'Semua Status', value: '' },
  { label: 'Menunggu',     value: 'PENDING'  },
  { label: 'Disetujui',    value: 'APPROVED' },
  { label: 'Ditolak',      value: 'REJECTED' },
]

const JENIS_OPTIONS = [
  { label: 'Semua Jenis',      value: '' },
  { label: 'Sakit',            value: 'SAKIT' },
  { label: 'Izin',             value: 'IZIN'  },
  { label: 'Cuti',             value: 'CUTI'  },
  { label: 'Dinas',            value: 'DINAS' },
  { label: 'Keperluan Keluarga', value: 'KEPERLUAN_KELUARGA' },
]

interface Props {
  status:          StatusPerizinan | ''
  jenis:           JenisPerizinan  | ''
  tanggalMulai:    string
  tanggalSelesai:  string
  onStatusChange:  (v: StatusPerizinan | '') => void
  onJenisChange:   (v: JenisPerizinan  | '') => void
  onTglMulaiChange:  (v: string) => void
  onTglSelesaiChange: (v: string) => void
}

export function PerizinanFilterBar({
  status, jenis, tanggalMulai, tanggalSelesai,
  onStatusChange, onJenisChange,
  onTglMulaiChange, onTglSelesaiChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => onStatusChange(e.target.value as StatusPerizinan | '')}
          className="w-36"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Jenis</label>
        <Select
          options={JENIS_OPTIONS}
          value={jenis}
          onChange={(e) => onJenisChange(e.target.value as JenisPerizinan | '')}
          className="w-44"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Dari Tanggal</label>
        <input
          type="date"
          value={tanggalMulai}
          onChange={(e) => onTglMulaiChange(e.target.value)}
          className="h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Sampai Tanggal</label>
        <input
          type="date"
          value={tanggalSelesai}
          onChange={(e) => onTglSelesaiChange(e.target.value)}
          className="h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
    </div>
  )
}
