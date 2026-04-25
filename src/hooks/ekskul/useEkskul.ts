import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getEkskulList,
  getEkskulDetail,
  getMyMemberships,
  daftarMandiri,
  getKegiatanEkskul,
  getAnggotaEkskul,
  approvalAnggota,
} from '@/lib/api/ekskul.api'
import type { DaftarMandiriPayload, QueryEkskul } from '@/types/ekskul.types'

// ── Query Keys ────────────────────────────────────────────────────────────────
export const ekskulKeys = {
  list:         (q?: QueryEkskul) => ['ekskul', 'list', q ?? {}]    as const,
  detail:       (id: string)      => ['ekskul', 'detail', id]        as const,
  myMemberships:(taId?: string)   => ['ekskul', 'my', taId ?? '']    as const,
  kegiatan:     (id: string)      => ['ekskul', 'kegiatan', id]      as const,
  anggota:      (id: string)      => ['ekskul', 'anggota', id]       as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useEkskulList(q?: QueryEkskul, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ekskulKeys.list(q),
    queryFn:  () => getEkskulList(q),
    enabled:  opts?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  })
}

export function useEkskulDetail(id: string | null) {
  return useQuery({
    queryKey: ekskulKeys.detail(id ?? ''),
    queryFn:  () => getEkskulDetail(id!),
    enabled:  !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMyMemberships(tahunAjaranId?: string, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ekskulKeys.myMemberships(tahunAjaranId),
    queryFn:  () => getMyMemberships(tahunAjaranId),
    enabled:  opts?.enabled ?? true,
    staleTime: 2 * 60 * 1000,
  })
}

export function useKegiatanEkskul(id: string | null, page = 1) {
  return useQuery({
    queryKey: [...ekskulKeys.kegiatan(id ?? ''), page],
    queryFn:  () => getKegiatanEkskul(id!, page),
    enabled:  !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export function useAnggotaEkskul(id: string | null) {
  return useQuery({
    queryKey: ekskulKeys.anggota(id ?? ''),
    queryFn:  () => getAnggotaEkskul(id!),
    enabled:  !!id,
    staleTime: 2 * 60 * 1000,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useDaftarMandiri() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: DaftarMandiriPayload) => daftarMandiri(payload),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['ekskul', 'my'] })
      qc.invalidateQueries({ queryKey: ['ekskul', 'list'] })
    },
  })
}

export function useApprovalAnggota() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ anggotaId, action }: { anggotaId: string; action: 'APPROVE' | 'REJECT' }) =>
      approvalAnggota(anggotaId, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ekskul'] }),
  })
}
