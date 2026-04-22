import api from '@/lib/axios'
import type {
  Semester,
  CreateSemesterPayload,
  UpdateSemesterPayload,
} from '@/types/tahun-ajaran.types'

const BASE = '/semester'

export const semesterApi = {
  /** GET /semester?tahunAjaranId=xxx — list semester per tahun ajaran */
  getByTahunAjaran: async (tahunAjaranId: string): Promise<Semester[]> => {
    const res = await api.get<Semester[]>(BASE, { params: { tahunAjaranId } })
    return res.data
  },

  /** GET /semester/aktif — semua semester aktif */
  getAllActive: async (): Promise<Semester[]> => {
    const res = await api.get<Semester[]>(`${BASE}/aktif`)
    return res.data
  },

  /** GET /semester/:id */
  getOne: async (id: string): Promise<Semester> => {
    const res = await api.get<Semester>(`${BASE}/${id}`)
    return res.data
  },

  /** POST /semester */
  create: async (payload: CreateSemesterPayload): Promise<Semester> => {
    const res = await api.post<Semester>(BASE, payload)
    return res.data
  },

  /** PATCH /semester/:id */
  update: async (id: string, payload: UpdateSemesterPayload): Promise<Semester> => {
    const res = await api.patch<Semester>(`${BASE}/${id}`, payload)
    return res.data
  },

  /** PATCH /semester/:id/toggle-active */
  toggleActive: async (id: string): Promise<Semester> => {
    // Kirim empty body {} agar Fastify tidak return 415 Unsupported Media Type
    const res = await api.patch<Semester>(`${BASE}/${id}/toggle-active`, {})
    return res.data
  },

  /** DELETE /semester/:id */
  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`)
  },
}
