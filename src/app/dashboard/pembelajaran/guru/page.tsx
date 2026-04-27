'use client'

import { useState, useMemo, useEffect } from 'react'
import { Archive, CalendarDays, ArrowLeft } from 'lucide-react'
import { Button, SearchInput } from '@/components/ui'
import { useMataPelajaranList } from '@/hooks/useMataPelajaran'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { useTahunAjaranActive } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useAuthStore } from '@/stores/auth.store'
import { isGuru } from '@/lib/helpers/role'
import { MapelCardGuru } from './_components/mapel-card-guru'
import { MapelArsipSlideover }  from './_components/mapel-arsip-slideover'
import { MapelSlideoverGuru }   from './_components/mapel-slideover-guru'
import { useRouter } from 'next/navigation'
import type { MataPelajaran } from '@/types/akademik.types'

export default function PembelajaranGuruPage() {
  const router        = useRouter()
  const { user }    = useAuthStore()
  const [hasHydrated, setHasHydrated] = useState(false)

  // Pastikan Zustand sudah ter-rehydrate dari storage
  useEffect(() => {
    setHasHydrated(true)
  }, [])

  const userRole  = user?.role?.toUpperCase()
  const bolehAkses = userRole === 'GURU' || userRole === 'WALI_KELAS'
  // Sama dengan logika sidebar nav.config.ts
  const jadwalUrl  = (userRole === 'WALI_KELAS' || user?.isWaliKelas)
    ? '/dashboard/jadwal/wali-kelas'
    : '/dashboard/jadwal/guru'

  const [search,      setSearch]      = useState('')
  const [arsipOpen,    setArsipOpen]    = useState(false)
  const [slideTarget,  setSlideTarget]  = useState<MataPelajaran | null>(null)

  // ── Resolve TA & Semester aktif ───────────────────────────
  const { data: taList = [] }       = useTahunAjaranActive()
  const taAktif                       = taList[0]
  const { data: semesterList = [] } = useSemesterByTahunAjaran(taAktif?.id || null)

  // Semua semester aktif, urutan tertinggi di depan
  const activeSemList = useMemo(() =>
    semesterList
      .filter((s) => s.isActive)
      .slice()
      .sort((a, b) => (b.urutan ?? 0) - (a.urutan ?? 0)),
    [semesterList],
  )

  const [selectedSemId, setSelectedSemId] = useState('')

  // Auto-init ke semester urutan tertinggi saat data tersedia
  useEffect(() => {
    if (activeSemList.length > 0 && !selectedSemId) {
      setSelectedSemId(activeSemList[0].id)
    }
  }, [activeSemList, selectedSemId])

  // Semester yang sedang aktif terpilih (untuk label subtitle)
  const semesterAktif = activeSemList.find((s) => s.id === selectedSemId) ?? activeSemList[0] ?? null

  // ── Fetch mapel guru aktif ────────────────────────────
  const { data: mapelResponse, isLoading } = useMataPelajaranList(
    user?.id && selectedSemId ? {
      guruId:     user.id,
      semesterId: selectedSemId,
    } : undefined
  )
  const mapelList = mapelResponse?.data ?? []

  // ── Filter search ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return mapelList
    const q = search.toLowerCase()
    return mapelList.filter((m) =>
      m.mataPelajaranTingkat.masterMapel.nama.toLowerCase().includes(q) ||
      m.kelas.namaKelas.toLowerCase().includes(q)
    )
  }, [mapelList, search])

  useEffect(() => {
    if (hasHydrated && user && !bolehAkses) {
      const timer = setTimeout(() => {
        router.back(); 
      }, 2000);
      return () => clearTimeout(timer); 
    }
  }, [hasHydrated, user, bolehAkses, router]);

  // Loading state hanya saat proses hidrasi awal
  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Jika sudah hidrasi tapi tidak ada user, biarkan middleware yang handle redirect
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p className="text-sm italic">Sesi berakhir, silakan login kembali...</p>
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

  return (
    <div className="space-y-6">
      {/* Header — back button circle + judul + actions */}
      <div className="flex items-start justify-between gap-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => router.push('/dashboard/kelas-belajar/guru')}
            className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 transition-colors shrink-0 shadow-sm"
            title="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">Pembelajaran Saya</h1>
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              Mata pelajaran semester aktif
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="secondary"
            leftIcon={<CalendarDays className="w-4 h-4" />}
            onClick={() => router.push(jadwalUrl)}
            className="whitespace-nowrap"
          >
            <span className="hidden sm:inline">Jadwal Saya</span>
            <span className="sm:hidden">Jadwal</span>
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Archive className="w-4 h-4" />}
            onClick={() => setArsipOpen(true)}
            className="whitespace-nowrap"
          >
            Arsip
          </Button>
        </div>
      </div>

      {/* Semester pills — hanya tampil jika ada 2+ semester aktif */}
      {activeSemList.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 shrink-0">Semester:</span>
          {activeSemList.map((sem) => (
            <button
              key={sem.id}
              type="button"
              onClick={() => setSelectedSemId(sem.id)}
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

      <div className="w-full sm:w-72">
        <SearchInput
          placeholder="Cari mata pelajaran..."
          value={search}
          onChange={setSearch}
        />
      </div>

      {!semesterAktif && !isLoading && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-700">
            Tidak ada semester aktif saat ini.
            Hubungi admin untuk mengaktifkan semester.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((__, j) => (
                  <div key={j} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && semesterAktif && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <CalendarDays className="w-10 h-10 opacity-40" />
          <p className="text-sm font-medium">
            {search ? 'Tidak ada mata pelajaran ditemukan' : 'Belum ada mata pelajaran di semester ini'}
          </p>
          {!search && (
            <p className="text-xs text-center max-w-xs">
              Mata pelajaran akan muncul setelah admin menambahkan Anda sebagai pengajar.
            </p>
          )}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((mapel) => (
            <MapelCardGuru
              key={mapel.id}
              mapel={mapel}
              tahunAjaranId={taAktif?.id ?? ''}
              semesterId={semesterAktif?.id ?? ''}
              onKlik={setSlideTarget}
            />
          ))}
        </div>
      )}

      {!isLoading && mapelList.length > 0 && (
        <p className="text-xs text-gray-400">
          Menampilkan {filtered.length} dari {mapelList.length} mata pelajaran
        </p>
      )}

      <MapelSlideoverGuru
        mapel={slideTarget}
        onClose={() => setSlideTarget(null)}
        tahunAjaranId={taAktif?.id ?? ''}
        semesterId={semesterAktif?.id ?? ''}
      />

      <MapelArsipSlideover
        open={arsipOpen}
        onClose={() => setArsipOpen(false)}
        guruId={user?.id ?? ''}
      />
    </div>
  )
}
