'use client'

import { useState, useMemo } from 'react'
import { formatJam } from '@/lib/helpers/timezone'
import {
  BookOpen, Edit, Trash2, Download, CalendarDays,
  ClipboardList, BarChart2, AlertTriangle, CalendarCheck,
} from 'lucide-react'
import { Button, Badge, Skeleton, Modal } from '@/components/ui'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { getErrorMessage } from '@/lib/utils'
import type { MataPelajaran } from '@/types/akademik.types'

interface Props {
  data:       MataPelajaran[]
  isLoading:  boolean
  onRowClick: (mapel: MataPelajaran) => void
  onEdit:     (mapel: MataPelajaran) => void
  onDelete:   (mapel: MataPelajaran) => void
  onExport:   (mapel: MataPelajaran) => void
  canCrud:    boolean
  // Hapus bulk hanya untuk SUPER_ADMIN dan ADMIN
  canBulkDelete?: boolean
  onNavigateJadwal?: (kelasId: string, semesterId: string) => void

}

function useBulkDeleteMataPelajaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.delete('/mata-pelajaran/bulk', { data: { ids } })
      return res.data as { message: string; deletedCount: number }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['mata-pelajaran'] })
      toast.success(`${data.deletedCount} mata pelajaran berhasil dihapus`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

function formatPengajar(mapel: MataPelajaran): string {
  if (!mapel.pengajar || mapel.pengajar.length === 0) return 'Belum ada pengajar'
  const koordinator = mapel.pengajar.find((p) => p.isKoordinator)
  const nama = koordinator?.guru.profile.namaLengkap ?? mapel.pengajar[0].guru.profile.namaLengkap
  const extra = mapel.pengajar.length > 1 ? ` +${mapel.pengajar.length - 1}` : ''
  return nama + extra
}

export function MapelTable({
  data, isLoading, onRowClick, onEdit, onDelete, onExport, canCrud, canBulkDelete, onNavigateJadwal,
}: Props) {
  const router = useRouter()
  const [selectedIds,          setSelectedIds]          = useState<Set<string>>(new Set())
  const [confirmDelete,        setConfirmDelete]        = useState(false)
  const [confirmDeleteSingle,  setConfirmDeleteSingle]  = useState<MataPelajaran | null>(null)
  const bulkDelete = useBulkDeleteMataPelajaran()

  // Mapel yang bisa dihapus: belum ada materi
  const deletableMapel = useMemo(
    () => data.filter((m) => (m._count?.materiPelajaran ?? 0) === 0),
    [data]
  )
  const deletableIds = useMemo(
    () => new Set(deletableMapel.map((m) => m.id)),
    [deletableMapel]
  )

  const allDeletableSelected = deletableMapel.length > 0 &&
    deletableMapel.every((m) => selectedIds.has(m.id))
  const someSelected = selectedIds.size > 0

  function toggleSelectAll() {
    if (allDeletableSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(deletableMapel.map((m) => m.id)))
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleBulkDelete() {
    try {
      await bulkDelete.mutateAsync(Array.from(selectedIds))
      setSelectedIds(new Set())
      setConfirmDelete(false)
    } catch { /* handled in mutation */ }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['', 'Mata Pelajaran', 'Pengajar', 'KKM', 'Target', 'Status', ''].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 8 }).map((__, j) => (
                  <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-24 rounded" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <BookOpen className="w-10 h-10 opacity-40" />
          <p className="text-sm font-medium">Tidak ada mata pelajaran</p>
          <p className="text-xs">Coba ubah filter atau tambah mata pelajaran baru</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Toolbar hapus bulk */}
      {canBulkDelete && someSelected && (
        <div className="flex items-center justify-between rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 mb-2">
          <p className="text-sm text-red-700">
            <span className="font-semibold">{selectedIds.size}</span> mapel dipilih
          </p>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
            className="text-red-500 hover:bg-red-100"
            loading={bulkDelete.isPending}
            onClick={() => setConfirmDelete(true)}
          >
            Hapus yang Dipilih
          </Button>
        </div>
      )}

      {/* Desktop */}
      <div className="hidden md:block rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Mata Pelajaran', 'Pengajar','KKM','Target', 'Status', 'Aksi'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
              {canBulkDelete && (
                <th className="px-4 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allDeletableSelected}
                    onChange={toggleSelectAll}
                    disabled={deletableMapel.length === 0}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    title="Pilih semua yang bisa dihapus"
                  />
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.map((mapel) => {
              const hasMateri  = (mapel._count?.materiPelajaran ?? 0) > 0
              const canDelete  = !hasMateri
              const isSelected = selectedIds.has(mapel.id)

              return (
                <tr
                  key={mapel.id}
                  className={[
                    'hover:bg-gray-50 transition-colors cursor-pointer',
                    isSelected ? 'bg-red-50/40' : '',
                  ].join(' ')}
                  onClick={() => onRowClick(mapel)}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800">{mapel.mataPelajaranTingkat.masterMapel.nama}</p>
                    <p className="text-xs text-gray-400">{mapel.mataPelajaranTingkat.masterMapel.kode}</p>
                    {hasMateri && (
                      <p className="text-[10px] text-amber-500 mt-0.5">
                        {mapel._count.materiPelajaran} materi
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[180px]">
                    <p className="truncate">{formatPengajar(mapel)}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{mapel.kkm}</td>
                  <td className="px-4 py-3 text-gray-600">{mapel.targetPertemuan}x</td>
                  <td className="px-4 py-3">
                    <Badge variant={mapel.isActive ? 'success' : 'danger'}>
                      {mapel.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 min-w-[320px]" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost"
                        leftIcon={<CalendarDays className="w-3.5 h-3.5" />}
                        onClick={() => router.push(`/dashboard/absensi?mataPelajaranId=${mapel.id}`)}>
                        Absen
                      </Button>
                      {onNavigateJadwal && (
                        <Button size="sm" variant="ghost"
                          leftIcon={<CalendarCheck className="w-3.5 h-3.5 text-blue-400" />}
                          onClick={() => onNavigateJadwal(mapel.kelasId, mapel.semesterId)}>
                          Jadwal
                        </Button>
                      )}
                      <Button size="sm" variant="ghost"
                        leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                        onClick={() => router.push(`/dashboard/materi?mataPelajaranId=${mapel.id}`)}>
                        Materi
                      </Button>
                      <Button size="sm" variant="ghost"
                        leftIcon={<ClipboardList className="w-3.5 h-3.5" />}
                        onClick={() => router.push(`/dashboard/tugas?mataPelajaranId=${mapel.id}`)}>
                        Tugas
                      </Button>
                      <Button size="sm" variant="ghost"
                        leftIcon={<BarChart2 className="w-3.5 h-3.5" />}
                        onClick={() => router.push(`/dashboard/penilaian?mataPelajaranId=${mapel.id}`)}>
                        Nilai
                      </Button>
                      {canCrud && (
                        <>
                          <Button size="sm" variant="ghost"
                            leftIcon={<Edit className="w-3.5 h-3.5" />}
                            onClick={() => onEdit(mapel)} />
                          <div className="relative group">
                            <Button size="sm" variant="ghost"
                              disabled={!canDelete}
                              leftIcon={<Trash2 className={[
                                'w-3.5 h-3.5',
                                canDelete ? 'text-red-400' : 'text-gray-300',
                              ].join(' ')} />}
                              onClick={() => canDelete && setConfirmDeleteSingle(mapel)} />
                            {!canDelete && (
                              <div className="absolute right-0 top-8 z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                Sudah ada materi
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  {canBulkDelete && (
                    <td className="px-4 py-3 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="relative group flex justify-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!canDelete}
                          onChange={() => toggleSelect(mapel.id)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Pilih mata pelajaran untuk dihapus"
                          aria-label="Pilih mata pelajaran untuk dihapus"
                        />
                        {!canDelete && (
                          <div className="absolute right-6 top-0 z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                            Sudah ada materi
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col gap-3">
        {data.map((mapel) => {
          const hasMateri  = (mapel._count?.materiPelajaran ?? 0) > 0
          const canDelete  = !hasMateri
          const isSelected = selectedIds.has(mapel.id)

          return (
            <div key={mapel.id}
              className={[
                'rounded-2xl border bg-white p-4 space-y-3 cursor-pointer',
                isSelected ? 'border-red-300 bg-red-50/30' : 'border-gray-200',
              ].join(' ')}
              onClick={() => onRowClick(mapel)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {canBulkDelete && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!canDelete}
                      onChange={() => toggleSelect(mapel.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 rounded border-gray-300 text-emerald-600 disabled:opacity-40"
                                            title="Pilih mata pelajaran untuk dihapus"
                      aria-label={`Pilih ${mapel.mataPelajaranTingkat.masterMapel.nama} untuk dihapus`}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {mapel.mataPelajaranTingkat.masterMapel.nama}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {mapel.mataPelajaranTingkat.masterMapel.kode}
                    </p>
                    {hasMateri && (
                      <p className="text-[10px] text-amber-500 mt-0.5">
                        {mapel._count.materiPelajaran} materi — tidak dapat dihapus
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={mapel.isActive ? 'success' : 'danger'}>
                  {mapel.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p><span className="font-medium">Pengajar:</span> {formatPengajar(mapel)}</p>
                <p>
                  <span className="font-medium">KKM:</span> {mapel.kkm} <span className="mx-2">•</span> 
                  <span className="font-medium">Target:</span> {mapel.targetPertemuan} Pertemuan
                </p>              
            </div>
            </div>
          )
        })}
      </div>

      {/* Modal konfirmasi hapus tunggal */}
      <Modal
        open={!!confirmDeleteSingle}
        onClose={() => setConfirmDeleteSingle(null)}
        title="Hapus Mata Pelajaran"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDeleteSingle(null)}>Batal</Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => {
                if (confirmDeleteSingle) {
                  onDelete(confirmDeleteSingle)
                  setConfirmDeleteSingle(null)
                }
              }}
            >
              Ya, Hapus
            </Button>
          </>
        }
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">
                Yakin ingin menghapus mata pelajaran{' '}
                <span className="font-semibold text-gray-900">
                  {confirmDeleteSingle?.mataPelajaranTingkat.masterMapel.nama}
                </span>?
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal konfirmasi hapus bulk */}
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Hapus Mata Pelajaran"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Batal</Button>
            <Button
              loading={bulkDelete.isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={handleBulkDelete}
            >
              Ya, Hapus {selectedIds.size} Mapel
            </Button>
          </>
        }
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">
                Anda akan menghapus{' '}
                <span className="font-semibold text-red-600">{selectedIds.size} mata pelajaran</span>.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Tindakan ini tidak dapat dibatalkan. Data terkait (tugas, absensi, penilaian)
                juga akan ikut terhapus.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
