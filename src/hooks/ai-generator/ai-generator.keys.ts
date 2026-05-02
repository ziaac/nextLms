import type { DraftFilterParams } from '@/types/ai-generator.types'

export const aiGeneratorKeys = {
  all:       ['ai-generator'] as const,
  drafts:    () => [...aiGeneratorKeys.all, 'drafts'] as const,
  draft:     (id: string) => [...aiGeneratorKeys.all, 'draft', id] as const,
  draftList: (filters: DraftFilterParams) => [...aiGeneratorKeys.drafts(), filters] as const,
}
