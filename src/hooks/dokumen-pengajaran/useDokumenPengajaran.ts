import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createDokumenPengajaran,
  updateDokumenPengajaran,
  getListDokumenPengajaran,
  getDetailDokumenPengajaran,
  reviewDokumenPengajaran,
  hapusDokumenPengajaran,
  bulkAddDokumen,
  bulkRolloverDokumen,
} from '@/lib/api/dokumen-pengajaran.api'
import type {
  DokumenPengajaranQueryParams,
  DokumenPengajaranPayload,
  DokumenPengajaranReviewPayload,
  BulkAddPayload,
  BulkRolloverPayload,
} from '@/types/dokumen-pengajaran.types'

export const dokumenPengajaranKeys = {
  list:   (params: DokumenPengajaranQueryParams) => ['dokumen-pengajaran', 'list', params] as const,
  detail: (id: string)                            => ['dokumen-pengajaran', 'detail', id]   as const,
}

export function useDokumenPengajaranList(
  params: DokumenPengajaranQueryParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:  dokumenPengajaranKeys.list(params),
    queryFn:   () => getListDokumenPengajaran(params),
    staleTime: 0,
    ...options,
  })
}

export function useDokumenPengajaranDetail(id: string | null) {
  return useQuery({
    queryKey: dokumenPengajaranKeys.detail(id ?? ''),
    queryFn:  () => getDetailDokumenPengajaran(id!),
    enabled:  !!id,
    staleTime: 0,
  })
}

export function useCreateDokumenPengajaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: DokumenPengajaranPayload) => createDokumenPengajaran(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['dokumen-pengajaran'] }),
  })
}

export function useUpdateDokumenPengajaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<DokumenPengajaranPayload> }) =>
      updateDokumenPengajaran(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dokumen-pengajaran'] }),
  })
}

export function useReviewDokumenPengajaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DokumenPengajaranReviewPayload }) =>
      reviewDokumenPengajaran(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dokumen-pengajaran'] }),
  })
}

export function useHapusDokumenPengajaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => hapusDokumenPengajaran(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['dokumen-pengajaran'] }),
  })
}

export function useBulkAddDokumen() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: BulkAddPayload) => bulkAddDokumen(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['dokumen-pengajaran'] }),
  })
}

export function useBulkRolloverDokumen() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: BulkRolloverPayload) => bulkRolloverDokumen(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['dokumen-pengajaran'] }),
  })
}
