'use client'

import { useState, useEffect } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { Modal, Button, Select } from '@/components/ui'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSiswaLulus } from '@/hooks/pendaftaran/usePendaftaran'
import type { TahunAjaran } from '@/types/tahun-ajaran.types'
import type { SiswaLulus } from '@/types/pendaftaran.types'

const JALUR_OPTIONS = [
  { value: 'ZONASI',      label: 'Zonasi' },
  { value: 'PRESTASI',    label: 'Prestasi' },
  { value: 'AFIRMASI',    label: 'Afirmasi' },
  { value: 'PERPINDAHAN', label: 'Perpindahan' },
  { value: 'REGULER',     label: 'Reguler' },
]

const JALUR_LABEL: Record<string, string> = {
  ZONASI: 'Zonasi', PRESTASI: 'Prestasi', AFIRMASI: 'Afirmasi',
  PERPINDAHAN: 'Perpindahan', REGULER: 'Reguler',
}

interface Props {
  open: boolean
  onClose: () => void
  defaultTahunAjaranId?: string
}

export function ExportModal({ open, onClose, defaultTahunAjaranId }: Props) {
  const [tahunAjaranId, setTahunAjaranId] = useState(defaultTahunAjaranId ?? '')
  const [jalur,         setJalur]         = useState('')
  const [exporting,     setExporting]     = useState(false)

  const { data: tahunList } = useTahunAjaranList()

  const { data, isLoading } = useSiswaLulus({
    tahunAjaranId: tahunAjaranId || undefined,
    jalurPendaftaran: jalur || undefined,
    limit: 1000,
    page: 1,
  })

  useEffect(() => {
    if (open) {
      setTahunAjaranId(defaultTahunAjaranId ?? '')
      setJalur('')
    }
  }, [open, defaultTahunAjaranId])

  const rows      = data?.data ?? []
  const tahunNama = (tahunList ?? []).find((t: TahunAjaran) => t.id === tahunAjaranId)?.nama ?? 'semua'
  const tahunOptions = (tahunList ?? []).map((t: TahunAjaran) => ({ value: t.id, label: t.nama }))

  const handleExport = async () => {
    if (rows.length === 0) return
    setExporting(true)
    try {
      const XLSX = await import('xlsx')
      const sheetData = [
        ['No', 'No. Pendaftaran', 'Nama Lengkap', 'NISN', 'Tanggal Lahir', 'Jalur Pendaftaran', 'Tahun Ajaran', 'Status Biodata'],
        ...rows.map((s: SiswaLulus, i: number) => [
          i + 1,
          s.noPendaftaran,
          s.nama,
          s.biodata?.nisn ?? '',
          s.tanggalLahir ? new Date(s.tanggalLahir).toLocaleDateString('id-ID') : '',
          s.jalurPendaftaran ? (JALUR_LABEL[s.jalurPendaftaran] ?? s.jalurPendaftaran) : '',
          s.tahunAjaran?.nama ?? '',
          s.biodata ? s.biodata.status : 'Belum Isi',
        ]),
      ]
      const ws = XLSX.utils.aoa_to_sheet(sheetData)
      ws['!cols'] = [{ wch: 5 }, { wch: 16 }, { wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Pendaftar')
      const jalurSuffix = jalur ? `-${jalur.toLowerCase()}` : ''
      XLSX.writeFile(wb, `pendaftar-${tahunNama.replace(/\//g, '-')}${jalurSuffix}.xlsx`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export Data Pendaftar"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button
            onClick={handleExport}
            loading={exporting}
            disabled={isLoading || rows.length === 0}
            leftIcon={<Download size={13} />}
          >
            Export {isLoading ? '...' : `${rows.length} Data`}
          </Button>
        </>
      }
    >
      <div className="p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Tahun Ajaran</label>
          <Select
            placeholder="Semua Tahun"
            options={tahunOptions}
            value={tahunAjaranId}
            onChange={(e) => setTahunAjaranId(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Jalur Pendaftaran</label>
          <Select
            placeholder="Semua Jalur"
            options={JALUR_OPTIONS}
            value={jalur}
            onChange={(e) => setJalur(e.target.value)}
          />
        </div>

        {/* Preview count */}
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 px-4 py-3">
          <FileSpreadsheet size={20} className="text-emerald-500 shrink-0" />
          {isLoading ? (
            <p className="text-sm text-gray-500">Menghitung data...</p>
          ) : (
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{rows.length} pendaftar akan diekspor</p>
              <p className="text-xs text-gray-400">
                {tahunNama}{jalur ? ` · ${JALUR_LABEL[jalur]}` : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
