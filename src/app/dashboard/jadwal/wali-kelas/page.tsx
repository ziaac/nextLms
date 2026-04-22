'use client'

import { useState, useMemo }            from 'react'
import { useRouter }                    from 'next/navigation'
import { useAuthStore }                 from '@/stores/auth.store'
import { useTahunAjaranActive }         from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran }     from '@/hooks/semester/useSemester'
import { useMyJadwalMingguan, useExportMyJadwal } from '@/hooks/jadwal/useJadwalView'
import { useJadwalKelasWali }           from '@/hooks/jadwal/useJadwalWali'
import { Button }                       from '@/components/ui'
import { JadwalMingguanGuruView }       from '../guru/_components/JadwalMingguanGuru'
import { JadwalKelasWaliView }          from './_components/JadwalKelasWaliView'
import { JadwalHariIniWidget }          from '@/components/jadwal/JadwalHariIniWidget'
import { HariFilter }                   from '@/components/jadwal/HariFilter'
import { JadwalArsipSlideover }         from '@/components/jadwal/JadwalArsipSlideover'
import {
  Download, Users, BookOpen, ArrowLeft, Archive,
  CalendarDays, Clock,
} from 'lucide-react'
import { toast }                        from 'sonner'
import type { JadwalMingguanResponse }  from '@/types/jadwal-view.types'
import type { KelasWali }               from '@/types/jadwal-wali.types'
import type { HariEnum }                from '@/types/jadwal.types'

