#!/usr/bin/env python3
"""
BATCH B — Revisi besar buat-jadwal
1. jadwal.types.ts         — tambah masterJamId ke JadwalPelajaran & BulkJadwalItem
2. jadwal.api.ts           — update BulkJadwalItem payload
3. useJadwal.ts            — update BulkJadwalItem type
4. jadwal-form.types.ts    — CellState pakai masterJamId, HariConfig tanpa jumlahJam
5. JadwalFormLayout.tsx    — load existing, fetch masterJam, fullscreen
6. JadwalGrid.tsx          — 2 seksi (reguler/jumat), kolom dari masterJam, scroll
7. JadwalCell.tsx          — hapus time input, mapel+guru select saja
8. GuruInfoPanel.tsx       — semua guru pool, breakdown per hari
9. PreModalKonfigurasi.tsx — hapus jumlahJam
10. page.tsx               — update DEFAULT_HARI_CONFIG
"""
import os
BASE = "src"
FILES = {}

# ─────────────────────────────────────────────────────────────────
# 1. jadwal.types.ts — tambah masterJam ke JadwalPelajaran + BulkJadwalItem
# ─────────────────────────────────────────────────────────────────
FILES["types/jadwal.types.ts"] = '''\
export type HariEnum =
  | \'SENIN\' | \'SELASA\' | \'RABU\' | \'KAMIS\' | \'JUMAT\' | \'SABTU\'

export const HARI_LIST: HariEnum[] = [
  \'SENIN\', \'SELASA\', \'RABU\', \'KAMIS\', \'JUMAT\', \'SABTU\',
]

// ─── MasterJam (ringkas, untuk relasi) ───────────────────────
export interface MasterJamRef {
  id:          string
  namaSesi:    string
  jamMulai:    string   // "HH:mm"
  jamSelesai:  string
  jumlahMenit: number
  bobotJp:     number
  tipeHari:    string
  isIstirahat: boolean
  urutan:      number
}

// ─── Core Entities ───────────────────────────────────────────
export interface JadwalPelajaran {
  id:              string
  kelasId:         string
  semesterId:      string
  mataPelajaranId: string
  guruId:          string
  hari:            HariEnum
  masterJamId:     string
  ruanganId:       string | null
  isActive:        boolean
  createdAt:       string
  updatedAt:       string
  // Relations
  masterJam?: MasterJamRef
  kelas?: {
    namaKelas:    string
    tingkatKelas?: { nama: string }
  }
  semester?: {
    nama:         string
    tahunAjaran?: { nama: string }
  }
  mataPelajaran?: {
    id:                      string
    mataPelajaranTingkatId:  string
    kelasId:                 string
    kkm:                     number
    bobot:                   number
    isActive:                boolean
    mataPelajaranTingkat?: {
      id: string
      masterMapel: {
        id:       string
        nama:     string
        kode:     string
        kategori: string
      }
    }
  }
  guru?: {
    id:      string
    email:   string
    role:    string
    profile: { namaLengkap: string }
  }
  ruangan?: RuanganRef | null
}

export interface RuanganRef {
  id:   string
  kode: string
  nama: string
}

// ─── Roster ──────────────────────────────────────────────────
export interface RosterItem {
  jadwalId:  string
  jamMulai:  string
  jamSelesai: string
  mataPelajaran: { id: string; nama: string; kode: string }
  guru:          { id: string; namaLengkap: string }
  ruangan:       RuanganRef | null
}

export interface RosterKelasResponse {
  kelas:    { id: string; namaKelas: string; tingkatKelas: { nama: string } }
  semester: string
  roster:   Record<HariEnum, RosterItem[]>
  totalJam: number
}

export interface RosterGuruRosterItem extends Omit<RosterItem, \'guru\'> {
  kelas: { id: string; namaKelas: string }
}

export interface RosterGuruResponse {
  guruId:   string
  semester: string
  roster:   Record<HariEnum, RosterGuruRosterItem[]>
  totalJam: number
}

// ─── Ringkasan ───────────────────────────────────────────────
export interface RingkasanMapelItem {
  mapelId:    string
  namaMapel:  string
  guru:       string
  totalJam:   number
}

export interface RingkasanKelasItem {
  kelasId:         string
  namaKelas:       string
  totalSemuaJam:   number
  rincianPerMapel: RingkasanMapelItem[]
}

// ─── Beban Mengajar ──────────────────────────────────────────
export interface BebanMengajarDetail {
  mapelId: string
  kelas:   string
  hari:    HariEnum
  jam:     string
}

export interface BebanMengajarMapel {
  mapelTingkatId: string
  namaMapel:      string
  totalJam:       number
  detailJadwal:   BebanMengajarDetail[]
}

export interface BebanMengajarResponse {
  guruId:          string
  semesterId:      string
  totalSemuaJam:   number
  rincianPerMapel: BebanMengajarMapel[]
}

// ─── Ketersediaan ────────────────────────────────────────────
export interface KetersediaanRequest {
  semesterId: string
  hari:       HariEnum
  jamMulai:   string
  jamSelesai: string
}

export interface GuruAvailable    { id: string; namaLengkap: string }
export interface RuanganAvailable { id: string; kode: string; nama: string }
export interface KetersediaanResponse {
  guru:    GuruAvailable[]
  ruangan: RuanganAvailable[]
}

// ─── Rekap Guru ──────────────────────────────────────────────
export interface RekapGuruMapelItem {
  mataPelajaranTingkatId: string
  namaMapel:  string
  kodeMapel:  string
  tingkat:    string
  jenjang:    string
}

export interface RekapGuruItem {
  guruId:               string
  namaLengkap:          string
  nip:                  string
  totalMapelDiajarkan:  number
  daftarMapel:          RekapGuruMapelItem[]
}

// ─── Payloads / DTOs ─────────────────────────────────────────
export interface CreateJadwalPayload {
  hari:            HariEnum
  masterJamId:     string
  kelasId:         string
  semesterId:      string
  guruId:          string
  mataPelajaranId: string
  ruanganId?:      string
}

export interface BulkJadwalItem {
  mataPelajaranId: string
  guruId:          string
  ruanganId?:      string
  hari:            HariEnum
  masterJamId:     string
}

export interface BulkJadwalPayload {
  kelasId:    string
  semesterId: string
  jadwal:     BulkJadwalItem[]
}

export interface BulkMapelJadwalItem {
  kelasId:     string
  ruanganId?:  string
  hari:        HariEnum
  masterJamId: string
}

export interface BulkMapelJadwalPayload {
  semesterId:      string
  mataPelajaranId: string
  guruId:          string
  jadwal:          BulkMapelJadwalItem[]
}

export interface CopySemesterPayload {
  sourceSemesterId: string
  targetSemesterId: string
}

// ─── Filter Params ───────────────────────────────────────────
export interface FilterJadwalParams {
  semesterId?: string
  kelasId?:    string
  guruId?:     string
  hari?:       HariEnum
  isActive?:   boolean
}

export interface FilterRingkasanParams {
  semesterId:      string
  tingkatKelasId?: string
}

// ─── Export Params ───────────────────────────────────────────
export interface ExportJadwalSekolahParams { semesterId: string }
export interface ExportJadwalKelasParams   { semesterId: string; kelasId: string }
export interface ExportJadwalGuruParams    { semesterId: string; guruId?: string }
'''

