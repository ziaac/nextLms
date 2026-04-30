import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPembayaranList,
  getPembayaranDetail,
  createPembayaran,
  digitalPayment,
  verifikasiPembayaran,
  getRekapPembayaran,
  createSnapToken,
  createDokuCheckout,
} from '@/lib/api/pembayaran.api'
import type {
  QueryPembayaranDto,
  CreatePembayaranDto,
  DigitalPaymentDto,
  VerifikasiPembayaranDto,
  RekapQueryDto,
  CreateSnapTokenDto,
  CreateDokuCheckoutDto,
} from '@/types/pembayaran.types'

// ─── Query Key Factory ────────────────────────────────────────────

export const pembayaranKeys = {
  all: ['pembayaran'] as const,
  lists: () => [...pembayaranKeys.all, 'list'] as const,
  list: (filters: QueryPembayaranDto) =>
    [...pembayaranKeys.lists(), filters] as const,
  details: () => [...pembayaranKeys.all, 'detail'] as const,
  detail: (id: string) => [...pembayaranKeys.details(), id] as const,
  rekap: (query: RekapQueryDto) =>
    [...pembayaranKeys.all, 'rekap', query] as const,
}

// ─── Queries ──────────────────────────────────────────────────────

export function usePembayaranList(params?: QueryPembayaranDto) {
  return useQuery({
    queryKey: pembayaranKeys.list(params ?? {}),
    queryFn: () => getPembayaranList(params),
  })
}

export function usePembayaranDetail(id: string) {
  return useQuery({
    queryKey: pembayaranKeys.detail(id),
    queryFn: () => getPembayaranDetail(id),
    enabled: !!id,
  })
}

export function useRekapPembayaran(query: RekapQueryDto) {
  return useQuery({
    queryKey: pembayaranKeys.rekap(query),
    queryFn: () => getRekapPembayaran(query),
    enabled: !!query.tanggalMulai && !!query.tanggalSelesai,
  })
}

// ─── Mutations ────────────────────────────────────────────────────

export function useCreatePembayaran() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePembayaranDto) => createPembayaran(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.all })
    },
  })
}

export function useDigitalPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: DigitalPaymentDto) => digitalPayment(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.all })
    },
  })
}

export function useVerifikasiPembayaran() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string
      dto: VerifikasiPembayaranDto
    }) => verifikasiPembayaran(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.all })
    },
  })
}

export function useCreateSnapToken() {
  return useMutation({
    mutationFn: (dto: CreateSnapTokenDto) => createSnapToken(dto),
  })
}

export function useCreateDokuCheckout() {
  return useMutation({
    mutationFn: (dto: CreateDokuCheckoutDto) => createDokuCheckout(dto),
  })
}
