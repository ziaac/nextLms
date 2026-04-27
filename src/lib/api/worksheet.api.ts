import api from '@/lib/axios'
import type {
  WorksheetDefinition, SaveDefinitionPayload, MyWorksheetJawaban,
  GradingRekapItem, GradingDetailResult, GradeManualPayload,
  PdfConvertResult,
} from '@/types/worksheet.types'

// ── Guru: definisi ─────────────────────────────────────────────────────────

export const saveWorksheetDefinition = (payload: SaveDefinitionPayload) =>
  api.post<WorksheetDefinition>('/worksheet/definition', payload).then((r) => r.data)

export const getWorksheetDefinition = (tugasId: string) =>
  api.get<WorksheetDefinition>(`/worksheet/${tugasId}`).then((r) => r.data)

// ── Guru: grading ──────────────────────────────────────────────────────────

export const getWorksheetGradingRekap = (tugasId: string) =>
  api.get<GradingRekapItem[]>(`/worksheet/${tugasId}/grading`).then((r) => r.data)

export const getWorksheetGradingDetail = (tugasId: string, siswaId: string) =>
  api.get<GradingDetailResult>(`/worksheet/${tugasId}/grading/${siswaId}`).then((r) => r.data)

export const gradeWorksheetManual = (payload: GradeManualPayload) =>
  api.post('/worksheet/grade', payload).then((r) => r.data)

// ── Siswa ──────────────────────────────────────────────────────────────────

export const saveWorksheetDraft = (
  tugasId: string,
  jawaban: Record<string, string>,
) => api.post(`/worksheet/${tugasId}/draft`, { jawaban }).then((r) => r.data)

export const submitWorksheet = (
  tugasId: string,
  jawaban: Record<string, string>,
) => api.post(`/worksheet/${tugasId}/submit`, { jawaban }).then((r) => r.data)

export const getMyWorksheetJawaban = (tugasId: string) =>
  api.get<MyWorksheetJawaban>(`/worksheet/${tugasId}/my-jawaban`).then((r) => r.data)

// ── Upload helpers ─────────────────────────────────────────────────────────

export const uploadWorksheetImage = async (file: File): Promise<{ key: string; bucket: string }> => {
  const form = new FormData()
  form.append('file', file)
  const r = await api.post('/upload/worksheet/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return r.data
}

export const uploadWorksheetPdf = async (file: File): Promise<PdfConvertResult> => {
  const form = new FormData()
  form.append('file', file)
  const r = await api.post('/upload/worksheet/pdf', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return r.data
}

export const uploadWorksheetAudio = async (file: File): Promise<{ key: string; bucket: string }> => {
  const form = new FormData()
  form.append('file', file)
  const r = await api.post('/upload/worksheet/audio', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return r.data
}
