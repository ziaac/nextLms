'use client'

import { Suspense, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useTahunAjaranOneActive } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useKalenderBulan } from '@/hooks/kalender-akademik'
import { useDeleteKalender } from '@/hooks/kalender-akademik'
import { PageHeader, Skeleton, ConfirmModal, Button } from '@/components/ui'
import { KalenderGrid } from '@/components/kalender/KalenderGrid'
import { KalenderLegenda } from '@/components/kalender/KalenderLegenda'
import { KalenderEventModal } from '@/components/kalender/KalenderEventModal'
import type { KalenderAkademik, TipeKalender } from '@/types/kalender-akademik.types'

// ─── Konstanta ────────────────────────────────────────────────────────────────

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

// ─── Inner Component ──────────────────────────────────────────────────────────

function KalenderContent() {
  const { user } = useAuthStore()
  const canEdit = ['SUPER_ADMIN', 'ADMIN', 'STAFF_TU'].includes(user?.role ?? '')

  // Tahun ajaran aktif
  const { data: tahunAjaranAktif, isLoading: loadingTahunAjaran } = useTahunAjaranOneActive()
  const tahunAjaranId = tahunAjaranAktif?.id ?? ''

  // State navigasi bulan
  const now = new Date()
  const [bulan, setBulan] = useState<number>(now.getMonth() + 1)
  const [tahun, setTahun] = useState<number>(now.getFullYear())

  // State filter & modal
  const [filterTipe, setFilterTipe] = useState<TipeKalender | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<KalenderAkademik | null>(null)
  const [modalMode, setModalMode] = useState<'detail' | 'create' | 'edit'>('detail')
  const [modalOpen, setModalOpen] = useState(false)

  // State konfirmasi hapus
  const [deleteTarget, setDeleteTarget] = useState<KalenderAkademik | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Fetch data kalender
  const {
    data: events = [],
    isLoading: loadingEvents,
    error,
  } = useKalenderBulan({ tahunAjaranId, bulan, tahun })

  // Mutasi hapus
  const deleteMutation = useDeleteKalender()

  // Tampilkan error via toast
  useEffect(() => {
    if (error) {
      toast.error('Gagal memuat data kalender')
    }
  }, [error])

  // ─── Navigasi bulan ─────────────────────────────────────────────────────────

  function prevBulan() {
    if (bulan === 1) {
      setBulan(12)
      setTahun((t) => t - 1)
    } else {
      setBulan((b) => b - 1)
    }
  }

  function nextBulan() {
    if (bulan === 12) {
      setBulan(1)
      setTahun((t) => t + 1)
    } else {
      setBulan((b) => b + 1)
    }
  }

  // ─── Handler event ──────────────────────────────────────────────────────────

  function handleEventClick(event: KalenderAkademik) {
    setSelectedEvent(event)
    setModalMode('detail')
    setModalOpen(true)
  }

  function handleEditClick(event: KalenderAkademik) {
    setSelectedEvent(event)
    setModalMode('edit')
    setModalOpen(true)
  }

  function handleDeleteClick(event: KalenderAkademik) {
    setDeleteTarget(event)
    setConfirmOpen(true)
  }

  function handleTambahEvent() {
    setSelectedEvent(null)
    setModalMode('create')
    setModalOpen(true)
  }

  function handleModalClose() {
    setModalOpen(false)
    setSelectedEvent(null)
  }

  function handleConfirmClose() {
    setConfirmOpen(false)
    setDeleteTarget(null)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await deleteMutation.mutateAsync(deleteTarget.id)
    handleConfirmClose()
  }

  // ─── Loading state ──────────────────────────────────────────────────────────

  if (loadingTahunAjaran) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }

  // ─── Tidak ada tahun ajaran aktif ────────────────────────────────────────────

  if (!tahunAjaranId) {
    return (
      <div className="p-6">
        <PageHeader title="Kalender Akademik" />
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700 py-16 text-center">
          <p className="text-base font-medium text-gray-500 dark:text-gray-400">
            Tidak ada tahun ajaran aktif
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Aktifkan tahun ajaran terlebih dahulu untuk melihat kalender akademik.
          </p>
        </div>
      </div>
    )
  }

  // ─── Render utama ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <PageHeader
        title="Kalender Akademik"
        description={tahunAjaranAktif?.nama}
        actions={
          canEdit ? (
            <Button onClick={handleTambahEvent} size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              Tambah Event
            </Button>
          ) : undefined
        }
      />

      {/* Navigasi bulan */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevBulan}
          aria-label="Bulan sebelumnya"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {NAMA_BULAN[bulan - 1]} {tahun}
        </h2>

        <button
          type="button"
          onClick={nextBulan}
          aria-label="Bulan berikutnya"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Legenda / filter tipe */}
      <KalenderLegenda filterTipe={filterTipe} onFilterChange={setFilterTipe} />

      {/* Grid kalender */}
      {loadingEvents ? (
        <Skeleton className="h-[500px] w-full" />
      ) : (
        <KalenderGrid
          tahun={tahun}
          bulan={bulan}
          events={events}
          filterTipe={filterTipe}
          canEdit={canEdit}
          onEventClick={handleEventClick}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
        />
      )}

      {/* Modal event (detail / create / edit) */}
      <KalenderEventModal
        open={modalOpen}
        onClose={handleModalClose}
        mode={modalMode}
        event={selectedEvent}
        tahunAjaranId={tahunAjaranId}
      />

      {/* Konfirmasi hapus */}
      <ConfirmModal
        open={confirmOpen}
        onClose={handleConfirmClose}
        onConfirm={handleConfirmDelete}
        title="Hapus Event Kalender"
        isLoading={deleteMutation.isPending}
        variant="danger"
        confirmLabel="Hapus"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Apakah Anda yakin ingin menghapus event{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            &ldquo;{deleteTarget?.judul}&rdquo;
          </span>
          ? Tindakan ini tidak dapat dibatalkan.
        </p>
      </ConfirmModal>
    </div>
  )
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function KalenderPage() {
  return (
    <Suspense>
      <KalenderContent />
    </Suspense>
  )
}
