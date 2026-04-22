'use client'

import { Select } from '@/components/ui'

interface TaOption   { id: string; nama: string }
interface SmtOption  { id: string; nama: string; isActive: boolean }
interface TingkatOpt { id: string; nama: string }

interface Props {
  taList:             TaOption[]
  selectedTaId:       string
  onTaChange:         (id: string) => void
  semesterList:       SmtOption[]
  selectedSemesterId: string
  onSemesterChange:   (id: string) => void
  tingkatList:        TingkatOpt[]
  selectedTingkatId:  string
  onTingkatChange:    (id: string) => void
}

export function JadwalFilterBar({
  taList, selectedTaId, onTaChange,
  semesterList, selectedSemesterId, onSemesterChange,
  tingkatList, selectedTingkatId, onTingkatChange,
}: Props) {
  const taOptions = [
    { label: '— Pilih Tahun Ajaran —', value: '' },
    ...taList.map((t) => ({ label: t.nama, value: t.id })),
  ]

  const smtOptions = [
    { label: '— Pilih Semester —', value: '' },
    ...semesterList.map((s) => ({
      label: s.nama + (s.isActive ? ' ✓ Aktif' : ''),
      value: s.id,
    })),
  ]

  const tingkatOptions = [
    { label: 'Semua Tingkat', value: '' },
    ...tingkatList.map((t) => ({ label: 'Kelas ' + t.nama, value: t.id })),
  ]

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Tahun Ajaran */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Tahun Ajaran
        </label>
        <Select
          options={taOptions}
          value={selectedTaId}
          onChange={(e) => onTaChange(e.target.value)}
          className="w-40"
        />
      </div>

      {/* Semester */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Semester
        </label>
        <Select
          options={smtOptions}
          value={selectedSemesterId}
          onChange={(e) => onSemesterChange(e.target.value)}
          className="w-52"
          disabled={!selectedTaId || semesterList.length === 0}
        />
      </div>

      {/* Tingkat */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Tingkat
        </label>
        <Select
          options={tingkatOptions}
          value={selectedTingkatId}
          onChange={(e) => onTingkatChange(e.target.value)}
          className="w-44"
          disabled={!selectedSemesterId}
        />
      </div>
    </div>
  )
}
