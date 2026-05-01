import api from '@/lib/axios'
import type {
  MasterSikap,
  MasterSikapSummary,
  CreateMasterSikapPayload,
  UpdateMasterSikapPayload,
  MasterSikapQuery,
} from '@/types/master-sikap.types'
import type { PaginatedResponse } from '@/types'

const BASE = '/master-sikap'

export const masterSikapApi = {
  getAll: async (params?: MasterSikapQuery): Promise<PaginatedResponse<MasterSikap>> => {
    const { data } = await api.get(BASE, { params })
    return data
  },

  getOne: async (id: string): Promise<MasterSikap> => {
    const { data } = await api.get(`${BASE}/${id}`)
    return data
  },

  getSummary: async (): Promise<MasterSikapSummary> => {
    const { data } = await api.get(`${BASE}/summary`)
    return data
  },

  create: async (payload: CreateMasterSikapPayload): Promise<MasterSikap> => {
    const { data } = await api.post(BASE, payload)
    return data
  },

  update: async (id: string, payload: UpdateMasterSikapPayload): Promise<MasterSikap> => {
    const { data } = await api.patch(`${BASE}/${id}`, payload)
    return data
  },

  toggleActive: async (id: string): Promise<MasterSikap> => {
    const { data } = await api.patch(`${BASE}/${id}/toggle-active`)
    return data
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`${BASE}/${id}`)
    return data
  },
}
