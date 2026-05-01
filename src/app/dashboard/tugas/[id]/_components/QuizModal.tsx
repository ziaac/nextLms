'use client'

import {
  useState, useEffect, useMemo, useCallback, useRef,
} from 'react'
import {
  X, ChevronLeft, ChevronRight, CheckCircle2, Circle,
  AlertTriangle, Clock, Award, Eye, Send, BookOpen,
  SkipForward, RotateCcw, Maximize2, Minimize2, LayoutGrid, XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Spinner } from '@/components/ui/Spinner'
import { useSubmitTugas, useMySubmission } from '@/hooks/tugas/useTugas'
import { PrivateImage } from '@/components/ui/PrivateImage'
import { toast } from 'sonner'
import type { TugasItem, SoalKuis, OpsiKuis } from '@/types/tugas.types'
import { TipeSoalKuis, BentukTugas } from '@/types/tugas.types'

// ── Helpers ───────────────────────────────────────────────────────────

/** Seeded Fisher-Yates shuffle so the order is consistent across resume */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr]
  let s = [...seed].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function fmtSeconds(sec: number): string {
  if (sec <= 0) return '00:00'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

type Phase = 'PRE' | 'ANSWERING' | 'REVIEW' | 'DONE'

// ── Question dot button ───────────────────────────────────────────────
function QDot({
  no, answered, current, onClick, tipe,
}: {
  no: number; answered: boolean; current: boolean; onClick: () => void
  tipe: TipeSoalKuis
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-8 h-8 rounded-lg text-[11px] font-bold transition-all focus:outline-none',
        current
          ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-1'
          : answered
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600',
        tipe === TipeSoalKuis.ESSAY ? 'rounded-full' : '',
      )}
      title={tipe === TipeSoalKuis.ESSAY ? 'Essay' : 'Pilihan Ganda'}
    >
      {no}
    </button>
  )
}

