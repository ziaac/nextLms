'use client'

import { useState, useMemo, useEffect }    from 'react'
import { useRouter }                       from 'next/navigation'
import {
  Archive, CalendarDays, Users, ArrowLeft,
  Clock, BookOpen,
} from 'lucide-react'
import { Button, SearchInput }             from '@/components/ui'
import { Spinner }                         from '@/components/ui/Spinner'
import { EmptyState }                      from '@/components/ui/EmptyState'
import { useTahunAjaranActive }            from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran }        from '@/hooks/semester/useSemester'
import { useMyStatusHariIni }             from '@/hooks/absensi/useMyStatusHariIni'
import { useGuruDetailJadwal }            from '@/hooks/absensi/useWaliKelas'
import { useMyJadwalMingguan }            from '@/hooks/jadwal/useJadwalView'
import { useAuthStore }                   from '@/stores/auth.store'
import { JadwalGuruCard }                 from './_components/JadwalGuruCard'
import { BukaSesiModal }                  from './_components/BukaSesiModal'
import { QRSesiPanel }                    from './_components/QRSesiPanel'
import { ManualAbsensiModal }             from './_components/ManualAbsensiModal'
import { AbsensiArsipSlideover }          from './_components/AbsensiArsipSlideover'
import { UbahModeSesiModal }              from './_components/UbahModeSesiModal'
import { RekapJadwalModal }               from './_components/RekapJadwalModal'
import { RekapHarianTab }                 from '../wali-kelas/_components/RekapHarianTab'
import { RekapSemesterTab }               from '../wali-kelas/_components/RekapSemesterTab'
import { MatrixMapelTab }                 from '../wali-kelas/_components/MatrixMapelTab'
import { IzinPendingTab }                 from '../wali-kelas/_components/IzinPendingTab'
import { JadwalMingguanGuruView }         from '@/app/dashboard/jadwal/guru/_components/JadwalMingguanGuru'
import { HariFilter }                     from '@/components/jadwal/HariFilter'
import type { AbsensiStatusItem, SesiResponse } from '@/types'
import type { GuruDetailJadwalItem }      from '@/lib/api/absensi.api'
import type { JadwalMingguanResponse }    from '@/types/jadwal-view.types'
import type { HariEnum }                  from '@/types/jadwal.types'

