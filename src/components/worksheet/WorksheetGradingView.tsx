'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  Clock, Loader2, Star, Send, AlertCircle,
} from 'lucide-react'
import { useWorksheetDefinition, useWorksheetGradingDetail,
         useGradeWorksheetManual } from '@/hooks/worksheet/useWorksheet'
import { WorksheetWidgetRenderer } from './WorksheetWidgetRenderer'
import { AUTO_GRADE_TYPES, INPUT_TYPES, TipeWidgetWorksheet } from '@/types/worksheet.types'
import type { WidgetWorksheet, KonfigurasiWidget } from '@/types/worksheet.types'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Props {
  tugasId:       string
  siswaId:       string
  namaSiswa?:    string
  onClose?:      () => void
}

export function WorksheetGradingView({ tugasId, siswaId, namaSiswa, onClose }: Props) {
  const [halamanIdx,  setHalamanIdx]  = useState(0)
  const [imgLoaded,   setImgLoaded]   = useState(false)
  const [manualNilai, setManualNilai] = useState('')
  const [catatan,     setCatatan]     = useState('')

  // Reset loading state setiap ganti halaman
  React.useEffect(() => {
    setImgLoaded(false)
  }, [halamanIdx])

  const { data: def,    isLoading: defLoading }    = useWorksheetDefinition(tugasId)
  const { data: detail, isLoading: detailLoading } = useWorksheetGradingDetail(tugasId, siswaId)
  const gradeMutation = useGradeWorksheetManual()

  const halaman   = def?.halaman ?? []
  const jawaban   = detail?.jawaban ?? {}
  const currentH  = halaman[halamanIdx]

  // Hitung skor auto
  const allWidgets = halaman.flatMap((h) => h.widget)
  const autoWidgets = allWidgets.filter((w) => AUTO_GRADE_TYPES.includes(w.tipe))
  const manualWidgets = allWidgets.filter((w) =>
    [TipeWidgetWorksheet.TEXT_INPUT, TipeWidgetWorksheet.DRAWING_AREA].includes(w.tipe),
  )

  let autoCorrect = 0
  let autoTotal   = 0
  for (const w of autoWidgets) {
    const cfg = (w.konfigurasi ?? {}) as KonfigurasiWidget
    if (!cfg.correctAnswer) continue
    autoTotal++
    const ans = (jawaban[w.id] ?? '').trim().toLowerCase()
    if (ans === cfg.correctAnswer.trim().toLowerCase()) autoCorrect++
  }

  const hasManual    = manualWidgets.length > 0
  const alreadyGraded = detail?.status === 'DINILAI'

  const handleGrade = async () => {
    const n = Number(manualNilai)
    if (isNaN(n) || n < 0 || n > 100) {
      toast.error('Nilai harus antara 0–100')
      return
    }
    try {
      await gradeMutation.mutateAsync({
        pengumpulanId: detail!.pengumpulanId,
        nilaiManual: n,
        catatan: catatan || undefined,
      })
      toast.success(`Nilai ${n} berhasil disimpan`)
      onClose?.()
    } catch {
      toast.error('Gagal menyimpan nilai')
    }
  }

  const loading = defLoading || detailLoading

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 min-h-[60vh]">

      {/* ── Header info ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{namaSiswa ?? detail?.namaSiswa}</h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            {detail?.tanggalSubmit && (
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {format(new Date(detail.tanggalSubmit), 'd MMM yyyy HH:mm', { locale: localeId })}
              </span>
            )}
            {detail?.isLate && (
              <span className="flex items-center gap-1 text-amber-500 font-semibold">
                <AlertCircle size={10} /> Terlambat
              </span>
            )}
          </div>
        </div>

        {/* Score summary */}
        <div className="flex items-center gap-2">
          {autoTotal > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-center">
              <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide">Auto</p>
              <p className="text-base font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                {autoCorrect}/{autoTotal}
              </p>
            </div>
          )}
          {alreadyGraded && detail?.nilai !== null && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center">
              <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wide">Nilai</p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {detail.nilai}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Page tabs ── */}
      {halaman.length > 1 && (
        <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {halaman.map((h, i) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setHalamanIdx(i)}
              className={cn(
                'shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                halamanIdx === i
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
              )}
            >
              Hal {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* ── Worksheet page with answers overlaid ── */}
      {currentH && (
        <div className="relative rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 min-h-64">

          {/* Gambar — opacity-0 saat loading mencegah progressive paint */}
          <img
            key={currentH.id}
            src={currentH.imageUrl}
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
              <div className="w-full px-8 flex flex-col gap-3 opacity-40">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-3 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse"
                    style={{ width: `${70 + (i % 3) * 10}%`, animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
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
          {imgLoaded && currentH.widget.map((widget: WidgetWorksheet) => {
            const cfg      = (widget.konfigurasi ?? {}) as KonfigurasiWidget
            const isAuto   = AUTO_GRADE_TYPES.includes(widget.tipe)
            const showCorr = isAuto && !!cfg.correctAnswer
            const ans      = jawaban[widget.id] ?? ''

            return (
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
                  mode="grading"
                  value={ans}
                  isReadOnly
                  showCorrect={showCorr}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* ── Page navigation ── */}
      {halaman.length > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={halamanIdx === 0}
            onClick={() => setHalamanIdx((i) => i - 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft size={12} /> Sebelumnya
          </button>
          <span className="text-xs text-gray-400">{halamanIdx + 1} / {halaman.length}</span>
          <button
            type="button"
            disabled={halamanIdx === halaman.length - 1}
            onClick={() => setHalamanIdx((i) => i + 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Berikutnya <ChevronRight size={12} />
          </button>
        </div>
      )}

      {/* ── Manual grading panel ── */}
      {hasManual && (
        <div className={cn(
          'rounded-2xl border p-4',
          alreadyGraded
            ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
            : 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10',
        )}>
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} className={alreadyGraded ? 'text-emerald-500' : 'text-amber-500'} />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {alreadyGraded ? 'Nilai Sudah Tersimpan' : 'Input Nilai Manual'}
            </p>
            <span className="text-xs text-gray-400">
              (worksheet ini mengandung soal isian/drawing)
            </span>
          </div>

          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Nilai (0–100)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={manualNilai || (alreadyGraded ? String(detail?.nilai ?? '') : '')}
                onChange={(e) => setManualNilai(e.target.value)}
                disabled={alreadyGraded}
                placeholder="Mis: 85"
                className={cn(
                  'w-24 rounded-xl border px-3 py-2 text-sm font-bold text-center outline-none transition-colors',
                  alreadyGraded
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'border-amber-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-300/30',
                )}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Catatan (opsional)</label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                disabled={alreadyGraded}
                placeholder="Komentar untuk siswa…"
                className={cn(
                  'w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors',
                  alreadyGraded
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'border-gray-200 dark:border-gray-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-300/30',
                )}
              />
            </div>
            {!alreadyGraded && (
              <button
                type="button"
                disabled={gradeMutation.isPending || !manualNilai}
                onClick={handleGrade}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                  gradeMutation.isPending || !manualNilai
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
                )}
              >
                {gradeMutation.isPending
                  ? <><Loader2 size={13} className="animate-spin" /> Menyimpan…</>
                  : <><Send size={13} /> Simpan Nilai</>
                }
              </button>
            )}
          </div>
        </div>
      )}

      {/* Auto-only grading */}
      {!hasManual && !alreadyGraded && autoTotal > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-600 dark:text-blue-400">
          <CheckCircle2 size={13} />
          Worksheet ini sudah di-grade otomatis ({autoCorrect}/{autoTotal} benar)
        </div>
      )}
    </div>
  )
}
