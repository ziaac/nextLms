'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader, Button, ConfirmModal } from '@/components/ui'
import { Plus } from 'lucide-react'
import {
  useKurikulumList,
  useCreateKurikulum,
  useUpdateKurikulum,
  useActivateKurikulum,
  useDeleteKurikulum,
  useUpsertFormatBaku,
} from '@/hooks/kurikulum/useKurikulum'
import { KurikulumTable }          from '@/components/kurikulum/KurikulumTable'
import { KurikulumModal }          from '@/components/kurikulum/KurikulumModal'
import { ActivateKurikulumModal }  from '@/components/kurikulum/ActivateKurikulumModal'
import { FormatBakuModal }         from '@/components/kurikulum/FormatBakuModal'
import type { Kurikulum, CreateKurikulumDto, CreateFormatBakuDto } from '@/types/kurikulum.types'

export default function KurikulumPage() {
  const { data: kurikulumList = [], isLoading } = useKurikulumList()

  const createMutation   = useCreateKurikulum()
  const updateMutation   = useUpdateKurikulum()
  const activateMutation = useActivateKurikulum()
  const deleteMutation   = useDeleteKurikulum()
  const upsertFormatMutation = useUpsertFormatBaku()

  // ── Modal state ───────────────────────────────────────────────
  const [formOpen,     setFormOpen]     = useState(false)
  const [editItem,     setEditItem]     = useState<Kurikulum | null>(null)
  const [activateItem, setActivateItem] = useState<Kurikulum | null>(null)
  const [deleteItem,   setDeleteItem]   = useState<Kurikulum | null>(null)
  const [formatItem,   setFormatItem]   = useState<Kurikulum | null>(null)
  const [formError,    setFormError]    = useState<string | null>(null)
  const [formatError,  setFormatError]  = useState<string | null>(null)

  const currentActive = kurikulumList.find((k) => k.isActive) ?? null

  // ── Handlers ──────────────────────────────────────────────────
  const handleFormSubmit = async (dto: CreateKurikulumDto) => {
    setFormError(null)
    try {
      if (editItem) {
        await updateMutation.mutateAsync({ id: editItem.id, dto })
        toast.success('Kurikulum berhasil diperbarui')
      } else {
        await createMutation.mutateAsync(dto)
        toast.success('Kurikulum berhasil ditambahkan')
      }
      setFormOpen(false)
      setEditItem(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan kurikulum'
      setFormError(msg)
    }
  }

  const handleActivate = async () => {
    if (!activateItem) return
    try {
      await activateMutation.mutateAsync(activateItem.id)
      toast.success(`Kurikulum "${activateItem.nama}" berhasil diaktifkan`)
      setActivateItem(null)
    } catch {
      toast.error('Gagal mengaktifkan kurikulum')
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      await deleteMutation.mutateAsync(deleteItem.id)
      toast.success('Kurikulum berhasil dihapus')
      setDeleteItem(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus kurikulum'
      toast.error(msg)
      setDeleteItem(null)
    }
  }

  const handleFormatBakuSubmit = async (dto: CreateFormatBakuDto) => {
    if (!formatItem) return
    setFormatError(null)
    try {
      await upsertFormatMutation.mutateAsync({ kurikulumId: formatItem.id, dto })
      toast.success('Format baku berhasil disimpan')
      setFormatItem(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan format baku'
      setFormatError(msg)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Kurikulum"
        description="Kelola kurikulum sekolah dan format baku dokumen pembelajaran"
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={() => { setEditItem(null); setFormOpen(true) }}>
            Tambah Kurikulum
          </Button>
        }
      />

      <KurikulumTable
        data={kurikulumList}
        isLoading={isLoading}
        onEdit={(item) => { setEditItem(item); setFormOpen(true) }}
        onActivate={setActivateItem}
        onDelete={setDeleteItem}
        onFormatBaku={setFormatItem}
      />

      {/* Modal create/edit */}
      <KurikulumModal
        open={formOpen || !!editItem}
        onClose={() => { setFormOpen(false); setEditItem(null); setFormError(null) }}
        onSubmit={handleFormSubmit}
        editItem={editItem}
        isPending={createMutation.isPending || updateMutation.isPending}
        error={formError}
      />

      {/* Modal konfirmasi aktivasi */}
      <ActivateKurikulumModal
        open={!!activateItem}
        onClose={() => setActivateItem(null)}
        onConfirm={handleActivate}
        targetItem={activateItem}
        currentActive={currentActive}
        isPending={activateMutation.isPending}
      />

      {/* Modal format baku */}
      <FormatBakuModal
        open={!!formatItem}
        onClose={() => { setFormatItem(null); setFormatError(null) }}
        onSubmit={handleFormatBakuSubmit}
        kurikulum={formatItem}
        isPending={upsertFormatMutation.isPending}
        error={formatError}
      />

      {/* Modal konfirmasi hapus */}
      <ConfirmModal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Hapus Kurikulum"
        description={`Yakin ingin menghapus kurikulum "${deleteItem?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
