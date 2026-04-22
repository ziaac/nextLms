import api from '@/lib/axios'
import type {
  TingkatKelas,
  CreateTingkatKelasPayload,
  UpdateTingkatKelasPayload,
} from '@/types/akademik.types'

const BASE = '/tingkat-kelas'

export const tingkatKelasApi = {
  getAll: async (): Promise<TingkatKelas[]> => {
    const res = await api.get<TingkatKelas[]>(BASE)
    return res.data
  },

  getOne: async (id: string): Promise<TingkatKelas> => {
    const res = await api.get<TingkatKelas>(`${BASE}/${id}`)
    return res.data
  },

  create: async (payload: CreateTingkatKelasPayload): Promise<TingkatKelas> => {
    const res = await api.post<TingkatKelas>(BASE, payload)
    return res.data
  },

  /** PUT bukan PATCH — sesuai controller */
  update: async (id: string, payload: UpdateTingkatKelasPayload): Promise<TingkatKelas> => {
    const res = await api.put<TingkatKelas>(`${BASE}/${id}`, payload)
    return res.data
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`)
  },
}
