'use client'

import { useState } from 'react'
import type { GuruLogEksternalItem, UpdateEksternalPayload } from '@/types/guru-log.types'
import { Pencil, Trash2, Check, X } from 'lucide-react'

interface EksternalInlineRowProps {
  item: GuruLogEksternalItem
  onUpdate: (id: string, payload: UpdateEksternalPayload) => void
  onDelete: (id: string) => void
  isUpdating: boolean
  isDeleting: boolean
  readonly?: boolean
}

export function EksternalInlineRow({
  item,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
  readonly = false,
}: EksternalInlineRowProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<UpdateEksternalPayload>({
    kegiatan:   item.kegiatan,
    output:     item.output,
    volume:     item.volume,
    satuan:     item.satuan,
    keterangan: item.keterangan ?? '',
  })

  const handleSave = () => {
    onUpdate(item.id, {
      kegiatan:   draft.kegiatan?.trim(),
      output:     draft.output?.trim(),
      volume:     draft.volume,
      satuan:     draft.satuan?.trim(),
      keterangan: draft.keterangan?.trim() || undefined,
    })
    setEditing(false)
  }

  const handleCancel = () => {
    setDraft({
      kegiatan:   item.kegiatan,
      output:     item.output,
      volume:     item.volume,
      satuan:     item.satuan,
      keterangan: item.keterangan ?? '',
    })
    setEditing(false)
  }

  const handleDelete = () => {
    if (window.confirm('Hapus aktivitas ini?')) {
      onDelete(item.id)
    }
  }

  const inputCls = 'w-full text-sm bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 rounded-lg px-2 py-1 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500'

  if (editing) {
    return (
      <tr className="bg-emerald-50/50 dark:bg-emerald-950/10">
        <td className="px-3 py-2">
          <textarea
            className={`${inputCls} resize-none`}
            rows={2}
            value={draft.kegiatan ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, kegiatan: e.target.value }))}
            placeholder="Kegiatan"
          />
        </td>
        <td className="px-3 py-2">
          <textarea
            className={`${inputCls} resize-none`}
            rows={2}
            value={draft.output ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, output: e.target.value }))}
            placeholder="Output"
          />
        </td>
        <td className="px-3 py-2 w-16">
          <input
            type="number"
            min={1}
            className={inputCls}
            value={draft.volume ?? 1}
            onChange={(e) => setDraft((d) => ({ ...d, volume: parseInt(e.target.value, 10) || 1 }))}
          />
        </td>
        <td className="px-3 py-2 w-24">
          <input
            type="text"
            className={inputCls}
            value={draft.satuan ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, satuan: e.target.value }))}
            placeholder="Satuan"
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="text"
            className={inputCls}
            value={draft.keterangan ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, keterangan: e.target.value }))}
            placeholder="Keterangan (opsional)"
          />
        </td>
        <td className="px-3 py-2 w-20">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={isUpdating}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
              title="Simpan"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
              title="Batal"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
      <td className="px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 align-top">{item.kegiatan}</td>
      <td className="px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 align-top">{item.output}</td>
      <td className="px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 text-center align-top">{item.volume}</td>
      <td className="px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 align-top">{item.satuan}</td>
      <td className="px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400 align-top">{item.keterangan ?? '—'}</td>
      <td className="px-3 py-2.5 align-top w-20">
        {!readonly && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
              title="Hapus"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}