const HARI_LIST: HariEnum[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']

export default function JadwalWaliKelasPage() {
  const user   = useAuthStore((s) => s.user)
  const router = useRouter()
  const [activeTab,    setActiveTab]    = useState<string>('mengajar')
  const [selectedHari, setSelectedHari] = useState<HariEnum | 'ALL'>('ALL')
  const [arsipOpen,    setArsipOpen]    = useState(false)

  // ── Resolve TA & Semester aktif (sama seperti halaman guru) ──
  const { data: taListRaw = [] }   = useTahunAjaranActive()
  const taList  = taListRaw as { id: string; nama: string }[]
  const taAktif = taList[0]

  const { data: semListRaw = [] } = useSemesterByTahunAjaran(taAktif?.id ?? null)
  const semList = semListRaw as { id: string; nama: string; isActive?: boolean; urutan?: number }[]
  const semAktif = semList
    .filter((s) => s.isActive)
    .sort((a, b) => (b.urutan ?? 0) - (a.urutan ?? 0))[0] ?? null
  const resolvedSemId = semAktif?.id ?? ''

  // ── Data ────────────────────────────────────────────────────
  const { data: jadwalMengajarRaw, isLoading: loadingMengajar } = useMyJadwalMingguan(resolvedSemId || null)
  const jadwalMengajar = jadwalMengajarRaw as JadwalMingguanResponse | undefined

  const { data: kelasWaliRaw, isLoading: loadingWali, isFetching: fetchingWali } = useJadwalKelasWali(resolvedSemId || null)
  const kelasWaliList = (resolvedSemId && !fetchingWali)
    ? ((kelasWaliRaw as KelasWali[] | undefined) ?? [])
    : []

  // ── Stats (untuk sidebar mengajar) ──────────────────────────
  const items        = jadwalMengajar?.data ?? []
  const totalJp      = jadwalMengajar?.totalJp ?? 0
  const allHariAktif = useMemo(() => HARI_LIST.filter((h) => items.some((i) => i.hari === h)), [items])
  const uniqueKelas  = useMemo(() => new Set(items.map((i) => i.namaKelas).filter(Boolean)).size, [items])

  const availableHari = useMemo((): HariEnum[] =>
    HARI_LIST.filter((h) => items.some((i) => i.hari === h)),
    [items],
  )

  const exportMutation = useExportMyJadwal()
  const handleExport = async () => {
    if (!resolvedSemId) return
    try {
      await exportMutation.mutateAsync(resolvedSemId)
      toast.success('Export berhasil')
    } catch {
      toast.error('Gagal export jadwal')
    }
  }

  const activeKelas = kelasWaliList.find((k) => k.kelasId === activeTab)

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">

        {/* Left: back + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center shrink-0 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Users className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
                Jadwal
              </h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {semAktif
                ? `${semAktif.nama}${taAktif ? ' — ' + taAktif.nama : ''}`
                : `Halo, ${user?.namaLengkap ?? 'Wali Kelas'}`}
            </p>
          </div>
        </div>

        {/* Right: HariFilter (hanya untuk tab mengajar) + actions */}
        <div className="flex items-center gap-2 shrink-0">
          {activeTab === 'mengajar' && availableHari.length > 0 && (
            <HariFilter
              available={availableHari}
              selected={selectedHari}
              onChange={setSelectedHari}
            />
          )}
          <Button
            variant="secondary"
            leftIcon={<Archive size={16} />}
            onClick={() => setArsipOpen(true)}
          >
            Arsip
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Download size={16} />}
            loading={exportMutation.isPending}
            disabled={!resolvedSemId}
            onClick={() => { void handleExport() }}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* Tidak ada semester aktif */}
      {!semAktif && !loadingMengajar && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-700">
            Tidak ada semester aktif. Hubungi admin untuk mengaktifkan semester.
          </p>
        </div>
      )}

      {resolvedSemId && <JadwalHariIniWidget semesterId={resolvedSemId} label="Jadwal" />}

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700">
        <TabButton
          active={activeTab === 'mengajar'}
          icon={<BookOpen className="h-3.5 w-3.5" />}
          label="Jadwal Mengajar"
          onClick={() => { setActiveTab('mengajar'); setSelectedHari('ALL') }}
        />
        {kelasWaliList.map((k) => (
          <TabButton
            key={k.kelasId}
            active={activeTab === k.kelasId}
            icon={<Users className="h-3.5 w-3.5" />}
            label={'Wali Kelas ' + k.namaKelas}
            onClick={() => { setActiveTab(k.kelasId); setSelectedHari('ALL') }}
          />
        ))}
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      {activeTab === 'mengajar' ? (
        /* 2-col desktop layout for "mengajar" tab */
        <div className="md:grid md:grid-cols-[240px_1fr] gap-5">

          {/* Left: 2 stat cards */}
          <div className="flex flex-col gap-3 mb-4 md:mb-0">
            {/* Card 1: Total JP + Kelas */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Total JP</span>
                </div>
                {loadingMengajar
                  ? <div className="h-7 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  : <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{totalJp}<span className="text-sm font-medium text-gray-400 ml-1">JP</span></p>
                }
                <p className="text-[10px] text-gray-400 mt-0.5">semester ini</p>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="h-3.5 w-3.5 text-purple-500" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Kelas</span>
                </div>
                {loadingMengajar
                  ? <div className="h-6 w-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  : <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{uniqueKelas}<span className="text-sm font-medium text-gray-400 ml-1">kelas</span></p>
                }
              </div>
            </div>

            {/* Card 2: Hari mengajar */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Hari Mengajar</span>
              </div>
              {loadingMengajar
                ? <div className="h-7 w-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                : <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{allHariAktif.length}<span className="text-sm font-medium text-gray-400 ml-1">hari</span></p>
              }
              <p className="text-[10px] text-gray-400 mt-0.5">per minggu</p>
            </div>
          </div>

          {/* Right: schedule box */}
          <div>
            <JadwalMingguanGuruView
              data={jadwalMengajar}
              isLoading={loadingMengajar}
              selectedHari={selectedHari}
              hideStats
            />
          </div>
        </div>
      ) : activeKelas ? (
        <JadwalKelasWaliView kelas={activeKelas} isLoading={loadingWali} />
      ) : (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
          Pilih kelas untuk melihat jadwal
        </div>
      )}

      <JadwalArsipSlideover
        open={arsipOpen}
        onClose={() => setArsipOpen(false)}
      />
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string
}) {
  return (
    <button type="button" onClick={onClick} className={[
      'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors',
      active
        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
    ].join(' ')}>
      {icon}{label}
    </button>
  )
}
