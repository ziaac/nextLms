'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Archive, CalendarDays, Users } from 'lucide-react'
import { PageHeader, Button } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'
import { isSiswaOrtu } from '@/lib/helpers/role'
import { reportApi } from '@/lib/api/report.api'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { MapelCardSiswa } from './_components/mapel-card-siswa'
import { MapelSlideoverSiswa } from './_components/mapel-slideover-siswa'
import { MapelArsipSiswaSlideover } from './_components/mapel-arsip-siswa-slideover'
import { useRouter } from 'next/navigation'
import type { MapelSiswaItem } from '@/types/akademik.types'

function useKelasSiswa(siswaId: string | null) {
  return useQuery({
    queryKey: ['kelas-siswa-history', siswaId],
    queryFn:  async () => {
      const { default: api } = await import('@/lib/axios')
      const res = await api.get(`/kelas/siswa/${siswaId}/history`)
      return res.data as Array<{
        kelasId:       string
        tahunAjaranId: string
        kelas: {
          id:          string
          namaKelas:   string
          tahunAjaran: { nama: string; isActive: boolean }
        }
      }>
    },
    enabled:   !!siswaId,
    staleTime: 1000 * 60 * 5,
  })
}

function useAnakOrangTua(enabled: boolean) {
  return useQuery({
    queryKey: ['orang-tua-anak'],
    queryFn:  () => reportApi.getAnakOrangTua(),
    enabled,
    staleTime: 1000 * 60 * 10,
  })
}