// ── Timer bar ─────────────────────────────────────────────────────────
function TimerBar({ remaining, total }: { remaining: number; total: number }) {
  const pct = total > 0 ? (remaining / total) * 100 : 0
  const urgent = pct < 15
  const warning = pct < 30

  return (
    <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className={cn(
          'h-full transition-all duration-1000',
          urgent ? 'bg-red-500' : warning ? 'bg-amber-400' : 'bg-emerald-500',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ── QUIZ MODAL (full-screen overlay) ─────────────────────────────────
interface Props {
  tugas: TugasItem
  tugasId: string
  onClose: () => void
}

export function QuizModal({ tugas, tugasId, onClose }: Props) {
  const { data: submission, isLoading: loadingSub } = useMySubmission(tugasId)
  const submitMutation = useSubmitTugas()

  // ── Phase & UI state ─────────────────────────────────────────────
  const [phase, setPhase]               = useState<Phase>('PRE')
  const [currentIdx, setCurrentIdx]     = useState(0)
  const [answers, setAnswers]           = useState<Record<string, string>>({})
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNavPanel, setShowNavPanel]           = useState(true)
  const [showMobileNavPopup, setShowMobileNavPopup] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [totalTime, setTotalTime]       = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Quiz settings ─────────────────────────────────────────────────
  const settings = tugas.quizSettings ?? {}
  const STORAGE_KEY = `quiz_draft_${tugasId}`

  // ── Ordered + randomized soal ─────────────────────────────────────
  const shuffledSoal = useMemo<SoalKuis[]>(() => {
    if (!tugas.soalKuis?.length) return []
    if (settings.isAcakSoal) return seededShuffle(tugas.soalKuis, tugasId)
    return [...tugas.soalKuis]
  }, [tugas.soalKuis, settings.isAcakSoal, tugasId])

  const shuffledOpsiMap = useMemo<Record<string, OpsiKuis[]>>(() => {
    const map: Record<string, OpsiKuis[]> = {}
    for (const soal of shuffledSoal) {
      if (soal.tipe === TipeSoalKuis.MULTIPLE_CHOICE && soal.opsi?.length) {
        map[soal.id] = settings.isAcakOpsi
          ? seededShuffle(soal.opsi, soal.id)
          : [...soal.opsi]
      }
    }
    return map
  }, [shuffledSoal, settings.isAcakOpsi])

  const totalQ    = shuffledSoal.length
  const mcSoal    = shuffledSoal.filter((s) => s.tipe === TipeSoalKuis.MULTIPLE_CHOICE)
  const essaySoal = shuffledSoal.filter((s) => s.tipe === TipeSoalKuis.ESSAY)
  const hasEssay  = essaySoal.length > 0

  // ── Running MC score ──────────────────────────────────────────────
  const liveScore = useMemo(() => {
    let totalBobot = 0
    let earnedBobot = 0
    for (const soal of shuffledSoal) {
      if (soal.tipe === TipeSoalKuis.MULTIPLE_CHOICE) {
        totalBobot += soal.bobot
        const selectedId = answers[soal.id]
        if (selectedId) {
          const opsi = soal.opsi?.find((o) => o.id === selectedId)
          if (opsi?.isCorrect) earnedBobot += soal.bobot
        }
      }
    }
    const nilai = totalBobot > 0 ? Math.round((earnedBobot / totalBobot) * tugas.bobot) : 0
    return { nilai, earnedBobot, totalBobot }
  }, [answers, shuffledSoal, tugas.bobot])

  const answeredCount = Object.keys(answers).length
  const unansweredSoal = shuffledSoal.filter((s) => !answers[s.id])

  // ── Load saved draft from localStorage ───────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { answers?: Record<string, string> }
        if (parsed.answers && Object.keys(parsed.answers).length > 0) {
          setAnswers(parsed.answers)
        }
      }
    } catch { /* ignore */ }
  }, [STORAGE_KEY])

  // ── Persist answers to localStorage on change ─────────────────────
  useEffect(() => {
    if (phase === 'ANSWERING' || phase === 'REVIEW') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers }))
    }
  }, [answers, phase, STORAGE_KEY])

  // ── Timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'ANSWERING' && phase !== 'REVIEW') return
    const deadline = new Date(tugas.tanggalSelesai).getTime()
    const initial = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
    setTotalTime((prev) => prev === 0 ? initial : prev)
    setTimeRemaining(initial)

    const id = setInterval(() => {
      const rem = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
      setTimeRemaining(rem)
      if (rem === 0) {
        clearInterval(id)
        toast.warning('Waktu habis! Jawaban dikumpulkan otomatis.')
        void handleFinalSubmit()
      }
    }, 1000)

    return () => clearInterval(id)
    // Intentional: handleFinalSubmit dikeluarkan dari deps karena dibuat ulang tiap render.
    // Menambahkannya akan menyebabkan timer di-reset setiap render. Timer hanya perlu
    // dimulai ulang saat phase atau tanggalSelesai berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, tugas.tanggalSelesai])

  // ── Warn before unload ────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'ANSWERING' && phase !== 'REVIEW') return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Jika halaman ditutup, soal akan diacak ulang dan jawaban yang belum tersimpan akan hilang.'
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [phase])

  // ── Fullscreen toggle ─────────────────────────────────────────────
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch { /* not critical */ }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // ── Answer setters ────────────────────────────────────────────────
  const setAnswer = (soalId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [soalId]: value }))
  }

  // ── Submit ────────────────────────────────────────────────────────
  const handleFinalSubmit = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await submitMutation.mutateAsync({
        tugasId,
        payload: { jawabanKuis: answers },
      })
      localStorage.removeItem(STORAGE_KEY)
      setPhase('DONE')
      toast.success('Kuis berhasil dikumpulkan!')
    } catch {
      toast.error('Gagal mengumpulkan kuis. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  // Intentional: submitMutation dikeluarkan dari deps karena merupakan stable reference
  // dari react-query. Menambahkannya akan menyebabkan fungsi ini dibuat ulang setiap render
  // dan berpotensi menyebabkan double-submit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, tugasId, isSubmitting, STORAGE_KEY])

  const currentSoal = shuffledSoal[currentIdx]

  // ── Loading ───────────────────────────────────────────────────────
  if (loadingSub) {
    return (
      <QuizOverlay ref={containerRef}>
        <div className="flex items-center justify-center h-full">
          <Spinner />
        </div>
      </QuizOverlay>
    )
  }

  // ── Already submitted ─────────────────────────────────────────────
  if (submission && phase !== 'DONE') {
    return (
      <QuizOverlay ref={containerRef}>
        <SubmittedView tugas={tugas} submission={submission} onClose={onClose} />
      </QuizOverlay>
    )
  }

  // ── No soal ───────────────────────────────────────────────────────
  if (totalQ === 0 && phase === 'PRE') {
    return (
      <QuizOverlay ref={containerRef}>
        <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
          <AlertTriangle size={40} className="text-amber-400" />
          <p className="text-base font-semibold text-gray-800 dark:text-white">Belum ada soal</p>
          <p className="text-sm text-gray-500">Guru belum menambahkan soal pada kuis ini.</p>
          <Button variant="secondary" onClick={onClose}>Tutup</Button>
        </div>
      </QuizOverlay>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  // PHASE: PRE (launch screen)
  // ═══════════════════════════════════════════════════════════════════
  if (phase === 'PRE') {
    const hasDraft = Object.keys(answers).length > 0
    return (
      <QuizOverlay ref={containerRef}>
        <div className="flex flex-col items-center justify-center h-full px-4">
          <div className="w-full max-w-md space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
                <BookOpen size={26} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">
                {tugas.judul}
              </h1>
              <p className="text-sm text-gray-500">
                {tugas.bentuk === BentukTugas.QUIZ_MIX ? 'Kuis Campuran (Pilihan Ganda + Essay)' : 'Kuis Pilihan Ganda'}
              </p>
            </div>

            {/* Info tiles */}
            <div className="grid grid-cols-3 gap-3">
              <InfoTile label="Total Soal" value={String(totalQ)} />
              {hasEssay && <InfoTile label="Essay" value={String(essaySoal.length)} />}
              <InfoTile label="Bobot Maks." value={`${tugas.bobot} poin`} />
              <InfoTile
                label="Sisa Waktu"
                value={fmtSeconds(Math.max(0, Math.floor((new Date(tugas.tanggalSelesai).getTime() - Date.now()) / 1000)))}
                urgent={new Date(tugas.tanggalSelesai).getTime() - Date.now() < 10 * 60 * 1000}
              />
            </div>

            {/* Settings chips */}
            <div className="flex flex-wrap gap-2 justify-center">
              {settings.isAcakSoal && (
                <span className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                  Soal Diacak
                </span>
              )}
              {settings.isAcakOpsi && (
                <span className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                  Opsi Diacak
                </span>
              )}
              {settings.isAutograde !== false && !hasEssay && (
                <span className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Nilai Otomatis
                </span>
              )}
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Jangan tutup atau refresh halaman selama mengerjakan.
                Jika keluar, soal akan diacak ulang saat dibuka kembali.
              </p>
            </div>

            {/* Resume notice */}
            {hasDraft && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30">
                <RotateCcw size={15} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  Ditemukan <strong>{Object.keys(answers).length} jawaban tersimpan</strong>. Kuis akan dilanjutkan dari terakhir kali.
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => setPhase('ANSWERING')}
              >
                {hasDraft ? 'Lanjutkan Kuis' : 'Mulai Kuis'}
              </Button>
              {hasDraft && (
                <button
                  type="button"
                  onClick={() => { setAnswers({}); localStorage.removeItem(STORAGE_KEY) }}
                  className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors py-1"
                >
                  Mulai dari awal (hapus draft)
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-1"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </QuizOverlay>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  // PHASE: DONE
  // ═══════════════════════════════════════════════════════════════════
  if (phase === 'DONE') {
    const isAllMC         = tugas.bentuk === BentukTugas.QUIZ_MULTIPLE_CHOICE
    const bolehLihatNilai = settings.showNilaiSetelahSubmit !== false  // default true
    const bolehLihatJawaban = (settings.showJawabanBenar ?? 'LANGSUNG') === 'LANGSUNG'

    return (
      <QuizOverlay ref={containerRef}>
        <div className="flex flex-col items-center justify-center h-full px-4">
          <div className="w-full max-w-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 size={30} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Kuis Dikumpulkan!</h2>

              {/* Nilai — tampil hanya jika diizinkan */}
              {bolehLihatNilai && isAllMC && settings.isAutograde !== false && (
                <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-3">
                  {liveScore.nilai}
                  <span className="text-sm font-normal text-gray-400 ml-1">/ {tugas.bobot}</span>
                </p>
              )}
              {!bolehLihatNilai && (
                <p className="text-sm text-gray-500 mt-2">
                  Nilai akan diumumkan oleh guru.
                </p>
              )}

              {hasEssay && (
                <p className="text-sm text-gray-500 mt-2">
                  Soal essay akan dinilai oleh guru.
                </p>
              )}

              {/* Jawaban benar — tampil hanya jika LANGSUNG */}
              {bolehLihatJawaban && isAllMC && settings.isAutograde !== false && (
                <div className="mt-4 text-left space-y-2 max-h-64 overflow-y-auto">
                  {shuffledSoal.filter(s => s.tipe === TipeSoalKuis.MULTIPLE_CHOICE).map((soal, idx) => {
                    const selId  = answers[soal.id]
                    const opsiList = shuffledOpsiMap[soal.id] ?? soal.opsi ?? []
                    const selOpsi  = opsiList.find(o => o.id === selId)
                    const benar    = selOpsi?.isCorrect === true
                    return (
                      <div key={soal.id} className={cn(
                        'flex items-start gap-2 px-3 py-2 rounded-lg text-xs',
                        benar
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
                      )}>
                        {benar
                          ? <CheckCircle2 size={12} className="shrink-0 mt-0.5" />
                          : <XCircle      size={12} className="shrink-0 mt-0.5" />}
                        <span className="font-semibold shrink-0">{idx + 1}.</span>
                        <span className="truncate">{selOpsi?.teks ?? 'Tidak dijawab'}</span>
                      </div>
                    )
                  })}
                </div>
              )}
              {!bolehLihatJawaban && (
                <p className="text-xs text-gray-400 mt-2">
                  {(settings.showJawabanBenar ?? 'LANGSUNG') === 'SETELAH_DINILAI'
                    ? 'Kunci jawaban akan tersedia setelah guru menilai.'
                    : 'Kunci jawaban tidak ditampilkan.'}
                </p>
              )}
            </div>
            <Button className="w-full" onClick={onClose}>Tutup</Button>
          </div>
        </div>
      </QuizOverlay>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  // PHASE: REVIEW
  // ═══════════════════════════════════════════════════════════════════
  if (phase === 'REVIEW') {
    return (
      <QuizOverlay ref={containerRef}>
        <div className="flex flex-col h-full">
          {/* Top bar */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
            <button
              type="button"
              onClick={() => setPhase('ANSWERING')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <ChevronLeft size={16} /> Kembali
            </button>
            <div className="flex-1 text-center">
              <p className="text-sm font-bold text-gray-800 dark:text-white">Review Jawaban</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-mono font-bold">
              <Clock size={13} className={timeRemaining < 300 ? 'text-red-500' : 'text-gray-400'} />
              <span className={timeRemaining < 300 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}>
                {fmtSeconds(timeRemaining)}
              </span>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-2 p-4 shrink-0 border-b border-gray-100 dark:border-gray-800">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-800 dark:text-white">{answeredCount}</p>
              <p className="text-[10px] text-gray-400 uppercase">Dijawab</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-500">{unansweredSoal.length}</p>
              <p className="text-[10px] text-gray-400 uppercase">Belum</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{totalQ}</p>
              <p className="text-[10px] text-gray-400 uppercase">Total</p>
            </div>
          </div>

          {/* Question list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {shuffledSoal.map((soal, idx) => {
              const answered  = !!answers[soal.id]
              const isMC      = soal.tipe === TipeSoalKuis.MULTIPLE_CHOICE
              const selOpsi   = isMC ? (shuffledOpsiMap[soal.id] ?? soal.opsi ?? []).find((o) => o.id === answers[soal.id]) : null
              const essayText = !isMC ? answers[soal.id] : null

              return (
                <div
                  key={soal.id}
                  className={cn(
                    'p-3.5 rounded-xl border text-sm transition-all',
                    answered
                      ? 'bg-white dark:bg-gray-900 border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-gray-400 shrink-0 mt-0.5">
                      {idx + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug line-clamp-2">
                        {soal.pertanyaan}
                      </p>
                      {answered ? (
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          {selOpsi?.teks ?? (essayText ? `${essayText.slice(0, 60)}${essayText.length > 60 ? '…' : ''}` : '')}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                          <Circle size={11} /> Belum dijawab
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => { setCurrentIdx(idx); setPhase('ANSWERING') }}
                      className="shrink-0 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {answered ? 'Ubah' : 'Jawab'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 space-y-2">
            {unansweredSoal.length > 0 && (
              <p className="text-xs text-amber-600 text-center flex items-center justify-center gap-1">
                <AlertTriangle size={12} />
                {unansweredSoal.length} soal belum dijawab
              </p>
            )}
            <Button
              className="w-full"
              loading={isSubmitting}
              disabled={isSubmitting}
              onClick={() => { void handleFinalSubmit() }}
              leftIcon={<Send size={14} />}
            >
              Kumpulkan Kuis
            </Button>
          </div>
        </div>
      </QuizOverlay>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  // PHASE: ANSWERING
  // ═══════════════════════════════════════════════════════════════════
  if (!currentSoal) return null

  const isMCQuestion = currentSoal.tipe === TipeSoalKuis.MULTIPLE_CHOICE
  const currentOpsi  = isMCQuestion ? (shuffledOpsiMap[currentSoal.id] ?? currentSoal.opsi ?? []) : []
  const isAnswered   = !!answers[currentSoal.id]
  const timeUrgent   = timeRemaining > 0 && timeRemaining < 300

  return (
    <QuizOverlay ref={containerRef}>
      <div className="flex flex-col h-full">

        {/* ── Top bar ─────────────────────────────────────────────── */}
        <div className="shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 px-3 py-2.5">
            {/* Question counter */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold text-gray-500 shrink-0">
                Soal {currentIdx + 1} / {totalQ}
              </span>
              <span className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0',
                isMCQuestion
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
              )}>
                {isMCQuestion ? 'Pilihan Ganda' : 'Essay'}
              </span>
            </div>

            {/* Score preview (MC only) */}
            {mcSoal.length > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Award size={12} className="text-amber-500" />
                <span className="text-xs font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {liveScore.nilai}
                </span>
              </div>
            )}

            {/* Timer */}
            <div className={cn(
              'flex items-center gap-1 shrink-0 font-mono text-xs font-bold',
              timeUrgent ? 'text-red-500 animate-pulse' : 'text-gray-600 dark:text-gray-300',
            )}>
              <Clock size={13} />
              {fmtSeconds(timeRemaining)}
            </div>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={() => { void toggleFullscreen() }}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1"
              title="Layar penuh"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
          <TimerBar remaining={timeRemaining} total={totalTime || 3600} />
        </div>

        {/* ── Main area ────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0">

          {/* Nav panel (desktop sidebar / mobile hidden) */}
          {showNavPanel && (
            <div className="hidden md:flex flex-col w-48 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  Navigasi Soal
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {answeredCount} / {totalQ} dijawab
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <div className="flex flex-wrap gap-1.5">
                  {shuffledSoal.map((s, i) => (
                    <QDot
                      key={s.id}
                      no={i + 1}
                      answered={!!answers[s.id]}
                      current={i === currentIdx}
                      onClick={() => setCurrentIdx(i)}
                      tipe={s.tipe}
                    />
                  ))}
                </div>
              </div>
              {/* Legend */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/30" /> Dijawab
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-700" /> Belum
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="w-3 h-3 rounded-full bg-gray-100 dark:bg-gray-700" /> Essay
                </div>
              </div>
            </div>
          )}

          {/* Question content */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

              {/* Question text */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300">
                    {currentIdx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm md:text-base font-medium text-gray-900 dark:text-white leading-relaxed">
                      {currentSoal.pertanyaan}
                    </p>
                    {currentSoal.bobot > 1 && (
                      <p className="text-[10px] text-gray-400 mt-1">Bobot: {currentSoal.bobot} poin</p>
                    )}
                  </div>
                </div>
                {currentSoal.gambarUrl && (
                  <PrivateImage
                    fileKey={currentSoal.gambarUrl}
                    alt="Gambar soal"
                    skeletonHeight={160}
                  />
                )}
              </div>

              {/* MC options */}
              {isMCQuestion && (
                <div className="space-y-2.5">
                  {currentOpsi.map((opsi, oi) => {
                    const selected = answers[currentSoal.id] === opsi.id
                    const label    = String.fromCharCode(65 + oi) // A, B, C, D…
                    return (
                      <button
                        key={opsi.id}
                        type="button"
                        onClick={() => setAnswer(currentSoal.id, opsi.id)}
                        className={cn(
                          'w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all',
                          selected
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/30 dark:hover:bg-blue-950/20',
                        )}
                      >
                        <span className={cn(
                          'shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors',
                          selected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-300 dark:border-gray-600 text-gray-500',
                        )}>
                          {label}
                        </span>
                        <div className="flex-1">
                          <p className={cn(
                            'text-sm leading-snug',
                            selected ? 'text-blue-800 dark:text-blue-200 font-medium' : 'text-gray-800 dark:text-gray-200',
                          )}>
                            {opsi.teks}
                          </p>
                          {opsi.gambarUrl && (
                            <PrivateImage
                              fileKey={opsi.gambarUrl}
                              alt={`Opsi ${label}`}
                              skeletonHeight={80}
                            />
                          )}
                        </div>
                        {selected && <CheckCircle2 size={16} className="shrink-0 text-blue-600 mt-0.5" />}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Essay textarea */}
              {!isMCQuestion && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Jawaban Anda
                  </label>
                  <textarea
                    value={answers[currentSoal.id] ?? ''}
                    onChange={(e) => setAnswer(currentSoal.id, e.target.value)}
                    rows={8}
                    placeholder="Tulis jawaban Anda di sini..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                  />
                  <p className="text-xs text-gray-400 text-right">
                    {(answers[currentSoal.id] ?? '').length} karakter
                  </p>
                </div>
              )}
            </div>

            {/* ── Bottom nav ──────────────────────────────────────────── */}
            <div className="shrink-0 px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">

              {/* Mobile nav popup overlay */}
              {showMobileNavPopup && (
                <div
                  className="md:hidden fixed inset-0 z-[110] flex flex-col justify-end"
                  onClick={() => setShowMobileNavPopup(false)}
                >
                  <div
                    className="bg-white dark:bg-gray-900 rounded-t-2xl border-t border-gray-200 dark:border-gray-800 p-4 pb-safe max-h-[60vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-gray-800 dark:text-white">Navigasi Soal</p>
                      <p className="text-xs text-gray-400">{answeredCount} / {totalQ} dijawab</p>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-4 mb-3">
                      <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/30 inline-block" /> Dijawab
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <span className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-700 inline-block" /> Belum
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <span className="w-3 h-3 rounded-full bg-gray-100 dark:bg-gray-700 inline-block" /> Essay
                      </span>
                    </div>
                    {/* Grid */}
                    <div className="flex flex-wrap gap-1.5 overflow-y-auto">
                      {shuffledSoal.map((s, i) => (
                        <QDot
                          key={s.id}
                          no={i + 1}
                          answered={!!answers[s.id]}
                          current={i === currentIdx}
                          onClick={() => { setCurrentIdx(i); setShowMobileNavPopup(false) }}
                          tipe={s.tipe}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* Prev */}
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((p) => p - 1)}
                  leftIcon={<ChevronLeft size={14} />}
                  className="shrink-0"
                >
                  <span className="hidden sm:inline">Sebelumnya</span>
                </Button>

                {/* Mobile: nav grid icon */}
                <button
                  type="button"
                  onClick={() => setShowMobileNavPopup((v) => !v)}
                  className="md:hidden relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors text-xs font-medium shrink-0"
                  title="Navigasi soal"
                >
                  <LayoutGrid size={14} />
                  <span className="tabular-nums">{currentIdx + 1}/{totalQ}</span>
                  {unansweredSoal.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] font-bold flex items-center justify-center">
                      {unansweredSoal.length}
                    </span>
                  )}
                </button>

                <div className="flex-1" />

                {/* Skip (if unanswered) */}
                {!isAnswered && currentIdx < totalQ - 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((p) => p + 1)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors px-2 py-1"
                  >
                    Lewati <SkipForward size={12} />
                  </button>
                )}

                {/* Review / Next */}
                {currentIdx < totalQ - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setCurrentIdx((p) => p + 1)}
                    rightIcon={<ChevronRight size={14} />}
                    className="shrink-0"
                  >
                    <span className="hidden sm:inline">Selanjutnya</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setPhase('REVIEW')}
                    leftIcon={<Eye size={14} />}
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Selesai & Review
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </QuizOverlay>
  )
}

// ── Full-screen wrapper ───────────────────────────────────────────────
const QuizOverlay = ({
  children,
  ref: containerRef,
}: {
  children: React.ReactNode
  ref?: React.RefObject<HTMLDivElement | null>
}) => (
  <div
    ref={containerRef}
    className="fixed inset-0 z-[100] bg-gray-50 dark:bg-gray-950 flex flex-col overflow-hidden"
  >
    {children}
  </div>
)

// ── Already-submitted view ────────────────────────────────────────────
function SubmittedView({
  tugas, submission, onClose,
}: {
  tugas: TugasItem
  submission: any
  onClose: () => void
}) {
  const nilaiEntry = submission.penilaian?.[0]
  const nilai      = nilaiEntry?.nilai ?? null
  const isDinilai  = submission.status === 'DINILAI'

  // Parse quiz answers from jawaban JSON
  let savedAnswers: Record<string, string> = {}
  try {
    if (submission.jawaban) {
      const parsed = JSON.parse(submission.jawaban as string)
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        savedAnswers = parsed as Record<string, string>
      }
    }
  } catch { /* not JSON - was a regular text answer */ }

  const sortedSoal = [...(tugas.soalKuis ?? [])].sort((a, b) => a.urutan - b.urutan)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <X size={18} />
        </button>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-800 dark:text-white">Hasil Kuis</p>
          <p className="text-xs text-gray-400">{tugas.judul}</p>
        </div>
        {isDinilai && nilai !== null && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <Award size={14} className="text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
              {nilai} / {tugas.bobot}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!isDinilai && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 text-sm text-blue-700 dark:text-blue-300">
            <Clock size={14} /> Menunggu penilaian dari guru.
          </div>
        )}

        {sortedSoal.map((soal, idx) => {
          const selectedId  = savedAnswers[soal.id]
          const selectedOpsi = soal.opsi?.find((o) => o.id === selectedId)
          const isCorrect    = selectedOpsi?.isCorrect ?? null
          const isMC         = soal.tipe === TipeSoalKuis.MULTIPLE_CHOICE
          const essayText    = !isMC ? savedAnswers[soal.id] : null

          return (
            <div
              key={soal.id}
              className={cn(
                'p-3.5 rounded-xl border',
                isDinilai && isMC
                  ? isCorrect === true
                    ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30'
                    : isCorrect === false
                      ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
              )}
            >
              <p className="text-xs font-semibold text-gray-500 mb-1">Soal {idx + 1}</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug mb-2">
                {soal.pertanyaan}
              </p>

              {isMC && (
                <div className="space-y-1.5">
                  {(soal.opsi ?? []).sort((a, b) => a.urutan - b.urutan).map((opsi, oi) => {
                    const sel     = opsi.id === selectedId
                    const correct = isDinilai && opsi.isCorrect
                    const wrong   = isDinilai && sel && !opsi.isCorrect
                    return (
                      <div
                        key={opsi.id}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs border',
                          correct ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                          : wrong  ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                          : sel    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500',
                        )}
                      >
                        <span className="font-bold shrink-0">{String.fromCharCode(65 + oi)}.</span>
                        <span className="flex-1">{opsi.teks}</span>
                        {sel && <span className="shrink-0 text-[10px] font-bold">Pilihan Anda</span>}
                        {correct && <CheckCircle2 size={12} className="shrink-0 text-emerald-600" />}
                      </div>
                    )
                  })}
                </div>
              )}

              {!isMC && essayText && (
                <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {essayText}
                  </p>
                </div>
              )}

              {!selectedId && !essayText && (
                <p className="text-xs text-gray-400 italic">Tidak dijawab</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="shrink-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <Button variant="secondary" className="w-full" onClick={onClose}>Tutup</Button>
      </div>
    </div>
  )
}

// ── Small info tile ───────────────────────────────────────────────────
function InfoTile({ label, value, urgent = false }: { label: string; value: string; urgent?: boolean }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-center">
      <p className={cn('text-base font-bold tabular-nums', urgent ? 'text-red-500' : 'text-gray-800 dark:text-white')}>
        {value}
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}
