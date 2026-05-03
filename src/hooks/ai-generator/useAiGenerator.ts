import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  initiateGenerate,
  getDraftList,
  getDraftDetail,
  saveDraft,
  retryDraft,
  deleteDraft,
} from '@/lib/api/ai-generator.api'
import type {
  InitiateGenerateDto,
  RetryDraftDto,
  SaveDraftDto,
  DraftFilterParams,
} from '@/types/ai-generator.types'
import { aiGeneratorKeys } from './ai-generator.keys'

export function useInitiateGenerate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: InitiateGenerateDto) => initiateGenerate(dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: aiGeneratorKeys.drafts() }),
  })
}

export function useDraftList(filter: DraftFilterParams = {}) {
  return useQuery({
    queryKey: aiGeneratorKeys.draftList(filter),
    queryFn:  () => getDraftList(filter),
    staleTime: 0,
  })
}

export function useDraftDetail(id: string | null) {
  return useQuery({
    queryKey: aiGeneratorKeys.draft(id ?? ''),
    queryFn:  () => getDraftDetail(id!),
    enabled:  !!id,
    staleTime: 0,
  })
}

export function useSaveDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: SaveDraftDto }) => saveDraft(id, dto),
    onSuccess:  (_data, { id }) => {
      qc.invalidateQueries({ queryKey: aiGeneratorKeys.drafts() })
      qc.invalidateQueries({ queryKey: aiGeneratorKeys.draft(id) })
    },
  })
}

export function useRetryDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: RetryDraftDto }) => retryDraft(id, dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: aiGeneratorKeys.drafts() }),
  })
}

export function useDeleteDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDraft(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: aiGeneratorKeys.drafts() }),
  })
}
