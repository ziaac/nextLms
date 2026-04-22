'use client'

import { useState } from 'react'
import { Badge, EmptyState, ConfirmModal } from '@/components/ui'
import { useDeleteMasterMapel } from '@/hooks/mata-pelajaran/useMataPelajaran'
import type { MasterMapel } from '@/types/akademik.types'

const KATEGORI_LABEL: Record<string, string> = {
  WAJIB: 'Wajib', PEMINATAN: 'Peminatan', LINTAS_MINAT: 'Lintas Minat',
  MULOK: 'Mulok', PENGEMBANGAN_DIRI: 'Pengembangan Diri',
}
const KATEGORI_VARIANT: Record<string, 'info'|'success'|'warning'|'purple'|'default'> = {
  WAJIB: 'info', PEMINATAN: 'success', LINTAS_MINAT: 'warning',
  MULOK: 'purple', PENGEMBANGAN_DIRI: 'default',
}

const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.213l-4 1 1-4L16.862 3.487z" />
  </svg>
)
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h8a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
  </svg>
)

function MapelRow({ mapel, onEdit }: { mapel: MasterMapel; onEdit: () => void }) {
  const deleteMutation = useDeleteMasterMapel()
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <>
      <tr className="border-b border-gray-100 dark:border-gray-700/50
        hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <td className="px-4 py-3">
          <span className="font-mono text-sm font-semibold text-gray-700 dark:text-gray-300">
            {mapel.kode}
          </span>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{mapel.nama}</p>
        </td>
        <td className="px-4 py-3">
          <Badge variant={KATEGORI_VARIANT[mapel.kategori] ?? 'default'} size="sm">
            {KATEGORI_LABEL[mapel.kategori] ?? mapel.kategori}
          </Badge>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
          {mapel.kelompok}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 justify-end">
            <button onClick={onEdit}
              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50
                dark:hover:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors">
              <PencilIcon />
            </button>
            <button onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50
                dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors">
              <TrashIcon />
            </button>
          </div>
        </td>
      </tr>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate(mapel.id, { onSuccess: () => setConfirmDelete(false) })}
        isLoading={deleteMutation.isPending}
        title="Hapus Mata Pelajaran"
        description={`Yakin hapus "${mapel.nama}"? Relasi ke tingkat kelas akan ikut terhapus.`}
        confirmLabel="Hapus"
        variant="danger"
      />
    </>
  )
}

export default function MapelMasterTable({ data, isLoading, onEdit }: {
  data: MasterMapel[]; isLoading: boolean; onEdit: (m: MasterMapel) => void
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1,2,3,4,5].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    )
  }
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Belum ada mata pelajaran"
        description="Tambahkan katalog mata pelajaran terlebih dahulu."
      />
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-600/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-600/60">
            <tr>
              {['Kode','Nama','Kategori','Kelompok','Aksi'].map((h, i) => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500
                  dark:text-gray-400 uppercase tracking-wider
                  ${i === 4 ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-700/50">
            {data.map((m) => (
              <MapelRow key={m.id} mapel={m} onEdit={() => onEdit(m)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
