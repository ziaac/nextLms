import api from '@/lib/axios'
import type { RosterKelasResponse, RosterGuruResponse } from '@/types/jadwal.types'
import type { NamaSemester } from '@/types/tahun-ajaran.types'

// ── Response shapes ───────────────────────────────────────────
export interface PublikSemester {
  id:          string
  nama:        NamaSemester
  urutan:      number
  isActive:    boolean
  tahunAjaran: { id: string; nama: string; isActive: boolean }
}

export interface PublikTingkat {
  id:     string
  nama:   string
  jenjang: string
  urutan: number
}

export interface PublikGuru {
  id:          string
  namaLengkap: string
  nip:         string | null
}

export interface PublikKelas {
  id:             string
  namaKelas:      string
  tingkatKelasId: string
  tingkatKelas:   { nama: string; urutan: number }
}

export interface PublikTingkatGuruData {
  tingkat: PublikTingkat[]
  guru:    PublikGuru[]
}

// ── API ───────────────────────────────────────────────────────
export const jadwalPublikApi = {
  getSemesterAktif: (): Promise<PublikSemester[]> =>
    api.get('/jadwal-pelajaran/publik/semester-aktif').then((r) => r.data),

  getTingkatGuru: (): Promise<PublikTingkatGuruData> =>
    api.get('/jadwal-pelajaran/publik/tingkat-guru').then((r) => r.data),

  getKelas: (tingkatKelasId?: string): Promise<PublikKelas[]> =>
    api.get('/jadwal-pelajaran/publik/kelas', {
      params: tingkatKelasId ? { tingkatKelasId } : {},
    }).then((r) => r.data),

  getRosterKelas: (kelasId: string, semesterId: string): Promise<RosterKelasResponse> =>
    api.get('/roster/publik/kelas', { params: { kelasId, semesterId } }).then((r) => r.data),

  getRosterGuru: (guruId: string, semesterId: string): Promise<RosterGuruResponse> =>
    api.get('/roster/publik/guru', { params: { guruId, semesterId } }).then((r) => r.data),
}
