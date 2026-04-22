// ============================================================
// FASE 7B — Tahun Ajaran & Semester Types
// ============================================================

export type NamaSemester = 'GANJIL' | 'GENAP'

// ── Tahun Ajaran ─────────────────────────────────────────────
export interface TahunAjaran {
  id: string
  nama: string
  tanggalMulai: string
  tanggalSelesai: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTahunAjaranPayload {
  nama: string
  tanggalMulai: string
  tanggalSelesai: string
  isActive?: boolean
}

export interface UpdateTahunAjaranPayload extends Partial<CreateTahunAjaranPayload> {}

// ── Semester ──────────────────────────────────────────────────
export interface Semester {
  id: string
  tahunAjaranId: string
  nama: NamaSemester
  urutan: number
  tanggalMulai: string
  tanggalSelesai: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  /** Disertakan oleh findByTahunAjaran — jumlah relasi terkait */
  _count?: {
    jadwalPelajaran: number
    penilaian: number
  }
}

export interface CreateSemesterPayload {
  tahunAjaranId: string
  nama: NamaSemester
  urutan: number
  tanggalMulai: string
  tanggalSelesai: string
  isActive?: boolean
}

export interface UpdateSemesterPayload extends Partial<Omit<CreateSemesterPayload, 'tahunAjaranId'>> {}
