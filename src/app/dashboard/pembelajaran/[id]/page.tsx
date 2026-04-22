'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  BookOpen, 
  ClipboardList, 
  Users, 
  CalendarDays, 
  ArrowLeft,
  ChevronRight,
  FileText,
  Clock,
  Target
} from 'lucide-react'
import { 
  PageHeader, 
  Button, 
  Badge, 
  Skeleton,
  EmptyState
} from '@/components/ui'
import { useMataPelajaranById } from '@/hooks/useMataPelajaran'
import { useMateriList } from '@/hooks/materi-pelajaran/useMateriPelajaran'
import { useAuthStore } from '@/stores/auth.store'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import Link from 'next/link'
import { MateriTipeBadge } from '../../materi-pelajaran/_components/MateriTipeBadge'
import { cn } from '@/lib/utils'

type Tab = 'materi' | 'tugas' | 'absensi'

export default function MataPelajaranDetailPage() {
  const params = useParams()
  const router = useRouter()
  const mapelId = params.id as string
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('materi')
  const [hasHydrated, setHasHydrated] = useState(false)

  const isGuru = ['GURU', 'WALI_KELAS'].includes(user?.role ?? '')

  useEffect(() => {
    setHasHydrated(true)
  }, [])

  // ── Data Fetch ───────────────────────────────────────────────
  const { data: mapel, isLoading: loadingMapel } = useMataPelajaranById(mapelId)
  
  const { data: materiRes, isLoading: loadingMateri } = useMateriList({
    mataPelajaranTingkatId: mapel?.mataPelajaranTingkatId,
    kelasId: mapel?.kelasId,
    limit: 50
  }, { enabled: !!mapel })

  const materiList = materiRes?.data ?? []

  if (!hasHydrated || loadingMapel) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-8">
        <Skeleton className="h-12 w-48 mb-4" />
        <Skeleton className="h-48 rounded-3xl" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!mapel) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center">
        <EmptyState 
          title="Mata Pelajaran Tidak Ditemukan"
          description="Halaman yang Anda cari tidak tersedia atau Anda tidak memiliki akses."
        />
        <Button className="mt-4" variant="secondary" onClick={() => router.back()}>Kembali</Button>
      </div>
    )
  }

  const mapelNama = mapel.mataPelajaranTingkat.masterMapel.nama
  const kelasNama = mapel.kelas.namaKelas

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Breadcrumbs & Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Kembali</span>
        </button>
         <div className="flex gap-2">
           <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/absensi/guru?mataPelajaranId=${mapelId}`)}>
              Buka Absensi
           </Button>
           {isGuru && (
             <Button size="sm" leftIcon={<BookOpen size={16} />} onClick={() => router.push(`/dashboard/materi-pelajaran/buat?mataPelajaranId=${mapelId}&kelasId=${mapel.kelasId}`)}>
                Buat Materi
             </Button>
           )}
         </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <BookOpen size={120} />
        </div>
        
        <div className="relative space-y-4">
          <div>
            <Badge variant="info" className="mb-3 uppercase tracking-widest text-[10px]">
              {mapel.mataPelajaranTingkat.tingkatKelas.nama} • {mapel.mataPelajaranTingkat.masterMapel.kategori}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight">
              {mapelNama}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium flex items-center gap-2">
              <Users size={16} /> Kelas {kelasNama}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
             <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-700">
                <Target className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">KKM: {mapel.kkm}</span>
             </div>
             <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-700">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{mapel.targetPertemuan} Pertemuan</span>
             </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <StatItem 
          label="Materi" 
          value={mapel._count.materiPelajaran} 
          icon={<BookOpen className="text-blue-500" />} 
          color="blue"
        />
        <StatItem 
          label="Tugas" 
          value={mapel._count.tugas} 
          icon={<ClipboardList className="text-amber-500" />} 
          color="amber"
        />
        <StatItem 
          label="Sesi Absensi" 
          value={mapel._count.absensi} 
          icon={<CalendarDays className="text-emerald-500" />} 
          color="emerald"
        />
      </div>

      {/* Tabs Layout */}
      <div className="space-y-4">
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
          <TabButton active={activeTab === 'materi'} onClick={() => setActiveTab('materi')} label="Materi" icon={<FileText size={16} />} />
          <TabButton active={activeTab === 'tugas'} onClick={() => setActiveTab('tugas')} label="Tugas" icon={<ClipboardList size={16} />} />
          <TabButton active={activeTab === 'absensi'} onClick={() => setActiveTab('absensi')} label="Jadwal & Absensi" icon={<CalendarDays size={16} />} />
        </div>

        <div className="min-h-[300px]">
          {activeTab === 'materi' && (
            <div className="space-y-3">
              {loadingMateri ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
              ) : materiList.length === 0 ? (
                <EmptyState title="Belum ada materi" description="Anda belum mengunggah materi untuk mata pelajaran ini." />
              ) : (
                materiList.map((materi) => (
                  <div 
                    key={materi.id} 
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-blue-300 transition-all group"
                  >
                    <Link href={`/dashboard/materi-pelajaran/${materi.id}`} className="flex items-center gap-4 flex-1">
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg group-hover:bg-blue-50 transition-colors">
                        <FileText size={20} className="text-gray-400 group-hover:text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{materi.judul}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <MateriTipeBadge tipe={materi.tipeMateri} />
                          <span className="text-[10px] text-gray-400">• {format(new Date(materi.createdAt), 'd MMM yyyy', { locale: localeId })}</span>
                        </div>
                      </div>
                    </Link>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       {isGuru && (
                         <>
                           <button 
                            onClick={(e) => { e.preventDefault(); router.push(`/dashboard/materi-pelajaran/${materi.id}/edit`) }}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                           >
                            <FileText size={16} />
                           </button>
                         </>
                       )}
                       <ChevronRight size={18} className="text-gray-300 ml-2" />
                     </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'tugas' && (
            <EmptyState 
              title="Fitur Tugas Segera Hadir" 
              description="Halaman pengelolaan tugas khusus mata pelajaran ini sedang dalam pengembangan." 
            />
          )}

          {activeTab === 'absensi' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl p-6">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-400 mb-4 flex items-center gap-2">
                  <CalendarDays size={18} /> Jadwal Mingguan
                </h4>
                <div className="grid gap-3">
                   {mapel.jadwalPelajaran.length === 0 ? (
                     <p className="text-sm text-emerald-700 opacity-70 italic">Tidak ada jadwal rutin yang terdaftar.</p>
                   ) : (
                     mapel.jadwalPelajaran.map(j => (
                       <div key={j.id} className="flex justify-between items-center bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{j.hari}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {j.masterJam
                              ? `${j.masterJam.jamMulai.slice(0, 5)} - ${j.masterJam.jamSelesai.slice(0, 5)}`
                              : '–'
                            }
                          </span>
                       </div>
                     ))
                   )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Rekap Kehadiran</h4>
                  <p className="text-xs text-gray-500 mt-1">Total {mapel._count.absensi} sesi telah dilaksanakan</p>
                </div>
                <Button variant="secondary" onClick={() => router.push(`/dashboard/absensi/guru?mataPelajaranId=${mapelId}`)}>
                  Lihat Rekap
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatItem({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  }

  return (
    <div className={`p-4 rounded-2xl border ${colorMap[color]} dark:bg-gray-900/50 dark:border-gray-800 flex flex-col items-center justify-center text-center`}>
      <div className="mb-2">{icon}</div>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
    </div>
  )
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 -mb-px
        ${active 
          ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
          : 'border-transparent text-gray-400 hover:text-gray-600'
        }
      `}
    >
      {icon}
      {label}
    </button>
  )
}
