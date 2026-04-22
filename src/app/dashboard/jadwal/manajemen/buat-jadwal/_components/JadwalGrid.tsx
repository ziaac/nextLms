'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight, Coffee } from 'lucide-react'
import type { HariConfig, CellKey, CellState, GridState, PaletteMapel } from './jadwal-form.types'
import type { HariEnum } from '@/types/jadwal.types'
import type { MasterJam } from '@/types/master-jam.types'
import { JadwalCell } from './JadwalCell'

const HARI_LABEL: Record<HariEnum, string> = {
  SENIN: 'Senin', SELASA: 'Selasa', RABU: 'Rabu',
  KAMIS: 'Kamis', JUMAT:  "Jum'at", SABTU: 'Sabtu',
}

interface Props {
  hariConfig:       HariConfig[]
  gridState:        GridState
  paletteMapel:     PaletteMapel[]
  masterJamREGULER: MasterJam[]
  masterJamJUMAT:   MasterJam[]
  focusedCellKey:   CellKey | null
  forbiddenCells:   Set<CellKey>
  onFocusCell:      (key: CellKey) => void
  onUpdateCell:     (key: CellKey, patch: Partial<CellState>) => void
  onClearCell:      (key: CellKey) => void
}

export function JadwalGrid({
  hariConfig, gridState, paletteMapel,
  masterJamREGULER, masterJamJUMAT,
  focusedCellKey, forbiddenCells,
  onFocusCell, onUpdateCell, onClearCell,
}: Props) {
  const activeHari  = hariConfig.filter((h) => h.aktif)
  const hariREGULER = activeHari.filter((h) => h.hari !== 'JUMAT')
  const hariJUMAT   = activeHari.filter((h) => h.hari === 'JUMAT')
  const hasREGULER  = hariREGULER.length > 0 && masterJamREGULER.length > 0
  const hasJUMAT    = hariJUMAT.length   > 0 && masterJamJUMAT.length   > 0

  if (!hasREGULER && !hasJUMAT) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
        Belum ada master jam untuk tingkat ini.
      </div>
    )
  }

  const sortedREG   = [...masterJamREGULER].sort((a, b) => a.urutan - b.urutan)
  const sortedJUMAT = [...masterJamJUMAT].sort((a, b) => a.urutan - b.urutan)

  return (
    <div className="pb-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      {hasREGULER && (
        <ScrollSection>
          <HeaderRow masterJamList={sortedREG} />
          <BodyRows hariList={hariREGULER} masterJamList={sortedREG}
            gridState={gridState} paletteMapel={paletteMapel}
            focusedCellKey={focusedCellKey} forbiddenCells={forbiddenCells}
            onFocusCell={onFocusCell} onClearCell={onClearCell} />
        </ScrollSection>
      )}

      {hasREGULER && hasJUMAT && (
        <div className="h-px bg-gray-100 dark:bg-gray-800" />
      )}

      {hasJUMAT && (
        <ScrollSection>
          <HeaderRow masterJamList={sortedJUMAT} subtle={hasREGULER} />
          <BodyRows hariList={hariJUMAT} masterJamList={sortedJUMAT}
            gridState={gridState} paletteMapel={paletteMapel}
            focusedCellKey={focusedCellKey} forbiddenCells={forbiddenCells}
            onFocusCell={onFocusCell} onClearCell={onClearCell} />
        </ScrollSection>
      )}
    </div>
  )
}

