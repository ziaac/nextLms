'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { useMataPelajaranList, useMapelTingkatByTingkat } from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useBulkJadwalByKelas, useJadwalMingguan, useKetersediaan, useDeleteJadwal } from '@/hooks/jadwal/useJadwal'
import { useMasterJamByTingkat } from '@/hooks/master-jam/useMasterJam'
import { useRuanganByJenis } from '@/hooks/ruangan/useRuangan'
import { useUIStore } from '@/stores/ui.store'
import { Button, Spinner } from '@/components/ui'
import { Send, Maximize2, Minimize2, CalendarPlus, Trash2, RotateCcw } from 'lucide-react'
import { isTimeOverlap } from '@/lib/helpers/time'
import { MapelPalette } from './MapelPalette'
import { JadwalGrid } from './JadwalGrid'
import { KetersediaanPanel } from './KetersediaanPanel'
import { JadwalFormSkeleton } from './JadwalFormSkeleton'
import type {
  HariConfig, CellKey, CellState, GridState, PaletteMapel, GuruInGridEntry,
} from './jadwal-form.types'
import type { HariEnum, JadwalPelajaran, KetersediaanResponse } from '@/types/jadwal.types'
import type { MasterJam } from '@/types/master-jam.types'
import { HARI_LIST } from '@/types/jadwal.types'

const HARI_LABEL: Record<HariEnum, string> = {
  SENIN: 'Senin', SELASA: 'Selasa', RABU: 'Rabu',
  KAMIS: 'Kamis', JUMAT: 'Jumat',   SABTU: 'Sabtu',
}

interface RuanganOption { id: string; nama: string; jenis: string }

interface Props {
  kelasId:          string
  semesterId:       string
  hariConfig:       HariConfig[]
  tingkatKelasId:   string
  namaKelas:        string
  kelasRuanganId:   string
  kelasRuanganNama: string
}

type ModalType = 'reset-local' | 'hapus-jadwal' | 'overwrite-cell' | null

