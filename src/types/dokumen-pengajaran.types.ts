import type { JenisDokumen, StatusDokumenPengajaran } from './enums'

export type { JenisDokumen, StatusDokumenPengajaran }

export interface DokumenPengajaranPayload {
  mataPelajaranId: string
  tahunAjaranId:   string
  semesterId:      string
  jenisDokumen:    JenisDokumen
  judul:           string
  fileUrl:         string
}

export interface DokumenPengajaranReviewPayload {
  status:            'APPROVED' | 'REVISION_REQUESTED'
  catatanReviewer?:  string
}

export interface DokumenPengajaranItem {
  id:               string
  judul:            string
  jenisDokumen:     JenisDokumen
  status:           StatusDokumenPengajaran
  fileUrl:          string
  catatanReviewer?: string | null
  reviewedAt?:      string | null
  reviewedBy?:      string | null
  createdAt:        string
  updatedAt:        string
  guru?: {
    id:       string
    profile?: { namaLengkap: string }
  }
  mataPelajaran?: {
    id:                  string
    mataPelajaranTingkat?: {
      masterMapel?: { nama: string; kode?: string }
    }
    kelas?: { id: string; namaKelas: string }
  }
  tahunAjaranId?: string
  semesterId?:    string
  tahunAjaran?: { id: string; nama: string }
  semester?:    { id: string; nama: string }
  reviewer?: {
    id:       string
    profile?: { namaLengkap: string }
  }
}

export interface DokumenPengajaranMeta {
  total:    number
  page:     number
  limit:    number
  lastPage: number
}

export interface DokumenPengajaranListResponse {
  data: DokumenPengajaranItem[]
  meta: DokumenPengajaranMeta
}

export interface DokumenPengajaranQueryParams {
  page?:            number
  limit?:           number
  guruId?:          string
  semesterId?:      string
  tahunAjaranId?:   string
  tingkatKelasId?:  string
  kelasId?:         string
  jenisDokumen?:    JenisDokumen
  status?:          StatusDokumenPengajaran
  isSemesterAktif?: boolean
}

// ── Bulk Add ──────────────────────────────────────────────────
export interface BulkAddDocumentItem {
  judul:        string
  jenisDokumen: JenisDokumen
  fileUrl:      string
}

export interface BulkAddPayload {
  guruId?:               string
  documents:             BulkAddDocumentItem[]
  targetMataPelajaranIds: string[]
}

export interface BulkAddResponse {
  message:      string
  totalDibuat:  number
}

export interface BulkRolloverPayload {
  sumberMataPelajaranId:  string
  targetMataPelajaranIds: string[]
}

export interface BulkRolloverResponse {
  message:          string
  totalDataDibuat:  number
}

export interface CheckTargetsSourceDoc {
  judul: string
  jenis: string
}

export interface CheckTargetsSource {
  mataPelajaranId: string
  totalDocuments:  number
  documentList:    CheckTargetsSourceDoc[]
}

export interface CheckTargetsTarget {
  mataPelajaranId: string
  namaKelas:       string
  status:          'EMPTY' | 'PARTIAL' | 'COMPLETE'
  alreadyHas:      string[]
  missing:         string[]
  canCopy:         number
}

export interface CheckTargetsResponse {
  source:  CheckTargetsSource
  targets: CheckTargetsTarget[]
}
