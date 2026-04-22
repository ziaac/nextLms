import api from '@/lib/axios'
import type {
  TahunAjaran,
  CreateTahunAjaranPayload,
  UpdateTahunAjaranPayload,
} from '@/types/tahun-ajaran.types'

const BASE = '/tahun-ajaran'

export const tahunAjaranApi = {
  /** GET /tahun-ajaran — semua tahun ajaran */
  getAll: async (): Promise<TahunAjaran[]> => {
    const res = await api.get<TahunAjaran[]>(BASE)
    return res.data
  },

  /** GET /tahun-ajaran/aktif — semua yang aktif (bisa multiple) */
  getAllActive: async (): Promise<TahunAjaran[]> => {
    const res = await api.get<TahunAjaran[]>(`${BASE}/aktif`)
    return res.data
  },

  /** GET /tahun-ajaran/aktif/terkini — satu aktif terbaru */
  getOneActive: async (): Promise<TahunAjaran> => {
    const res = await api.get<TahunAjaran>(`${BASE}/aktif/terkini`)
    return res.data
  },

  /** GET /tahun-ajaran/:id */
  getOne: async (id: string): Promise<TahunAjaran> => {
    const res = await api.get<TahunAjaran>(`${BASE}/${id}`)
    return res.data
  },

  /** POST /tahun-ajaran */
  create: async (payload: CreateTahunAjaranPayload): Promise<TahunAjaran> => {
    const res = await api.post<TahunAjaran>(BASE, payload)
    return res.data
  },

  /** PATCH /tahun-ajaran/:id */
  update: async (id: string, payload: UpdateTahunAjaranPayload): Promise<TahunAjaran> => {
    const res = await api.patch<TahunAjaran>(`${BASE}/${id}`, payload)
    return res.data
  },

  /** PATCH /tahun-ajaran/:id/toggle-active */
  toggleActive: async (id: string): Promise<TahunAjaran> => {
    // Kirim empty body {} agar Fastify tidak return 415 Unsupported Media Type
    const res = await api.patch<TahunAjaran>(`${BASE}/${id}/toggle-active`, {})
    return res.data
  },

  /** PATCH /tahun-ajaran/:id/set-active-single */
  setActiveSingle: async (id: string): Promise<TahunAjaran> => {
    // Kirim empty body {} agar Fastify tidak return 415 Unsupported Media Type
    const res = await api.patch<TahunAjaran>(`${BASE}/${id}/set-active-single`, {})
    return res.data
  },

  /** DELETE /tahun-ajaran/:id */
  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`)
  },
}
