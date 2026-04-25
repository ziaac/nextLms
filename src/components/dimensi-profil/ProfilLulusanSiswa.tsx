'use client'

import { useState }                   from 'react'
import { ChevronDown, BookOpen, Info } from 'lucide-react'
import { cn }                          from '@/lib/utils'
import { useRingkasanDimensiSiswa }    from '@/hooks/dimensi-profil/useDimensiProfil'
import { Spinner }                     from '@/components/ui/Spinner'
import type { LevelDimensi }           from '@/types/dimensi-profil.types'

// ── Level config ────────────────────────────────────────────────────
const LEVEL_CONFIG: Record<LevelDimensi, { label: string; full: string; bg: string; text: string; border: string }> = {
  BERKEMBANG: {
    label: 'B', full: 'Berkembang',
    bg:     'bg-amber-100 dark:bg-amber-900/30',
    text:   'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/50',
  },
  CAKAP: {
    label: 'C', full: 'Cakap',
    bg:     'bg-blue-100 dark:bg-blue-900/30',
    text:   'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800/50',
  },
  MAHIR: {
    label: 'M', full: 'Mahir',
    bg:     'bg-emerald-100 dark:bg-emerald-900/30',
    text:   'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800/50',
  },
}

interface Props {
  siswaId:    string
  semesterId: string
}

export function ProfilLulusanSiswa({ siswaId, semesterId }: Props) {
  const { data, isLoading, isError } = useRingkasanDimensiSiswa(
    siswaId || null,
    semesterId || null,
  )
  const [openDims, setOpenDims] = useState<Set<string>>(new Set())

  const toggleDim = (dimId: string) => {
    setOpenDims((prev) => {
      const next = new Set(prev)
      if (next.has(dimId)) next.delete(dimId)
      else next.add(dimId)
      return next
    })
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-16"><Spinner /></div>
  )

  if (isError) return (
    <p className="text-sm text-red-500 text-center py-10 italic">Gagal memuat data profil.</p>
  )

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <BookOpen className="h-10 w-10 text-gray-200 dark:text-gray-700" />
        <p className="text-sm text-gray-400 text-center max-w-xs">
          Belum ada penilaian Dimensi Profil Lulusan untuk semester ini.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header info */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          Penilaian Profil Pelajar Pancasila Rahmatan Lil Alamin per mata pelajaran.
          Level: <strong>B</strong> = Berkembang · <strong>C</strong> = Cakap · <strong>M</strong> = Mahir
        </p>
      </div>

      {/* Per dimensi */}
      {data.map((group) => {
        const isOpen = openDims.has(group.dimensi.id)
        const dinilaiBerapa = group.penilaian.filter((p) => p.level !== null).length
        const total         = group.penilaian.length

        // Distribusi level
        const dist = group.penilaian.reduce<Record<string, number>>((acc, p) => {
          if (p.level) acc[p.level] = (acc[p.level] ?? 0) + 1
          return acc
        }, {})

        return (
          <div
            key={group.dimensi.id}
            className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header dimensi */}
            <button
              type="button"
              onClick={() => toggleDim(group.dimensi.id)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                {group.dimensi.kode}
              </span>
              <div className="flex-1 text-left">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-snug line-clamp-1">
                  {group.dimensi.nama}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-400">
                    {dinilaiBerapa}/{total} dinilai
                  </span>
                  {/* Level distribution pills */}
                  <div className="flex gap-1">
                    {(['BERKEMBANG', 'CAKAP', 'MAHIR'] as LevelDimensi[]).map((lv) => {
                      const count = dist[lv] ?? 0
                      if (count === 0) return null
                      const c = LEVEL_CONFIG[lv]
                      return (
                        <span key={lv} className={cn('px-1.5 py-0.5 rounded-full text-[9px] font-bold border', c.bg, c.text, c.border)}>
                          {c.label}×{count}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform',
                  isOpen && 'rotate-180',
                )}
              />
            </button>

            {/* Sub-dimensi list */}
            {isOpen && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50 border-t border-gray-100 dark:border-gray-700/50">
                {group.penilaian.map((p) => {
                  const cfg = p.level ? LEVEL_CONFIG[p.level] : null
                  return (
                    <div
                      key={p.subDimensiId}
                      className="flex items-start gap-3 px-4 py-3 bg-white dark:bg-gray-900"
                    >
                      {/* Level badge */}
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold border',
                        cfg
                          ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 border-gray-100 dark:border-gray-700',
                      )}>
                        {cfg ? cfg.label : '—'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-gray-400">{p.subDimensiKode}</span>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{p.subDimensiNama}</p>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{p.mapelNama}</p>
                        {/* Rubrik keterangan sesuai level */}
                        {p.level && (
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-snug italic">
                            {p.level === 'BERKEMBANG' ? p.keteranganB
                              : p.level === 'CAKAP' ? p.keteranganC
                              : p.keteranganM}
                          </p>
                        )}
                        {p.catatan && (
                          <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-0.5 italic">
                            Catatan: {p.catatan}
                          </p>
                        )}
                        {!p.level && (
                          <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5 italic">
                            Belum dinilai
                          </p>
                        )}
                      </div>
                      {/* Level full label */}
                      {cfg && (
                        <span className={cn('text-[10px] font-semibold flex-shrink-0', cfg.text)}>
                          {cfg.full}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
