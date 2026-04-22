'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  ArrowRight, 
  LayoutGrid,
  List
} from 'lucide-react'
import { PageHeader, Button, Badge, Skeleton } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'
import { useMyStatusHariIni } from '@/hooks/absensi/useMyStatusHariIni'
import { useMataPelajaranList } from '@/hooks/useMataPelajaran'
import { useTahunAjaranActive } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterActive } from '@/hooks/semester/useSemester'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function KelasBelajarGuruPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    setHasHydrated(true)
  }, [])

  // ── Data Semester & TA ───────────────────────────────────────
  const { data: taList = [] } = useTahunAjaranActive()
  const taAktif = taList[0]
  const { data: semList = [] } = useSemesterActive()
  const semAktif = semList.find(s => s.isActive) ?? semList[0]

  // ── Data Wali Kelas ──────────────────────────────────────────
  const { isWaliKelas, kelasWali, isLoading: loadingWali } = useMyStatusHariIni(semAktif?.id)

  // ── Data Kelas Mengajar ──────────────────────────────────────
  const { data: mapelRes, isLoading: loadingMapel } = useMataPelajaranList(
    user?.id && semAktif?.id ? { guruId: user.id, semesterId: semAktif.id } : undefined
  )
  
  const mapelList = mapelRes?.data ?? []
  
  // Ambil kelas unik dari daftar mapel yang diajar
  const kelasMengajar = useMemo(() => {
    const map = new Map()
    mapelList.forEach(m => {
      if (!map.has(m.kelas.id)) {
        map.set(m.kelas.id, {
          id: m.kelas.id,
          nama: m.kelas.namaKelas,
          tingkat: m.mataPelajaranTingkat.tingkatKelas.nama,
          mapelCount: 1,
          mapelNames: [m.mataPelajaranTingkat.masterMapel.nama]
        })
      } else {
        const existing = map.get(m.kelas.id)
        existing.mapelCount++
        if (!existing.mapelNames.includes(m.mataPelajaranTingkat.masterMapel.nama)) {
          existing.mapelNames.push(m.mataPelajaranTingkat.masterMapel.nama)
        }
      }
    })
    return Array.from(map.values())
  }, [mapelList])

  if (!hasHydrated) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Kelas Belajar" 
        description={`Daftar kelas Anda pada Semester ${semAktif?.nama ?? '...'} — ${taAktif?.nama ?? '...'}`}
      />

      {/* Bagian 1: Kelas Perwalian */}
      {isWaliKelas && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Kelas Perwalian</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingWali ? (
              <Skeleton className="h-32 rounded-2xl" />
            ) : (
              kelasWali.map((k: any) => (
                <Link 
                  key={k.id} 
                  href={`/dashboard/kelas/${k.id}/siswa`}
                  className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-5 hover:shadow-lg hover:shadow-emerald-500/10 transition-all"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <GraduationCap size={64} />
                  </div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Badge variant="success" className="mb-2">Wali Kelas</Badge>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Kelas {k.namaKelas}</h3>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600">
                      <Users size={20} />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50 dark:border-gray-800">
                    <span className="text-xs text-gray-500 font-medium">Lihat Daftar Siswa</span>
                    <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      )}

      {/* Bagian 2: Kelas Mengajar */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Kelas Mengajar</h2>
        </div>

        {loadingMapel ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        ) : kelasMengajar.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl py-12 text-center">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Anda belum memiliki jadwal mengajar di semester ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kelasMengajar.map((k) => (
              <div 
                key={k.id}
                className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-blue-300 dark:hover:border-blue-800 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                      {k.tingkat}
                    </p>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Kelas {k.nama}</h3>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600">
                    <LayoutGrid size={18} />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <p className="text-xs text-gray-500 font-medium">Mata Pelajaran Diampu:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {k.mapelNames.map((name: string) => (
                      <Badge key={name} variant="default" className="text-[10px] py-0 px-2">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-6">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-[11px] h-8 rounded-lg"
                    onClick={() => router.push(`/dashboard/absensi/guru?kelasId=${k.id}`)}
                  >
                    Absensi
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="text-[11px] h-8 rounded-lg"
                    onClick={() => router.push(`/dashboard/kelas/${k.id}/siswa`)}
                  >
                    Siswa
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
