'use client'

import { useQuery } from '@tanstack/react-query'
import { BookOpen, User, CalendarDays, ClipboardList, CheckCircle2 } from 'lucide-react'
import { Skeleton } from '@/components/ui'
import api from '@/lib/axios'

interface Props {
  tahunAjaranId: string
  semesterId?:   string
  totalMapel?:   number  // dari mapelResponse.meta.total
  totalGuru?:    number  // dihitung dari mapelList di page (guru unik)
}

interface KehadiranStat {
  rekapPerKelas: { persentaseHadir: number }[]
}

interface TugasItem {
  tugasId:           string
  judul:             string
  kelas:             string
  mapel:             string
  tanggalSelesai:    string
  totalSiswa:        number
  sudahSubmit:       number
  persentaseSubmit:  number
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
    gray:    'bg-gray-50 border-gray-200',
    emerald: 'bg-emerald-50 border-emerald-200',
    blue:    'bg-blue-50 border-blue-200',
    amber:   'bg-amber-50 border-amber-200',
    purple:  'bg-purple-50 border-purple-200',
  }
  const iconColorMap = {
    gray:    'text-gray-400',
    emerald: 'text-emerald-500',
    blue:    'text-blue-500',
    amber:   'text-amber-500',
    purple:  'text-purple-500',
  }

  return (
    <div className={`rounded-2xl border ${colorMap[color]} p-4 flex items-center gap-4`}>
      <div className={`rounded-lg p-2.5 ${colorMap[color]}`}>
        <Icon className={`w-5 h-5 ${iconColorMap[color]}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        {loading ? (
          <Skeleton className="h-6 w-16 rounded mt-0.5" />
        ) : (
          <p className="text-xl font-bold text-gray-800">{value}</p>
        )}
        {sub && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  )
}

export function MapelStatCards({ tahunAjaranId, semesterId, totalMapel, totalGuru }: Props) {
  const enabled = !!tahunAjaranId

  // dashboard fetch dihapus — totalGuru dihitung dari mapelList di page

  const { data: kehadiran, isLoading: l2 } = useQuery({
    queryKey: ['report-kehadiran-mapel', tahunAjaranId, semesterId],
    queryFn:  async (): Promise<KehadiranStat> => {
      const res = await api.get('/report/kehadiran', {
        params: { tahunAjaranId, semesterId }
      })
      return res.data
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  })

  const { data: tugasList = [], isLoading: l3 } = useQuery({
    queryKey: ['report-tugas-mapel', tahunAjaranId, semesterId],
    queryFn:  async (): Promise<TugasItem[]> => {
      const res = await api.get('/report/tugas', {
        params: { tahunAjaranId }
      })
      return res.data ?? []
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  })

  // Rata-rata kehadiran semua kelas
  const avgKehadiran = (() => {
    const rekap = kehadiran?.rekapPerKelas ?? []
    if (rekap.length === 0) return 0
    const total = rekap.reduce((acc, k) => acc + k.persentaseHadir, 0)
    return Math.round(total / rekap.length)
  })()

  // Stat tugas agregat
  const totalTugas    = tugasList.length
  const totalSubmit   = tugasList.reduce((acc, t) => acc + t.sudahSubmit, 0)
  const totalSiswa    = tugasList.reduce((acc, t) => acc + t.totalSiswa, 0)
  const avgKetuntasan = totalSiswa > 0
    ? Math.round((totalSubmit / totalSiswa) * 100)
    : 0

  if (!tahunAjaranId) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <StatCard
        label="Mata Pelajaran"
        value={totalMapel ?? 0}
        sub="semester ini"
        icon={BookOpen}
        color="blue"
        loading={false}
      />
      <StatCard
        label="Guru Pengajar"
        value={totalGuru ?? 0}
        sub="dari mapel aktif"
        icon={User}
        color="purple"
        loading={false}
      />
      <StatCard
        label="Rata Kehadiran"
        value={`${avgKehadiran}%`}
        sub="semua kelas"
        icon={CalendarDays}
        color={avgKehadiran >= 80 ? 'emerald' : 'amber'}
        loading={l2}
      />
      <StatCard
        label="Total Tugas"
        value={totalTugas}
        sub={`${totalSubmit} terkumpul`}
        icon={ClipboardList}
        color="gray"
        loading={l3}
      />
      <StatCard
        label="Ketuntasan Tugas"
        value={`${avgKetuntasan}%`}
        sub="rata-rata submit"
        icon={CheckCircle2}
        color={avgKetuntasan >= 70 ? 'emerald' : 'amber'}
        loading={l3}
      />
    </div>
  )
}
