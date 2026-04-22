import api from '@/lib/axios'
import type {
  StatistikGuruResponse,
  SiswaOverviewResponse,
  AnakOrangTua,
  TodoSiswaResponse,
  TodoGuruResponse,
  MapelOverviewItem,
} from '@/types/akademik.types'

// ── Params ────────────────────────────────────────────────────

export interface ReportGuruParams {
  tahunAjaranId:    string
  semesterId:       string
  mataPelajaranId?: string
  bulan?:           number
  tahun?:           number
}

export interface ReportSiswaParams {
  tahunAjaranId: string
  semesterId?:   string
  siswaId?:      string
}

export interface TodoSiswaParams {
  tahunAjaranId:    string
  mataPelajaranId?: string
  siswaId?:         string  // untuk manajemen lihat todo siswa tertentu
}

export interface TodoGuruParams {
  mataPelajaranId?: string
  guruId?:          string  // untuk manajemen/kepsek lihat todo guru tertentu
}

// ── API Functions ─────────────────────────────────────────────

export const reportApi = {
  /**
   * GET /report/guru/saya
   * Statistik guru: jadwal, tugas, nilai, absensi
   */
  getGuruSaya: async (params: ReportGuruParams): Promise<StatistikGuruResponse> => {
    const res = await api.get<StatistikGuruResponse>('/report/guru/saya', { params })
    return res.data
  },

  /**
   * GET /report/siswa/overview
   * Overview mata pelajaran siswa beserta stat per mapel
   */
  getSiswaOverview: async (params: ReportSiswaParams): Promise<SiswaOverviewResponse> => {
    const res = await api.get<SiswaOverviewResponse>('/report/siswa/overview', { params })
    return res.data
  },

  /**
   * GET /report/siswa/todo
   * Todo siswa: tugas pending + absensi pending
   * Bisa difilter per mataPelajaranId dan/atau siswaId
   */
  getSiswaTodo: async (params: TodoSiswaParams): Promise<TodoSiswaResponse> => {
    const res = await api.get<TodoSiswaResponse>('/report/siswa/todo', { params })
    return res.data
  },

  /**
   * GET /report/guru/todo
   * Todo guru: tugas menunggu penilaian + jadwal hari ini
   * Bisa difilter per mataPelajaranId dan/atau guruId
   */
  getGuruTodo: async (params: TodoGuruParams): Promise<TodoGuruResponse> => {
    const res = await api.get<TodoGuruResponse>('/report/guru/todo', { params })
    return res.data
  },

  /**
   * GET /report/mapel/overview
   * Overview performa per mapel per kelas
   * Return array — filter by mataPelajaranId di frontend
   */
  getMapelOverview: async (params: {
    tahunAjaranId: string
    kelasId?:      string
    semesterId?:   string
  }): Promise<MapelOverviewItem[]> => {
    const res = await api.get<MapelOverviewItem[]>('/report/mapel/overview', { params })
    return res.data ?? []
  },

  /**
   * GET /orang-tua/anak
   * Data anak dari orang tua yang login
   */
  getAnakOrangTua: async (): Promise<AnakOrangTua[]> => {
    const res = await api.get<AnakOrangTua[]>('/orang-tua/anak')
    return res.data
  },
}
