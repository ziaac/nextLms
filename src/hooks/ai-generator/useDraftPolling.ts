import { useQuery } from '@tanstack/react-query'
import { getDraftDetail } from '@/lib/api/ai-generator.api'
import { aiGeneratorKeys } from './ai-generator.keys'
import type { StatusDraftAI } from '@/types/ai-generator.types'

/** Status terminal — polling berhenti saat mencapai salah satu status ini */
const TERMINAL_STATUSES: StatusDraftAI[] = ['COMPLETED', 'FAILED', 'SAVED']

/**
 * Hook untuk polling status DraftAI setiap 3 detik.
 * Polling otomatis berhenti saat status mencapai COMPLETED, FAILED, atau SAVED.
 * Requirement 13.5: frontend polling setiap 3 detik.
 */
export function useDraftPolling(draftId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: aiGeneratorKeys.draft(draftId ?? ''),
    queryFn:  () => getDraftDetail(draftId!),
    enabled:  enabled && !!draftId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      // Hentikan polling jika sudah terminal state
      if (status && TERMINAL_STATUSES.includes(status)) {
        return false
      }
      return 3_000 // polling setiap 3 detik
    },
    // Jangan polling saat tab tidak aktif (Requirement 13.5)
    refetchIntervalInBackground: false,
    staleTime: 0,
  })
}
