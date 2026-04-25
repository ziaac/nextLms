// ── Enums ─────────────────────────────────────────────────────────────────────
export type JenisSikap = 'POSITIF' | 'NEGATIF'

// ── Master Sikap ──────────────────────────────────────────────────────────────
export interface MasterSikapItem {
  id:       string
  kode:     string
  nama:     string
  jenis:    JenisSikap
  uraian:   string
  point:    number
  level:    number
  kategori: string | null
  sanksi:   string | null
  isActive: boolean
}

// ── Catatan Sikap (list / detail) ─────────────────────────────────────────────
export interface CatatanSikapItem {
  id:            string
  siswaId:       string
  masterSikapId: string
  guruId:        string
  semesterId:    string | null
  tanggal:       string      // ISO date
  waktu:         string      // ISO datetime (only time matters)
  lokasi:        string | null
  kronologi:     string | null
  tindakLanjut:  string | null
  fotoUrl:       string | null
  isNotified:    boolean
  createdAt:     string
  masterSikap: {
    kode:     string
    nama:     string
    jenis:    JenisSikap
    point:    number
    level:    number
    kategori: string | null
  }
  siswa: {
    id:      string
    profile: { namaLengkap: string } | null
  }
  guru: {
    id:      string
    profile: { namaLengkap: string } | null
  }
  semester?: { nama: string } | null
}

// ── Rekap (ringkasan per siswa) ───────────────────────────────────────────────
export interface RekapSikap {
  totalCatatan:       number
  jumlahPositif:      number
  jumlahNegatif:      number
  totalPointPositif:  number
  totalPointNegatif:  number
  netPoint:           number
}

/** Item dalam `riwayat` dari endpoint rekap — field lebih sedikit dari CatatanSikapItem */
export interface RiwayatSikapItem {
  id:     string
  tanggal: string
  lokasi: string | null
  masterSikap: {
    jenis:    JenisSikap
    point:    number
    nama:     string
    kode:     string
    kategori: string | null
  }
  semester?: { nama: string } | null
}

export interface RekapSiswaResponse {
  siswa: {
    id:      string
    profile: { namaLengkap: string; nisn: string } | null
  }
  semesterId: string | null
  rekap:      RekapSikap
  riwayat:    RiwayatSikapItem[]
}

// ── List response ─────────────────────────────────────────────────────────────
export interface CatatanSikapListResponse {
  data:  CatatanSikapItem[]
  total: number
  page:  number
  limit: number
}

export interface MasterSikapListResponse {
  data:  MasterSikapItem[]
  total: number
}

// ── Payloads ──────────────────────────────────────────────────────────────────
export interface CreateCatatanSikapPayload {
  siswaId:       string
  semesterId:    string
  masterSikapId: string
  tanggal:       string  // YYYY-MM-DD
  waktu:         string  // HH:MM
  lokasi?:       string
  kronologi?:    string
  tindakLanjut?: string
  fotoUrl?:      string
}
