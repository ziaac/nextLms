import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTagihanList,
  getTagihanDetail,
  createTagihan,
  bulkGenerateTagihan,
  updateTagihan,
  deleteTagihan,
  getRekapSiswa,
  getRekapKelas,
} from '@/lib/api/tagihan.api'
import type {
  QueryTagihanDto,
  CreateTagihanDto,
  BulkGenerateTagihanDto,
  QueryRekapKelasDto,
} from '@/types/pembayaran.types'

// ─── Query Key Factory ────────────────────────────────────────────

export const tagihanKeys = {
  all: ['tagihan'] as const,
  lists: () => [...tagihanKeys.all, 'list'] as const,
  list: (filters: QueryTagihanDto) =>
    [...tagihanKeys.lists(), filters] as const,
  details: () => [...tagihanKeys.all, 'detail'] as const,
  detail: (id: string) => [...tagihanKeys.details(), id] as const,
  rekapSiswa: (siswaId: string, tahunAjaranId?: string) =>
    [...tagihanKeys.all, 'rekap-siswa', siswaId, tahunAjaranId] as const,
  rekapKelas: (tahunAjaranId: string, kategoriId?: string, kelasId?: string) =>
    [...tagihanKeys.all, 'rekap-kelas', tahunAjaranId, kategoriId, kelasId] as const,
}

// ─── Queries ──────────────────────────────────────────────────────

export function useTagihanList(params?: QueryTagihanDto) {
  return useQuery({
    queryKey: tagihanKeys.list(params ?? {}),
    queryFn: () => getTagihanList(params),
  })
}

export function useTagihanDetail(id: string) {
  return useQuery({
    queryKey: tagihanKeys.detail(id),
    queryFn: () => getTagihanDetail(id),
    enabled: !!id,
  })
}

export function useRekapSiswa(siswaId: string, tahunAjaranId?: string) {
  return useQuery({
    queryKey: tagihanKeys.rekapSiswa(siswaId, tahunAjaranId),
    queryFn: () => getRekapSiswa(siswaId, tahunAjaranId),
    enabled: !!siswaId,
  })
}

export function useRekapKelas(params: QueryRekapKelasDto) {
  return useQuery({
    queryKey: tagihanKeys.rekapKelas(
      params.tahunAjaranId,
      params.kategoriPembayaranId,
      params.kelasId,
    ),
    queryFn: () => getRekapKelas(params),
    enabled: !!params.tahunAjaranId,
  })
}

// ─── Mutations ────────────────────────────────────────────────────

export function useCreateTagihan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateTagihanDto) => createTagihan(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagihanKeys.all })
    },
  })
}

export function useBulkGenerateTagihan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: BulkGenerateTagihanDto) => bulkGenerateTagihan(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagihanKeys.all })
    },
  })
}

export function useUpdateTagihan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string
      dto: Partial<CreateTagihanDto>
    }) => updateTagihan(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagihanKeys.all })
    },
  })
}

export function useDeleteTagihan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTagihan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagihanKeys.all })
    },
  })
}
