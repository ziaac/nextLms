'use client'

import { useState } from 'react'
import { ChevronRight, Archive, Users } from 'lucide-react'
import { SlideOver, Badge, Skeleton } from '@/components/ui'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSiswaLulus } from '@/hooks/pendaftaran/usePendaftaran'
import type { TahunAjaran } from '@/types/tahun-ajaran.types'
import type { SiswaLulus } from '@/types/pendaftaran.types'
import { formatTanggalSaja } from '@/lib/helpers/timezone'

const JALUR_LABEL: Record<string, string> = {
  ZONASI: 'Zonasi', PRESTASI: 'Prestasi', AFIRMASI: 'Afirmasi',
  PERPINDAHAN: 'Perpindahan', REGULER: 'Reguler',
}

const STATUS_VARIANT: Record<string, 'default' | 'info' | 'success' | 'danger'> = {
  DRAFT: 'default', DIAJUKAN: 'info', DITERIMA: 'success', DITOLAK: 'danger',
}
const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draf', DIAJUKAN: 'Diajukan', DITERIMA: 'Diterima', DITOLAK: 'Ditolak',
}

interface Props {
  open: boolean
  onClose: () => void
}

function TahunCard({ tahun, onClick }: { tahun: TahunAjaran; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <Archive size={14} className="text-gray-500 dark:text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{tahun.nama}</p>
          {tahun.isActive && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Aktif</p>
          )}
        </div>
      </div>
      <ChevronRight size={14} className="text-gray-400" />
    </button>
  )
}

function TahunDetail({ tahun, onBack }: { tahun: TahunAjaran; onBack: () => void }) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSiswaLulus({ tahunAjaranId: tahun.id, limit: 50, page })
  const rows = data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline">
          ← Kembali
        </button>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{tahun.nama}</h3>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center text-sm text-gray-400">
          <Users size={24} className="mb-2 opacity-40" />
          Tidak ada data pendaftar
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((s: SiswaLulus) => (
            <div key={s.id} className="rounded-xl border border-gray-100 dark:border-gray-800 px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{s.nama}</p>
                  <p className="text-xs font-mono text-gray-400">{s.noPendaftaran}</p>
                  {s.tanggalLahir && (
                    <p className="text-xs text-gray-400">{formatTanggalSaja(s.tanggalLahir)}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {s.jalurPendaftaran && (
                    <Badge variant="info" size="sm">{JALUR_LABEL[s.jalurPendaftaran] ?? s.jalurPendaftaran}</Badge>
                  )}
                  {s.biodata ? (
                    <Badge variant={STATUS_VARIANT[s.biodata.status]} size="sm">
                      {STATUS_LABEL[s.biodata.status]}
                    </Badge>
                  ) : (
                    <Badge variant="default" size="sm">Belum Isi</Badge>
                  )}
                </div>
              </div>
            </div>
          ))}

          {data && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs text-gray-500">{page} / {data.meta.totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={page === data.meta.totalPages}
                className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ArsipPanel({ open, onClose }: Props) {
  const [selectedTahun, setSelectedTahun] = useState<TahunAjaran | null>(null)
  const { data: tahunList, isLoading } = useTahunAjaranList()

  const handleClose = () => {
    setSelectedTahun(null)
    onClose()
  }

  return (
    <SlideOver open={open} onClose={handleClose} title="Arsip Pendaftaran" width="md">
      <div className="space-y-4">
        {selectedTahun ? (
          <TahunDetail tahun={selectedTahun} onBack={() => setSelectedTahun(null)} />
        ) : (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pilih tahun ajaran untuk melihat daftar pendaftar (hanya baca).
            </p>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : (tahunList ?? []).length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">Tidak ada tahun ajaran</div>
            ) : (
              <div className="space-y-2">
                {(tahunList ?? []).map((t: TahunAjaran) => (
                  <TahunCard key={t.id} tahun={t} onClick={() => setSelectedTahun(t)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </SlideOver>
  )
}
