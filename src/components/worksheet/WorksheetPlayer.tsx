'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import {
  ChevronLeft, ChevronRight, Send, CheckCircle2,
  Loader2, AlertCircle, BookOpen, RotateCcw, AlertTriangle,
} from 'lucide-react'
import { useWorksheetDefinition, useMyWorksheetJawaban,
         useSaveWorksheetDraft, useSubmitWorksheet } from '@/hooks/worksheet/useWorksheet'
import { useTarikKembali } from '@/hooks/tugas/useTugas'
import { WorksheetWidgetRenderer } from './WorksheetWidgetRenderer'
import { INPUT_TYPES, TipeWidgetWorksheet } from '@/types/worksheet.types'
import type { WidgetWorksheet } from '@/types/worksheet.types'
import { TujuanTugas } from '@/types/tugas.types'
import { toast } from 'sonner'

interface Props {
  tugasId:       string
  isReadOnly?:   boolean       // true jika sudah dinilai
  tujuanTugas?:  TujuanTugas  // untuk cek boleh tarik kembali
  tanggalSelesai?: string      // ISO string deadline
}

export function WorksheetPlayer({ tugasId, isReadOnly = false, tujuanTugas, tanggalSelesai }: Props) {
  const [halamanIdx,  setHalamanIdx]  = useState(0)
  const [jawaban,     setJawaban]     = useState<Record<string, string>>({})
  const [submitOpen,  setSubmitOpen]  = useState(false)
  const [imgLoaded,   setImgLoaded]   = useState(false)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstLoad   = useRef(true)

  // Reset loading state setiap ganti halaman
  useEffect(() => {
    setImgLoaded(false)
  }, [halamanIdx])

  const { data: def, isLoading: defLoading } = useWorksheetDefinition(tugasId)
  const { data: savedJawaban, isLoading: jawabanLoading } = useMyWorksheetJawaban(tugasId)
  const saveDraftMutation    = useSaveWorksheetDraft()
  const submitMutation       = useSubmitWorksheet()
  const tarikKembaliMutation = useTarikKembali()

  // Restore jawaban dari server saat pertama load
  useEffect(() => {
    if (savedJawaban?.jawaban && isFirstLoad.current) {
      setJawaban(savedJawaban.jawaban)
      isFirstLoad.current = false
    }
  }, [savedJawaban])

  const isSubmitted  = savedJawaban?.status === 'SUBMITTED' || savedJawaban?.status === 'DINILAI'
  const isRevisi     = savedJawaban?.status === 'REVISI'
  const isDraftReturn = savedJawaban?.status === 'DRAFT' && !!savedJawaban?.catatan
  // readOnly hanya untuk SUBMITTED/DINILAI — REVISI dan DRAFT dikembalikan tetap bisa edit
  const readOnly    = isReadOnly || isSubmitted

  // Siswa boleh tarik kembali jika: status SUBMITTED + bukan UTS/UAS + deadline belum lewat
  const deadlinePassed = tanggalSelesai ? new Date() > new Date(tanggalSelesai) : false
  const canTarikKembali = savedJawaban?.status === 'SUBMITTED' &&
    !deadlinePassed &&
    tujuanTugas !== TujuanTugas.UTS &&
    tujuanTugas !== TujuanTugas.UAS

  const handleTarikKembali = async () => {
    try {
      await tarikKembaliMutation.mutateAsync(tugasId)
      toast.success('Pengumpulan ditarik kembali. Kamu bisa mengubah jawabanmu.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Gagal menarik kembali.')
    }
  }

  // Auto-save dengan debounce 1500ms
  const triggerAutoSave = useCallback((answers: Record<string, string>) => {
    if (readOnly) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      saveDraftMutation.mutate({ tugasId, jawaban: answers })
    }, 1500)
  }, [tugasId, readOnly])

  const setAnswer = useCallback((widgetId: string, value: string) => {
    setJawaban((prev) => {
      const next = { ...prev, [widgetId]: value }
      triggerAutoSave(next)
      return next
    })
  }, [triggerAutoSave])

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync({ tugasId, jawaban })
      toast.success('Worksheet berhasil dikumpulkan!')
      setSubmitOpen(false)
    } catch {
      toast.error('Gagal mengumpulkan worksheet')
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────
  const allInputWidgets = (def?.halaman ?? []).flatMap((h) =>
    h.widget.filter((w) => INPUT_TYPES.includes(w.tipe)),
  )
  const answeredCount = allInputWidgets.filter((w) => (jawaban[w.id] ?? '').trim()).length
  const totalCount    = allInputWidgets.length

  const halaman = def?.halaman ?? []
  const currentHalaman = halaman[halamanIdx]

  if (defLoading || jawabanLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!def || halaman.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <BookOpen className="w-10 h-10 opacity-30" />
        <p className="text-sm font-medium">Worksheet belum tersedia</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 min-w-0">

      {/* ── Status bar ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          {isSubmitted ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Sudah dikumpulkan
                  {savedJawaban?.tanggalSubmit && ` · ${new Date(savedJawaban.tanggalSubmit).toLocaleDateString('id-ID')}`}
                </span>
              </div>
              {canTarikKembali && (
                <button
                  type="button"
                  disabled={tarikKembaliMutation.isPending}
                  onClick={() => { void handleTarikKembali() }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-orange-300 text-orange-600 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-400 disabled:opacity-50 transition-colors"
                >
                  {tarikKembaliMutation.isPending
                    ? <Loader2 size={11} className="animate-spin" />
                    : <RotateCcw size={11} />
                  }
                  Tarik Kembali
                </button>
              )}
            </>
          ) : isRevisi ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertTriangle size={14} className="text-amber-500" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                Perlu Revisi — perbaiki jawaban lalu kumpulkan kembali
              </span>
            </div>
          ) : isDraftReturn ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <RotateCcw size={14} className="text-orange-500" />
              <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">
                Dikembalikan oleh guru — silakan perbaiki dan kumpulkan kembali
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                Draft tersimpan otomatis
              </span>
            </div>
          )}

        {/* Progress */}
        {totalCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(answeredCount / totalCount) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 tabular-nums">
              {answeredCount}/{totalCount} soal
            </span>
          </div>
        )}

        <div className="flex-1" />

        {/* Page navigator */}
        {halaman.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={halamanIdx === 0}
              onClick={() => setHalamanIdx((i) => i - 1)}
              className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-gray-500 tabular-nums px-2 font-medium">
              {halamanIdx + 1} / {halaman.length}
            </span>
            <button
              type="button"
              disabled={halamanIdx === halaman.length - 1}
              onClick={() => setHalamanIdx((i) => i + 1)}
              className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

        {/* Catatan guru — tampil untuk REVISI dan dikembalikan ke DRAFT */}
        {(isRevisi || isDraftReturn) && savedJawaban?.catatan && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
            <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">
                Catatan dari Guru
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                {savedJawaban.catatan}
              </p>
            </div>
          </div>
        )}
      </div>{/* end flex-col gap-2 status wrapper */}

      {/* ── Page tabs (mini) ── */}
      {halaman.length > 1 && (
        <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {halaman.map((h, i) => {
            const hWidgets   = h.widget.filter((w) => INPUT_TYPES.includes(w.tipe))
            const hAnswered  = hWidgets.filter((w) => (jawaban[w.id] ?? '').trim()).length
            const allDone    = hWidgets.length > 0 && hAnswered === hWidgets.length
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => setHalamanIdx(i)}
                className={cn(
                  'shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all',
                  halamanIdx === i
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : allDone
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
                )}
              >
                {allDone && <CheckCircle2 size={10} />}
                Hal {i + 1}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Worksheet page ── */}
      {currentHalaman && (
        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 min-h-64">

          {/* Gambar — opacity-0 saat loading mencegah progressive paint */}
          <img
            key={currentHalaman.id}
            src={currentHalaman.imageUrl}
            alt={`Halaman ${halamanIdx + 1}`}
            draggable={false}
            onLoad={() => setImgLoaded(true)}
            className={cn(
              'w-full h-auto block transition-opacity duration-500',
              imgLoaded ? 'opacity-100' : 'opacity-0',
            )}
          />

          {/* Skeleton / loading overlay */}
          {!imgLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-100 dark:bg-gray-800">
              {/* Shimmer bar rows */}
              <div className="w-full px-8 flex flex-col gap-3 opacity-40">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-3 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse"
                    style={{ width: `${70 + (i % 3) * 10}%`, animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
              {/* Spinner */}
              <div className="relative w-10 h-10 mt-2">
                <div className="absolute inset-0 rounded-full border-[3px] border-gray-200 dark:border-gray-700" />
                <div className="absolute inset-0 rounded-full border-[3px] border-blue-500 border-t-transparent animate-spin" />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide">
                Memuat halaman {halamanIdx + 1}…
              </p>
            </div>
          )}

          {/* Widget overlays — tampil setelah gambar siap */}
          {imgLoaded && currentHalaman.widget.map((widget: WidgetWorksheet) => (
            <div
              key={widget.id}
              className="absolute"
              style={{
                left:   `${widget.posisiX * 100}%`,
                top:    `${widget.posisiY * 100}%`,
                width:  `${widget.lebarPct * 100}%`,
                height: `${widget.tinggiPct * 100}%`,
              }}
            >
              <WorksheetWidgetRenderer
                widget={widget}
                mode="player"
                value={jawaban[widget.id] ?? ''}
                onChange={(v) => setAnswer(widget.id, v)}
                isReadOnly={readOnly || widget.tipe === TipeWidgetWorksheet.AUDIO_PLAYER}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Navigation + Submit ── */}
      <div className="flex items-center gap-3">
        {halamanIdx > 0 && (
          <button
            type="button"
            onClick={() => setHalamanIdx((i) => i - 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft size={14} /> Sebelumnya
          </button>
        )}

        <div className="flex-1" />

        {halamanIdx < halaman.length - 1 ? (
          <button
            type="button"
            onClick={() => setHalamanIdx((i) => i + 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            Halaman Berikutnya <ChevronRight size={14} />
          </button>
        ) : !isSubmitted && (
          <button
            type="button"
            onClick={() => setSubmitOpen(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            <Send size={14} /> Kumpulkan Worksheet
          </button>
        )}
      </div>

      {/* ── Submit confirmation modal ── */}
      {submitOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setSubmitOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Kumpulkan Worksheet?</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Setelah dikumpulkan tidak bisa diubah</p>
              </div>
            </div>

            {totalCount > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-bold text-blue-600 dark:text-blue-400">{answeredCount}</span> dari{' '}
                  <span className="font-bold">{totalCount}</span> soal dijawab
                </p>
                {answeredCount < totalCount && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={10} />
                    {totalCount - answeredCount} soal belum dijawab
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSubmitOpen(false)}
                className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {submitMutation.isPending
                  ? <><Loader2 size={14} className="animate-spin" /> Mengumpulkan…</>
                  : <><Send size={14} /> Ya, Kumpulkan</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
