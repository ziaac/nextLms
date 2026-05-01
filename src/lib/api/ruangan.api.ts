import api from '@/lib/axios'
import type { Ruangan, CreateRuanganDto, UpdateRuanganDto } from '@/types/ruangan.types'

const BASE = '/ruangan'

export const ruanganApi = {
  getAll: async (): Promise<Ruangan[]> => {
    const res = await api.get<Ruangan[] | { data: Ruangan[] }>(BASE)
    return Array.isArray(res.data)
      ? res.data
      : (res.data as { data: Ruangan[] }).data ?? []
  },
  create: async (dto: CreateRuanganDto): Promise<Ruangan> => {
    const res = await api.post<Ruangan>(BASE, dto)
    return res.data
  },
  update: async (id: string, dto: UpdateRuanganDto): Promise<Ruangan> => {
    const res = await api.put<Ruangan>(`${BASE}/${id}`, dto)
    return res.data
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`)
  },
}
