'use client'

import { Select } from '@/components/ui'

interface LogHarianFilterBarProps {
  bulan:    number
  tahun:    number          // hanya untuk display, tidak bisa diubah user
  onChange: (bulan: number) => void
}

const BULAN_OPTIONS = [
  { value: '1',  label: 'Januari'   },
  { value: '2',  label: 'Februari'  },
  { value: '3',  label: 'Maret'     },
  { value: '4',  label: 'April'     },
  { value: '5',  label: 'Mei'       },
  { value: '6',  label: 'Juni'      },
  { value: '7',  label: 'Juli'      },
  { value: '8',  label: 'Agustus'   },
  { value: '9',  label: 'September' },
  { value: '10', label: 'Oktober'   },
  { value: '11', label: 'November'  },
  { value: '12', label: 'Desember'  },
]

export function LogHarianFilterBar({ bulan, tahun, onChange }: LogHarianFilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Filter bulan — satu-satunya yang bisa diubah */}
      <div className="w-40">
        <Select
          label="Bulan"
          options={BULAN_OPTIONS}
          value={String(bulan)}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
        />
      </div>

      {/* Tahun — read-only, dari semester/tahun ajaran aktif */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tahun</p>
        <div className="h-9 px-3 flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-600 dark:text-gray-400 select-none">
          {tahun}
        </div>
      </div>
    </div>
  )
}
