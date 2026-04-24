'use client'

import { useState, useMemo }               from 'react'
import { useRouter }                       from 'next/navigation'
import {
  Archive, Download, GraduationCap,
  Calendar, TableProperties, Plus, ArrowLeft,
} from 'lucide-react'
import { useAuthStore }                    from '@/stores/auth.store'
import { useTahunAjaranActive }            from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran, useActiveSemesterLabel } from '@/hooks/semester/useSemester'
import { useMyJadwalMingguan, useExportMyJadwal } from '@/hooks/jadwal/useJadwalView'
import { useMyStatusHariIni }              from '@/hooks/absensi/useMyStatusHariIni'
import { useMyRiwayatAbsensi }             from '@/hooks/absensi/useRekapSiswa'
import { useMatrixSiswa, useExportMatrixSiswa } from '@/hooks/absensi/useWaliKelas'
import { usePerizinanList }                from '@/hooks/perizinan/usePerizinan'
import { Button }                          from '@/components/ui'
import { Spinner }                         from '@/components/ui/Spinner'
import { EmptyState }                      from '@/components/ui/EmptyState'
import { JadwalMingguanSiswaView }         from './_components/JadwalMingguanSiswa'
import { HariFilter }                      from '@/components/jadwal/HariFilter'
import { JadwalArsipSlideover }            from '@/components/jadwal/JadwalArsipSlideover'
import { JadwalSiswaCard }                 from '@/app/dashboard/absensi/siswa/_components/JadwalSiswaCard'
import { PengajuanIzinModal }              from '@/app/dashboard/absensi/siswa/_components/PengajuanIzinModal'
import { MatrixSiswaTable }                from '@/app/dashboard/absensi/siswa/_components/MatrixSiswaTable'
import { PerizinanFormModal }              from '@/app/dashboard/perizinan/_components/PerizinanFormModal'
import { toast }                           from 'sonner'
import type { JadwalMingguanResponse }     from '@/types/jadwal-view.types'
import type { HariEnum }                   from '@/types/jadwal.types'
import type { AbsensiStatusItem }          from '@/types'
import type { PerizinanItem }              from '@/types/perizinan.types'

// ── Konstanta ─────────────────────────────────────────────────────────────────

