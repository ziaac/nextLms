// ============================================================
// rpp.types.ts
// ============================================================

export type StatusRPP = 'DRAFT' | 'PUBLISHED'

export interface RppListItem {
  id:                  string
  guruId:              string
  kurikulumId:         string
  mataPelajaranId:     string
  semesterId:          string
  tingkatKelasId?:     string | null
  judul:               string
  topik:               string
  pertemuanKe?:        number | null
  alokasiWaktu?:       number | null
  tujuanPembelajaran?: string | null
  status:              StatusRPP
  publishedAt?:        string | null
  createdAt:           string
  updatedAt:           string
  mataPelajaran?: {
    id:                  string
    mataPelajaranTingkat?: {
      masterMapel?: { nama: string; kode?: string }
    }
    semester?: { id: string; nama: string; tahunAjaran?: { id: string; nama: string } }
    kelas?:    { id: string; namaKelas: string }
  }
  semester?:     { id: string; nama: string; tahunAjaran?: { id: string; nama: string } }
  tingkatKelas?: { id: string; nama: string }
  kurikulum?:    { id: string; nama: string }
}

export interface RPP extends RppListItem {
  konten:              Record<string, unknown>
  dokumenPengajarans?: Array<{ id: string; judul: string; jenisDokumen: string }>
}

// ── Payloads ──────────────────────────────────────────────────
export interface CreateRppDto {
  mataPelajaranId:     string
  semesterId:          string
  judul:               string
  topik:               string
  konten:              Record<string, unknown>
  tingkatKelasId?:     string
  pertemuanKe?:        number
  alokasiWaktu?:       number
  tujuanPembelajaran?: string
  dokumenPengajaranIds?: string[]
}

export type UpdateRppDto = Partial<CreateRppDto>

// ── Query params ──────────────────────────────────────────────
export interface RppFilterParams {
  semesterId?:      string
  mataPelajaranId?: string
  status?:          StatusRPP
  tingkatKelasId?:  string
  page?:            number
  limit?:           number
}

// ── List response ─────────────────────────────────────────────
export interface RppListMeta {
  total:      number
  page:       number
  limit:      number
  totalPages: number
}

export interface RppListResponse {
  data: RppListItem[]
  meta: RppListMeta
}
