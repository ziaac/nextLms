// ============================================================
// materi-pelajaran.types.ts
// ============================================================

export type TipeMateri    = 'TEXT' | 'PDF' | 'AUDIO' | 'VIDEO_YOUTUBE' | 'SLIDESHOW' | 'HYBRID'

export interface HybridFileUrls {
  youtube?:  string
  slideshow?: string
}
export type StatusMateri  = 'DRAFT' | 'DIJADWALKAN' | 'TERPUBLIKASI'

/** Status dihitung di frontend berdasarkan field model */
export function getStatusMateri(item: {
  isPublished:       boolean
  tanggalPublikasi?: string | null
}): StatusMateri {
  if (!item.isPublished) return 'DRAFT'
  const pub = item.tanggalPublikasi ? new Date(item.tanggalPublikasi) : null
  if (pub && pub > new Date()) return 'DIJADWALKAN'
  return 'TERPUBLIKASI'
}

// ── Response shapes ───────────────────────────────────────────
export interface MateriDokumenRef {
  id:           string
  judul:        string
  fileUrl:      string
  jenisDokumen: string
}

export interface MateriItem {
  id:                  string
  mataPelajaranId:     string
  guruId:              string
  kelasId:             string
  tipeMateri:          TipeMateri
  judul:               string
  deskripsi?:          string | null
  konten?:             string | null
  fileUrls?:           string[] | HybridFileUrls | null
  pertemuanKe?:        number | null
  kompetensiDasar?:    string | null
  tujuanPembelajaran?: string | null
  tanggalPublikasi?:   string | null
  isPublished:         boolean
  isDiskusiAktif:      boolean
  viewCount:           number
  minScreenTime:       number
  createdAt:           string
  updatedAt:           string
  mataPelajaran?: {
    id:                     string
    mataPelajaranTingkatId?: string
    mataPelajaranTingkat?: {
      id:          string
      masterMapel?: { id: string; nama: string; kode?: string }
      tingkatKelas?: { id: string; nama: string }
    }
    semester?: { id: string; nama: string; isActive: boolean; urutan: number; tahunAjaran?: { id: string; nama: string } }
    kelas?:   { id: string; namaKelas: string }
  }
  kelas?:  { id: string; namaKelas: string }
  guru?: {
    id:       string
    profile?: { namaLengkap: string; fotoUrl?: string | null }
  }
  dokumenPengajarans?: MateriDokumenRef[]
  tugas?: Array<{ id: string; judul: string; tujuan: string; bentuk: string; tanggalSelesai: string }>
  progressSiswa?: Array<{ isRead: boolean; timeSpentSeconds: number }>
  _count?: { tugas: number }
}

// ── Payloads ──────────────────────────────────────────────────
export interface MateriPayload {
  mataPelajaranId:     string
  kelasId:             string
  dokumenPengajaranIds?: string[]
  tugasIds?:             string[]
  tipeMateri:          TipeMateri
  judul:               string
  deskripsi?:          string
  konten?:             string
  fileUrls?:           string[] | HybridFileUrls
  pertemuanKe?:        number | null
  kompetensiDasar?:    string
  tujuanPembelajaran?: string
  tanggalPublikasi?:   string | null
  isPublished?:        boolean
  minScreenTime?:      number
}

// ── Query params ──────────────────────────────────────────────
export interface MateriQueryParams {
  page?:                   number
  limit?:                  number
  search?:                 string
  kelasId?:                string
  tingkatKelasId?:         string
  mataPelajaranId?:        string
  mataPelajaranTingkatId?: string
  semesterId?:             string
  tahunAjaranId?:          string
  isSemesterAktif?:        boolean
  isTahunAjaranAktif?:     boolean
  guruId?:                 string
  tipeMateri?:             TipeMateri
  isPublished?:            boolean
}

// ── List response ─────────────────────────────────────────────
export interface MateriListMeta {
  total:       number
  page:        number
  limit:       number
  totalPages:  number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface MateriListResponse {
  data: MateriItem[]
  meta: MateriListMeta
}

// ── Bulk copy ─────────────────────────────────────────────────
export interface BulkCopyMateriPayload {
  sourceMateriIds:        string[]
  targetMataPelajaranIds: string[]
}

export interface BulkCopyMateriResponse {
  message:     string
  totalCopied: number
}

// ── Predefined data (create step 1) ──────────────────────────
export interface MateriPredefinedData {
  guruId?:               string
  guruNama?:             string
  tahunAjaranId:         string
  tahunAjaranNama:       string
  semesterId:            string
  semesterNama:          string
  mataPelajaranTingkatId: string
  mapelNama:             string
  tingkatNama:           string
  mataPelajaranId:       string
  kelasId:               string
  kelasNama:             string
}

// ── Bulk copy target row (in create form) ────────────────────
export interface BulkCreateTargetRow {
  mataPelajaranId: string
  kelasNama:       string
  mapelNama:       string
  isChecked:       boolean
  date:            string  // YYYY-MM-DD
  time:            string  // HH:mm
}