const HARI_LIST: HariEnum[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']

type TabKey = 'jadwal' | 'matrix'

const TABS: { key: TabKey; label: string; Icon: React.ElementType }[] = [
  { key: 'jadwal',  label: 'Jadwal Mingguan', Icon: Calendar        },
  { key: 'matrix',  label: 'Matriks Absensi', Icon: TableProperties },
]

const STAT_KEYS: { key: string; label: string; color: string }[] = [
  { key: 'HADIR',     label: 'Hadir',  color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'TERLAMBAT', label: 'Lambat', color: 'text-yellow-600 dark:text-yellow-400'   },
  { key: 'SAKIT',     label: 'Sakit',  color: 'text-blue-600 dark:text-blue-400'       },
  { key: 'IZIN',      label: 'Izin',   color: 'text-purple-600 dark:text-purple-400'   },
  { key: 'ALPA',      label: 'Alpa',   color: 'text-red-600 dark:text-red-400'         },
]

// ── Halaman ───────────────────────────────────────────────────────────────────

export default function JadwalKelasPage() {
  const user   = useAuthStore((s) => s.user)
  const router = useRouter()

  const semLabel = useActiveSemesterLabel()

  const [tab,          setTab]        = useState<TabKey>('jadwal')
  const [selectedHari, setSelectedHari] = useState<HariEnum | 'ALL'>('ALL')
  const [arsipOpen,    setArsipOpen]  = useState(false)
  const [izinTarget,   setIzinTarget] = useState<AbsensiStatusItem | null>(null)
  const [izinOpen,     setIzinOpen]   = useState(false)

  // ── Semester aktif ──────────────────────────────────────────────────────────
  const { data: taListRaw = [] } = useTahunAjaranActive()
  const taList  = taListRaw as { id: string; nama: string }[]
  const taAktif = taList[0]

  const { data: semListRaw = [] } = useSemesterByTahunAjaran(taAktif?.id ?? null)
  const semList  = semListRaw as { id: string; nama: string; isActive?: boolean; urutan?: number }[]
  const semAktif = semList
    .filter((s) => s.isActive)
    .sort((a, b) => (b.urutan ?? 0) - (a.urutan ?? 0))[0] ?? null
  const resolvedSemId = semAktif?.id ?? ''

  // ── Jadwal mingguan ─────────────────────────────────────────────────────────
  const { data: jadwalRaw, isLoading: loadingJadwal } = useMyJadwalMingguan(resolvedSemId || null)
  const jadwal = jadwalRaw as JadwalMingguanResponse | undefined
  const availableHari = useMemo((): HariEnum[] =>
    HARI_LIST.filter((h) => (jadwal?.data ?? []).some((i) => i.hari === h)),
    [jadwal],
  )

  const exportMutation = useExportMyJadwal()
  const handleExport = async () => {
    if (!resolvedSemId) return
    try {
      await exportMutation.mutateAsync(resolvedSemId)
      toast.success('Export berhasil')
    } catch {
      toast.error('Gagal export')
    }
  }

  // ── Jadwal hari ini + perizinan aktif ───────────────────────────────────────
  const { jadwalList, isLoading: loadingHariIni } = useMyStatusHariIni(resolvedSemId || undefined)

  const todayStr = new Date().toISOString().slice(0, 10)
  const { data: perizinanHariIni } = usePerizinanList({
    userId:         user?.id,
    tanggalMulai:   todayStr,
    tanggalSelesai: todayStr,
    limit:          1,
  })
  const perizinanAktif = (perizinanHariIni?.data ?? []).find(
    (p: PerizinanItem) => ['PENDING', 'REVISION_REQUESTED', 'APPROVED'].includes(p.status),
  ) ?? null

  // ── Rekap semester (stat cards) ─────────────────────────────────────────────
  const { data: riwayatData } = useMyRiwayatAbsensi({
    page: 1, limit: 1, isSemesterActive: true,
  })
  const summary = riwayatData?.meta?.summary as Record<string, number> | undefined

  // ── Matriks absensi siswa ───────────────────────────────────────────────────
  const { data: matrixData, isLoading: loadingMatrix } = useMatrixSiswa(
    resolvedSemId ? { semesterId: resolvedSemId } : { semesterId: '' },
  )
  const exportMatrixMutation = useExportMatrixSiswa()

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">

        {/* Kiri: back + judul */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center shrink-0 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
                Jadwal & Absensi
              </h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {semLabel ?? `Halo, ${user?.namaLengkap ?? 'Siswa'}`}
            </p>
          </div>
        </div>

        {/* Kanan: icon actions atas + Ajukan Izin bawah */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Arsip — icon-only kecil */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setArsipOpen(true)}
              title="Arsip Jadwal"
              className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <Archive size={15} className="text-gray-500" />
            </button>
          </div>
          {/* Ajukan Izin — eye-catching */}
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIzinOpen(true)}>
            Ajukan Izin
          </Button>
        </div>

      </div>

      {/* ── Tidak ada semester aktif ── */}
      {!semAktif && !loadingJadwal && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/40 px-4 py-3">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Tidak ada semester aktif. Hubungi admin untuk mengaktifkan semester.
          </p>
        </div>
      )}

      {/* ── Jadwal Hari Ini (JadwalSiswaCard) ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Pelajaran Hari Ini</p>
            <p className="text-xs text-gray-400 capitalize">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          {jadwalList.length > 0 && (
            <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
              {jadwalList.length} sesi
            </span>
          )}
        </div>
        {loadingHariIni ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : jadwalList.length === 0 ? (
          <EmptyState
            icon={<Calendar size={20} />}
            title="Tidak ada jadwal hari ini"
            description="Kamu tidak memiliki jadwal pelajaran untuk hari ini."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {jadwalList.map((item) => (
              <JadwalSiswaCard
                key={item.jadwalId}
                item={item}
                onIzin={() => setIzinTarget(item)}
                perizinanAktif={perizinanAktif}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Rekap Semester Ini ── */}
      {resolvedSemId && (
        <section className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Rekap Semester Ini
          </p>
          <div
            className="overflow-x-auto -mx-4 px-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
          >
            <div className="flex gap-2 items-stretch w-max pb-1">
              {/* Total sesi */}
              <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-3.5 py-2.5 min-w-[60px] text-center">
                <p className="text-2xl font-bold tabular-nums text-gray-700 dark:text-gray-300">
                  {summary ? STAT_KEYS.reduce((sum, { key }) => sum + (summary[key] ?? 0), 0) : '—'}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Sesi</p>
              </div>
              <div className="w-px bg-gray-100 dark:bg-gray-800 self-stretch my-1" />
              {/* Per status */}
              {STAT_KEYS.map(({ key, label, color }) => (
                <div key={key} className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-3.5 py-2.5 min-w-[60px] text-center">
                  <p className={`text-2xl font-bold tabular-nums ${color}`}>
                    {summary ? (summary[key] ?? 0) : '—'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Tabs ── */}
      <div
        className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={[
              'inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
              tab === key
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            ].join(' ')}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Jadwal Mingguan ── */}
      {tab === 'jadwal' && (
        <div className="space-y-4">
          {resolvedSemId && (
            <div className="flex items-center justify-between gap-2">
              <HariFilter available={availableHari} selected={selectedHari} onChange={setSelectedHari} />
              <button
                type="button"
                onClick={() => { void handleExport() }}
                disabled={!resolvedSemId || exportMutation.isPending}
                title="Export Jadwal PDF"
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-40 shrink-0"
              >
                <Download size={15} className="text-gray-500" />
              </button>
            </div>
          )}
          <JadwalMingguanSiswaView data={jadwal} isLoading={loadingJadwal} selectedHari={selectedHari} />
        </div>
      )}

      {/* ── Tab: Matriks Absensi ── */}
      {tab === 'matrix' && (
        <div className="space-y-3">
          {resolvedSemId && (
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Download size={14} />}
                loading={exportMatrixMutation.isPending}
                disabled={!matrixData}
                onClick={() => exportMatrixMutation.mutate({ semesterId: resolvedSemId })}
              >
                Export PDF
              </Button>
            </div>
          )}
          {!resolvedSemId ? (
            <p className="text-sm text-gray-400 text-center py-10 italic">Pilih semester aktif untuk melihat matriks.</p>
          ) : loadingMatrix ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : matrixData ? (
            <MatrixSiswaTable matrix={matrixData} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-10 italic">Tidak ada data matriks.</p>
          )}
        </div>
      )}

      {/* ── Modals & Slideovers ── */}
      <JadwalArsipSlideover open={arsipOpen} onClose={() => setArsipOpen(false)} />

      {/* Izin per-card (quick) */}
      <PengajuanIzinModal
        open={!!izinTarget}
        onClose={() => setIzinTarget(null)}
        jadwal={izinTarget}
      />

      {/* Izin dari header (lengkap) */}
      <PerizinanFormModal
        open={izinOpen}
        onClose={() => setIzinOpen(false)}
        siswaId={user?.id}
      />
    </div>
  )
}
