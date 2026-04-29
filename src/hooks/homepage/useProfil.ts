'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profilApi } from '@/lib/api/homepage.api'
import type { UpsertProfilDto } from '@/types/homepage.types'

export const profilKeys = {
  detail: () => ['homepage', 'profil'] as const,
}

export function useProfil() {
  return useQuery({
    queryKey: profilKeys.detail(),
    queryFn:  profilApi.get,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpsertProfil() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpsertProfilDto) => profilApi.upsert(dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: profilKeys.detail() }),
  })
}
