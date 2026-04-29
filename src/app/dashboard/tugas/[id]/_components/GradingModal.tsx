'use client'

import { useState, useEffect } from 'react'
import {
  Download, FileText, MessageSquare,
  CheckCircle2, Award, AlertTriangle,
  ChevronLeft, ChevronRight,
  RotateCcw, Loader2, Star,
} from 'lucide-react'
import { Modal }    from '@/components/ui/Modal'
import { Button }   from '@/components/ui'
import { Spinner }  from '@/components/ui/Spinner'
import { Badge }    from '@/components/ui/Badge'
import {
  useSubmissionDetail,
  useUpdateSubmissionStatus,
  useNilaiManual,
  useKembalikanPengumpulan,
} from '@/hooks/tugas/useTugas'
import { getPresignedUrl }      from '@/lib/api/upload.api'
import { toast }                from 'sonner'
import { format }               from 'date-fns'
import { id as localeId }       from 'date-fns/locale'
import {
  StatusPengumpulan,
  BentukTugas,
  TujuanTugas,
} from '@/types/tugas.types'
import type { TugasItem }       from '@/types/tugas.types'
import { WorksheetGradingView } from '@/components/worksheet/WorksheetGradingView'
import { QuizGradingView, getQuizAutoData } from '@/components/quiz/QuizGradingView'
import { cn }                   from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────
export interface StudentNavItem {
  pengumpulanId?: string
  siswaId:        string
  namaLengkap:    string
}

// ── File list ─────────────────────────────────────────────────────────
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
            {loadingKey === key
              ? <Loader2 size={14} className="animate-spin text-gray-400 shrink-0" />
              : <Download size={14} className="text-gray-400 group-hover:text-blue-500 shrink-0" />}
            <FileText size={13} className="text-gray-400 shrink-0" />
            <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">{name}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────
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

// ── Panel Penilaian ───────────────────────────────────────────────────
interface PenilaianPanelProps {
  /** null = belum submit (manual only) */
  pengumpulanId:  string | null
  siswaId:        string
  tugasId:        string
  bobot:          number
  isQuiz:         boolean
  isBelumSubmit:  boolean
  /** Nilai autograding dari WorksheetGradingView (undefined = bukan worksheet/autograding) */
  autoNilai?:     number | null
  autoTotal?:     number
  /** Nilai & catatan yang sudah tersimpan */
  savedNilai?:    number | null
  savedCatatan?:  string
  tujuan:         TujuanTugas
  status?:        StatusPengumpulan
  onDone:         () => void
}

