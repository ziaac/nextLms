import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterSikapApi } from '@/lib/api/master-sikap.api'
import type { MasterSikapQuery, CreateMasterSikapPayload, UpdateMasterSikapPayload } from '@/types/master-sikap.types'

const KEY = 'master-sikap'

export function useMasterSikapList(params?: MasterSikapQuery) {
  return useQuery({
    queryKey: [KEY, 'list', params],
    queryFn: () => masterSikapApi.getAll(params),
  })
}

export function useMasterSikapSummary() {
  return useQuery({
    queryKey: [KEY, 'summary'],
    queryFn: () => masterSikapApi.getSummary(),
  })
}

export function useCreateMasterSikap() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMasterSikapPayload) => masterSikapApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateMasterSikap() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMasterSikapPayload }) =>
      masterSikapApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useToggleMasterSikap() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => masterSikapApi.toggleActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useDeleteMasterSikap() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => masterSikapApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}
