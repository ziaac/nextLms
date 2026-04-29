'use client'

import { useState } from 'react'
import { ArrowRightLeft, Pencil, Check, X, Search } from 'lucide-react'
import { Button, Badge, Skeleton, EmptyState } from '@/components/ui'
import { useUpdateNomorAbsen } from '@/hooks/kelas/useKelasSiswa'
import { StatusSiswa, StatusAkhirTahun } from '@/types/kelas.types'
import type { KelasSiswa } from '@/types/kelas.types'

interface Props {
  data:               KelasSiswa[]
  isLoading:          boolean
  activeId?:          string
  kelasId:            string
  onRowClick:         (ks: KelasSiswa) => void
  onMutasi:           (ks: KelasSiswa) => void
  onStatusAkhirTahun: (ks: KelasSiswa) => void
  readOnly?:          boolean
}

const statusConfig: Record<StatusSiswa, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  [StatusSiswa.AKTIF]:             { label: 'Aktif',      variant: 'success' },
  [StatusSiswa.PINDAH]:            { label: 'Pindah',     variant: 'warning' },
  [StatusSiswa.KELUAR]:            { label: 'Keluar',     variant: 'danger' },
  [StatusSiswa.LULUS]:             { label: 'Lulus',      variant: 'default' },
  [StatusSiswa.DO]:                { label: 'DO',         variant: 'danger' },
  [StatusSiswa.MENGUNDURKAN_DIRI]: { label: 'Undur Diri', variant: 'default' },
}

const satLabel: Partial<Record<StatusAkhirTahun, string>> = {
  [StatusAkhirTahun.NAIK_KELAS]:        'Naik',
  [StatusAkhirTahun.TIDAK_NAIK]:        'Tidak Naik',
  [StatusAkhirTahun.LULUS]:             'Lulus',
  [StatusAkhirTahun.DO]:                'DO',
  [StatusAkhirTahun.MENGUNDURKAN_DIRI]: 'Undur Diri',
}

