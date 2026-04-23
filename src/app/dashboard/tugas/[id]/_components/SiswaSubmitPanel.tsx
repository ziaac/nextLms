'use client'

import { useState, useCallback }   from 'react'
import {
  CheckCircle2, Clock, RefreshCw, AlertTriangle,
  FileText, Upload, X, Download, Award, MessageSquare,
} from 'lucide-react'
import { format }                  from 'date-fns'
import { id as localeId }          from 'date-fns/locale'
import { Button }                  from '@/components/ui'
import { Spinner }                 from '@/components/ui/Spinner'
import { RichTextEditor }          from '@/components/ui/RichTextEditor'
import { useSubmitTugas, useMySubmission } from '@/hooks/tugas/useTugas'
import { uploadApi }               from '@/lib/api/upload.api'
import { getPresignedUrl }         from '@/lib/api/upload.api'
import { toast }                   from 'sonner'
import type { TugasItem, StatusPengumpulan } from '@/types/tugas.types'
import { BentukTugas }             from '@/types/tugas.types'

// ── Status Badge ─────────────────────────────────────────────────────
const STATUS_CONFIG: Record<StatusPengumpulan, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT:     { label: 'Draft',            color: 'text-gray-500 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700', icon: <Clock size={13} /> },
  SUBMITTED: { label: 'Menunggu Penilaian', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800', icon: <Clock size={13} /> },
  DINILAI:   { label: 'Sudah Dinilai',    color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800', icon: <CheckCircle2 size={13} /> },
  REVISI:    { label: 'Perlu Revisi',     color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800', icon: <RefreshCw size={13} /> },
}

function StatusBadge({ status }: { status: StatusPengumpulan }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

// ── File Upload Area ──────────────────────────────────────────────────
function FileUploadArea({
  files, onAdd, onRemove, disabled, allowedTypes, maxSizeMb,
}: {
  files:       { key: string; name: string }[]
  onAdd:       (key: string, name: string) => void
  onRemove:    (key: string) => void
  disabled?:   boolean
  allowedTypes?: string[]
  maxSizeMb?:  number
}) {
  const [uploading, setUploading] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    // Cek ukuran
    if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`Ukuran file maksimal ${maxSizeMb} MB`)
      return
    }
    setUploading(true)
    try {
      const key = await uploadApi.tugas(file)
      onAdd(key, file.name)
    } catch {
      toast.error('Upload gagal. Coba lagi.')
    } finally {
      setUploading(false)
    }
  }, [maxSizeMb, onAdd])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { void handleFile(file); e.target.value = '' }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  const acceptStr = allowedTypes && allowedTypes.length > 0
    ? allowedTypes.map((t) => (t.startsWith('.') ? t : `.${t}`)).join(',')
    : undefined

  return (
    <div className="space-y-2">
      {/* Uploaded files */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f) => (
            <div key={f.key} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <FileText size={13} className="text-emerald-600 shrink-0" />
              <span className="text-xs text-emerald-800 dark:text-emerald-200 flex-1 truncate">{f.name}</span>
              {!disabled && (
                <button type="button" onClick={() => onRemove(f.key)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {!disabled && (
        <label
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors"
        >
          {uploading
            ? <Spinner />
            : <Upload size={20} className="text-gray-400" />
          }
          <span className="text-sm text-gray-500">
            {uploading ? 'Mengupload...' : 'Klik atau drag & drop file'}
          </span>
          {allowedTypes && allowedTypes.length > 0 && (
            <span className="text-xs text-gray-400">{allowedTypes.join(', ')}</span>
          )}
          {maxSizeMb && (
            <span className="text-xs text-gray-400">Maks. {maxSizeMb} MB</span>
          )}
          <input
            type="file"
            accept={acceptStr}
            className="hidden"
            onChange={handleChange}
            disabled={uploading || disabled}
          />
        </label>
      )}
    </div>
  )
}

// ── Nilai Display ─────────────────────────────────────────────────────
function NilaiDisplay({ penilaian, catatan }: { penilaian?: any[]; catatan?: string }) {
  const nilaiEntry = penilaian?.[0]
  const nilai = nilaiEntry?.nilai ?? nilaiEntry?.score ?? null

  return (
    <div className="space-y-3">
      {nilai !== null && nilai !== undefined && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <Award size={22} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Nilai Kamu</p>
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{nilai}</p>
          </div>
        </div>
      )}
      {catatan && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-2">
            <MessageSquare size={12} /> Catatan dari Guru
          </p>
          <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">{catatan}</p>
        </div>
      )}
    </div>
  )
}

// ── Submitted File Viewer ─────────────────────────────────────────────
function SubmittedFiles({ fileKeys }: { fileKeys: string[] }) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  const handleDownload = async (key: string) => {
    setLoadingKey(key)
    try {
      const url = await getPresignedUrl(key)
      window.open(url, '_blank')
    } catch {
      toast.error('Gagal membuka file')
    } finally {
      setLoadingKey(null)
    }
  }

  if (!fileKeys || fileKeys.length === 0) return null

  return (
    <div className="space-y-1.5">
      {fileKeys.map((key) => {
        const name = key.split('/').pop() ?? key
        return (
          <button
            key={key}
            type="button"
            onClick={() => { void handleDownload(key) }}
            disabled={loadingKey === key}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
          >
            {loadingKey === key ? <Spinner /> : <Download size={13} className="text-gray-400 shrink-0" />}
            <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">{name}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────
interface Props {
  tugas:   TugasItem
  tugasId: string
}

export function SiswaSubmitPanel({ tugas, tugasId }: Props) {
  const { data: submission, isLoading: loadingSubmission } = useMySubmission(tugasId)
  const submitMutation = useSubmitTugas()

  // Form state
  const [files,   setFiles]   = useState<{ key: string; name: string }[]>([])
  const [jawaban, setJawaban] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const needsFile  = tugas.bentuk === BentukTugas.FILE_SUBMISSION || tugas.bentuk === BentukTugas.HYBRID
  const needsText  = tugas.bentuk === BentukTugas.RICH_TEXT       || tugas.bentuk === BentukTugas.HYBRID
  const isQuiz     = tugas.bentuk === BentukTugas.QUIZ_MULTIPLE_CHOICE || tugas.bentuk === BentukTugas.QUIZ_MIX

  const now        = new Date()
  const deadline   = new Date(tugas.tanggalSelesai)
  const openAt     = new Date(tugas.tanggalMulai)
  const isOpen     = now >= openAt
  const isPast     = now > deadline
  const isLateOk   = isPast && tugas.allowLateSubmission
  const isClosed   = isPast && !tugas.allowLateSubmission

  const canSubmit  = isOpen && (!isPast || isLateOk) && !isClosed

  const handleAddFile   = (key: string, name: string) => setFiles((p) => [...p, { key, name }])
  const handleRemoveFile = (key: string) => setFiles((p) => p.filter((f) => f.key !== key))

  const handleSubmit = async () => {
    if (needsFile && files.length === 0) {
      toast.error('Upload minimal satu file.')
      return
    }
    if (needsText && !jawaban.trim()) {
      toast.error('Isi jawaban teks terlebih dahulu.')
      return
    }
    setSubmitting(true)
    try {
      await submitMutation.mutateAsync({
        tugasId,
        payload: {
          ...(needsFile ? { fileUrls: files.map((f) => f.key) } : {}),
          ...(needsText ? { jawaban } : {}),
        },
      })
      toast.success('Tugas berhasil dikumpulkan!')
      setFiles([])
      setJawaban('')
    } catch {
      toast.error('Gagal mengumpulkan tugas. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Quiz placeholder ──────────────────────────────────────────
  if (isQuiz) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-3">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Pengerjaan Kuis</h3>
        <div className="flex flex-col items-center py-8 gap-3 text-gray-400">
          <Clock size={32} className="opacity-40" />
          <p className="text-sm text-center">Fitur kuis interaktif segera hadir.<br />Hubungi guru untuk pengerjaan manual.</p>
        </div>
      </div>
    )
  }

  // ── Loading ───────────────────────────────────────────────────
  if (loadingSubmission) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 flex justify-center py-10">
        <Spinner />
      </div>
    )
  }

  // ── Already Submitted ─────────────────────────────────────────
  if (submission) {
    const status = submission.status
    const isRevisi = status === 'REVISI'
    const isDinilai = status === 'DINILAI'

    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Pengumpulan Tugas</h3>
          <StatusBadge status={status} />
        </div>

        {/* Waktu submit */}
        {submission.tanggalSubmit && (
          <p className="text-xs text-gray-400">
            Dikumpulkan: {format(new Date(submission.tanggalSubmit), 'd MMM yyyy, HH:mm', { locale: localeId })}
            {submission.isLate && (
              <span className="ml-2 text-amber-500 font-medium">· Terlambat</span>
            )}
          </p>
        )}

        {/* Nilai (jika sudah dinilai) */}
        {isDinilai && (
          <NilaiDisplay penilaian={submission.penilaian} catatan={submission.catatan} />
        )}

        {/* Catatan revisi */}
        {isRevisi && submission.catatan && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-2">
              <AlertTriangle size={12} /> Catatan Revisi dari Guru
            </p>
            <p className="text-sm text-amber-900 dark:text-amber-200">{submission.catatan}</p>
          </div>
        )}

        {/* Preview jawaban yang dikumpul */}
        {submission.fileUrls && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">File yang Dikumpulkan</p>
            <SubmittedFiles fileKeys={Array.isArray(submission.fileUrls) ? submission.fileUrls : []} />
          </div>
        )}
        {submission.jawaban && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Jawaban Teks</p>
            <div
              className="prose dark:prose-invert max-w-none text-sm p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
              dangerouslySetInnerHTML={{ __html: submission.jawaban }}
            />
          </div>
        )}

        {/* Revisi: tampilkan form ulang */}
        {isRevisi && canSubmit && (
          <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Submit Revisi (ke-{submission.revisiKe + 1})</p>
            {needsFile && (
              <FileUploadArea
                files={files}
                onAdd={handleAddFile}
                onRemove={handleRemoveFile}
                allowedTypes={tugas.allowedFileTypes}
                maxSizeMb={tugas.maxFileSize ? tugas.maxFileSize / (1024 * 1024) : undefined}
              />
            )}
            {needsText && (
              <RichTextEditor
                value={jawaban}
                onChange={setJawaban}
                placeholder="Tulis ulang jawabanmu di sini..."
                minHeight="160px"
              />
            )}
            <Button
              loading={submitting}
              disabled={submitting}
              onClick={() => { void handleSubmit() }}
              className="w-full"
            >
              Kirim Revisi
            </Button>
          </div>
        )}
      </div>
    )
  }

  // ── Not Yet Submitted ─────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-5">
      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Kumpulkan Tugas</h3>

      {/* Belum dibuka */}
      {!isOpen && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-500">
          <Clock size={15} /> Tugas dibuka pada {format(openAt, 'd MMM yyyy, HH:mm', { locale: localeId })}
        </div>
      )}

      {/* Sudah ditutup */}
      {isClosed && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle size={15} /> Waktu pengumpulan sudah ditutup. Terlambat tidak diizinkan.
        </div>
      )}

      {/* Peringatan terlambat */}
      {isLateOk && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle size={13} /> Deadline sudah lewat. Pengumpulan terlambat akan mendapat penalti{' '}
          {tugas.lateSubmissionPenalty ?? 0}%.
        </div>
      )}

      {/* Form submit */}
      {canSubmit && (
        <>
          {needsFile && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Upload File</p>
              <FileUploadArea
                files={files}
                onAdd={handleAddFile}
                onRemove={handleRemoveFile}
                allowedTypes={tugas.allowedFileTypes}
                maxSizeMb={tugas.maxFileSize ? tugas.maxFileSize / (1024 * 1024) : undefined}
              />
            </div>
          )}

          {needsText && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Jawaban Teks</p>
              <RichTextEditor
                value={jawaban}
                onChange={setJawaban}
                placeholder="Tulis jawabanmu di sini..."
                minHeight="200px"
              />
            </div>
          )}

          <Button
            loading={submitting}
            disabled={submitting || (!files.length && !jawaban.trim())}
            onClick={() => { void handleSubmit() }}
            className="w-full"
          >
            Kumpulkan Tugas
          </Button>
        </>
      )}
    </div>
  )
}
