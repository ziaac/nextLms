'use client'

import { useState } from 'react'
import type { GuruLogEksternalItem, CreateEksternalPayload, UpdateEksternalPayload } from '@/types/guru-log.types'
import { EksternalInlineRow } from './EksternalInlineRow'
import { Plus, Check, X } from 'lucide-react'
import { Skeleton } from '@/components/ui'

interface AktivitasEksternalTableProps {
  tanggal: string
  data: GuruLogEksternalItem[]
  isLoading: boolean
  onAdd: (payload: CreateEksternalPayload) => void
  onUpdate: (id: string, payload: UpdateEksternalPayload) => void
  onDelete: (id: string) => void
  isAdding: boolean
  isUpdating: boolean
  isDeleting: boolean
  readonly?: boolean
}

const EMPTY_DRAFT: Omit<CreateEksternalPayload, 'tanggal'> = {
  kegiatan: '',
  output: '',
  volume: 1,
  satuan: 'Dokumen',
  keterangan: '',
}

export function AktivitasEksternalTable({
  tanggal,
  data,
  isLoading,
  onAdd,
  onUpdate,
  onDelete,
  isAdding,
  isUpdating,
  isDeleting,
  readonly = false,
}: AktivitasEksternalTableProps) {
  const [showAddRow, setShowAddRow] = useState(false)
  const [newDraft, setNewDraft] = useState({ ...EMPTY_DRAFT })

  const handleAddSave = () => {
    if (!newDraft.kegiatan.trim() || !newDraft.output.trim()) return
    onAdd({ tanggal, ...newDraft })
    setNewDraft({ ...EMPTY_DRAFT })
    setShowAddRow(false)
  }

  const handleAddCancel = () => {
    setNewDraft({ ...EMPTY_DRAFT })
    setShowAddRow(false)
  }

  const inputCls =
    'w-full text-sm bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 rounded-lg px-2 py-1 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500'

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-left min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <th className="px-3 py-2.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-[22%]">Kegiatan</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-[28%]">Output</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-16 text-center">Vol.</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-24">Satuan</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Keterangan</th>
              <th className="px-3 py-2.5 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {data.length === 0 && !showAddRow && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-400">
                  Belum ada aktivitas eksternal. Klik "+ Tambah Baris" untuk menambahkan.
                </td>
              </tr>
            )}

            {data.map((item) => (
              <EksternalInlineRow
                key={item.id}
                item={item}
                onUpdate={onUpdate}
                onDelete={onDelete}
                isUpdating={isUpdating}
                isDeleting={isDeleting}
                readonly={readonly}
              />
            ))}

            {/* Baris tambah baru */}
            {showAddRow && (
              <tr className="bg-emerald-50/50 dark:bg-emerald-950/10">
                <td className="px-3 py-2">
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={2}
                    value={newDraft.kegiatan}
                    onChange={(e) => setNewDraft((d) => ({ ...d, kegiatan: e.target.value }))}
                    placeholder="Kegiatan *"
                    autoFocus
                  />
                </td>
                <td className="px-3 py-2">
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={2}
                    value={newDraft.output}
                    onChange={(e) => setNewDraft((d) => ({ ...d, output: e.target.value }))}
                    placeholder="Output *"
                  />
                </td>
                <td className="px-3 py-2 w-16">
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={newDraft.volume}
                    onChange={(e) => setNewDraft((d) => ({ ...d, volume: parseInt(e.target.value, 10) || 1 }))}
                  />
                </td>
                <td className="px-3 py-2 w-24">
                  <input
                    type="text"
                    className={inputCls}
                    value={newDraft.satuan}
                    onChange={(e) => setNewDraft((d) => ({ ...d, satuan: e.target.value }))}
                    placeholder="Satuan"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    className={inputCls}
                    value={newDraft.keterangan}
                    onChange={(e) => setNewDraft((d) => ({ ...d, keterangan: e.target.value }))}
                    placeholder="Keterangan (opsional)"
                  />
                </td>
                <td className="px-3 py-2 w-20">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleAddSave}
                      disabled={isAdding || !newDraft.kegiatan.trim() || !newDraft.output.trim()}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
                      title="Simpan"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCancel}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
                      title="Batal"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tombol tambah baris */}
      {!readonly && !showAddRow && (
        <button
          type="button"
          onClick={() => setShowAddRow(true)}
          className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Baris
        </button>
      )}
    </div>
  )
}
