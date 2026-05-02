import api from '@/lib/axios'
import type {
  DraftAI,
  DraftListResponse,
  InitiateGenerateDto,
  InitiateGenerateResponse,
  SaveDraftDto,
  SaveDraftResponse,
  DraftFilterParams,
} from '@/types/ai-generator.types'

const BASE = '/ai-generator'

export const initiateGenerate = (dto: InitiateGenerateDto) =>
  api.post<InitiateGenerateResponse>(`${BASE}/generate`, dto).then((r) => r.data)

export const getDraftList = (filter?: DraftFilterParams) =>
  api.get<DraftListResponse>(`${BASE}/draft`, { params: filter }).then((r) => r.data)

export const getDraftDetail = (id: string) =>
  api.get<DraftAI>(`${BASE}/draft/${id}`).then((r) => r.data)

export const saveDraft = (id: string, dto: SaveDraftDto) =>
  api.post<SaveDraftResponse>(`${BASE}/draft/${id}/save`, dto).then((r) => r.data)

export const deleteDraft = (id: string) =>
  api.delete<{ message: string }>(`${BASE}/draft/${id}`).then((r) => r.data)
