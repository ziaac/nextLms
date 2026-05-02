'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader, Button } from '@/components/ui'
import { History } from 'lucide-react'
import { useInitiateGenerate } from '@/hooks/ai-generator/useAiGenerator'
import { useDraftPolling } from '@/hooks/ai-generator/useDraftPolling'
import { GenerateWizard } from '@/components/ai-generator/GenerateWizard'
import { DraftStatusBadge } from '@/components/ai-generator/DraftStatusBadge'
import type { InitiateGenerateDto } from '@/types/ai-generator.types'

export default function AiGeneratorPage() {
  const router = useRouter()
  const [draftId,        setDraftId]        = useState<string | null>(null)
  const [resetCounter,   setResetCounter]   = useState(0)

  const initiateMutation = useInitiateGenerate()
  const { data: draft }  = useDraftPolling(draftId, !!draftId)

  const handleSubmit = async (dto: InitiateGenerateDto) => {
    try {
      const res = await initiateMutation.mutateAsync(dto)
      setDraftId(res.draftId)
      toast.success('Permintaan dikirim, AI sedang memproses…')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memulai generate'
      toast.error(msg)
    }
  }

  // Watch terminal states from polling
  useEffect(() => {
    if (!draft || !draftId) return

    if (draft.status === 'COMPLETED') {
      toast.success('AI selesai membuat konten. Buka riwayat untuk meninjau.')
      router.push(`/dashboard/ai-generator/riwayat?draftId=${draft.id}`)
    } else if (draft.status === 'FAILED') {
      toast.error(draft.errorMessage ?? 'AI gagal memproses permintaan.')
      setDraftId(null)
      setResetCounter((c) => c + 1)
    }
  }, [draft, draftId, router])

  const isGenerating = !!draftId && draft?.status !== 'FAILED' && draft?.status !== 'COMPLETED'

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="AI Generator"
        description="Buat RPP, materi pelajaran, atau tugas dengan bantuan AI."
        actions={
          <Button
            variant="secondary"
            leftIcon={<History size={16} />}
            onClick={() => router.push('/dashboard/ai-generator/riwayat')}
          >
            Lihat Riwayat
          </Button>
        }
      />

      {isGenerating && draft && (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                AI sedang memproses permintaan Anda
              </p>
              <DraftStatusBadge status={draft.status} />
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
              Status akan otomatis diperbarui setiap 3 detik. Anda dapat menutup halaman ini —
              hasil akan tersedia di Riwayat.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => router.push('/dashboard/ai-generator/riwayat')}
          >
            Buka Riwayat
          </Button>
        </div>
      )}

      <GenerateWizard
        key={resetCounter}
        onSubmit={handleSubmit}
        isPending={initiateMutation.isPending || isGenerating}
      />
    </div>
  )
}
