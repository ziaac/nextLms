'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Badge, Button } from '@/components/ui'
import { Pencil, Trash2, Coffee } from 'lucide-react'
import { useDeleteMasterJam } from '@/hooks/master-jam/useMasterJam'
import { TIPE_HARI_LABEL, TIPE_HARI_VARIANT } from '@/types/master-jam.types'
import type { MasterJam } from '@/types/master-jam.types'

interface Props {
  data:   MasterJam[]
  onEdit: (item: MasterJam) => void
}

export function MasterJamTable({ data, onEdit }: Props) {
  const deleteMutation = useDeleteMasterJam()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (item: MasterJam) => {
    if (!confirm('Hapus sesi "' + item.namaSesi + '"?')) return
    setDeletingId(item.id)
    try {
      await deleteMutation.mutateAsync(item.id)
      toast.success('Sesi berhasil dihapus')
    } catch {
      toast.error('Gagal menghapus sesi')
    } finally {
      setDeletingId(null)
    }
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
        <p className="text-sm">Belum ada data sesi jam pelajaran.</p>
        <p className="text-xs">Pilih tingkat kelas untuk melihat data.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="grid grid-cols-[48px_1fr_100px_100px_80px_80px_100px_120px] gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        <span className="text-center">No</span>
        <span>Nama Sesi</span>
        <span className="text-center">Jam Mulai</span>
        <span className="text-center">Jam Selesai</span>
        <span className="text-center">Menit</span>
        <span className="text-center">Bobot JP</span>
        <span className="text-center">Tipe Hari</span>
        <span className="text-right">Aksi</span>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {data.map((item) => (
          <div
            key={item.id}
            className={
              'grid grid-cols-[48px_1fr_100px_100px_80px_80px_100px_120px] gap-3 px-5 py-3 items-center ' +
              (item.isIstirahat
                ? 'bg-amber-50/50 dark:bg-amber-900/10'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50')
            }
          >
            {/* Urutan */}
            <div className="flex items-center justify-center">
              {item.isIstirahat ? (
                <Coffee className="h-4 w-4 text-amber-500" />
              ) : (
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {item.urutan}
                </span>
              )}
            </div>

            {/* Nama Sesi */}
            <div>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {item.namaSesi}
              </span>
              {item.isIstirahat && (
                <span className="ml-2 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                  ISTIRAHAT
                </span>
              )}
            </div>

            {/* Jam Mulai */}
            <div className="text-center font-mono text-sm font-semibold text-gray-700 dark:text-gray-300">
              {item.jamMulai}
            </div>

            {/* Jam Selesai */}
            <div className="text-center font-mono text-sm font-semibold text-gray-700 dark:text-gray-300">
              {item.jamSelesai}
            </div>

            {/* Jumlah Menit */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              {item.jumlahMenit}'
            </div>

            {/* Bobot JP */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              {item.bobotJp}
            </div>

            {/* Tipe Hari */}
            <div className="flex justify-center">
              <Badge variant={TIPE_HARI_VARIANT[item.tipeHari]} size="sm">
                {TIPE_HARI_LABEL[item.tipeHari]}
              </Badge>
            </div>

            {/* Aksi */}
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(item)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => { void handleDelete(item) }}
                disabled={deletingId === item.id}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
