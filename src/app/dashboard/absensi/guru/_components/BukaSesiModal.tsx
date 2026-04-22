'use client'

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
  isReopen?: boolean
}

const MODE_OPTIONS: {
  value: ModeSesi; label: string; desc: string; Icon: React.ElementType
}[] = [
  { value: 'QR_LURING', label: 'QR + GPS',  desc: 'Siswa scan QR, lokasi diverifikasi', Icon: Camera   },
  { value: 'QR_WFH',    label: 'QR WFH',    desc: 'Siswa scan QR, tanpa cek lokasi',    Icon: Wifi     },
  { value: 'MANUAL',    label: 'Manual',    desc: 'Guru input daftar hadir langsung',   Icon: BookOpen },
]

export function BukaSesiModal({ open, onClose, jadwal, onSuccess, isReopen }: Props) {
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
        mode,
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
      title={isReopen ? 'Buka Absensi Kembali' : 'Buka Sesi Absensi'}
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
        {/* Warning banner saat buka kembali */}
        {isReopen && (
          <div className="flex items-start gap-2.5 bg-danger-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                Perhatian — Buka Absensi Kembali
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Semua siswa dengan status <span className="font-semibold">ALPA</span> dan{' '}
                <span className="font-semibold">TERLAMBAT</span> akan direset.
                Siswa tersebut dapat melakukan absensi kembali di sesi ini.
                Status <span className="font-semibold">HADIR, IZIN,</span> dan{' '}
                <span className="font-semibold">SAKIT</span> tidak berubah.
              </p>
            </div>
          </div>
        )}

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
                    'flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors',
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
    denied:      { label: 'GPS ditolak — izinkan di browser',    cls: 'text-red-500',     Icon: AlertTriangle },
    unavailable: { label: 'GPS tidak tersedia di perangkat ini', cls: 'text-orange-500',  Icon: AlertTriangle },
  }
  const { label, cls, Icon } = CFG[status]
  return (
    <div className={'flex items-center gap-2 text-xs font-medium px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 ' + cls}>
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
        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  )
}
