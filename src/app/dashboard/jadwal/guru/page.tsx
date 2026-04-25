'use client'

import { useState, useMemo, useEffect }    from 'react'
import { useRouter }                       from 'next/navigation'
import {
  ArrowLeft, CalendarDays, Users, Clock,
  BookOpen, Download, Archive, Bell,
} from 'lucide-react'
import { Button }                          from '@/components/ui'
import { Spinner }                         from '@/components/ui/Spinner'
import { EmptyState }                      from '@/components/ui/EmptyState'
import { useTahunAjaranActive }            from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran }        from '@/hooks/semester/useSemester'
import { useMyStatusHariIni }              from '@/hooks/absensi/useMyStatusHariIni'
import { useMyJadwalMingguan, useExportMyJadwal, useExportJadwalKelas } from '@/hooks/jadwal/useJadwalView'
import { useJadwalKelasWali }              from '@/hooks/jadwal/useJadwalWali'
import { useIzinPendingWali }              from '@/hooks/absensi/useWaliKelas'
import { useAuthStore }                    from '@/stores/auth.store'
import { JadwalGuruCard }                  from '@/app/dashboard/absensi/guru/_components/JadwalGuruCard'
import { BukaSesiModal }                   from '@/app/dashboard/absensi/guru/_components/BukaSesiModal'
import { QRSesiPanel }                     from '@/app/dashboard/absensi/guru/_components/QRSesiPanel'
import { ManualAbsensiModal }              from '@/app/dashboard/absensi/guru/_components/ManualAbsensiModal'
import { UbahModeSesiModal }               from '@/app/dashboard/absensi/guru/_components/UbahModeSesiModal'
import { RekapJadwalModal }                from '@/app/dashboard/absensi/guru/_components/RekapJadwalModal'
import { RekapSemesterTab }                from '@/app/dashboard/absensi/wali-kelas/_components/RekapSemesterTab'
import { MatrixMapelTab }                  from '@/app/dashboard/absensi/wali-kelas/_components/MatrixMapelTab'
import { IzinPendingTab }                  from '@/app/dashboard/absensi/wali-kelas/_components/IzinPendingTab'
import { JadwalMingguanGuruView }          from './_components/JadwalMingguanGuru'
import { JadwalKelasWaliView }             from '../wali-kelas/_components/JadwalKelasWaliView'
import { JadwalArsipSlideover }            from '@/components/jadwal/JadwalArsipSlideover'
import { HariFilter }                      from '@/components/jadwal/HariFilter'
import { toast }                           from 'sonner'
import type { AbsensiStatusItem, SesiResponse } from '@/types'
import type { JadwalMingguanResponse }     from '@/types/jadwal-view.types'
import type { KelasWali }                  from '@/types/jadwal-wali.types'
import type { HariEnum }                   from '@/types/jadwal.types'
import type { PerizinanItem }              from '@/types/perizinan.types'