const HARI_LIST: HariEnum[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']

export default function AbsensiGuruPage() {
  const router   = useRouter()
  const { user } = useAuthStore()
  const [hasHydrated, setHasHydrated] = useState(false)
  useEffect(() => { setHasHydrated(true) }, [])

  const userRole   = user?.role?.toUpperCase()
  const bolehAkses = userRole === 'GURU' || userRole === 'WALI_KELAS'

  // ── TA & Semester aktif (auto-resolve) ──────────────────────────
  const { data: taListRaw = [] } = useTahunAjaranActive()
  const taList  = taListRaw as { id: string; nama: string }[]
  const taAktif = taList[0]

  const { data: semesterList = [] } = useSemesterByTahunAjaran(taAktif?.id ?? null)
  const semList      = semesterList as { id: string; nama: string; isActive?: boolean; urutan?: number }[]
  const semListAktif = useMemo(() => semList.filter((s) => s.isActive), [semList])

  const semAktif = useMemo(() =>
    semListAktif.sort((a, b) => (b.urutan ?? 0) - (a.urutan ?? 0))[0] ?? null,
    [semListAktif],
  )
  const resolvedSemId = semAktif?.id ?? ''

  // ── Data absensi hari ini ──────────────────────────────────────
  const { jadwalList, isLoading, isWaliKelas, kelasWali } =
    useMyStatusHariIni(resolvedSemId || undefined)

  // ── Data jadwal perminggu ──────────────────────────────────────
  const { data: jadwalMingguanRaw } = useMyJadwalMingguan(resolvedSemId || null)
  const jadwalMingguan = jadwalMingguanRaw as JadwalMingguanResponse | undefined
  const [selectedHari, setSelectedHari] = useState<HariEnum | 'ALL'>('ALL')
  const availableHari = useMemo(
    () => HARI_LIST.filter((h) => (jadwalMingguan?.data ?? []).some((i) => i.hari === h)),
    [jadwalMingguan],
  )

  // ── Stat cards ────────────────────────────────────────────────
  const { data: guruDetail } = useGuruDetailJadwal(user?.id ?? null, resolvedSemId || null)
  const stat = useMemo(() => {
    if (!guruDetail || guruDetail.length === 0) return null
    const items     = guruDetail as GuruDetailJadwalItem[]
    const realisasi = items.reduce((s, j) => s + j._count.absensi, 0)
    const target    = items.reduce((s, j) => {
      const t = j.mataPelajaran?.targetPertemuan
      return s + (typeof t === 'number' ? t : 16)
    }, 0)
    const persen = target > 0 ? Math.round((realisasi / target) * 100) : 0
    return { realisasi, target, persen, jumlahMapel: items.length }
  }, [guruDetail])

  // ── Search ────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const filteredJadwal = useMemo(() => {
    if (!search.trim()) return jadwalList
    const q = search.toLowerCase()
    return jadwalList.filter((j) =>
      j.namaMapel.toLowerCase().includes(q) ||
      (j.namaKelas ?? '').toLowerCase().includes(q),
    )
  }, [jadwalList, search])

  // ── Wali kelas state ──────────────────────────────────────────
  const [activeWaliKelasId, setActiveWaliKelasId] = useState('')
  const [waliSubTab, setWaliSubTab] = useState<'harian' | 'semester' | 'matrix' | 'izin'>('harian')
  const resolvedWaliKelasId = activeWaliKelasId || kelasWali[0]?.id || ''

  // ── Modal/slideover state ─────────────────────────────────────
  const [arsipOpen,         setArsipOpen]         = useState(false)
  const [rekapTarget,       setRekapTarget]        = useState<AbsensiStatusItem | null>(null)
  const [activeSesi,        setActiveSesi]         = useState<SesiResponse | null>(null)
  const [showQR,            setShowQR]             = useState(false)
  const [bukaSesiTarget,    setBukaSesiTarget]     = useState<AbsensiStatusItem | null>(null)
  const [manualToken,       setManualToken]        = useState<string | null>(null)
  const [ubahModeOpen,      setUbahModeOpen]       = useState(false)

  // ── Handlers ──────────────────────────────────────────────────
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
    } else {
      handleReconnectSesi(item)
    }
  }

  const handlePerpanjang = (item: AbsensiStatusItem) => {
    if (activeSesi?.jadwalPelajaranId === item.jadwalId) {
      if (activeSesi.mode === 'MANUAL') setManualToken(activeSesi.token)
      else setShowQR(true)
    } else {
      handleReconnectSesi(item)
    }
  }

  // ── Guards ────────────────────────────────────────────────────
  if (!hasHydrated) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return (
    <div className="flex items-center justify-center h-64 text-sm text-gray-500 italic">
      Sesi berakhir, silakan login kembali...
    </div>
  )
  if (!bolehAkses) return (
    <div className="flex items-center justify-center h-64 text-sm text-gray-500">
      Anda tidak memiliki akses ke halaman ini.
    </div>
  )

  return (
    <div className="space-y-5">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">

        {/* Kiri: back + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.push('/dashboard/pembelajaran/guru')}
            className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center shrink-0 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <CalendarDays className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
                Absensi Saya
              </h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {semAktif
                ? `${semAktif.nama}${taAktif ? ' — ' + taAktif.nama : ''}`
                : 'Tidak ada semester aktif'}
            </p>
          </div>
        </div>

        {/* Kanan: arsip */}
        <Button
          variant="secondary"
          leftIcon={<Archive className="w-4 h-4" />}
          onClick={() => setArsipOpen(true)}
        >
          Arsip
        </Button>
      </div>

      {/* Warning */}
      {semListAktif.length === 0 && !isLoading && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-700">
            Tidak ada semester aktif. Hubungi admin untuk mengaktifkan semester.
          </p>
        </div>
      )}

      {/* ── Body: 2-col desktop ───────────────────────────────────── */}
      <div className="md:grid md:grid-cols-[240px_1fr] gap-5">

        {/* Kiri: 3 stat cards */}
        <div className="flex flex-col gap-3 mb-4 md:mb-0">
          <StatCard
            icon={<CalendarDays className="h-3.5 w-3.5 text-emerald-500" />}
            label="Realisasi Sesi"
            value={stat ? String(stat.realisasi) : '—'}
            sub={stat ? `dari ${stat.target} target` : 'belum ada data'}
            accent={stat && stat.persen >= 80 ? 'emerald' : stat ? 'orange' : 'gray'}
          />
          <StatCard
            icon={<CalendarDays className="h-3.5 w-3.5 text-blue-500" />}
            label="Kepatuhan"
            value={stat ? `${stat.persen}%` : '—'}
            sub={stat ? (stat.persen >= 80 ? 'Baik' : 'Perlu ditingkatkan') : 'belum ada data'}
            accent={stat && stat.persen >= 80 ? 'emerald' : stat ? 'orange' : 'gray'}
          />
          <StatCard
            icon={<BookOpen className="h-3.5 w-3.5 text-purple-500" />}
            label="Mata Pelajaran"
            value={stat ? String(stat.jumlahMapel) : '—'}
            sub="diajarkan semester ini"
            accent="gray"
          />
        </div>

        {/* Kanan: hari ini + jadwal perminggu */}
        <div className="space-y-6">

          {/* ─ Absensi Hari Ini ─────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Absensi Hari Ini
                </h2>
              </div>
              <div className="w-56 shrink-0">
                <SearchInput
                  placeholder="Cari jadwal atau kelas..."
                  value={search}
                  onChange={setSearch}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Spinner /></div>
            ) : filteredJadwal.length === 0 ? (
              <EmptyState
                icon={<CalendarDays size={22} />}
                title={search ? 'Tidak ditemukan' : 'Tidak ada jadwal hari ini'}
                description={search ? 'Coba kata kunci lain.' : 'Tidak ada jadwal mengajar hari ini.'}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredJadwal.map((item) => (
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

          {/* ─ Jadwal Mengajar (perminggu) ────────────────────────── */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Jadwal Mengajar
                </h2>
              </div>
              {availableHari.length > 0 && (
                <HariFilter
                  available={availableHari}
                  selected={selectedHari}
                  onChange={setSelectedHari}
                />
              )}
            </div>
            <JadwalMingguanGuruView
              data={jadwalMingguan}
              isLoading={false}
              selectedHari={selectedHari}
              hideStats
            />
          </div>
        </div>
      </div>

      {/* ── Wali Kelas section (jika isWaliKelas) ─────────────────── */}
      {isWaliKelas && kelasWali.length > 0 && resolvedSemId && (
        <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">

          {/* Header section wali kelas */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Wali Kelas</h2>
          </div>

          {/* Tab kelas — jika lebih dari 1 */}
          {kelasWali.length > 1 && (
            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              {kelasWali.map((k) => (
                <TabBtn
                  key={k.id}
                  active={resolvedWaliKelasId === k.id}
                  onClick={() => { setActiveWaliKelasId(k.id); setWaliSubTab('harian') }}
                >
                  <Users size={12} /> {k.namaKelas}
                </TabBtn>
              ))}
            </div>
          )}

          {/* Sub-tabs */}
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {([
              { key: 'harian',   label: 'Hari Ini'   },
              { key: 'semester', label: 'Rekap'       },
              { key: 'matrix',   label: 'Matrix'      },
              { key: 'izin',     label: 'Izin Masuk'  },
            ] as { key: typeof waliSubTab; label: string }[]).map(({ key, label }) => (
              <TabBtn key={key} active={waliSubTab === key} onClick={() => setWaliSubTab(key)}>
                {label}
              </TabBtn>
            ))}
          </div>

          {waliSubTab === 'harian'   && <RekapHarianTab   kelasId={resolvedWaliKelasId} semesterId={resolvedSemId} />}
          {waliSubTab === 'semester' && <RekapSemesterTab kelasId={resolvedWaliKelasId} semesterId={resolvedSemId} />}
          {waliSubTab === 'matrix'   && <MatrixMapelTab   kelasId={resolvedWaliKelasId} semesterId={resolvedSemId} />}
          {waliSubTab === 'izin'     && <IzinPendingTab   kelasId={resolvedWaliKelasId} />}
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────── */}
      <BukaSesiModal
        open={!!bukaSesiTarget}
        onClose={() => setBukaSesiTarget(null)}
        jadwal={bukaSesiTarget}
        onSuccess={handleSesiCreated}
        isReopen={
          bukaSesiTarget?.statusSesi === 'SELESAI' ||
          bukaSesiTarget?.statusSesi === 'EXPIRED'
        }
      />
      <QRSesiPanel
        open={showQR}
        sesi={activeSesi}
        onClose={() => setShowQR(false)}
        onTutup={() => { setActiveSesi(null); setShowQR(false) }}
      />
      <ManualAbsensiModal
        open={!!manualToken}
        token={manualToken}
        onClose={() => setManualToken(null)}
      />
      <AbsensiArsipSlideover
        open={arsipOpen}
        onClose={() => setArsipOpen(false)}
        guruId={user.id}
      />
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
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
        active
          ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

type Accent = 'emerald' | 'orange' | 'gray'
const ACCENT_MAP: Record<Accent, string> = {
  emerald: 'text-emerald-600 dark:text-emerald-400',
  orange:  'text-orange-500',
  gray:    'text-gray-800 dark:text-gray-200',
}

function StatCard({ icon, label, value, sub, accent = 'gray' }: {
  icon:    React.ReactNode
  label:   string
  value:   string
  sub:     string
  accent?: Accent
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <p className={'text-xl font-bold ' + ACCENT_MAP[accent]}>{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}
