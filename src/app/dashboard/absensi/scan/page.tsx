'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams }  from 'next/navigation'
import { useQuery }         from '@tanstack/react-query'
import {
  MapPin, AlertTriangle, CheckCircle2,
  XCircle, Loader2, Clock,
} from 'lucide-react'
import { getSesiDetail, scanQR } from '@/lib/api/absensi.api'
import { TIMEZONE } from '@/lib/constants'
import { Button }  from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

// ── Constants ─────────────────────────────────────────────────────────────────

const SCAN_ERRORS: Record<number, string> = {
  400: 'Kamu berada di luar area absensi atau sesi belum dimulai.',
  403: 'Kamu bukan bagian dari kelas ini.',
  404: 'Token QR sudah kadaluarsa atau tidak ditemukan.',
  409: 'Kamu sudah tercatat hadir untuk sesi ini.',
}

const MODE_LABEL: Record<string, string> = {
  QR_LURING: 'QR + Verifikasi Lokasi',
  QR_WFH:    'QR Jarak Jauh',
  MANUAL:    'Manual',
}

const FALLBACK_ERR = 'Terjadi kesalahan. Silakan coba lagi.'

// ── Types ─────────────────────────────────────────────────────────────────────

type GpsStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
type PageState = 'loading' | 'confirm' | 'submitting' | 'success' | 'error' | 'invalid'

// ── Inner Component ───────────────────────────────────────────────────────────

