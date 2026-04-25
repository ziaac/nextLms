// ── Types untuk Dimensi Profil Lulusan (BSKAP 058/H/KR/2025) ──────────

export type LevelDimensi = 'BERKEMBANG' | 'CAKAP' | 'MAHIR'

export interface SubDimensiProfil {
  id:          string
  kode:        string
  nama:        string
  urutan:      number
  keteranganB: string
  keteranganC: string
  keteranganM: string
}

export interface DimensiProfil {
  id:        string
  kode:      string
  nama:      string
  urutan:    number
  subDimensi: SubDimensiProfil[]
}

/** Digunakan untuk GET /dimensi-profil/master */
export type MasterDimensiResponse = DimensiProfil[]

/** Sub-dimensi yang dipilih untuk sebuah MataPelajaranTingkat, grouped by dimensi */
export interface SubDimensiWithDimensi extends SubDimensiProfil {
  dimensi: { id: string; kode: string; nama: string; urutan: number }
}

export interface DimensiGrouped {
  dimensi:    { id: string; kode: string; nama: string; urutan: number }
  subDimensi: SubDimensiWithDimensi[]
}

// ── Grid Penilaian (Guru) ─────────────────────────────────────────────

export interface SiswaItem {
  id:          string
  namaLengkap: string
  fotoUrl:     string | null
}

export type PenilaianMap = Record<
  string,  // `${siswaId}__${subDimensiId}`
  { level: LevelDimensi | null; catatan: string | null }
>

export interface PenilaianGridResponse {
  siswaList:      SiswaItem[]
  subDimensiList: SubDimensiWithDimensi[]
  penilaianMap:   PenilaianMap
}

// ── Payload upsert ────────────────────────────────────────────────────

export interface PenilaianItemPayload {
  siswaId:      string
  subDimensiId: string
  level?:       LevelDimensi | null
  catatan?:     string | null
}

export interface BulkUpsertPayload {
  items: PenilaianItemPayload[]
}

// ── CRUD Admin payloads ───────────────────────────────────────────────

export interface CreateDimensiPayload {
  kode:   string
  nama:   string
  urutan: number
}
export interface UpdateDimensiPayload extends Partial<CreateDimensiPayload> {}

export interface CreateSubDimensiPayload {
  kode:        string
  nama:        string
  urutan:      number
  keteranganB: string
  keteranganC: string
  keteranganM: string
}
export interface UpdateSubDimensiPayload extends Partial<CreateSubDimensiPayload> {}

// ── Ringkasan Siswa ───────────────────────────────────────────────────

export interface PenilaianSiswaItem {
  subDimensiId:   string
  subDimensiKode: string
  subDimensiNama: string
  keteranganB:    string
  keteranganC:    string
  keteranganM:    string
  level:          LevelDimensi | null
  catatan:        string | null
  mapelNama:      string
}

export interface DimensiRingkasanSiswa {
  dimensi:   { id: string; kode: string; nama: string; urutan: number }
  penilaian: PenilaianSiswaItem[]
}
