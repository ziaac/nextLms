'use client'

import { useMemo } from 'react'
import { Select, SearchInput } from '@/components/ui'
import type { SemesterSingkat } from '@/types/akademik.types'

interface KelasOption   { id: string; namaKelas: string }
interface TahunAjaranOption { id: string; nama: string }

interface Props {
  // Data dropdown
  semesterList:    SemesterSingkat[]
  kelasList:       KelasOption[]
  tahunAjaranList: TahunAjaranOption[]

  // Nilai filter
  semesterId:    string
  kelasId:       string
  tahunAjaranId: string
  search:        string

  // Setter
  onSemesterChange:    (id: string) => void
  onKelasChange:       (id: string) => void
  onTahunAjaranChange: (id: string) => void
  onSearchChange:      (v: string)  => void

  // Mode A: kelasId sudah terkunci dari URL
  kelasLocked?: boolean
}

export function MapelFilters({
  semesterList, kelasList, tahunAjaranList,
  semesterId, kelasId, tahunAjaranId, search,
  onSemesterChange, onKelasChange, onTahunAjaranChange, onSearchChange,
  kelasLocked,
}: Props) {
  const semesterOptions = useMemo(() => [
    { label: 'Semua Semester', value: '' },
    ...semesterList.map((s) => ({
      label: `Semester ${s.nama}${s.isActive ? ' (Aktif)' : ''}`,
      value: s.id,
    })),
  ], [semesterList])

  const kelasOptions = useMemo(() => [
    { label: 'Semua Kelas', value: '' },
    ...kelasList.map((k) => ({ label: k.namaKelas, value: k.id })),
  ], [kelasList])

  const taOptions = useMemo(() => [
    { label: 'Pilih Tahun Ajaran', value: '' },
    ...tahunAjaranList.map((ta) => ({ label: ta.nama, value: ta.id })),
  ], [tahunAjaranList])

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="w-full sm:w-64">
        <SearchInput
          placeholder="Cari mata pelajaran..."
          value={search}
          onChange={onSearchChange}
        />
      </div>

      {/* Mode B — tanpa kelasId: tampilkan filter TA */}
      {!kelasLocked && (
        <div className="w-full sm:w-44">
          <Select
            options={taOptions}
            value={tahunAjaranId}
            onChange={(e) => onTahunAjaranChange(e.target.value)}
          />
        </div>
      )}

      {/* Semester — selalu tampil */}
      <div className="w-full sm:w-48">
        <Select
          options={semesterOptions}
          value={semesterId}
          onChange={(e) => onSemesterChange(e.target.value)}
        />
      </div>

      {/* Kelas — hanya Mode B */}
      {!kelasLocked && (
        <div className="w-full sm:w-44">
          <Select
            options={kelasOptions}
            value={kelasId}
            onChange={(e) => onKelasChange(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
