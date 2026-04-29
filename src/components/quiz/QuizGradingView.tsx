'use client'

import { useMemo } from 'react'
import { CheckCircle2, XCircle, Circle, MessageSquare, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrivateImage } from '@/components/ui/PrivateImage'
import type { SoalKuis } from '@/types/tugas.types'
import { TipeSoalKuis } from '@/types/tugas.types'

interface Props {
  soalKuis:   SoalKuis[]
  /** jawaban siswa — JSON string dari field `jawaban` di PengumpulanTugas */
  jawabanRaw: string | null | undefined
  bobot:      number
}

export interface QuizGradingResult {
  /** Skor MC yang sudah discale ke bobot tugas */
  autoNilai:   number
  autoCorrect: number
  autoTotal:   number
  hasEssay:    boolean
}

/** Parse jawaban JSON → map soalId → jawaban */
function parseJawaban(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
  } catch { /* bukan JSON */ }
  return {}
}

/** Hitung skor MC */
function hitungSkorMC(
  soalKuis: SoalKuis[],
  jawaban:  Record<string, string>,
  bobot:    number,
): { autoCorrect: number; autoTotal: number; autoNilai: number } {
  let totalBobot  = 0
  let earnedBobot = 0
  for (const soal of soalKuis) {
    if (soal.tipe !== TipeSoalKuis.MULTIPLE_CHOICE) continue
    totalBobot += soal.bobot
    const selId = jawaban[soal.id]
    if (selId) {
      const opsi = soal.opsi?.find((o) => o.id === selId)
      if (opsi?.isCorrect) earnedBobot += soal.bobot
    }
  }
  const autoNilai = totalBobot > 0 ? Math.round((earnedBobot / totalBobot) * bobot) : 0
  return { autoCorrect: earnedBobot, autoTotal: totalBobot, autoNilai }
}

export function QuizGradingView({ soalKuis, jawabanRaw, bobot }: Props) {
  const jawaban = useMemo(() => parseJawaban(jawabanRaw), [jawabanRaw])

  const sorted = useMemo(
    () => [...soalKuis].sort((a, b) => a.urutan - b.urutan),
    [soalKuis],
  )

  const mcSoal    = sorted.filter((s) => s.tipe === TipeSoalKuis.MULTIPLE_CHOICE)
  const essaySoal = sorted.filter((s) => s.tipe === TipeSoalKuis.ESSAY)
  const hasEssay  = essaySoal.length > 0

  const { autoCorrect, autoTotal, autoNilai } = useMemo(
    () => hitungSkorMC(soalKuis, jawaban, bobot),
    [soalKuis, jawaban, bobot],
  )

  const mcAnswered = mcSoal.filter((s) => !!jawaban[s.id]).length
  const pctBenar   = autoTotal > 0
    ? Math.round((autoCorrect / autoTotal) * 100)
    : 0

  return (
    <div className="space-y-5">

      {/* ── Ringkasan skor MC ── */}
      {mcSoal.length > 0 && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
          <Award size={16} className="text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              Skor Pilihan Ganda
            </p>
            <p className="text-[11px] text-blue-600/80 dark:text-blue-400 mt-0.5">
              {mcAnswered}/{mcSoal.length} dijawab · {pctBenar}% benar
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 tabular-nums">
              {autoNilai}
            </p>
            <p className="text-[10px] text-blue-500/70 dark:text-blue-500">dari {bobot} poin</p>
          </div>
        </div>
      )}

      {/* ── Soal Pilihan Ganda ── */}
      {mcSoal.length > 0 && (
        <div className="space-y-3">
          {mcSoal.map((soal, idx) => {
            const selId   = jawaban[soal.id]
            const opsiList = soal.opsi ?? []
            const selOpsi  = opsiList.find((o) => o.id === selId)
            const isBenar  = selOpsi?.isCorrect === true
            const dijawab  = !!selId

            return (
              <div
                key={soal.id}
                className={cn(
                  'rounded-xl border p-3.5 space-y-2.5',
                  !dijawab
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40'
                    : isBenar
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
                      : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10',
                )}
              >
                {/* Pertanyaan */}
                <div className="flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                      {soal.pertanyaan}
                    </p>
                    {soal.bobot > 1 && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{soal.bobot} poin</p>
                    )}
                  </div>
                  {/* Status icon */}
                  {dijawab
                    ? isBenar
                      ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                      : <XCircle     size={15} className="text-red-400 shrink-0 mt-0.5" />
                    : <Circle        size={15} className="text-gray-300 shrink-0 mt-0.5" />
                  }
                </div>

                {/* Gambar soal */}
                {soal.gambarUrl && (
                  <PrivateImage
                    fileKey={soal.gambarUrl}
                    alt={`Gambar soal ${idx + 1}`}
                    skeletonHeight={120}
                  />
                )}

                {/* Opsi */}
                <div className="space-y-1.5 pl-7">
                  {opsiList.map((opsi, oi) => {
                    const dipilih  = opsi.id === selId
                    const benar    = opsi.isCorrect
                    const label    = String.fromCharCode(65 + oi)

                    return (
                      <div
                        key={opsi.id}
                        className={cn(
                          'flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors',
                          benar
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                            : dipilih && !benar
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : 'text-gray-600 dark:text-gray-400',
                        )}
                      >
                        <span className="shrink-0 font-bold w-4">{label}.</span>
                        <span className="flex-1">{opsi.teks}</span>
                        {benar && (
                          <CheckCircle2 size={11} className="text-emerald-500 shrink-0 mt-0.5" />
                        )}
                        {dipilih && !benar && (
                          <XCircle size={11} className="text-red-400 shrink-0 mt-0.5" />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Tidak dijawab */}
                {!dijawab && (
                  <p className="text-[11px] text-gray-400 italic pl-7">Tidak dijawab</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Soal Essay ── */}
      {hasEssay && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={13} className="text-purple-500" />
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Soal Essay — perlu dinilai guru
            </p>
          </div>

          {essaySoal.map((soal, idx) => {
            const jawabanEssay = jawaban[soal.id] ?? ''
            const dijawab      = !!jawabanEssay.trim()

            return (
              <div
                key={soal.id}
                className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-900/10 p-3.5 space-y-2.5"
              >
                {/* Pertanyaan */}
                <div className="flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-[10px] font-bold text-purple-600 dark:text-purple-300 mt-0.5">
                    {mcSoal.length + idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                      {soal.pertanyaan}
                    </p>
                    {soal.bobot > 1 && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{soal.bobot} poin</p>
                    )}
                  </div>
                </div>

                {/* Jawaban siswa */}
                {dijawab ? (
                  <div className="pl-7">
                    <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 mb-1">
                      Jawaban Siswa:
                    </p>
                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-purple-200 dark:border-purple-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {jawabanEssay}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 italic pl-7">Tidak dijawab</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Hook-like helper — hitung data autograding untuk dikirim ke PenilaianPanel */
export function getQuizAutoData(
  soalKuis:   SoalKuis[],
  jawabanRaw: string | null | undefined,
  bobot:      number,
): { autoNilai: number; autoTotal: number; hasEssay: boolean } {
  const jawaban = parseJawaban(jawabanRaw)
  const { autoNilai, autoTotal } = hitungSkorMC(soalKuis, jawaban, bobot)
  const hasEssay = soalKuis.some((s) => s.tipe === TipeSoalKuis.ESSAY)
  return { autoNilai, autoTotal, hasEssay }
}
