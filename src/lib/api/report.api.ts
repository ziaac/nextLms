import api from '@/lib/axios'
import type {
  StatistikGuruResponse,
  SiswaOverviewResponse,
  AnakOrangTua,
  TodoSiswaResponse,
  TodoGuruResponse,
  MapelOverviewItem,
} from '@/types/akademik.types'

export type EisGroupBy = 'week' | 'month' | 'semester' | 'year'

export interface ReportEisOverviewParams {
  tahunAjaranId: string
  semesterId?: string
  tingkatKelasId?: string
  groupBy?: EisGroupBy
  from?: string
  to?: string
}

export interface ReportEisOverviewResponse {
  scope: {
    tahunAjaranId: string
    semesterId: string
    tingkatKelasId: string | null
    groupBy: EisGroupBy
    from: string
    to: string
  }
  cards: {
    totalKelas: number
    totalSiswa: number
    totalGuru: number
    totalMapel: number
    sesiDibuka: number
    persentaseHadir: number
    totalMateri: number
    totalTugas: number
  }
  series: {
    absensi: Array<{
      bucketStart: string
      bucketLabel: string
      totalAbsensi: number
      totalHadir: number
      totalTerlambat: number
      totalIzin: number
      totalSakit: number
      totalAlpa: number
      persentaseHadir: number
    }>
    materi: Array<{
      bucketStart: string
      bucketLabel: string
      totalMateriPublished: number
    }>
    tugas: Array<{
      bucketStart: string
      bucketLabel: string
      totalTugasPublished: number
      totalPengumpulan: number
      totalSlot: number
      persentaseSubmit: number
    }>
  }
  latest: {
    tugas: Array<{
      id: string
      judul: string
      kelas: string
      mapel: string
      tanggalSelesai: string
    }>
    materi: Array<{
      id: string
      judul: string
      kelas: string
      mapel: string
      tanggalPublikasi: string | null
    }>
  }
}

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
   * GET /report/eis/overview
   * Dashboard manajemen: cards + series (absensi/materi/tugas) + latest list.
   */
  getEisOverview: async (params: ReportEisOverviewParams): Promise<ReportEisOverviewResponse> => {
    const res = await api.get<ReportEisOverviewResponse>('/report/eis/overview', { params })
    return res.data
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