export function JadwalFormLayout({
  kelasId, semesterId, hariConfig: hariConfigProp, tingkatKelasId, namaKelas,
  kelasRuanganId, kelasRuanganNama,
}: Props) {
  const router = useRouter()
  const { fullscreen, toggleFullscreen, setSidebarCollapsed } = useUIStore()

  const [hariConfig, setHariConfig]      = useState<HariConfig[]>(() => {
    const s = new Set(hariConfigProp.map((h) => h.hari))
    return HARI_LIST.map((hari) => ({ hari, aktif: s.has(hari) }))
  })
  const [gridState, setGridState]        = useState<GridState>({})
  const [savedState, setSavedState]      = useState<GridState>({})  // snapshot saat load
  const [focusedCell, setFocusedCell]    = useState<CellKey | null>(null)
  const [activeDrag, setActiveDrag]      = useState<{ mapel?: PaletteMapel; cellKey?: CellKey; cellState?: CellState } | null>(null)
  const [initialized, setInitialized]    = useState(false)
  const [modal, setModal]                        = useState<ModalType>(null)
  const [overwriteTarget, setOverwriteTarget]    = useState<{
    targetKey:  CellKey
    sourceType: 'palette' | 'cell'
    mapel?:     PaletteMapel
    sourceCellKey?:   CellKey
    sourceCellState?: CellState
    masterJam:  MasterJam
  } | null>(null)

  useEffect(() => { setSidebarCollapsed(fullscreen) }, [fullscreen, setSidebarCollapsed])
  useEffect(() => () => { setSidebarCollapsed(false) }, [setSidebarCollapsed])

  const { data: masterJamREGRaw,   isLoading: loadingReg   } = useMasterJamByTingkat(tingkatKelasId || null, 'REGULER')
  const { data: masterJamJUMATRaw, isLoading: loadingJumat } = useMasterJamByTingkat(tingkatKelasId || null, 'JUMAT')
  const masterJamREGULER = (masterJamREGRaw   as MasterJam[] | undefined) ?? []
  const masterJamJUMAT   = (masterJamJUMATRaw as MasterJam[] | undefined) ?? []
  const masterJamAll     = useMemo(() => [...masterJamREGULER, ...masterJamJUMAT], [masterJamREGULER, masterJamJUMAT])

  const { data: ruanganLabRaw     } = useRuanganByJenis('LAB')
  const { data: ruanganLainnyaRaw } = useRuanganByJenis('LAINNYA')
  const ruanganOverrideList = useMemo((): RuanganOption[] => [
    ...((ruanganLabRaw     as RuanganOption[] | undefined) ?? []),
    ...((ruanganLainnyaRaw as RuanganOption[] | undefined) ?? []),
  ], [ruanganLabRaw, ruanganLainnyaRaw])

  const ketersediaanPayload = useMemo(() => {
    if (!focusedCell || !semesterId) return null
    const parts       = focusedCell.split('-')
    const hari        = parts[0] as HariEnum
    const masterJamId = parts.slice(1).join('-')
    if (!hari || !masterJamId) return null
    if (!gridState[focusedCell]?.mataPelajaranId) return null
    return { semesterId, hari, masterJamId }
  }, [focusedCell, semesterId, gridState])

  const { data: ketersediaanRaw, isLoading: loadingK, isFetching: fetchingK, refetch: refetchKetersediaan } = useKetersediaan(ketersediaanPayload)
  const ketersediaan = ketersediaanRaw as KetersediaanResponse | undefined

  const { data: existingRaw,    isLoading: loadingExisting } = useJadwalMingguan(kelasId, semesterId)
  const { data: mapelListRaw,   isLoading: loadingMapel    } = useMataPelajaranList({ kelasId, semesterId, isActive: true })
  const { data: mapelTingkatRaw, isLoading: loadingTingkat } = useMapelTingkatByTingkat(tingkatKelasId || null)

  const paletteMapel = useMemo((): PaletteMapel[] => {
    const mapelArr   = (mapelListRaw as unknown as { data: { id: string; mataPelajaranTingkatId: string }[] } | undefined)?.data ?? []
    const tingkatArr = (mapelTingkatRaw ?? []) as {
      id: string
      masterMapel: { nama: string; kode: string; kategori: string }
      guruMapel: { guruId: string; guru: { profile: { namaLengkap: string; fotoUrl: string | null } } }[]
    }[]
    return mapelArr.map((mp) => {
      const t = tingkatArr.find((x) => x.id === mp.mataPelajaranTingkatId)
      return {
        id: mp.id, nama: t?.masterMapel.nama ?? '—', kode: t?.masterMapel.kode ?? '—',
        kategori: t?.masterMapel.kategori ?? '', mataPelajaranTingkatId: mp.mataPelajaranTingkatId,
        guruPool: (t?.guruMapel ?? []).map((gm) => ({
          guruId: gm.guruId, namaLengkap: gm.guru.profile.namaLengkap, fotoUrl: gm.guru.profile.fotoUrl,
        })),
      }
    })
  }, [mapelListRaw, mapelTingkatRaw])

  useEffect(() => {
    if (initialized) return
    if (loadingExisting || loadingReg || loadingJumat) return
    if (!existingRaw) { setInitialized(true); return }
    const existing   = existingRaw as Record<HariEnum, JadwalPelajaran[]>
    const initState: GridState = {}
    const hariDariDB = new Set<HariEnum>()
    for (const [hari, slots] of Object.entries(existing) as [HariEnum, JadwalPelajaran[]][]) {
      for (const slot of slots) {
        if (!slot.masterJamId) continue
        hariDariDB.add(hari)
        initState[hari + '-' + slot.masterJamId] = {
          jadwalId: slot.id,
          mataPelajaranId:        slot.mataPelajaranId,
          mataPelajaranNama:      slot.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama ?? '',
          mataPelajaranKode:      slot.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.kode ?? '',
          mataPelajaranTingkatId: slot.mataPelajaran?.mataPelajaranTingkatId ?? '',
          guruId:      slot.guruId,
          ruanganId:   slot.ruanganId   ?? kelasRuanganId,
          ruanganNama: slot.ruangan?.nama ?? kelasRuanganNama,
          masterJamId:  slot.masterJamId,
          masterJamNama: slot.masterJam?.namaSesi ?? '',
        }
      }
    }
    if (hariDariDB.size > 0)
      setHariConfig((prev) => prev.map((h) => ({ ...h, aktif: h.aktif || hariDariDB.has(h.hari) })))
    setGridState(initState)
    setSavedState(initState)   // snapshot untuk reset lokal
    setInitialized(true)
  }, [existingRaw, loadingExisting, loadingReg, loadingJumat, initialized, kelasRuanganId, kelasRuanganNama])

  // Forbidden cells (overlap waktu)
  const forbiddenCells = useMemo((): Set<CellKey> => {
    const forbidden = new Set<CellKey>()
    for (const [key, cell] of Object.entries(gridState)) {
      if (!cell?.mataPelajaranId) continue
      const parts    = key.split('-')
      const hari     = parts[0]
      const mjId     = parts.slice(1).join('-')
      const filledMJ = masterJamAll.find((m) => m.id === mjId)
      if (!filledMJ || filledMJ.isIstirahat) continue
      for (const otherMJ of masterJamAll) {
        if (otherMJ.id === mjId || otherMJ.isIstirahat) continue
        const otherKey = hari + '-' + otherMJ.id as CellKey
        if (gridState[otherKey]?.mataPelajaranId) continue
        if (isTimeOverlap(filledMJ.jamMulai, filledMJ.jamSelesai, otherMJ.jamMulai, otherMJ.jamSelesai))
          forbidden.add(otherKey)
      }
    }
    return forbidden
  }, [gridState, masterJamAll])

  const placementCount = useMemo(() => {
    const count: Record<string, number> = {}
    for (const cell of Object.values(gridState)) {
      if (!cell?.mataPelajaranId) continue
      count[cell.mataPelajaranId] = (count[cell.mataPelajaranId] ?? 0) + 1
    }
    return count
  }, [gridState])

  const updateCell = useCallback((key: CellKey, patch: Partial<CellState>) => {
    setGridState((prev) => {
      const ex: CellState = prev[key] ?? {
        mataPelajaranId: '', mataPelajaranNama: '', mataPelajaranKode: '',
        mataPelajaranTingkatId: '', guruId: '',
        ruanganId: kelasRuanganId, ruanganNama: kelasRuanganNama,
        masterJamId: '', masterJamNama: '',
      }
      return { ...prev, [key]: { ...ex, ...patch } }
    })
  }, [kelasRuanganId, kelasRuanganNama])

  const clearCell = useCallback((key: CellKey) => {
    setGridState((prev) => { const n = { ...prev }; delete n[key]; return n })
    if (focusedCell === key) setFocusedCell(null)
  }, [focusedCell])
  const qc = useQueryClient()
  

  const handleAssignGuru    = useCallback((key: CellKey, guruId: string) => updateCell(key, { guruId }), [updateCell])
  const handleRemoveGuru = useCallback((key: CellKey) => {
    updateCell(key, { guruId: '' })
    // Reset focusedCell sesaat agar ketersediaanPayload berubah → trigger re-fetch
    setFocusedCell(null)
    setTimeout(() => setFocusedCell(key), 50)
  }, [updateCell])

  const deleteJadwalMutation = useDeleteJadwal()

  const handleDeleteJadwal = useCallback(async (key: CellKey, jadwalId: string) => {
    try {
      await deleteJadwalMutation.mutateAsync(jadwalId)
      updateCell(key, { guruId: '', jadwalId: undefined })
      qc.invalidateQueries({ queryKey: ['jadwal', 'ketersediaan'] })
    } catch {
      // silent
    }
}, [deleteJadwalMutation, updateCell, qc])

  const handleAssignRuangan = useCallback((key: CellKey, ruanganId: string, nama: string) =>
    updateCell(key, { ruanganId, ruanganNama: nama }), [updateCell])

  // ── DnD ───────────────────────────────────────────────────────
  const handleDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current
    if (data?.sourceType === 'palette') {
      setActiveDrag({ mapel: data.mapel as PaletteMapel })
    } else if (data?.sourceType === 'cell') {
      setActiveDrag({ cellKey: data.cellKey as CellKey, cellState: data.cellState as CellState })
    }
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDrag(null)
    const { active, over } = e
    if (!over) return

    const targetCellKey = over.id.toString().replace('cell-', '') as CellKey
    if (forbiddenCells.has(targetCellKey)) {
      toast.error('Slot ini beririsan dengan sesi yang sudah terisi')
      return
    }

    const masterJamId = targetCellKey.split('-').slice(1).join('-')
    const mj          = masterJamAll.find((m) => m.id === masterJamId)
    if (!mj || mj.isIstirahat) return

    const sourceType    = active.data.current?.sourceType
    const targetOccupied = !!gridState[targetCellKey]?.mataPelajaranId

    if (sourceType === 'palette') {
      const mapel = active.data.current?.mapel as PaletteMapel
      if (!mapel) return

      // Jika target sudah terisi → minta konfirmasi
      if (targetOccupied) {
        setOverwriteTarget({ targetKey: targetCellKey, sourceType: 'palette', mapel, masterJam: mj })
        return
      }

      updateCell(targetCellKey, {
        mataPelajaranId: mapel.id, mataPelajaranNama: mapel.nama,
        mataPelajaranKode: mapel.kode, mataPelajaranTingkatId: mapel.mataPelajaranTingkatId,
        masterJamId: mj.id, masterJamNama: mj.namaSesi,
        guruId: '', ruanganId: kelasRuanganId, ruanganNama: kelasRuanganNama,
      })
      setFocusedCell(targetCellKey)

    } else if (sourceType === 'cell') {
      const sourceCellKey   = active.data.current?.cellKey as CellKey
      const sourceCellState = active.data.current?.cellState as CellState
      if (!sourceCellKey || !sourceCellState || sourceCellKey === targetCellKey) return
      if (!sourceCellState.mataPelajaranId) return

      // Jika target sudah terisi → minta konfirmasi
      if (targetOccupied) {
        setOverwriteTarget({
          targetKey: targetCellKey, sourceType: 'cell',
          sourceCellKey, sourceCellState, masterJam: mj,
        })
        return
      }

      updateCell(targetCellKey, {
        mataPelajaranId:        sourceCellState.mataPelajaranId,
        mataPelajaranNama:      sourceCellState.mataPelajaranNama,
        mataPelajaranKode:      sourceCellState.mataPelajaranKode,
        mataPelajaranTingkatId: sourceCellState.mataPelajaranTingkatId,
        guruId:      sourceCellState.guruId,
        ruanganId:   sourceCellState.ruanganId,
        ruanganNama: sourceCellState.ruanganNama,
        masterJamId:  mj.id,
        masterJamNama: mj.namaSesi,
      })
      clearCell(sourceCellKey)
      setFocusedCell(targetCellKey)
    }
  }

  // ── Submit ────────────────────────────────────────────────────
  const validate = () => {
    const errors: string[] = []
    for (const [key, cell] of Object.entries(gridState)) {
      if (!cell) continue
      const [hari] = key.split('-')
      const mj     = masterJamAll.find((m) => m.id === cell.masterJamId)
      const label  = (HARI_LABEL[hari as HariEnum] ?? hari) + ' ' + (mj?.namaSesi ?? '')
      if (!cell.guruId) errors.push(label + ': guru belum dipilih')
    }
    return errors
  }

  const bulkMutation = useBulkJadwalByKelas()

  const handleSubmit = async () => {
    const errors = validate()
    if (errors.length) { errors.forEach((e) => toast.error(e)); return }
    const jadwal = Object.entries(gridState)
      .filter(([, c]) => c?.mataPelajaranId && c.guruId && c.masterJamId)
      .map(([key, c]) => ({
        mataPelajaranId: c!.mataPelajaranId, guruId: c!.guruId,
        ruanganId: c!.ruanganId || undefined,
        hari: key.split('-')[0] as HariEnum,
        masterJamId: c!.masterJamId,
      }))
    if (!jadwal.length) { toast.error('Belum ada jadwal yang diisi'); return }
    try {
      const result = await bulkMutation.mutateAsync({ kelasId, semesterId, jadwal })
      toast.success('Berhasil menyimpan ' + result.count + ' jadwal — ' + namaKelas)
      router.push('/dashboard/jadwal/manajemen')
    } catch {
      toast.error('Gagal menyimpan — periksa konflik')
    }
  }

  // Reset lokal — kembalikan ke snapshot terakhir dari DB
  const handleResetLocal = () => {
    setGridState({ ...savedState })
    setFocusedCell(null)
    setModal(null)
    toast.success('Perubahan dibatalkan — kembali ke data tersimpan')
  }

  // Konfirmasi overwrite cell
  const handleHapusJadwal = async () => {
    try {
      await bulkMutation.mutateAsync({ kelasId, semesterId, jadwal: [] })
      setGridState({})
      setSavedState({})
      setFocusedCell(null)
      setModal(null)
      toast.success('Jadwal ' + namaKelas + ' berhasil dikosongkan')
      router.push('/dashboard/jadwal/manajemen')
    } catch {
      toast.error('Gagal mengosongkan jadwal')
    }
  }

  // Konfirmasi overwrite cell
  const handleConfirmOverwrite = () => {
    if (!overwriteTarget) return
    const { targetKey, sourceType, mapel, sourceCellKey, sourceCellState, masterJam } = overwriteTarget

    if (sourceType === 'palette' && mapel) {
      updateCell(targetKey, {
        mataPelajaranId: mapel.id, mataPelajaranNama: mapel.nama,
        mataPelajaranKode: mapel.kode, mataPelajaranTingkatId: mapel.mataPelajaranTingkatId,
        masterJamId: masterJam.id, masterJamNama: masterJam.namaSesi,
        guruId: '', ruanganId: kelasRuanganId, ruanganNama: kelasRuanganNama,
      })
    } else if (sourceType === 'cell' && sourceCellKey && sourceCellState) {
      updateCell(targetKey, {
        mataPelajaranId:        sourceCellState.mataPelajaranId,
        mataPelajaranNama:      sourceCellState.mataPelajaranNama,
        mataPelajaranKode:      sourceCellState.mataPelajaranKode,
        mataPelajaranTingkatId: sourceCellState.mataPelajaranTingkatId,
        guruId:      sourceCellState.guruId,
        ruanganId:   sourceCellState.ruanganId,
        ruanganNama: sourceCellState.ruanganNama,
        masterJamId:  masterJam.id,
        masterJamNama: masterJam.namaSesi,
      })
      clearCell(sourceCellKey)
    }

    setFocusedCell(targetKey)
    setOverwriteTarget(null)
  }

  // Cek apakah hari punya slot terisi (gridState maupun savedState)
  // Cek apakah hari punya slot terisi (gridState maupun savedState)
  const hariHasSlot = (hari: HariEnum): boolean =>
    Object.keys(gridState).some((key) => {
      const [h] = key.split('-')
      return h === hari && !!gridState[key]?.mataPelajaranId
    })

  const isLoading = loadingMapel || loadingTingkat || loadingReg || loadingJumat || loadingExisting
  if (isLoading) return <JadwalFormSkeleton />

  // Label overlay untuk DragOverlay
  const overlayLabel = activeDrag?.mapel
    ? activeDrag.mapel.kode + ' · ' + activeDrag.mapel.nama
    : activeDrag?.cellState
    ? activeDrag.cellState.mataPelajaranKode + ' · ' + activeDrag.cellState.mataPelajaranNama
    : ''

  return (
    <div className={fullscreen
      ? 'fixed inset-0 z-50 bg-white dark:bg-gray-950 flex flex-col p-4 gap-3 overflow-hidden'
      : 'flex flex-col gap-4 min-h-0'
    }>
      {/* Action bar */}
      <div className="flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {hariConfig.map(({ hari, aktif }) => {
            const hasSlot     = hariHasSlot(hari)
            const hasSaved    = Object.keys(savedState).some((k) => k.startsWith(hari + '-'))
            // Hari aktif + ada savedState tapi gridState kosong = akan dikosongkan saat submit
            const willClear   = aktif && hasSaved && !hasSlot
            return (
              <button key={hari} type="button"
                onClick={() => {
                  if (aktif && hasSlot) return
                  setHariConfig((prev) => prev.map((h) => h.hari === hari ? { ...h, aktif: !h.aktif } : h))
                }}
                title={
                  aktif && hasSlot   ? 'Ada jadwal di hari ini, tidak dapat dinonaktifkan' :
                  willClear          ? 'Jadwal hari ini akan dikosongkan saat disimpan' :
                  undefined
                }
                className={[
                  'text-xs font-medium px-2.5 py-1 rounded-full border transition-colors',
                  aktif && hasSlot
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 cursor-not-allowed opacity-75'
                  : willClear
                    ? 'border-orange-300 bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 line-through'
                  : aktif
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                    : 'border-gray-200 text-gray-400 hover:border-emerald-200 hover:text-emerald-600 dark:border-gray-700',
                ].join(' ')}
              >
                {HARI_LABEL[hari]}
                {willClear && <span className="ml-1 text-[9px]">⚠</span>}
              </button>
            )
          })}
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <CalendarPlus className="h-3 w-3" />klik aktif/nonaktif
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{Object.keys(gridState).length} slot</span>
          <Button variant="secondary" size="sm" onClick={toggleFullscreen}>
            {fullscreen ? <><Minimize2 className="h-4 w-4 mr-1.5" />Keluar</> : <><Maximize2 className="h-4 w-4 mr-1.5" />Fullscreen</>}
          </Button>
          {/* Reset lokal */}
          <Button variant="secondary" size="sm" onClick={() => setModal('reset-local')}>
            <RotateCcw className="h-4 w-4 mr-1.5" />Reset
          </Button>
          {/* Hapus jadwal DB */}
          <Button variant="danger" size="sm" onClick={() => setModal('hapus-jadwal')}>
            <Trash2 className="h-4 w-4 mr-1.5" />Hapus Jadwal
          </Button>
          <Button variant="primary" size="sm" onClick={() => { void handleSubmit() }} disabled={bulkMutation.isPending}>
            {bulkMutation.isPending ? <Spinner /> : <Send className="h-4 w-4 mr-1.5" />}Simpan
          </Button>
        </div>
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 min-h-0 flex-1 overflow-hidden">
          <div className="w-56 shrink-0 overflow-hidden">
            <KetersediaanPanel
              focusedCellKey={focusedCell}
              gridState={gridState}
              paletteMapel={paletteMapel}
              masterJamAll={masterJamAll}
              kelasRuanganId={kelasRuanganId}
              kelasRuanganNama={kelasRuanganNama}
              ruanganOverrideList={ruanganOverrideList}
              ketersediaan={ketersediaan ?? null}
              isLoading={loadingK || fetchingK}
              semesterId={semesterId}
              onAssignGuru={handleAssignGuru}
              onRemoveGuru={handleRemoveGuru}
              onDeleteJadwal={handleDeleteJadwal}
              onAssignRuangan={handleAssignRuangan}
            />
          </div>
          <div className="flex-1 min-w-0 overflow-y-auto">
            <JadwalGrid
              hariConfig={hariConfig}
              gridState={gridState}
              paletteMapel={paletteMapel}
              masterJamREGULER={masterJamREGULER}
              masterJamJUMAT={masterJamJUMAT}
              focusedCellKey={focusedCell}
              forbiddenCells={forbiddenCells}
              onFocusCell={setFocusedCell}
              onUpdateCell={updateCell}
              onClearCell={clearCell}
            />
          </div>
          <div className="w-52 shrink-0 overflow-y-auto">
            <MapelPalette paletteMapel={paletteMapel} placementCount={placementCount} />
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {overlayLabel && (
            <div className="bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-lg opacity-95 cursor-grabbing pointer-events-none">
              {overlayLabel}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* ── Modal Konfirmasi ─────────────────────────────────── */}
      {modal && (

        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-200 dark:border-gray-700">

            {modal === 'reset-local' ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                    <RotateCcw className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Reset Perubahan</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{namaKelas}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                  Semua perubahan yang belum disimpan akan <span className="font-semibold text-orange-500">dibatalkan</span> dan kembali ke data terakhir yang tersimpan.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" size="sm" onClick={() => setModal(null)}>Batal</Button>
                  <Button variant="secondary" size="sm" onClick={handleResetLocal}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50">
                    <RotateCcw className="h-4 w-4 mr-1.5" />Ya, Reset
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Hapus Semua Jadwal</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{namaKelas}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                  Seluruh jadwal kelas ini akan <span className="font-semibold text-red-500">dihapus permanen</span> dari database. Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" size="sm" onClick={() => setModal(null)}>Batal</Button>
                  <Button variant="danger" size="sm"
                    onClick={() => { void handleHapusJadwal() }}
                    disabled={bulkMutation.isPending}>
                    {bulkMutation.isPending ? <Spinner /> : <Trash2 className="h-4 w-4 mr-1.5" />}
                    Ya, Hapus Semua
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
            {/* ── Modal Overwrite Cell ─────────────────────────────── */}
      {overwriteTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOverwriteTarget(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <CalendarPlus className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Slot Sudah Terisi</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {overwriteTarget.masterJam.namaSesi} · {overwriteTarget.masterJam.jamMulai}–{overwriteTarget.masterJam.jamSelesai}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Slot ini sudah berisi:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 mb-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
              {gridState[overwriteTarget.targetKey]?.mataPelajaranNama ?? '—'}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              Mapel lama akan <span className="font-semibold text-amber-500">digantikan</span>. Lanjutkan?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setOverwriteTarget(null)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmOverwrite}
                className="px-3 py-1.5 text-sm rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors"
              >
                Ya, Ganti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
