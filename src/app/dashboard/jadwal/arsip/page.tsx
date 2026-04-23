'use client'

import { useMemo, useState, Suspense }    from 'react'
import { useSearchParams, useRouter }     from 'next/navigation'
import { ArrowLeft, Download, CalendarDays, Users, MapPin, BookOpen, BarChart2 } from 'lucide-react'
import { useMyJadwalMingguan, useExportMyJadwal } from '@/hooks/jadwal/useJadwalView'
import { useMataPelajaranList }           from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useMatrixMapelWali }             from '@/hooks/absensi/useWaliKelas'
import { exportMatrixBlob }               from '@/lib/api/absensi.api'
import { useAuthStore }                   from '@/stores/auth.store'
import { Button }                         from '@/components/ui'
import { Modal }                          from '@/components/ui/Modal'
import { Spinner }                        from '@/components/ui/Spinner'
import { MatrixTable }                    from '@/app/dashboard/absensi/manajemen/_components/MatrixTable'
import { toast }                          from 'sonner'
import type { JadwalMingguanItem }        from '@/types/jadwal-view.types'
import type { HariEnum }                  from '@/types/jadwal.types'
import type { MataPelajaran }             from '@/types/akademik.types'

const HARI_LIST: HariEnum[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']
const HARI_LABEL: Record<HariEnum, string> = {
  SENIN: 'Senin', SELASA: 'Selasa', RABU: 'Rabu',
  KAMIS: 'Kamis', JUMAT: "Jum'at", SABTU: 'Sabtu',
}

interface TimeSlot { urutanJam: number; jamMulai: string; jamSelesai: string }

export default function JadwalArsipDetailPage() {
  return <Suspense><JadwalArsipDetailContent /></Suspense>
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
        active
          ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ── Tab Jadwal ────────────────────────────────────────────────────────
function JadwalTab({ semesterId, semNama, taNama }: { semesterId: string; semNama: string; taNama: string }) {
  const { data: jadwalRaw, isLoading } = useMyJadwalMingguan(semesterId || null)
  const items   = (jadwalRaw?.data ?? []) as JadwalMingguanItem[]
  const totalJp = jadwalRaw?.totalJp ?? 0

  const exportMutation = useExportMyJadwal()
  const [exporting, setExporting] = useState(false)

  const timeSlots = useMemo((): TimeSlot[] => {
    const seen = new Map<number, TimeSlot>()
    items.forEach((i) => {
      if (!seen.has(i.urutanJam))
        seen.set(i.urutanJam, { urutanJam: i.urutanJam, jamMulai: i.jamMulai, jamSelesai: i.jamSelesai })
    })
    return [...seen.values()].sort((a, b) => a.urutanJam - b.urutanJam)
  }, [items])

  const cellMap = useMemo(() => {
    const m = new Map<string, JadwalMingguanItem>()
    items.forEach((i) => m.set(`${i.urutanJam}-${i.hari}`, i))
    return m
  }, [items])

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

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {semNama}{taNama ? ` — ${taNama}` : ''}
          {totalJp > 0 && <span className="ml-2 text-gray-400">· {totalJp} JP</span>}
        </p>
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

      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <CalendarDays className="h-12 w-12 text-gray-200 dark:text-gray-700" />
          <p className="text-sm text-gray-400">Tidak ada jadwal pada semester ini</p>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 print:border-gray-300">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 print:bg-gray-100">
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-r border-gray-200 dark:border-gray-700 w-24 whitespace-nowrap sticky left-0 bg-gray-50 dark:bg-gray-800/60 print:bg-gray-100 z-10">
                  Waktu
                </th>
                {HARI_LIST.map((h) => (
                  <th key={h} className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-r last:border-r-0 border-gray-200 dark:border-gray-700 print:border-gray-300 min-w-[130px]">
                    {HARI_LABEL[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, rowIdx) => (
                <tr key={slot.urutanJam} className={rowIdx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/60 dark:bg-gray-800/20'}>
                  <td className="px-3 py-3 border-b border-r border-gray-100 dark:border-gray-800 print:border-gray-200 align-middle sticky left-0 bg-inherit z-10">
                    <p className="text-sm font-bold font-mono text-gray-700 dark:text-gray-200 leading-tight tabular-nums">{slot.jamMulai}</p>
                    <p className="text-[11px] font-mono text-gray-400 leading-tight tabular-nums">{slot.jamSelesai}</p>
                  </td>
                  {HARI_LIST.map((h) => {
                    const item = cellMap.get(`${slot.urutanJam}-${h}`)
                    return (
                      <td key={h} className="px-2.5 py-2 border-b border-r last:border-r-0 border-gray-100 dark:border-gray-800 print:border-gray-200 align-top">
                        {item ? (
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-snug line-clamp-2">{item.namaMapel}</p>
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

// ── Tab Rekap Absensi ─────────────────────────────────────────────────
function RekapAbsensiTab({ semesterId, guruId }: { semesterId: string; guruId: string }) {
  const [exporting,   setExporting]   = useState<string | null>(null)
  const [rekapTarget, setRekapTarget] = useState<MataPelajaran | null>(null)

  const { data: mapelResp, isLoading } = useMataPelajaranList(
    { guruId, semesterId },
    { enabled: !!guruId && !!semesterId },
  )
  const mapelList = ((mapelResp as { data?: MataPelajaran[] } | undefined)?.data ?? []) as MataPelajaran[]

  const handleExport = async (m: MataPelajaran) => {
    setExporting(m.id)
    try {
      await exportMatrixBlob({ kelasId: m.kelasId, mataPelajaranId: m.id, semesterId })
      toast.success('PDF berhasil diunduh')
    } catch {
      toast.error('Gagal mengunduh PDF')
    } finally {
      setExporting(null)
    }
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>

  if (mapelList.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <BarChart2 className="h-12 w-12 text-gray-200 dark:text-gray-700" />
      <p className="text-sm text-gray-400">Tidak ada data absensi pada semester ini</p>
    </div>
  )

  return (
    <>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          {mapelList.length} mata pelajaran diajarkan
        </p>
        {mapelList.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 p-3.5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-emerald-200 hover:shadow-sm transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
              <BookOpen size={16} className="text-emerald-600" />
            </div>
            <button
              type="button"
              onClick={() => setRekapTarget(m)}
              className="flex-1 min-w-0 text-left"
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {m.mataPelajaranTingkat.masterMapel.nama}
              </p>
              <p className="text-xs text-gray-400">
                {m.kelas.namaKelas} · {m.mataPelajaranTingkat.masterMapel.kode}
              </p>
            </button>
            <button
              type="button"
              onClick={() => { void handleExport(m) }}
              disabled={exporting === m.id}
              title="Download PDF matriks absensi"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
            >
              {exporting === m.id ? <Spinner /> : <Download size={13} />}
              Export
            </button>
          </div>
        ))}
      </div>

      {/* Modal matriks */}
      <MatrixModal
        mapel={rekapTarget}
        semesterId={semesterId}
        onClose={() => setRekapTarget(null)}
      />
    </>
  )
}

function MatrixModal({ mapel, semesterId, onClose }: { mapel: MataPelajaran | null; semesterId: string; onClose: () => void }) {
  const { data: matrix, isLoading } = useMatrixMapelWali({
    kelasId:         mapel?.kelasId ?? '',
    mataPelajaranId: mapel?.id ?? '',
    semesterId,
  })
  return (
    <Modal
      open={!!mapel}
      onClose={onClose}
      title={mapel?.mataPelajaranTingkat.masterMapel.nama ?? ''}
      description={mapel?.kelas.namaKelas}
      size="2xl"
      fullHeight
    >
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : matrix ? (
          <MatrixTable matrix={matrix} onOverride={() => undefined} />
        ) : (
          <p className="text-sm text-gray-400 text-center py-10 italic">Belum ada data rekap.</p>
        )}
      </div>
    </Modal>
  )
}

// ── Main ─────────────────────────────────────────────────────────────
function JadwalArsipDetailContent() {
  const router     = useRouter()
  const params     = useSearchParams()
  const semesterId = params.get('semesterId') ?? ''
  const semNama    = params.get('semNama')    ?? 'Semester'
  const taNama     = params.get('taNama')     ?? ''

  const user   = useAuthStore((s) => s.user)
  const guruId = user?.id ?? ''

  const [activeTab, setActiveTab] = useState<'jadwal' | 'absensi'>('jadwal')

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
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
      </div>

      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <CalendarDays className="h-5 w-5 text-emerald-500 print:hidden" />
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 print:text-xl">
            Arsip {semNama}{taNama ? ` — ${taNama}` : ''}
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700 print:hidden">
        <TabBtn active={activeTab === 'jadwal'}   onClick={() => setActiveTab('jadwal')}>
          Jadwal
        </TabBtn>
        <TabBtn active={activeTab === 'absensi'}  onClick={() => setActiveTab('absensi')}>
          Rekap Absensi
        </TabBtn>
      </div>

      {/* Content */}
      {activeTab === 'jadwal' && (
        <JadwalTab semesterId={semesterId} semNama={semNama} taNama={taNama} />
      )}
      {activeTab === 'absensi' && (
        <RekapAbsensiTab semesterId={semesterId} guruId={guruId} />
      )}
    </div>
  )
}
