'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams }               from 'next/navigation'
import { useAuthStore }            from '@/stores/auth.store'
import { PageHeader, Button, ConfirmModal } from '@/components/ui'
import { Plus, Copy, Archive, ArrowLeft, CheckCircle2, Circle, ClipboardList, CalendarDays, Search, BookOpen, Book, Library } from 'lucide-react'
import { cn }                             from '@/lib/utils'
import { useMateriList, useDeleteMateri } from '@/hooks/materi-pelajaran/useMateriPelajaran'
import { MateriFilterBar }         from './_components/MateriFilterBar'
import { MateriTable }             from './_components/MateriTable'
import { MateriDetailSlideOver }   from './_components/MateriDetailSlideOver'
import { MateriGuruFilterBar }     from './_components/MateriGuruFilterBar'
import { MateriGuruTable }         from './_components/MateriGuruTable'
import { ArsipSlideOver }          from './_components/ArsipSlideOver'
import { SiswaArsipSlideOver }     from './_components/SiswaArsipSlideOver'
import { BulkCopyModal }           from './_components/BulkCopyModal'
import { PredefinedDataModal }     from './_components/PredefinedDataModal'
import type { MateriItem }         from '@/types/materi-pelajaran.types'
import type { TipeMateri }         from '@/types/materi-pelajaran.types'
import { toast }                   from 'sonner'
import Link                        from 'next/link'
import { MateriTipeBadge }         from './_components/MateriTipeBadge'
import { format }                  from 'date-fns'
import { id as localeId }          from 'date-fns/locale'


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
  const [siswaSearch,      setSiswaSearch]      = useState('')
  const [selectedMapelId,  setSelectedMapelId]  = useState('')
  const [siswaArsipOpen,   setSiswaArsipOpen]   = useState(false)


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

  // ── Siswa query — satu query, semua data client-side ─────────
  const { data: siswaAllData, isLoading: siswaLoading } = useMateriList(
    { isSemesterAktif: true, isPublished: true, limit: 200 },
    { enabled: isSiswa },
  )
  const allMateri = useMemo(() => siswaAllData?.data ?? [], [siswaAllData])

  // Kelompokkan per mata pelajaran untuk panel kiri
  const mapelGroups = useMemo(() => {
    const map = new Map<string, { id: string; nama: string; items: MateriItem[] }>()
    for (const item of allMateri) {
      const id   = item.mataPelajaran?.mataPelajaranTingkat?.id   ?? '__other__'
      const nama = item.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama ?? 'Lainnya'
      if (!map.has(id)) map.set(id, { id, nama, items: [] })
      map.get(id)!.items.push(item)
    }
    return Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama))
  }, [allMateri])

  const searchQ = siswaSearch.trim().toLowerCase()

  // Panel kanan — materi yang tampil (filter mapel + search)
  const displayMateri = useMemo(() => {
    let items = selectedMapelId
      ? (mapelGroups.find(g => g.id === selectedMapelId)?.items ?? [])
      : allMateri
    if (searchQ) {
      items = items.filter(item =>
        item.judul.toLowerCase().includes(searchQ) ||
        (item.deskripsi ?? '').toLowerCase().includes(searchQ),
      )
    }
    return items
  }, [selectedMapelId, mapelGroups, allMateri, searchQ])

  // Panel kiri — mapel yang masih punya materi sesuai search
  const filteredMapelGroups = useMemo(() => {
    if (!searchQ) return mapelGroups
    return mapelGroups.filter(group =>
      group.nama.toLowerCase().includes(searchQ) ||
      group.items.some(item =>
        item.judul.toLowerCase().includes(searchQ) ||
        (item.deskripsi ?? '').toLowerCase().includes(searchQ),
      ),
    )
  }, [mapelGroups, searchQ])

  // Jumlah materi yang cocok per group saat search aktif
  const matchCount = (group: (typeof mapelGroups)[0]) => {
    if (!searchQ) return group.items.length
    return group.items.filter(item =>
      item.judul.toLowerCase().includes(searchQ) ||
      (item.deskripsi ?? '').toLowerCase().includes(searchQ),
    ).length
  }


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
    return (
      <div className="space-y-5">

        {/* Back button */}
        <button
          type="button"
          onClick={() => router.push('/dashboard/pembelajaran/siswa')}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <span className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" />
          </span>
          Pembelajaran Saya
        </button>

        <PageHeader
          title="Materi Belajar"
          description="Materi pelajaran semester aktif"
          actions={
            <Button
              variant="secondary"
              leftIcon={<Archive size={16} />}
              onClick={() => setSiswaArsipOpen(true)}
            >
              Arsip
            </Button>
          }
        />

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari materi atau mata pelajaran..."
            value={siswaSearch}
            onChange={(e) => setSiswaSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Total count */}
        <p className="text-xs text-gray-400 -mt-1">
          {siswaLoading ? 'Memuat...' : (
            <>
              Menampilkan{' '}
              <span className="font-medium text-gray-600 dark:text-gray-300">{displayMateri.length} materi</span>
              {selectedMapelId && (
                <> dari <span className="font-medium text-gray-600 dark:text-gray-300">{allMateri.length}</span> total</>
              )}
            </>
          )}
        </p>

        {/* Mobile: horizontal mapel pills */}
        {!siswaLoading && filteredMapelGroups.length > 1 && (
          <div className="flex md:hidden gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            <button
              type="button"
              onClick={() => setSelectedMapelId('')}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap',
                !selectedMapelId
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600',
              )}
            >
              Semua ({allMateri.length})
            </button>
            {filteredMapelGroups.map((group) => {
              const count = matchCount(group)
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedMapelId(selectedMapelId === group.id ? '' : group.id)}
                  className={cn(
                    'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap',
                    selectedMapelId === group.id
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600',
                  )}
                >
                  {group.nama}{searchQ ? ` (${count})` : ''}
                </button>
              )
            })}
          </div>
        )}

        {/* Two-panel layout */}
        <div className="flex gap-5 items-start pb-12">

          {/* Left sidebar — desktop only */}
          {!siswaLoading && filteredMapelGroups.length > 1 && (
            <aside className="hidden md:block w-44 lg:w-48 shrink-0 sticky top-20">
              {/* Section label */}
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pl-4 mb-2">
                Mapel
              </p>

              {/* Nav list */}
              <nav className="flex flex-col gap-0.5">

                {/* "Semua" */}
                <button
                  type="button"
                  onClick={() => setSelectedMapelId('')}
                  className={cn(
                    'flex items-center gap-2.5 w-full text-left px-2.5 py-2 rounded-lg transition-all duration-150',
                    !selectedMapelId
                      ? 'bg-emerald-50 dark:bg-emerald-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/60',
                  )}
                >
                  <Library className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    !selectedMapelId ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500',
                  )} />
                  <span className={cn(
                    'flex-1 text-sm truncate',
                    !selectedMapelId ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'font-medium text-gray-500 dark:text-gray-400',
                  )}>
                    Semua
                  </span>
                  <span className={cn(
                    'shrink-0 text-[11px] tabular-nums',
                    !selectedMapelId ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-gray-600',
                  )}>
                    {allMateri.length}
                  </span>
                </button>

                {/* Thin divider */}
                <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

                {/* Per-mapel */}
                {filteredMapelGroups.map((group) => {
                  const count  = matchCount(group)
                  const active = selectedMapelId === group.id
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedMapelId(active ? '' : group.id)}
                      className={cn(
                        'flex items-center gap-2.5 w-full text-left px-2.5 py-2 rounded-lg transition-all duration-150',
                        active
                          ? 'bg-emerald-50 dark:bg-emerald-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/60',
                      )}
                    >
                      {active
                        ? <BookOpen className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        : <Book className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" />
                      }
                      <span className={cn(
                        'flex-1 text-sm truncate leading-snug',
                        active ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'font-medium text-gray-500 dark:text-gray-400',
                      )}>
                        {group.nama}
                      </span>
                      <span className={cn(
                        'shrink-0 text-[11px] tabular-nums',
                        active ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-gray-600',
                      )}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </nav>
            </aside>
          )}

          {/* Right panel — materi cards */}
          <div className="flex-1 min-w-0">
            {siswaLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-5 flex flex-col gap-3 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-14 bg-gray-100 dark:bg-gray-700 rounded-full" />
                      <div className="h-4 w-20 bg-gray-100 dark:bg-gray-700 rounded-full" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded-md" />
                      <div className="h-4 w-4/5 bg-gray-100 dark:bg-gray-700 rounded-md" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 w-full bg-gray-50 dark:bg-gray-700/60 rounded" />
                      <div className="h-3 w-11/12 bg-gray-50 dark:bg-gray-700/60 rounded" />
                    </div>
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                      <div className="h-3 w-28 bg-gray-100 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-24 bg-gray-50 dark:bg-gray-700/60 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayMateri.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayMateri.map((item) => {
                  const progress    = item.progressSiswa?.[0]
                  const isRead      = progress?.isRead ||
                    (item.minScreenTime > 0 && (progress?.timeSpentSeconds ?? 0) >= item.minScreenTime)
                  const pubDate     = item.tanggalPublikasi
                    ? format(new Date(item.tanggalPublikasi), 'd MMM yyyy', { locale: localeId })
                    : null
                  const tugasCount  = item._count?.tugas ?? 0
                  const namaMapel   = item.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama

                  return (
                    <Link
                      key={item.id}
                      href={`/dashboard/materi-pelajaran/${item.id}`}
                      className="group flex"
                    >
                      <div className={cn(
                        'relative w-full rounded-2xl border p-5 flex flex-col overflow-hidden',
                        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30',
                        isRead
                          ? 'bg-white dark:bg-gray-800/80 border-emerald-200/60 dark:border-emerald-800/40'
                          : 'bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700/80',
                      )}>

                        {/* Accent strip — tipis di atas card saat sudah dibaca */}
                        {isRead && (
                          <span className="absolute inset-x-0 top-0 h-0.5 bg-emerald-400/60 dark:bg-emerald-500/40" />
                        )}

                        {/* Top row: tipe + read indicator */}
                        <div className="flex items-center justify-between mb-3">
                          <MateriTipeBadge tipe={item.tipeMateri} />
                          {isRead ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Selesai
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-gray-500">
                              <Circle className="w-3 h-3" /> Belum dibaca
                            </span>
                          )}
                        </div>

                        {/* Judul */}
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                          {item.judul}
                        </h3>

                        {/* Deskripsi */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 flex-1 leading-relaxed">
                          {item.deskripsi || <span className="italic opacity-60">Tidak ada deskripsi.</span>}
                        </p>

                        {/* Footer */}
                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate mb-1.5">
                            {namaMapel || '-'}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            {pubDate ? (
                              <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                                <CalendarDays className="w-3 h-3" /> {pubDate}
                              </span>
                            ) : <span />}
                            {tugasCount > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                                <ClipboardList className="w-3 h-3" /> {tugasCount} Tugas
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="py-24 text-center text-gray-400">
                <p className="font-medium">Belum ada materi ditemukan</p>
                <p className="text-xs mt-1 opacity-70">
                  {searchQ
                    ? 'Coba kata kunci lain atau pilih mata pelajaran berbeda'
                    : selectedMapelId
                      ? 'Belum ada materi untuk mata pelajaran ini'
                      : 'Materi semester aktif akan muncul di sini'}
                </p>
                {(searchQ || selectedMapelId) && (
                  <button
                    type="button"
                    onClick={() => { setSiswaSearch(''); setSelectedMapelId('') }}
                    className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Reset filter
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Arsip SlideOver */}
        <SiswaArsipSlideOver
          open={siswaArsipOpen}
          onClose={() => setSiswaArsipOpen(false)}
        />
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
