import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createMateri,
  getListMateri,
  getLatestMateri,
  getDetailMateri,
  updateMateri,
  publishToggleMateri,
  deleteMateri,
  bulkCopyMateri,
} from '@/lib/api/materi-pelajaran.api'
import type {
  MateriQueryParams,
  MateriPayload,
  BulkCopyMateriPayload,
} from '@/types/materi-pelajaran.types'

export const materiKeys = {
  all:    (params?: MateriQueryParams) => ['materi-pelajaran', 'list', params ?? {}] as const,
  latest: (params?: { page?: number; limit?: number }) => ['materi-pelajaran', 'latest', params ?? {}] as const,
  detail: (id: string) => ['materi-pelajaran', 'detail', id] as const,
}

export function useMateriList(params: MateriQueryParams | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: materiKeys.all(params),
    queryFn:  () => getListMateri(params ?? {}),
    staleTime: 0,
    enabled:   options?.enabled ?? true,
  })
}

export function useLatestMateri(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: materiKeys.latest(params),
    queryFn:  () => getLatestMateri(params),
    staleTime: 0,
  })
}

export function useMateriDetail(id: string | null) {
  return useQuery({
    queryKey: materiKeys.detail(id ?? ''),
    queryFn:  () => getDetailMateri(id!),
    enabled:  !!id,
    staleTime: 0,
  })
}

export function useCreateMateri() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: MateriPayload) => createMateri(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['materi-pelajaran'] }),
  })
}

export function useUpdateMateri() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MateriPayload> }) =>
      updateMateri(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materi-pelajaran'] }),
  })
}

export function usePublishToggleMateri() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => publishToggleMateri(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['materi-pelajaran'] }),
  })
}

export function useDeleteMateri() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteMateri(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['materi-pelajaran'] }),
  })
}

export function useBulkCopyMateri() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: BulkCopyMateriPayload) => bulkCopyMateri(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['materi-pelajaran'] }),
  })
}