# ─────────────────────────────────────────────────────────────────
# 2. jadwal-form.types.ts — CellState pakai masterJamId, HariConfig tanpa jumlahJam
# ─────────────────────────────────────────────────────────────────
FILES["app/dashboard/jadwal/manajemen/buat-jadwal/_components/jadwal-form.types.ts"] = '''\
import type { HariEnum } from \'@/types/jadwal.types\'

export interface HariConfig {
  hari:  HariEnum
  aktif: boolean
}

export interface PreModalParams {
  kelasId:    string
  semesterId: string
  hariConfig: HariConfig[]
}

export interface CellState {
  jadwalId?:              string   // ada jika entry dari DB (existing)
  mataPelajaranId:        string
  mataPelajaranNama:      string
  mataPelajaranKode:      string
  mataPelajaranTingkatId: string
  guruId:                 string
  ruanganId:              string
  masterJamId:            string   // sesi yang dipilih
  masterJamNama:          string   // untuk display
}

// CellKey format: "${hari}-${masterJamId}"
export type CellKey   = string
export type GridState = Partial<Record<CellKey, CellState>>

export interface PaletteMapel {
  id:                     string
  nama:                   string
  kode:                   string
  kategori:               string
  mataPelajaranTingkatId: string
  guruPool: {
    guruId:      string
    namaLengkap: string
    fotoUrl:     string | null
  }[]
}
'''

