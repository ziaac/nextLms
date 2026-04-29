'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { galeriApi } from '@/lib/api/homepage.api'
import type {
  CreateKategoriGaleriDto,
  CreateGaleriFotoDto,
} from '@/types/homepage.types'

export const galeriKeys = {
  kategoriList: (onlyActive?: boolean) => ['homepage', 'galeri', 'kategori', { onlyActive }] as const,
  kategoriDetail: (id: string)         => ['homepage', 'galeri', 'kategori', id]              as const,
}

export function useGaleriKategoriList(onlyActive = false) {
  return useQuery({
    queryKey: galeriKeys.kategoriList(onlyActive),
    queryFn:  () => galeriApi.listKategori(onlyActive),
    staleTime: 5 * 60 * 1000,
  })
}

export function useGaleriKategoriDetail(id: string | null) {
  return useQuery({
    queryKey: galeriKeys.kategoriDetail(id ?? ''),
    queryFn:  () => galeriApi.getKategori(id!),
    enabled:  !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateGaleriKategori() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateKategoriGaleriDto) => galeriApi.createKategori(dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['homepage', 'galeri', 'kategori'] }),
  })
}

export function useUpdateGaleriKategori() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateKategoriGaleriDto> }) =>
      galeriApi.updateKategori(id, dto),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['homepage', 'galeri', 'kategori'] })
      qc.invalidateQueries({ queryKey: galeriKeys.kategoriDetail(id) })
    },
  })
}

export function useDeleteGaleriKategori() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => galeriApi.removeKategori(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['homepage', 'galeri', 'kategori'] }),
  })
}

export function useCreateGaleriFoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateGaleriFotoDto) => galeriApi.createFoto(dto),
    onSuccess: (_, dto) => {
      qc.invalidateQueries({ queryKey: galeriKeys.kategoriDetail(dto.kategoriId) })
    },
  })
}

export function useBulkCreateGaleriFoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (items: CreateGaleriFotoDto[]) => galeriApi.bulkCreateFoto(items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homepage', 'galeri', 'kategori'] })
    },
  })
}

export function useDeleteGaleriFoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ fotoId, kategoriId }: { fotoId: string; kategoriId: string }) =>
      galeriApi.removeFoto(fotoId),
    onSuccess: (_, { kategoriId }) => {
      qc.invalidateQueries({ queryKey: galeriKeys.kategoriDetail(kategoriId) })
    },
  })
}
