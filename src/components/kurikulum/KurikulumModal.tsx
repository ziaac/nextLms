'use client'

import { useEffect, useState } from 'react'
import { Modal, Button, Input, Spinner } from '@/components/ui'
import type { Kurikulum, CreateKurikulumDto } from '@/types/kurikulum.types'

interface KurikulumModalProps {
  open:      boolean
  onClose:   () => void
  onSubmit:  (dto: CreateKurikulumDto) => Promise<void>
  editItem?: Kurikulum | null
  isPending: boolean
  error?:    string | null
}

export function KurikulumModal({
  open,
  onClose,
  onSubmit,
  editItem,
  isPending,
  error,
}: KurikulumModalProps) {
  const [nama,      setNama]      = useState('')
  const [deskripsi, setDeskripsi] = useState('')

  useEffect(() => {
    if (open) {
      setNama(editItem?.nama ?? '')
      setDeskripsi(editItem?.deskripsi ?? '')
    }
  }, [open, editItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({ nama: nama.trim(), deskripsi: deskripsi.trim() || undefined })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editItem ? 'Edit Kurikulum' : 'Tambah Kurikulum'}
      size="sm"
      footer={
        <div className="flex gap-2 justify-end px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button type="submit" form="kurikulum-form" disabled={isPending || !nama.trim()}>
            {isPending ? <><Spinner />&nbsp;Menyimpan...</> : 'Simpan'}
          </Button>
        </div>
      }
    >
      <form id="kurikulum-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nama Kurikulum <span className="text-red-500">*</span>
          </label>
          <Input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Kurikulum Merdeka 2024"
            maxLength={255}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Deskripsi
          </label>
          <textarea
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Deskripsi singkat kurikulum (opsional)"
            rows={3}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>
      </form>
    </Modal>
  )
}
