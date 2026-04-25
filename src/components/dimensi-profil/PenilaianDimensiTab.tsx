'use client'

import { useMemo, useState, useRef, useCallback }    from 'react'
import { createPortal }                              from 'react-dom'
import { Save, BookOpen, Info, ChevronRight, X }     from 'lucide-react'
import { cn }                                        from '@/lib/utils'
import { usePenilaianGrid, useBulkUpsertPenilaian }  from '@/hooks/dimensi-profil/useDimensiProfil'
import { Button }                                    from '@/components/ui'
import { Spinner }                                   from '@/components/ui/Spinner'
import { toast }                                     from 'sonner'
import type {
  LevelDimensi,
  SubDimensiWithDimensi,
  SiswaItem,
} from '@/types/dimensi-profil.types'

// ── Level config ─────────────────────────────────────────────────────────────
const LEVEL_CONFIG: Record<LevelDimensi, { label: string; bg: string; text: string }> = {
  BERKEMBANG: { label: 'B', bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-400'     },
  CAKAP:      { label: 'C', bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-700 dark:text-blue-400'       },
  MAHIR:      { label: 'M', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
}
const LEVELS: LevelDimensi[] = ['BERKEMBANG', 'CAKAP', 'MAHIR']

// ── Rubrik Detail Modal ──────────────────────────────────────────────────────
function RubrikDetailModal({
  subs,
  onClose,
}: {
  subs: SubDimensiWithDimensi[]
  onClose: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Detail Rubrik Dimensi Profil</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Body */}
          <div className="overflow-y-auto flex-1 p-5 space-y-5">
            {/* Group by dimensi */}
            {Object.values(
              subs.reduce<Record<string, { dimensi: SubDimensiWithDimensi['dimensi']; subs: SubDimensiWithDimensi[] }>>(
                (acc, sub) => {
                  const did = sub.dimensi.id
                  if (!acc[did]) acc[did] = { dimensi: sub.dimensi, subs: [] }
                  acc[did].subs.push(sub)
                  return acc
                },
                {},
              ),
            )
              .sort((a, b) => a.dimensi.urutan - b.dimensi.urutan)
              .map(({ dimensi, subs: dimSubs }) => (
                <div key={dimensi.id}>
                  {/* Dimensi header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      {dimensi.kode}
                    </span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{dimensi.nama}</span>
                  </div>
                  <div className="space-y-3 pl-2">
                    {dimSubs.map((sub) => (
                      <div
                        key={sub.id}
                        className="rounded-xl border border-gray-100 dark:border-gray-700/50 p-3 space-y-2"
                      >
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span className="text-gray-400 mr-1">{sub.kode}</span>
                          {sub.nama}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { lv: 'BERKEMBANG' as LevelDimensi, label: 'B — Berkembang', text: sub.keteranganB, cls: 'text-amber-600 dark:text-amber-400' },
                            { lv: 'CAKAP'      as LevelDimensi, label: 'C — Cakap',      text: sub.keteranganC, cls: 'text-blue-600 dark:text-blue-400' },
                            { lv: 'MAHIR'      as LevelDimensi, label: 'M — Mahir',      text: sub.keteranganM, cls: 'text-emerald-600 dark:text-emerald-400' },
                          ].map((r) => (
                            <div
                              key={r.lv}
                              className={cn(
                                'rounded-lg p-2 text-[10px] leading-relaxed',
                                LEVEL_CONFIG[r.lv].bg,
                              )}
                            >
                              <p className={cn('font-bold mb-0.5', r.cls)}>{r.label}</p>
                              <p className="text-gray-600 dark:text-gray-400">{r.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Inline (i) rubrik popup per sub-dimensi ──────────────────────────────────
function RubrikInlinePopup({ sub }: { sub: SubDimensiWithDimensi }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-300 hover:text-gray-500 transition-colors"
        title="Lihat rubrik"
      >
        <Info className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 -translate-x-1/2 top-5 z-50 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2 text-left">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{sub.kode} — {sub.nama}</p>
            {[
              { level: 'BERKEMBANG' as LevelDimensi, label: 'B — Berkembang', text: sub.keteranganB, cls: 'text-amber-600' },
              { level: 'CAKAP'      as LevelDimensi, label: 'C — Cakap',      text: sub.keteranganC, cls: 'text-blue-600'  },
              { level: 'MAHIR'      as LevelDimensi, label: 'M — Mahir',      text: sub.keteranganM, cls: 'text-emerald-600' },
            ].map((r) => (
              <div key={r.level}>
                <p className={cn('text-[10px] font-bold mb-0.5', r.cls)}>{r.label}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug">{r.text}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Level cell with dropdown (portal — avoids overflow clipping) ──────────────
interface CellProps {
  currentLevel: LevelDimensi | null
  onChange:     (level: LevelDimensi | null) => void
}

function LevelCell({ currentLevel, onChange }: CellProps) {
  const [open, setOpen]   = useState(false)
  const [pos,  setPos]    = useState({ top: 0, left: 0 })
  const btnRef            = useRef<HTMLButtonElement>(null)
  const cfg               = currentLevel ? LEVEL_CONFIG[currentLevel] : null

  const handleOpen = useCallback(() => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left + r.width / 2 })
    }
    setOpen((v) => !v)
  }, [open])

  const dropdown = open
    ? createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[9999] bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]"
            style={{ top: pos.top, left: pos.left, transform: 'translateX(-50%)' }}
          >
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false) }}
              className="w-full px-3 py-1.5 text-left text-xs text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              — Belum dinilai
            </button>
            {LEVELS.map((lv) => {
              const c = LEVEL_CONFIG[lv]
              return (
                <button
                  key={lv}
                  type="button"
                  onClick={() => { onChange(lv); setOpen(false) }}
                  className={cn(
                    'w-full px-3 py-1.5 text-left text-xs font-medium transition-colors',
                    c.text,
                    currentLevel === lv ? c.bg + ' font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-800',
                  )}
                >
                  <span className={cn('inline-block w-5 font-bold', c.text)}>{c.label}</span>
                  {' '}{lv.charAt(0) + lv.slice(1).toLowerCase()}
                </button>
              )
            })}
          </div>
        </>,
        document.body,
      )
    : null

  return (
    <div className="flex items-center justify-center">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className={cn(
          'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
          cfg
            ? `${cfg.bg} ${cfg.text}`
            : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700',
        )}
      >
        {cfg ? cfg.label : '—'}
      </button>
      {dropdown}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  mataPelajaranId: string
  mapelNama?:      string
}

export function PenilaianDimensiTab({ mataPelajaranId, mapelNama }: Props) {
  const { data, isLoading, isError } = usePenilaianGrid(mataPelajaranId || null)
  const saveMutation = useBulkUpsertPenilaian(mataPelajaranId)

  const [localMap,     setLocalMap]     = useState<Record<string, LevelDimensi | null>>({})
  const [dirty,        setDirty]        = useState(false)
  const [rubrikOpen,   setRubrikOpen]   = useState(false)

  // Merge server data with local edits
  const mergedMap = useMemo(() => {
    if (!data) return localMap
    const base: Record<string, LevelDimensi | null> = {}
    Object.entries(data.penilaianMap).forEach(([k, v]) => { base[k] = v.level })
    return { ...base, ...localMap }
  }, [data, localMap])

  const setCell = (siswaId: string, subDimensiId: string, level: LevelDimensi | null) => {
    setLocalMap((prev) => ({ ...prev, [`${siswaId}__${subDimensiId}`]: level }))
    setDirty(true)
  }

  const handleSave = async () => {
    if (!data) return
    const items = data.siswaList.flatMap((s) =>
      data.subDimensiList.map((sub) => ({
        siswaId:      s.id,
        subDimensiId: sub.id,
        level:        mergedMap[`${s.id}__${sub.id}`] ?? null,
      })),
    )
    try {
      await saveMutation.mutateAsync({ items })
      setLocalMap({})
      setDirty(false)
      toast.success('Penilaian Dimensi Profil berhasil disimpan')
    } catch {
      toast.error('Gagal menyimpan penilaian')
    }
  }

  // Group sub-dimensi by dimensi for column headers
  const groups = useMemo(() => {
    if (!data) return []
    const map: Record<string, { dimensi: SubDimensiWithDimensi['dimensi']; subs: SubDimensiWithDimensi[] }> = {}
    for (const sub of data.subDimensiList) {
      const did = sub.dimensi.id
      if (!map[did]) map[did] = { dimensi: sub.dimensi, subs: [] }
      map[did].subs.push(sub)
    }
    return Object.values(map).sort((a, b) => a.dimensi.urutan - b.dimensi.urutan)
  }, [data])

  // ── Render states ────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex items-center justify-center py-16"><Spinner /></div>
  )
  if (isError) return (
    <p className="text-sm text-red-500 text-center py-10 italic">Gagal memuat data penilaian.</p>
  )
  if (!data) return null

  if (data.subDimensiList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <BookOpen className="h-10 w-10 text-gray-200 dark:text-gray-700" />
        <p className="text-sm text-gray-400 text-center max-w-xs">
          Belum ada dimensi profil yang dipilih untuk mata pelajaran ini.
          Hubungi manajemen untuk mengatur dimensi di halaman Mata Pelajaran per Tingkat.
        </p>
      </div>
    )
  }

  if (data.siswaList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <BookOpen className="h-10 w-10 text-gray-200 dark:text-gray-700" />
        <p className="text-sm text-gray-400">Belum ada siswa di kelas ini.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Penilaian Dimensi Profil
          </p>
          <p className="text-xs text-gray-400">
            {data.siswaList.length} siswa · {data.subDimensiList.length} sub-dimensi
            {mapelNama && ` · ${mapelNama}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Info size={14} />}
            onClick={() => setRubrikOpen(true)}
          >
            Lihat Detail Rubrik
          </Button>
          <Button
            size="sm"
            leftIcon={<Save size={14} />}
            onClick={() => { void handleSave() }}
            loading={saveMutation.isPending}
            disabled={!dirty}
          >
            Simpan
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {LEVELS.map((lv) => {
          const c = LEVEL_CONFIG[lv]
          return (
            <div key={lv} className="flex items-center gap-1.5">
              <span className={cn('inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold', c.bg, c.text)}>
                {c.label}
              </span>
              <span className="text-xs text-gray-500">{lv.charAt(0) + lv.slice(1).toLowerCase()}</span>
            </div>
          )
        })}
        <span className="text-xs text-gray-400 ml-1">· Klik sel untuk ubah nilai · <Info className="inline w-3 h-3" /> untuk keterangan rubrik</span>
      </div>

      {/* Single horizontal table — all sub-dimensi as columns, grouped by dimensi */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <table className="w-full text-sm border-collapse">
          <thead>
            {/* Row 1: Dimensi group headers with colSpan */}
            <tr className="bg-gray-50 dark:bg-gray-800/60">
              <th
                rowSpan={2}
                className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-r border-gray-200 dark:border-gray-700 sticky left-0 bg-gray-50 dark:bg-gray-800/60 z-10 min-w-[160px]"
              >
                Siswa
              </th>
              {groups.map((group) => (
                <th
                  key={group.dimensi.id}
                  colSpan={group.subs.length}
                  className="px-2 py-2 text-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border-b border-r last:border-r-0 border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30">
                      {group.dimensi.kode}
                    </span>
                    <span className="hidden sm:inline font-semibold">{group.dimensi.nama}</span>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                    <span className="text-[9px] text-gray-400 font-normal">{group.subs.length} sub</span>
                  </div>
                </th>
              ))}
            </tr>
            {/* Row 2: Sub-dimensi column headers */}
            <tr className="bg-gray-50 dark:bg-gray-800/60">
              {groups.flatMap((group) =>
                group.subs.map((sub) => (
                  <th
                    key={sub.id}
                    className="px-1 py-2 text-center text-[10px] font-semibold text-gray-600 dark:text-gray-300 border-b border-r last:border-r-0 border-gray-200 dark:border-gray-700 min-w-[68px]"
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-0.5">
                        <span className="leading-snug">{sub.kode}</span>
                        <RubrikInlinePopup sub={sub} />
                      </div>
                      <span className="text-[9px] font-normal text-gray-400 dark:text-gray-500 line-clamp-1 max-w-[60px]">
                        {sub.nama}
                      </span>
                    </div>
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {data.siswaList.map((siswa: SiswaItem, rowIdx: number) => (
              <tr
                key={siswa.id}
                className={rowIdx % 2 === 0
                  ? 'bg-white dark:bg-gray-900'
                  : 'bg-gray-50/60 dark:bg-gray-800/20'}
              >
                {/* Sticky siswa name */}
                <td className="px-3 py-2 border-b border-r border-gray-100 dark:border-gray-800 sticky left-0 bg-inherit z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                      {siswa.namaLengkap.split(' ').slice(0, 2).map((n: string) => n[0] ?? '').join('').toUpperCase()}
                    </div>
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[110px]">
                      {siswa.namaLengkap}
                    </span>
                  </div>
                </td>
                {/* All sub-dimensi cells */}
                {groups.flatMap((group) =>
                  group.subs.map((sub) => (
                    <td
                      key={sub.id}
                      className="px-1 py-1.5 border-b border-r last:border-r-0 border-gray-100 dark:border-gray-800"
                    >
                      <div className="flex justify-center">
                        <LevelCell
                          currentLevel={mergedMap[`${siswa.id}__${sub.id}`] ?? null}
                          onChange={(level) => setCell(siswa.id, sub.id, level)}
                        />
                      </div>
                    </td>
                  )),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Floating save reminder */}
      {dirty && (
        <div className="sticky bottom-4 flex justify-end">
          <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-700/50 rounded-xl shadow-lg px-4 py-2.5">
            <span className="text-xs text-gray-500">Ada perubahan yang belum disimpan</span>
            <Button
              size="sm"
              leftIcon={<Save size={13} />}
              onClick={() => { void handleSave() }}
              loading={saveMutation.isPending}
            >
              Simpan Sekarang
            </Button>
          </div>
        </div>
      )}

      {/* Rubrik detail modal */}
      {rubrikOpen && (
        <RubrikDetailModal
          subs={data.subDimensiList}
          onClose={() => setRubrikOpen(false)}
        />
      )}
    </div>
  )
}