// ── ScrollSection — overlay arrow, pointer-events hanya pada button ──
function ScrollSection({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scroll = (dir: 'left' | 'right') =>
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' })

  return (
    <div className="relative group/scroll">
      {/* Konten scroll — sembunyikan scrollbar */}
      <div
        ref={scrollRef}
        className="overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {children}
      </div>

      {/* Overlay KIRI — pointer-events-none di container, hanya button yg clickable */}
      <div className="absolute left-0 top-0 bottom-0 w-8 z-20 pointer-events-none flex items-center justify-start
                      opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-200">
        <button
          type="button"
          onClick={() => scroll('left')}
          className="pointer-events-auto ml-1 flex items-center justify-center h-7 w-7 rounded-full
                     bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm
                     border border-gray-200 dark:border-gray-700 shadow-sm
                     text-gray-500 dark:text-gray-400
                     hover:bg-white dark:hover:bg-gray-900
                     hover:text-emerald-600 dark:hover:text-emerald-400
                     hover:border-emerald-200 dark:hover:border-emerald-600
                     hover:shadow-md transition-all"
          aria-label="Scroll kiri"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Overlay KANAN — pointer-events-none di container, hanya button yg clickable */}
      <div className="absolute right-0 top-0 bottom-0 w-8 z-20 pointer-events-none flex items-center justify-end
                      opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-200">
        <button
          type="button"
          onClick={() => scroll('right')}
          className="pointer-events-auto mr-1 flex items-center justify-center h-7 w-7 rounded-full
                     bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm
                     border border-gray-200 dark:border-gray-700 shadow-sm
                     text-gray-500 dark:text-gray-400
                     hover:bg-white dark:hover:bg-gray-900
                     hover:text-emerald-600 dark:hover:text-emerald-400
                     hover:border-emerald-200 dark:hover:border-emerald-600
                     hover:shadow-md transition-all"
          aria-label="Scroll kanan"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function HeaderRow({ masterJamList, subtle = false }: { masterJamList: MasterJam[]; subtle?: boolean }) {
  return (
    <div className={'flex border-b border-gray-200 dark:border-gray-700 min-w-max ' +
      (subtle ? 'bg-gray-50/60 dark:bg-gray-800/30' : 'bg-gray-50 dark:bg-gray-800')}>
      <div className="w-20 shrink-0 border-r border-gray-200 dark:border-gray-700 sticky left-0 bg-inherit z-10" />
      {masterJamList.map((mj) => (
        <div key={mj.id} className={'w-44 shrink-0 px-2 py-2.5 border-r border-gray-200 dark:border-gray-700 last:border-r-0 text-center ' +
          (mj.isIstirahat ? 'bg-amber-50 dark:bg-amber-900/10' : '')}>
          {mj.isIstirahat ? (
            <div className="flex flex-col items-center gap-0.5">
              <Coffee className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Istirahat</span>
            </div>
          ) : (
            <>
              <p className={'text-xs font-semibold ' + (subtle ? 'text-gray-500' : 'text-gray-700 dark:text-gray-200')}>{mj.namaSesi}</p>
              <p className={'text-sm font-bold font-mono mt-0.5 ' + (subtle ? 'text-gray-600' : 'text-gray-800 dark:text-gray-100')}>{mj.jamMulai}</p>
              <p className={'text-xs font-semibold font-mono leading-none ' + (subtle ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400')}>{mj.jamSelesai}</p>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

function BodyRows({ hariList, masterJamList, gridState, paletteMapel, focusedCellKey, forbiddenCells, onFocusCell, onClearCell }: {
  hariList: HariConfig[]; masterJamList: MasterJam[]
  gridState: GridState; paletteMapel: PaletteMapel[]
  focusedCellKey: CellKey | null; forbiddenCells: Set<CellKey>
  onFocusCell: (key: CellKey) => void; onClearCell: (key: CellKey) => void
}) {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800 min-w-max">
      {hariList.map(({ hari }) => (
        <div key={hari} className="flex">
          <div className="w-20 shrink-0 px-3 py-2 flex items-center bg-gray-50 dark:bg-gray-800/50 border-r border-gray-100 dark:border-gray-800 sticky left-0 z-10">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{HARI_LABEL[hari]}</span>
          </div>
          {masterJamList.map((mj) => {
            const cellKey: CellKey = hari + '-' + mj.id
            if (mj.isIstirahat) {
              return (
                <div key={mj.id} className="w-44 shrink-0 border-r border-gray-100 dark:border-gray-800 last:border-r-0 bg-amber-50/30 dark:bg-amber-900/5 flex items-center justify-center p-2">
                  <span className="text-[10px] text-amber-400">—</span>
                </div>
              )
            }
            return (
              <div key={mj.id} className="w-44 shrink-0 border-r border-gray-100 dark:border-gray-800 last:border-r-0 p-1.5">
                <JadwalCell
                  cellKey={cellKey} cellState={gridState[cellKey]}
                  paletteMapel={paletteMapel} masterJam={mj}
                  isFocused={focusedCellKey === cellKey}
                  isForbidden={forbiddenCells.has(cellKey)}
                  onFocus={() => onFocusCell(cellKey)}
                  onClear={() => onClearCell(cellKey)}
                />
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
