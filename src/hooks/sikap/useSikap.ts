import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCatatanSikapList,
  getRekapSiswa,
  createCatatanSikap,
  updateCatatanSikap,
  deleteCatatanSikap,
  getMasterSikapList,
  type QueryCatatanSikap,
  type QueryMasterSikap,
} from '@/lib/api/sikap.api'
import type { CreateCatatanSikapPayload } from '@/types/sikap.types'

// ── Query Keys ────────────────────────────────────────────────────────────────
export const sikapKeys = {
  list:        (q: QueryCatatanSikap)           => ['catatan-sikap', 'list', q]               as const,
  rekap:       (siswaId: string, semId?: string) => ['catatan-sikap', 'rekap', siswaId, semId ?? ''] as const,
  masterSikap: (q?: QueryMasterSikap)            => ['master-sikap', 'list', q ?? {}]          as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useCatatanSikapList(q: QueryCatatanSikap, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: sikapKeys.list(q),
    queryFn:  () => getCatatanSikapList(q),
    enabled:  opts?.enabled ?? true,
    staleTime: 2 * 60 * 1000,
  })
}

export function useRekapSikapSiswa(siswaId: string | null, semesterId?: string) {
  return useQuery({
    queryKey: sikapKeys.rekap(siswaId ?? '', semesterId),
    queryFn:  () => getRekapSiswa(siswaId!, semesterId),
    enabled:  !!siswaId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useMasterSikapList(q?: QueryMasterSikap) {
  return useQuery({
    queryKey: sikapKeys.masterSikap(q),
    queryFn:  () => getMasterSikapList({ isActive: true, ...q }),
    staleTime: 10 * 60 * 1000,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateCatatanSikap() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCatatanSikapPayload) => createCatatanSikap(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['catatan-sikap'] }),
  })
}

export function useUpdateCatatanSikap() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateCatatanSikapPayload> }) =>
      updateCatatanSikap(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catatan-sikap'] }),
  })
}

export function useDeleteCatatanSikap() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCatatanSikap(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['catatan-sikap'] }),
  })
}