export default function PembelajaranSiswaPage() {
  const { user }   = useAuthStore()
  const router      = useRouter()
  const bolehAkses  = isSiswaOrtu(user?.role)

  const [arsipOpen,   setArsipOpen]   = useState(false)
  const [slideTarget, setSlideTarget] = useState<MapelSiswaItem | null>(null)

  const isOrangTua = user?.role === 'ORANG_TUA'

  const { data: anakList = [] } = useAnakOrangTua(isOrangTua)
  const anakPertama = anakList[0]

  const siswaId = isOrangTua ? (anakPertama?.id ?? null) : (user?.id ?? null)

  const { data: kelasHistory = [], isLoading: loadingKelas } = useKelasSiswa(siswaId)

  const kelasAktif = kelasHistory.find((k) => k.kelas.tahunAjaran.isActive)
  const kelasArsip = kelasHistory
    .filter((k) => !k.kelas.tahunAjaran.isActive)
    .map((k) => ({
      kelasId:       k.kelas.id,
      namaKelas:     k.kelas.namaKelas,
      tahunAjaran:   k.kelas.tahunAjaran.nama,
      tahunAjaranId: k.tahunAjaranId,
    }))

  // Fetch semester untuk tahun ajaran aktif
  const { data: semListRaw } = useSemesterByTahunAjaran(kelasAktif?.tahunAjaranId ?? null)
  const semesterList = (semListRaw as { id: string; nama: string; urutan?: number; isActive?: boolean }[] | undefined) ?? []

  // Filter aktif saja, sort urutan tertinggi di depan — sama dengan pola guru
  const activeSemList = useMemo(
    () =>
      semesterList
        .filter((s) => s.isActive)
        .slice()
        .sort((a, b) => (b.urutan ?? 0) - (a.urutan ?? 0)),
    [semesterList],
  )
  const semesterAktif = activeSemList[0] ?? null

  const { data: overview, isLoading: loadingMapel } = useQuery({
    queryKey: ['siswa-overview', siswaId, kelasAktif?.tahunAjaranId, semesterAktif?.id],
    queryFn:  () => reportApi.getSiswaOverview({
      tahunAjaranId: kelasAktif!.tahunAjaranId,
      semesterId:    semesterAktif!.id,
      siswaId:       isOrangTua ? siswaId! : undefined,
    }),
    enabled:   !!siswaId && !!kelasAktif?.tahunAjaranId && !!semesterAktif?.id,
    staleTime: 1000 * 60 * 5,
  })

  // Fetch todo semua mapel sekaligus (tanpa mataPelajaranId)
  // untuk hitung badge todo per card
  const { data: todoAll } = useQuery({
    queryKey: ['siswa-todo-all', siswaId, kelasAktif?.tahunAjaranId, semesterAktif?.id],
    queryFn:  () => reportApi.getSiswaTodo({
      tahunAjaranId: kelasAktif!.tahunAjaranId,
      siswaId:       isOrangTua ? siswaId! : undefined,
    }),
    enabled:   !!siswaId && !!kelasAktif?.tahunAjaranId && !!semesterAktif?.id,
    staleTime: 1000 * 60 * 2,
  })

  // Hitung todo count per mataPelajaranId
  const todoCountMap = useMemo(() => {
    const map: Record<string, number> = {}
    // Hitung tugas pending per mataPelajaranId
    todoAll?.tugasPending.forEach((t) => {
      if (t.mataPelajaranId) {
        map[t.mataPelajaranId] = (map[t.mataPelajaranId] ?? 0) + 1
      }
    })
    // Hitung absensi pending yang butuh aksi siswa
    todoAll?.absensiPending.forEach((a) => {
      if (a.status === 'AKSI_DIBUTUHKAN') {
        map[a.mataPelajaranId] = (map[a.mataPelajaranId] ?? 0) + 1
      }
    })
    return map
  }, [todoAll])

  const mapelList = overview?.mapel ?? []

  const isLoading = loadingKelas || loadingMapel

  useEffect(() => {
      if (user && !bolehAkses) {
        const timer = setTimeout(() => {
          // Mengembalikan user ke halaman sebelumnya di history browser
          router.back(); 
        }, 2000);

        return () => clearTimeout(timer); 
      }
    }, [user, bolehAkses, router]);


// Tambah di atas early return
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
  if (isOrangTua && !loadingKelas && anakList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
        <Users className="w-10 h-10 opacity-40" />
        <p className="text-sm font-medium">Data anak belum tersedia</p>
        <p className="text-xs text-center max-w-xs">
          Hubungi admin untuk menghubungkan akun Anda dengan data siswa.
        </p>
      </div>
    )
  }

  const kelasDisplay = kelasAktif?.kelas.namaKelas ?? ''
  const taDisplay    = kelasAktif?.kelas.tahunAjaran.nama ?? ''
  const semDisplay   = semesterAktif
    ? `Semester ${semesterAktif.nama.charAt(0) + semesterAktif.nama.slice(1).toLowerCase()}`
    : ''

  return (
    <div className="space-y-6">
      <PageHeader
        title={isOrangTua ? `Pembelajaran ${anakPertama?.profile?.namaLengkap ?? 'Anak'}` : 'Pembelajaran Saya'}
        description={kelasDisplay ? `${kelasDisplay} — ${taDisplay}${semDisplay ? ` · ${semDisplay}` : ''}` : 'Memuat data kelas...'}
        actions={
          <div className="flex gap-2">
            {kelasAktif && (
              <Button
                variant="secondary"
                leftIcon={<CalendarDays className="w-4 h-4" />}
                onClick={() => router.push(`/dashboard/jadwal?kelasId=${kelasAktif.kelas.id}`)}
              >
                Jadwal Kelas
              </Button>
            )}
            <Button
              variant="secondary"
              leftIcon={<Archive className="w-4 h-4" />}
              onClick={() => setArsipOpen(true)}
            >
              Arsip
            </Button>
          </div>
        }
      />

      {!isLoading && !kelasAktif && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-700">Tidak ada kelas aktif saat ini.</p>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
              <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
              <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && mapelList.length === 0 && kelasAktif && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <CalendarDays className="w-10 h-10 opacity-40" />
          <p className="text-sm font-medium">Belum ada mata pelajaran</p>
        </div>
      )}

      {!isLoading && mapelList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mapelList.map((mapel) => (
            <MapelCardSiswa
              key={mapel.id}
              mapel={mapel}
              kelasId={kelasAktif?.kelas.id ?? ''}
              tahunAjaranId={kelasAktif?.tahunAjaranId ?? ''}
              siswaId={isOrangTua ? siswaId! : undefined}
              todoCount={todoCountMap[mapel.id] ?? 0}
              onKlik={setSlideTarget}
            />
          ))}
        </div>
      )}

      <MapelSlideoverSiswa
        mapel={slideTarget}
        onClose={() => setSlideTarget(null)}
        kelasId={kelasAktif?.kelas.id ?? ''}
        tahunAjaranId={kelasAktif?.tahunAjaranId ?? ''}
        siswaId={isOrangTua ? siswaId! : undefined}
      />

      <MapelArsipSiswaSlideover
        open={arsipOpen}
        onClose={() => setArsipOpen(false)}
        siswaId={siswaId ?? ''}
        kelasArsip={kelasArsip}
      />
    </div>
  )
}
