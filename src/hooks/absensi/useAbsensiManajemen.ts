import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getMatrixRekap,
  getSiswaKritis,
  getGuruDetail,
  overrideAbsensi,
  simpanManualBulk,
  simpanManualSingle,
  exportMatrix,
  type MatrixQueryParams,
} from '@/lib/api/absensi.api'
import type { OverridePayload, ManualBulkPayload } from '@/types'

export const manajemenKeys = {
  matrix: (p: MatrixQueryParams) =>
    ['absensi', 'matrix', p.kelasId, p.mataPelajaranId, p.semesterId] as const,
  siswaKritis: (semesterId: string) =>
    ['absensi', 'siswa-kritis', semesterId] as const,
  guruDetail: (guruId: string, semesterId: string) =>
    ['absensi', 'guru-detail', guruId, semesterId] as const,
}

// ── Query: Matrix Rekap ───────────────────────────────────────────────────────
export function useMatrixRekap(params: Partial<MatrixQueryParams>) {
  const isReady =
    !!params.kelasId && !!params.mataPelajaranId && !!params.semesterId

  return useQuery({
    queryKey: manajemenKeys.matrix(params as MatrixQueryParams),
    queryFn:  () => getMatrixRekap(params as MatrixQueryParams),
    enabled:  isReady,
    staleTime: 1000 * 60 * 2,
  })
}

// ── Query: Siswa Kritis ───────────────────────────────────────────────────────
export function useSiswaKritis(semesterId: string) {
  return useQuery({
    queryKey: manajemenKeys.siswaKritis(semesterId),
    queryFn:  () => getSiswaKritis(semesterId),
    enabled:  !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}

// ── Query: Guru Detail Report ─────────────────────────────────────────────────
export function useGuruDetailReport(guruId: string, semesterId: string) {
  return useQuery({
    queryKey: manajemenKeys.guruDetail(guruId, semesterId),
    queryFn:  () => getGuruDetail(guruId, semesterId),
    enabled:  !!guruId && !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}

// ── Mutation: Override Satu Sel ───────────────────────────────────────────────
export function useOverrideAbsensi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: OverridePayload }) =>
      overrideAbsensi(id, payload),
    onSuccess: () => {
      // Invalidate semua matrix (filter-nya beda-beda, invalidate by prefix)
      qc.invalidateQueries({ queryKey: ['absensi', 'matrix'] })
    },
  })
}

// ── Mutation: Manual Bulk (mode Manual) ──────────────────────────────────────
export function useSimpanManualBulk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ManualBulkPayload) => simpanManualBulk(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absensi', 'matrix'] })
      qc.invalidateQueries({ queryKey: ['absensi', 'my-status-hari-ini'] })
    },
  })
}

// ── Action: Export Matrix ke PDF ──────────────────────────────────────────────
export function useExportMatrix() {
  return useMutation({
    mutationFn: async (params: MatrixQueryParams) => {
      const res = await exportMatrix(params)
      const url = URL.createObjectURL(res.data)
      const a   = document.createElement('a')
      a.href    = url
      a.download = `rekap-${params.mataPelajaranId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
  })
}

// ── Mutation: Manual Single (upsert satu record absensi) ─────────────────────
export function useSimpanManualSingle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: import('@/types').ManualSinglePayload) =>
      simpanManualSingle(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absensi', 'matrix'] })
    },
  })
}
