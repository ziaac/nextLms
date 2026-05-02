'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader, Button, ConfirmModal } from '@/components/ui'
import { Plus, Sparkles } from 'lucide-react'
import { useRppList, useCreateRpp, usePublishRpp, useDeleteRpp } from '@/hooks/rpp/useRpp'
import { RppTable } from '@/components/rpp/RppTable'
import { RppModal } from '@/components/rpp/RppModal'
import type { RppListItem, CreateRppDto, RppFilterParams } from '@/types/rpp.types'

function RppPageContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [page,      setPage]      = useState(1)
  const [formOpen,  setFormOpen]  = useState(false)
  const [deleteItem, setDeleteItem] = useState<RppListItem | null>(null)
  const [formError,  setFormError]  = useState<string | null>(null)

  const filter: RppFilterParams = {
    page,
    limit: 20,
    semesterId:      searchParams.get('semesterId')      ?? undefined,
    mataPelajaranId: searchParams.get('mataPelajaranId') ?? undefined,
    status:          (searchParams.get('status') as RppFilterParams['status']) ?? undefined,
  }

  const { data, isLoading } = useRppList(filter)
  const createMutation  = useCreateRpp()
  const publishMutation = usePublishRpp()
  const deleteMutation  = useDeleteRpp()

  const rppList   = data?.data ?? []
  const meta      = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 }

  const handleCreate = async (dto: CreateRppDto) => {
    setFormError(null)
    try {
      const rpp = await createMutation.mutateAsync(dto)
      toast.success('RPP berhasil dibuat')
      setFormOpen(false)
      router.push(`/dashboard/rpp/${rpp.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat RPP'
      setFormError(msg)
    }
  }

  const handlePublish = async (item: RppListItem) => {
    try {
      await publishMutation.mutateAsync(item.id)
      toast.success('RPP berhasil dipublikasi')
    } catch {
      toast.error('Gagal mempublikasi RPP')
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      await deleteMutation.mutateAsync(deleteItem.id)
      toast.success('RPP berhasil dihapus')
      setDeleteItem(null)
    } catch {
      toast.error('Gagal menghapus RPP')
      setDeleteItem(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="RPP Saya"
        description="Rencana Pelaksanaan Pembelajaran — buat dan kelola RPP Anda"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              leftIcon={<Sparkles size={16} />}
              onClick={() => router.push('/dashboard/ai-generator')}
            >
              Generate dengan AI
            </Button>
            <Button leftIcon={<Plus size={16} />} onClick={() => setFormOpen(true)}>
              Buat RPP
            </Button>
          </div>
        }
      />

      <RppTable
        data={rppList}
        isLoading={isLoading}
        page={page}
        totalPages={meta.totalPages}
        total={meta.total}
        limit={meta.limit}
        onPageChange={setPage}
        onEdit={(item) => router.push(`/dashboard/rpp/${item.id}`)}
        onPublish={handlePublish}
        onDelete={setDeleteItem}
        onOpen={(item) => router.push(`/dashboard/rpp/${item.id}`)}
      />

      <RppModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setFormError(null) }}
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
        error={formError}
      />

      <ConfirmModal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Hapus RPP"
        description={`Yakin ingin menghapus RPP "${deleteItem?.judul}"?`}
        confirmLabel="Ya, Hapus"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

export default function RppPage() {
  return (
    <Suspense>
      <RppPageContent />
    </Suspense>
  )
}
