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
    gray:    'bg-gray-50 text-gray-500 border-gray-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    blue:    'bg-blue-50 text-blue-600 border-blue-200',
    amber:   'bg-amber-50 text-amber-600 border-amber-200',
    purple:  'bg-purple-50 text-purple-600 border-purple-200',
  }
  const iconColor = {
    gray:    'text-gray-400',
    emerald: 'text-emerald-500',
    blue:    'text-blue-500',
    amber:   'text-amber-500',
    purple:  'text-purple-500',
  }

  return (
    <div className={`rounded-2xl border ${colorMap[color]} p-4 flex items-center gap-4`}>
      <div className={`rounded-lg p-2.5 ${colorMap[color]}`}>
        <Icon className={`w-5 h-5 ${iconColor[color]}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        {loading ? (
          <Skeleton className="h-6 w-16 rounded mt-0.5" />
        ) : (
          <p className="text-xl font-bold text-gray-800">{value}</p>
        )}
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
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
