import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tahunAjaranApi } from '@/lib/api/tahun-ajaran.api'
import type { CreateTahunAjaranPayload, UpdateTahunAjaranPayload } from '@/types/tahun-ajaran.types'

// ── Query Keys ────────────────────────────────────────────────
export const tahunAjaranKeys = {
  all:       ['tahun-ajaran'] as const,
  active:    ['tahun-ajaran', 'aktif'] as const,
  oneActive: ['tahun-ajaran', 'aktif', 'terkini'] as const,
  detail:    (id: string) => ['tahun-ajaran', id] as const,
}

// ── Queries ───────────────────────────────────────────────────
export function useTahunAjaranList() {
  return useQuery({
    queryKey: tahunAjaranKeys.all,
    queryFn:  tahunAjaranApi.getAll,
  })
}

export function useTahunAjaranActive() {
  return useQuery({
    queryKey: tahunAjaranKeys.active,
    queryFn:  tahunAjaranApi.getAllActive,
  })
}

export function useTahunAjaranOneActive() {
  return useQuery({
    queryKey: tahunAjaranKeys.oneActive,
    queryFn:  tahunAjaranApi.getOneActive,
  })
}

export function useTahunAjaranDetail(id: string | null) {
  return useQuery({
    queryKey: tahunAjaranKeys.detail(id ?? ''),
    queryFn:  () => tahunAjaranApi.getOne(id!),
    enabled:  !!id,
  })
}

// ── Mutations ─────────────────────────────────────────────────
export function useCreateTahunAjaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTahunAjaranPayload) => tahunAjaranApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.all })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.active })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.oneActive })
    },
  })
}

export function useUpdateTahunAjaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTahunAjaranPayload }) =>
      tahunAjaranApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.all })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.active })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.oneActive })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.detail(id) })
    },
  })
}

export function useToggleTahunAjaranActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tahunAjaranApi.toggleActive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.all })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.active })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.oneActive })
    },
  })
}

export function useSetActiveSingleTahunAjaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tahunAjaranApi.setActiveSingle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.all })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.active })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.oneActive })
    },
  })
}

export function useDeleteTahunAjaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tahunAjaranApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.all })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.active })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.oneActive })
    },
  })
}
