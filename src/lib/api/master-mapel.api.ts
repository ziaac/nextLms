import api from '@/lib/axios'
import type {
  MasterMapel,
  CreateMasterMapelPayload,
  UpdateMasterMapelPayload,
  FilterMasterMapelParams,
} from '@/types/akademik.types'

const BASE = '/master-mapel'

export const masterMapelApi = {
  getAll: async (params?: FilterMasterMapelParams): Promise<MasterMapel[]> => {
    const res = await api.get<MasterMapel[]>(BASE, { params })
    return res.data
  },

  getOne: async (id: string): Promise<MasterMapel> => {
    const res = await api.get<MasterMapel>(`${BASE}/${id}`)
    return res.data
  },

  create: async (payload: CreateMasterMapelPayload): Promise<MasterMapel> => {
    const res = await api.post<MasterMapel>(BASE, payload)
    return res.data
  },

  /** PUT bukan PATCH — sesuai controller */
  update: async (id: string, payload: UpdateMasterMapelPayload): Promise<MasterMapel> => {
    const res = await api.put<MasterMapel>(`${BASE}/${id}`, payload)
    return res.data
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`)
  },
}
