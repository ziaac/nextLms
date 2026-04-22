import api from '@/lib/axios'
import type {
  DokumenPengajaranPayload,
  DokumenPengajaranItem,
  DokumenPengajaranListResponse,
  DokumenPengajaranReviewPayload,
  DokumenPengajaranQueryParams,
  BulkAddPayload,
  BulkAddResponse,
  BulkRolloverPayload,
  BulkRolloverResponse,
  CheckTargetsResponse,
} from '@/types/dokumen-pengajaran.types'

export const createDokumenPengajaran = (payload: DokumenPengajaranPayload) =>
  api.post<DokumenPengajaranItem>('/dokumen-pengajaran', payload).then((r) => r.data)

export const getListDokumenPengajaran = (params: DokumenPengajaranQueryParams) =>
  api.get<DokumenPengajaranListResponse>('/dokumen-pengajaran', { params }).then((r) => r.data)

export const getDetailDokumenPengajaran = (id: string) =>
  api.get<DokumenPengajaranItem>(`/dokumen-pengajaran/${id}`).then((r) => r.data)

export const reviewDokumenPengajaran = (id: string, payload: DokumenPengajaranReviewPayload) =>
  api.patch<DokumenPengajaranItem>(`/dokumen-pengajaran/${id}/review`, payload).then((r) => r.data)

export const updateDokumenPengajaran = (id: string, payload: Partial<DokumenPengajaranPayload>) =>
  api.patch<DokumenPengajaranItem>(`/dokumen-pengajaran/${id}`, payload).then((r) => r.data)

export const hapusDokumenPengajaran = (id: string) =>
  api.delete<{ message: string }>(`/dokumen-pengajaran/${id}`).then((r) => r.data)

export const bulkAddDokumen = (payload: BulkAddPayload) =>
  api.post<BulkAddResponse>('/dokumen-pengajaran/bulk', payload).then((r) => r.data)

export const bulkRolloverDokumen = (payload: BulkRolloverPayload) =>
  api.post<BulkRolloverResponse>('/dokumen-pengajaran/bulk-rollover', payload).then((r) => r.data)

export const checkTargetsDokumen = (sourceId: string, targetIds: string[]) =>
  api.get<CheckTargetsResponse>('/dokumen-pengajaran/check-targets', {
    params: { sourceId, 'targetIds[]': targetIds },
  }).then((r) => r.data)
