'use client'

import { useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter }            from 'next/navigation'
import { useAuthStore }          from '@/stores/auth.store'
import { PageHeader }            from '@/components/ui'
import { Plus, Copy, Archive, ArrowLeft, AlertTriangle, Trash2 } from 'lucide-react'
import { useDokumenPengajaranList, useHapusDokumenPengajaran } from '@/hooks/dokumen-pengajaran/useDokumenPengajaran'
import { useSemesterActive }        from '@/hooks/semester/useSemester'
import { useMataPelajaranList }     from '@/hooks/mata-pelajaran/useMataPelajaran'
import { Modal, Button, Spinner } from '@/components/ui'
import { DokumenPengajaranFilterBar }   from './_components/DokumenPengajaranFilterBar'
import { DokumenPengajaranTable }       from './_components/DokumenPengajaranTable'
import { DokumenPengajaranFormModal }   from './_components/DokumenPengajaranFormModal'
import { DokumenPengajaranDetailModal } from './_components/DokumenPengajaranDetailModal'
import { DokumenBulkRolloverModal }     from './_components/DokumenBulkRolloverModal'
import { DokumenBulkAddModal }          from './_components/DokumenBulkAddModal'
import { DokumenArsipSlideOver }        from './_components/DokumenArsipSlideOver'
import type { DokumenPengajaranItem } from '@/types/dokumen-pengajaran.types'
import type { JenisDokumen, StatusDokumenPengajaran } from '@/types/enums'

const REVIEW_ROLES = ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA']
const UPLOAD_ROLES = ['GURU', 'WALI_KELAS', 'ADMIN', 'SUPER_ADMIN']

