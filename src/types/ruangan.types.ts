// ── Ruangan ───────────────────────────────────────────────────
export type JenisRuangan = 'KELAS' | 'LAB' | 'AULA' | 'KANTOR' | 'LAINNYA'

export interface Ruangan {
  id:        string
  kode:      string
  nama:      string
  kapasitas: number
  jenis:     JenisRuangan
  isActive:  boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateRuanganDto {
  kode:      string
  nama:      string
  kapasitas: number
  jenis:     JenisRuangan
  isActive?: boolean
}

export type UpdateRuanganDto = Partial<CreateRuanganDto>
