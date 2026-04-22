import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ajukanPerizinan,
  getListPerizinan,
  getDetailPerizinan,
  revisiPerizinan,
  approvalPerizinan,
  hapusPerizinan,
} from '@/lib/api/perizinan.api'
import type {
  PerizinanPayload,
  PerizinanQueryParams,
  PerizinanRevisiPayload,
  PerizinanApprovalPayload,
} from '@/types'

export const perizinanKeys = {
  list:   (params: PerizinanQueryParams) =>
    ['perizinan', 'list', params] as const,
  detail: (id: string) =>
    ['perizinan', 'detail', id] as const,
}

// ── Query: List Perizinan ─────────────────────────────────────────────────────
export function useListPerizinan(params: PerizinanQueryParams) {
  return useQuery({
    queryKey: perizinanKeys.list(params),
    queryFn:  () => getListPerizinan(params),
    staleTime: 1000 * 60,
    placeholderData: (prev) => prev,
  })
}

// ── Query: Detail Perizinan ───────────────────────────────────────────────────
export function useDetailPerizinan(id: string | null) {
  return useQuery({
    queryKey: perizinanKeys.detail(id ?? ''),
    queryFn:  () => getDetailPerizinan(id!),
    enabled:  !!id,
    staleTime: 1000 * 60,
  })
}

// ── Mutation: Ajukan Perizinan ────────────────────────────────────────────────
export function useAjukanPerizinan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PerizinanPayload) => ajukanPerizinan(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['perizinan', 'list'] })
    },
  })
}

// ── Mutation: Revisi Perizinan (siswa edit saat PENDING) ─────────────────────
export function useRevisiPerizinan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: PerizinanRevisiPayload
    }) => revisiPerizinan(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['perizinan', 'list'] })
      qc.invalidateQueries({ queryKey: perizinanKeys.detail(id) })
    },
  })
}

// ── Mutation: Approval Perizinan (wali kelas / admin) ────────────────────────
export function useApprovalPerizinan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: PerizinanApprovalPayload
    }) => approvalPerizinan(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['perizinan', 'list'] })
      qc.invalidateQueries({ queryKey: perizinanKeys.detail(id) })
    },
  })
}

// ── Mutation: Hapus / Batalkan Perizinan ─────────────────────────────────────
export function useHapusPerizinan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => hapusPerizinan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['perizinan', 'list'] })
    },
  })
}
