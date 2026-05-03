'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader, Button } from '@/components/ui'
import { History } from 'lucide-react'
import { useInitiateGenerate } from '@/hooks/ai-generator/useAiGenerator'
import { useDraftPolling } from '@/hooks/ai-generator/useDraftPolling'
import { GenerateWizard } from '@/components/ai-generator/GenerateWizard'
import { GeneratingProgress } from '@/components/ai-generator/GeneratingProgress'
import type { InitiateGenerateDto } from '@/types/ai-generator.types'

export default function AiGeneratorPage() {
  const router = useRouter()
  const [draftId,      setDraftId]      = useState<string | null>(null)
  const [resetCounter, setResetCounter] = useState(0)
  const [lastDto,      setLastDto]      = useState<InitiateGenerateDto | null>(null)

  const initiateMutation = useInitiateGenerate()
  const { data: draft }  = useDraftPolling(draftId, !!draftId)

  const handleSubmit = async (dto: InitiateGenerateDto) => {
    try {
      const res = await initiateMutation.mutateAsync(dto)
      setDraftId(res.draftId)
      setLastDto(dto)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memulai generate'
      toast.error(msg)
    }
  }

  // Watch terminal states from polling
  useEffect(() => {
    if (!draft || !draftId) return

    if (draft.status === 'COMPLETED') {
      // Tidak langsung redirect — biarkan user lihat animasi selesai dulu
      // Tombol "Buka Hasil" di GeneratingProgress yang akan redirect
    } else if (draft.status === 'FAILED') {
      // Error ditampilkan di GeneratingProgress, reset wizard setelah delay
      const timer = setTimeout(() => {
        setDraftId(null)
        setLastDto(null)
        setResetCounter((c) => c + 1)
      }, 4_000)
      return () => clearTimeout(timer)
    }
  }, [draft, draftId])

  const isGenerating = !!draftId

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

      {/* Animasi progress saat generating */}
      {isGenerating && draft && (
        <GeneratingProgress
          backendStatus={draft.status}
          provider={draft.provider}
          judul={lastDto?.judul}
          errorMessage={draft.errorMessage}
          onViewHistory={() => router.push(`/dashboard/ai-generator/riwayat?draftId=${draft.id}`)}
        />
      )}

      {/* Wizard — disembunyikan saat generating, muncul kembali setelah selesai/gagal */}
      {!isGenerating && (
        <GenerateWizard
          key={resetCounter}
          onSubmit={handleSubmit}
          isPending={initiateMutation.isPending}
        />
      )}
    </div>
  )
}
