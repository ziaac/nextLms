'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { io } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

import { useAuthStore } from '@/stores/auth.store'
import { PageHeader, Button, Select, Pagination, ConfirmModal } from '@/components/ui'
import { AnnouncementList } from '@/components/announcement/AnnouncementList'
import { AnnouncementModal } from '@/components/announcement/AnnouncementModal'
import { AnnouncementDetailModal } from '@/components/announcement/AnnouncementDetailModal'
import {
  useAnnouncements,
  useAnnouncementsAdmin,
  announcementKeys,
  useDeleteAnnouncement,
} from '@/hooks/announcement'
import type { Announcement, AnnouncementPriority } from '@/types/announcement.types'

// ─── Priority filter options ───────────────────────────────────────────────────

const PRIORITY_FILTER_OPTIONS = [
  { value: 'LOW',    label: 'Rendah' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH',   label: 'Tinggi' },
  { value: 'URGENT', label: 'Mendesak' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function AnnouncementContent() {
  const { user } = useAuthStore()

  const canCreate = ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'STAFF_TU'].includes(user?.role ?? '')
  const canDelete = ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH'].includes(user?.role ?? '')
  const canEdit   = canCreate

  // ─── State ──────────────────────────────────────────────────────────────────

  const [page,           setPage]           = useState(1)
  const [filterPriority, setFilterPriority] = useState<AnnouncementPriority | ''>('')
  const [isAdminView,    setIsAdminView]    = useState(false)
  const [selectedId,     setSelectedId]     = useState<string | null>(null)
  const [editItem,       setEditItem]       = useState<Announcement | null>(null)
  const [modalOpen,      setModalOpen]      = useState(false)
  const [detailOpen,     setDetailOpen]     = useState(false)
  const [deleteTarget,   setDeleteTarget]   = useState<Announcement | null>(null)
  const [confirmOpen,    setConfirmOpen]    = useState(false)

  // ─── Data fetching ───────────────────────────────────────────────────────────
  // Hooks cannot be called conditionally — call both and pick based on isAdminView

  const queryParams = {
    page,
    limit: 10,
    ...(filterPriority ? { priority: filterPriority } : {}),
  }

  const userQuery  = useAnnouncements(isAdminView ? undefined : queryParams)
  const adminQuery = useAnnouncementsAdmin(isAdminView ? queryParams : undefined)

  const { data, isLoading, error } = isAdminView ? adminQuery : userQuery

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const deleteMutation = useDeleteAnnouncement()

  // ─── Auto-open detail modal dari query param ?detail={id} ───────────────────
  // Notifikasi pengumuman mengarahkan ke route ini; query param dibersihkan
  // setelah modal dibuka agar tidak terus aktif saat user navigasi ulang.

  const searchParams = useSearchParams()
  const router       = useRouter()
  const pathname     = usePathname()

  useEffect(() => {
    const detailId = searchParams.get('detail')
    if (detailId) {
      setSelectedId(detailId)
      setDetailOpen(true)
      router.replace(pathname, { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // ─── Socket.IO realtime ──────────────────────────────────────────────────────

  const qc = useQueryClient()

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '', {
      withCredentials: true,
      transports: ['websocket'],
    })

    socket.on('announcement:baru',   () => qc.invalidateQueries({ queryKey: announcementKeys.lists }))
    socket.on('announcement:update', () => qc.invalidateQueries({ queryKey: announcementKeys.lists }))
    socket.on('announcement:hapus',  () => qc.invalidateQueries({ queryKey: announcementKeys.lists }))

    return () => {
      socket.disconnect()
    }
  }, [qc])

  // ─── Error handling ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (error) toast.error('Gagal memuat pengumuman')
  }, [error])

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function handleCreateClick() {
    setEditItem(null)
    setModalOpen(true)
  }

  function handleEditClick(item: Announcement) {
    setEditItem(item)
    setModalOpen(true)
  }

  function handleDetailClick(item: Announcement) {
    setSelectedId(item.id)
    setDetailOpen(true)
  }

  function handleDeleteClick(item: Announcement) {
    setDeleteTarget(item)
    setConfirmOpen(true)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await deleteMutation.mutateAsync(deleteTarget.id)
    setConfirmOpen(false)
    setDeleteTarget(null)
  }

  function handleModalClose() {
    setModalOpen(false)
    setEditItem(null)
  }

  function handleDetailClose() {
    setDetailOpen(false)
    setSelectedId(null)
  }

  function handleConfirmClose() {
    if (deleteMutation.isPending) return
    setConfirmOpen(false)
    setDeleteTarget(null)
  }

  function handleFilterPriorityChange(e: { target: { value: string } }) {
    setFilterPriority(e.target.value as AnnouncementPriority | '')
    setPage(1)
  }

  function handleAdminViewToggle() {
    setIsAdminView((prev) => !prev)
    setPage(1)
  }

  // ─── Pagination ──────────────────────────────────────────────────────────────

  const meta = data?.meta

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Pengumuman"
        description="Informasi dan pengumuman resmi sekolah"
        actions={
          canCreate ? (
            <Button onClick={handleCreateClick} size="sm">
              <Plus size={16} className="mr-1.5" />
              Buat Pengumuman
            </Button>
          ) : undefined
        }
      />

      {/* Toolbar: Admin toggle + Priority filter */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Admin view toggle — only for canCreate */}
        {canCreate && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={isAdminView}
              onClick={handleAdminViewToggle}
              className={[
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                'transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
                isAdminView
                  ? 'bg-emerald-600'
                  : 'bg-gray-200 dark:bg-gray-700',
              ].join(' ')}
            >
              <span
                aria-hidden="true"
                className={[
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0',
                  'transition duration-200 ease-in-out',
                  isAdminView ? 'translate-x-5' : 'translate-x-0',
                ].join(' ')}
              />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 select-none">
              Tampilan Admin
            </span>
          </div>
        )}

        {/* Priority filter */}
        <div className="w-44">
          <Select
            id="filter-priority"
            options={PRIORITY_FILTER_OPTIONS}
            placeholder="Semua Prioritas"
            value={filterPriority}
            onChange={handleFilterPriorityChange}
            size="sm"
          />
        </div>
      </div>

      {/* Announcement list */}
      <AnnouncementList
        items={data?.data ?? []}
        isLoading={isLoading}
        canEdit={canEdit}
        canDelete={canDelete}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        onDetailClick={handleDetailClick}
      />

      {/* Pagination */}
      {meta && (
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={10}
          onPageChange={setPage}
        />
      )}

      {/* Create / Edit modal */}
      <AnnouncementModal
        open={modalOpen}
        onClose={handleModalClose}
        editItem={editItem}
      />

      {/* Detail modal */}
      <AnnouncementDetailModal
        open={detailOpen}
        onClose={handleDetailClose}
        announcementId={selectedId}
      />

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={confirmOpen}
        onClose={handleConfirmClose}
        onConfirm={handleConfirmDelete}
        title="Hapus Pengumuman"
        confirmLabel="Hapus"
        isLoading={deleteMutation.isPending}
        variant="danger"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Apakah Anda yakin ingin menghapus pengumuman{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            &ldquo;{deleteTarget?.judul}&rdquo;
          </span>
          ? Tindakan ini tidak dapat dibatalkan.
        </p>
      </ConfirmModal>
    </div>
  )
}
