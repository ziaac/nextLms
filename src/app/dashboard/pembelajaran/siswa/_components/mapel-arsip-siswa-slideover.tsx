'use client'

import { useState }             from 'react'
import { useQuery }             from '@tanstack/react-query'
import { useRouter }            from 'next/navigation'
import { BookOpen, ClipboardList, CalendarDays, ChevronDown } from 'lucide-react'
import { SlideOver, Button, Skeleton } from '@/components/ui'
import { reportApi }            from '@/lib/api/report.api'
import type { MapelSiswaItem }  from '@/types/akademik.types'

interface KelasSiswaArsip {
  kelasId:       string
  namaKelas:     string
  tahunAjaran:   string
  semesterId?:   string
  tahunAjaranId: string
}

interface Props {
  open:       boolean
  onClose:    () => void
  siswaId:    string
  kelasArsip: KelasSiswaArsip[]
}

function ArsipGroup({
  kelas, siswaId,
}: {
  kelas:   KelasSiswaArsip
  siswaId: string
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(true)

  const { data: overview, isLoading } = useQuery({
    queryKey: ['siswa-overview-arsip', siswaId, kelas.tahunAjaranId],
    queryFn:  () => reportApi.getSiswaOverview({
      tahunAjaranId: kelas.tahunAjaranId,
      siswaId,
    }),
    staleTime: 1000 * 60 * 10,
  })

  const mapelList: MapelSiswaItem[] = overview?.mapel ?? []

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      {/* Header group */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <p className="text-sm font-semibold text-gray-700">{kelas.tahunAjaran}</p>
          <p className="text-xs text-gray-400">{kelas.namaKelas} · {mapelList.length} mapel</p>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Mapel list */}
      {expanded && (
        <div className="p-3 space-y-2">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          )}

          {!isLoading && mapelList.length === 0 && (
            <p className="text-xs text-gray-400 italic text-center py-4">
              Tidak ada mata pelajaran tercatat
            </p>
          )}

          {!isLoading && mapelList.map((mapel) => (
            <div
              key={mapel.id}
              className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-700 leading-tight">{mapel.namaMapel}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{mapel.kodeMapel} · {mapel.kategori}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">Kehadiran</p>
                  <p className="text-sm font-bold text-gray-700">{mapel.stats.absensiPercentage}%</p>
                </div>
              </div>

              {/* Mini progress bar tugas */}
              {mapel.stats.tugasTotal > 0 && (
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Tugas selesai</span>
                    <span>{mapel.stats.tugasSelesai}/{mapel.stats.tugasTotal}</span>
                  </div>
                  <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${Math.round((mapel.stats.tugasSelesai / mapel.stats.tugasTotal) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Aksi */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<BookOpen className="w-3 h-3" />}
                  onClick={() => router.push(`/dashboard/materi-pelajaran?mataPelajaranId=${mapel.id}&readOnly=true`)}
                >
                  Materi
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<ClipboardList className="w-3 h-3" />}
                  onClick={() => router.push(`/dashboard/tugas?mataPelajaranId=${mapel.id}&readOnly=true`)}
                >
                  Tugas
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<CalendarDays className="w-3 h-3" />}
                  onClick={() => router.push(`/dashboard/absensi?mataPelajaranId=${mapel.id}&readOnly=true`)}
                >
                  Absensi
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function MapelArsipSiswaSlideover({ open, onClose, siswaId, kelasArsip }: Props) {
  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Arsip Mata Pelajaran"
      description="Riwayat mata pelajaran dari tahun ajaran yang sudah selesai"
      width="md"
    >
      <div className="space-y-3">

        {kelasArsip.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <BookOpen className="w-10 h-10 opacity-20" />
            <p className="text-sm font-medium">Belum ada arsip</p>
            <p className="text-xs opacity-60 text-center">
              Riwayat tahun ajaran yang sudah selesai akan muncul di sini
            </p>
          </div>
        )}

        {kelasArsip.map((kelas) => (
          <ArsipGroup
            key={kelas.tahunAjaranId + kelas.kelasId}
            kelas={kelas}
            siswaId={siswaId}
          />
        ))}
      </div>
    </SlideOver>
  )
}
