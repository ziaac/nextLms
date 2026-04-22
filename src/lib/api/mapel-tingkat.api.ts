import api from '@/lib/axios'
import type {
  MataPelajaranTingkat,
  CreateMapelTingkatPayload,
  SetGuruPoolPayload,
} from '@/types/akademik.types'

const BASE = '/mata-pelajaran-tingkat'

export const mapelTingkatApi = {
  /** GET ?tingkatKelasId=xxx */
  getByTingkat: async (tingkatKelasId: string): Promise<MataPelajaranTingkat[]> => {
    const res = await api.get<MataPelajaranTingkat[]>(BASE, { params: { tingkatKelasId } })
    return res.data
  },

  /** GET ?masterMapelId=xxx — pakai masterMapelId bukan mataPelajaranId */
  getByMasterMapel: async (masterMapelId: string): Promise<MataPelajaranTingkat[]> => {
    const res = await api.get<MataPelajaranTingkat[]>(BASE, { params: { masterMapelId } })
    return res.data
  },

  getOne: async (id: string): Promise<MataPelajaranTingkat> => {
    const res = await api.get<MataPelajaranTingkat>(`${BASE}/${id}`)
    return res.data
  },

  /** POST — body: { masterMapelId, tingkatKelasId } */
  create: async (payload: CreateMapelTingkatPayload): Promise<MataPelajaranTingkat> => {
    const res = await api.post<MataPelajaranTingkat>(BASE, payload)
    return res.data
  },

  /** PUT /:id/guru — replace seluruh pool guru */
  setGuruPool: async (id: string, payload: SetGuruPoolPayload): Promise<MataPelajaranTingkat> => {
    const res = await api.put<MataPelajaranTingkat>(`${BASE}/${id}/guru`, payload)
    return res.data
  },

  /** POST /:id/guru/:guruId — tambah satu guru */
  addGuru: async (id: string, guruId: string): Promise<void> => {
    await api.post(`${BASE}/${id}/guru/${guruId}`)
  },

  /** DELETE /:id/guru/:guruId — hapus satu guru */
  removeGuru: async (id: string, guruId: string): Promise<void> => {
    await api.delete(`${BASE}/${id}/guru/${guruId}`)
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`)
  },
}
