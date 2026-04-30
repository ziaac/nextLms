'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, Button, Select, ConfirmModal } from '@/components/ui'
import { KategoriPembayaranTable } from '@/components/pembayaran/KategoriPembayaranTable'
import { KategoriPembayaranModal } from '@/components/pembayaran/KategoriPembayaranModal'
import {
  useKategoriPembayaranList,
  useDeleteKategoriPembayaran,
  useToggleActiveKategoriPembayaran,
} from '@/hooks/pembayaran/useKategoriPembayaran'
import { getErrorMessage } from '@/lib/utils'
import type { KategoriPembayaran } from '@/types/pembayaran.types'

function KategoriPembayaranContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State untuk modal dan konfirmasi
  const [createOpen, setCreateOpen] = useState(false)
  const [editData, setEditData] = useState<KategoriPembayaran | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Ambil filter dari URL
  const isActiveParam = searchParams.get('isActive')
  const isActiveFilter = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined

  // Fetch data
  const { data, isLoading, error } = useKategoriPembayaranList({
    isActive: isActiveFilter,
  })

  // Extract data array from paginated response
  const items = data?.data ?? []
  const total = data?.meta?.total ?? 0

  // Mutations
  const deleteMutation = useDeleteKategoriPembayaran()
  const toggleMutation = useToggleActiveKategoriPembayaran()

  // Handler untuk filter status aktif
  const handleFilterChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === '') {
      params.delete('isActive')
    } else {
      params.set('isActive', value)
    }
    router.push(`?${params.toString()}`)
  }, [searchParams, router])

  // Handler untuk toggle aktif/nonaktif
  const handleToggle = useCallback(async (id: string) => {
    try {
      await toggleMutation.mutateAsync(id)
      toast.success('Status kategori berhasil diubah')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }, [toggleMutation])

  // Handler untuk hapus
  const handleDelete = useCallback(async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Kategori pembayaran berhasil dihapus')
      setDeleteId(null)
    } catch (err) {
      toast.error(getErrorMessage(err))
      setDeleteId(null)
    }
  }, [deleteId, deleteMutation])

  // Handler untuk edit
  const handleEdit = useCallback((item: KategoriPembayaran) => {
    setEditData(item)
  }, [])

  // Handler untuk close modal edit
  const handleCloseEdit = useCallback(() => {
    setEditData(null)
  }, [])

  // Tampilkan error jika fetch gagal
  useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error))
    }
  }, [error])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kategori Pembayaran"
        description={`Total ${total} kategori`}
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Tambah Kategori
          </Button>
        }
      />

      {/* Filter Status Aktif */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="max-w-xs">
          <Select
            label="Status"
            placeholder="Semua"
            value={isActiveParam ?? ''}
            onChange={(e) => handleFilterChange(e.target.value)}
            options={[
              { value: 'true', label: 'Aktif' },
              { value: 'false', label: 'Nonaktif' },
            ]}
          />
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-6">
        <KategoriPembayaranTable
          data={items}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={(id) => setDeleteId(id)}
          onToggle={handleToggle}
        />
      </div>

      {/* Modal Tambah */}
      <KategoriPembayaranModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {/* Modal Edit */}
      <KategoriPembayaranModal
        open={!!editData}
        onClose={handleCloseEdit}
        initialData={editData ?? undefined}
      />

      {/* Konfirmasi Hapus */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Kategori Pembayaran"
        description="Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  )
}

export default function KategoriPembayaranPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12">Loading...</div>}>
      <KategoriPembayaranContent />
    </Suspense>
  )
}
