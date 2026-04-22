
'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams }       from 'next/navigation'
import { useAuthStore }                     from '@/stores/auth.store'
import { PageHeader, Button, ConfirmModal } from '@/components/ui'
import { Plus, Archive, Copy, ArrowLeft }             from 'lucide-react'
import { useTugasList, useDeleteTugas }     from '@/hooks/tugas/useTugas'
import { useSemesterActive }               from '@/hooks/semester/useSemester'
import { TugasFilterBar }                  from './_components/TugasFilterBar'
import { TugasTable }                      from './_components/TugasTable'
import { TugasPredefinedModal }            from './_components/TugasPredefinedModal'
import { ArsipTugasSlideOver }             from './_components/ArsipTugasSlideOver'
import { SalinTugasModal }                from './_components/SalinTugasModal'
import type { TugasItem, TujuanTugas, BentukTugas } from '@/types/tugas.types'
import { toast }                            from 'sonner'
import Link                                 from 'next/link'

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA']
const GURU_ROLES  = ['GURU', 'WALI_KELAS']
const SISWA_ROLES = ['SISWA']

export default function TugasPage() {
  return <Suspense><TugasContent /></Suspense>
}
function TugasContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { user }     = useAuthStore()

  const isAdmin = ADMIN_ROLES.includes(user?.role ?? '')
  const isGuru  = GURU_ROLES.includes(user?.role ?? '')
  const isSiswa = SISWA_ROLES.includes(user?.role ?? '')

  // ── Shared filter state ────────────────────────────────────────
  const [search,         setSearch]         = useState('')
  const [mapelTingkatId, setMapelTingkatId] = useState('')
  const [kelasId,        setKelasId]        = useState('')
  const [tujuan,         setTujuan]         = useState<TujuanTugas | ''>('')
  const [bentuk,         setBentuk]         = useState<BentukTugas | ''>('')
  const [mataPelajaranId, setMataPelajaranId] = useState('')
  const [page,           setPage]           = useState(1)

  // ── Modal states ─────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<TugasItem | null>(null)
  const [createOpen,   setCreateOpen]   = useState(false)
  const [arsipOpen,    setArsipOpen]    = useState(false)
  const [salinOpen,    setSalinOpen]    = useState(false)
  
  const deleteMutation = useDeleteTugas()

  // ── Semester aktif (pills guru) ──────────────────────────────────
  const { data: semAktifRaw } = useSemesterActive()
  const activeSemList = useMemo(() =>
    ((semAktifRaw as { id: string; nama: string; urutan?: number }[] | undefined) ?? [])
      .slice().sort((a, b) => (b.urutan ?? 0) - (a.urutan ?? 0)),
    [semAktifRaw],
  )
  const [selectedSemId, setSelectedSemId] = useState('')

  useEffect(() => {
    if (isGuru && activeSemList.length > 0 && !selectedSemId) {
      setSelectedSemId(activeSemList[0].id)
    }
  }, [isGuru, activeSemList, selectedSemId])

  // Handle URL params on mount
  useEffect(() => {
    const kId  = searchParams.get('kelasId')
    const mtId = searchParams.get('mapelTingkatId')
    const mpId = searchParams.get('mataPelajaranId')
    if (kId)  setKelasId(kId)
    if (mtId) setMapelTingkatId(mtId)
    if (mpId) setMataPelajaranId(mpId)
  }, [searchParams])

  // ── Admin & Guru query ─────────────────────────────────────────
  const queryParams = useMemo(() => ({
    page,
    limit: 20,
    ...(isGuru ? { guruId: user?.id } : {}),
    // Semester: pills logic sama seperti dokumen/materi
    ...(isGuru && activeSemList.length <= 1
      ? { isSemesterAktif: true }
      : isGuru && selectedSemId
        ? { semesterId: selectedSemId }
        : { isSemesterAktif: true }),
    ...(search         ? { search }                                 : {}),
    ...(mapelTingkatId ? { mataPelajaranTingkatId: mapelTingkatId } : {}),
    ...(kelasId        ? { kelasId }                                : {}),
    ...(tujuan         ? { tujuan }                                 : {}),
    ...(bentuk         ? { bentuk }                                 : {}),
    ...(mataPelajaranId ? { mataPelajaranId }                       : {}),
  }), [page, search, mapelTingkatId, kelasId, tujuan, bentuk, mataPelajaranId, isGuru, user?.id, activeSemList.length, selectedSemId])

  const { data: listData, isLoading } = useTugasList(queryParams, {
    enabled: (isGuru || isAdmin) && !!user?.id,
  })

  // ── Handlers ─────────────────────────────────────────────────
  const resetFilters = () => {
    setSearch('')
    setMapelTingkatId('')
    setKelasId('')
    setTujuan('')
    setBentuk('')
    setMataPelajaranId('')
    setPage(1)
  }

  const handleEdit = (item: TugasItem) => {
    router.push(`/dashboard/tugas/${item.id}/edit`)
  }

  const handleSelect = (item: TugasItem) => {
    router.push(`/dashboard/tugas/${item.id}`)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('Tugas berhasil dihapus')
      setDeleteTarget(null)
    } catch {
      toast.error('Gagal menghapus tugas')
    }
  }

  // ── Render: Admin & Guru ─────────────────────────────────────
  if (isAdmin || isGuru) {
    const list = listData?.data ?? []
    const meta = listData?.meta ?? { total: 0, page: 1, limit: 20, lastPage: 1 }

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
          title={isAdmin ? "Semua Tugas" : "Manajemen Tugas"}
          description={isAdmin ? "Pantau seluruh tugas di sekolah" : "Kelola tugas dan ujian untuk siswa Anda"}
          actions={
            <div className="flex items-center gap-2">
              {(isGuru || isAdmin) && (
                <Button
                  variant="secondary"
                  leftIcon={<Archive size={16} />}
                  onClick={() => setArsipOpen(true)}
                >
                  Arsip
                </Button>
              )}
              {(isGuru || isAdmin) && (
                <Button
                  variant="secondary"
                  leftIcon={<Copy size={16} />}
                  onClick={() => setSalinOpen(true)}
                >
                  Salin Tugas
                </Button>
              )}
              {isGuru && (
                <Button leftIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
                  Buat Tugas Baru
                </Button>
              )}
            </div>
          }
        />

        {/* Semester pills — hanya tampil jika 2+ semester aktif */}
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
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600',
                ].join(' ')}
              >
                {sem.nama}
              </button>
            ))}
          </div>
        )}

        <TugasFilterBar
          search={search}
          mapelTingkatId={mapelTingkatId}
          kelasId={kelasId}
          tujuan={tujuan || undefined}
          bentuk={bentuk || undefined}
          guruId={isGuru ? (user?.id ?? '') : ''}
          onSearchChange={(v)       => { setSearch(v); setPage(1) }}
          onMapelTingkatChange={(v) => { setMapelTingkatId(v); setKelasId(''); setPage(1) }}
          onKelasChange={(v)        => { setKelasId(v); setPage(1) }}
          onTujuanChange={(v)       => { setTujuan(v); setPage(1) }}
          onBentukChange={(v)       => { setBentuk(v); setPage(1) }}
          onReset={resetFilters}
        />

        <p className="text-xs text-gray-400 -mt-3">
          Total{' '}
          <span className="font-medium text-gray-600 dark:text-gray-300">
            {meta.total} tugas
          </span>
        </p>

        <TugasTable
          data={list}
          meta={meta}
          isLoading={isLoading}
          page={page}
          showGuru={isAdmin}
          onPageChange={setPage}
          onEdit={handleEdit}
          onDelete={(item) => setDeleteTarget(item)}
          onSelect={handleSelect}
        />

        {/* Modals */}
        {isGuru && (
          <TugasPredefinedModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            guruId={user?.id}
          />
        )}

        <ArsipTugasSlideOver
          open={arsipOpen}
          onClose={() => setArsipOpen(false)}
          guruId={user?.id ?? ''}
        />

        <SalinTugasModal
          open={salinOpen}
          onClose={() => setSalinOpen(false)}
          guruId={user?.id ?? ''}
        />

        <ConfirmModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Hapus Tugas"
          confirmLabel="Hapus"
          isLoading={deleteMutation.isPending}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Yakin ingin menghapus tugas{' '}
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              &ldquo;{deleteTarget?.judul}&rdquo;
            </span>
            ? Tindakan ini tidak dapat dibatalkan.
          </p>
        </ConfirmModal>
      </div>
    )
  }

  // ── Render: Siswa ────────────────────────────────────────────
  if (isSiswa) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-400">Halaman tugas siswa sedang dalam pengembangan.</p>
      </div>
    )
  }

  // Fallback
  return (
    <div className="flex items-center justify-center py-24">
      <p className="text-sm text-gray-400">Halaman ini khusus untuk manajemen tugas Guru dan Admin.</p>
    </div>
  )
}
