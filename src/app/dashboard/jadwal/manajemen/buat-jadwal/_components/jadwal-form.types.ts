import type { HariEnum } from '@/types/jadwal.types'

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
  ruanganNama:            string   // untuk display badge
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

// ─── GuruInGrid (pakai bobotJp dari masterJam) ───────────────
export interface GuruSlot {
  label:   string
  bobotJp: number
}

export interface GuruInGridEntry {
  namaLengkap:  string
  slotsByHari:  Record<string, GuruSlot[]>
  totalBobotJp: number
}
