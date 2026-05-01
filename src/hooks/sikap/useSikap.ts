import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getCatatanSikapList,
  getRekapSiswa,
  createCatatanSikap,
  updateCatatanSikap,
  deleteCatatanSikap,
  getMasterSikapList,
  getRekapKelas,
  getSiswaKelas,
  exportSiswaPdf,
  exportKelasPdf,
  type QueryCatatanSikap,
  type QueryMasterSikap,
} from '@/lib/api/sikap.api'
import type { CreateCatatanSikapPayload } from '@/types/sikap.types'

// ── Query Keys ────────────────────────────────────────────────────────────────
export const sikapKeys = {
  list:        (q: QueryCatatanSikap)           => ['catatan-sikap', 'list', q]               as const,
  rekap:       (siswaId: string, semId?: string) => ['catatan-sikap', 'rekap', siswaId, semId ?? ''] as const,
  masterSikap: (q?: QueryMasterSikap)            => ['master-sikap', 'list', q ?? {}]          as const,
  rekapKelas:  (kelasId: string, semId?: string) => ['catatan-sikap', 'rekap-kelas', kelasId, semId ?? ''] as const,
  siswaKelas:  (kelasId: string, semId?: string) => ['catatan-sikap', 'siswa-kelas', kelasId, semId ?? ''] as const,
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

// ── Rekap Kelas & Siswa Kelas ─────────────────────────────────────────────────

export function useRekapSikapKelas(kelasId: string | null, semesterId?: string) {
  return useQuery({
    queryKey: sikapKeys.rekapKelas(kelasId ?? '', semesterId),
    queryFn:  () => getRekapKelas(kelasId!, semesterId),
    enabled:  !!kelasId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSiswaKelas(kelasId: string | null, semesterId?: string) {
  return useQuery({
    queryKey: sikapKeys.siswaKelas(kelasId ?? '', semesterId),
    queryFn:  () => getSiswaKelas(kelasId!, semesterId),
    enabled:  !!kelasId,
    staleTime: 2 * 60 * 1000,
  })
}

// ── Export PDF Mutations ──────────────────────────────────────────────────────

export function useExportSiswaPdf() {
  return useMutation({
    mutationFn: ({ siswaId, semesterId }: { siswaId: string; semesterId?: string }) =>
      exportSiswaPdf(siswaId, semesterId),
    onError: () => toast.error('Gagal mengunduh laporan PDF'),
  })
}

export function useExportKelasPdf() {
  return useMutation({
    mutationFn: ({ kelasId, semesterId }: { kelasId: string; semesterId?: string }) =>
      exportKelasPdf(kelasId, semesterId),
    onError: () => toast.error('Gagal mengunduh laporan PDF'),
  })
}