# ─────────────────────────────────────────────────────────────────
# 3. JadwalFormLayout.tsx — load existing, fetch masterJam, fullscreen
# ─────────────────────────────────────────────────────────────────
FILES["app/dashboard/jadwal/manajemen/buat-jadwal/_components/JadwalFormLayout.tsx"] = '''\
\'use client\'

import { useState, useMemo, useCallback, useEffect } from \'react\'
import { useRouter } from \'next/navigation\'
import { toast } from \'sonner\'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from \'@dnd-kit/core\'
import { useMataPelajaranList, useMapelTingkatByTingkat } from \'@/hooks/mata-pelajaran/useMataPelajaran\'
import { useBulkJadwalByKelas, useJadwalMingguan } from \'@/hooks/jadwal/useJadwal\'
import { useMasterJamByTingkat } from \'@/hooks/master-jam/useMasterJam\'
import { useUIStore } from \'@/stores/ui.store\'
import { Button, Spinner } from \'@/components/ui\'
import { Save, Send, Maximize2, Minimize2 } from \'lucide-react\'
import { MapelPalette } from \'./MapelPalette\'
import { JadwalGrid } from \'./JadwalGrid\'
import { GuruInfoPanel } from \'./GuruInfoPanel\'
import { JadwalFormSkeleton } from \'./JadwalFormSkeleton\'
import type {
  HariConfig, CellKey, CellState, GridState, PaletteMapel,
} from \'./jadwal-form.types\'
import type { HariEnum, JadwalPelajaran } from \'@/types/jadwal.types\'
import type { MasterJam } from \'@/types/master-jam.types\'

interface Props {
  kelasId:        string
  semesterId:     string
  hariConfig:     HariConfig[]
  tingkatKelasId: string
  namaKelas:      string
}

export function JadwalFormLayout({
  kelasId, semesterId, hariConfig, tingkatKelasId, namaKelas,
}: Props) {
  const router = useRouter()
  const { fullscreen, toggleFullscreen, setSidebarCollapsed } = useUIStore()

  const [gridState, setGridState]        = useState<GridState>({})
  const [focusedGuru, setFocusedGuru]    = useState<string | null>(null)
  const [activeDragMapel, setActiveDrag] = useState<PaletteMapel | null>(null)
  const [initialized, setInitialized]    = useState(false)

  // ── Fullscreen: collapse sidebar ─────────────────────────────
  useEffect(() => {
    setSidebarCollapsed(fullscreen)
  }, [fullscreen, setSidebarCollapsed])

  // Restore sidebar on unmount
  useEffect(() => {
    return () => { setSidebarCollapsed(false) }
  }, [setSidebarCollapsed])

  // ── Fetch masterJam ───────────────────────────────────────────
  const { data: masterJamREGRaw, isLoading: loadingReg } = useMasterJamByTingkat(
    tingkatKelasId || null, \'REGULER\',
  )
  const { data: masterJamJUMATRaw, isLoading: loadingJumat } = useMasterJamByTingkat(
    tingkatKelasId || null, \'JUMAT\',
  )

  const masterJamREGULER = (masterJamREGRaw as MasterJam[] | undefined) ?? []
  const masterJamJUMAT   = (masterJamJUMATRaw as MasterJam[] | undefined) ?? []

  // ── Fetch existing jadwal ─────────────────────────────────────
  const { data: existingRaw, isLoading: loadingExisting } = useJadwalMingguan(
    kelasId, semesterId,
  )

  // ── Fetch mapel list untuk palette ───────────────────────────
  const { data: mapelListRaw, isLoading: loadingMapel } = useMataPelajaranList({
    kelasId, semesterId, isActive: true,
  })
  const { data: mapelTingkatRaw, isLoading: loadingTingkat } = useMapelTingkatByTingkat(
    tingkatKelasId || null,
  )

  // ── Build palette ─────────────────────────────────────────────
  const paletteMapel = useMemo((): PaletteMapel[] => {
    const mapelArr = (mapelListRaw as unknown as {
      data: { id: string; mataPelajaranTingkatId: string }[]
    } | undefined)?.data ?? []

    const tingkatArr = (mapelTingkatRaw ?? []) as {
      id: string
      masterMapel: { nama: string; kode: string; kategori: string }
      guruMapel: { guruId: string; guru: { profile: { namaLengkap: string; fotoUrl: string | null } } }[]
    }[]

    return mapelArr.map((mp) => {
      const tingkat = tingkatArr.find((t) => t.id === mp.mataPelajaranTingkatId)
      return {
        id:                     mp.id,
        nama:                   tingkat?.masterMapel.nama     ?? \'—\',
        kode:                   tingkat?.masterMapel.kode     ?? \'—\',
        kategori:               tingkat?.masterMapel.kategori ?? \'\',
        mataPelajaranTingkatId: mp.mataPelajaranTingkatId,
        guruPool: (tingkat?.guruMapel ?? []).map((gm) => ({
          guruId:      gm.guruId,
          namaLengkap: gm.guru.profile.namaLengkap,
          fotoUrl:     gm.guru.profile.fotoUrl,
        })),
      }
    })
  }, [mapelListRaw, mapelTingkatRaw])

  // ── Init gridState dari existing jadwal ───────────────────────
  useEffect(() => {
    if (initialized) return
    if (loadingExisting || loadingReg || loadingJumat) return
    if (!existingRaw) { setInitialized(true); return }

    const existing = existingRaw as Record<HariEnum, JadwalPelajaran[]>
    const initState: GridState = {}

    for (const [hari, slots] of Object.entries(existing) as [HariEnum, JadwalPelajaran[]][]) {
      for (const slot of slots) {
        if (!slot.masterJamId) continue
        const cellKey: CellKey = hari + \'-\' + slot.masterJamId
        const mapelNama = slot.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama ?? \'\'
        const mapelKode = slot.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.kode ?? \'\'
        initState[cellKey] = {
          jadwalId:               slot.id,
          mataPelajaranId:        slot.mataPelajaranId,
          mataPelajaranNama:      mapelNama,
          mataPelajaranKode:      mapelKode,
          mataPelajaranTingkatId: slot.mataPelajaran?.mataPelajaranTingkatId ?? \'\',
          guruId:                 slot.guruId,
          ruanganId:              slot.ruanganId ?? \'\',
          masterJamId:            slot.masterJamId,
          masterJamNama:          slot.masterJam?.namaSesi ?? \'\',
        }
      }
    }

    setGridState(initState)
    setInitialized(true)
  }, [existingRaw, loadingExisting, loadingReg, loadingJumat, initialized])

  // ── Placement count ───────────────────────────────────────────
  const placementCount = useMemo(() => {
    const count: Record<string, number> = {}
    for (const cell of Object.values(gridState)) {
      if (!cell?.mataPelajaranId) continue
      count[cell.mataPelajaranId] = (count[cell.mataPelajaranId] ?? 0) + 1
    }
    return count
  }, [gridState])

  // ── Guru in grid (breakdown per hari) ────────────────────────
  const guruInGrid = useMemo(() => {
    const map: Record<string, { namaLengkap: string; slotsByHari: Record<string, string[]> }> = {}

    for (const [key, cell] of Object.entries(gridState)) {
      if (!cell?.guruId) continue
      const [hari] = key.split(\'-\')
      if (!hari) continue

      if (!map[cell.guruId]) {
        const palette = paletteMapel.find((p) => p.guruPool.some((g) => g.guruId === cell.guruId))
        const guru    = palette?.guruPool.find((g) => g.guruId === cell.guruId)
        map[cell.guruId] = { namaLengkap: guru?.namaLengkap ?? cell.guruId, slotsByHari: {} }
      }

      const allJam = [...masterJamREGULER, ...masterJamJUMAT]
      const mj     = allJam.find((m) => m.id === cell.masterJamId)
      const label  = mj ? mj.jamMulai + \'-\' + mj.jamSelesai : cell.masterJamId

      if (!map[cell.guruId].slotsByHari[hari]) map[cell.guruId].slotsByHari[hari] = []
      map[cell.guruId].slotsByHari[hari].push(label)
    }
    return map
  }, [gridState, paletteMapel, masterJamREGULER, masterJamJUMAT])

  // ── Cell handlers ─────────────────────────────────────────────
  const updateCell = useCallback((key: CellKey, patch: Partial<CellState>) => {
    setGridState((prev) => {
      const existing: CellState = prev[key] ?? {
        mataPelajaranId: \'\', mataPelajaranNama: \'\', mataPelajaranKode: \'\',
        mataPelajaranTingkatId: \'\', guruId: \'\', ruanganId: \'\',
        masterJamId: \'\', masterJamNama: \'\',
      }
      return { ...prev, [key]: { ...existing, ...patch } }
    })
  }, [])

  const clearCell = useCallback((key: CellKey) => {
    setGridState((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  // ── DnD ───────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) =>
    setActiveDrag((event.active.data.current?.mapel as PaletteMapel | undefined) ?? null)

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null)
    const { active, over } = event
    if (!over) return
    const mapel   = active.data.current?.mapel as PaletteMapel | undefined
    const cellKey = over.id.toString().replace(\'cell-\', \'\') as CellKey
    if (!mapel) return

    const [, masterJamId] = cellKey.split(\'-\')
    const allJam = [...masterJamREGULER, ...masterJamJUMAT]
    const mj     = allJam.find((m) => m.id === masterJamId)
    if (!mj || mj.isIstirahat) return   // tidak boleh drop ke istirahat

    updateCell(cellKey, {
      mataPelajaranId:        mapel.id,
      mataPelajaranNama:      mapel.nama,
      mataPelajaranKode:      mapel.kode,
      mataPelajaranTingkatId: mapel.mataPelajaranTingkatId,
      masterJamId:            mj.id,
      masterJamNama:          mj.namaSesi,
      guruId:                 \'\',
      ruanganId:              \'\',
    })
  }

  // ── Validation ────────────────────────────────────────────────
  const validate = (): string[] => {
    const errors: string[] = []
    const HARI_LABEL: Record<string, string> = {
      SENIN: \'Senin\', SELASA: \'Selasa\', RABU: \'Rabu\',
      KAMIS: \'Kamis\', JUMAT: \'Jumat\',   SABTU: \'Sabtu\',
    }
    const allJam = [...masterJamREGULER, ...masterJamJUMAT]

    for (const [key, cell] of Object.entries(gridState)) {
      if (!cell) continue
      const [hari] = key.split(\'-\')
      const mj     = allJam.find((m) => m.id === cell.masterJamId)
      const label  = (HARI_LABEL[hari ?? \'\'] ?? hari) + \' \' + (mj?.namaSesi ?? \'\')
      if (!cell.guruId) errors.push(label + \': guru belum dipilih\')
    }

    // Konflik guru per hari-sesi
    const seen = new Set<string>()
    for (const [key, cell] of Object.entries(gridState)) {
      if (!cell?.guruId) continue
      const [hari] = key.split(\'-\')
      const conflict = hari + \'-\' + cell.guruId + \'-\' + cell.masterJamId
      if (seen.has(conflict)) {
        const allJam = [...masterJamREGULER, ...masterJamJUMAT]
        const mj = allJam.find((m) => m.id === cell.masterJamId)
        errors.push(\'Konflik: guru \' + cell.guruId + \' dijadwalkan 2x di \' + hari + \' \' + (mj?.namaSesi ?? \'\'))
      }
      seen.add(conflict)
    }
    return errors
  }

  // ── Submit ────────────────────────────────────────────────────
  const bulkMutation = useBulkJadwalByKelas()

  const handleSubmit = async (isDraft = false) => {
    const errors = validate()
    if (errors.length) { errors.forEach((e) => toast.error(e)); return }

    const jadwal = Object.entries(gridState)
      .filter(([, cell]) => cell?.mataPelajaranId && cell.guruId && cell.masterJamId)
      .map(([key, cell]) => {
        const [hari] = key.split(\'-\') as [HariEnum]
        return {
          mataPelajaranId: cell!.mataPelajaranId,
          guruId:          cell!.guruId,
          ruanganId:       cell!.ruanganId || undefined,
          hari,
          masterJamId:     cell!.masterJamId,
        }
      })

    if (!jadwal.length) { toast.error(\'Belum ada jadwal yang diisi\'); return }

    try {
      const result = await bulkMutation.mutateAsync({ kelasId, semesterId, jadwal })
      toast.success(\'Berhasil menyimpan \' + result.count + \' jadwal untuk \' + namaKelas)
      if (!isDraft) router.push(\'/dashboard/jadwal/manajemen\')
    } catch {
      toast.error(\'Gagal menyimpan jadwal — periksa konflik guru/ruangan\')
    }
  }

  const isLoading = loadingMapel || loadingTingkat || loadingReg || loadingJumat || loadingExisting

  if (isLoading) return <JadwalFormSkeleton />

  return (
    <div className={fullscreen
      ? \'fixed inset-0 z-50 bg-white dark:bg-gray-950 flex flex-col p-4 gap-3 overflow-hidden\'
      : \'flex flex-col gap-4 min-h-0\'
    }>
      {/* Action bar */}
      <div className="flex items-center justify-between shrink-0">
        <p className="text-xs text-gray-400">
          {Object.keys(gridState).length} slot terisi · {paletteMapel.length} mata pelajaran
        </p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={toggleFullscreen}>
            {fullscreen
              ? <><Minimize2 className="h-4 w-4 mr-1.5" />Keluar Fullscreen</>
              : <><Maximize2 className="h-4 w-4 mr-1.5" />Fullscreen</>
            }
          </Button>
          <Button variant="secondary" size="sm"
            onClick={() => { void handleSubmit(true) }}
            disabled={bulkMutation.isPending}>
            <Save className="h-4 w-4 mr-1.5" />Simpan Draft
          </Button>
          <Button variant="primary" size="sm"
            onClick={() => { void handleSubmit(false) }}
            disabled={bulkMutation.isPending}>
            {bulkMutation.isPending ? <Spinner /> : <Send className="h-4 w-4 mr-1.5" />}
            Simpan & Selesai
          </Button>
        </div>
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 min-h-0 flex-1 overflow-hidden">
          {/* Kiri — Guru Info */}
          <div className="w-64 shrink-0 overflow-y-auto">
            <GuruInfoPanel
              paletteMapel={paletteMapel}
              guruInGrid={guruInGrid}
              semesterId={semesterId}
              focusedGuruId={focusedGuru}
              onFocusGuru={setFocusedGuru}
            />
          </div>

          {/* Tengah — Grid (scrollable) */}
          <div className="flex-1 min-w-0 overflow-auto">
            <JadwalGrid
              hariConfig={hariConfig}
              gridState={gridState}
              paletteMapel={paletteMapel}
              masterJamREGULER={masterJamREGULER}
              masterJamJUMAT={masterJamJUMAT}
              onUpdateCell={updateCell}
              onClearCell={clearCell}
            />
          </div>

          {/* Kanan — Palette */}
          <div className="w-52 shrink-0 overflow-y-auto">
            <MapelPalette
              paletteMapel={paletteMapel}
              placementCount={placementCount}
            />
          </div>
        </div>

        <DragOverlay>
          {activeDragMapel && (
            <div className="bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-lg opacity-90 cursor-grabbing">
              {activeDragMapel.kode} · {activeDragMapel.nama}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
'''

