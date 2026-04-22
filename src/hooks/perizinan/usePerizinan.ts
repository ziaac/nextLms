import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ajukanPerizinan,
  akhiriPerizinanLebihAwal,
  getListPerizinan,
  getDetailPerizinan,
  revisiPerizinan,
  approvalPerizinan,
  hapusPerizinan,
} from '@/lib/api/perizinan.api'
import { getSiswaPerKelas } from '@/lib/api/absensi-report.api'
import type {
  PerizinanQueryParams,
  PerizinanPayload,
  PerizinanApprovalPayload,
  PerizinanRevisiPayload,
} from '@/types/perizinan.types'

export const perizinanKeys = {
  list:   (params: PerizinanQueryParams) => ['perizinan', 'list', params]          as const,
  detail: (id: string)                   => ['perizinan', 'detail', id]             as const,
  siswa:  (kelasId: string, semId: string) =>
    ['perizinan', 'siswa-kelas', kelasId, semId] as const,
}

export function usePerizinanList(params: PerizinanQueryParams) {
  return useQuery({
    queryKey:  perizinanKeys.list(params),
    queryFn:   () => getListPerizinan(params),
    staleTime: 0,
  })
}

export function usePerizinanDetail(id: string | null) {
  return useQuery({
    queryKey:  perizinanKeys.detail(id ?? ''),
    queryFn:   () => getDetailPerizinan(id!),
    enabled:   !!id,
    staleTime: 0,
  })
}

export function useSiswaPerKelas(kelasId: string | null, semesterId: string | null) {
  return useQuery({
    queryKey:  perizinanKeys.siswa(kelasId ?? '', semesterId ?? ''),
    queryFn:   () => getSiswaPerKelas(kelasId!, semesterId!),
    enabled:   !!kelasId && !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useAjukanPerizinan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PerizinanPayload) => ajukanPerizinan(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['perizinan'] }),
  })
}

export function useRevisiPerizinan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PerizinanRevisiPayload }) =>
      revisiPerizinan(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['perizinan'] }),
  })
}

export function useApprovalPerizinan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PerizinanApprovalPayload }) =>
      approvalPerizinan(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['perizinan'] }),
  })
}

export function useHapusPerizinan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => hapusPerizinan(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['perizinan'] }),
  })
}

export function useAkhiriPerizinan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => akhiriPerizinanLebihAwal(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['perizinan'] }),
  })
}
