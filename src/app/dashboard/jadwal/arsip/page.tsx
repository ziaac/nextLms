'use client'

import { useMemo, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Printer, CalendarDays, Users, MapPin } from 'lucide-react'
import { useMyJadwalMingguan, useExportMyJadwal } from '@/hooks/jadwal/useJadwalView'
import { Button }                     from '@/components/ui'
import { toast }                      from 'sonner'
import type { JadwalMingguanItem }    from '@/types/jadwal-view.types'
import type { HariEnum }              from '@/types/jadwal.types'

const HARI_LIST: HariEnum[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']
const HARI_LABEL: Record<HariEnum, string> = {
  SENIN: 'Senin', SELASA: 'Selasa', RABU: 'Rabu',
  KAMIS: 'Kamis', JUMAT: "Jum'at", SABTU: 'Sabtu',
}

interface TimeSlot {
  urutanJam:  number
  jamMulai:   string
  jamSelesai: string
}

export default function JadwalArsipDetailPage() {
  return <Suspense><JadwalArsipDetailContent /></Suspense>
}
function JadwalArsipDetailContent() {
  const router     = useRouter()
  const params     = useSearchParams()
  const semesterId = params.get('semesterId') ?? ''
  const semNama    = params.get('semNama')    ?? 'Semester'
  const taNama     = params.get('taNama')     ?? ''

  const { data: jadwalRaw, isLoading } = useMyJadwalMingguan(semesterId || null)
  const items   = (jadwalRaw?.data ?? []) as JadwalMingguanItem[]
  const totalJp = jadwalRaw?.totalJp ?? 0

  const exportMutation = useExportMyJadwal()
  const [exporting, setExporting] = useState(false)

  // ── Build matrix data ──────────────────────────────────────────
  const timeSlots = useMemo((): TimeSlot[] => {
    const seen = new Map<number, TimeSlot>()
    items.forEach((i) => {
      if (!seen.has(i.urutanJam))
        seen.set(i.urutanJam, { urutanJam: i.urutanJam, jamMulai: i.jamMulai, jamSelesai: i.jamSelesai })
    })
    return [...seen.values()].sort((a, b) => a.urutanJam - b.urutanJam)
  }, [items])

  // lookup: `${urutanJam}-${hari}` → item
  const cellMap = useMemo(() => {
    const m = new Map<string, JadwalMingguanItem>()
    items.forEach((i) => m.set(`${i.urutanJam}-${i.hari}`, i))
    return m
  }, [items])

  // ── Handlers ──────────────────────────────────────────────────
  const handleExport = async () => {
    if (!semesterId) return
    setExporting(true)
    try {
      await exportMutation.mutateAsync(semesterId)
      toast.success('Berhasil mengunduh PDF')
    } catch {
      toast.error('Gagal mengunduh PDF')
    } finally {
      setExporting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      {/* Back + actions */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <span className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" />
          </span>
          Kembali
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            leftIcon={<Printer size={15} />}
            onClick={() => window.print()}
          >
            Cetak
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Download size={15} />}
            loading={exporting}
            disabled={!semesterId}
            onClick={() => { void handleExport() }}
          >
            Download PDF
          </Button>
        </div>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <CalendarDays className="h-5 w-5 text-emerald-500 print:hidden" />
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 print:text-xl">
            Jadwal Mengajar
          </h1>
        </div>
        <p className="text-sm text-gray-500">
          {semNama}{taNama ? ` — ${taNama}` : ''}
          {totalJp > 0 && <span className="ml-2 text-gray-400">· {totalJp} JP</span>}
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2 animate-pulse">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="h-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="h-16 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900" />
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <CalendarDays className="h-12 w-12 text-gray-200 dark:text-gray-700" />
          <p className="text-sm text-gray-400">Tidak ada jadwal pada semester ini</p>
        </div>
      )}

      {/* Matrix — identik dengan tampilan jadwal kelas wali */}
      {!isLoading && items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 print:border-gray-300">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 print:bg-gray-100">
                {/* Kolom waktu */}
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-r border-gray-200 dark:border-gray-700 w-24 whitespace-nowrap sticky left-0 bg-gray-50 dark:bg-gray-800/60 print:bg-gray-100 z-10">
                  Waktu
                </th>
                {/* Semua hari — selalu tampil */}
                {HARI_LIST.map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-r last:border-r-0 border-gray-200 dark:border-gray-700 print:border-gray-300 min-w-[130px]"
                  >
                    {HARI_LABEL[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, rowIdx) => (
                <tr
                  key={slot.urutanJam}
                  className={rowIdx % 2 === 0
                    ? 'bg-white dark:bg-gray-900'
                    : 'bg-gray-50/60 dark:bg-gray-800/20'}
                >
                  {/* Waktu — sticky */}
                  <td className="px-3 py-3 border-b border-r border-gray-100 dark:border-gray-800 print:border-gray-200 align-middle sticky left-0 bg-inherit z-10">
                    <p className="text-sm font-bold font-mono text-gray-700 dark:text-gray-200 leading-tight tabular-nums">
                      {slot.jamMulai}
                    </p>
                    <p className="text-[11px] font-mono text-gray-400 leading-tight tabular-nums">
                      {slot.jamSelesai}
                    </p>
                  </td>

                  {/* Sel per hari */}
                  {HARI_LIST.map((h) => {
                    const item = cellMap.get(`${slot.urutanJam}-${h}`)
                    return (
                      <td
                        key={h}
                        className="px-2.5 py-2 border-b border-r last:border-r-0 border-gray-100 dark:border-gray-800 print:border-gray-200 align-top"
                      >
                        {item ? (
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-snug line-clamp-2">
                              {item.namaMapel}
                            </p>
                            <div className="flex items-center gap-1">
                              <Users className="h-2.5 w-2.5 text-gray-400 shrink-0 print:hidden" />
                              <span className="text-[10px] text-gray-500 truncate">{item.namaKelas}</span>
                            </div>
                            {item.ruangan && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-2.5 w-2.5 text-gray-400 shrink-0 print:hidden" />
                                <span className="text-[10px] text-gray-400 truncate">{item.ruangan}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-200 dark:text-gray-700 text-sm select-none">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