# ─────────────────────────────────────────────────────────────────
# 4. JadwalGrid.tsx — 2 seksi (reguler/jumat), kolom dari masterJam
# ─────────────────────────────────────────────────────────────────
FILES["app/dashboard/jadwal/manajemen/buat-jadwal/_components/JadwalGrid.tsx"] = '''\
\'use client\'

import type { HariConfig, CellKey, CellState, GridState, PaletteMapel } from \'./jadwal-form.types\'
import type { HariEnum } from \'@/types/jadwal.types\'
import type { MasterJam } from \'@/types/master-jam.types\'
import { JadwalCell } from \'./JadwalCell\'
import { Coffee } from \'lucide-react\'

const HARI_LABEL: Record<HariEnum, string> = {
  SENIN:  \'Senin\',  SELASA: \'Selasa\', RABU:  \'Rabu\',
  KAMIS:  \'Kamis\',  JUMAT:  "Jum\'at", SABTU: \'Sabtu\',
}

interface Props {
  hariConfig:       HariConfig[]
  gridState:        GridState
  paletteMapel:     PaletteMapel[]
  masterJamREGULER: MasterJam[]
  masterJamJUMAT:   MasterJam[]
  onUpdateCell:     (key: CellKey, patch: Partial<CellState>) => void
  onClearCell:      (key: CellKey) => void
}

export function JadwalGrid({
  hariConfig, gridState, paletteMapel,
  masterJamREGULER, masterJamJUMAT,
  onUpdateCell, onClearCell,
}: Props) {
  const activeHari = hariConfig.filter((h) => h.aktif)

  // Pisah: hari reguler vs jumat
  const hariREGULER = activeHari.filter((h) => h.hari !== \'JUMAT\')
  const hariJUMAT   = activeHari.filter((h) => h.hari === \'JUMAT\')

  return (
    <div className="space-y-4 pb-4">
      {/* Seksi reguler */}
      {hariREGULER.length > 0 && masterJamREGULER.length > 0 && (
        <GridSection
          hariList={hariREGULER}
          masterJamList={masterJamREGULER}
          gridState={gridState}
          paletteMapel={paletteMapel}
          onUpdateCell={onUpdateCell}
          onClearCell={onClearCell}
        />
      )}

      {/* Seksi jumat */}
      {hariJUMAT.length > 0 && masterJamJUMAT.length > 0 && (
        <GridSection
          hariList={hariJUMAT}
          masterJamList={masterJamJUMAT}
          gridState={gridState}
          paletteMapel={paletteMapel}
          onUpdateCell={onUpdateCell}
          onClearCell={onClearCell}
        />
      )}

      {/* Empty state */}
      {masterJamREGULER.length === 0 && masterJamJUMAT.length === 0 && (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
          Belum ada master jam untuk tingkat ini.
        </div>
      )}
    </div>
  )
}

interface SectionProps {
  hariList:      HariConfig[]
  masterJamList: MasterJam[]
  gridState:     GridState
  paletteMapel:  PaletteMapel[]
  onUpdateCell:  (key: CellKey, patch: Partial<CellState>) => void
  onClearCell:   (key: CellKey) => void
}

function GridSection({
  hariList, masterJamList, gridState, paletteMapel,
  onUpdateCell, onClearCell,
}: SectionProps) {
  // Sort by urutan, exclude istirahat from cells but show as divider
  const sorted = [...masterJamList].sort((a, b) => a.urutan - b.urutan)

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
      {/* Header — sesi columns */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {/* Hari label col */}
        <div className="w-20 shrink-0 px-3 py-2.5 border-r border-gray-200 dark:border-gray-700" />
        {/* Sesi cols */}
        {sorted.map((mj) => (
          <div
            key={mj.id}
            className={
              \'min-w-[160px] flex-shrink-0 px-2 py-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0 text-center \' +
              (mj.isIstirahat ? \'bg-amber-50 dark:bg-amber-900/10\' : \'\')
            }
          >
            {mj.isIstirahat ? (
              <div className="flex flex-col items-center gap-0.5">
                <Coffee className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  Istirahat
                </span>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{mj.namaSesi}</p>
                <p className="text-[10px] font-mono text-gray-400">{mj.jamMulai}–{mj.jamSelesai}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Hari rows */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {hariList.map(({ hari }) => (
          <div key={hari} className="flex">
            {/* Hari label */}
            <div className="w-20 shrink-0 px-3 py-2 flex items-center bg-gray-50 dark:bg-gray-800/50 border-r border-gray-100 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {HARI_LABEL[hari]}
              </span>
            </div>

            {/* Cells */}
            {sorted.map((mj) => {
              const cellKey: CellKey = hari + \'-\' + mj.id

              if (mj.isIstirahat) {
                return (
                  <div
                    key={mj.id}
                    className="min-w-[160px] flex-shrink-0 border-r border-gray-100 dark:border-gray-800 last:border-r-0 bg-amber-50/30 dark:bg-amber-900/5 flex items-center justify-center p-2"
                  >
                    <span className="text-[10px] text-amber-400">—</span>
                  </div>
                )
              }

              return (
                <div
                  key={mj.id}
                  className="min-w-[160px] flex-shrink-0 border-r border-gray-100 dark:border-gray-800 last:border-r-0 p-1.5"
                >
                  <JadwalCell
                    cellKey={cellKey}
                    cellState={gridState[cellKey]}
                    paletteMapel={paletteMapel}
                    masterJam={mj}
                    onUpdate={(patch) => onUpdateCell(cellKey, patch)}
                    onClear={() => onClearCell(cellKey)}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
'''

