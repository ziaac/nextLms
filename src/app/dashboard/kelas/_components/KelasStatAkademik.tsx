'use client'

import { useQuery } from '@tanstack/react-query'
import { BookOpen, CalendarDays, BarChart2, CheckCircle2 } from 'lucide-react'
import { Skeleton } from '@/components/ui'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import api from '@/lib/axios'

interface Props {
  kelasId:       string
  tahunAjaranId: string
}

interface KehadiranStat {
  rekapPerKelas: { kelasId: string; persentaseHadir: number }[]
}

interface MapelOverviewItem {
  mataPelajaranId: string | null
  performaGlobal: {
    rataRataKehadiranSiswa: number
    rataRataNilaiRaport:    number
    persentaseTugasSelesai: number
  }
}

interface MataPelajaranResp {
  data: unknown[]
  meta: { total: number }
}

function useStatSemester(
  kelasId:       string,
  tahunAjaranId: string,
  semesterId:    string,
  enabled:       boolean,
) {
  const kehadiran = useQuery({
    queryKey: ['kehadiran-kelas', kelasId, semesterId],
    queryFn:  async (): Promise<KehadiranStat> => {
      const res = await api.get('/report/kehadiran', {
        params: { tahunAjaranId, kelasId, ...(semesterId ? { semesterId } : {}) },
      })
      return res.data
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  })

  const overview = useQuery({
    queryKey: ['mapel-overview-kelas', kelasId, semesterId],
    queryFn:  async (): Promise<MapelOverviewItem[]> => {
      const res = await api.get('/report/mapel/overview', {
        params: { tahunAjaranId, kelasId, ...(semesterId ? { semesterId } : {}) },
      })
      return res.data ?? []
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  })

  const mapelCount = useQuery({
    queryKey: ['mapel-count-kelas', kelasId, semesterId],
    queryFn:  async (): Promise<number> => {
      const res = await api.get<MataPelajaranResp>('/mata-pelajaran', {
        params: { kelasId, ...(semesterId ? { semesterId } : {}), limit: 1 },
      })
      return res.data.meta.total
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  })

  const items = overview.data ?? []
  const avgKehadiran = items.length > 0 && items[0]?.performaGlobal
    ? Math.round(items.reduce((a, i) => a + (i.performaGlobal?.rataRataKehadiranSiswa ?? 0), 0) / items.length)
    : (kehadiran.data?.rekapPerKelas.find((k) => k.kelasId === kelasId)?.persentaseHadir ?? 0)
  const avgNilai = items.length > 0 && items[0]?.performaGlobal
    ? parseFloat((items.reduce((a, i) => a + (i.performaGlobal?.rataRataNilaiRaport ?? 0), 0) / items.length).toFixed(1))
    : 0
  const avgKetuntasan = items.length > 0 && items[0]?.performaGlobal
    ? Math.round(items.reduce((a, i) => a + (i.performaGlobal?.persentaseTugasSelesai ?? 0), 0) / items.length)
    : 0

  return {
    isLoading:    kehadiran.isLoading || overview.isLoading || mapelCount.isLoading,
    totalMapel:   mapelCount.data ?? 0,
    avgKehadiran,
    avgNilai,
    avgKetuntasan,
  }
}

function MiniRow({ label, value, color = 'gray' }: {
  label: string
  value: string | number
  color?: 'gray' | 'emerald' | 'amber' | 'blue'
}) {
  const cls = {
    gray:    'text-gray-700 dark:text-gray-300',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber:   'text-amber-600 dark:text-amber-400',
    blue:    'text-blue-600 dark:text-blue-400',
  }[color]
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-xs font-semibold ${cls}`}>{value}</span>
    </div>
  )
}

function SemesterBlock({
  label, kelasId, tahunAjaranId, semesterId,
}: {
  label:         string
  kelasId:       string
  tahunAjaranId: string
  semesterId:    string
}) {
  const stat = useStatSemester(kelasId, tahunAjaranId, semesterId, !!semesterId)
  if (!semesterId) return null
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 px-3 py-2 space-y-1">
      <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        Semester {label}
      </p>
      {stat.isLoading ? (
        <div className="space-y-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full rounded" />
          ))}
        </div>
      ) : (
        <>
          <MiniRow label="Mata Pelajaran" value={stat.totalMapel} />
          <MiniRow
            label="Rata Kehadiran"
            value={`${stat.avgKehadiran}%`}
            color={stat.avgKehadiran >= 80 ? 'emerald' : 'amber'}
          />
          <MiniRow
            label="Rata-rata Nilai"
            value={stat.avgNilai > 0 ? stat.avgNilai : '-'}
            color={stat.avgNilai >= 75 ? 'blue' : 'amber'}
          />
          <MiniRow
            label="Ketuntasan Tugas"
            value={`${stat.avgKetuntasan}%`}
            color={stat.avgKetuntasan >= 70 ? 'emerald' : 'amber'}
          />
        </>
      )}
    </div>
  )
}

const STAT_ITEMS = [
  { key: 'totalMapel',    label: 'Total Mapel',      icon: BookOpen,      thresholdKey: null },
  { key: 'avgKehadiran',  label: 'Rata Kehadiran',   icon: CalendarDays,  threshold: 80 },
  { key: 'avgNilai',      label: 'Rata-rata Nilai',  icon: BarChart2,     threshold: 75 },
  { key: 'avgKetuntasan', label: 'Ketuntasan Tugas', icon: CheckCircle2,  threshold: 70 },
] as const

export function KelasStatAkademik({ kelasId, tahunAjaranId }: Props) {
  const { data: semesterList = [], isLoading: loadingSmt } =
    useSemesterByTahunAjaran(tahunAjaranId || null)

  const smtGanjil = semesterList.find((s) => s.urutan === 1 || s.nama === 'GANJIL')
  const smtGenap  = semesterList.find((s) => s.urutan === 2 || s.nama === 'GENAP')

  // Gabungan semua semester
  const statAll = useStatSemester(kelasId, tahunAjaranId, '', !loadingSmt && !!tahunAjaranId)

  if (!tahunAjaranId) return null

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Statistik Akademik
      </p>

      {statAll.isLoading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              label: 'Total Mapel',
              value: statAll.totalMapel,
              icon: BookOpen,
              color: 'blue' as const,
            },
            {
              label: 'Rata Kehadiran',
              value: `${statAll.avgKehadiran}%`,
              icon: CalendarDays,
              color: (statAll.avgKehadiran >= 80 ? 'emerald' : 'amber'),
            },
            {
              label: 'Rata-rata Nilai',
              value: statAll.avgNilai > 0 ? statAll.avgNilai : '-',
              icon: BarChart2,
              color: (statAll.avgNilai >= 75 ? 'blue' : 'amber'),
            },
            {
              label: 'Ketuntasan Tugas',
              value: `${statAll.avgKetuntasan}%`,
              icon: CheckCircle2,
              color: (statAll.avgKetuntasan >= 70 ? 'emerald' : 'amber'),
            },
          ].map((s) => {
            const colorMap: Record<string, string> = {
              blue:    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
              emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
              amber:   'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
            }
            return (
              <div key={s.label} className={`rounded-lg border ${colorMap[s.color]} px-3 py-2.5`}>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] font-medium opacity-80 mt-0.5">{s.label}</p>
              </div>
            )
          })}
        </div>
      )}

      {semesterList.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Per Semester</p>
          <SemesterBlock
            label={smtGanjil?.nama ?? 'Ganjil'}
            kelasId={kelasId}
            tahunAjaranId={tahunAjaranId}
            semesterId={smtGanjil?.id ?? ''}
          />
          <SemesterBlock
            label={smtGenap?.nama ?? 'Genap'}
            kelasId={kelasId}
            tahunAjaranId={tahunAjaranId}
            semesterId={smtGenap?.id ?? ''}
          />
        </div>
      )}
    </div>
  )
}
