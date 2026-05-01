'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal, Button, Input, Select, DateInput } from '@/components/ui'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { useCreateAnnouncement, useUpdateAnnouncement } from '@/hooks/announcement'
import { getErrorMessage } from '@/lib/utils'
import type { Announcement, AnnouncementPriority } from '@/types/announcement.types'
import type { UserRole } from '@/types/enums'

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'KEPALA_SEKOLAH',
  'WAKIL_KEPALA',
  'STAFF_TU',
  'STAFF_KEUANGAN',
  'GURU',
  'WALI_KELAS',
  'SISWA',
  'ORANG_TUA',
]

const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN:    'Super Admin',
  ADMIN:          'Admin',
  KEPALA_SEKOLAH: 'Kepala Sekolah',
  WAKIL_KEPALA:   'Wakil Kepala',
  STAFF_TU:       'Staff TU',
  STAFF_KEUANGAN: 'Staff Keuangan',
  GURU:           'Guru',
  WALI_KELAS:     'Wali Kelas',
  SISWA:          'Siswa',
  ORANG_TUA:      'Orang Tua',
}

const PRIORITY_OPTIONS = [
  { value: 'LOW',    label: 'Rendah' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH',   label: 'Tinggi' },
  { value: 'URGENT', label: 'Mendesak' },
]

const FORM_ID = 'announcement-form'

// ─── ErrorBox ─────────────────────────────────────────────────────────────────

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 px-4 py-3">
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnnouncementModalProps {
  open: boolean
  onClose: () => void
  editItem?: Announcement | null
}

interface FormErrors {
  judul?:     string
  konten?:    string
  startDate?: string
  endDate?:   string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Cek apakah konten RichTextEditor kosong (string kosong atau hanya <p></p> / whitespace) */
function isKontenEmpty(html: string): boolean {
  if (!html || !html.trim()) return true
  // Strip semua tag HTML, cek apakah ada teks yang tersisa
  const stripped = html.replace(/<[^>]*>/g, '').trim()
  return stripped.length === 0
}

/** Konversi date string YYYY-MM-DD ke ISO datetime string (awal hari WITA = UTC+8) */
function dateToIso(dateStr: string): string {
  // Kirim sebagai YYYY-MM-DDT00:00:00+08:00
  return `${dateStr}T00:00:00+08:00`
}

/** Ekstrak YYYY-MM-DD dari ISO datetime string */
function isoToDate(isoStr: string): string {
  return isoStr.slice(0, 10)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnnouncementModal({ open, onClose, editItem }: AnnouncementModalProps) {
  const isEdit = !!editItem

  // Form state
  const [judul,      setJudul]      = useState('')
  const [konten,     setKonten]     = useState('')
  const [targetRole, setTargetRole] = useState<UserRole[]>([])
  const [priority,   setPriority]   = useState<AnnouncementPriority>('NORMAL')
  const [startDate,  setStartDate]  = useState('')
  const [endDate,    setEndDate]    = useState('')
  const [isActive,   setIsActive]   = useState(true)
  const [isPinned,   setIsPinned]   = useState(false)

  const [errors,      setErrors]      = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const formTopRef = useRef<HTMLDivElement>(null)

  const createMutation = useCreateAnnouncement()
  const updateMutation = useUpdateAnnouncement()
  const isPending = createMutation.isPending || updateMutation.isPending

  // ─── Pre-fill form saat modal dibuka / editItem berubah ─────────────────────

  useEffect(() => {
    if (!open) return
    setSubmitError(null)
    setErrors({})

    if (isEdit && editItem) {
      setJudul(editItem.judul)
      setKonten(editItem.konten)
      setTargetRole((editItem.targetRole as UserRole[]) ?? [])
      setPriority(editItem.priority)
      setStartDate(isoToDate(editItem.startDate))
      setEndDate(editItem.endDate ? isoToDate(editItem.endDate) : '')
      setIsActive(editItem.isActive)
      setIsPinned(editItem.isPinned)
    } else {
      setJudul('')
      setKonten('')
      setTargetRole([])
      setPriority('NORMAL')
      setStartDate('')
      setEndDate('')
      setIsActive(true)
      setIsPinned(false)
    }
  }, [open, editItem?.id])

  // ─── targetRole toggle ──────────────────────────────────────────────────────

  function toggleRole(role: UserRole) {
    setTargetRole((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    )
  }

  function toggleAllRoles() {
    setTargetRole((prev) => (prev.length === ALL_ROLES.length ? [] : [...ALL_ROLES]))
  }

  // ─── Validation ─────────────────────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: FormErrors = {}

    if (!judul.trim()) {
      newErrors.judul = 'Judul wajib diisi'
    } else if (judul.trim().length > 250) {
      newErrors.judul = 'Judul maksimal 250 karakter'
    }

    if (isKontenEmpty(konten)) {
      newErrors.konten = 'Konten wajib diisi'
    }

    if (!startDate) {
      newErrors.startDate = 'Tanggal mulai wajib diisi'
    }

    if (endDate && startDate && endDate < startDate) {
      newErrors.endDate = 'Tanggal selesai harus sama atau setelah tanggal mulai'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)

    if (!validate()) return

    const dto = {
      judul:      judul.trim(),
      konten,
      targetRole: targetRole.length > 0 ? targetRole : undefined,
      priority,
      startDate:  dateToIso(startDate),
      ...(endDate ? { endDate: dateToIso(endDate) } : {}),
      isActive,
      isPinned,
    }

    try {
      if (isEdit && editItem) {
        await updateMutation.mutateAsync({ id: editItem.id, dto })
      } else {
        await createMutation.mutateAsync(dto)
      }
      onClose()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const modalTitle = isEdit ? 'Edit Pengumuman' : 'Tambah Pengumuman'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modalTitle}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button" disabled={isPending}>
            Batal
          </Button>
          <Button type="submit" form={FORM_ID} loading={isPending}>
            {isEdit ? 'Simpan Perubahan' : 'Tambah Pengumuman'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit}>
        <div className="p-6 space-y-5">
          <div ref={formTopRef} />

          {submitError && <ErrorBox message={submitError} />}

          {/* Judul */}
          <Input
            label="Judul"
            id="announcement-judul"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Judul pengumuman..."
            error={errors.judul}
            disabled={isPending}
            maxLength={250}
          />

          {/* Konten */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Konten <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              value={konten}
              onChange={setKonten}
              placeholder="Tulis isi pengumuman di sini..."
              minHeight="180px"
              disabled={isPending}
              className={
                errors.konten
                  ? 'border-red-400 dark:border-red-500/70'
                  : undefined
              }
            />
            {errors.konten && (
              <p className="text-xs text-red-500">{errors.konten}</p>
            )}
          </div>

          {/* Priority */}
          <Select
            label="Prioritas"
            id="announcement-priority"
            options={PRIORITY_OPTIONS}
            value={priority}
            onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
            disabled={isPending}
          />

          {/* Tanggal Mulai */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tanggal Mulai <span className="text-red-500">*</span>
            </label>
            <DateInput
              value={startDate}
              onChange={setStartDate}
              hasError={!!errors.startDate}
              disabled={isPending}
            />
            {errors.startDate && (
              <p className="text-xs text-red-500">{errors.startDate}</p>
            )}
          </div>

          {/* Tanggal Selesai */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tanggal Selesai{' '}
              <span className="text-gray-400 dark:text-gray-500 font-normal">(opsional)</span>
            </label>
            <DateInput
              value={endDate}
              onChange={setEndDate}
              min={startDate || undefined}
              hasError={!!errors.endDate}
              disabled={isPending}
            />
            {errors.endDate && (
              <p className="text-xs text-red-500">{errors.endDate}</p>
            )}
          </div>

          {/* Target Role */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Target Role{' '}
                <span className="text-gray-400 dark:text-gray-500 font-normal">
                  (kosong = semua role)
                </span>
              </label>
              <button
                type="button"
                onClick={toggleAllRoles}
                disabled={isPending}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {targetRole.length === ALL_ROLES.length ? 'Hapus semua' : 'Pilih semua'}
              </button>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 grid grid-cols-2 gap-2">
              {ALL_ROLES.map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={targetRole.includes(role)}
                    onChange={() => toggleRole(role)}
                    disabled={isPending}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {ROLE_LABEL[role]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* isActive toggle */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
            <div>
              <label
                htmlFor="announcement-is-active"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Aktif
              </label>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Pengumuman akan ditampilkan kepada pengguna
              </p>
            </div>
            <input
              id="announcement-is-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isPending}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>

          {/* isPinned toggle */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
            <div>
              <label
                htmlFor="announcement-is-pinned"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Pin Pengumuman
              </label>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Pengumuman akan selalu muncul di bagian atas daftar
              </p>
            </div>
            <input
              id="announcement-is-pinned"
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              disabled={isPending}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
