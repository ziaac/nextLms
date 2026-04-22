import api from '@/lib/axios'
import type {
  MataPelajaran,
  PaginatedResponse,
  CreateMataPelajaranPayload,
  UpdateMataPelajaranPayload,
  FilterMataPelajaranParams,
  BulkPerKelasPreviewPayload,
  BulkPerKelasPreviewResponse,
  BulkPerKelasExecutePayload,
  BulkPerKelasExecuteResponse,
} from '@/types/akademik.types'

const BASE = '/mata-pelajaran'

export const mataPelajaranApi = {
  // GET /mata-pelajaran — return wrapped { data, meta }
  getAll: async (params?: FilterMataPelajaranParams): Promise<PaginatedResponse<MataPelajaran>> => {
    const res = await api.get<PaginatedResponse<MataPelajaran>>(BASE, { params })
    return res.data
  },

  getOne: async (id: string): Promise<MataPelajaran> => {
    const res = await api.get<MataPelajaran>(`${BASE}/${id}`)
    return res.data
  },

  create: async (payload: CreateMataPelajaranPayload): Promise<MataPelajaran> => {
    const res = await api.post<MataPelajaran>(BASE, payload)
    return res.data
  },

  // PUT bukan PATCH
  update: async (id: string, payload: UpdateMataPelajaranPayload): Promise<MataPelajaran> => {
    const res = await api.put<MataPelajaran>(`${BASE}/${id}`, payload)
    return res.data
  },

  toggleActive: async (id: string): Promise<MataPelajaran> => {
    const res = await api.patch<MataPelajaran>(`${BASE}/${id}/toggle-active`, {})
    return res.data
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`)
  },

  bulkCopy: async (
    sourceSemesterId: string,
    targetSemesterId: string,
    kelasId?: string,
  ): Promise<{ message: string; count: number }> => {
    const res = await api.post(
      `${BASE}/bulk-copy`,
      {},
      { params: { sourceSemesterId, targetSemesterId, kelasId } },
    )
    return res.data
  },

  // Export nilai per mapel
  exportNilai: async (params: {
    kelasId:       string
    mataPelajaranId: string
    tahunAjaranId: string
  }): Promise<Blob> => {
    const res = await api.get('/report/export/nilai', {
      params,
      responseType: 'blob',
    })
    return res.data
  },
  bulkPerKelasPreview: async (
    payload: BulkPerKelasPreviewPayload,
  ): Promise<BulkPerKelasPreviewResponse> => {
    const res = await api.post<BulkPerKelasPreviewResponse>(
      `${BASE}/perkelas-bulk/preview`,
      payload,
    )
    return res.data
  },

  bulkPerKelasExecute: async (
    payload: BulkPerKelasExecutePayload,
  ): Promise<BulkPerKelasExecuteResponse> => {
    const res = await api.post<BulkPerKelasExecuteResponse>(
      `${BASE}/perkelas-bulk`,
      payload,
    )
    return res.data
  },

}
