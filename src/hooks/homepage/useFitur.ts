'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fiturApi } from '@/lib/api/homepage.api'
import type { CreateFiturDto, UpdateFiturDto, ReorderItem } from '@/types/homepage.types'

export const fiturKeys = {
  list: (onlyActive?: boolean) => ['homepage', 'fitur', { onlyActive }] as const,
}

export function useFiturList(onlyActive = false) {
  return useQuery({
    queryKey: fiturKeys.list(onlyActive),
    queryFn:  () => fiturApi.list(onlyActive),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateFitur() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateFiturDto) => fiturApi.create(dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['homepage', 'fitur'] }),
  })
}

export function useUpdateFitur() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFiturDto }) =>
      fiturApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['homepage', 'fitur'] }),
  })
}

export function useReorderFitur() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (items: ReorderItem[]) => fiturApi.reorder(items),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['homepage', 'fitur'] }),
  })
}

export function useDeleteFitur() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fiturApi.remove(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['homepage', 'fitur'] }),
  })
}
