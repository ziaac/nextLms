'use client'

import { useEffect, useRef, useState } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import {
  useCreateKategoriPembayaran,
  useUpdateKategoriPembayaran,
} from '@/hooks/pembayaran/useKategoriPembayaran'
import { getErrorMessage } from '@/lib/utils'
import type { KategoriPembayaran, CreateKategoriPembayaranDto } from '@/types/pembayaran.types'

const FORM_ID = 'kategori-pembayaran-form'

interface KategoriPembayaranModalProps {
  open: boolean
  onClose: () => void
  initialData?: KategoriPembayaran
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 px-4 py-3">
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
    </div>
  )
}

export function KategoriPembayaranModal({
  open,
  onClose,
  initialData,
}: KategoriPembayaranModalProps) {
  const isEdit = !!initialData

  const [kode, setKode] = useState('')
  const [nama, setNama] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [isMandatory, setIsMandatory] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ kode?: string; nama?: string }>({})

  const formTopRef = useRef<HTMLDivElement>(null)

  const createMutation = useCreateKategoriPembayaran()
  const updateMutation = useUpdateKategoriPembayaran()
  const isPending = createMutation.isPending || updateMutation.isPending

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (!open) return
    setSubmitError(null)
    setErrors({})
    if (initialData) {
      setKode(initialData.kode)
      setNama(initialData.nama)
      setDeskripsi(initialData.deskripsi ?? '')
      setIsRecurring(initialData.isRecurring)
      setIsMandatory(initialData.isMandatory)
    } else {
      setKode('')
      setNama('')
      setDeskripsi('')
      setIsRecurring(false)
      setIsMandatory(false)
    }
  }, [open, initialData?.id])

  function validate(): boolean {
    const newErrors: { kode?: string; nama?: string } = {}
    if (!kode.trim()) newErrors.kode = 'Kode wajib diisi'
    if (!nama.trim()) newErrors.nama = 'Nama wajib diisi'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)

    if (!validate()) return

    const dto: CreateKategoriPembayaranDto = {
      kode: kode.trim(),
      nama: nama.trim(),
      ...(deskripsi.trim() ? { deskripsi: deskripsi.trim() } : {}),
      isRecurring,
      isMandatory,
    }

    try {
      if (isEdit && initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, dto })
      } else {
        await createMutation.mutateAsync(dto)
      }
      onClose()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Kategori Pembayaran' : 'Tambah Kategori Pembayaran'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Batal
          </Button>
          <Button type="submit" form={FORM_ID} loading={isPending}>
            {isEdit ? 'Simpan Perubahan' : 'Tambah Kategori'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
          <div ref={formTopRef} />

          {submitError && <ErrorBox message={submitError} />}

          {/* Kode */}
          <div className="space-y-1">
            <label
              htmlFor="kategori-kode"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Kode <span className="text-red-500">*</span>
            </label>
            <Input
              id="kategori-kode"
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              placeholder="Contoh: SPP, BUKU, SERAGAM"
              error={errors.kode}
              disabled={isPending}
            />
          </div>

          {/* Nama */}
          <div className="space-y-1">
            <label
              htmlFor="kategori-nama"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Nama <span className="text-red-500">*</span>
            </label>
            <Input
              id="kategori-nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: SPP Bulanan"
              error={errors.nama}
              disabled={isPending}
            />
          </div>

          {/* Deskripsi */}
          <div className="space-y-1">
            <label
              htmlFor="kategori-deskripsi"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Deskripsi
            </label>
            <textarea
              id="kategori-deskripsi"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Deskripsi opsional..."
              rows={3}
              disabled={isPending}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 py-2 outline-none transition focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
          </div>

          {/* isRecurring */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
            <div>
              <label
                htmlFor="kategori-is-recurring"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Pembayaran Berulang
              </label>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Tagihan dibuat setiap bulan secara otomatis
              </p>
            </div>
            <input
              id="kategori-is-recurring"
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              disabled={isPending}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>

          {/* isMandatory */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
            <div>
              <label
                htmlFor="kategori-is-mandatory"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Wajib Dibayar
              </label>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Semua siswa wajib membayar kategori ini
              </p>
            </div>
            <input
              id="kategori-is-mandatory"
              type="checkbox"
              checked={isMandatory}
              onChange={(e) => setIsMandatory(e.target.checked)}
              disabled={isPending}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
