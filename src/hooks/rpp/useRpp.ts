import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getRppList,
  getRppDetail,
  createRpp,
  updateRpp,
  publishRpp,
  deleteRpp,
} from '@/lib/api/rpp.api'
import type { CreateRppDto, UpdateRppDto, RppFilterParams } from '@/types/rpp.types'
import { rppKeys } from './rpp.keys'

export function useRppList(filter: RppFilterParams = {}) {
  return useQuery({
    queryKey: rppKeys.list(filter),
    queryFn:  () => getRppList(filter),
    staleTime: 0,
  })
}

export function useRppDetail(id: string | null) {
  return useQuery({
    queryKey: rppKeys.detail(id ?? ''),
    queryFn:  () => getRppDetail(id!),
    enabled:  !!id,
    staleTime: 0,
  })
}

export function useCreateRpp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateRppDto) => createRpp(dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: rppKeys.all }),
  })
}

export function useUpdateRpp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRppDto }) => updateRpp(id, dto),
    onSuccess:  (_data, { id }) => {
      qc.invalidateQueries({ queryKey: rppKeys.all })
      qc.invalidateQueries({ queryKey: rppKeys.detail(id) })
    },
  })
}

export function usePublishRpp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => publishRpp(id),
    onSuccess:  (_data, id) => {
      qc.invalidateQueries({ queryKey: rppKeys.all })
      qc.invalidateQueries({ queryKey: rppKeys.detail(id) })
    },
  })
}

export function useDeleteRpp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRpp(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: rppKeys.all }),
  })
}
