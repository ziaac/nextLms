'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams }               from 'next/navigation'
import { useAuthStore }            from '@/stores/auth.store'
import { PageHeader, Button, ConfirmModal } from '@/components/ui'
import { Plus, Copy, Archive, ArrowLeft } from 'lucide-react'
import { useMateriList, useDeleteMateri } from '@/hooks/materi-pelajaran/useMateriPelajaran'
import { MateriFilterBar }         from './_components/MateriFilterBar'
import { MateriTable }             from './_components/MateriTable'
import { MateriDetailSlideOver }   from './_components/MateriDetailSlideOver'
import { MateriGuruFilterBar }     from './_components/MateriGuruFilterBar'
import { MateriGuruTable }         from './_components/MateriGuruTable'
import { ArsipSlideOver }          from './_components/ArsipSlideOver'
import { BulkCopyModal }           from './_components/BulkCopyModal'
import { PredefinedDataModal }     from './_components/PredefinedDataModal'
import type { MateriItem }         from '@/types/materi-pelajaran.types'
import type { TipeMateri }         from '@/types/materi-pelajaran.types'
import { toast }                   from 'sonner'
import Link                        from 'next/link'
import { MateriTipeBadge }         from './_components/MateriTipeBadge'


const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA']
const GURU_ROLES  = ['GURU', 'WALI_KELAS']
const SISWA_ROLES = ['SISWA']


export default function MateriPelajaranPage() {
  return (
    <Suspense>
      <MateriPelajaranContent />
    </Suspense>
  )
}