# ─────────────────────────────────────────────────────────────────
# 5. JadwalCell.tsx — hapus time input, lebih bersih
# ─────────────────────────────────────────────────────────────────
FILES["app/dashboard/jadwal/manajemen/buat-jadwal/_components/JadwalCell.tsx"] = '''\
\'use client\'

import { useDroppable } from \'@dnd-kit/core\'
import { X } from \'lucide-react\'
import type { CellKey, CellState, PaletteMapel } from \'./jadwal-form.types\'
import type { MasterJam } from \'@/types/master-jam.types\'

interface Props {
  cellKey:      CellKey
  cellState:    CellState | undefined
  paletteMapel: PaletteMapel[]
  masterJam:    MasterJam
  onUpdate:     (patch: Partial<CellState>) => void
  onClear:      () => void
}

const KATEGORI_COLOR: Record<string, string> = {
  WAJIB:             \'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300\',
  PEMINATAN:         \'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300\',
  LINTAS_MINAT:      \'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300\',
  MULOK:             \'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300\',
  PENGEMBANGAN_DIRI: \'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300\',
}

export function JadwalCell({
  cellKey, cellState, paletteMapel, masterJam, onUpdate, onClear,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: \'cell-\' + cellKey })

  const guruPool = cellState?.mataPelajaranId
    ? (paletteMapel.find((p) => p.id === cellState.mataPelajaranId)?.guruPool ?? [])
    : []

  const isEmpty = !cellState?.mataPelajaranId
  const mapelInfo = cellState
    ? paletteMapel.find((p) => p.id === cellState.mataPelajaranId)
    : null

  return (
    <div
      ref={setNodeRef}
      className={[
        \'rounded-lg border transition-all min-h-[80px] flex flex-col\',
        isOver
          ? \'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 shadow-md\'
          : isEmpty
          ? \'border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10\'
          : \'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900\',
      ].join(\' \')}
    >
      {isEmpty ? (
        /* Drop hint */
        <div className="flex-1 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] text-gray-300 dark:text-gray-600 select-none">
            {isOver ? \'Lepaskan\' : \'Drop mapel\'}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-1 p-1.5">
          {/* Header: kode + nama + clear */}
          <div className="flex items-start gap-1">
            <div className="flex-1 min-w-0">
              <span className={
                \'inline-block text-[9px] font-bold px-1 py-0.5 rounded mr-1 \' +
                (KATEGORI_COLOR[mapelInfo?.kategori ?? \'\'] ?? \'bg-gray-100 text-gray-600\')
              }>
                {cellState.mataPelajaranKode}
              </span>
              <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 leading-tight mt-0.5 line-clamp-2">
                {cellState.mataPelajaranNama}
              </p>
            </div>
            <button
              type="button"
              onClick={onClear}
              className="shrink-0 text-gray-300 hover:text-red-400 transition-colors mt-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Guru select */}
          <select
            value={cellState.guruId}
            onChange={(e) => onUpdate({ guruId: e.target.value })}
            className={[
              \'w-full text-[10px] rounded border px-1.5 py-1 bg-white dark:bg-gray-800 outline-none\',
              !cellState.guruId
                ? \'border-orange-300 text-orange-500\'
                : \'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300\',
            ].join(\' \')}
          >
            <option value="">— Pilih Guru —</option>
            {guruPool.map((g) => (
              <option key={g.guruId} value={g.guruId}>{g.namaLengkap}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
'''