function PenilaianPanel({
  pengumpulanId, siswaId, tugasId, bobot, isQuiz,
  isBelumSubmit, autoNilai, autoTotal,
  savedNilai, savedCatatan, tujuan, status, onDone,
}: PenilaianPanelProps) {
  const [nilai,          setNilai]          = useState(savedNilai != null ? String(savedNilai) : '')
  const [catatan,        setCatatan]        = useState(savedCatatan ?? '')
  const [showKembalikan, setShowKembalikan] = useState(false)
  const [kembalikanNote, setKembalikanNote] = useState('')

  useEffect(() => {
    setNilai(savedNilai != null ? String(savedNilai) : '')
    setCatatan(savedCatatan ?? '')
    setShowKembalikan(false)
    setKembalikanNote('')
  }, [pengumpulanId, siswaId, savedNilai, savedCatatan])

  const updateMut     = useUpdateSubmissionStatus()
  const nilaiManualMut = useNilaiManual()
  const kembalikanMut = useKembalikanPengumpulan()

  const isPending = updateMut.isPending || nilaiManualMut.isPending
  const hasAutoGrading = autoTotal != null && autoTotal > 0

  const canKembalikan = !!pengumpulanId &&
    status === StatusPengumpulan.SUBMITTED &&
    tujuan !== TujuanTugas.UTS &&
    tujuan !== TujuanTugas.UAS &&
    !isQuiz

  const handleSimpan = async () => {
    const num = Number(nilai)
    if (!nilai.trim() || isNaN(num) || num < 0 || num > bobot) {
      toast.error(`Nilai harus antara 0 dan ${bobot}.`)
      return
    }
    try {
      if (isBelumSubmit) {
        await nilaiManualMut.mutateAsync({
          tugasId,
          payload: { siswaId, nilai: num, catatan: catatan.trim() || undefined },
        })
      } else {
        await updateMut.mutateAsync({
          id:      pengumpulanId!,
          payload: { status: StatusPengumpulan.DINILAI, nilai: num, catatan: catatan.trim() || undefined },
        })
      }
      toast.success('Nilai berhasil disimpan!')
      onDone()
    } catch {
      toast.error('Gagal menyimpan nilai.')
    }
  }

  const handleKembalikan = async () => {
    if (!pengumpulanId) return
    try {
      await kembalikanMut.mutateAsync(pengumpulanId)
      toast.success('Dikembalikan ke siswa untuk diperbaiki.')
      setShowKembalikan(false)
      onDone()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Gagal mengembalikan.')
    }
  }

  return (
    <div className="space-y-4">

      {/* Banner belum submit */}
      {isBelumSubmit && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Belum mengumpulkan</p>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-500 mt-0.5">Nilai disimpan sebagai input manual guru.</p>
          </div>
        </div>
      )}

      {/* Grid nilai: 2 kolom jika ada autograding, 1 kolom jika tidak */}
      <div className={cn(
        'gap-3',
        hasAutoGrading && !isBelumSubmit ? 'grid grid-cols-2' : 'flex flex-col',
      )}>

        {/* Kolom 1: Nilai Otomatis — hanya tampil jika ada autograding dan sudah submit */}
        {hasAutoGrading && !isBelumSubmit && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <CheckCircle2 size={11} className="text-blue-500" />
              Nilai Otomatis
            </label>
            <div className="w-full px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-2xl font-bold text-center select-none">
              {autoNilai ?? '—'}
            </div>
            <p className="text-[10px] text-gray-400 text-center">readonly · dari sistem</p>
          </div>
        )}

        {/* Kolom 2 (atau satu-satunya): Nilai Guru */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Award size={11} className="text-emerald-500" />
            {isBelumSubmit ? 'Nilai Manual' : hasAutoGrading ? 'Nilai Guru' : `Nilai (maks. ${bobot})`}
          </label>
          <input
            type="number"
            min={0}
            max={bobot}
            value={nilai}
            onChange={(e) => setNilai(e.target.value)}
            placeholder={`0 – ${bobot}`}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          {hasAutoGrading && !isBelumSubmit && (
            <p className="text-[10px] text-gray-400 text-center">override autograding</p>
          )}
        </div>
      </div>

      {/* Catatan */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <MessageSquare size={11} /> Catatan <span className="font-normal">(opsional)</span>
        </label>
        <textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          rows={3}
          placeholder="Komentar atau umpan balik untuk siswa..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Simpan */}
      <Button className="w-full" loading={isPending} disabled={isPending} onClick={() => { void handleSimpan() }}>
        Simpan Nilai
      </Button>

      {/* Kembalikan untuk Direvisi */}
      {canKembalikan && (
        <div className="pt-1">
          {!showKembalikan ? (
            <button
              type="button"
              onClick={() => setShowKembalikan(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
            >
              <RotateCcw size={13} /> Kembalikan untuk Direvisi
            </button>
          ) : (
            <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10 p-3.5 space-y-3">
              <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-1.5">
                <RotateCcw size={12} /> Kembalikan untuk Direvisi
              </p>
              <textarea
                value={kembalikanNote}
                onChange={(e) => setKembalikanNote(e.target.value)}
                rows={2}
                placeholder="Catatan untuk siswa (opsional)..."
                className="w-full px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowKembalikan(false)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={kembalikanMut.isPending}
                  onClick={() => { void handleKembalikan() }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {kembalikanMut.isPending
                    ? <><Loader2 size={11} className="animate-spin" /> Memproses…</>
                    : <><RotateCcw size={11} /> Konfirmasi</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────────────
interface Props {
  open:          boolean
  pengumpulanId: string | null
  siswaId?:      string
  namaSiswa?:    string
  tugas:         TugasItem
  students:      StudentNavItem[]
  onNavigate:    (item: StudentNavItem) => void
  onClose:       () => void
}

export function GradingModal({
  open, pengumpulanId, siswaId, namaSiswa,
  tugas, students, onNavigate, onClose,
}: Props) {
  // Autograding data dari WorksheetGradingView
  const [autoData, setAutoData] = useState<{
    autoCorrect: number; autoTotal: number; hasManual: boolean; pengumpulanId?: string
  } | null>(null)

  const { data: sub, isLoading } = useSubmissionDetail(
    open && pengumpulanId ? pengumpulanId : null
  )

  // Reset autograding data saat navigasi
  useEffect(() => {
    setAutoData(null)
  }, [pengumpulanId, siswaId, open])

  // Navigasi
  const currentSiswaId = siswaId ?? sub?.siswa?.id ?? null
  const currentIdx     = students.findIndex((s) => s.siswaId === currentSiswaId)
  const hasPrev        = currentIdx > 0
  const hasNext        = currentIdx < students.length - 1
  const goPrev = () => { if (hasPrev) onNavigate(students[currentIdx - 1]) }
  const goNext = () => { if (hasNext) onNavigate(students[currentIdx + 1]) }
  const goNextOrClose = () => { if (hasNext) onNavigate(students[currentIdx + 1]); else onClose() }

  // Derived
  const belumSubmit  = !pengumpulanId && !!siswaId
  const isWorksheet  = tugas.bentuk === BentukTugas.INTERACTIVE_WORKSHEET
  const isQuiz       = tugas.bentuk === BentukTugas.QUIZ_MULTIPLE_CHOICE ||
                       tugas.bentuk === BentukTugas.QUIZ_MIX
  const fileKeys     = Array.isArray(sub?.fileUrls) ? (sub.fileUrls as string[]) : []
  const hasFiles     = fileKeys.length > 0
  const hasJawaban   = !!sub?.jawaban

  // Quiz answers — hanya untuk non-quiz bentuk (teks biasa)
  let quizAnswers: Record<string, string> = {}
  let isQuizJawaban = false
  if (isQuiz && sub?.jawaban) {
    try {
      const parsed = JSON.parse(sub.jawaban as string)
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        quizAnswers   = parsed as Record<string, string>
        isQuizJawaban = true
      }
    } catch { /* teks biasa */ }
  }

  // Hitung nilai autograding sebagai angka (skala bobot tugas)
  const autoNilaiScaled = autoData && autoData.autoTotal > 0
    ? Math.round((autoData.autoCorrect / autoData.autoTotal) * tugas.bobot)
    : null

  // Quiz autograding — dihitung langsung dari soalKuis + jawaban siswa
  const quizAutoData = isQuiz && sub?.jawaban && tugas.soalKuis?.length
    ? getQuizAutoData(tugas.soalKuis, sub.jawaban, tugas.bobot)
    : null

  // Nilai autograding final (worksheet atau quiz)
  const finalAutoNilai  = isWorksheet ? autoNilaiScaled : (quizAutoData?.autoNilai ?? null)
  const finalAutoTotal  = isWorksheet ? (autoData?.autoTotal ?? 0) : (quizAutoData?.autoTotal ?? 0)

  const savedNilai   = sub?.penilaian?.[0]?.nilai ?? null
  const savedCatatan = sub?.catatan ?? ''

  // Nama siswa untuk navigasi
  const namaSiswaDisplay = sub?.siswa?.profile?.namaLengkap ?? namaSiswa ?? 'Siswa'
  const tanggalSubmit    = sub?.tanggalSubmit

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Penilaian Tugas"
      description={tugas.judul}
      size="3xl"
      fullHeight
    >
      {/* ── Navigasi siswa ── */}
      {students.length > 1 && (
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={goPrev}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
            {hasPrev ? students[currentIdx - 1].namaLengkap : 'Awal'}
          </button>
          <div className="text-center">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{namaSiswaDisplay}</p>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-400 tabular-nums">{currentIdx + 1} / {students.length}</span>
              {sub && <StatusBadge status={sub.status} />}
              {belumSubmit && <Badge variant="default">Belum Kumpul</Badge>}
              {tanggalSubmit && (
                <span className="text-[10px] text-gray-400">
                  · {format(new Date(tanggalSubmit), 'd MMM HH:mm', { locale: localeId })}
                  {sub?.isLate && <span className="text-amber-500 ml-1">terlambat</span>}
                </span>
              )}
            </div>
          </div>
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

      {/* ── Konten ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Loading */}
        {!belumSubmit && isLoading && (
          <div className="flex items-center justify-center py-20"><Spinner /></div>
        )}

        {/* Tidak ada data */}
        {!belumSubmit && !isLoading && !sub && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400 text-center px-6">
            <AlertTriangle size={28} className="opacity-40" />
            <p className="text-sm">Data pengumpulan tidak ditemukan.</p>
          </div>
        )}

        {/* Konten tersedia */}
        {(belumSubmit || (!isLoading && sub)) && (
          /**
           * Layout:
           * - Mobile: 1 kolom (pekerjaan atas, penilaian bawah)
           * - Desktop: 2 kolom (pekerjaan kiri, penilaian kanan sticky)
           */
          <div className="flex flex-col lg:flex-row lg:items-start gap-0 min-h-full">

            {/* ── Kolom kiri: Pekerjaan Siswa ── */}
            <div className="flex-1 min-w-0 p-5 space-y-3 lg:border-r border-gray-100 dark:border-gray-800">

              {/* Worksheet inline */}
              {isWorksheet && currentSiswaId && !belumSubmit && (
                <WorksheetGradingView
                  tugasId={tugas.id}
                  siswaId={currentSiswaId}
                  namaSiswa={namaSiswaDisplay}
                  hideGradingForm
                  onAutoGradeData={setAutoData}
                />
              )}

              {/* File */}
              {hasFiles && (
                <div className="space-y-2">
                  {!isQuiz && !isWorksheet && (
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      File yang Dikumpulkan
                    </p>
                  )}
                  <FileList fileKeys={fileKeys} />
                </div>
              )}

              {/* Quiz — inline dengan QuizGradingView */}
              {isQuiz && !belumSubmit && sub && tugas.soalKuis?.length && (
                <QuizGradingView
                  soalKuis={tugas.soalKuis}
                  jawabanRaw={sub.jawaban}
                  bobot={tugas.bobot}
                />
              )}

              {/* Jawaban teks — RICH_TEXT / HYBRID (bukan quiz, bukan worksheet) */}
              {hasJawaban && !isQuiz && !isWorksheet && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Jawaban Teks
                  </p>
                  <div
                    className="prose dark:prose-invert max-w-none text-sm p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-auto"
                    dangerouslySetInnerHTML={{ __html: sub!.jawaban! }}
                  />
                </div>
              )}

              {/* Tidak ada pekerjaan (non-worksheet, non-quiz, sudah submit) */}
              {!belumSubmit && !isWorksheet && !isQuiz && !hasFiles && !hasJawaban && (
                <div className="flex flex-col items-center py-10 gap-2 text-gray-400">
                  <FileText size={24} className="opacity-30" />
                  <p className="text-sm">Tidak ada file atau jawaban yang dikumpulkan.</p>
                </div>
              )}

              {/* Placeholder belum submit di kolom kiri */}
              {belumSubmit && (
                <div className="flex flex-col items-center py-10 gap-2 text-gray-300 dark:text-gray-600">
                  <Star size={24} className="opacity-40" />
                  <p className="text-sm text-gray-400">Siswa belum mengumpulkan tugas.</p>
                </div>
              )}
            </div>

            {/* ── Kolom kanan: Panel Penilaian (sticky di desktop) ── */}
            <div className="w-full lg:w-72 xl:w-80 shrink-0 px-5 pb-5 pt-0 lg:p-5 lg:sticky lg:top-0 lg:self-start border-t lg:border-t-0 border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-4">
                <Star size={11} /> Penilaian
              </p>
              <PenilaianPanel
                pengumpulanId={pengumpulanId}
                siswaId={currentSiswaId ?? siswaId ?? ''}
                tugasId={tugas.id}
                bobot={tugas.bobot}
                isQuiz={isQuiz}
                isBelumSubmit={belumSubmit}
                autoNilai={finalAutoNilai}
                autoTotal={finalAutoTotal}
                savedNilai={savedNilai}
                savedCatatan={savedCatatan}
                tujuan={tugas.tujuan as TujuanTugas}
                status={sub?.status}
                onDone={goNextOrClose}
              />
            </div>

          </div>
        )}
      </div>
    </Modal>
  )
}
