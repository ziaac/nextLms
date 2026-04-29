'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { beritaApi } from '@/lib/api/homepage.api'
import type {
  CreateBeritaDto,
  UpdateBeritaDto,
  QueryBeritaDto,
} from '@/types/homepage.types'

export const beritaKeys = {
  list:      (q?: QueryBeritaDto, isAdmin?: boolean) => ['homepage', 'berita', 'list', q ?? {}, isAdmin] as const,
  detail:    (id: string)   => ['homepage', 'berita', 'detail', id]   as const,
  slug:      (slug: string) => ['homepage', 'berita', 'slug', slug]   as const,
  kategori:  ()             => ['homepage', 'berita', 'kategori']      as const,
}

export function useBeritaList(query: QueryBeritaDto = {}, isAdmin = false) {
  return useQuery({
    queryKey: beritaKeys.list(query, isAdmin),
    queryFn:  () => beritaApi.list(query, isAdmin),
    staleTime: 2 * 60 * 1000,
  })
}

export function useBeritaDetail(id: string | null) {
  return useQuery({
    queryKey: beritaKeys.detail(id ?? ''),
    queryFn:  () => beritaApi.getById(id!),
    enabled:  !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useBeritaBySlug(slug: string | null) {
  return useQuery({
    queryKey: beritaKeys.slug(slug ?? ''),
    queryFn:  () => beritaApi.getBySlug(slug!),
    enabled:  !!slug,
    staleTime: 5 * 60 * 1000,
  })
}

export function useKategoriBerita() {
  return useQuery({
    queryKey: beritaKeys.kategori(),
    queryFn:  beritaApi.listKategori,
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreateBerita() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateBeritaDto) => beritaApi.create(dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['homepage', 'berita', 'list'] }),
  })
}

export function useUpdateBerita() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBeritaDto }) =>
      beritaApi.update(id, dto),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['homepage', 'berita', 'list'] })
      qc.invalidateQueries({ queryKey: beritaKeys.detail(id) })
    },
  })
}

export function useDeleteBerita() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => beritaApi.remove(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['homepage', 'berita', 'list'] }),
  })
}

export function useCreateKategoriBerita() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: { nama: string; slug: string }) => beritaApi.createKategori(dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: beritaKeys.kategori() }),
  })
}

export function useDeleteKategoriBerita() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => beritaApi.removeKategori(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: beritaKeys.kategori() }),
  })
}
