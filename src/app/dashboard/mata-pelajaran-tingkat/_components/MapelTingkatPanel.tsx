'use client'

import { SlideOver, Badge } from '@/components/ui'
import { useAddGuru, useRemoveGuru } from '@/hooks/mata-pelajaran/useMataPelajaran'
import GuruSearchInput from './GuruSearchInput'
import type { MataPelajaranTingkat, GuruItem } from '@/types/akademik.types'

const KATEGORI_LABEL: Record<string, string> = {
  WAJIB: 'Wajib', PEMINATAN: 'Peminatan', LINTAS_MINAT: 'Lintas Minat',
  MULOK: 'Muatan Lokal', PENGEMBANGAN_DIRI: 'Pengembangan Diri',
}
const KATEGORI_VARIANT: Record<string, 'info'|'success'|'warning'|'purple'|'default'> = {
  WAJIB: 'info', PEMINATAN: 'success', LINTAS_MINAT: 'warning',
  MULOK: 'purple', PENGEMBANGAN_DIRI: 'default',
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2.5 space-y-0.5">
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{label}</p>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{value}</div>
    </div>
  )
}

interface Props {
  open:    boolean
  onClose: () => void
  item:    MataPelajaranTingkat | null
}

export default function MapelTingkatPanel({ open, onClose, item }: Props) {
  const addMutation    = useAddGuru()
  const removeMutation = useRemoveGuru()

  if (!item) return null

  const guruIds   = item.guruMapel.map((g) => g.guruId)
  const isPending = addMutation.isPending || removeMutation.isPending

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={`${item.masterMapel.nama} — Tingkat ${item.tingkatKelas.nama}`}
    >
      <div className="space-y-6">
        {/* Info */}
        <div className="grid grid-cols-2 gap-3">
          <InfoField label="Kode" value={item.masterMapel.kode} />
          <InfoField label="Tingkat" value={
            <Badge variant="info" size="sm">Tingkat {item.tingkatKelas.nama}</Badge>
          } />
          <InfoField label="Kategori" value={
            <Badge variant={KATEGORI_VARIANT[item.masterMapel.kategori] ?? 'default'} size="sm">
              {KATEGORI_LABEL[item.masterMapel.kategori] ?? item.masterMapel.kategori}
            </Badge>
          } />
          <InfoField label="Kelompok" value={`Kelompok ${item.masterMapel.kelompok}`} />
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700/50" />

        {/* Pool Guru */}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Pool Guru Pengajar
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Guru yang terdaftar dapat dipilih saat pembuatan sesi mata pelajaran
            </p>
          </div>

          <GuruSearchInput
            excludeIds={guruIds}
            onSelect={(guru: GuruItem) => addMutation.mutate({ id: item.id, guruId: guru.id })}
            disabled={isPending}
          />

          {item.guruMapel.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700/50
              px-4 py-6 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Belum ada guru — cari dan tambahkan di atas
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {item.guruMapel.map((gm) => (
                <div key={gm.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                    border border-gray-200 dark:border-gray-600/60 bg-white dark:bg-gray-800">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30
                    flex items-center justify-center flex-shrink-0
                    text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {gm.guru.profile.namaLengkap.split(' ').slice(0,2).map(n => n[0]).join('')}
                  </div>
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                    {gm.guru.profile.namaLengkap}
                  </span>
                  <button
                    onClick={() => removeMutation.mutate({ id: item.id, guruId: gm.guruId })}
                    disabled={removeMutation.isPending}
                    className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600
                      hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                      disabled:opacity-40 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {item.guruMapel.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              {item.guruMapel.length} guru terdaftar
            </p>
          )}
        </div>
      </div>
    </SlideOver>
  )
}
