'use client'

import { useCallback } from 'react'
import { SearchInput, Select } from '@/components/ui'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
import type { KelasFilterParams } from '@/types/kelas.types'

interface Props {
  filters: KelasFilterParams
  onChange: (filters: KelasFilterParams) => void
}

export function KelasFilters({ filters, onChange }: Props) {
  const { data: tahunAjaranData } = useTahunAjaranList()
  const { data: tingkatKelasData } = useTingkatKelasList()

  const tahunAjaranOptions = [
    { label: 'Semua Tahun Ajaran', value: '' },
    ...(tahunAjaranData ?? []).map((t) => ({ label: t.nama, value: t.id })),
  ]

  const tingkatKelasOptions = [
    { label: 'Semua Tingkat', value: '' },
    ...(tingkatKelasData ?? []).map((t) => ({ label: t.nama, value: t.id })),
  ]

  const handleSearch = useCallback((v: string) => {
    onChange({ ...filters, namaKelas: v || undefined })
  }, [filters, onChange])

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <div className="flex-1 min-w-[200px]">
        <SearchInput
          placeholder="Cari nama kelas..."
          value={filters.namaKelas ?? ''}
          onChange={handleSearch}
        />
      </div>
      <div className="w-full sm:w-52">
        <Select
          options={tahunAjaranOptions}
          value={filters.tahunAjaranId ?? ''}
          onChange={(e) => onChange({ ...filters, tahunAjaranId: e.target.value || undefined })}
        />
      </div>
      <div className="w-full sm:w-44">
        <Select
          options={tingkatKelasOptions}
          value={filters.tingkatKelasId ?? ''}
          onChange={(e) => onChange({ ...filters, tingkatKelasId: e.target.value || undefined })}
        />
      </div>
    </div>
  )
}
