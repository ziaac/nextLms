'use client'

import { useRouter } from 'next/navigation'
import { useQuery }  from '@tanstack/react-query'
import {
  BookOpen, ClipboardList, CalendarDays,
  Users, Clock, AlertCircle, FileText,
} from 'lucide-react'
import { Button, Badge, Skeleton } from '@/components/ui'
import { formatJam }  from '@/lib/helpers/timezone'
import { reportApi }  from '@/lib/api/report.api'
import api            from '@/lib/axios'
import type { MataPelajaran } from '@/types/akademik.types'

interface Props {
  mapel:         MataPelajaran
  tahunAjaranId: string
  semesterId:    string
  onKlik:        (mapel: MataPelajaran) => void
}

function StatMini({
  label, value, icon: Icon, color = 'gray', highlight = false,
}: {
  label:      string
  value:      string | number
  icon:       React.ElementType
  color?:     'gray' | 'emerald' | 'amber' | 'blue' | 'red'
  highlight?: boolean
}) {
  const colorMap = {
    gray:    'text-gray-400 bg-gray-50 dark:bg-gray-800/50',
    emerald: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    amber:   'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    blue:    'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    red:     'text-red-500 bg-red-50 dark:bg-red-900/20',
  }
  return (
    <div className={[
      'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors',
      highlight
        ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10'
        : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900',
    ].join(' ')}>
      <div className={`rounded-lg p-1.5 shrink-0 ${colorMap[color]}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 tabular-nums">{value}</p>
      </div>
    </div>
  )
}

export function MapelCardGuru({ mapel, tahunAjaranId, semesterId, onKlik }: Props) {
  const router    = useRouter()
  const namaMapel = mapel.mataPelajaranTingkat.masterMapel.nama
  const kodeMapel = mapel.mataPelajaranTingkat.masterMapel.kode
  const namaKelas = mapel.kelas.namaKelas

  // ── Stat & Todo ──────────────────────────────────────────────
  const { data: stat, isLoading: loadingStat } = useQuery({
    queryKey: ['report-guru-saya', mapel.id, semesterId],
    queryFn:  () => reportApi.getGuruSaya({ tahunAjaranId, semesterId, mataPelajaranId: mapel.id }),
    staleTime: 1000 * 60 * 5,
    enabled:   !!tahunAjaranId && !!semesterId,
  })

  const { data: todo } = useQuery({
    queryKey: ['guru-todo', mapel.id],
    queryFn:  () => reportApi.getGuruTodo({ mataPelajaranId: mapel.id }),
    staleTime: 1000 * 60 * 2,
  })

  // Siswa count dari kelas
  const { data: kelasData } = useQuery({
    queryKey: ['kelas-statistik', mapel.kelasId],
    queryFn:  async () => {
      const res = await api.get<{ jumlahSiswa: number }>(`/kelas/${mapel.kelasId}/statistik`)
      return res.data
    },
    enabled:   !!mapel.kelasId,
    staleTime: 1000 * 60 * 10,
  })

  const totalTodo = (todo?.menungguPenilaian.length ?? 0) +
    (todo?.jadwalHariIni.filter((j) =>
      j.statusSesi === 'AKSI_DIBUTUHKAN' || j.statusSesi === 'TERLEWAT',
    ).length ?? 0)
  const adaTodo = totalTodo > 0

  // ── Jadwal display ────────────────────────────────────────────
  // jam ada di masterJam.jamMulai (nested), bukan di j.jamMulai langsung
  const jadwalText = mapel.jadwalPelajaran.length > 0
    ? mapel.jadwalPelajaran
        .map((j) => {
          const hari = j.hari.charAt(0) + j.hari.slice(1, 3).toLowerCase()
          const jam  = j.masterJam?.jamMulai ? formatJam(j.masterJam.jamMulai) : ''
          return jam ? `${hari} ${jam}` : hari
        })
        .join(' · ')
    : null

  return (
    <div
      className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 flex flex-col gap-3.5 hover:shadow-md transition-shadow cursor-pointer grid grid-cols-1"
      onClick={() => onKlik(mapel)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{namaMapel}</p>
            <span
              title={adaTodo ? `${totalTodo} item perlu perhatian` : 'Semua beres'}
              className={[
                'w-2 h-2 rounded-full shrink-0 mt-0.5',
                adaTodo ? 'bg-red-500' : 'bg-emerald-400 dark:bg-emerald-500',
              ].join(' ')}
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{kodeMapel} · {namaKelas}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant={mapel.isActive ? 'success' : 'default'}>
            {mapel.isActive ? 'Aktif' : 'Nonaktif'}
          </Badge>
          <Badge variant="info">{mapel.mataPelajaranTingkat.masterMapel.kategori}</Badge>
        </div>
      </div>

      {/* Jadwal */}
      <div className="flex items-center gap-1.5 text-xs min-w-0">
        <Clock className="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
        {jadwalText ? (
          <span className="text-gray-600 dark:text-gray-300 truncate">{jadwalText}</span>
        ) : (
          <span className="text-amber-500 dark:text-amber-400 italic">Jadwal belum ditentukan</span>
        )}
      </div>

      {/* Stat 4 item: Siswa | Materi | Tugas | Todo */}
      {loadingStat ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <StatMini
            label="Siswa"
            value={kelasData?.jumlahSiswa ?? '–'}
            icon={Users}
            color="blue"
          />
          <StatMini
            label="Materi"
            value={mapel._count.materiPelajaran}
            icon={BookOpen}
            color="gray"
          />
          <StatMini
            label="Tugas"
            value={mapel._count.tugas}
            icon={ClipboardList}
            color="emerald"
          />
          <StatMini
            label="To Do"
            value={totalTodo > 0 ? totalTodo : '✓'}
            icon={AlertCircle}
            color={adaTodo ? 'amber' : 'gray'}
            highlight={adaTodo}
          />
        </div>
      )}

      {/* Shortcut Buttons: Dokumen | Materi | Tugas | Absensi */}
      <div
        className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <Button size="sm" variant="secondary"
          leftIcon={<FileText className="w-3.5 h-3.5" />}
          onClick={() => router.push('/dashboard/dokumen-pengajaran')}
        >
          Dokumen
        </Button>
        <Button size="sm" variant="secondary"
          leftIcon={<BookOpen className="w-3.5 h-3.5" />}
          onClick={() => router.push(`/dashboard/materi-pelajaran?mataPelajaranId=${mapel.id}&kelasId=${mapel.kelasId}`)}
        >
          Materi
        </Button>
        <Button size="sm" variant="secondary"
          leftIcon={<ClipboardList className="w-3.5 h-3.5" />}
          onClick={() => router.push(`/dashboard/tugas?mataPelajaranId=${mapel.id}`)}
        >
          Tugas
        </Button>
        <Button size="sm" variant="secondary"
          leftIcon={<CalendarDays className="w-3.5 h-3.5" />}
          onClick={() => router.push(`/dashboard/absensi/guru?mataPelajaranId=${mapel.id}`)}
        >
          Absensi
        </Button>
      </div>
    </div>
  )
}
