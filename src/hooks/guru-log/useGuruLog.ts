import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getHarianLog,
  getDetailHarian,
  createEksternal,
  updateEksternal,
  deleteEksternal,
  downloadLckhPdf,
  getArsipLog,
  getPersetujuan,
  setujuiLckh,
  batalkanPersetujuan,
  uploadTandaTangan,
  saveTandaTanganKey,
  getListGuruSummary,
  getPendingVerifikasi,
  type SetujuiPayload,
} from '@/lib/api/guru-log.api'
import type {
  HarianQueryParams,
  CreateEksternalPayload,
  UpdateEksternalPayload,
  ArsipQueryParams,
  ListGuruSummaryParams,
} from '@/types/guru-log.types'
import { toast } from 'sonner'

// ── Query Key Factory ─────────────────────────────────────────────────────────

export const guruLogKeys = {
  all:              ()                                            => ['guru-log'] as const,
  harian:           (params: HarianQueryParams)                   => ['guru-log', 'harian', params] as const,
  detail:           (tanggal: string, guruId?: string)            => ['guru-log', 'detail', tanggal, guruId ?? ''] as const,
  arsip:            (tahunAjaranId: string, semesterId?: string)  => ['guru-log', 'arsip', tahunAjaranId, semesterId ?? ''] as const,
  persetujuan:      (tanggal: string, guruId?: string)            => ['guru-log', 'persetujuan', tanggal, guruId ?? ''] as const,
  listGuruSummary:  (params?: ListGuruSummaryParams)              => ['guru-log', 'list-guru-summary', params ?? {}] as const,
  pendingVerifikasi:(params?: { bulan?: number; tahun?: number }) => ['guru-log', 'pending-verifikasi', params ?? {}] as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useHarianLog(params: HarianQueryParams | null) {
  return useQuery({
    queryKey: guruLogKeys.harian(params ?? { bulan: 0, tahun: 0 }),
    queryFn:  () => getHarianLog(params!),
    enabled:  !!params && params.bulan > 0 && params.tahun > 0,
    staleTime: 1000 * 60 * 2,
  })
}

export function useDetailHarian(tanggal: string | null, guruId?: string) {
  return useQuery({
    queryKey: guruLogKeys.detail(tanggal ?? '', guruId),
    queryFn:  () => getDetailHarian(tanggal!, guruId),
    enabled:  !!tanggal,
    staleTime: 1000 * 60 * 2,
  })
}

export function useArsipLog(params: ArsipQueryParams | null) {
  return useQuery({
    queryKey: guruLogKeys.arsip(params?.tahunAjaranId ?? '', params?.semesterId),
    queryFn:  () => getArsipLog(params!),
    enabled:  !!params?.tahunAjaranId,
    staleTime: 1000 * 60 * 5,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateEksternal(tanggal: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateEksternalPayload) => createEksternal(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: guruLogKeys.detail(tanggal) })
      qc.invalidateQueries({ queryKey: ['guru-log', 'harian'] })
    },
    onError: () => toast.error('Gagal menyimpan aktivitas'),
  })
}

export function useUpdateEksternal(tanggal: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEksternalPayload }) =>
      updateEksternal(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: guruLogKeys.detail(tanggal) })
    },
    onError: () => toast.error('Gagal menyimpan aktivitas'),
  })
}

export function useDeleteEksternal(tanggal: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteEksternal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: guruLogKeys.detail(tanggal) })
      qc.invalidateQueries({ queryKey: ['guru-log', 'harian'] })
    },
    onError: () => toast.error('Gagal menghapus aktivitas'),
  })
}

export function useDownloadLckhPdf() {
  return useMutation({
    mutationFn: ({ tanggal, guruId }: { tanggal: string; guruId?: string }) =>
      downloadLckhPdf(tanggal, guruId),
    onError: () => toast.error('Gagal mengunduh PDF'),
  })
}

// ── Persetujuan ───────────────────────────────────────────────────────────────

export function usePersetujuan(tanggal: string | null, guruId?: string) {
  return useQuery({
    queryKey: guruLogKeys.persetujuan(tanggal ?? '', guruId),
    queryFn:  () => getPersetujuan(tanggal!, guruId),
    enabled:  !!tanggal,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSetujuiLckh(tanggal: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SetujuiPayload) => setujuiLckh(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: guruLogKeys.persetujuan(tanggal) })
      toast.success('LCKH berhasil disetujui')
    },
    onError: () => toast.error('Gagal menyetujui LCKH'),
  })
}

export function useBatalkanPersetujuan(tanggal: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ guruId }: { guruId: string }) => batalkanPersetujuan(guruId, tanggal),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: guruLogKeys.persetujuan(tanggal) })
      toast.success('Persetujuan dibatalkan')
    },
    onError: () => toast.error('Gagal membatalkan persetujuan'),
  })
}

// ── Upload Tanda Tangan ───────────────────────────────────────────────────────

export function useUploadTandaTangan() {
  return useMutation({
    mutationFn: async (file: File) => {
      const key = await uploadTandaTangan(file)
      await saveTandaTanganKey(key)
      return key
    },
    onSuccess: () => toast.success('Tanda tangan berhasil disimpan'),
    onError: () => toast.error('Gagal menyimpan tanda tangan'),
  })
}

// ── Manajemen: List Guru Summary ──────────────────────────────────────────────

export function useListGuruSummary(params?: ListGuruSummaryParams) {
  return useQuery({
    queryKey: guruLogKeys.listGuruSummary(params),
    queryFn:  () => getListGuruSummary(params),
    staleTime: 1000 * 60 * 2,
  })
}

export function usePendingVerifikasi(params?: { bulan?: number; tahun?: number }) {
  return useQuery({
    queryKey: guruLogKeys.pendingVerifikasi(params),
    queryFn:  () => getPendingVerifikasi(params),
    staleTime: 1000 * 60 * 2,
  })
}

export function useBulkSetujuiLckh() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SetujuiPayload) => setujuiLckh(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guru-log', 'list-guru-summary'] })
      qc.invalidateQueries({ queryKey: ['guru-log', 'pending-verifikasi'] })
      qc.invalidateQueries({ queryKey: ['guru-log', 'persetujuan'] })
    },
    onError: () => toast.error('Gagal menyetujui LCKH'),
  })
}
