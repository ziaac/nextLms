// ============================================================
// ai-generator.types.ts
// ============================================================

export type ProviderAI = 'GEMINI' | 'OPENAI' | 'QWEN' | 'DEEPSEEK' | 'OPENROUTER'
export type JenisKontenAI = 'RPP' | 'MATERI_PELAJARAN' | 'TUGAS'
export type StatusDraftAI = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SAVED'

// ── Konten shapes per jenis ───────────────────────────────────
export type KontenRPP = Record<string, string | string[] | object>

export interface KontenMateri {
  judul:               string
  deskripsi:           string
  konten:              string   // richtext HTML
  tujuanPembelajaran:  string
  kompetensiDasar?:    string
}

export interface KontenTugas {
  judul:       string
  deskripsi:   string
  instruksi:   string           // richtext HTML
  soalKuis?:   Array<{
    pertanyaan: string
    tipe:       'MULTIPLE_CHOICE' | 'ESSAY'
    bobot:      number
    urutan:     number
    opsi?:      Array<{ teks: string; isCorrect: boolean; urutan: number }>
  }>
}

// ── Draft AI shapes ───────────────────────────────────────────
export interface DraftAIListItem {
  id:               string
  jenisKonten:      JenisKontenAI
  status:           StatusDraftAI
  judul:            string
  topik:            string
  provider?:        ProviderAI | null
  modelId?:         string | null
  tokenUsed?:       number | null
  errorMessage?:    string | null
  savedContentId?:  string | null
  savedContentType?: JenisKontenAI | null
  generatedAt?:     string | null
  expiresAt:        string
  createdAt:        string
  updatedAt:        string
}

export interface DraftAI extends DraftAIListItem {
  guruId:                string
  kurikulumId?:          string | null
  tahunAjaranId:         string
  semesterId:            string
  tingkatKelasId:        string
  mataPelajaranTingkatId: string
  promptTambahan?:       string | null
  dokumenPengajaranIds:  string[]
  konten?:               KontenRPP | KontenMateri | KontenTugas | null
  tahunAjaran?:          { nama: string }
  semester?:             { nama: string }
  tingkatKelas?:         { nama: string }
  mataPelajaranTingkat?: { masterMapel?: { nama: string } }
}

// ── Payloads ──────────────────────────────────────────────────
export interface InitiateGenerateDto {
  jenisKonten:           JenisKontenAI
  tahunAjaranId:         string
  semesterId:            string
  tingkatKelasId:        string
  mataPelajaranTingkatId: string
  judul:                 string
  topik:                 string
  promptTambahan?:       string
  dokumenPengajaranIds?: string[]
  provider?:             ProviderAI
  modelId?:              string
  /** BYOA — tidak disimpan ke DB */
  apiKey?:               string
}

export interface RetryDraftDto {
  provider: ProviderAI
  /** BYOA — tidak disimpan ke DB */
  apiKey?:  string
}

export interface SaveDraftDto {
  kontenEdited:    Record<string, unknown>
  mataPelajaranId: string
  kelasId?:        string
}

// ── Query params ──────────────────────────────────────────────
export interface DraftFilterParams {
  jenisKonten?: JenisKontenAI
  status?:      StatusDraftAI
  page?:        number
  limit?:       number
}

// ── List response ─────────────────────────────────────────────
export interface DraftListMeta {
  total:      number
  page:       number
  limit:      number
  totalPages: number
}

export interface DraftListResponse {
  data: DraftAIListItem[]
  meta: DraftListMeta
}

// ── Initiate response ─────────────────────────────────────────
export interface InitiateGenerateResponse {
  draftId: string
  status:  'PENDING'
}

// ── Save response ─────────────────────────────────────────────
export interface SaveDraftResponse {
  savedContentId: string
  type:           JenisKontenAI
}