function ScanContent() {
  const searchParams = useSearchParams()
  const token        = searchParams.get('token')

  const [pageState, setPageState] = useState<PageState>('loading')
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle')
  const [coords, setCoords]       = useState<{ lat: number; lng: number } | null>(null)
  const [errorMsg, setErrorMsg]   = useState<string>('')

  const { data, isError } = useQuery({
    queryKey: ['absensi', 'sesi-scan', token ?? ''],
    queryFn:  () => getSesiDetail(token!),
    enabled:  !!token,
    retry:    1,
    staleTime: 0,
  })

  useEffect(() => { if (data)    setPageState('confirm') }, [data])
  useEffect(() => { if (isError) setPageState('invalid') }, [isError])

  const requestGps = () => {
    if (!navigator.geolocation) { setGpsStatus('unavailable'); return }
    setGpsStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsStatus('granted')
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied')
        } else if (err.code === err.TIMEOUT) {
          setGpsStatus('denied')
        } else {
          setGpsStatus('unavailable')
        }
      },
      { timeout: 15_000, enableHighAccuracy: true, maximumAge: 0 },
    )
  }

  useEffect(() => {
    if (!data?.sesi.requireGps) return
    // Delay sedikit agar page fully mounted — penting untuk iOS
    const timer = setTimeout(() => requestGps(), 500)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.sesi.requireGps])

  const handleAbsen = async () => {
    if (!token) return
    if (data?.sesi.requireGps && gpsStatus !== 'granted') return
    setPageState('submitting')
    try {
      await scanQR({ token, latitude: coords?.lat, longitude: coords?.lng })
      setPageState('success')
    } catch (err) {
      // FIX: gunakan SCAN_ERRORS[status ?? -1] agar tidak return 0 (number)
      const status = (err as { response?: { status?: number } })?.response?.status
      setErrorMsg(SCAN_ERRORS[status ?? -1] ?? FALLBACK_ERR)
      setPageState('error')
    }
  }

  // ── No token ──────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <ScanShell>
        <IconBox><XCircle className="text-red-400" size={28} /></IconBox>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Link Tidak Valid</h1>
        <p className="text-sm text-gray-500 text-center max-w-xs">
          Token absensi tidak ditemukan. Pastikan kamu scan QR dari gurumu.
        </p>
      </ScanShell>
    )
  }

  if (pageState === 'loading') {
    return (
      <ScanShell>
        <Spinner />
        <p className="text-sm text-gray-500">Memuat informasi sesi...</p>
      </ScanShell>
    )
  }

  if (pageState === 'invalid') {
    return (
      <ScanShell>
        <IconBox><AlertTriangle className="text-orange-400" size={28} /></IconBox>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Sesi Tidak Tersedia</h1>
        <p className="text-sm text-gray-500 text-center max-w-xs">
          Token QR sudah kadaluarsa atau tidak ditemukan. Minta guru membuka sesi baru.
        </p>
      </ScanShell>
    )
  }

  if (pageState === 'success') {
    return (
      <ScanShell>
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle2 className="text-emerald-500" size={32} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Absensi Tercatat!</h1>
        <p className="text-sm text-gray-500 text-center">
          Kehadiran kamu berhasil dicatat. Selamat belajar!
        </p>
      </ScanShell>
    )
  }

  if (pageState === 'error') {
    return (
      <ScanShell>
        <IconBox><XCircle className="text-red-400" size={28} /></IconBox>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Absensi Gagal</h1>
        <p className="text-sm text-gray-500 text-center max-w-xs">{errorMsg}</p>
        <Button variant="secondary" size="sm" onClick={() => setPageState('confirm')}>
          Coba Lagi
        </Button>
      </ScanShell>
    )
  }

  // ── Confirm ───────────────────────────────────────────────────────────────
  const sesi         = data!.sesi
  const statistik    = data!.statistik
  const gpsBlocking  = sesi.requireGps && gpsStatus !== 'granted'
  const isSubmitting = pageState === 'submitting'
  const tanggalDisplay = sesi.tanggal.split('-').reverse().join('/')
  const expiredDisplay = new Date(sesi.expiresAt).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE,
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-start justify-center p-4 pt-8">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Konfirmasi Absensi</h1>
          <p className="text-sm text-gray-500">Pastikan data berikut sesuai sebelum absen</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          <InfoRow label="Tanggal"   value={tanggalDisplay} />
          <InfoRow label="Jam Mulai" value={sesi.jamMulai} />
          <InfoRow label="Mode"      value={MODE_LABEL[sesi.mode] ?? sesi.mode} />
          <InfoRow label="Toleransi" value={sesi.toleransiMenit + ' menit'} />
          <InfoRow label="Berakhir"  value={expiredDisplay} />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <StatBadge label="Total" value={statistik.total} />
            <StatBadge label="Hadir" value={statistik.hadir} color="text-emerald-600" />
            <StatBadge label="Sisa"  value={statistik.sisa}  color="text-orange-500"  />
          </div>
        </div>

        {sesi.requireGps && <GpsIndicator status={gpsStatus} />}

        {/* Tombol aktifkan GPS — muncul saat idle atau denied */}
        {sesi.requireGps && (gpsStatus === 'idle' || gpsStatus === 'denied') && (
          <Button
            variant="secondary" size="sm" className="w-full"
            onClick={requestGps}
          >
            <MapPin className="h-4 w-4 mr-1.5" />
            {gpsStatus === 'denied' ? 'Coba Aktifkan GPS Lagi' : 'Aktifkan GPS'}
          </Button>
        )}

        {/* Panduan jika denied di iOS */}
        {sesi.requireGps && gpsStatus === 'denied' && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg px-4 py-3 space-y-1.5">
            <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">
              GPS ditolak — cara mengaktifkan:
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              <span className="font-medium">iPhone:</span> Pengaturan → Safari/Chrome → Lokasi → Izinkan
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              <span className="font-medium">Android:</span> Ketuk ikon kunci di address bar → Izin → Lokasi
            </p>
          </div>
        )}

        <Button
          variant="primary" size="lg" className="w-full"
          loading={isSubmitting}
          disabled={gpsBlocking || isSubmitting}
          onClick={handleAbsen}
        >
          {isSubmitting ? 'Mencatat absensi...' : 'Absen Sekarang'}
        </Button>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ScanShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center gap-4 p-6 text-center">
      {children}
    </div>
  )
}

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-4">
      <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white text-right">{value}</span>
    </div>
  )
}

function StatBadge({ label, value, color = 'text-gray-900 dark:text-white' }: {
  label: string; value: number; color?: string
}) {
  return (
    <div>
      <p className={'text-xl font-bold ' + color}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

function GpsIndicator({ status }: { status: GpsStatus }) {
  const CFG = {
    idle:        { label: 'Mendeteksi lokasi...',                              cls: 'text-gray-400',    Icon: Clock         },
    requesting:  { label: 'Meminta akses lokasi...',                           cls: 'text-blue-500',    Icon: Loader2       },
    granted:     { label: 'Lokasi berhasil terdeteksi',                        cls: 'text-emerald-600', Icon: MapPin        },
    denied:      { label: 'Akses GPS ditolak — izinkan di pengaturan browser', cls: 'text-red-500', Icon: AlertTriangle },
    unavailable: { label: 'GPS tidak tersedia di perangkat ini',               cls: 'text-orange-500',  Icon: AlertTriangle },
  } as const
  const { label, cls, Icon } = CFG[status]
  return (
    <div className={'flex items-center gap-2 text-xs font-medium px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 ' + cls}>
      <Icon size={14} className={status === 'requesting' ? 'animate-spin' : ''} />
      <span>{label}</span>
    </div>
  )
}

// ── Page Export ───────────────────────────────────────────────────────────────

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <Spinner />
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  )
}
