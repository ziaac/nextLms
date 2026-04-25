// ── Enums ─────────────────────────────────────────────────────────────────────
export type StatusAnggotaEkskul = 'AKTIF' | 'NONAKTIF' | 'KELUAR'

export type HariEnum =
  | 'SENIN' | 'SELASA' | 'RABU' | 'KAMIS' | 'JUMAT' | 'SABTU' | 'MINGGU'

export const HARI_LABEL: Record<HariEnum, string> = {
  SENIN:   'Senin',
  SELASA:  'Selasa',
  RABU:    'Rabu',
  KAMIS:   'Kamis',
  JUMAT:   'Jumat',
  SABTU:   'Sabtu',
  MINGGU:  'Minggu',
}

// ── Entities ──────────────────────────────────────────────────────────────────
export interface EkskulItem {
  id:              string
  kode:            string
  nama:            string
  deskripsi:       string | null
  pembinaId:       string
  kategori:        string | null
  jadwalHari:      HariEnum
  jadwalJam:       string        // ISO datetime (only time matters)
  tempatKegiatan:  string | null
  kuotaMaksimal:   number
  logoUrl:         string | null
  isActive:        boolean
  pembina: {
    id:      string
    profile: { namaLengkap: string } | null
  }
  _count?: {
    anggota:  number
    kegiatan: number
  }
}

export interface AnggotaEkskulItem {
  id:                string
  ekstrakurikulerId: string
  siswaId:           string
  tahunAjaranId:     string
  jabatan:           string | null
  tanggalBergabung:  string
  tanggalKeluar:     string | null
  status:            StatusAnggotaEkskul
  ekstrakurikuler:   EkskulItem & { _count?: { anggota: number } }
  siswa?: {
    id:      string
    profile: { namaLengkap: string; nisn: string } | null
  }
  tahunAjaran?: {
    id:   string
    nama: string
  }
}

export interface KegiatanEkskulItem {
  id:                string
  ekstrakurikulerId: string
  judul:             string
  deskripsi:         string | null
  tanggal:           string
  jamMulai:          string
  jamSelesai:        string
  tempat:            string
  peserta:           number
  catatan:           string | null
  createdBy:         string
  createdAt:         string
}

// ── List responses ────────────────────────────────────────────────────────────
export interface EkskulListResponse {
  data:  EkskulItem[]
  total: number
  page:  number
  limit: number
}

export interface MyMembershipsResponse {
  data: AnggotaEkskulItem[]
}

// ── Payloads ──────────────────────────────────────────────────────────────────
export interface DaftarMandiriPayload {
  ekstrakurikulerId: string
  tahunAjaranId:     string
  tanggalBergabung:  string   // YYYY-MM-DD
}

export interface QueryEkskul {
  page?:      number
  limit?:     number
  jadwalHari?: HariEnum
  kategori?:  string
  isActive?:  boolean
  search?:    string
}
