'use client'

import { useMemo } from 'react'
import { Select, SearchInput } from '@/components/ui'
import type { TingkatKelasSingkat } from '@/types/kelas.types'

// Shape minimal TahunAjaran untuk dropdown
interface TahunAjaranOption {
  id:   string
  nama: string
}

interface Props {
  tahunAjaranList:  TahunAjaranOption[]
  tingkatKelasList: Array<{ id: string; nama: string }>

  tahunAjaranId:  string
  tingkatKelasId: string
  search:         string

  onTahunAjaranChange: (id: string) => void
  onTingkatChange:     (id: string) => void
  onSearchChange:      (v: string) => void

  // Hanya tampil jika > 1 TA aktif
  showTahunAjaranFilter: boolean
}

export function KelasBelajarFilters({
  tahunAjaranList,
  tingkatKelasList,
  tahunAjaranId,
  tingkatKelasId,
  search,
  onTahunAjaranChange,
  onTingkatChange,
  onSearchChange,
  showTahunAjaranFilter,
}: Props) {
  const tahunAjaranOptions = useMemo(
    () => tahunAjaranList.map((ta) => ({ label: ta.nama, value: ta.id })),
    [tahunAjaranList],
  )

  const tingkatOptions = useMemo(
    () => [
      { label: 'Semua Tingkat', value: '' },
      ...tingkatKelasList.map((t) => ({
        label: `Kelas ${t.nama}`,
        value: t.id,
      })),
    ],
    [tingkatKelasList],
  )

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="w-full sm:w-64">
        <SearchInput
          placeholder="Cari nama kelas..."
          value={search}
          onChange={onSearchChange}
        />
      </div>

      {/* Filter Tahun Ajaran — hanya tampil jika > 1 TA aktif */}
      {showTahunAjaranFilter && (
        <div className="w-full sm:w-48">
          <Select
            options={tahunAjaranOptions}
            value={tahunAjaranId}
            onChange={(e) => onTahunAjaranChange(e.target.value)}
          />
        </div>
      )}

      {/* Filter Tingkat */}
      <div className="w-full sm:w-40">
        <Select
          options={tingkatOptions}
          value={tingkatKelasId}
          onChange={(e) => onTingkatChange(e.target.value)}
        />
      </div>
    </div>
  )
}
