export type JenisSikap = 'POSITIF' | 'NEGATIF'

export interface MasterSikap {
  id: string
  jenis: JenisSikap
  kode: string
  nama: string
  uraian: string
  point: number
  level: number
  kategori?: string | null
  sanksi?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: { catatanSikap: number }
}

export interface MasterSikapSummary {
  total: number
  positif: number
  negatif: number
  totalActive: number
}

export interface CreateMasterSikapPayload {
  jenis: JenisSikap
  kode: string
  nama: string
  uraian: string
  point: number
  level?: number
  kategori?: string
  sanksi?: string
  isActive?: boolean
}

export type UpdateMasterSikapPayload = Partial<CreateMasterSikapPayload>

export interface MasterSikapQuery {
  page?: number
  limit?: number
  jenis?: JenisSikap | ''
  kategori?: string
  isActive?: boolean
  search?: string
}