function MateriPelajaranContent() {
  const router    = useRouter()
  const searchParams = useSearchParams()
  const { user }  = useAuthStore()

  const isAdmin = ADMIN_ROLES.includes(user?.role ?? '')
  const isGuru  = GURU_ROLES.includes(user?.role ?? '')
  const isSiswa = SISWA_ROLES.includes(user?.role ?? '')


  // ── Admin filter state ───────────────────────────────────────
  const [search,         setSearch]         = useState('')
  const [tahunAjaranId,  setTahunAjaranId]  = useState('')
  const [semesterId,     setSemesterId]     = useState('')
  const [tingkatKelasId, setTingkatKelasId] = useState('')
  const [mapelTingkatId, setMapelTingkatId] = useState('')
  const [kelasId,        setKelasId]        = useState('')
  const [guruId,         setGuruId]         = useState('')
  const [tipeMateri,     setTipeMateri]     = useState<TipeMateri | ''>('')
  const [isPublished,    setIsPublished]    = useState<'' | 'true' | 'false'>('')
  const [page,           setPage]           = useState(1)

  // ── Guru filter state ────────────────────────────────────────
  const [guruSearch,         setGuruSearch]         = useState('')
  const [guruMapelTingkatId, setGuruMapelTingkatId] = useState('')
  const [guruKelasId,        setGuruKelasId]        = useState('')
  const [guruTipeMateri,     setGuruTipeMateri]     = useState<TipeMateri | ''>('')
  const [guruIsPublished,    setGuruIsPublished]    = useState<'' | 'true' | 'false'>('')
  const [guruPage,           setGuruPage]           = useState(1)

  // Handle URL params on mount
  useEffect(() => {
    const mtId = searchParams.get('mapelTingkatId')
    const kId = searchParams.get('kelasId')
    
    if (isGuru) {
      if (mtId) setGuruMapelTingkatId(mtId)
      if (kId) setGuruKelasId(kId)
    } else if (isAdmin) {
      if (mtId) setMapelTingkatId(mtId)
      if (kId) setKelasId(kId)
    }
  }, [searchParams, isGuru, isAdmin])

  // ── Siswa state ──────────────────────────────────────────────
  const [siswaSearch,         setSiswaSearch]         = useState('')
  const [siswaPage,           setSiswaPage]           = useState(1)


  // ── Modal states ─────────────────────────────────────────────
  const [selectedItem,   setSelectedItem]   = useState<MateriItem | null>(null)
  const [createOpen,     setCreateOpen]     = useState(false)
  const [arsipOpen,      setArsipOpen]      = useState(false)
  const [bulkCopyOpen,   setBulkCopyOpen]   = useState(false)
  const [deleteTarget,   setDeleteTarget]   = useState<MateriItem | null>(null)
  const [bulkCopySource, setBulkCopySource] = useState<MateriItem[]>([])

  const deleteMutation = useDeleteMateri()

  // ── Admin query ──────────────────────────────────────────────
  const adminParams = useMemo(() => ({
    page,
    limit: 20,
    ...(search         ? { search }         : {}),
    ...(tahunAjaranId  ? { tahunAjaranId }  : {}),
    ...(semesterId     ? { semesterId }     : {}),
    ...(tingkatKelasId ? { tingkatKelasId } : {}),
    ...(mapelTingkatId ? { mataPelajaranTingkatId: mapelTingkatId } : {}),
    ...(kelasId        ? { kelasId }        : {}),
    ...(guruId         ? { guruId }         : {}),
    ...(tipeMateri     ? { tipeMateri }     : {}),
    ...(isPublished !== '' ? { isPublished: isPublished === 'true' } : {}),
  }), [
    page, search, tahunAjaranId, semesterId, tingkatKelasId,
    mapelTingkatId, kelasId, guruId, tipeMateri, isPublished,
  ])

  const { data: adminData, isLoading: adminLoading } = useMateriList(adminParams, {
    enabled: isAdmin,
  })

  // ── Guru query ───────────────────────────────────────────────
  const guruParams = useMemo(() => ({
    page:          guruPage,
    limit:         20,
    guruId:        user?.id ?? '',
    isSemesterAktif: true,
    ...(guruSearch         ? { search: guruSearch }                               : {}),
    ...(guruMapelTingkatId ? { mataPelajaranTingkatId: guruMapelTingkatId }       : {}),
    ...(guruKelasId        ? { kelasId: guruKelasId }                             : {}),
    ...(guruTipeMateri     ? { tipeMateri: guruTipeMateri }                       : {}),
    ...(guruIsPublished !== '' ? { isPublished: guruIsPublished === 'true' }      : {}),
  }), [guruPage, guruSearch, guruMapelTingkatId, guruKelasId, guruTipeMateri, guruIsPublished, user?.id])

  const { data: guruData, isLoading: guruLoading } = useMateriList(guruParams, {
    enabled: isGuru && !!user?.id,
  })

  // ── Siswa query ──────────────────────────────────────────────
  // Tambah isSemesterAktif: true agar hanya tampilkan materi dari semester aktif urutan tertinggi
  const siswaParams = useMemo(() => ({
    page:            siswaPage,
    limit:           20,
    search:          siswaSearch,
    isSemesterAktif: true,   // backend akan resolve ke semester aktif urutan tertinggi
    isPublished:     true,   // siswa hanya boleh lihat yang published
  }), [siswaPage, siswaSearch])

  const { data: siswaData, isLoading: siswaLoading } = useMateriList(siswaParams, {
    enabled: isSiswa,
  })


  // ── Handlers ─────────────────────────────────────────────────
  const resetAdminFilters = () => {
    setSearch('')
    setTahunAjaranId('')
    setSemesterId('')
    setTingkatKelasId('')
    setMapelTingkatId('')
    setKelasId('')
    setGuruId('')
    setTipeMateri('')
    setIsPublished('')
    setPage(1)
  }

  const resetGuruFilters = () => {
    setGuruSearch('')
    setGuruMapelTingkatId('')
    setGuruKelasId('')
    setGuruTipeMateri('')
    setGuruIsPublished('')
    setGuruPage(1)
  }

  const handleEdit = (item: MateriItem) => {
    router.push(`/dashboard/materi-pelajaran/${item.id}/edit`)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('Materi berhasil dihapus')
      setDeleteTarget(null)
    } catch {
      toast.error('Gagal menghapus materi')
    }
  }

  const handleCopySelected = (items: MateriItem[]) => {
    setBulkCopySource(items)
    setBulkCopyOpen(true)
  }

  // ── Render: Admin ────────────────────────────────────────────
  if (isAdmin) {
    const list = adminData?.data ?? []
    const meta = adminData?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPrevPage: false }

    return (
      <div className="space-y-6">
        <PageHeader
          title="Materi Pelajaran"
          description="Kelola materi belajar seluruh mata pelajaran"
        />

        <MateriFilterBar
          search={search}
          tahunAjaranId={tahunAjaranId}
          semesterId={semesterId}
          tingkatKelasId={tingkatKelasId}
          mapelTingkatId={mapelTingkatId}
          kelasId={kelasId}
          guruId={guruId}
          tipeMateri={tipeMateri}
          isPublished={isPublished}
          onSearchChange={(v)       => { setSearch(v); setPage(1) }}
          onTahunAjaranChange={(v)  => { setTahunAjaranId(v); setSemesterId(''); setPage(1) }}
          onSemesterChange={(v)     => { setSemesterId(v); setMapelTingkatId(''); setKelasId(''); setPage(1) }}
          onTingkatChange={(v)      => { setTingkatKelasId(v); setMapelTingkatId(''); setKelasId(''); setPage(1) }}
          onMapelTingkatChange={(v) => { setMapelTingkatId(v); setKelasId(''); setPage(1) }}
          onKelasChange={(v)        => { setKelasId(v); setPage(1) }}
          onGuruChange={(v)         => { setGuruId(v); setPage(1) }}
          onTipeChange={(v)         => { setTipeMateri(v); setPage(1) }}
          onStatusChange={(v)       => { setIsPublished(v); setPage(1) }}
          onReset={resetAdminFilters}
        />

        <p className="text-xs text-gray-400 -mt-3">
          Total{' '}
          <span className="font-medium text-gray-600 dark:text-gray-300">
            {meta.total} materi
          </span>
        </p>

        <MateriTable
          data={list}
          meta={meta}
          isLoading={adminLoading}
          page={page}
          onPageChange={setPage}
          onSelect={setSelectedItem}
        />

        <MateriDetailSlideOver
          open={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          item={selectedItem}
        />
      </div>
    )
  }

  // ── Render: Guru ─────────────────────────────────────────────
  if (isGuru) {
    const list = guruData?.data ?? []
    const meta = guruData?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPrevPage: false }

    return (
      <div className="space-y-6">
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

        <PageHeader
          title="Materi Pelajaran"
          description="Materi ajar semester aktif"
          actions={
            <>
              <Button
                variant="secondary"
                leftIcon={<Archive size={16} />}
                onClick={() => setArsipOpen(true)}
              >
                Arsip Materi
              </Button>
              <Button
                variant="secondary"
                leftIcon={<Copy size={16} />}
                onClick={() => {
                  setBulkCopySource([])
                  setBulkCopyOpen(true)
                }}
              >
                Salin Materi
              </Button>
              <Button
                leftIcon={<Plus size={16} />}
                onClick={() => setCreateOpen(true)}
              >
                Buat Materi
              </Button>
            </>
          }
        />

        <MateriGuruFilterBar
          search={guruSearch}
          mapelTingkatId={guruMapelTingkatId}
          kelasId={guruKelasId}
          guruId={user?.id ?? ''}
          tipeMateri={guruTipeMateri}
          isPublished={guruIsPublished}
          onSearchChange={(v)       => { setGuruSearch(v); setGuruPage(1) }}
          onMapelTingkatChange={(v) => { setGuruMapelTingkatId(v); setGuruKelasId(''); setGuruPage(1) }}
          onKelasChange={(v)        => { setGuruKelasId(v); setGuruPage(1) }}
          onTipeChange={(v)         => { setGuruTipeMateri(v); setGuruPage(1) }}
          onStatusChange={(v)       => { setGuruIsPublished(v); setGuruPage(1) }}
          onReset={resetGuruFilters}
        />

        <p className="text-xs text-gray-400 -mt-3">
          Total{' '}
          <span className="font-medium text-gray-600 dark:text-gray-300">
            {meta.total} materi
          </span>
        </p>

        <MateriGuruTable
          data={list}
          meta={meta}
          isLoading={guruLoading}
          page={guruPage}
          onPageChange={setGuruPage}
          onEdit={handleEdit}
          onDelete={(item) => setDeleteTarget(item)}
          onSelect={(item) => router.push(`/dashboard/materi-pelajaran/${item.id}`)}
        />

        {/* Modals */}
        <PredefinedDataModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          isAdmin={false}
          guruId={user?.id}
          gurNama={user?.namaLengkap}
        />

        <ArsipSlideOver
          open={arsipOpen}
          onClose={() => setArsipOpen(false)}
          guruId={user?.id ?? ''}
          onCopySelected={handleCopySelected}
        />

        <BulkCopyModal
          open={bulkCopyOpen}
          onClose={() => setBulkCopyOpen(false)}
          sourceItems={bulkCopySource}
          guruId={user?.id}
        />

        <ConfirmModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Hapus Materi"
          confirmLabel="Hapus"
          isLoading={deleteMutation.isPending}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Yakin ingin menghapus materi{' '}
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
    const list = siswaData?.data ?? []
    const meta = siswaData?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 }

    return (
      <div className="space-y-6">
        <PageHeader
          title="Materi Belajar"
          description="Daftar materi pelajaran yang tersedia untuk Anda"
        />

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
             <input
               type="text"
               placeholder="Cari materi..."
               value={siswaSearch}
               onChange={(e) => { setSiswaSearch(e.target.value); setSiswaPage(1) }}
               className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
             />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {siswaLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
            ))
          ) : list.length > 0 ? (
            list.map((item) => (
              <Link key={item.id} href={`/dashboard/materi-pelajaran/${item.id}`} className="group">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 h-full hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <MateriTipeBadge tipe={item.tipeMateri} />
                    {item.progressSiswa?.[0]?.isRead && (
                      <span className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Selesai</span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-blue-500 transition-colors">
                    {item.judul}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1">
                    {item.deskripsi || 'Tidak ada deskripsi.'}
                  </p>
                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mata Pelajaran</p>
                    <p className="text-xs font-semibold mt-0.5 truncate">
                      {item.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama || '-'}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-24 text-center text-gray-400">Belum ada materi tersedia untuk kelas Anda.</div>
          )}
        </div>
      </div>
    )
  }

  // Fallback (role tidak punya akses)
  return (
    <div className="flex items-center justify-center py-24">
      <p className="text-sm text-gray-400">Anda tidak memiliki akses ke halaman ini.</p>
    </div>
  )

}
