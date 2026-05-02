import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getKurikulumList,
  getKurikulumAktif,
  getKurikulumDetail,
  createKurikulum,
  updateKurikulum,
  activateKurikulum,
  deleteKurikulum,
  upsertFormatBaku,
  getFormatBaku,
} from '@/lib/api/kurikulum.api'
import type { CreateKurikulumDto, UpdateKurikulumDto, CreateFormatBakuDto } from '@/types/kurikulum.types'
import { kurikulumKeys } from './kurikulum.keys'

export function useKurikulumList() {
  return useQuery({
    queryKey: kurikulumKeys.lists(),
    queryFn:  () => getKurikulumList(),
    staleTime: 0,
  })
}

export function useKurikulumAktif() {
  return useQuery({
    queryKey: kurikulumKeys.aktif(),
    queryFn:  () => getKurikulumAktif(),
    staleTime: 0,
  })
}

export function useKurikulumDetail(id: string | null) {
  return useQuery({
    queryKey: kurikulumKeys.detail(id ?? ''),
    queryFn:  () => getKurikulumDetail(id!),
    enabled:  !!id,
    staleTime: 0,
  })
}

export function useCreateKurikulum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateKurikulumDto) => createKurikulum(dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: kurikulumKeys.all }),
  })
}

export function useUpdateKurikulum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateKurikulumDto }) =>
      updateKurikulum(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: kurikulumKeys.all }),
  })
}

export function useActivateKurikulum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => activateKurikulum(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: kurikulumKeys.all }),
  })
}

export function useDeleteKurikulum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteKurikulum(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: kurikulumKeys.all }),
  })
}

export function useUpsertFormatBaku() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ kurikulumId, dto }: { kurikulumId: string; dto: CreateFormatBakuDto }) =>
      upsertFormatBaku(kurikulumId, dto),
    onSuccess: (_data, { kurikulumId }) => {
      qc.invalidateQueries({ queryKey: kurikulumKeys.formatBaku(kurikulumId) })
      qc.invalidateQueries({ queryKey: kurikulumKeys.detail(kurikulumId) })
    },
  })
}

export function useFormatBaku(kurikulumId: string | null) {
  return useQuery({
    queryKey: kurikulumKeys.formatBaku(kurikulumId ?? ''),
    queryFn:  () => getFormatBaku(kurikulumId!),
    enabled:  !!kurikulumId,
    staleTime: 0,
  })
}
