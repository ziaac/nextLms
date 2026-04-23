
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTugas,
  getListTugas,
  getDetailTugas,
  updateTugas,
  publishTugas,
  deleteTugas,
  getRekapPengumpulan,
  submitTugas,
  getMySubmission,
  getSubmissionDetail,
  updateSubmissionStatus,
  bulkCopyTugas,
} from '@/lib/api/tugas.api'
import { TugasQueryParams } from '@/types/tugas.types'
import type { UpdateSubmissionPayload } from '@/lib/api/tugas.api'

export const tugasKeys = {
  all:     (params?: TugasQueryParams) => ['tugas', 'list', params ?? {}] as const,
  detail:  (id: string) => ['tugas', 'detail', id] as const,
  rekap:   (id: string) => ['tugas', 'rekap', id] as const,
  mySubmission: (tugasId: string) => ['tugas', 'submission', 'me', tugasId] as const,
  submissionDetail: (id: string) => ['tugas', 'submission', 'detail', id] as const,
}

export function useTugasList(params: TugasQueryParams | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: tugasKeys.all(params),
    queryFn:  () => getListTugas(params!),
    enabled:  !!params && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  })
}

export function useTugasDetail(id: string | null) {
  return useQuery({
    queryKey: tugasKeys.detail(id ?? ''),
    queryFn:  () => getDetailTugas(id!),
    enabled:  !!id,
  })
}

export function useCreateTugas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: any) => createTugas(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['tugas'] }),
  })
}

export function useUpdateTugas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateTugas(id, payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['tugas'] }),
  })
}

export function usePublishTugas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => publishTugas(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['tugas'] }),
  })
}

export function useDeleteTugas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTugas(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['tugas'] }),
  })
}

export function useTugasRekap(id: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: tugasKeys.rekap(id ?? ''),
    queryFn:  () => getRekapPengumpulan(id!),
    enabled:  !!id && (options?.enabled ?? true),
  })
}

// --- SUBMISSION HOOKS ---

export function useSubmitTugas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ tugasId, payload }: { tugasId: string; payload: any }) => submitTugas(tugasId, payload),
    onSuccess:  (_, { tugasId }) => {
      qc.invalidateQueries({ queryKey: tugasKeys.mySubmission(tugasId) })
      qc.invalidateQueries({ queryKey: ['tugas', 'rekap'] })
    },
  })
}

export function useMySubmission(tugasId: string | null) {
  return useQuery({
    queryKey: tugasKeys.mySubmission(tugasId ?? ''),
    queryFn:  () => getMySubmission(tugasId!),
    enabled:  !!tugasId,
    retry:    false,   // 404 = belum submit, jangan di-retry
  })
}

export function useSubmissionDetail(id: string | null) {
  return useQuery({
    queryKey: tugasKeys.submissionDetail(id ?? ''),
    queryFn:  () => getSubmissionDetail(id!),
    enabled:  !!id,
  })
}

export function useUpdateSubmissionStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSubmissionPayload }) =>
      updateSubmissionStatus(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tugas', 'submission'] })
      qc.invalidateQueries({ queryKey: ['tugas', 'rekap'] })
    },
  })
}

export function useBulkCopyTugas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      tugasIds: string[]
      targetMataPelajaranIds: string[]
      tanggalMulai?: string
      tanggalSelesai?: string
    }) => bulkCopyTugas(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tugas'] }),
  })
}
