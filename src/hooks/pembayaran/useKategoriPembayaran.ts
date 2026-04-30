import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getKategoriPembayaranList,
  getKategoriPembayaranDetail,
  createKategoriPembayaran,
  bulkCreateKategoriPembayaran,
  updateKategoriPembayaran,
  toggleActiveKategoriPembayaran,
  deleteKategoriPembayaran,
} from '@/lib/api/kategori-pembayaran.api'
import type {
  QueryKategoriPembayaranDto,
  CreateKategoriPembayaranDto,
  UpdateKategoriPembayaranDto,
} from '@/types/pembayaran.types'

// ─── Query Key Factory ────────────────────────────────────────────

export const kategoriPembayaranKeys = {
  all: ['kategoriPembayaran'] as const,
  lists: () => [...kategoriPembayaranKeys.all, 'list'] as const,
  list: (filters: QueryKategoriPembayaranDto) =>
    [...kategoriPembayaranKeys.lists(), filters] as const,
  details: () => [...kategoriPembayaranKeys.all, 'detail'] as const,
  detail: (id: string) => [...kategoriPembayaranKeys.details(), id] as const,
}

// ─── Queries ──────────────────────────────────────────────────────

export function useKategoriPembayaranList(params?: QueryKategoriPembayaranDto) {
  return useQuery({
    queryKey: kategoriPembayaranKeys.list(params ?? {}),
    queryFn: () => getKategoriPembayaranList(params),
  })
}

export function useKategoriPembayaranDetail(id: string) {
  return useQuery({
    queryKey: kategoriPembayaranKeys.detail(id),
    queryFn: () => getKategoriPembayaranDetail(id),
    enabled: !!id,
  })
}

// ─── Mutations ────────────────────────────────────────────────────

export function useCreateKategoriPembayaran() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateKategoriPembayaranDto) =>
      createKategoriPembayaran(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kategoriPembayaranKeys.all })
    },
  })
}

export function useBulkCreateKategoriPembayaran() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dtos: CreateKategoriPembayaranDto[]) =>
      bulkCreateKategoriPembayaran(dtos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kategoriPembayaranKeys.all })
    },
  })
}

export function useUpdateKategoriPembayaran() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateKategoriPembayaranDto }) =>
      updateKategoriPembayaran(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kategoriPembayaranKeys.all })
    },
  })
}

export function useToggleActiveKategoriPembayaran() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => toggleActiveKategoriPembayaran(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kategoriPembayaranKeys.all })
    },
  })
}

export function useDeleteKategoriPembayaran() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteKategoriPembayaran(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kategoriPembayaranKeys.all })
    },
  })
}
