'use client'

import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Skeleton, Button } from '@/components/ui'
import { ArrowLeft } from 'lucide-react'
import { useRppDetail, useUpdateRpp, usePublishRpp } from '@/hooks/rpp/useRpp'
import { RppEditor } from '@/components/rpp/RppEditor'

export default function RppDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()

  const { data: rpp, isLoading, isError } = useRppDetail(id)
  const updateMutation  = useUpdateRpp()
  const publishMutation = usePublishRpp()

  const handleSave = async (konten: Record<string, unknown>) => {
    try {
      await updateMutation.mutateAsync({ id, dto: { konten } })
      toast.success('RPP berhasil disimpan')
    } catch {
      toast.error('Gagal menyimpan RPP')
    }
  }

  const handlePublish = async () => {
    try {
      await publishMutation.mutateAsync(id)
      toast.success('RPP berhasil dipublikasi')
    } catch {
      toast.error('Gagal mempublikasi RPP')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !rpp) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-sm">RPP tidak ditemukan atau Anda tidak memiliki akses.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/dashboard/rpp')}>
          Kembali ke Daftar RPP
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <button
        type="button"
        onClick={() => router.push('/dashboard/rpp')}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        <span className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
          <ArrowLeft className="w-3.5 h-3.5" />
        </span>
        Daftar RPP
      </button>

      <RppEditor
        rpp={rpp}
        onSave={handleSave}
        onPublish={handlePublish}
        isSaving={updateMutation.isPending}
        isPublishing={publishMutation.isPending}
      />
    </div>
  )
}
