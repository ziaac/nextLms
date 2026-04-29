'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, LayoutGrid, Printer } from 'lucide-react'
import { PageHeader, Button, ConfirmModal } from '@/components/ui'
import { KelasFilters }     from './_components/KelasFilters'
import { KelasTable }       from './_components/KelasTable'
import { KelasFormModal }   from './_components/KelasFormModal'
import { KelasFormBulkModal } from './_components/KelasFormBulkModal'
import { KelasDetailPanel } from './_components/KelasDetailPanel'
import { KelasStatCards }   from './_components/KelasStatCards'
import { KelasExportModal } from './_components/KelasExportModal'
import { useKelasList, useDeleteKelas } from '@/hooks/kelas/useKelas'
import { useTahunAjaranOneActive } from '@/hooks/tahun-ajaran/useTahunAjaran'
import type { Kelas, KelasFilterParams } from '@/types/kelas.types'

export default function KelasPage() {
  const router = useRouter()

  const [filters,       setFilters]       = useState<KelasFilterParams>({})
  const [isInitialized, setIsInitialized] = useState(false)
  const [formOpen,      setFormOpen]      = useState(false)
  
  const [bulkOpen,      setBulkOpen]      = useState(false)
  const [exportOpen,    setExportOpen]    = useState(false)
  const [editTarget,    setEditTarget]    = useState<Kelas | null>(null)
  const [detailTarget,  setDetailTarget]  = useState<Kelas | null>(null)
  const [deleteTarget,  setDeleteTarget]  = useState<Kelas | null>(null)

  // Ambil TA aktif sekaligus status apakah proses fetch sudah selesai (isFetched)
  const { data: taAktif, isFetched: isTaAktifFetched } = useTahunAjaranOneActive()
  
  useEffect(() => {
    // Tunggu sampai API TA Aktif benar-benar selesai loading (sukses maupun null)
    if (isTaAktifFetched && !isInitialized) {
      if (taAktif) {
        setFilters((prev) => ({ ...prev, tahunAjaranId: taAktif.id }))
      }
      // Lepaskan penahan agar tabel mulai mengambil data
      setIsInitialized(true)
    }
  }, [taAktif, isTaAktifFetched, isInitialized])

  // TA yang dipakai stat: dari filter jika ada, fallback ke TA aktif
  const statTahunAjaranId = filters.tahunAjaranId ?? taAktif?.id ?? ''

  // Lempar flag isInitialized ke hook agar tidak terjadi double-fetch
  const { data, isLoading, isError } = useKelasList(filters, isInitialized)
  const kelasList = data ?? []

  // Hitung stat dari kelasList yang sudah terfilter
  const statTotalKelas = kelasList.length
  const statTotalSiswa = useMemo(
    () => kelasList.reduce((acc, k) => acc + (k._count?.kelasSiswa ?? 0), 0),
    [kelasList]
  )
  const statTotalGuru = useMemo(() => {
    const ids = new Set(
      kelasList
        .filter((k) => k.waliKelasId)
        .map((k) => k.waliKelasId!)
    )
    return ids.size
  }, [kelasList])

  const deleteMutation = useDeleteKelas(deleteTarget?.id ?? '')

  const handleOpenCreate = useCallback(() => {
    setEditTarget(null)
    setFormOpen(true)
  }, [])

  const handleOpenEdit = useCallback((kelas: Kelas) => {
    setEditTarget(kelas)
    setFormOpen(true)
    setDetailTarget(null)
  }, [])

  const handleNavigateSiswa = useCallback((kelasId: string) => {
    router.push(`/dashboard/kelas/${kelasId}/siswa`)
  }, [router])

  const handleNavigateMapel = useCallback((kelasId: string) => {
    router.push(`/dashboard/pembelajaran?kelasId=${kelasId}`)
  }, [router])

  const handleNavigateJadwal = useCallback((kelasId: string) => {
    router.push(`/dashboard/jadwal?kelasId=${kelasId}`)
  }, [router])

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        setDeleteTarget(null)
        if (detailTarget?.id === deleteTarget.id) setDetailTarget(null)
      },
    })
  }, [deleteTarget, deleteMutation, detailTarget])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Kelas"
        description="Kelola data kelas seluruh tahun ajaran"
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<Printer size={16} />}
              onClick={() => setExportOpen(true)}
            >
              Cetak / Export
            </Button>
            <Button
              variant="secondary"
              leftIcon={<LayoutGrid size={16} />}
              onClick={() => setBulkOpen(true)}
            >
              Tambah Bulk
            </Button>
            <Button
              leftIcon={<Plus size={16} />}
              onClick={handleOpenCreate}
            >
              Tambah Kelas
            </Button>
          </>
        }
      />

      {/* Stat Cards — berubah saat filter TA berubah */}
      <KelasStatCards
        tahunAjaranId={statTahunAjaranId}
        totalKelas={statTotalKelas}
        totalSiswa={statTotalSiswa}
        totalGuru={statTotalGuru}
      />

      <KelasFilters filters={filters} onChange={setFilters} />

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-6">
        <KelasTable
          data={kelasList}
          // Tambahkan pengecekan agar indikator loading terlihat natural saat menunggu isInitialized
          isLoading={isLoading || !isInitialized}
          isError={isError}
          onRowClick={(kelas) => setDetailTarget(kelas)}
          onEdit={handleOpenEdit}
          onDelete={(kelas) => setDeleteTarget(kelas)}
          onNavigateSiswa={handleNavigateSiswa}
          onNavigateMapel={handleNavigateMapel}
          activeId={detailTarget?.id}
        />
      </div>

      <KelasFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editData={editTarget}
      />

      <KelasFormBulkModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
      />

      <KelasExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
      />

      <KelasDetailPanel
        kelas={detailTarget}
        onClose={() => setDetailTarget(null)}
        onEdit={handleOpenEdit}
        onDelete={(kelas) => setDeleteTarget(kelas)}
        onNavigateSiswa={handleNavigateSiswa}
        onNavigateMapel={handleNavigateMapel}
        onNavigateJadwal={handleNavigateJadwal}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Kelas"
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Yakin ingin menghapus kelas{' '}
          <span className="font-semibold text-gray-900 dark:text-white">
            {deleteTarget?.namaKelas}
          </span>
          ? Tindakan ini tidak dapat dibatalkan.
        </p>
      </ConfirmModal>
    </div>
  )
}