import api from '@/lib/axios'
import type {
  MateriPayload,
  MateriItem,
  MateriListResponse,
  MateriQueryParams,
  BulkCopyMateriPayload,
  BulkCopyMateriResponse,
} from '@/types/materi-pelajaran.types'

const BASE = '/materi-pelajaran'

export const createMateri = (payload: MateriPayload) =>
  api.post<MateriItem>(BASE, payload).then((r) => r.data)

export const getListMateri = (params: MateriQueryParams) =>
  api.get<MateriListResponse>(BASE, { params }).then((r) => r.data)

export const getLatestMateri = (params?: { page?: number; limit?: number }) =>
  api.get<MateriListResponse>(`${BASE}/latest`, { params }).then((r) => r.data)

export const getDetailMateri = (id: string) =>
  api.get<MateriItem>(`${BASE}/${id}`).then((r) => r.data)

export const updateMateri = (id: string, payload: Partial<MateriPayload>) =>
  api.put<MateriItem>(`${BASE}/${id}`, payload).then((r) => r.data)

export const publishToggleMateri = (id: string) =>
  api.patch<MateriItem>(`${BASE}/${id}/publish`).then((r) => r.data)

export const deleteMateri = (id: string) =>
  api.delete<{ message: string }>(`${BASE}/${id}`).then((r) => r.data)

export const bulkCopyMateri = (payload: BulkCopyMateriPayload) =>
  api.post<BulkCopyMateriResponse>(`${BASE}/bulk-copy`, payload).then((r) => r.data)
