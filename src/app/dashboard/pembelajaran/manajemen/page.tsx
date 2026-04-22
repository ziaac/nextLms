'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Copy, Printer, ArrowLeft } from 'lucide-react'
import { PageHeader, Button } from '@/components/ui'
import { toast } from 'sonner'
import { useMataPelajaranList, useDeleteMataPelajaran, useToggleMataPelajaranActive } from '@/hooks/useMataPelajaran'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { useKelasList, useKelasById } from '@/hooks/kelas/useKelas'
import { useTahunAjaranList, useTahunAjaranActive } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useAuthStore } from '@/stores/auth.store'
import { canCrudMapel, isManajemen } from '@/lib/helpers/role'
import { mataPelajaranApi } from '@/lib/api/mata-pelajaran.api'
import { MapelFilters }       from './_components/mapel-filters'
import { MapelTable }         from './_components/mapel-table'
import { MapelSlideover }     from './_components/mapel-slideover'
import { MapelFormModal }     from './_components/mapel-form-modal'
import { MapelBulkCopyModal } from './_components/mapel-bulk-copy-modal'
import { MapelCetakModal }        from './_components/mapel-cetak-modal'
import { MapelBulkPerKelasModal } from './_components/mapel-bulk-perkelas-modal'
import { MapelStatCards }     from './_components/mapel-stat-cards'
import type { MataPelajaran } from '@/types/akademik.types'
import { useQuery }           from '@tanstack/react-query'
import api                     from '@/lib/axios'
import type { TingkatKelas } from '@/types/akademik.types'



function useTingkatKelasList() {
  return useQuery({
    queryKey: ['tingkat-kelas'],
    queryFn: async (): Promise<TingkatKelas[]> => {
      const res = await api.get<TingkatKelas[]>('/tingkat-kelas')
      return res.data ?? []
    },
    staleTime: 1000 * 60 * 10,
  })
}


