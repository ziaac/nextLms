import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPrestasiList,
  getPrestasiDetail,
  createPrestasi,
  updatePrestasi,
  verifikasiPrestasi,
  deletePrestasi,
} from '@/lib/api/prestasi.api'
import type { CreatePrestasiPayload, QueryPrestasi } from '@/types/prestasi.types'

// ── Query Keys ────────────────────────────────────────────────────────────────
export const prestasiKeys = {
  list:   (q: QueryPrestasi)  => ['prestasi', 'list', q]    as const,
  detail: (id: string)        => ['prestasi', 'detail', id] as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function usePrestasiList(q: QueryPrestasi, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: prestasiKeys.list(q),
    queryFn:  () => getPrestasiList(q),
    enabled:  opts?.enabled ?? true,
    staleTime: 2 * 60 * 1000,
  })
}

export function usePrestasiDetail(id: string | null) {
  return useQuery({
    queryKey: prestasiKeys.detail(id ?? ''),
    queryFn:  () => getPrestasiDetail(id!),
    enabled:  !!id,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreatePrestasi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePrestasiPayload) => createPrestasi(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['prestasi'] }),
  })
}

export function useUpdatePrestasi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreatePrestasiPayload> }) =>
      updatePrestasi(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prestasi'] }),
  })
}

export function useVerifikasiPrestasi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => verifikasiPrestasi(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['prestasi'] }),
  })
}

export function useDeletePrestasi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePrestasi(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['prestasi'] }),
  })
}
