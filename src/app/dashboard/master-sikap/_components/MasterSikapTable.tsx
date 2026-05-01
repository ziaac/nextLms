'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, ToggleLeft, ToggleRight, ChevronUp, ChevronDown } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { useToggleMasterSikap, useDeleteMasterSikap } from '@/hooks/master-sikap/useMasterSikap'
import type { MasterSikap } from '@/types/master-sikap.types'

interface Props {
  data: MasterSikap[]
  onEdit: (item: MasterSikap) => void
}

type SortKey = 'kode' | 'nama' | 'point' | 'level'

export function MasterSikapTable({ data, onEdit }: Props) {
  const toggle = useToggleMasterSikap()
  const remove = useDeleteMasterSikap()
  const [sortKey, setSortKey]   = useState<SortKey>('kode')
  const [sortAsc, setSortAsc]   = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const sorted = [...data].sort((a, b) => {
    const va = a[sortKey] ?? 0
    const vb = b[sortKey] ?? 0
    if (va < vb) return sortAsc ? -1 : 1
    if (va > vb) return sortAsc ? 1 : -1
    return 0
  })

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v)
    else { setSortKey(key); setSortAsc(true) }
  }

  const handleToggle = async (id: string) => {
    try {
      await toggle.mutateAsync(id)
      toast.success('Status berhasil diubah')
    } catch {
      toast.error('Gagal mengubah status')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await remove.mutateAsync(id)
      toast.success(res.message)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Gagal menghapus')
    } finally {
      setDeleteId(null)
    }
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      : <ChevronUp className="w-3 h-3 opacity-20" />

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-16 text-center">
        <p className="text-sm text-gray-400">Belum ada data master sikap.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Jenis
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort('kode')}
                >
                  <span className="flex items-center gap-1">Kode <SortIcon k="kode" /></span>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort('nama')}
                >
                  <span className="flex items-center gap-1">Nama / Uraian <SortIcon k="nama" /></span>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Kategori
                </th>
                <th
                  className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort('point')}
                >
                  <span className="flex items-center justify-center gap-1">Poin <SortIcon k="point" /></span>
                </th>
                <th
                  className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort('level')}
                >
                  <span className="flex items-center justify-center gap-1">Lvl <SortIcon k="level" /></span>
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Dipakai
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {sorted.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      item.jenis === 'POSITIF'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                    }`}>
                      {item.jenis === 'POSITIF' ? '+ Positif' : '− Negatif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {item.kode}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{item.nama}</p>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.uraian}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {item.kategori ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold text-sm ${
                      item.point > 0 ? 'text-emerald-600 dark:text-emerald-400'
                      : item.point < 0 ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-400'
                    }`}>
                      {item.point > 0 ? `+${item.point}` : item.point}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">{item.level}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggle(item.id)}
                      disabled={toggle.isPending}
                      title={item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      className="inline-flex items-center gap-1 text-xs disabled:opacity-50"
                    >
                      {item.isActive
                        ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                        : <ToggleLeft className="w-5 h-5 text-gray-400" />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">
                    {item._count?.catatanSikap ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm delete dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6 w-full max-w-sm mx-4">
            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Hapus master sikap?</p>
            <p className="text-sm text-gray-500 mb-5">
              Tidak bisa dihapus jika sudah dipakai di catatan sikap. Nonaktifkan saja jika masih dipakai.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDeleteId(null)}>Batal</Button>
              <Button
                variant="danger"
                size="sm"
                disabled={remove.isPending}
                onClick={() => handleDelete(deleteId)}
              >
                {remove.isPending ? 'Menghapus...' : 'Hapus'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