export default function PembelajaranManajemenPage() {
  const router       = useRouter()
  const { user }   = useAuthStore()
  const searchParams = useSearchParams()
  const kelasIdCtx      = searchParams.get('kelasId')    ?? ''
  const semesterIdCtx   = searchParams.get('semesterId') ?? ''
  const bolehAkses = isManajemen(user?.role)
  const bolehCrud  = canCrudMapel(user?.role)

  // ── Filter state ──────────────────────────────────────────────
  const [semesterId,    setSemesterId]    = useState(semesterIdCtx)
  const [kelasId,       setKelasId]       = useState(kelasIdCtx)
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const [search,        setSearch]        = useState('')

  // ── Modal state ───────────────────────────────────────────────
  const [slideTarget,  setSlideTarget]  = useState<MataPelajaran | null>(null)
  const [formOpen,     setFormOpen]     = useState(false)
  const [editTarget,   setEditTarget]   = useState<MataPelajaran | null>(null)
  const [bulkCopyOpen, setBulkCopyOpen] = useState(false)
  const [cetakOpen,         setCetakOpen]         = useState(false)
  const [bulkPerKelasOpen,  setBulkPerKelasOpen]  = useState(false)

  const hasKelasCtx = !!kelasIdCtx

  // ── Fetch kelas dari URL ctx ──────────────────────────────────
  const { data: kelasCtx } = useKelasById(kelasIdCtx || null)
  const tahunAjaranIdCtx     = kelasCtx?.tahunAjaranId  ?? ''
  const tingkatKelasIdCtx    = kelasCtx?.tingkatKelasId ?? ''

  // ── Mode A: TA dari kelas, Mode B: semua TA ───────────────────
  // Mode B menggunakan semua TA (bukan hanya aktif)
  const { data: allTaList = [] }    = useTahunAjaranList()
  const { data: taAktifList = [] }  = useTahunAjaranActive()

  // taId untuk fetch semester:
  // Mode A → dari kelas ctx | Mode B → dari filter
  const taIdForSemester = hasKelasCtx
    ? tahunAjaranIdCtx
    : (tahunAjaranId || taAktifList[0]?.id || '')

  const { data: semesterList = [] } = useSemesterByTahunAjaran(taIdForSemester || null)
  const { data: tingkatList = [] }  = useTingkatKelasList()
  const { data: kelasList = [] }    = useKelasList(
    !hasKelasCtx && taIdForSemester
      ? { tahunAjaranId: taIdForSemester }
      : undefined
  )

  useEffect(() => {
    if (user && !bolehAkses) {
      const timer = setTimeout(() => {
        // Mengembalikan user ke halaman sebelumnya di history browser
        router.back(); 
      }, 2000);

      return () => clearTimeout(timer); 
    }
  }, [user, bolehAkses, router]);


  // ── Default filter ────────────────────────────────────────────
  // Mode B: default TA aktif
  useEffect(() => {
    if (!hasKelasCtx && taAktifList.length > 0 && !tahunAjaranId) {
      setTahunAjaranId(taAktifList[0].id)
    }
  }, [taAktifList, hasKelasCtx])

  // Default semester aktif
  useEffect(() => {
    if (semesterList.length > 0 && !semesterId) {
      const aktif = semesterList.find((s) => s.isActive)
      if (aktif) setSemesterId(aktif.id)
    }
  }, [semesterList])

  

  // Reset semester & kelas saat TA berubah (Mode B)
  const handleTAChange = (id: string) => {
    setTahunAjaranId(id)
    setSemesterId('')
    setKelasId('')
  }

  // ── Fetch mata pelajaran ──────────────────────────────────────
  const filter = useMemo(() => {
    if (hasKelasCtx) {
      return {
        kelasId:    kelasIdCtx,
        semesterId: semesterId || undefined,
        search:     search     || undefined,
      }
    }
    return {
      semesterId: semesterId  || undefined,
      kelasId:    kelasId     || undefined,
      search:     search      || undefined,
    }
  }, [hasKelasCtx, kelasIdCtx, semesterId, kelasId, search])

  const { data: mapelResponse, isLoading } = useMataPelajaranList(
    (filter.semesterId || filter.kelasId) ? filter : undefined
  )
  const mapelList = mapelResponse?.data ?? []

  // ── Mutations ─────────────────────────────────────────────────
  const deleteMutation       = useDeleteMataPelajaran()
  const toggleActiveMutation = useToggleMataPelajaranActive()

  const handleDelete = useCallback(async (mapel: MataPelajaran) => {
    await deleteMutation.mutateAsync(mapel.id)
    setSlideTarget(null)
  }, [deleteMutation])

  const handleToggleActive = useCallback(async (mapel: MataPelajaran) => {
    await toggleActiveMutation.mutateAsync(mapel.id)
    setSlideTarget(null)
  }, [toggleActiveMutation])

  const handleExport = useCallback(async (mapel: MataPelajaran) => {
    try {
      const blob = await mataPelajaranApi.exportNilai({
        kelasId:         mapel.kelasId,
        mataPelajaranId: mapel.id,
        tahunAjaranId:   tahunAjaranIdCtx || taIdForSemester,
      })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `nilai-${mapel.mataPelajaranTingkat.masterMapel.kode}-${mapel.kelas.namaKelas}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Gagal mengunduh file ekspor')
    }
  }, [tahunAjaranIdCtx, taIdForSemester])

  // Hitung guru unik dari mapelList — HARUS sebelum early return (Rules of Hooks)
  const totalGuruUnik = useMemo(() => {
    const ids = new Set(
      mapelList.flatMap((m) => m.pengajar.map((p) => p.guru.id))
    )
    return ids.size
  }, [mapelList])

if (!user) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

if (!user) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

if (!bolehAkses) {
  return (
    <div className="flex items-center justify-center h-64 text-gray-500">
      <p className="text-sm">Anda tidak memiliki akses ke halaman ini.</p>
    </div>
  )
}

  // TA options untuk filter Mode B — semua TA
  const taOptions = [
    { label: 'Pilih Tahun Ajaran', value: '' },
    ...allTaList.map(ta => ({ label: ta.nama, value: ta.id })),
  ]

  return (
    <div className="space-y-6">

      {/* Tombol back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </button>

      <PageHeader
        title="Mata Pelajaran"
        description={hasKelasCtx && kelasCtx ? `Kelas ${kelasCtx.namaKelas}` : 'Semua Kelas'}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={() => setCetakOpen(true)}
            >
              Cetak
            </Button>
            {bolehCrud && (
              <>
                <Button
                  variant="secondary"
                  leftIcon={<Copy className="w-4 h-4" />}
                  onClick={() => setBulkCopyOpen(true)}
                >
                  Salin Bulk
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setBulkPerKelasOpen(true)}
                >
                  Bulk per Tingkat
                </Button>
                <Button
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => { setEditTarget(null); setFormOpen(true) }}
                >
                  Tambah
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Mini Stat Cards — berubah saat filter TA/Semester berubah */}
      <MapelStatCards
        tahunAjaranId={tahunAjaranIdCtx || taIdForSemester}
        semesterId={semesterId || undefined}
        totalMapel={mapelResponse?.meta.total}
        totalGuru={totalGuruUnik}
      />

      <MapelFilters
        semesterList={semesterList}
        kelasList={kelasList}
        tahunAjaranList={allTaList}
        semesterId={semesterId}
        kelasId={kelasId}
        tahunAjaranId={tahunAjaranId}
        search={search}
        onSemesterChange={setSemesterId}
        onKelasChange={setKelasId}
        onTahunAjaranChange={handleTAChange}
        onSearchChange={setSearch}
        kelasLocked={hasKelasCtx}
      />

      {!filter.semesterId && !filter.kelasId && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-700">
            Pilih semester atau kelas untuk menampilkan mata pelajaran.
          </p>
        </div>
      )}

      <MapelTable
        data={mapelList}
        isLoading={isLoading}
        onRowClick={setSlideTarget}
        onEdit={(m) => { setEditTarget(m); setFormOpen(true) }}
        onDelete={handleDelete}
        onExport={handleExport}
        canCrud={bolehCrud}
        canBulkDelete={user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'}
        onNavigateJadwal={(kelasId, semesterId) =>
          router.push('/dashboard/jadwal?kelasId=' + kelasId + '&semesterId=' + semesterId)
        }
      />

      {mapelResponse?.meta && (
        <p className="text-xs text-gray-400">
          Menampilkan {mapelList.length} dari {mapelResponse.meta.total} mata pelajaran
        </p>
      )}

      <MapelSlideover
        mapel={slideTarget}
        onClose={() => setSlideTarget(null)}
        onEdit={(m) => { setEditTarget(m); setFormOpen(true); setSlideTarget(null) }}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        onExport={handleExport}
        canCrud={bolehCrud}
      />

      <MapelFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        editData={editTarget}
        kelasId={kelasIdCtx || undefined}
        tahunAjaranId={tahunAjaranIdCtx || taIdForSemester || undefined}
        tingkatKelasId={tingkatKelasIdCtx || undefined}
      />

      <MapelBulkPerKelasModal
        open={bulkPerKelasOpen}
        onClose={() => setBulkPerKelasOpen(false)}
      />

      <MapelBulkCopyModal
        open={bulkCopyOpen}
        onClose={() => setBulkCopyOpen(false)}
        kelasId={kelasIdCtx || undefined}
        targetTahunAjaranId={tahunAjaranIdCtx || undefined}
      />

      <MapelCetakModal
        open={cetakOpen}
        onClose={() => setCetakOpen(false)}
        kelasIdCtx={kelasIdCtx || undefined}
        tahunAjaranIdCtx={tahunAjaranIdCtx || taIdForSemester || undefined}
        semesterIdCtx={semesterId || undefined}
      />

    </div>
  )
}