export default function DokumenPengajaranPage() {
  const router    = useRouter()
  const { user }  = useAuthStore()

  const isGuru    = user?.role === 'GURU' || user?.role === 'WALI_KELAS'
  const canReview = REVIEW_ROLES.includes(user?.role ?? '')
  const canUpload = UPLOAD_ROLES.includes(user?.role ?? '')
  const isAdmin   = !isGuru

  // ── Filter dasar ─────────────────────────────────────────────
  const [page,         setPage]         = useState(1)
  const [status,       setStatus]       = useState<StatusDokumenPengajaran | ''>('')
  const [jenisDokumen, setJenisDokumen] = useState<JenisDokumen | ''>('')

  // ── Filter admin ─────────────────────────────────────────────
  const [tahunAjaranId,  setTahunAjaranId]  = useState('')
  const [semesterId,     setSemesterId]     = useState('')
  const [tingkatKelasId, setTingkatKelasId] = useState('')
  const [kelasId,        setKelasId]        = useState('')
  const [filterGuruId,   setFilterGuruId]   = useState('')

  // ── Modals ───────────────────────────────────────────────────
  const [formOpen,     setFormOpen]     = useState(false)
  const [bulkAddOpen,  setBulkAddOpen]  = useState(false)
  const [rolloverOpen, setRolloverOpen] = useState(false)
  const [arsipOpen,    setArsipOpen]    = useState(false)
  const [detailItem,        setDetailItem]        = useState<DokumenPengajaranItem | null>(null)
  const [editItem,          setEditItem]          = useState<DokumenPengajaranItem | null>(null)
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<DokumenPengajaranItem | null>(null)

  const hapusMutation = useHapusDokumenPengajaran()

  // ── Semester aktif (untuk pills guru) ────────────────────────
  const { data: semAktifRaw } = useSemesterActive()
  const activeSemList = useMemo(() =>
    ((semAktifRaw as { id: string; nama: string; urutan?: number }[] | undefined) ?? [])
      .slice().sort((a, b) => (b.urutan ?? 0) - (a.urutan ?? 0)),
    [semAktifRaw],
  )
  const [selectedSemId, setSelectedSemId] = useState('')

  // Auto-init ke urutan tertinggi saat data tersedia
  useEffect(() => {
    if (isGuru && activeSemList.length > 0 && !selectedSemId) {
      setSelectedSemId(activeSemList[0].id)
    }
  }, [isGuru, activeSemList, selectedSemId])

  // ── Kelas guru di semester aktif terpilih ──────────────────────
  const [guruKelasId, setGuruKelasId] = useState('')

  const effectiveSemId = selectedSemId || activeSemList[0]?.id || ''

  const { data: guruMapelRaw } = useMataPelajaranList(
    isGuru && user?.id && effectiveSemId
      ? { guruId: user.id, semesterId: effectiveSemId, limit: 100 }
      : undefined,
  )

  const guruKelasOptions = useMemo(() => {
    const map = new Map<string, string>()
    ;(guruMapelRaw?.data ?? []).forEach((m) => {
      const kId   = (m as any).kelasId ?? m.kelas?.id
      const kNama = m.kelas?.namaKelas
      if (kId && kNama) map.set(kId, kNama)
    })
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [guruMapelRaw])

  // Reset kelas filter saat semester berubah
  useEffect(() => { setGuruKelasId('') }, [selectedSemId])

  // ── Query params ─────────────────────────────────────────────
  const queryParams = useMemo(() => ({
    page,
    limit: 15,
    // Guru: hanya miliknya
    ...(isGuru && user?.id ? { guruId: user.id } : {}),
    // Guru semester filter:
    //  - 1 aktif → biarkan backend pilih urutan tertinggi
    //  - 2+ aktif → kirim semesterId eksplisit sesuai pill yang dipilih
    ...(isGuru && activeSemList.length <= 1
      ? { isSemesterAktif: true }
      : isGuru && selectedSemId
        ? { semesterId: selectedSemId }
        : {}),
    // Guru: filter kelas (opsional)
    ...(isGuru && guruKelasId ? { kelasId: guruKelasId } : {}),
    // Admin: bisa filter by guru
    ...(!isGuru && filterGuruId ? { guruId: filterGuruId } : {}),
    // Filter bersama
    ...(status          ? { status }          : {}),
    ...(jenisDokumen    ? { jenisDokumen }    : {}),
    // Filter admin
    ...(isAdmin && tahunAjaranId  ? { tahunAjaranId }  : {}),
    ...(isAdmin && semesterId     ? { semesterId }      : {}),
    ...(isAdmin && tingkatKelasId ? { tingkatKelasId }  : {}),
    ...(isAdmin && kelasId        ? { kelasId }         : {}),
  }), [
    page, status, jenisDokumen, isGuru, isAdmin, user?.id,
    filterGuruId, tahunAjaranId, semesterId, tingkatKelasId, kelasId,
    activeSemList.length, selectedSemId, guruKelasId,
  ])

  const { data, isLoading } = useDokumenPengajaranList(queryParams)

  const dokumenList = data?.data ?? []
  const meta        = data?.meta ?? { total: 0, page: 1, limit: 15, lastPage: 1 }

  const resetPage = () => setPage(1)

  const resetAllFilters = () => {
    setStatus('')
    setJenisDokumen('')
    setTahunAjaranId('')
    setSemesterId('')
    setTingkatKelasId('')
    setKelasId('')
    setFilterGuruId('')
    setGuruKelasId('')
    setPage(1)
  }

  const canDeleteItem = (item: DokumenPengajaranItem) => {
    if (item.status === 'APPROVED') return false
    if (canReview) return true
    return item.guru?.id === user?.id
  }


  return (
    <div className="space-y-6">
      {isGuru && (
        <button
          type="button"
          onClick={() => router.push('/dashboard/pembelajaran/guru')}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <span className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" />
          </span>
          Pembelajaran Saya
        </button>
      )}
      <PageHeader
        title="Dokumen Pengajaran"
        description={isGuru ? 'Perangkat ajar semester aktif' : 'Perangkat ajar: RPP, Silabus, ATP, dan Modul Ajar'}
        actions={
          canUpload ? (
            <>
              {isGuru && (
                <Button variant="secondary" leftIcon={<Archive size={16} />} onClick={() => setArsipOpen(true)}>
                  Arsip Dokumen
                </Button>
              )}
              <Button variant="secondary" leftIcon={<Copy size={16} />} onClick={() => setRolloverOpen(true)}>
                Salin Dokumen
              </Button>
              <Button variant="secondary" leftIcon={<Plus size={16} />} onClick={() => setBulkAddOpen(true)}>
                Unggah Massal
              </Button>
              <Button leftIcon={<Plus size={16} />} onClick={() => setFormOpen(true)}>
                Unggah Dokumen
              </Button>
            </>
          ) : undefined
        }
      />

      {/* Semester pills — hanya tampil untuk guru jika ada 2+ semester aktif */}
      {isGuru && activeSemList.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 shrink-0">Semester:</span>
          {activeSemList.map((sem) => (
            <button
              key={sem.id}
              type="button"
              onClick={() => { setSelectedSemId(sem.id); setPage(1) }}
              className={[
                'px-3 py-1 rounded-full text-xs font-semibold border transition-colors',
                selectedSemId === sem.id
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600',
              ].join(' ')}
            >
              {sem.nama}
            </button>
          ))}
        </div>
      )}

      <DokumenPengajaranFilterBar
        status={status}
        jenisDokumen={jenisDokumen}
        onStatusChange={(v) => { setStatus(v); resetPage() }}
        onJenisChange={(v)  => { setJenisDokumen(v); resetPage() }}
        isGuru={isGuru}
        guruKelasId={guruKelasId}
        guruKelasOptions={guruKelasOptions}
        onGuruKelasChange={(v) => { setGuruKelasId(v); resetPage() }}
        isAdmin={isAdmin}
        tahunAjaranId={tahunAjaranId}
        semesterId={semesterId}
        tingkatKelasId={tingkatKelasId}
        kelasId={kelasId}
        guruId={filterGuruId}
        onTahunAjaranChange={(v) => { setTahunAjaranId(v); setSemesterId(''); resetPage() }}
        onSemesterChange={(v)    => { setSemesterId(v); resetPage() }}
        onTingkatChange={(v)     => { setTingkatKelasId(v); setKelasId(''); resetPage() }}
        onKelasChange={(v)       => { setKelasId(v); resetPage() }}
        onGuruChange={(v)        => { setFilterGuruId(v); resetPage() }}
        onReset={resetAllFilters}
      />

      <p className="text-xs text-gray-400 -mt-3">
        Total{' '}
        <span className="font-medium text-gray-600 dark:text-gray-300">
          {meta.total} dokumen
        </span>
        {isGuru && <span className="ml-1 text-emerald-600">(Semester Aktif)</span>}
      </p>

      <DokumenPengajaranTable
        data={dokumenList}
        meta={meta}
        isLoading={isLoading}
        page={page}
        onPageChange={setPage}
        onSelect={setDetailItem}
        onEdit={(item) => setEditItem(item)}
        onDelete={(item) => setDeleteConfirmItem(item)}
        canEditItem={canDeleteItem}
        canDeleteItem={canDeleteItem}
        showGuru={!isGuru}
      />

      {canUpload && (
        <>
          <DokumenPengajaranFormModal
            open={formOpen || !!editItem}
            onClose={() => { setFormOpen(false); setEditItem(null) }}
            guruId={isGuru ? user?.id : undefined}
            editItem={editItem}
          />
          <DokumenBulkAddModal
            open={bulkAddOpen}
            onClose={() => setBulkAddOpen(false)}
            isAdmin={isAdmin}
            guruId={isGuru ? user?.id : undefined}
          />
          <DokumenBulkRolloverModal
            open={rolloverOpen}
            onClose={() => setRolloverOpen(false)}
            guruId={isGuru ? user?.id : undefined}
          />
          {isGuru && user?.id && (
            <DokumenArsipSlideOver
              open={arsipOpen}
              onClose={() => setArsipOpen(false)}
              guruId={user.id}
            />
          )}
        </>
      )}

      <DokumenPengajaranDetailModal
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        item={detailItem}
        canReview={canReview}
        canDelete={detailItem ? canDeleteItem(detailItem) : false}
        onEdit={detailItem && canDeleteItem(detailItem) ? () => {
          setEditItem(detailItem)
          setDetailItem(null)
        } : undefined}
      />

      {/* Modal konfirmasi hapus dari row tabel */}
      <Modal
        open={!!deleteConfirmItem}
        onClose={() => setDeleteConfirmItem(null)}
        title="Hapus Dokumen"
        size="sm"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setDeleteConfirmItem(null)} disabled={hapusMutation.isPending}>
              Batal
            </Button>
            <Button
              variant="danger"
              disabled={hapusMutation.isPending}
              onClick={async () => {
                if (!deleteConfirmItem) return
                try {
                  await hapusMutation.mutateAsync(deleteConfirmItem.id)
                  toast.success('Dokumen berhasil dihapus')
                  setDeleteConfirmItem(null)
                } catch {
                  toast.error('Gagal menghapus dokumen')
                }
              }}
            >
              {hapusMutation.isPending ? <><Spinner />&nbsp;Menghapus...</> : <><Trash2 className="h-3.5 w-3.5 mr-1.5" />Ya, Hapus</>}
            </Button>
          </div>
        }
      >
        <div className="px-6 py-5 flex gap-4">
          <div className="shrink-0 h-10 w-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
              Yakin ingin menghapus dokumen ini?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                &ldquo;{deleteConfirmItem?.judul}&rdquo;
              </span>{' '}
              akan dihapus permanen dan tidak dapat dikembalikan.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
