import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tingkatKelasApi } from '@/lib/api/tingkat-kelas.api'
import type { CreateTingkatKelasPayload, UpdateTingkatKelasPayload } from '@/types/akademik.types'

export const tingkatKelasKeys = {
  all:    ['tingkat-kelas'] as const,
  detail: (id: string) => ['tingkat-kelas', id] as const,
}

export function useTingkatKelasList() {
  return useQuery({
    queryKey: tingkatKelasKeys.all,
    queryFn:  tingkatKelasApi.getAll,
    staleTime: 1000 * 60 * 10,
  })
}

export function useCreateTingkatKelas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTingkatKelasPayload) => tingkatKelasApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: tingkatKelasKeys.all }),
  })
}

export function useUpdateTingkatKelas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTingkatKelasPayload }) =>
      tingkatKelasApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: tingkatKelasKeys.all })
      qc.invalidateQueries({ queryKey: tingkatKelasKeys.detail(id) })
    },
  })
}

export function useDeleteTingkatKelas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tingkatKelasApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: tingkatKelasKeys.all }),
  })
}
