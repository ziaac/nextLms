'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { SlideOver, Button, Spinner } from '@/components/ui'
import { useRosterKelas, useExportJadwalKelas } from '@/hooks/jadwal/useJadwal'
import { useQuery } from '@tanstack/react-query'
import { jadwalApi } from '@/lib/api/jadwal.api'
import { HariFilter } from '@/components/jadwal/HariFilter'
import { Pencil, Download, Clock, User, MapPin, CalendarDays, BookOpen } from 'lucide-react'
import type { HariEnum, RosterItem, RingkasanKelasDetailResponse } from '@/types/jadwal.types'

const HARI_LIST: HariEnum[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']
const HARI_LABEL: Record<HariEnum, string> = {
  SENIN: 'Senin', SELASA: 'Selasa', RABU: 'Rabu',
  KAMIS: 'Kamis', JUMAT: "Jum'at", SABTU: 'Sabtu',
}

interface Props {
  open:       boolean
  onClose:    () => void
  kelasId:    string
  semesterId: string
  namaKelas:  string
}

export function RosterSlideOver({ open, onClose, kelasId, semesterId, namaKelas }: Props) {
  const router = useRouter()
  const [selectedHari, setSelectedHari] = useState<HariEnum | 'ALL'>('ALL')

  const { data: rosterRaw, isLoading: loadingRoster, isFetching } =
    useRosterKelas(open ? kelasId : null, open ? semesterId : null)

  const { data: ringkasanRaw, isLoading: loadingRingkasan } = useQuery({
    queryKey: ['jadwal', 'ringkasan-kelas', kelasId, semesterId],
    queryFn:  () => jadwalApi.getRingkasanKelas(kelasId, semesterId),
    enabled:  open && !!kelasId && !!semesterId,
    staleTime: 0,
  })

  const exportMutation = useExportJadwalKelas()

  const roster = rosterRaw as {
    roster:   Record<HariEnum, RosterItem[]>
    totalJam: number
  } | undefined

  const ringkasan = ringkasanRaw as RingkasanKelasDetailResponse | undefined

  const showSkeleton = loadingRoster || isFetching || (open && !roster)

  // Hari yang ada datanya
  const availableHari = useMemo((): HariEnum[] =>
    HARI_LIST.filter((h) => (roster?.roster[h]?.length ?? 0) > 0),
    [roster]
  )

  // Hari yang ditampilkan sesuai filter
  const hariTampil = useMemo((): HariEnum[] =>
    selectedHari === 'ALL'
      ? availableHari
      : availableHari.filter((h) => h === selectedHari),
    [availableHari, selectedHari]
  )

  const jpPerHari = useMemo(() => {
    if (!ringkasan?.rincian) return {} as Record<string, number>
    return ringkasan.rincian.reduce<Record<string, number>>((acc, r) => {
      for (const d of (r.detail ?? [])) acc[d.hari] = (acc[d.hari] ?? 0) + d.bobot
      return acc
    }, {})
  }, [ringkasan])

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync({ semesterId, kelasId })
      toast.success('Export berhasil')
    } catch { toast.error('Gagal export') }
  }

  const handleEdit = () => {
    onClose()
    router.push('/dashboard/jadwal/manajemen/buat-jadwal?kelasId=' + kelasId + '&semesterId=' + semesterId)
  }

  return (
    <SlideOver open={open} onClose={onClose} title={'Jadwal — ' + namaKelas} width="lg">
      {open && (
        <div className="flex flex-col h-full">
          {/* Action bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-emerald-500" />
              <span className="text-gray-500">Total:</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {ringkasan?.totalJam ?? roster?.totalJam ?? '—'} JP
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleExport} disabled={exportMutation.isPending}>
                {exportMutation.isPending ? <Spinner /> : <Download className="h-4 w-4 mr-1.5" />}Export
              </Button>
              <Button variant="primary" size="sm" onClick={handleEdit}>
                <Pencil className="h-4 w-4 mr-1.5" />Edit
              </Button>
            </div>
          </div>

          {/* HariFilter */}
          {!showSkeleton && availableHari.length > 0 && (
            <div className="px-5 py-2.5 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <HariFilter available={availableHari} selected={selectedHari} onChange={setSelectedHari} />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {showSkeleton ? (
              <RosterSkeleton />
            ) : hariTampil.length === 0 ? (
              <EmptyState onEdit={handleEdit} />
            ) : (
              <>
                {/* Summary mapel */}
                {ringkasan && ringkasan.rincian.length > 0 && selectedHari === 'ALL' && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Ringkasan Mata Pelajaran
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {ringkasan.rincian.map((r, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2 border border-gray-100 dark:border-gray-800">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{r.namaMapel}</p>
                            <p className="text-[10px] text-gray-400 truncate">{r.guru}</p>
                          </div>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 ml-3 shrink-0">
                            {r.totalJam} JP
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="h-px bg-gray-100 dark:bg-gray-800 mt-4" />
                  </div>
                )}

                {/* Jadwal per hari */}
                {hariTampil.map((hari) => {
                  const slots  = roster!.roster[hari] ?? []
                  const hariJP = jpPerHari[hari]
                  return (
                    <div key={hari}>
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            {HARI_LABEL[hari]}
                          </span>
                        </div>
                        <div className="flex-1 h-px bg-emerald-100 dark:bg-emerald-800/40" />
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                          {hariJP != null ? hariJP + ' JP' : slots.length + ' sesi'}
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {slots.map((slot, idx) => (
                          <RosterCard key={slot.jadwalId ?? idx} slot={slot} idx={idx} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      )}
    </SlideOver>
  )
}

function RosterCard({ slot, idx }: { slot: RosterItem; idx: number }) {
  return (
    <div className="flex items-stretch rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
      <div className="flex items-center justify-center px-3 bg-emerald-50 dark:bg-emerald-900/20 shrink-0">
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 w-4 text-center">{idx + 1}</span>
      </div>
      <div className="w-px bg-gray-100 dark:bg-gray-800 shrink-0" />
      <div className="flex-1 min-w-0 px-3 py-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wide">
              {slot.mataPelajaran.kode}
            </span>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug">
              {slot.mataPelajaran.nama}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-base font-bold text-gray-800 dark:text-gray-100 font-mono leading-tight">
              {slot.jamMulai}
            </p>
            <p className="text-base font-bold text-gray-500 dark:text-gray-400 font-mono leading-tight">
              {slot.jamSelesai}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <User className="h-3 w-3 text-gray-400" />
            <span>{slot.guru.namaLengkap}</span>
          </div>
          {slot.ruangan && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="h-3 w-3" />
              <span>{slot.ruangan.nama}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <CalendarDays className="h-7 w-7 text-gray-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Belum ada jadwal</p>
        <p className="text-xs text-gray-400 mt-1">Kelas ini belum memiliki jadwal untuk semester ini.</p>
      </div>
      <Button variant="primary" size="sm" onClick={onEdit}>
        <Pencil className="h-4 w-4 mr-1.5" />Buat Jadwal Sekarang
      </Button>
    </div>
  )
}

function RosterSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {[4,3,5,2].map((count, i) => (
        <div key={i}>
          <div className="flex items-center gap-3 mb-2.5">
            <div className="h-3 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded" />
            <div className="flex-1 h-px bg-emerald-100 dark:bg-emerald-800/30" />
            <div className="h-5 w-14 bg-gray-100 dark:bg-gray-800 rounded-full" />
          </div>
          <div className="space-y-2">
            {[...Array(Math.ceil(count / 2))].map((_, j) => (
              <div key={j} className="h-[68px] rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden flex">
                <div className="w-10 bg-emerald-50 dark:bg-emerald-900/20 shrink-0" />
                <div className="w-px bg-gray-100 dark:bg-gray-800" />
                <div className="flex-1 px-3 py-2.5 space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3.5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                  <div className="h-3 w-28 bg-gray-100 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
