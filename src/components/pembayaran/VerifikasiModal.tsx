'use client'

import { useEffect, useRef, useState } from 'react'
import { Modal, Button } from '@/components/ui'
import { useVerifikasiPembayaran } from '@/hooks/pembayaran/usePembayaran'
import { getErrorMessage } from '@/lib/utils'
import type { VerifikasiPembayaranDto } from '@/types/pembayaran.types'

const FORM_ID = 'verifikasi-form'

interface VerifikasiModalProps {
  open: boolean
  onClose: () => void
  pembayaranId: string
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 px-4 py-3">
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
    </div>
  )
}

export function VerifikasiModal({ open, onClose, pembayaranId }: VerifikasiModalProps) {
  const [status, setStatus] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED')
  const [catatanKasir, setCatatanKasir] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const formTopRef = useRef<HTMLDivElement>(null)

  const verifikasiMutation = useVerifikasiPembayaran()
  const isPending = verifikasiMutation.isPending

  // Reset form saat modal dibuka
  useEffect(() => {
    if (!open) return
    setStatus('VERIFIED')
    setCatatanKasir('')
    setSubmitError(null)
    setErrors({})
  }, [open, pembayaranId])

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!status) newErrors.status = 'Status wajib dipilih'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)

    if (!validate()) return

    const dto: VerifikasiPembayaranDto = {
      status,
      ...(catatanKasir ? { catatanKasir } : {}),
    }

    try {
      await verifikasiMutation.mutateAsync({ id: pembayaranId, dto })
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
      title="Verifikasi Pembayaran"
      description="Konfirmasi status pembayaran"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Batal
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            loading={isPending}
            variant={status === 'REJECTED' ? 'danger' : 'primary'}
          >
            {status === 'REJECTED' ? 'Tolak Pembayaran' : 'Verifikasi'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
          <div ref={formTopRef} />

          {submitError && <ErrorBox message={submitError} />}

          {/* Status */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status Verifikasi <span className="text-red-500">*</span>
            </p>
            {errors.status && (
              <p className="text-xs text-red-500">{errors.status}</p>
            )}
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="verifikasi-status"
                  value="VERIFIED"
                  checked={status === 'VERIFIED'}
                  onChange={() => setStatus('VERIFIED')}
                  disabled={isPending}
                  className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">Terverifikasi</span>
                  {' '}— Pembayaran diterima dan dikonfirmasi
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="verifikasi-status"
                  value="REJECTED"
                  checked={status === 'REJECTED'}
                  onChange={() => setStatus('REJECTED')}
                  disabled={isPending}
                  className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  <span className="font-medium text-red-600 dark:text-red-400">Ditolak</span>
                  {' '}— Pembayaran tidak valid atau bermasalah
                </span>
              </label>
            </div>
          </div>

          {/* Catatan Kasir */}
          <div className="space-y-1">
            <label
              htmlFor="verifikasi-catatan"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Catatan Kasir
            </label>
            <textarea
              id="verifikasi-catatan"
              value={catatanKasir}
              onChange={(e) => setCatatanKasir(e.target.value)}
              placeholder={
                status === 'REJECTED'
                  ? 'Alasan penolakan (opsional)'
                  : 'Catatan tambahan (opsional)'
              }
              rows={3}
              disabled={isPending}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
