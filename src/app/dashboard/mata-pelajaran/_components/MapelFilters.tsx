'use client'

import { SearchInput, Select } from '@/components/ui'
import type { FilterMasterMapelParams, KategoriMapel, KelompokMapel } from '@/types/akademik.types'

const KATEGORI_OPTIONS = [
  { value: 'WAJIB',             label: 'Wajib'             },
  { value: 'PEMINATAN',         label: 'Peminatan'         },
  { value: 'LINTAS_MINAT',      label: 'Lintas Minat'      },
  { value: 'MULOK',             label: 'Muatan Lokal'      },
  { value: 'PENGEMBANGAN_DIRI', label: 'Pengembangan Diri' },
]

const KELOMPOK_OPTIONS = [
  { value: 'A', label: 'Kelompok A' },
  { value: 'B', label: 'Kelompok B' },
  { value: 'C', label: 'Kelompok C' },
]

interface Props {
  filter:   FilterMasterMapelParams
  onChange: (f: FilterMasterMapelParams) => void
}

export default function MapelFilters({ filter, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex-1 min-w-48">
        <SearchInput
          value={filter.search ?? ''}
          onChange={(v) => onChange({ ...filter, search: v || undefined })}
          placeholder="Cari kode atau nama mapel..."
        />
      </div>
      <div className="w-44">
        <Select
          options={KATEGORI_OPTIONS}
          value={filter.kategori ?? ''}
          placeholder="Semua Kategori"
          onChange={(e) =>
            onChange({ ...filter, kategori: (e.target.value as KategoriMapel) || undefined })
          }
        />
      </div>
      <div className="w-40">
        <Select
          options={KELOMPOK_OPTIONS}
          value={filter.kelompok ?? ''}
          placeholder="Semua Kelompok"
          onChange={(e) =>
            onChange({ ...filter, kelompok: (e.target.value as KelompokMapel) || undefined })
          }
        />
      </div>
    </div>
  )
}