const HARI_LIST: HariEnum[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']

export default function JadwalGuruPage() {
  const router   = useRouter()
  const { user } = useAuthStore()
  const [hasHydrated, setHasHydrated] = useState(false)
  useEffect(() => { setHasHydrated(true) }, [])

  // ── TA & Semester ────────────────────────────────────────────
  const { data: taListRaw = [] }   = useTahunAjaranActive()
  const taList  = taListRaw as { id: string; nama: string }[]
  const taAktif = taList[0]

  const { data: semListRaw = [] }  = useSemesterByTahunAjaran(taAktif?.id ?? null)
  const semList  = semListRaw as { id: string; nama: string; isActive?: boolean; urutan?: number }[]
  const semAktif = useMemo(() =>
    semList.filter((s) => s.isActive).sort((a, b) => (b.urutan ?? 0) - (a.urutan ?? 0))[0] ?? null,
    [semList],
  )
  const resolvedSemId = semAktif?.id ?? ''

  // ── Jadwal hari ini + status absensi (sebagai guru) ──────────
  const { jadwalList, isLoading: loadingHariIni, isWaliKelas, kelasWali } =
    useMyStatusHariIni(resolvedSemId || undefined)

  // ── Jadwal mingguan (untuk tab Jadwal Mengajar) ───────────────
  const { data: jadwalMingguanRaw, isLoading: loadingMingguan } = useMyJadwalMingguan(resolvedSemId || null)
  const jadwalMingguan = jadwalMingguanRaw as JadwalMingguanResponse | undefined
  const [selectedHari, setSelectedHari] = useState<HariEnum | 'ALL'>('ALL')
  const availableHari = useMemo(
    () => HARI_LIST.filter((h) => (jadwalMingguan?.data ?? []).some((i) => i.hari === h)),
    [jadwalMingguan],
  )

  // ── Jadwal kelas wali (untuk sub-tab Jadwal Kelas) ───────────
  const { data: kelasWaliJadwalRaw, isLoading: loadingKelasWali } = useJadwalKelasWali(
    isWaliKelas && resolvedSemId ? resolvedSemId : null,
  )
  const kelasWaliJadwal = (kelasWaliJadwalRaw as KelasWali[] | undefined) ?? []

  // ── Tab & sub-tab state ───────────────────────────────────────
  const [activeTab,         setActiveTab]         = useState<string>('mengajar')
  const [activeWaliKelasId, setActiveWaliKelasId] = useState('')
  const [waliSubTab,        setWaliSubTab]         = useState<'izin' | 'jadwal-kelas' | 'matrix' | 'rekap'>('izin')

  const resolvedWaliKelasId = activeWaliKelasId || kelasWali[0]?.id || ''
  const activeKelasWali     = kelasWaliJadwal.find((k) => k.kelasId === resolvedWaliKelasId)

  // ── Stats untuk Wali Kelas tab ───────────────────────────────
  const totalSesi = useMemo(() => {
    if (!activeKelasWali) return 0
    return HARI_LIST.reduce((s, h) => s + (activeKelasWali.jadwal[h]?.length ?? 0), 0)
  }, [activeKelasWali])

  const uniqueJams = useMemo(() => {
    if (!activeKelasWali) return 0
    return new Set(
      HARI_LIST.flatMap((h) => (activeKelasWali.jadwal[h] ?? []).map((s) => s.jam)),
    ).size
  }, [activeKelasWali])

  // ── Izin pending count (badge) ────────────────────────────────
  const { data: izinData } = useIzinPendingWali(resolvedWaliKelasId || null)
  const izinCount = useMemo(() =>
    ((izinData?.data ?? []) as PerizinanItem[]).filter(
      (p) => p.status === 'PENDING' || p.status === 'REVISION_REQUESTED',
    ).length,
    [izinData],
  )

  // ── Modal state ───────────────────────────────────────────────
  const [arsipOpen,      setArsipOpen]      = useState(false)
  const [rekapTarget,    setRekapTarget]    = useState<AbsensiStatusItem | null>(null)
  const [activeSesi,     setActiveSesi]     = useState<SesiResponse | null>(null)
  const [showQR,         setShowQR]         = useState(false)
  const [bukaSesiTarget, setBukaSesiTarget] = useState<AbsensiStatusItem | null>(null)
  const [manualToken,    setManualToken]    = useState<string | null>(null)
  const [ubahModeOpen,   setUbahModeOpen]   = useState(false)

  // ── Absensi handlers ─────────────────────────────────────────
  const handleSesiCreated = (sesi: SesiResponse) => {
    setBukaSesiTarget(null)
    setActiveSesi(sesi)
    if (sesi.mode === 'MANUAL') setManualToken(sesi.token)
    else setShowQR(true)
  }

  const handleReconnectSesi = (item: AbsensiStatusItem) => {
    if (!item.tokenSesi) return
    const minimal = {
      token:             item.tokenSesi,
      guruId:            user?.id ?? '',
      jadwalPelajaranId: item.jadwalId,
      kelasId:           '',
      semesterId:        resolvedSemId,
      mataPelajaranId:   '',
      tanggal:           new Date().toISOString().slice(0, 10),
      jamMulai:          item.jam.split(/[-–]/)[0]?.trim() ?? '',
      toleransiMenit:    0,
      mode:              item.modeSesi ?? 'QR_LURING',
      requireGps:        false,
      expiresAt:         '',
      ttlDetik:          0,
    } as SesiResponse
    setActiveSesi(minimal)
    if (item.modeSesi === 'MANUAL') setManualToken(item.tokenSesi)
    else setShowQR(true)
  }

  const handleKelolaAktif = (item: AbsensiStatusItem) => {
    if (activeSesi?.jadwalPelajaranId === item.jadwalId) {
      if (activeSesi.mode === 'MANUAL') setManualToken(activeSesi.token)
      else setShowQR(true)
    } else handleReconnectSesi(item)
  }

  const handlePerpanjang = (item: AbsensiStatusItem) => {
    if (activeSesi?.jadwalPelajaranId === item.jadwalId) {
      if (activeSesi.mode === 'MANUAL') setManualToken(activeSesi.token)
      else setShowQR(true)
    } else handleReconnectSesi(item)
  }

  // ── Export PDF ────────────────────────────────────────────────
  const exportMutation      = useExportMyJadwal()
  const exportKelasMutation = useExportJadwalKelas()

  const handleExportKelas = async () => {
    if (!resolvedWaliKelasId || !resolvedSemId) return
    try {
      await exportKelasMutation.mutateAsync({ kelasId: resolvedWaliKelasId, semesterId: resolvedSemId })
      toast.success('Export berhasil')
    } catch { toast.error('Gagal export') }
  }

  const handleExport = async () => {
    if (!resolvedSemId) return
    try {
      await exportMutation.mutateAsync(resolvedSemId)
      toast.success('Export berhasil')
    } catch { toast.error('Gagal export') }
  }

  // ── Guard ─────────────────────────────────────────────────────
  if (!hasHydrated) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center shrink-0 hover:border-gray-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <CalendarDays className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">Jadwal</h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {semAktif
                ? `${semAktif.nama}${taAktif ? ' — ' + taAktif.nama : ''}`
                : `Halo, ${user?.namaLengkap ?? 'Guru'}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" leftIcon={<Archive size={16} />} onClick={() => setArsipOpen(true)}>
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

      {/* Warning */}
      {!semAktif && !loadingHariIni && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-700">Tidak ada semester aktif. Hubungi admin.</p>
        </div>
      )}

      {/* ── Jadwal Hari Ini (posisi sebagai Guru) ─────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Jadwal Hari Ini</p>
            <p className="text-xs text-gray-400">
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
            icon={<CalendarDays size={20} />}
            title="Tidak ada jadwal hari ini"
            description="Tidak ada jadwal mengajar hari ini."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {jadwalList.map((item) => (
              <JadwalGuruCard
                key={item.jadwalId}
                item={item}
                isActivelyManaged={activeSesi?.jadwalPelajaranId === item.jadwalId}
                canBukaSesi
                onBukaSesi={() => setBukaSesiTarget(item)}
                onKelolaAktif={() => handleKelolaAktif(item)}
                onPerpanjang={() => handlePerpanjang(item)}
                onUbahMode={() => setUbahModeOpen(true)}
                onRekap={() => setRekapTarget(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto overflow-y-hidden">
        <TabBtn
          active={activeTab === 'mengajar'}
          icon={<BookOpen className="h-3.5 w-3.5" />}
          label="Jadwal Mengajar"
          onClick={() => { setActiveTab('mengajar'); setSelectedHari('ALL') }}
        />
        {isWaliKelas && kelasWali.map((k) => (
          <TabBtn
            key={k.id}
            active={activeTab === k.id}
            icon={<Users className="h-3.5 w-3.5" />}
            label={`Wali Kelas ${k.namaKelas}`}
            badge={resolvedWaliKelasId === k.id && izinCount > 0 ? izinCount : undefined}
            onClick={() => { setActiveTab(k.id); setActiveWaliKelasId(k.id); setWaliSubTab('izin') }}
          />
        ))}
      </div>

      {/* ── Tab: Jadwal Mengajar ──────────────────────────────────── */}
      {activeTab === 'mengajar' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Jadwal Perminggu</h2>
            </div>
            {availableHari.length > 0 && (
              <HariFilter available={availableHari} selected={selectedHari} onChange={setSelectedHari} />
            )}
          </div>
          <JadwalMingguanGuruView
            data={jadwalMingguan}
            isLoading={loadingMingguan}
            selectedHari={selectedHari}
            hideStats={false}
          />
        </div>
      )}

      {/* ── Tab: Wali Kelas ───────────────────────────────────────── */}
      {isWaliKelas && activeTab !== 'mengajar' && (
        <div className="space-y-4">

          {/* Stats wali kelas */}
          {!loadingKelasWali && activeKelasWali && (
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Total Sesi" value={totalSesi} sub="per minggu" />
              <StatCard label="Jam Mengajar" value={uniqueJams} sub="jam unik per minggu" />
              <StatCard
                label="Izin Menunggu"
                value={izinCount}
                sub={izinCount > 0 ? 'perlu ditindak' : 'semua diproses'}
                highlight={izinCount > 0}
              />
            </div>
          )}

          {/* Sub-tabs */}
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto overflow-y-hidden">
            <SubTabBtn
              active={waliSubTab === 'izin'}
              onClick={() => setWaliSubTab('izin')}
              badge={izinCount > 0 ? izinCount : undefined}
            >
              <Bell size={12} /> Perizinan
            </SubTabBtn>
            <SubTabBtn active={waliSubTab === 'jadwal-kelas'} onClick={() => setWaliSubTab('jadwal-kelas')}>
              <CalendarDays size={12} /> Jadwal Kelas
            </SubTabBtn>
            <SubTabBtn active={waliSubTab === 'matrix'} onClick={() => setWaliSubTab('matrix')}>
              <BookOpen size={12} /> Matriks Absen
            </SubTabBtn>
            <SubTabBtn active={waliSubTab === 'rekap'} onClick={() => setWaliSubTab('rekap')}>
              <Users size={12} /> Rekap
            </SubTabBtn>
          </div>

          {/* Sub-tab content */}
          {waliSubTab === 'izin' && (
            <IzinPendingTab kelasId={resolvedWaliKelasId} />
          )}
          {waliSubTab === 'jadwal-kelas' && (
            activeKelasWali ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={exportKelasMutation.isPending}
                    onClick={() => { void handleExportKelas() }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
                  >
                    {exportKelasMutation.isPending ? <Spinner /> : <Download size={13} />}
                    Export PDF
                  </button>
                </div>
                <JadwalKelasWaliView kelas={activeKelasWali} isLoading={loadingKelasWali} hideStats />
              </div>
            ) : (
              <div className="flex justify-center py-10"><Spinner /></div>
            )
          )}
          {waliSubTab === 'matrix' && (
            <MatrixMapelTab kelasId={resolvedWaliKelasId} semesterId={resolvedSemId} />
          )}
          {waliSubTab === 'rekap' && (
            <RekapSemesterTab kelasId={resolvedWaliKelasId} semesterId={resolvedSemId} />
          )}
        </div>
      )}


      {/* ── Modals ───────────────────────────────────────────────── */}
      <BukaSesiModal
        open={!!bukaSesiTarget}
        onClose={() => setBukaSesiTarget(null)}
        jadwal={bukaSesiTarget}
        onSuccess={handleSesiCreated}
        isReopen={bukaSesiTarget?.statusSesi === 'SELESAI' || bukaSesiTarget?.statusSesi === 'EXPIRED'}
      />
      <QRSesiPanel
        open={showQR}
        sesi={activeSesi}
        onClose={() => setShowQR(false)}
        onTutup={() => { setActiveSesi(null); setShowQR(false) }}
      />
      <ManualAbsensiModal open={!!manualToken} token={manualToken} onClose={() => setManualToken(null)} />
      <RekapJadwalModal
        open={!!rekapTarget}
        onClose={() => setRekapTarget(null)}
        jadwalPelajaranId={rekapTarget?.jadwalId ?? ''}
        namaMapel={rekapTarget?.namaMapel ?? ''}
        namaKelas={rekapTarget?.namaKelas ?? ''}
        jam={rekapTarget?.jam ?? ''}
        modeSesi={rekapTarget?.modeSesi ?? null}
        onBukaKembali={
          rekapTarget?.statusSesi === 'SELESAI' || rekapTarget?.statusSesi === 'EXPIRED'
            ? () => { setRekapTarget(null); setBukaSesiTarget(rekapTarget) }
            : undefined
        }
      />
      <UbahModeSesiModal
        open={ubahModeOpen}
        onClose={() => setUbahModeOpen(false)}
        token={activeSesi?.token ?? null}
        modeSaat={activeSesi?.mode ?? null}
        onSuccess={(res) => {
          setUbahModeOpen(false)
          if (activeSesi) {
            const updated = { ...activeSesi, mode: res.mode }
            setActiveSesi(updated)
            if (res.mode === 'MANUAL') setManualToken(updated.token)
            else setShowQR(true)
          }
        }}
      />
      <JadwalArsipSlideover open={arsipOpen} onClose={() => setArsipOpen(false)} />
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────

function TabBtn({ active, onClick, icon, label, badge }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number
}) {
  return (
    <button type="button" onClick={onClick} className={[
      'relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
      active
        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
    ].join(' ')}>
      {icon}{label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}

function SubTabBtn({ active, onClick, children, badge }: {
  active: boolean; onClick: () => void; children: React.ReactNode; badge?: number
}) {
  return (
    <button type="button" onClick={onClick} className={[
      'inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
      active
        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
    ].join(' ')}>
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}

function StatCard({ label, value, sub, highlight }: {
  label: string; value: number; sub: string; highlight?: boolean
}) {
  return (
    <div className={[
      'rounded-xl border px-4 py-3',
      highlight
        ? 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/10'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900',
    ].join(' ')}>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">{label}</p>
      <p className={['text-xl font-bold', highlight ? 'text-rose-600 dark:text-rose-400' : 'text-gray-800 dark:text-gray-200'].join(' ')}>
        {value}
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}
