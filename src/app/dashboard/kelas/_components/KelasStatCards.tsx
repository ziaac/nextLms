'use client'

import { useQuery } from '@tanstack/react-query'
import { Users, BookOpen, User, CalendarDays, ClipboardList, School } from 'lucide-react'
import { Skeleton } from '@/components/ui'
import api from '@/lib/axios'

interface Props {
  tahunAjaranId: string
  semesterId?:   string
  // Dihitung dari kelasList yang sudah terfilter di page
  // Ikut filter TA + tingkat secara otomatis
  totalKelas?:   number
  totalSiswa?:   number
  totalGuru?:    number
}

interface KehadiranStat {
  rekapPerKelas: { persentaseHadir: number }[]
}

interface TugasStat {
  ringkasanGlobal: {
    totalTugasDiberikan:          number
    totalPengumpulanSiswa:        number
    rataRataTingkatPenyelesaian:  number
    tugasMenungguPenilaian:       number
  }
}

function StatCard({
  label, value, sub, icon: Icon, color = 'gray', loading,
}: {
  label:   string
  value:   string | number
  sub?:    string
  icon:    React.ElementType
  color?:  'gray' | 'emerald' | 'blue' | 'amber' | 'purple'
  loading: boolean
}) {
  const colorMap = {
    gray:    'bg-gray-50 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    blue:    'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    amber:   'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    purple:  'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  }
  const iconBgMap = {
    gray:    'bg-gray-100 dark:bg-gray-700/40',
    emerald: 'bg-emerald-100 dark:bg-emerald-800/40',
    blue:    'bg-blue-100 dark:bg-blue-800/40',
    amber:   'bg-amber-100 dark:bg-amber-800/40',
    purple:  'bg-purple-100 dark:bg-purple-800/40',
  }
  const iconColor = {
    gray:    'text-gray-400 dark:text-gray-500',
    emerald: 'text-emerald-500 dark:text-emerald-400',
    blue:    'text-blue-500 dark:text-blue-400',
    amber:   'text-amber-500 dark:text-amber-400',
    purple:  'text-purple-500 dark:text-purple-400',
  }

  return (
    <div className={`rounded-2xl border ${colorMap[color]} p-4 flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-lg p-2.5 ${iconBgMap[color]} flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor[color]}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">{label}</p>
        </div>
      </div>
      <div className="min-w-0">
        {loading ? (
          <Skeleton className="h-7 w-20 rounded" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        )}
        {sub && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export function KelasStatCards({ tahunAjaranId, semesterId, totalKelas, totalSiswa, totalGuru }: Props) {
  const enabled = !!tahunAjaranId

  // Stat kelas/siswa/guru dihitung dari kelasList di page (ikut filter)
  // Tidak perlu fetch dashboard lagi

  const { data: kehadiran, isLoading: l2 } = useQuery({
    queryKey: ['report-kehadiran-stat', tahunAjaranId, semesterId],
    queryFn:  async (): Promise<KehadiranStat> => {
      const res = await api.get('/report/kehadiran', {
        params: { tahunAjaranId, semesterId }
      })
      return res.data
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  })

  const { data: tugasStat, isLoading: l3 } = useQuery({
    queryKey: ['report-tugas-stat', tahunAjaranId],
    queryFn:  async (): Promise<TugasStat> => {
      const res = await api.get('/report/tugas', { params: { tahunAjaranId } })
      return res.data
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  })

  // Hitung rata-rata kehadiran semua kelas
  const avgKehadiran = (() => {
    const rekap = kehadiran?.rekapPerKelas ?? []
    if (rekap.length === 0) return 0
    const total = rekap.reduce((acc, k) => acc + k.persentaseHadir, 0)
    return Math.round(total / rekap.length)
  })()

  const loading = l2 || l3

  if (!tahunAjaranId) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard
        label="Total Kelas"
        value={totalKelas ?? 0}
        sub="sesuai filter"
        icon={School}
        color="blue"
        loading={false}
      />
      <StatCard
        label="Total Siswa"
        value={totalSiswa ?? 0}
        sub="sesuai filter"
        icon={Users}
        color="emerald"
        loading={false}
      />
      <StatCard
        label="Total Wali Kelas"
        value={totalGuru ?? 0}
        sub="Identitas unik"
        icon={User}
        color="purple"
        loading={false}
      />
      <StatCard
        label="Rata Kehadiran"
        value={`${avgKehadiran}%`}
        sub="bulan ini"
        icon={CalendarDays}
        color={avgKehadiran >= 80 ? 'emerald' : 'amber'}
        loading={l2}
      />
      <StatCard
        label="Total Tugas"
        value={tugasStat?.ringkasanGlobal?.totalTugasDiberikan ?? 0}
        sub={`${tugasStat?.ringkasanGlobal?.tugasMenungguPenilaian ?? 0} menunggu nilai`}
        icon={ClipboardList}
        color="gray"
        loading={l3}
      />
      <StatCard
        label="Ketuntasan Tugas"
        value={`${tugasStat?.ringkasanGlobal?.rataRataTingkatPenyelesaian ?? 0}%`}
        icon={BookOpen}
        color={(tugasStat?.ringkasanGlobal?.rataRataTingkatPenyelesaian ?? 0) >= 70 ? 'emerald' : 'amber'}
        loading={l3}
      />
    </div>
  )
}
