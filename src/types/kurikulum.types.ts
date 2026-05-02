// ============================================================
// kurikulum.types.ts
// ============================================================

export type FormatTipe = 'RICHTEXT' | 'PDF_TEMPLATE'
export type JenisFormatBaku = 'RPP' | 'MATERI_PELAJARAN' | 'ASESMEN'

export interface StrukturFieldItem {
  key:          string
  label:        string
  tipe:         'text' | 'richtext' | 'list' | 'table'
  required:     boolean
  urutan:       number
  placeholder?: string
  hint?:        string
}

export interface FormatBaku {
  id:             string
  kurikulumId:    string
  jenisFormat:    JenisFormatBaku
  formatTipe:     FormatTipe
  strukturField?: StrukturFieldItem[] | null
  pdfTemplateKey?: string | null
  createdAt:      string
  updatedAt:      string
}

export interface Kurikulum {
  id:          string
  nama:        string
  deskripsi?:  string | null
  isActive:    boolean
  createdAt:   string
  updatedAt:   string
  formatBaku?: FormatBaku[]
}

// ── Payloads ──────────────────────────────────────────────────
export interface CreateKurikulumDto {
  nama:        string
  deskripsi?:  string
  isActive?:   boolean
}

export type UpdateKurikulumDto = Partial<CreateKurikulumDto>

export interface CreateFormatBakuDto {
  jenisFormat:     JenisFormatBaku
  formatTipe:      FormatTipe
  strukturField?:  StrukturFieldItem[]
  pdfTemplateKey?: string
}

// ── List response ─────────────────────────────────────────────
export interface KurikulumListResponse {
  data: Kurikulum[]
}
