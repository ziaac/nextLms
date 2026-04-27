import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getWorksheetDefinition, saveWorksheetDefinition,
  getWorksheetGradingRekap, getWorksheetGradingDetail,
  gradeWorksheetManual, saveWorksheetDraft, submitWorksheet,
  getMyWorksheetJawaban,
} from '@/lib/api/worksheet.api'
import type { SaveDefinitionPayload, GradeManualPayload } from '@/types/worksheet.types'

// ── Query keys ─────────────────────────────────────────────────────────────

export const WORKSHEET_KEYS = {
  definition:   (id: string) => ['worksheet', 'def', id]          as const,
  myJawaban:    (id: string) => ['worksheet', 'jawaban', 'me', id] as const,
  grading:      (id: string) => ['worksheet', 'grading', id]       as const,
  gradingSiswa: (id: string, siswaId: string) =>
    ['worksheet', 'grading', id, siswaId]                          as const,
}

// ── Guru: definisi ─────────────────────────────────────────────────────────

export function useWorksheetDefinition(tugasId: string | null) {
  return useQuery({
    queryKey: WORKSHEET_KEYS.definition(tugasId ?? ''),
    queryFn:  () => getWorksheetDefinition(tugasId!),
    enabled:  !!tugasId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSaveWorksheetDefinition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveDefinitionPayload) => saveWorksheetDefinition(payload),
    onSuccess:  (_, payload) => {
      void qc.invalidateQueries({ queryKey: WORKSHEET_KEYS.definition(payload.tugasId) })
    },
  })
}

// ── Guru: grading ──────────────────────────────────────────────────────────

export function useWorksheetGrading(tugasId: string | null) {
  return useQuery({
    queryKey: WORKSHEET_KEYS.grading(tugasId ?? ''),
    queryFn:  () => getWorksheetGradingRekap(tugasId!),
    enabled:  !!tugasId,
  })
}

export function useWorksheetGradingDetail(tugasId: string | null, siswaId: string | null) {
  return useQuery({
    queryKey: WORKSHEET_KEYS.gradingSiswa(tugasId ?? '', siswaId ?? ''),
    queryFn:  () => getWorksheetGradingDetail(tugasId!, siswaId!),
    enabled:  !!tugasId && !!siswaId,
  })
}

export function useGradeWorksheetManual() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: GradeManualPayload) => gradeWorksheetManual(payload),
    onSuccess:  () => {
      // Invalidate grading queries generically — tugasId not known here
      void qc.invalidateQueries({ queryKey: ['worksheet', 'grading'] })
    },
  })
}

// ── Siswa ──────────────────────────────────────────────────────────────────

export function useMyWorksheetJawaban(tugasId: string | null) {
  return useQuery({
    queryKey: WORKSHEET_KEYS.myJawaban(tugasId ?? ''),
    queryFn:  () => getMyWorksheetJawaban(tugasId!),
    enabled:  !!tugasId,
    staleTime: 0, // selalu fresh (draft bisa berubah)
  })
}

export function useSaveWorksheetDraft() {
  return useMutation({
    mutationFn: ({ tugasId, jawaban }: { tugasId: string; jawaban: Record<string, string> }) =>
      saveWorksheetDraft(tugasId, jawaban),
    // Sengaja tidak invalidate — state lokal player lebih up-to-date
  })
}

export function useSubmitWorksheet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ tugasId, jawaban }: { tugasId: string; jawaban: Record<string, string> }) =>
      submitWorksheet(tugasId, jawaban),
    onSuccess:  (_, { tugasId }) => {
      void qc.invalidateQueries({ queryKey: WORKSHEET_KEYS.myJawaban(tugasId) })
    },
  })
}
