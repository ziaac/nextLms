import os

ROOT = r"D:\projects\LMS-MAN\Code\nextjslms\src"
FILES = {}

# ─────────────────────────────────────────────────────────────────────────────
# 1. app/dashboard/absensi/guru/page.tsx
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/guru/page.tsx"] = """'use client'

import { useState }           from 'react'
import { Calendar }           from 'lucide-react'
import { PageHeader }         from '@/components/ui/PageHeader'
import { EmptyState }         from '@/components/ui/EmptyState'
import { Spinner }            from '@/components/ui/Spinner'
import { useMyStatusHariIni } from '@/hooks/absensi/useMyStatusHariIni'
import { JadwalGuruCard }     from './_components/JadwalGuruCard'
import { BukaSesiModal }      from './_components/BukaSesiModal'
import { QRSesiPanel }        from './_components/QRSesiPanel'
import { ManualAbsensiModal } from './_components/ManualAbsensiModal'
import type { AbsensiStatusItem, SesiResponse } from '@/types'

export default function AbsensiGuruPage() {
  const {
    jadwalList,
    isLoading,
    aktiveSemesterNama,
    isWaliKelas,
    kelasWali,
  } = useMyStatusHariIni()

  // Tab aktif: 'jadwal' atau kelasId wali kelas
  const [activeTab, setActiveTab] = useState<string>('jadwal')

  // State sesi yang sedang berjalan (tetap ada walau panel ditutup)
  const [activeSesi, setActiveSesi] = useState<SesiResponse | null>(null)
  const [showQR, setShowQR]         = useState(false)

  // Modal buka sesi
  const [bukaSesiTarget, setBukaSesiTarget] = useState<AbsensiStatusItem | null>(null)

  // Token untuk mode Manual
  const [manualToken, setManualToken] = useState<string | null>(null)

  const handleSesiCreated = (sesi: SesiResponse) => {
    setBukaSesiTarget(null)
    if (sesi.mode === 'MANUAL') {
      setManualToken(sesi.token)
    } else {
      setActiveSesi(sesi)
      setShowQR(true)
    }
  }

  // Dipanggil saat guru tutup sesi dari dalam QRSesiPanel
  const handleSesiDitutup = () => {
    setActiveSesi(null)
    setShowQR(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Absensi"
        description={aktiveSemesterNama ? `Semester ${aktiveSemesterNama}` : undefined}
      />

      {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        <TabBtn active={activeTab === 'jadwal'} onClick={() => setActiveTab('jadwal')}>
          Jadwal Hari Ini
        </TabBtn>
        {isWaliKelas && kelasWali.map((kelas) => (
          <TabBtn
            key={kelas.id}
            active={activeTab === kelas.id}
            onClick={() => setActiveTab(kelas.id)}
          >
            {kelas.namaKelas}
          </TabBtn>
        ))}
      </div>

      {/* ── Tab: Jadwal ──────────────────────────────────────────────────── */}
      {activeTab === 'jadwal' && (
        jadwalList.length === 0 ? (
          <EmptyState
            icon={<Calendar size={22} />}
            title="Tidak ada jadwal hari ini"
            description="Kamu tidak memiliki jadwal mengajar untuk hari ini."
          />
        ) : (
          <div className="grid gap-3 max-w-2xl">
            {jadwalList.map((item) => (
              <JadwalGuruCard
                key={item.jadwalId}
                item={item}
                isActivelyManaged={activeSesi?.jadwalPelajaranId === item.jadwalId}
                onBukaSesi={() => setBukaSesiTarget(item)}
                onKelolaAktif={() => setShowQR(true)}
              />
            ))}
          </div>
        )
      )}

      {/* ── Tab: Wali Kelas (placeholder — endpoint perlu dikonfirmasi) ── */}
      {activeTab !== 'jadwal' && (
        <WaliKelasView kelasId={activeTab} namaKelas={kelasWali.find(k => k.id === activeTab)?.namaKelas ?? ''} />
      )}

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <BukaSesiModal
        open={!!bukaSesiTarget}
        onClose={() => setBukaSesiTarget(null)}
        jadwal={bukaSesiTarget}
        onSuccess={handleSesiCreated}
      />

      <QRSesiPanel
        open={showQR}
        sesi={activeSesi}
        onClose={() => setShowQR(false)}
        onTutup={handleSesiDitutup}
      />

      <ManualAbsensiModal
        open={!!manualToken}
        token={manualToken}
        onClose={() => setManualToken(null)}
      />
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function TabBtn({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
        active
          ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// TODO: Konfirmasi endpoint rekap harian per kelas wali ke backend
// Kemungkinan: GET /absensi/rekap/harian?kelasId={id}&tanggal={today}
function WaliKelasView({ kelasId: _kelasId, namaKelas }: { kelasId: string; namaKelas: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
      <p className="font-medium text-gray-700 dark:text-gray-300">
        Rekap Harian \u2014 {namaKelas}
      </p>
      <p className="text-sm text-gray-400 max-w-sm">
        Endpoint rekap harian wali kelas belum dikonfirmasi dari backend.
        Hubungi tim backend untuk menambah endpoint yang sesuai.
      </p>
    </div>
  )
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# 2. _components/JadwalGuruCard.tsx
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/guru/_components/JadwalGuruCard.tsx"] = """'use client'

import {
  Clock, Camera, Wifi, BookOpen, Eye,
  CheckCircle2, AlertCircle, MinusCircle, Timer,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { AbsensiStatusItem } from '@/types'

interface Props {
  item:              AbsensiStatusItem
  isActivelyManaged: boolean  // sesi aktif & token tersimpan di state halaman
  onBukaSesi:        () => void
  onKelolaAktif:     () => void  // buka kembali QRSesiPanel
}

const STATUS_MAP = {
  HADIR:       { label: 'Hadir',   cls: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400', Icon: CheckCircle2 },
  TERLAMBAT:   { label: 'Lambat',  cls: 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400',    Icon: AlertCircle  },
  SAKIT:       { label: 'Sakit',   cls: 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',            Icon: MinusCircle  },
  IZIN:        { label: 'Izin',    cls: 'text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',    Icon: MinusCircle  },
  ALPA:        { label: 'Alpa',    cls: 'text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400',                Icon: AlertCircle  },
  BELUM_ABSEN: { label: 'Belum',   cls: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400',             Icon: Timer        },
} as const

const MODE_MAP = {
  QR_LURING: { label: 'QR + GPS', Icon: Camera,   cls: 'text-emerald-600 dark:text-emerald-400' },
  QR_WFH:    { label: 'QR WFH',   Icon: Wifi,     cls: 'text-blue-600 dark:text-blue-400'       },
  MANUAL:    { label: 'Manual',   Icon: BookOpen, cls: 'text-gray-500 dark:text-gray-400'       },
} as const

export function JadwalGuruCard({ item, isActivelyManaged, onBukaSesi, onKelolaAktif }: Props) {
  const statusKey = (item.statusAbsensi in STATUS_MAP
    ? item.statusAbsensi
    : 'BELUM_ABSEN') as keyof typeof STATUS_MAP

  const { label: statusLabel, cls: statusCls, Icon: StatusIcon } = STATUS_MAP[statusKey]
  const modeCfg = item.modeSesi ? MODE_MAP[item.modeSesi] : null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3 hover:shadow-sm transition-shadow">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white truncate">{item.namaMapel}</p>
          <div className="flex items-center gap-1.5 mt-0.5 text-gray-500">
            <Clock size={11} />
            <span className="text-xs">{item.jam}</span>
          </div>
        </div>
        <span className={'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ' + statusCls}>
          <StatusIcon size={11} />
          {statusLabel}
        </span>
      </div>

      {/* Mode sesi indicator */}
      {item.isOngoing && modeCfg && (
        <div className={'flex items-center gap-1.5 text-xs font-medium ' + modeCfg.cls}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <modeCfg.Icon size={12} />
          <span>Sesi aktif \u2014 {modeCfg.label}</span>
        </div>
      )}

      {/* Action */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
        {isActivelyManaged ? (
          <Button
            variant="primary" size="sm" className="w-full"
            leftIcon={<Eye size={14} />}
            onClick={onKelolaAktif}
          >
            Kelola Sesi Aktif
          </Button>
        ) : item.isOngoing ? (
          // Sesi berjalan tapi token tidak ada (halaman di-refresh)
          <div className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 text-xs font-medium border border-orange-200 dark:border-orange-800">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            Sesi sedang berjalan \u2014 refresh halaman untuk kelola
          </div>
        ) : (
          <Button variant="secondary" size="sm" className="w-full" onClick={onBukaSesi}>
            Buka Absensi
          </Button>
        )}
      </div>

    </div>
  )
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# 3. _components/BukaSesiModal.tsx
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/guru/_components/BukaSesiModal.tsx"] = """'use client'

import { useState, useEffect }       from 'react'
import { Camera, Wifi, BookOpen, MapPin, AlertTriangle, Loader2 } from 'lucide-react'
import { Modal }       from '@/components/ui/Modal'
import { Button }      from '@/components/ui/Button'
import { useBukaSesi } from '@/hooks/absensi/useSesiAbsensi'
import type { AbsensiStatusItem, SesiResponse, ModeSesi } from '@/types'

type GpsStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'

interface Props {
  open:      boolean
  onClose:   () => void
  jadwal:    AbsensiStatusItem | null
  onSuccess: (sesi: SesiResponse) => void
}

const MODE_OPTIONS: {
  value: ModeSesi; label: string; desc: string; Icon: React.ElementType
}[] = [
  { value: 'QR_LURING', label: 'QR + GPS',  desc: 'Siswa scan QR, lokasi diverifikasi', Icon: Camera   },
  { value: 'QR_WFH',    label: 'QR WFH',    desc: 'Siswa scan QR, tanpa cek lokasi',    Icon: Wifi     },
  { value: 'MANUAL',    label: 'Manual',    desc: 'Guru input daftar hadir langsung',   Icon: BookOpen },
]

export function BukaSesiModal({ open, onClose, jadwal, onSuccess }: Props) {
  const { mutate, isPending } = useBukaSesi()

  const [mode, setMode]           = useState<ModeSesi>('QR_LURING')
  const [durasi, setDurasi]       = useState(30)
  const [toleransi, setToleransi] = useState(15)
  const [radius, setRadius]       = useState(100)
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle')
  const [coords, setCoords]       = useState<{ lat: number; lng: number } | null>(null)

  // Reset state setiap modal dibuka
  useEffect(() => {
    if (!open) return
    setMode('QR_LURING')
    setDurasi(30)
    setToleransi(15)
    setRadius(100)
    setGpsStatus('idle')
    setCoords(null)
  }, [open])

  // Auto-request GPS saat mode QR_LURING dipilih
  useEffect(() => {
    if (!open || mode !== 'QR_LURING') { setCoords(null); return }
    if (!navigator.geolocation) { setGpsStatus('unavailable'); return }
    setGpsStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsStatus('granted')
      },
      () => setGpsStatus('denied'),
      { timeout: 8_000, enableHighAccuracy: true },
    )
  }, [mode, open])

  const handleSubmit = () => {
    if (!jadwal) return
    if (mode === 'QR_LURING' && !coords) return
    const today = new Date().toISOString().slice(0, 10)
    mutate(
      {
        jadwalPelajaranId: jadwal.jadwalId,
        tanggal:           today,
        durasiMenit:       durasi,
        toleransiMenit:    toleransi,
        requireGps:        mode === 'QR_LURING',
        ...(mode === 'QR_LURING' && coords
          ? { latitudeGuru: coords.lat, longitudeGuru: coords.lng, radiusMeter: radius }
          : {}),
      },
      { onSuccess: (data) => onSuccess(data) },
    )
  }

  const canSubmit = !isPending && (mode !== 'QR_LURING' || gpsStatus === 'granted')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buka Sesi Absensi"
      description={jadwal?.namaMapel}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button
            variant="primary" size="sm"
            loading={isPending} disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Buka Sesi
          </Button>
        </>
      }
    >
      <div className="p-6 space-y-5">

        {/* Mode Selection — Radio Cards */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mode Absensi
          </label>
          <div className="grid gap-2">
            {MODE_OPTIONS.map((opt) => {
              const sel = mode === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMode(opt.value)}
                  className={[
                    'flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors',
                    sel
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                  ].join(' ')}
                >
                  <div className={[
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    sel
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500',
                  ].join(' ')}>
                    <opt.Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={['text-sm font-semibold', sel ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white'].join(' ')}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                  <div className={[
                    'w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors',
                    sel ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 dark:border-gray-600',
                  ].join(' ')} />
                </button>
              )
            })}
          </div>
        </div>

        {/* GPS Status Row */}
        {mode === 'QR_LURING' && <GpsRow status={gpsStatus} />}

        {/* Durasi & Toleransi */}
        <div className="grid grid-cols-2 gap-4">
          <NumberInput
            label="Durasi (menit)"
            value={durasi} min={5} max={120}
            onChange={(v) => setDurasi(v)}
          />
          <NumberInput
            label="Toleransi (menit)"
            value={toleransi} min={0} max={60}
            onChange={(v) => setToleransi(v)}
          />
        </div>

        {/* Radius — hanya QR_LURING */}
        {mode === 'QR_LURING' && (
          <NumberInput
            label="Radius Lokasi (meter)"
            value={radius} min={10} max={500}
            onChange={(v) => setRadius(v)}
          />
        )}

      </div>
    </Modal>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function GpsRow({ status }: { status: GpsStatus }) {
  const CFG: Record<GpsStatus, { label: string; cls: string; Icon: React.ElementType }> = {
    idle:        { label: 'GPS akan dideteksi...',               cls: 'text-gray-400',    Icon: MapPin        },
    requesting:  { label: 'Meminta akses lokasi...',             cls: 'text-blue-500',    Icon: Loader2       },
    granted:     { label: 'Lokasi berhasil terdeteksi',          cls: 'text-emerald-600', Icon: MapPin        },
    denied:      { label: 'GPS ditolak \u2014 izinkan di browser', cls: 'text-red-500',   Icon: AlertTriangle },
    unavailable: { label: 'GPS tidak tersedia di perangkat ini', cls: 'text-orange-500',  Icon: AlertTriangle },
  }
  const { label, cls, Icon } = CFG[status]
  return (
    <div className={'flex items-center gap-2 text-xs font-medium px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 ' + cls}>
      <Icon size={13} className={status === 'requesting' ? 'animate-spin' : ''} />
      <span>{label}</span>
    </div>
  )
}

function NumberInput({
  label, value, min, max, onChange,
}: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
      <input
        type="number"
        value={value} min={min} max={max}
        onChange={(e) => onChange(Math.min(max, Math.max(min, +e.target.value)))}
        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  )
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# 4. _components/QRSesiPanel.tsx
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/guru/_components/QRSesiPanel.tsx"] = """'use client'

import { useState, useEffect }   from 'react'
import { QRCodeSVG }             from 'qrcode.react'
import { Clock, Users, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { useQueryClient }        from '@tanstack/react-query'
import { Modal }                 from '@/components/ui/Modal'
import { Button }                from '@/components/ui/Button'
import { Spinner }               from '@/components/ui/Spinner'
import {
  useSesiLive,
  useTutupSesi,
  usePerpanjangSesi,
  sesiKeys,
} from '@/hooks/absensi/useSesiAbsensi'
import { getSocket }   from '@/lib/socket'
import { useAuthStore } from '@/stores/auth.store'
import type { SesiResponse } from '@/types'

interface Props {
  open:    boolean
  sesi:    SesiResponse | null
  onClose: () => void   // tutup panel saja (sesi tetap berjalan)
  onTutup: () => void   // tutup sesi + clear state di parent
}

export function QRSesiPanel({ open, sesi, onClose, onTutup }: Props) {
  const qc      = useQueryClient()
  const user    = useAuthStore((s) => s.user)
  const token   = sesi?.token   ?? null
  const kelasId = sesi?.kelasId ?? null

  const { data: sesiDetail, isLoading } = useSesiLive(open ? token : null)
  const tutup      = useTutupSesi()
  const perpanjang = usePerpanjangSesi()

  const [timeLeft, setTimeLeft]         = useState(0)
  const [tambahanMenit, setTambahanMenit] = useState(10)

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sesiDetail?.sesi.expiresAt) return
    const tick = () => {
      const diff = new Date(sesiDetail.sesi.expiresAt).getTime() - Date.now()
      setTimeLeft(Math.max(0, Math.floor(diff / 1000)))
    }
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [sesiDetail?.sesi.expiresAt])

  // ── Socket.IO: real-time update saat siswa scan ───────────────────────────
  useEffect(() => {
    if (!open || !token || !kelasId || !user?.id) return
    const s = getSocket()
    s.emit('join:kelas', kelasId)
    const handler = () => {
      qc.invalidateQueries({ queryKey: sesiKeys.detail(token) })
    }
    s.on('absensi:siswa-scan', handler)
    return () => { s.off('absensi:siswa-scan', handler) }
  }, [open, token, kelasId, user?.id, qc])

  // QR URL yang akan di-encode
  const qrUrl = token && typeof window !== 'undefined'
    ? `${window.location.origin}/dashboard/absensi/scan?token=${token}`
    : ''

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
  }

  const handleTutup = () => {
    if (!token) return
    tutup.mutate(token, { onSuccess: onTutup })
  }

  const handlePerpanjang = () => {
    if (!token) return
    perpanjang.mutate({ token, payload: { tambahanMenit } })
  }

  const peserta   = sesiDetail?.peserta ?? []
  const statistik = sesiDetail?.statistik
  const isExpired = timeLeft === 0 && !!sesiDetail

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sesi Absensi Aktif"
      description={sesi ? `${sesi.tanggal} \u2022 ${sesi.jamMulai} \u2022 ${sesi.mode}` : undefined}
      size="xl"
      footer={
        <div className="flex items-center gap-3 w-full flex-wrap">
          {/* Perpanjang */}
          <div className="flex items-center gap-2 mr-auto">
            <span className="text-xs text-gray-500 hidden sm:inline">Tambah:</span>
            <input
              type="number" value={tambahanMenit} min={1} max={60}
              onChange={(e) => setTambahanMenit(Math.max(1, +e.target.value))}
              className="w-14 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm text-center outline-none focus:border-emerald-500"
            />
            <span className="text-xs text-gray-500">menit</span>
            <Button
              variant="secondary" size="sm"
              loading={perpanjang.isPending}
              leftIcon={<RefreshCw size={13} />}
              onClick={handlePerpanjang}
            >
              Perpanjang
            </Button>
          </div>
          <Button
            variant="danger" size="sm"
            loading={tutup.isPending}
            onClick={handleTutup}
          >
            Tutup Sesi
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Spinner /></div>
      ) : (
        <div className="p-6 grid md:grid-cols-2 gap-6">

          {/* ── Kolom Kiri: QR + Countdown ── */}
          <div className="flex flex-col items-center gap-4">
            <div className={[
              'p-4 rounded-2xl bg-white border-4 transition-all',
              isExpired
                ? 'border-red-300 opacity-50 grayscale'
                : 'border-emerald-400 shadow-lg',
            ].join(' ')}>
              {qrUrl ? (
                <QRCodeSVG value={qrUrl} size={188} />
              ) : (
                <div className="w-[188px] h-[188px] flex items-center justify-center bg-gray-100">
                  <Spinner />
                </div>
              )}
            </div>

            {/* Countdown */}
            <div className={[
              'flex items-center gap-2 px-5 py-2.5 rounded-2xl text-3xl font-mono font-bold tabular-nums',
              timeLeft <= 60
                ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
            ].join(' ')}>
              <Clock size={20} />
              {fmt(timeLeft)}
            </div>

            {isExpired && (
              <p className="text-xs text-red-500 text-center font-medium">
                Sesi telah berakhir. Perpanjang atau tutup sesi.
              </p>
            )}
          </div>

          {/* ── Kolom Kanan: Statistik + Peserta ── */}
          <div className="space-y-4">

            {/* Stats */}
            {statistik && (
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="Total" value={statistik.total} />
                <StatCard label="Hadir" value={statistik.hadir} color="text-emerald-600" />
                <StatCard label="Belum" value={statistik.sisa}  color="text-orange-500"  />
              </div>
            )}

            {/* Peserta */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Users size={12} />
                Peserta ({peserta.filter(p => p.isEligible).length} siswa)
              </p>
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                {peserta.map((p) => (
                  <div
                    key={p.id}
                    className={[
                      'flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors',
                      !p.isEligible
                        ? 'opacity-30'
                        : p.sudahScan
                        ? 'bg-emerald-50 dark:bg-emerald-900/20'
                        : 'bg-gray-50 dark:bg-gray-800/50',
                    ].join(' ')}
                  >
                    <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0 tabular-nums">
                      {p.absen}
                    </span>
                    <span className="flex-1 truncate text-gray-800 dark:text-gray-200">{p.nama}</span>
                    {p.isEligible && (
                      p.sudahScan
                        ? <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                        : <XCircle      size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    )}
                  </div>
                ))}
                {peserta.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6 italic">
                    Memuat daftar peserta...
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </Modal>
  )
}

function StatCard({ label, value, color = 'text-gray-900 dark:text-white' }: {
  label: string; value: number; color?: string
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
      <p className={'text-2xl font-bold tabular-nums ' + color}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# 5. _components/ManualAbsensiModal.tsx
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/guru/_components/ManualAbsensiModal.tsx"] = """'use client'

import { useState, useEffect }  from 'react'
import { CheckSquare, Square, Users } from 'lucide-react'
import { Modal }               from '@/components/ui/Modal'
import { Button }              from '@/components/ui/Button'
import { Spinner }             from '@/components/ui/Spinner'
import { useSesiLive }         from '@/hooks/absensi/useSesiAbsensi'
import { useSimpanManualBulk } from '@/hooks/absensi/useAbsensiManajemen'
import type { StatusAbsensi }  from '@/types'

interface Props {
  open:    boolean
  token:   string | null
  onClose: () => void
}

export function ManualAbsensiModal({ open, token, onClose }: Props) {
  const { data: sesiDetail, isLoading } = useSesiLive(open ? token : null)
  const { mutate, isPending }           = useSimpanManualBulk()

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  // Auto-check semua eligible siswa saat data pertama masuk
  useEffect(() => {
    if (!sesiDetail) return
    const ids = sesiDetail.peserta.filter((p) => p.isEligible).map((p) => p.id)
    setCheckedIds(new Set(ids))
  }, [sesiDetail])

  const eligible   = sesiDetail?.peserta.filter((p) => p.isEligible) ?? []
  const allChecked = eligible.length > 0 && eligible.every((p) => checkedIds.has(p.id))
  const hadirCount = eligible.filter((p) => checkedIds.has(p.id)).length

  const toggleAll = () => {
    setCheckedIds(allChecked ? new Set() : new Set(eligible.map((p) => p.id)))
  }

  const toggle = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSubmit = () => {
    if (!sesiDetail) return
    const { sesi } = sesiDetail
    mutate(
      {
        jadwalPelajaranId: sesi.jadwalPelajaranId,
        tanggal:           sesi.tanggal,
        absensi: eligible.map((p) => ({
          userId: p.id,
          status: (checkedIds.has(p.id) ? 'HADIR' : 'ALPA') as StatusAbsensi,
        })),
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Absensi Manual"
      description={sesiDetail?.sesi.tanggal}
      size="md"
      footer={
        sesiDetail ? (
          <>
            <span className="text-sm text-gray-500 mr-auto">
              Hadir: <span className="font-semibold text-emerald-600">{hadirCount}</span>
              /{eligible.length}
            </span>
            <Button variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button variant="primary" size="sm" loading={isPending} onClick={handleSubmit}>
              Simpan Absensi
            </Button>
          </>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Spinner /></div>
      ) : (
        <div className="p-4 space-y-2">

          {/* Check All */}
          <button
            type="button"
            onClick={toggleAll}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
          >
            {allChecked
              ? <CheckSquare size={16} className="text-emerald-500" />
              : <Square      size={16} className="text-gray-400" />
            }
            <Users size={14} className="text-gray-400" />
            <span>Pilih Semua \u2014 {eligible.length} siswa</span>
          </button>

          {/* Daftar Siswa */}
          <div className="max-h-96 overflow-y-auto space-y-1 pr-1">
            {eligible.map((p) => {
              const checked = checkedIds.has(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={[
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-colors',
                    checked
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800',
                  ].join(' ')}
                >
                  {checked
                    ? <CheckSquare size={15} className="text-emerald-500 flex-shrink-0" />
                    : <Square      size={15} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                  }
                  <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0 tabular-nums">
                    {p.absen}
                  </span>
                  <span className={[
                    'flex-1 truncate',
                    checked
                      ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300',
                  ].join(' ')}>
                    {p.nama}
                  </span>
                  <span className={[
                    'text-xs font-semibold flex-shrink-0',
                    checked ? 'text-emerald-600' : 'text-red-400',
                  ].join(' ')}>
                    {checked ? 'Hadir' : 'Alpa'}
                  </span>
                </button>
              )
            })}
            {eligible.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8 italic">
                Tidak ada peserta terdaftar.
              </p>
            )}
          </div>

        </div>
      )}
    </Modal>
  )
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# WRITER
# ─────────────────────────────────────────────────────────────────────────────
def write_files():
    for relative_path, content in FILES.items():
        full_path = os.path.join(ROOT, relative_path.replace('/', os.sep))
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[OK] {relative_path}")

if __name__ == '__main__':
    write_files()
    print("\n✅ Batch 4 selesai — 5 file digenerate.")
    print("   Verifikasi: npx tsc --noEmit 2>&1 | Select-String 'guru|QRSesi|BukaSesi|ManualAbsensi|JadwalGuru'")