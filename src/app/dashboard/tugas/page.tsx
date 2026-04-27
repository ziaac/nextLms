
'use client'

import React, { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams }       from 'next/navigation'
import { useAuthStore }                     from '@/stores/auth.store'
import { PageHeader, Button, ConfirmModal } from '@/components/ui'
import { Plus, Archive, Copy, ArrowLeft, Award, BookOpen } from 'lucide-react'
import { useTugasList, useDeleteTugas }     from '@/hooks/tugas/useTugas'
import { useSemesterActive }               from '@/hooks/semester/useSemester'
import { useMataPelajaranList }            from '@/hooks/mata-pelajaran/useMataPelajaran'
import { TugasFilterBar }                  from './_components/TugasFilterBar'
import { TugasTable }                      from './_components/TugasTable'
import { TugasPredefinedModal }            from './_components/TugasPredefinedModal'
import { ArsipTugasSlideOver }             from './_components/ArsipTugasSlideOver'
import { SalinTugasModal }                from './_components/SalinTugasModal'
import { PenilaianDimensiTab }             from '@/components/dimensi-profil/PenilaianDimensiTab'
import type { TugasItem, TujuanTugas, BentukTugas } from '@/types/tugas.types'
import { TugasSiswaList }                  from './_components/TugasSiswaList'
import { TugasSiswaPanel }                from './_components/TugasSiswaPanel'
import { toast }                            from 'sonner'

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
  const [materiId,        setMateriId]        = useState('')
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

  // ── Main tab (Tugas | Dimensi Profil) — guru only ─────────────────
  type MainTab = 'tugas' | 'dimensi'
  const [mainTab,       setMainTab]       = useState<MainTab>('tugas')
  const [dimensiMapelId, setDimensiMapelId] = useState('')

  const resolvedSemId = activeSemList[0]?.id ?? ''
  const { data: myMapelRaw } = useMataPelajaranList(
    isGuru && mainTab === 'dimensi' && resolvedSemId
      ? { semesterId: resolvedSemId, guruId: user?.id }
      : undefined,
    { enabled: isGuru && mainTab === 'dimensi' && !!resolvedSemId },
  )
  const myMapelList = useMemo(() => {
    if (!myMapelRaw) return []
    const arr = Array.isArray(myMapelRaw)
      ? myMapelRaw
      : ((myMapelRaw as { data?: unknown[] }).data ?? [])
    return arr as { id: string; mataPelajaranTingkat?: { masterMapel?: { nama?: string } }; kelas?: { namaKelas?: string } }[]
  }, [myMapelRaw])

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
    const mId  = searchParams.get('materiId')
    if (kId)  setKelasId(kId)
    if (mtId) setMapelTingkatId(mtId)
    if (mpId) setMataPelajaranId(mpId)
    if (mId)  setMateriId(mId)
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
    ...(materiId        ? { materiId }                              : {}),
  }), [page, search, mapelTingkatId, kelasId, tujuan, bentuk, mataPelajaranId, materiId, isGuru, user?.id, activeSemList.length, selectedSemId])

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
    setMateriId('')
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
      <div className="space-y-6 min-w-0">
        {/* Back button — Pembelajaran Saya atau kembali dari filter materi */}
        {materiId ? (
          <button
            type="button"
            onClick={() => { setMateriId(''); router.back() }}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <span className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
              <ArrowLeft className="w-3.5 h-3.5" />
            </span>
            Kembali ke Materi
          </button>
        ) : isGuru && (
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
          description={
            materiId
              ? 'Tugas yang terhubung ke materi ini'
              : isAdmin ? "Pantau seluruh tugas di sekolah" : "Kelola tugas dan ujian untuk siswa Anda"
          }
          actions={
            mainTab === 'tugas' ? (
              <div className="flex flex-wrap items-center gap-2">
                {(isGuru || isAdmin) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Archive size={14} />}
                    onClick={() => setArsipOpen(true)}
                  >
                    Arsip
                  </Button>
                )}
                {(isGuru || isAdmin) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Copy size={14} />}
                    onClick={() => setSalinOpen(true)}
                  >
                    Salin
                  </Button>
                )}
                {isGuru && (
                  <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setCreateOpen(true)}>
                    Buat Tugas
                  </Button>
                )}
              </div>
            ) : null
          }
        />

        {/* ── Tab bar — Tugas & Nilai | Dimensi Profil (guru only) ── */}
        {isGuru && (
          <div className="overflow-x-auto border-b border-gray-200 dark:border-gray-700 -mt-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-full w-max">
              {([
                { key: 'tugas',    label: 'Tugas & Nilai' },
                { key: 'dimensi',  label: 'Dimensi Profil', icon: <Award className="w-3.5 h-3.5" /> },
              ] as { key: MainTab; label: string; icon?: React.ReactNode }[]).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setMainTab(t.key)}
                  className={[
                    'flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap',
                    mainTab === t.key
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
                  ].join(' ')}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Tugas & Nilai ─────────────────────────────────── */}
        {mainTab === 'tugas' && (
          <>
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
          </>
        )}

        {/* ── Tab: Dimensi Profil (guru only) ───────────────────── */}
        {isGuru && mainTab === 'dimensi' && (
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Left: mapel list */}
            <div className="w-full sm:w-56 sm:flex-shrink-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
                Mata Pelajaran
              </p>
              {myMapelList.length === 0 ? (
                <p className="text-xs text-gray-400 italic px-1">
                  Tidak ada mata pelajaran pada semester aktif.
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {myMapelList.map((m) => {
                    const nama  = m.mataPelajaranTingkat?.masterMapel?.nama ?? m.id
                    const kelas = m.kelas?.namaKelas ?? ''
                    const isSel = dimensiMapelId === m.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setDimensiMapelId(m.id)}
                        className={[
                          'flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-all w-full',
                          isSel
                            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm'
                            : 'border-transparent hover:border-emerald-200 hover:bg-gray-50 dark:hover:bg-gray-800',
                        ].join(' ')}
                      >
                        <div className={[
                          'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                          isSel ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-gray-100 dark:bg-gray-800',
                        ].join(' ')}>
                          <BookOpen size={13} className={isSel ? 'text-emerald-600' : 'text-gray-400'} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate leading-tight">{nama}</p>
                          {kelas && <p className="text-[10px] text-gray-400 truncate">{kelas}</p>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right: penilaian grid */}
            <div className="flex-1 min-w-0">
              {dimensiMapelId ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                  <PenilaianDimensiTab
                    mataPelajaranId={dimensiMapelId}
                    mapelNama={myMapelList.find((m) => m.id === dimensiMapelId)?.mataPelajaranTingkat?.masterMapel?.nama}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                  <BookOpen className="h-10 w-10 text-gray-200 dark:text-gray-700" />
                  <p className="text-sm text-gray-400">Pilih mata pelajaran di kiri untuk memulai penilaian</p>
                </div>
              )}
            </div>
          </div>
        )}

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
    const materiIdFromUrl = searchParams.get('materiId')        ?? ''
    const mapelIdFromUrl  = searchParams.get('mataPelajaranId') ?? ''
    const isFiltered      = !!(materiIdFromUrl || mapelIdFromUrl)

    // Filtered view — datang dari link materi / mapel tertentu
    if (isFiltered) {
      return (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => router.push('/dashboard/tugas')}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <span className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
              <ArrowLeft className="w-3.5 h-3.5" />
            </span>
            Semua Tugas
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tugas Saya</h1>
            <p className="text-sm text-gray-500 mt-0.5">Tugas terkait materi ini</p>
          </div>
          <TugasSiswaList
            materiId={materiIdFromUrl || undefined}
            mataPelajaranId={mapelIdFromUrl || undefined}
            userId={user?.id ?? ''}
          />
        </div>
      )
    }

    // Main view: Tugas | Nilai | Dimensi Profil (tabs inside panel)
    return <TugasSiswaPanel userId={user?.id ?? ''} semesterId={resolvedSemId} />
  }

  // Fallback
  return (
    <div className="flex items-center justify-center py-24">
      <p className="text-sm text-gray-400">Halaman ini khusus untuk manajemen tugas Guru dan Admin.</p>
    </div>
  )
}
