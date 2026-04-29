// ── Guru Log LCKH Types ───────────────────────────────────────────────────────

export interface HarianQueryParams {
  bulan: number
  tahun: number
  semesterId?: string
  guruId?: string
}

export interface HarianItem {
  tanggal: string        // "2025-07-15"
  namaHari: string       // "Selasa"
  jumlahInternal: number
  jumlahEksternal: number
}

export type TipeAktivitasInternal =
  | 'ABSENSI'
  | 'MATERI'
  | 'TUGAS'
  | 'DOKUMEN'
  | 'SIKAP'
  | 'DIMENSI_PROFIL'

export interface AktivitasInternalMeta {
  namaKelas?: string
  namaMapel?: string
  judul?: string
  jenis?: string
  deadline?: string
  namaSiswa?: string
  aspek?: string
  dimensi?: string
  jamMulai?: string
  modeAbsensi?: string
}

export interface AktivitasInternalItem {
  id: string
  tipe: TipeAktivitasInternal
  deskripsi: string      // teks kontekstual yang sudah diformat backend
  waktu: string          // ISO timestamp
  meta: AktivitasInternalMeta
}

export interface GuruLogEksternalItem {
  id: string
  guruId: string
  tanggal: string
  kegiatan: string
  output: string
  volume: number
  satuan: string
  keterangan: string | null
  createdAt: string
  updatedAt: string
}

export interface DetailHarianResponse {
  tanggal: string
  namaHari: string
  aktivitasInternal: AktivitasInternalItem[]
  aktivitasEksternal: GuruLogEksternalItem[]
}

export interface CreateEksternalPayload {
  tanggal: string        // "YYYY-MM-DD"
  kegiatan: string
  output: string
  volume: number
  satuan: string
  keterangan?: string
}

export type UpdateEksternalPayload = Partial<Omit<CreateEksternalPayload, 'tanggal'>>

export interface ArsipBulanItem {
  bulan: number
  tahun: number
  namaBulan: string
  totalAktivitas: number
  harian: HarianItem[]
}

export interface ArsipQueryParams {
  tahunAjaranId: string
  semesterId?: string
  guruId?: string
}

// ── Persetujuan ───────────────────────────────────────────────────────────────

export interface PersetujuanStatus {
  isApproved: boolean
  atasanNama: string | null
  atasanId: string | null
  approvedAt: string | null
  tandaTanganSnapshot: string | null
}

// ── Manajemen: List Guru Summary ──────────────────────────────────────────────

export interface GuruLckhSummaryItem {
  guruId:              string
  namaLengkap:         string
  nip:                 string | null
  fotoUrl:             string | null
  role:                string
  totalHariAktif:      number
  totalAktivitas:      number
  hariDisetujui:       number
  hariPending:         number
  lastActivity:        string | null   // "YYYY-MM-DD"
  tanggalAktifPending: string[]        // hari aktif yang belum disetujui
}

export interface ListGuruSummaryParams {
  bulan?:      number
  tahun?:      number
  semesterId?: string
  search?:     string
  page?:       number
  limit?:      number
}

export interface ListGuruSummaryResponse {
  data: GuruLckhSummaryItem[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export interface PendingVerifikasiResponse {
  totalGuruPending: number
  totalHariPending: number
}
