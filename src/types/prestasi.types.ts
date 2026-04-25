// ── Enums (string union — lebih fleksibel dari import prisma di frontend) ──────
export type TingkatLomba =
  | 'SEKOLAH'
  | 'KECAMATAN'
  | 'KABUPATEN_KOTA'
  | 'PROVINSI'
  | 'NASIONAL'
  | 'INTERNASIONAL'

export type HasilPrestasi =
  | 'JUARA_1'
  | 'JUARA_2'
  | 'JUARA_3'
  | 'JUARA_HARAPAN'
  | 'FINALIS'
  | 'PESERTA'
  | 'LAINNYA'

// ── Display helpers ───────────────────────────────────────────────────────────
export const TINGKAT_LABEL: Record<TingkatLomba, string> = {
  SEKOLAH:         'Sekolah',
  KECAMATAN:       'Kecamatan',
  KABUPATEN_KOTA:  'Kab/Kota',
  PROVINSI:        'Provinsi',
  NASIONAL:        'Nasional',
  INTERNASIONAL:   'Internasional',
}

export const TINGKAT_COLOR: Record<TingkatLomba, string> = {
  SEKOLAH:         'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  KECAMATAN:       'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  KABUPATEN_KOTA:  'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  PROVINSI:        'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  NASIONAL:        'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  INTERNASIONAL:   'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export const HASIL_LABEL: Record<HasilPrestasi, string> = {
  JUARA_1:      'Juara 1',
  JUARA_2:      'Juara 2',
  JUARA_3:      'Juara 3',
  JUARA_HARAPAN:'Juara Harapan',
  FINALIS:      'Finalis',
  PESERTA:      'Peserta',
  LAINNYA:      'Lainnya',
}

export const HASIL_COLOR: Record<HasilPrestasi, string> = {
  JUARA_1:      'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  JUARA_2:      'bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
  JUARA_3:      'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  JUARA_HARAPAN:'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  FINALIS:      'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PESERTA:      'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  LAINNYA:      'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

// ── Main entity ───────────────────────────────────────────────────────────────
export interface PrestasiItem {
  id:             string
  siswaId:        string
  judul:          string
  deskripsi:      string | null
  jenisLomba:     string
  tingkat:        TingkatLomba
  penyelenggara:  string
  tempatLomba:    string | null
  tanggalMulai:   string
  tanggalSelesai: string | null
  peringkat:      string | null
  hasilPrestasi:  HasilPrestasi
  sertifikatUrl:  string | null
  fotoUrl:        string | null
  inputBy:        string
  isVerified:     boolean
  verifiedBy:     string | null
  verifiedAt:     string | null
  createdAt:      string
  siswa: {
    id:      string
    profile: { namaLengkap: string; nisn: string } | null
  }
  inputter: {
    id:      string
    profile: { namaLengkap: string } | null
  }
  verifier?: {
    id:      string
    profile: { namaLengkap: string } | null
  } | null
}

// ── List response ─────────────────────────────────────────────────────────────
export interface PrestasiListResponse {
  data:  PrestasiItem[]
  total: number
  page:  number
  limit: number
}

// ── Payload ───────────────────────────────────────────────────────────────────
export interface CreatePrestasiPayload {
  siswaId?:       string
  judul:          string
  deskripsi?:     string
  jenisLomba:     string
  tingkat:        TingkatLomba
  penyelenggara:  string
  tempatLomba?:   string
  tanggalMulai:   string
  tanggalSelesai?: string
  peringkat?:     string
  hasilPrestasi:  HasilPrestasi
  sertifikatUrl?: string
  fotoUrl?:       string
}

export interface QueryPrestasi {
  page?:          number
  limit?:         number
  siswaId?:       string
  tingkat?:       TingkatLomba
  hasilPrestasi?: HasilPrestasi
  isVerified?:    boolean
}