# ─────────────────────────────────────────────────────────────────
# 6. GuruInfoPanel.tsx — semua guru pool, breakdown per hari
# ─────────────────────────────────────────────────────────────────
FILES["app/dashboard/jadwal/manajemen/buat-jadwal/_components/GuruInfoPanel.tsx"] = '''\
\'use client\'

import { useState, useMemo } from \'react\'
import { useBebanMengajar } from \'@/hooks/jadwal/useJadwal\'
import { Spinner } from \'@/components/ui\'
import { User, ChevronDown, ChevronRight, Clock } from \'lucide-react\'
import type { PaletteMapel } from \'./jadwal-form.types\'
import type { BebanMengajarResponse } from \'@/types/jadwal.types\'

interface GuruInGrid {
  namaLengkap:  string
  slotsByHari:  Record<string, string[]>   // hari -> ["07:15-08:00", ...]
}

interface Props {
  paletteMapel:  PaletteMapel[]
  guruInGrid:    Record<string, GuruInGrid>
  semesterId:    string
  focusedGuruId: string | null
  onFocusGuru:   (id: string | null) => void
}

const HARI_LABEL: Record<string, string> = {
  SENIN: \'Senin\', SELASA: \'Selasa\', RABU: \'Rabu\',
  KAMIS: \'Kamis\', JUMAT: \'Jumat\',   SABTU: \'Sabtu\',
}

export function GuruInfoPanel({
  paletteMapel, guruInGrid, semesterId, focusedGuruId, onFocusGuru,
}: Props) {
  // Kumpulkan semua guru unik dari seluruh palette
  const allGurus = useMemo(() => {
    const map = new Map<string, { namaLengkap: string; mapelNama: string[] }>()
    for (const mapel of paletteMapel) {
      for (const g of mapel.guruPool) {
        if (!map.has(g.guruId)) {
          map.set(g.guruId, { namaLengkap: g.namaLengkap, mapelNama: [] })
        }
        map.get(g.guruId)!.mapelNama.push(mapel.nama)
      }
    }
    return Array.from(map.entries()).map(([guruId, info]) => ({ guruId, ...info }))
  }, [paletteMapel])

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden h-full">
      <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Info Guru
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">{allGurus.length} guru tersedia</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {allGurus.length === 0 ? (
          <p className="text-xs text-gray-400 italic text-center py-4">
            Belum ada guru terdaftar
          </p>
        ) : (
          allGurus.map((guru) => (
            <GuruCard
              key={guru.guruId}
              guruId={guru.guruId}
              namaLengkap={guru.namaLengkap}
              mapelNama={guru.mapelNama}
              gridInfo={guruInGrid[guru.guruId] ?? null}
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

// ── Guru Card ─────────────────────────────────────────────────
interface GuruCardProps {
  guruId:       string
  namaLengkap:  string
  mapelNama:    string[]
  gridInfo:     { namaLengkap: string; slotsByHari: Record<string, string[]> } | null
  semesterId:   string
  isExpanded:   boolean
  onToggle:     () => void
}

function GuruCard({ guruId, namaLengkap, mapelNama, gridInfo, semesterId, isExpanded, onToggle }: GuruCardProps) {
  const totalJamGrid = gridInfo
    ? Object.values(gridInfo.slotsByHari).reduce((sum, slots) => sum + slots.length, 0)
    : 0

  const { data: bebanRaw, isLoading: loadingBeban } = useBebanMengajar(
    isExpanded ? guruId : null,
    isExpanded ? semesterId : null,
  )
  const beban = bebanRaw as BebanMengajarResponse | undefined

  return (
    <div className={
      \'rounded-lg border transition-colors \' +
      (isExpanded
        ? \'border-emerald-200 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10\'
        : \'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50\')
    }>
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left"
      >
        <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
          <User className="h-3 w-3 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate">
            {namaLengkap}
          </p>
          {totalJamGrid > 0 && (
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
              {totalJamGrid} jam di form ini
            </p>
          )}
        </div>
        {isExpanded
          ? <ChevronDown className="h-3 w-3 text-gray-400 shrink-0" />
          : <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
        }
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-2.5 pb-2.5 space-y-2.5 border-t border-emerald-100 dark:border-emerald-800/30 pt-2">
          {/* Jam di form ini */}
          {gridInfo && totalJamGrid > 0 && (
            <div>
              <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
                {totalJamGrid} jam di jadwal ini
              </p>
              {Object.entries(gridInfo.slotsByHari).map(([hari, slots]) => (
                <div key={hari} className="flex gap-1.5 items-start mb-0.5">
                  <span className="text-[9px] font-semibold text-gray-500 w-12 shrink-0 mt-0.5">
                    {HARI_LABEL[hari] ?? hari}
                  </span>
                  <div className="flex flex-wrap gap-0.5">
                    {slots.map((s, i) => (
                      <span key={i} className="text-[9px] font-mono bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Beban dari DB (kelas lain) */}
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">
              Terjadwal di kelas lain (DB)
            </p>
            {loadingBeban ? (
              <Spinner />
            ) : beban && beban.totalSemuaJam > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <Clock className="h-2.5 w-2.5" />
                  <span className="font-semibold">{beban.totalSemuaJam} jam total</span>
                </div>
                {beban.rincianPerMapel.map((r, i) => (
                  <div key={i} className="space-y-0.5">
                    <p className="text-[9px] font-semibold text-gray-600 dark:text-gray-400">
                      {r.namaMapel}
                    </p>
                    {r.detailJadwal.map((d, j) => (
                      <div key={j} className="flex items-center gap-1 pl-1.5">
                        <span className="text-[9px] text-gray-400">
                          {d.kelas} · {HARI_LABEL[d.hari] ?? d.hari} {d.jam}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-gray-400 italic">Belum ada jadwal lain</p>
            )}
          </div>

          {/* Mapel yang diajarkan */}
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">
              Mengajar
            </p>
            <div className="flex flex-wrap gap-0.5">
              {mapelNama.map((n, i) => (
                <span key={i} className="text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'''

