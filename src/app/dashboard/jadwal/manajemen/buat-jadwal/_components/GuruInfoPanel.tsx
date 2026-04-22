'use client'

import { useState, useMemo } from 'react'
import { useBebanMengajar } from '@/hooks/jadwal/useJadwal'
import { Spinner } from '@/components/ui'
import { User, ChevronDown, ChevronRight, Clock } from 'lucide-react'
import type { PaletteMapel } from './jadwal-form.types'
import type { GuruInGridEntry } from './jadwal-form.types'
import type { BebanMengajarResponse } from '@/types/jadwal.types'

interface Props {
  paletteMapel:  PaletteMapel[]
  guruInGrid:    Record<string, GuruInGridEntry>
  semesterId:    string
  focusedGuruId: string | null
  onFocusGuru:   (id: string | null) => void
}

const HARI_LABEL: Record<string, string> = {
  SENIN: 'Senin', SELASA: 'Selasa', RABU: 'Rabu',
  KAMIS: 'Kamis', JUMAT: 'Jumat',   SABTU: 'Sabtu',
}

export function GuruInfoPanel({ paletteMapel, guruInGrid, semesterId, focusedGuruId, onFocusGuru }: Props) {
  const allGurus = useMemo(() => {
    const map = new Map<string, { namaLengkap: string; mapelNama: string[] }>()
    for (const mapel of paletteMapel) {
      for (const g of mapel.guruPool) {
        if (!map.has(g.guruId)) map.set(g.guruId, { namaLengkap: g.namaLengkap, mapelNama: [] })
        map.get(g.guruId)!.mapelNama.push(mapel.nama)
      }
    }
    return Array.from(map.entries()).map(([guruId, info]) => ({ guruId, ...info }))
  }, [paletteMapel])

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden h-full">
      <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Info Guru</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{allGurus.length} guru tersedia</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {allGurus.length === 0 ? (
          <p className="text-xs text-gray-400 italic text-center py-4">Belum ada guru terdaftar</p>
        ) : (
          allGurus.map((guru) => (
            <GuruCard key={guru.guruId}
              guruId={guru.guruId} namaLengkap={guru.namaLengkap} mapelNama={guru.mapelNama}
              gridEntry={guruInGrid[guru.guruId] ?? null}
              semesterId={semesterId}
              isExpanded={focusedGuruId === guru.guruId}
              onToggle={() => onFocusGuru(focusedGuruId === guru.guruId ? null : guru.guruId)}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface GuruCardProps {
  guruId:      string
  namaLengkap: string
  mapelNama:   string[]
  gridEntry:   GuruInGridEntry | null
  semesterId:  string
  isExpanded:  boolean
  onToggle:    () => void
}

function GuruCard({ guruId, namaLengkap, mapelNama, gridEntry, semesterId, isExpanded, onToggle }: GuruCardProps) {
  const totalJP = gridEntry?.totalBobotJp ?? 0

  // semesterId opsional sekarang
  const { data: bebanRaw, isLoading: loadingBeban } = useBebanMengajar(
    isExpanded ? guruId : null,
    isExpanded ? semesterId : null,
  )
  const beban = bebanRaw as BebanMengajarResponse | undefined

  return (
    <div className={
      'rounded-lg border transition-colors ' +
      (isExpanded
        ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-30/50 dark:bg-emerald-900/10'
        : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50')
    }>
      <button type="button" onClick={onToggle}
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left">
        <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
          <User className="h-3 w-3 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate">{namaLengkap}</p>
          {totalJP > 0 && (
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{totalJP} JP di form ini</p>
          )}
        </div>
        {isExpanded
          ? <ChevronDown className="h-3 w-3 text-gray-400 shrink-0" />
          : <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />}
      </button>

      {isExpanded && (
        <div className="px-2.5 pb-2.5 space-y-2.5 border-t border-emerald-100 dark:border-emerald-800/30 pt-2">
          {/* JP di form ini */}
          {gridEntry && totalJP > 0 && (
            <div>
              <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
                {totalJP} JP di jadwal ini
              </p>
              {Object.entries(gridEntry.slotsByHari).map(([hari, slots]) => (
                <div key={hari} className="flex gap-1.5 items-start mb-0.5">
                  <span className="text-[9px] font-semibold text-gray-500 w-12 shrink-0 mt-0.5">
                    {HARI_LABEL[hari] ?? hari}
                  </span>
                  <div className="flex flex-wrap gap-0.5">
                    {slots.map((s, i) => (
                      <span key={i} className="text-[9px] font-mono bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1 py-0.5 rounded">
                        {s.label}
                        {s.bobotJp > 1 && <span className="ml-0.5 opacity-60">({s.bobotJp}JP)</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Beban dari DB — gunakan rincian + detail (field name benar) */}
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">Terjadwal di kelas lain</p>
            {loadingBeban ? <Spinner /> : beban && beban.totalSemuaJam > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <Clock className="h-2.5 w-2.5" />
                  <span className="font-semibold">{beban.totalSemuaJam} JP total</span>
                </div>
                {/* API: rincian (bukan rincianPerMapel) */}
                {(beban.rincian ?? []).map((r, i) => (
                  <div key={i} className="space-y-0.5">
                    <p className="text-[9px] font-semibold text-gray-600 dark:text-gray-400">{r.namaMapel}</p>
                    {/* API: detail (bukan detailJadwal) */}
                    {(r.detail ?? []).map((d, j) => (
                      <p key={j} className="text-[9px] text-gray-400 pl-1.5">
                        {d.kelas} · {HARI_LABEL[d.hari] ?? d.hari} {d.jam}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-gray-400 italic">Belum ada jadwal lain</p>
            )}
          </div>

          {/* Mengajar */}
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">Mengajar</p>
            <div className="flex flex-wrap gap-0.5">
              {mapelNama.map((n, i) => (
                <span key={i} className="text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">{n}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