export function KelasSiswaTable({
  data, isLoading, activeId, kelasId,
  onRowClick, onMutasi, onStatusAkhirTahun, readOnly,
}: Props) {
  const [editAbsenId, setEditAbsenId] = useState<string | null>(null)
  const [absenInput,  setAbsenInput]  = useState('')
  const updateAbsen = useUpdateNomorAbsen(kelasId)

  const sorted = [...data].sort((a, b) => {
    if (a.nomorAbsen === null) return 1
    if (b.nomorAbsen === null) return -1
    return a.nomorAbsen - b.nomorAbsen
  })

  const handleStartEdit = (ks: KelasSiswa, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditAbsenId(ks.id)
    setAbsenInput(ks.nomorAbsen ? String(ks.nomorAbsen) : '')
  }

  const handleSaveAbsen = (ks: KelasSiswa, e: React.MouseEvent) => {
    e.stopPropagation()
    const val = parseInt(absenInput)
    if (!absenInput || isNaN(val) || val < 1) { setEditAbsenId(null); return }
    updateAbsen.mutate(
      { siswaId: ks.siswaId, nomorAbsen: val },
      { onSuccess: () => setEditAbsenId(null), onError: () => setEditAbsenId(null) }
    )
  }

  const handleCancelEdit = (e: React.MouseEvent) => { e.stopPropagation(); setEditAbsenId(null) }

  if (isLoading) return <KelasSiswaTableSkeleton />
  if (data.length === 0) return (
    <EmptyState title="Tidak ada siswa" description="Belum ada siswa atau tidak cocok dengan filter." />
  )

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="pb-3 text-center w-20 font-medium">No. Absen</th>
              <th className="pb-3 text-left font-medium">Nama Lengkap</th>
              <th className="pb-3 text-left font-medium">NISN</th>
              <th className="pb-3 text-center font-medium">L/P</th>
              <th className="pb-3 text-center font-medium">Status</th>
              {!readOnly && <th className="pb-3 text-center font-medium">Akhir Tahun</th>}
              <th className="pb-3 text-center font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {sorted.map((ks) => {
              const cfg       = statusConfig[ks.status]
              const isEditing = editAbsenId === ks.id
              return (
                <tr
                  key={ks.id}
                  onClick={() => onRowClick(ks)}
                  className={[
                    'cursor-pointer transition-colors hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10',
                    activeId === ks.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : '',
                  ].join(' ')}
                >
                  {/* No. Absen */}
                  <td className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    {isEditing && !readOnly ? (
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number" min={1} max={99} value={absenInput}
                          onChange={(e) => setAbsenInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter')  handleSaveAbsen(ks, e as never)
                            if (e.key === 'Escape') setEditAbsenId(null)
                          }}
                          className="w-14 text-center text-sm px-1 py-0.5 rounded border border-emerald-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          autoFocus
                        />
                        <button onClick={(e) => handleSaveAbsen(ks, e)} className="text-emerald-600 hover:text-emerald-800">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 group">
                        <span className="font-mono text-gray-500 dark:text-gray-400 w-6 text-center">
                          {ks.nomorAbsen ?? '—'}
                        </span>
                        {!readOnly && (
                          <button
                            onClick={(e) => handleStartEdit(ks, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-emerald-600"
                            title="Edit nomor absen"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Nama */}
                  <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">
                    {ks.siswa.profile.namaLengkap}
                  </td>

                  {/* NISN */}
                  <td className="py-3 pr-4 font-mono text-gray-500 dark:text-gray-400 text-xs">
                    {ks.siswa.profile.nisn ?? '—'}
                  </td>

                  {/* L/P */}
                  <td className="py-3 text-center text-gray-500 dark:text-gray-400">
                    {ks.siswa.profile.jenisKelamin}
                  </td>

                  {/* Status */}
                  <td className="py-3 text-center">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </td>

                  {/* Akhir Tahun — hanya non-readOnly */}
                  {!readOnly && (
                    <td className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onStatusAkhirTahun(ks)}
                        className={[
                          'text-xs px-2 py-1 rounded-lg border transition-colors',
                          ks.statusAkhirTahun
                            ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                            : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-emerald-200 dark:hover:border-emerald-700 hover:text-emerald-600 dark:hover:text-emerald-400',
                        ].join(' ')}
                      >
                        {ks.statusAkhirTahun
                          ? satLabel[ks.statusAkhirTahun] ?? ks.statusAkhirTahun
                          : '— Atur'}
                      </button>
                    </td>
                  )}

                  {/* Aksi — Search selalu ada, Mutasi hanya non-readOnly */}
                  <td className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => onRowClick(ks)}
                        title="Lihat detail"
                      >
                        <Search className="h-3.5 w-3.5 text-gray-400" />
                      </Button>
                      {!readOnly && (
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => onMutasi(ks)}
                          className="flex items-center gap-1 text-xs"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" />Mutasi
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="flex flex-col gap-2 md:hidden">
        {sorted.map((ks) => {
          const cfg       = statusConfig[ks.status]
          const isEditing = editAbsenId === ks.id
          return (
            <div
              key={ks.id}
              onClick={() => onRowClick(ks)}
              className={[
                'rounded-lg border p-4 cursor-pointer transition-colors bg-white dark:bg-gray-900',
                activeId === ks.id ? 'border-emerald-500 dark:border-emerald-600' : 'border-gray-200 dark:border-gray-800',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div onClick={(e) => e.stopPropagation()}>
                      {isEditing && !readOnly ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number" min={1} max={99} value={absenInput}
                            onChange={(e) => setAbsenInput(e.target.value)}
                            className="w-12 text-center text-xs px-1 py-0.5 rounded border border-emerald-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
                            autoFocus
                          />
                          <button onClick={(e) => handleSaveAbsen(ks, e)} className="text-emerald-600">
                            <Check className="h-3 w-3" />
                          </button>
                          <button onClick={handleCancelEdit} className="text-gray-400">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => !readOnly ? handleStartEdit(ks, e) : e.stopPropagation()}
                          className="flex items-center gap-0.5 text-xs font-mono text-gray-400 hover:text-emerald-600"
                        >
                          {ks.nomorAbsen ?? '—'}
                          {!readOnly && <Pencil className="h-2.5 w-2.5" />}
                        </button>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {ks.siswa.profile.namaLengkap}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {ks.siswa.profile.nisn ? `NISN: ${ks.siswa.profile.nisn}` : '—'} · {ks.siswa.profile.jenisKelamin}
                  </p>
                </div>
                <Badge variant={cfg.variant}>{cfg.label}</Badge>
              </div>

              {/* Aksi mobile */}
              <div className="mt-3 flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm" variant="ghost"
                  onClick={() => onRowClick(ks)}
                  title="Lihat detail"
                >
                  <Search className="h-3.5 w-3.5 text-gray-400" />
                </Button>
                {!readOnly && (
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => onMutasi(ks)}
                    className="flex items-center gap-1 text-xs"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />Mutasi
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function KelasSiswaTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center py-2 border-b border-gray-200 dark:border-gray-800">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-7 w-16 ml-auto" />
        </div>
      ))}
    </div>
  )
}
