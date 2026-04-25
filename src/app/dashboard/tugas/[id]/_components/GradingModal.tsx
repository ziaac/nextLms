'use client'

import { useState, useEffect }     from 'react'
import {
  Download, FileText, MessageSquare,
  CheckCircle2, RefreshCw, Award, AlertTriangle, User,
  ChevronLeft, ChevronRight, Edit2, ClipboardList,
} from 'lucide-react'
import { Modal }                   from '@/components/ui/Modal'
import { Button }                  from '@/components/ui'
import { Spinner }                 from '@/components/ui/Spinner'
import { Badge }                   from '@/components/ui/Badge'
import { useSubmissionDetail, useUpdateSubmissionStatus } from '@/hooks/tugas/useTugas'
import { getPresignedUrl }         from '@/lib/api/upload.api'
import { toast }                   from 'sonner'
import { format }                  from 'date-fns'
import { id as localeId }          from 'date-fns/locale'
import { StatusPengumpulan, BentukTugas, TipeSoalKuis } from '@/types/tugas.types'
import type { TugasItem }          from '@/types/tugas.types'

// ── File Viewer ───────────────────────────────────────────────────────
function FileList({ fileKeys }: { fileKeys: string[] }) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  const handleOpen = async (key: string) => {
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

  if (fileKeys.length === 0) return null

  return (
    <div className="space-y-1.5">
      {fileKeys.map((key) => {
        const name = decodeURIComponent(key.split('/').pop() ?? key)
        return (
          <button
            key={key}
            type="button"
            onClick={() => { void handleOpen(key) }}
            disabled={loadingKey === key}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group text-left"
          >
            {loadingKey === key ? <Spinner /> : <Download size={14} className="text-gray-400 group-hover:text-blue-500 shrink-0" />}
            <FileText size={13} className="text-gray-400 shrink-0" />
            <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">{name}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Status Badge ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status: StatusPengumpulan }) {
  const map: Record<StatusPengumpulan, { label: string; variant: 'success' | 'warning' | 'info' | 'default' }> = {
    DRAFT:     { label: 'Draft',              variant: 'default' },
    SUBMITTED: { label: 'Menunggu Penilaian', variant: 'info'    },
    DINILAI:   { label: 'Sudah Dinilai',      variant: 'success' },
    REVISI:    { label: 'Perlu Revisi',       variant: 'warning' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

// ── Grading Form ──────────────────────────────────────────────────────
interface GradingFormProps {
  pengumpulanId:  string
  bobot:          number
  initialNilai?:  number | null
  initialCatatan?: string
  onDone: () => void
}

function GradingForm({ pengumpulanId, bobot, initialNilai, initialCatatan, onDone }: GradingFormProps) {
  const [nilai,   setNilai]   = useState(initialNilai != null ? String(initialNilai) : '')
  const [catatan, setCatatan] = useState(initialCatatan ?? '')
  const [action,  setAction]  = useState<StatusPengumpulan>(StatusPengumpulan.DINILAI)

  // Reset saat pengumpulanId berubah (navigasi antar siswa)
  useEffect(() => {
    setNilai(initialNilai != null ? String(initialNilai) : '')
    setCatatan(initialCatatan ?? '')
    setAction(StatusPengumpulan.DINILAI)
  }, [pengumpulanId, initialNilai, initialCatatan])

  const updateMutation = useUpdateSubmissionStatus()

  const handleSubmit = async () => {
    // Validasi nilai
    if (action === StatusPengumpulan.DINILAI) {
      if (!nilai.trim()) { toast.error('Masukkan nilai terlebih dahulu.'); return }
      const num = Number(nilai)
      if (isNaN(num) || num < 0 || num > bobot) {
        toast.error(`Nilai harus antara 0 dan ${bobot}.`)
        return
      }
    }
    // Validasi catatan wajib untuk REVISI
    if (action === StatusPengumpulan.REVISI && !catatan.trim()) {
      toast.error('Catatan wajib diisi agar siswa tahu apa yang harus direvisi.')
      return
    }

    try {
      await updateMutation.mutateAsync({
        id:      pengumpulanId,
        payload: {
          status:  action,
          catatan: catatan.trim() || undefined,
          ...(action === StatusPengumpulan.DINILAI ? { nilai: Number(nilai) } : {}),
        },
      })
      toast.success(action === StatusPengumpulan.DINILAI ? 'Nilai berhasil disimpan!' : 'Revisi berhasil dikirim ke siswa.')
      onDone()
    } catch {
      toast.error('Gagal menyimpan penilaian.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Pilih aksi */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAction(StatusPengumpulan.DINILAI)}
          className={[
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border transition-colors',
            action === StatusPengumpulan.DINILAI
              ? 'bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-600 dark:text-emerald-300'
              : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-emerald-300 hover:text-emerald-600',
          ].join(' ')}
        >
          <CheckCircle2 size={15} /> Beri Nilai
        </button>
        <button
          type="button"
          onClick={() => setAction(StatusPengumpulan.REVISI)}
          className={[
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border transition-colors',
            action === StatusPengumpulan.REVISI
              ? 'bg-amber-50 border-amber-400 text-amber-700 dark:bg-amber-900/20 dark:border-amber-600 dark:text-amber-300'
              : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-amber-300 hover:text-amber-600',
          ].join(' ')}
        >
          <RefreshCw size={15} /> Minta Revisi
        </button>
      </div>

      {/* Input nilai */}
      {action === StatusPengumpulan.DINILAI && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
            <Award size={12} /> Nilai (maks. {bobot})
          </label>
          <input
            type="number"
            min={0}
            max={bobot}
            value={nilai}
            onChange={(e) => setNilai(e.target.value)}
            placeholder={`0 – ${bobot}`}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      )}

      {/* Catatan guru */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
          <MessageSquare size={12} />
          Catatan untuk Siswa
          {action === StatusPengumpulan.REVISI && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          rows={3}
          placeholder={
            action === StatusPengumpulan.REVISI
              ? 'Jelaskan apa yang perlu direvisi... (wajib diisi)'
              : 'Opsional: komentar untuk siswa'
          }
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <Button
        className="w-full"
        loading={updateMutation.isPending}
        disabled={updateMutation.isPending}
        onClick={() => { void handleSubmit() }}
      >
        {action === StatusPengumpulan.DINILAI ? 'Simpan Nilai' : 'Kirim ke Siswa'}
      </Button>
    </div>
  )
}

// ── Nilai sudah ada — tampilan read-only + tombol ubah ─────────────
function NilaiReadOnly({
  nilai, catatan, bobot, onEdit,
}: { nilai: number; catatan?: string; bobot: number; onEdit: () => void }) {
  return (
    <div className="space-y-3">
      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1.5 mb-1">
          <Award size={12} /> Nilai Diberikan
        </p>
        <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">{nilai}</p>
        <p className="text-xs text-emerald-600/70 dark:text-emerald-500 mt-0.5">dari maks. {bobot} poin</p>
      </div>
      {catatan && (
        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 mb-1.5">Catatan Guru</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 italic">{catatan}</p>
        </div>
      )}
      <button
        type="button"
        onClick={onEdit}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-gray-500 border border-gray-200 dark:border-gray-700 hover:border-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <Edit2 size={12} /> Ubah Nilai
      </button>
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────────────
interface Props {
  open:           boolean
  pengumpulanId:  string | null
  tugas:          TugasItem
  students:       { pengumpulanId: string; namaLengkap: string }[]
  onNavigate:     (id: string) => void
  onClose:        () => void
}

export function GradingModal({ open, pengumpulanId, tugas, students, onNavigate, onClose }: Props) {
  const [editMode, setEditMode] = useState(false)

  // Reset edit mode saat buka modal atau navigasi
  useEffect(() => { setEditMode(false) }, [pengumpulanId, open])

  // Guard: jangan fetch jika modal tertutup atau id null
  const { data: sub, isLoading } = useSubmissionDetail(open && pengumpulanId ? pengumpulanId : null)

  // Navigasi prev/next
  const currentIdx = students.findIndex((s) => s.pengumpulanId === pengumpulanId)
  const hasPrev    = currentIdx > 0
  const hasNext    = currentIdx < students.length - 1

  const goPrev = () => { if (hasPrev) onNavigate(students[currentIdx - 1].pengumpulanId) }
  const goNext = () => { if (hasNext) onNavigate(students[currentIdx + 1].pengumpulanId) }

  // Derived
  const siswa      = sub?.siswa
  const namaSiswa  = siswa?.profile?.namaLengkap ?? 'Siswa'
  const nisnSiswa  = siswa?.profile?.nisn ?? ''
  const fileKeys   = Array.isArray(sub?.fileUrls) ? (sub.fileUrls as string[]) : []
  const hasFiles   = fileKeys.length > 0
  const hasJawaban = !!sub?.jawaban

  // Detect quiz submission — jawaban is JSON map of soalId → opsiId
  const isQuiz = tugas.bentuk === BentukTugas.QUIZ_MULTIPLE_CHOICE ||
                 tugas.bentuk === BentukTugas.QUIZ_MIX
  let quizAnswers: Record<string, string> = {}
  let isQuizJawaban = false
  if (isQuiz && sub?.jawaban) {
    try {
      const parsed = JSON.parse(sub.jawaban as string)
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        quizAnswers = parsed as Record<string, string>
        isQuizJawaban = true
      }
    } catch { /* regular text answer */ }
  }

  const nilaiEntry = sub?.penilaian?.[0]
  const nilaiSaved = nilaiEntry?.nilai ?? null
  const showReadOnly = sub?.status === StatusPengumpulan.DINILAI && !editMode && nilaiSaved != null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Penilaian Tugas"
      description={tugas.judul}
      size="2xl"
      fullHeight
    >
      {/* Navigasi antar siswa */}
      {students.length > 1 && (
        <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={goPrev}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
            {hasPrev ? students[currentIdx - 1].namaLengkap : 'Awal'}
          </button>
          <span className="text-xs text-gray-400">
            {currentIdx + 1} / {students.length} siswa
          </span>
          <button
            type="button"
            disabled={!hasNext}
            onClick={goNext}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {hasNext ? students[currentIdx + 1].namaLengkap : 'Akhir'}
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Konten */}
      {!pengumpulanId ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400 px-6 text-center">
          <AlertTriangle size={32} className="opacity-40" />
          <p className="text-sm">
            ID pengumpulan tidak tersedia. Pastikan backend mengembalikan field{' '}
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">pengumpulanId</code>{' '}
            pada response rekap.
          </p>
        </div>
      ) : isLoading || !sub ? (
        <div className="flex items-center justify-center py-20">
          {isLoading ? <Spinner /> : (
            <p className="text-sm text-gray-400">Data pengumpulan tidak ditemukan.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">

          {/* ── Kiri: Submission Viewer ─────────────────────── */}
          <div className="flex-1 min-w-0 p-5 overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-800 space-y-5">

            {/* Info siswa */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                <User size={16} className="text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{namaSiswa}</p>
                {nisnSiswa && <p className="text-xs text-gray-400">NISN: {nisnSiswa}</p>}
              </div>
              <div className="ml-auto shrink-0">
                <StatusBadge status={sub.status} />
              </div>
            </div>

            {/* Waktu submit */}
            {sub.tanggalSubmit && (
              <p className="text-xs text-gray-400">
                Dikumpulkan: {format(new Date(sub.tanggalSubmit), 'd MMM yyyy, HH:mm', { locale: localeId })}
                {sub.isLate && <span className="ml-2 text-amber-500 font-medium">· Terlambat</span>}
                {sub.revisiKe > 0 && <span className="ml-2 text-blue-400">· Revisi ke-{sub.revisiKe}</span>}
              </p>
            )}

            {/* File */}
            {hasFiles && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">File yang Dikumpulkan</p>
                <FileList fileKeys={fileKeys} />
              </div>
            )}

            {/* Quiz answers */}
            {isQuizJawaban && tugas.soalKuis && tugas.soalKuis.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <ClipboardList size={12} /> Jawaban Kuis
                </p>
                <div className="space-y-2">
                  {[...tugas.soalKuis].sort((a, b) => a.urutan - b.urutan).map((soal, idx) => {
                    const selId   = quizAnswers[soal.id]
                    const selOpsi = soal.opsi?.find((o) => o.id === selId)
                    const isMC    = soal.tipe === TipeSoalKuis.MULTIPLE_CHOICE
                    return (
                      <div key={soal.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs">
                        <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          {idx + 1}. {soal.pertanyaan}
                        </p>
                        {selId ? (
                          <p className={`flex items-center gap-1.5 ${
                            isMC
                              ? selOpsi?.isCorrect
                                ? 'text-emerald-600'
                                : 'text-red-500'
                              : 'text-blue-600'
                          }`}>
                            <CheckCircle2 size={11} />
                            {isMC ? (selOpsi?.teks ?? '—') : `${selId.slice(0, 80)}${selId.length > 80 ? '…' : ''}`}
                            {isMC && selOpsi?.isCorrect && <span className="ml-1 text-emerald-500">(Benar)</span>}
                            {isMC && !selOpsi?.isCorrect && <span className="ml-1 text-red-400">(Salah)</span>}
                          </p>
                        ) : (
                          <p className="text-gray-400 italic">Tidak dijawab</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Jawaban teks (non-quiz) */}
            {hasJawaban && !isQuizJawaban && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jawaban Teks</p>
                <div
                  className="prose dark:prose-invert max-w-none text-sm p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-auto"
                  dangerouslySetInnerHTML={{ __html: sub.jawaban! }}
                />
              </div>
            )}

            {!hasFiles && !hasJawaban && !isQuizJawaban && (
              <div className="flex flex-col items-center py-10 gap-2 text-gray-400">
                <FileText size={28} className="opacity-30" />
                <p className="text-sm">Tidak ada file atau jawaban yang dikumpulkan.</p>
              </div>
            )}
          </div>

          {/* ── Kanan: Panel Penilaian ───────────────────────── */}
          <div className="w-full lg:w-80 shrink-0 p-5 space-y-5 overflow-y-auto">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Tugas</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{tugas.judul}</p>
              <p className="text-xs text-gray-400 mt-0.5">Bobot maks. {tugas.bobot} poin</p>
            </div>

            {showReadOnly ? (
              <NilaiReadOnly
                nilai={nilaiSaved!}
                catatan={sub.catatan}
                bobot={tugas.bobot}
                onEdit={() => setEditMode(true)}
              />
            ) : (
              <GradingForm
                pengumpulanId={pengumpulanId}
                bobot={tugas.bobot}
                initialNilai={nilaiSaved}
                initialCatatan={sub.catatan}
                onDone={() => {
                  setEditMode(false)
                  // Jika masih ada siswa berikutnya, otomatis navigasi
                  if (hasNext) onNavigate(students[currentIdx + 1].pengumpulanId)
                  else onClose()
                }}
              />
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
