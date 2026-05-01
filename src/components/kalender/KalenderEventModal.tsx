'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal, Button, Select, DateInput, Input } from '@/components/ui'
import { formatTanggalSaja } from '@/lib/helpers/timezone'
import { useCreateKalender, useUpdateKalender } from '@/hooks/kalender-akademik'
import { KalenderEventBadge } from './KalenderEventBadge'
import { getErrorMessage } from '@/lib/utils'
import type { KalenderAkademik, TipeKalender, CreateKalenderAkademikDto } from '@/types/kalender-akademik.types'
import { TIPE_KALENDER_LABEL } from '@/types/kalender-akademik.types'

// ─── ErrorBox ─────────────────────────────────────────────────────────────────

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 px-4 py-3">
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface KalenderEventModalProps {
  open: boolean
  onClose: () => void
  mode: 'detail' | 'create' | 'edit'
  event?: KalenderAkademik | null
  tahunAjaranId: string
  defaultTanggal?: string // YYYY-MM-DD, untuk pre-fill saat create
}

interface FormErrors {
  judul?: string
  tipe?: string
  tanggal?: string
  tanggalSelesai?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIPE_OPTIONS = (Object.keys(TIPE_KALENDER_LABEL) as TipeKalender[]).map((key) => ({
  value: key,
  label: TIPE_KALENDER_LABEL[key],
}))

const FORM_ID = 'kalender-event-form'

// ─── Component ────────────────────────────────────────────────────────────────

export function KalenderEventModal({
  open,
  onClose,
  mode,
  event,
  tahunAjaranId,
  defaultTanggal,
}: KalenderEventModalProps) {
  const isDetail = mode === 'detail'
  const isEdit = mode === 'edit'

  // Form state
  const [judul, setJudul] = useState('')
  const [tipe, setTipe] = useState<TipeKalender | ''>('')
  const [tanggal, setTanggal] = useState('')
  const [tanggalSelesai, setTanggalSelesai] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [isLibur, setIsLibur] = useState(false)

  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const formTopRef = useRef<HTMLDivElement>(null)

  const createMutation = useCreateKalender()
  const updateMutation = useUpdateKalender()
  const isPending = createMutation.isPending || updateMutation.isPending

  // Reset form saat modal dibuka/ditutup
  useEffect(() => {
    if (!open) return
    setSubmitError(null)
    setErrors({})

    if (isEdit && event) {
      setJudul(event.judul)
      setTipe(event.tipe)
      setTanggal(event.tanggal)
      setTanggalSelesai(event.tanggalSelesai ?? '')
      setDeskripsi(event.deskripsi ?? '')
      setIsLibur(event.isLibur)
    } else if (mode === 'create') {
      setJudul('')
      setTipe('')
      setTanggal(defaultTanggal ?? '')
      setTanggalSelesai('')
      setDeskripsi('')
      setIsLibur(false)
    }
  }, [open, mode, event?.id, defaultTanggal])

  // ─── Validation ─────────────────────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: FormErrors = {}

    if (!judul.trim()) {
      newErrors.judul = 'Judul wajib diisi'
    } else if (judul.trim().length > 200) {
      newErrors.judul = 'Judul maksimal 200 karakter'
    }

    if (!tipe) {
      newErrors.tipe = 'Tipe wajib dipilih'
    }

    if (!tanggal) {
      newErrors.tanggal = 'Tanggal mulai wajib diisi'
    }

    if (tanggalSelesai && tanggal && tanggalSelesai < tanggal) {
      newErrors.tanggalSelesai = 'Tanggal selesai harus sama atau setelah tanggal mulai'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)

    if (!validate()) return

    const dto: CreateKalenderAkademikDto = {
      tahunAjaranId,
      judul: judul.trim(),
      tipe: tipe as TipeKalender,
      tanggal,
      ...(tanggalSelesai ? { tanggalSelesai } : {}),
      ...(deskripsi.trim() ? { deskripsi: deskripsi.trim() } : {}),
      isLibur,
    }

    try {
      if (isEdit && event) {
        await updateMutation.mutateAsync({ id: event.id, dto })
      } else {
        await createMutation.mutateAsync(dto)
      }
      onClose()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  // ─── Modal title ────────────────────────────────────────────────────────────

  const modalTitle =
    mode === 'detail'
      ? 'Detail Event'
      : mode === 'edit'
        ? 'Edit Event Kalender'
        : 'Tambah Event Kalender'

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modalTitle}
      size="md"
      footer={
        isDetail ? (
          <Button variant="secondary" onClick={onClose} type="button">
            Tutup
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} type="button" disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" form={FORM_ID} loading={isPending}>
              {isEdit ? 'Simpan Perubahan' : 'Tambah Event'}
            </Button>
          </>
        )
      }
    >
      {/* ── Mode Detail ── */}
      {isDetail && event && (
        <div className="p-6 space-y-4">
          {/* Judul */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Judul
            </p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">{event.judul}</p>
          </div>

          {/* Tipe */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Tipe
            </p>
            <KalenderEventBadge tipe={event.tipe} isLibur={event.isLibur} />
          </div>

          {/* Tanggal Mulai */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Tanggal Mulai
            </p>
            <p className="text-sm text-gray-800 dark:text-gray-200">
              {formatTanggalSaja(event.tanggal)}
            </p>
          </div>

          {/* Tanggal Selesai */}
          {event.tanggalSelesai && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Tanggal Selesai
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-200">
                {formatTanggalSaja(event.tanggalSelesai)}
              </p>
            </div>
          )}

          {/* Deskripsi */}
          {event.deskripsi && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Deskripsi
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {event.deskripsi}
              </p>
            </div>
          )}

          {/* Pembuat */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Dibuat oleh
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {event.creator.profile?.namaLengkap ?? '—'}
            </p>
          </div>
        </div>
      )}

      {/* ── Mode Create / Edit ── */}
      {!isDetail && (
        <form id={FORM_ID} onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div ref={formTopRef} />

            {submitError && <ErrorBox message={submitError} />}

            {/* Judul */}
            <Input
              label="Judul"
              id="kalender-judul"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Libur Idul Fitri"
              error={errors.judul}
              disabled={isPending}
              maxLength={200}
            />

            {/* Tipe */}
            <Select
              label="Tipe"
              id="kalender-tipe"
              options={TIPE_OPTIONS}
              value={tipe}
              onChange={(e) => setTipe(e.target.value as TipeKalender | '')}
              placeholder="Pilih tipe event..."
              error={errors.tipe}
              disabled={isPending}
            />

            {/* Tanggal Mulai */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tanggal Mulai <span className="text-red-500">*</span>
              </label>
              <DateInput
                value={tanggal}
                onChange={setTanggal}
                hasError={!!errors.tanggal}
                disabled={isPending}
              />
              {errors.tanggal && (
                <p className="text-xs text-red-500">{errors.tanggal}</p>
              )}
            </div>

            {/* Tanggal Selesai */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tanggal Selesai{' '}
                <span className="text-gray-400 dark:text-gray-500 font-normal">(opsional)</span>
              </label>
              <DateInput
                value={tanggalSelesai}
                onChange={setTanggalSelesai}
                min={tanggal || undefined}
                hasError={!!errors.tanggalSelesai}
                disabled={isPending}
              />
              {errors.tanggalSelesai && (
                <p className="text-xs text-red-500">{errors.tanggalSelesai}</p>
              )}
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <label
                htmlFor="kalender-deskripsi"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Deskripsi{' '}
                <span className="text-gray-400 dark:text-gray-500 font-normal">(opsional)</span>
              </label>
              <textarea
                id="kalender-deskripsi"
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Deskripsi tambahan..."
                rows={3}
                disabled={isPending}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 py-2 outline-none transition focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>

            {/* isLibur toggle */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
              <div>
                <label
                  htmlFor="kalender-is-libur"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Tandai sebagai Hari Libur
                </label>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Tanggal ini akan ditandai merah di kalender
                </p>
              </div>
              <input
                id="kalender-is-libur"
                type="checkbox"
                checked={isLibur}
                onChange={(e) => setIsLibur(e.target.checked)}
                disabled={isPending}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </form>
      )}
    </Modal>
  )
}
