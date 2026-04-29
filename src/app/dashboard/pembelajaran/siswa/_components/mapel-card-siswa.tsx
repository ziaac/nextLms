'use client'

import { useRouter } from 'next/navigation'
import {
  BookOpen, ClipboardList,
  CalendarDays, Users, AlertCircle, Clock, CheckCircle2,
} from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import type { MapelSiswaItem } from '@/types/akademik.types'
import { formatJam } from '@/lib/helpers/timezone'

interface Props {
  mapel:          MapelSiswaItem
  kelasId:        string
  tahunAjaranId:  string
  siswaId?:       string
  todoCount?:     number   // jumlah todo (dihitung dari parent page)
  onKlik:         (mapel: MapelSiswaItem) => void
  readOnly?:      boolean
}

function StatBar({
  label, value, max, color = 'emerald',
}: {
  label: string; value: number; max: number; color?: 'emerald' | 'blue' | 'amber'
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const colorMap = { emerald: 'bg-emerald-400', blue: 'bg-blue-400', amber: 'bg-amber-400' }
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{label}</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-50 dark:bg-gray-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${colorMap[color]}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function MapelCardSiswa({
  mapel, kelasId, todoCount = 0, onKlik, readOnly,
}: Props) {
  const router = useRouter()
  const adaTugasBelumSelesai = mapel.stats.tugasTotal > 0 &&
    mapel.stats.tugasSelesai < mapel.stats.tugasTotal

  const jadwalText = mapel.jadwal && mapel.jadwal.length > 0
    ? mapel.jadwal
        .map((j) => {
          const hari = j.hari.charAt(0) + j.hari.slice(1, 3).toLowerCase()
          const jam  = j.jamMulai ? formatJam(j.jamMulai) : ''
          return jam ? `${hari} ${jam}` : hari
        })
        .join(' · ')
    : null

  return (
    <div
      className={[
        'rounded-2xl border bg-white dark:bg-gray-900 p-5 flex flex-col gap-4 grid grid-cols-1',
        'hover:shadow-sm transition-shadow cursor-pointer',
        readOnly ? 'border-gray-100 dark:border-gray-800 opacity-80' : 'border-gray-100 dark:border-gray-800',
      ].join(' ')}
      onClick={() => onKlik(mapel)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{mapel.namaMapel}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{mapel.kodeMapel}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant="info">{mapel.kategori}</Badge>
          {todoCount > 0 && (
            <Badge variant="danger">{todoCount} to do</Badge>
          )}
        </div>
      </div>

      {/* Pengajar */}
      {mapel.timPengajar.length > 0 && (
        <div className="space-y-1">
          {mapel.timPengajar.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <div className={[
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                p.isKoordinator ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
              ].join(' ')}>
                {p.nama.charAt(0)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{p.nama}</p>
              {p.isKoordinator && (
                <span className="text-[10px] text-emerald-500 dark:text-emerald-400 shrink-0">Koordinator</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Jadwal */}
      <div className="flex items-center gap-1.5 text-xs min-w-0">
        <Clock className="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
        {jadwalText ? (
          <span className="text-gray-600 dark:text-gray-300 truncate">{jadwalText}</span>
        ) : (
          <span className="text-amber-500 dark:text-amber-400 italic">Jadwal belum ditentukan</span>
        )}
      </div>

      {/* Todo indicator */}
      {todoCount > 0 ? (
        <div className="flex items-center gap-2 rounded-lg bg-red-50/70 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 px-3 py-2">
          <AlertCircle className="w-4 h-4 text-red-400 dark:text-red-500 shrink-0" />
          <p className="text-xs text-red-500 dark:text-red-400">
            {todoCount} item perlu perhatian — klik untuk detail
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 dark:text-emerald-600 shrink-0" />
          <p className="text-xs text-gray-400 dark:text-gray-500">Semua tugas & absensi lengkap</p>
        </div>
      )}

      {/* Stat */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Kehadiran: <span className="font-semibold text-gray-700 dark:text-gray-300">
            {mapel.stats.absensiPercentage}%
          </span></span>
        </div>
        <StatBar
          label="Tugas Terkumpul"
          value={mapel.stats.tugasSelesai}
          max={mapel.stats.tugasTotal}
          color={adaTugasBelumSelesai ? 'amber' : 'emerald'}
        />
      </div>

      {/* Tombol navigasi — stopPropagation agar tidak trigger slideover */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-50 dark:border-gray-800/60"
        onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="secondary"
          leftIcon={<CalendarDays className="w-3.5 h-3.5" />}
          onClick={() => router.push(`/dashboard/absensi?mataPelajaranId=${mapel.id}`)}>
          Absensi
        </Button>
        <Button size="sm" variant="secondary"
          leftIcon={<BookOpen className="w-3.5 h-3.5" />}
          onClick={() => router.push(`/dashboard/materi-pelajaran?mataPelajaranId=${mapel.id}`)}>
          Materi
        </Button>
        <Button size="sm" variant="secondary"
          leftIcon={<ClipboardList className="w-3.5 h-3.5" />}
          onClick={() => router.push(`/dashboard/tugas?mataPelajaranId=${mapel.id}`)}>
          Tugas
        </Button>
        <Button size="sm" variant="secondary"
          leftIcon={<Users className="w-3.5 h-3.5" />}
          onClick={() => router.push(`/dashboard/kelas/${kelasId}`)}>
          Teman Kelas
        </Button>
      </div>

      {readOnly && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">Mode arsip — hanya lihat</p>
      )}
    </div>
  )
}
