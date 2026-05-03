'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  PageHeader,
  Button,
  Select,
  ConfirmModal,
  SlideOver,
} from '@/components/ui'
import { ArrowLeft, Sparkles } from 'lucide-react'
import {
  useDraftList,
  useDeleteDraft,
  useSaveDraft,
  useRetryDraft,
} from '@/hooks/ai-generator/useAiGenerator'
import { useDraftPolling } from '@/hooks/ai-generator/useDraftPolling'
import { DraftRiwayatTable } from '@/components/ai-generator/DraftRiwayatTable'
import { DraftEditorView } from '@/components/ai-generator/DraftEditorView'
import { RetryDraftModal } from '@/components/ai-generator/RetryDraftModal'
import { DraftStatusBadge } from '@/components/ai-generator/DraftStatusBadge'
import type {
  DraftAIListItem,
  DraftFilterParams,
  JenisKontenAI,
  ProviderAI,
  StatusDraftAI,
  SaveDraftDto,
} from '@/types/ai-generator.types'

const JENIS_OPTIONS: { value: JenisKontenAI | ''; label: string }[] = [
  { value: '',                  label: 'Semua Jenis' },
  { value: 'RPP',               label: 'RPP' },
  { value: 'MATERI_PELAJARAN',  label: 'Materi' },
  { value: 'TUGAS',             label: 'Tugas' },
]

const STATUS_OPTIONS: { value: StatusDraftAI | ''; label: string }[] = [
  { value: '',           label: 'Semua Status' },
  { value: 'PENDING',    label: 'Menunggu' },
  { value: 'PROCESSING', label: 'Memproses' },
  { value: 'COMPLETED',  label: 'Selesai' },
  { value: 'FAILED',     label: 'Gagal' },
  { value: 'SAVED',      label: 'Tersimpan' },
]

function RiwayatContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const initialDraftId = searchParams.get('draftId')

  const [page,         setPage]         = useState(1)
  const [jenisKonten,  setJenisKonten]  = useState<JenisKontenAI | ''>('')
  const [status,       setStatus]       = useState<StatusDraftAI | ''>('')
  const [openDraftId,  setOpenDraftId]  = useState<string | null>(initialDraftId)
  const [deleteItem,   setDeleteItem]   = useState<DraftAIListItem | null>(null)
  const [retryItem,    setRetryItem]    = useState<DraftAIListItem | null>(null)
  const [retryDraftId, setRetryDraftId] = useState<string | null>(null)

  const filter: DraftFilterParams = {
    page,
    limit: 20,
    jenisKonten: jenisKonten || undefined,
    status:      status || undefined,
  }

  const { data, isLoading } = useDraftList(filter)
  const deleteMutation  = useDeleteDraft()
  const saveMutation    = useSaveDraft()
  const retryMutation   = useRetryDraft()

  // Poll status draft yang sedang di-retry
  const { data: retryStatus } = useDraftPolling(retryDraftId, !!retryDraftId)

  // Reaksi terhadap hasil polling retry
  if (retryDraftId && retryStatus) {
    if (retryStatus.status === 'COMPLETED') {
      toast.success('Generate selesai! Buka draft untuk meninjau.')
      setRetryDraftId(null)
      setOpenDraftId(retryStatus.id)
    } else if (retryStatus.status === 'FAILED') {
      toast.error(retryStatus.errorMessage ?? 'Generate gagal. Coba provider lain.')
      setRetryDraftId(null)
    }
  }

  const list = data?.data ?? []
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      await deleteMutation.mutateAsync(deleteItem.id)
      toast.success('Draft berhasil dihapus')
      setDeleteItem(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus draft'
      toast.error(msg)
      setDeleteItem(null)
    }
  }

  const handleRetry = async (provider: ProviderAI, apiKey?: string) => {
    if (!retryItem) return
    try {
      const res = await retryMutation.mutateAsync({ id: retryItem.id, dto: { provider, apiKey } })
      toast.success('Draft baru dibuat. Menunggu hasil generate…')
      setRetryItem(null)
      setRetryDraftId(res.draftId)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memulai ulang generate'
      toast.error(msg)
    }
  }

  const handleSave = async (dto: SaveDraftDto) => {
    if (!openDraftId) return
    try {
      const res = await saveMutation.mutateAsync({ id: openDraftId, dto })
      toast.success('Draft berhasil disimpan sebagai konten')
      setOpenDraftId(null)
      // Redirect ke konten yang dibuat
      if (res.type === 'RPP') {
        router.push(`/dashboard/rpp/${res.savedContentId}`)
      } else if (res.type === 'MATERI_PELAJARAN') {
        router.push(`/dashboard/materi-pelajaran`)
      } else if (res.type === 'TUGAS') {
        router.push(`/dashboard/tugas`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan draft'
      toast.error(msg)
    }
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push('/dashboard/ai-generator')}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        <span className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
          <ArrowLeft className="w-3.5 h-3.5" />
        </span>
        AI Generator
      </button>

      <PageHeader
        title="Riwayat Draft AI"
        description="Daftar permintaan generate AI Anda. Buka draft yang selesai untuk meninjau dan menyimpan."
        actions={
          <Button
            leftIcon={<Sparkles size={16} />}
            onClick={() => router.push('/dashboard/ai-generator')}
          >
            Generate Baru
          </Button>
        }
      />

      {/* Banner polling retry */}
      {retryDraftId && retryStatus && (retryStatus.status === 'PENDING' || retryStatus.status === 'PROCESSING') && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-sm text-amber-700 dark:text-amber-400">
          <span className="animate-spin">⏳</span>
          <span>Sedang memproses ulang…</span>
          <DraftStatusBadge status={retryStatus.status} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="sm:w-56">
          <Select
            options={JENIS_OPTIONS}
            value={jenisKonten}
            onChange={(e) => { setJenisKonten(e.target.value as JenisKontenAI | ''); setPage(1) }}
          />
        </div>
        <div className="sm:w-56">
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => { setStatus(e.target.value as StatusDraftAI | ''); setPage(1) }}
          />
        </div>
      </div>

      <DraftRiwayatTable
        data={list}
        isLoading={isLoading}
        page={page}
        totalPages={meta.totalPages}
        total={meta.total}
        limit={meta.limit}
        onPageChange={setPage}
        onOpen={(item) => setOpenDraftId(item.id)}
        onRetry={setRetryItem}
        onDelete={setDeleteItem}
      />

      <SlideOver
        open={!!openDraftId}
        onClose={() => setOpenDraftId(null)}
        title="Tinjau & Simpan Draft AI"
        width="xl"
      >
        {openDraftId && (
          <div className="px-6 py-5">
            <DraftEditorView
              draftId={openDraftId}
              onCancel={() => setOpenDraftId(null)}
              onSave={handleSave}
              isSaving={saveMutation.isPending}
            />
          </div>
        )}
      </SlideOver>

      <RetryDraftModal
        open={!!retryItem}
        onClose={() => setRetryItem(null)}
        draft={retryItem}
        onRetry={handleRetry}
        isPending={retryMutation.isPending}
      />

      <ConfirmModal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Hapus Draft"
        description={`Yakin ingin menghapus draft "${deleteItem?.judul}"? Draft hanya bisa dihapus setelah 7 hari dari pembuatan.`}
        confirmLabel="Ya, Hapus"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

export default function AiGeneratorRiwayatPage() {
  return (
    <Suspense>
      <RiwayatContent />
    </Suspense>
  )
}
