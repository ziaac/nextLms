import api from '@/lib/axios'
import type {
  PerizinanPayload,
  PerizinanItem,
  PerizinanListResponse,
  PerizinanApprovalPayload,
  PerizinanRevisiPayload,
  PerizinanQueryParams,
} from '@/types'

export const ajukanPerizinan = (payload: PerizinanPayload) =>
  api.post<PerizinanItem>('/perizinan', payload).then((r) => r.data)

export const getListPerizinan = (params: PerizinanQueryParams) =>
  api
    .get<PerizinanListResponse>('/perizinan', { params })
    .then((r) => r.data)

export const getDetailPerizinan = (id: string) =>
  api.get<PerizinanItem>(`/perizinan/${id}`).then((r) => r.data)

export const revisiPerizinan = (id: string, payload: PerizinanRevisiPayload) =>
  api.patch<PerizinanItem>(`/perizinan/${id}`, payload).then((r) => r.data)

export const approvalPerizinan = (
  id: string,
  payload: PerizinanApprovalPayload,
) =>
  api
    .patch<PerizinanItem>(`/perizinan/${id}/approval`, payload)
    .then((r) => r.data)

export const hapusPerizinan = (id: string) =>
  api
    .delete<{ message: string }>(`/perizinan/${id}`)
    .then((r) => r.data)

export const akhiriPerizinanLebihAwal = (id: string) =>
  api
    .post<{ message: string; sisaHariDihapus: number }>(`/perizinan/${id}/akhiri-lebih-awal`)
    .then((r) => r.data)