# ─────────────────────────────────────────────────────────────────
# 7. PreModalKonfigurasi.tsx — hapus jumlahJam
# ─────────────────────────────────────────────────────────────────
FILES["app/dashboard/jadwal/manajemen/buat-jadwal/_components/PreModalKonfigurasi.tsx"] = '''\
\'use client\'

import { useState, useMemo } from \'react\'
import { Modal, Button, Select } from \'@/components/ui\'
import { useTahunAjaranActive, useTahunAjaranList } from \'@/hooks/tahun-ajaran/useTahunAjaran\'
import { useSemesterByTahunAjaran } from \'@/hooks/semester/useSemester\'
import { useTingkatKelasList } from \'@/hooks/tingkat-kelas/useTingkatKelas\'
import { useKelasList } from \'@/hooks/kelas/useKelas\'
import type { HariEnum } from \'@/types/jadwal.types\'
import { HARI_LIST } from \'@/types/jadwal.types\'
import type { HariConfig, PreModalParams } from \'./jadwal-form.types\'

interface Props {
  open:      boolean
  onClose:   () => void
  onConfirm: (params: PreModalParams) => void
}

const HARI_LABEL: Record<HariEnum, string> = {
  SENIN: \'Senin\', SELASA: \'Selasa\', RABU: \'Rabu\',
  KAMIS: \'Kamis\', JUMAT:  \'Jumat\',  SABTU: \'Sabtu\',
}

const DEFAULT_HARI_CONFIG: HariConfig[] = HARI_LIST.map((h) => ({
  hari: h, aktif: h !== \'SABTU\',
}))

export function PreModalKonfigurasi({ open, onClose, onConfirm }: Props) {
  const [taId, setTaId]             = useState(\'\')
  const [semesterId, setSemesterId] = useState(\'\')
  const [tingkatId, setTingkatId]   = useState(\'\')
  const [kelasId, setKelasId]       = useState(\'\')
  const [hariConfig, setHariConfig] = useState<HariConfig[]>(DEFAULT_HARI_CONFIG)

  const { data: taAktifRaw } = useTahunAjaranActive()
  const { data: taListRaw }  = useTahunAjaranList()

  const taAktif = useMemo(() => {
    if (!taAktifRaw) return null
    const arr = taAktifRaw as unknown as { id: string; isActive?: boolean }[]
    if (!Array.isArray(arr)) return taAktifRaw as unknown as { id: string }
    return arr.find((t) => t.isActive) ?? arr[0] ?? null
  }, [taAktifRaw])

  const resolvedTaId = taId || taAktif?.id || \'\'

  const { data: semesterListRaw } = useSemesterByTahunAjaran(resolvedTaId || null)
  const { data: tingkatListRaw }  = useTingkatKelasList()
  const { data: kelasListRaw }    = useKelasList(
    resolvedTaId ? { tahunAjaranId: resolvedTaId, tingkatKelasId: tingkatId || undefined } : undefined,
  )

  const resolvedSemesterId = useMemo(() => {
    if (semesterId) return semesterId
    const arr = semesterListRaw as unknown as { id: string; isActive?: boolean }[] | undefined ?? []
    return arr.find((s) => s.isActive)?.id ?? arr[0]?.id ?? \'\'
  }, [semesterId, semesterListRaw])

  const taArr      = (taListRaw as unknown as { id: string; nama: string }[] | undefined) ?? []
  const semArr     = (semesterListRaw as unknown as { id: string; nama: string; isActive: boolean }[] | undefined) ?? []
  const tingkatArr = (tingkatListRaw as unknown as { id: string; nama: string }[] | undefined) ?? []
  const kelasArr   = (kelasListRaw as unknown as { id: string; namaKelas: string }[] | undefined) ?? []

  const taOptions = taArr.map((t) => ({ label: t.nama, value: t.id }))
  const smtOptions = [
    { label: \'— Pilih Semester —\', value: \'\' },
    ...semArr.map((s) => ({ label: s.nama + (s.isActive ? \' (Aktif)\' : \'\'), value: s.id })),
  ]
  const tingkatOpts = [
    { label: \'— Semua Tingkat —\', value: \'\' },
    ...tingkatArr.map((t) => ({ label: \'Kelas \' + t.nama, value: t.id })),
  ]
  const kelasOpts = [
    { label: kelasArr.length ? \'— Pilih Kelas —\' : \'— Pilih TA terlebih dahulu —\', value: \'\' },
    ...kelasArr.map((k) => ({ label: k.namaKelas, value: k.id })),
  ]

  const canConfirm = !!resolvedTaId && !!resolvedSemesterId && !!kelasId &&
    hariConfig.some((h) => h.aktif)

  const toggleHari = (hari: HariEnum) =>
    setHariConfig((prev) => prev.map((h) => (h.hari === hari ? { ...h, aktif: !h.aktif } : h)))

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm({
      kelasId,
      semesterId: resolvedSemesterId,
      hariConfig: hariConfig.filter((h) => h.aktif),
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Konfigurasi Jadwal Perkelas" size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!canConfirm}>
            Lanjut ke Form Jadwal
          </Button>
        </>
      }
    >
      <div className="p-6 space-y-5">
        {/* TA & Semester */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tahun Ajaran <span className="text-red-500">*</span>
            </label>
            <Select options={taOptions} value={resolvedTaId}
              onChange={(e) => { setTaId(e.target.value); setSemesterId(\'\'); setKelasId(\'\') }} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Semester <span className="text-red-500">*</span>
            </label>
            <Select options={smtOptions} value={resolvedSemesterId}
              onChange={(e) => setSemesterId(e.target.value)} />
          </div>
        </div>

        {/* Tingkat & Kelas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tingkat <span className="text-xs text-gray-400">(filter kelas)</span>
            </label>
            <Select options={tingkatOpts} value={tingkatId}
              onChange={(e) => { setTingkatId(e.target.value); setKelasId(\'\') }} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Kelas <span className="text-red-500">*</span>
            </label>
            <Select options={kelasOpts} value={kelasId}
              onChange={(e) => setKelasId(e.target.value)} />
          </div>
        </div>

        {!resolvedTaId && (
          <p className="text-xs text-amber-500">
            Pilih Tahun Ajaran agar daftar kelas muncul.
          </p>
        )}

        {/* Hari aktif — hanya checkbox, tanpa jumlahJam */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Hari Aktif
          </label>
          <p className="text-xs text-gray-400 -mt-1">
            Jumlah sesi per hari ditentukan otomatis dari Master Jam Pelajaran
          </p>
          <div className="grid grid-cols-3 gap-2">
            {hariConfig.map((h) => (
              <button
                key={h.hari}
                type="button"
                onClick={() => toggleHari(h.hari)}
                className={
                  \'flex items-center gap-2 rounded-lg px-3 py-2.5 border transition-colors text-left \' +
                  (h.aktif
                    ? \'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20\'
                    : \'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50\')
                }
              >
                <div className={
                  \'h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 \' +
                  (h.aktif
                    ? \'border-emerald-500 bg-emerald-500\'
                    : \'border-gray-300 dark:border-gray-600\')
                }>
                  {h.aktif && (
                    <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={
                  \'text-sm font-medium \' +
                  (h.aktif ? \'text-emerald-700 dark:text-emerald-300\' : \'text-gray-400\')
                }>
                  {HARI_LABEL[h.hari]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
'''

