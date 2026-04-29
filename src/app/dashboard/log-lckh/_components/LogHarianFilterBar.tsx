'use client'

import { Select } from '@/components/ui'

interface LogHarianFilterBarProps {
  bulan: number
  tahun: number
  onChange: (bulan: number, tahun: number) => void
}

const BULAN_OPTIONS = [
  { value: '1',  label: 'Januari'  },
  { value: '2',  label: 'Februari' },
  { value: '3',  label: 'Maret'    },
  { value: '4',  label: 'April'    },
  { value: '5',  label: 'Mei'      },
  { value: '6',  label: 'Juni'     },
  { value: '7',  label: 'Juli'     },
  { value: '8',  label: 'Agustus'  },
  { value: '9',  label: 'September'},
  { value: '10', label: 'Oktober'  },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
]

function getTahunOptions() {
  const now = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => {
    const y = now - 2 + i
    return { value: String(y), label: String(y) }
  })
}

export function LogHarianFilterBar({ bulan, tahun, onChange }: LogHarianFilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-40">
        <Select
          label="Bulan"
          options={BULAN_OPTIONS}
          value={String(bulan)}
          onChange={(e) => onChange(parseInt(e.target.value, 10), tahun)}
        />
      </div>
      <div className="w-28">
        <Select
          label="Tahun"
          options={getTahunOptions()}
          value={String(tahun)}
          onChange={(e) => onChange(bulan, parseInt(e.target.value, 10))}
        />
      </div>
    </div>
  )
}
