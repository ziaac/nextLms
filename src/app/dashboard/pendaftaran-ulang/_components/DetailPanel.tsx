'use client'

import { SlideOver, Badge } from '@/components/ui'
import { formatTanggalSaja } from '@/lib/helpers/timezone'
import type { SiswaLulus } from '@/types/pendaftaran.types'

const JALUR_LABEL: Record<string, string> = {
  ZONASI: 'Zonasi', PRESTASI: 'Prestasi', AFIRMASI: 'Afirmasi',
  PERPINDAHAN: 'Perpindahan', REGULER: 'Reguler',
}

const STATUS_BIODATA_VARIANT: Record<string, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  DRAFT: 'default', DIAJUKAN: 'info', DITERIMA: 'success', DITOLAK: 'danger',
}
const STATUS_BIODATA_LABEL: Record<string, string> = {
  DRAFT: 'Draf', DIAJUKAN: 'Diajukan', DITERIMA: 'Diterima', DITOLAK: 'Ditolak',
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-2 gap-2 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">{value || '-'}</span>
    </div>
  )
}

interface Props {
  item: SiswaLulus | null
  onClose: () => void
  onEdit: (item: SiswaLulus) => void
  onBiodata: (item: SiswaLulus) => void
}

export function DetailPanel({ item, onClose, onEdit, onBiodata }: Props) {
  return (
    <SlideOver open={!!item} onClose={onClose} title="Detail Data Pendaftar" width="md">
      {item && (
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{item.nama}</p>
              <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{item.noPendaftaran}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onBiodata(item)}
                className="text-xs px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              >
                {item.biodata ? 'Edit Biodata' : 'Isi Biodata'}
              </button>
              <button
                onClick={() => onEdit(item)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2">
            <Row label="No. Pendaftaran" value={item.noPendaftaran} />
            <Row label="Nama" value={item.nama} />
            <Row label="Tanggal Lahir" value={formatTanggalSaja(item.tanggalLahir)} />
            <Row label="Jalur Pendaftaran" value={item.jalurPendaftaran ? JALUR_LABEL[item.jalurPendaftaran] : '-'} />
            <Row label="Tahun Ajaran" value={item.tahunAjaran?.nama} />
          </div>

          {item.biodata && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status Biodata</p>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
                <div>
                  <Badge variant={STATUS_BIODATA_VARIANT[item.biodata.status]}>
                    {STATUS_BIODATA_LABEL[item.biodata.status]}
                  </Badge>
                  {item.biodata.nisn && (
                    <p className="text-xs text-gray-500 mt-1">NISN: <span className="font-mono">{item.biodata.nisn}</span></p>
                  )}
                  {item.biodata.peminatan && (
                    <p className="text-xs text-gray-500">Peminatan: {item.biodata.peminatan}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!item.biodata && (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 px-4 py-4 text-center text-sm text-gray-400">
              Siswa belum mengisi biodata
            </div>
          )}
        </div>
      )}
    </SlideOver>
  )
}