# ─────────────────────────────────────────────────────────────────
# 8. buat-jadwal/page.tsx — update DEFAULT_HARI_CONFIG tanpa jumlahJam
# ─────────────────────────────────────────────────────────────────
FILES["app/dashboard/jadwal/manajemen/buat-jadwal/page.tsx"] = '''\
\'use client\'

import { Suspense, useMemo } from \'react\'
import { useSearchParams, useRouter } from \'next/navigation\'
import { useKelasById } from \'@/hooks/kelas/useKelas\'
import { Button } from \'@/components/ui\'
import { ArrowLeft } from \'lucide-react\'
import { JadwalFormLayout } from \'./_components/JadwalFormLayout\'
import { BuatJadwalPageSkeleton } from \'./_components/BuatJadwalPageSkeleton\'
import type { HariConfig } from \'./_components/jadwal-form.types\'
import type { HariEnum } from \'@/types/jadwal.types\'

const DEFAULT_HARI_CONFIG: HariConfig[] = [
  { hari: \'SENIN\'  as HariEnum, aktif: true },
  { hari: \'SELASA\' as HariEnum, aktif: true },
  { hari: \'RABU\'   as HariEnum, aktif: true },
  { hari: \'KAMIS\'  as HariEnum, aktif: true },
  { hari: \'JUMAT\'  as HariEnum, aktif: true },
]

function BuatJadwalInner() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const kelasId       = searchParams.get(\'kelasId\')    ?? \'\'
  const semesterId    = searchParams.get(\'semesterId\') ?? \'\'
  const hariConfigRaw = searchParams.get(\'hariConfig\')

  const hariConfig = useMemo((): HariConfig[] => {
    if (!hariConfigRaw) return DEFAULT_HARI_CONFIG
    try {
      const parsed = JSON.parse(decodeURIComponent(hariConfigRaw)) as HariConfig[]
      return parsed.length ? parsed : DEFAULT_HARI_CONFIG
    } catch { return DEFAULT_HARI_CONFIG }
  }, [hariConfigRaw])

  const { data: kelasRaw, isLoading: loadingKelas } = useKelasById(kelasId || null)
  const kelas = kelasRaw as { namaKelas: string; tingkatKelasId: string } | undefined

  if (!kelasId || !semesterId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-500 text-sm">Parameter tidak lengkap.</p>
        <Button variant="secondary" size="sm" onClick={() => { router.back() }}>Kembali</Button>
      </div>
    )
  }

  if (loadingKelas) return <BuatJadwalPageSkeleton />

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <Button variant="secondary" size="sm" onClick={() => { router.back() }}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Buat Jadwal{kelas ? \' — \' + kelas.namaKelas : \'\'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Drag mata pelajaran ke slot · Pilih guru pada setiap sesi
          </p>
        </div>
      </div>

      <JadwalFormLayout
        kelasId={kelasId}
        semesterId={semesterId}
        hariConfig={hariConfig}
        tingkatKelasId={kelas?.tingkatKelasId ?? \'\'}
        namaKelas={kelas?.namaKelas ?? kelasId}
      />
    </div>
  )
}

export default function BuatJadwalPage() {
  return (
    <Suspense fallback={<BuatJadwalPageSkeleton />}>
      <BuatJadwalInner />
    </Suspense>
  )
}
'''

# ─────────────────────────────────────────────────────────────────
# WRITER
# ─────────────────────────────────────────────────────────────────
def write_files():
    for rel_path, content in FILES.items():
        full_path = os.path.join(BASE, rel_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  ✅ {full_path}")

if __name__ == "__main__":
    print("\n🚀 BATCH B — Revisi buat-jadwal (masterJam)\n")
    write_files()
    print("\n✅ Batch B selesai.")
    print("Jalankan: npx tsc --noEmit 2>&1 | Select-String 'jadwal'\n")