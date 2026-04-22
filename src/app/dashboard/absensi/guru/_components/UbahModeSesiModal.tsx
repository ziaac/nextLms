'use client'

import { useState, useEffect }   from 'react'
import {
  Camera, Wifi, BookOpen,
  MapPin, AlertTriangle, Loader2,
} from 'lucide-react'
import { Modal }            from '@/components/ui/Modal'
import { Button }           from '@/components/ui/Button'
import { useUbahModeSesi }  from '@/hooks/absensi/useSesiAbsensi'
import type { ModeSesi, UbahModeSesiResponse } from '@/types'

type GpsStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'

interface Props {
  open:      boolean
  onClose:   () => void
  token:     string | null
  modeSaat:  ModeSesi | null
  onSuccess: (res: UbahModeSesiResponse) => void
}

const MODE_OPTIONS: {
  value: ModeSesi; label: string; desc: string; Icon: React.ElementType
}[] = [
  { value: 'QR_LURING', label: 'QR + GPS',  desc: 'Siswa scan QR, lokasi diverifikasi', Icon: Camera   },
  { value: 'QR_WFH',    label: 'QR WFH',    desc: 'Siswa scan QR, tanpa cek lokasi',    Icon: Wifi     },
  { value: 'MANUAL',    label: 'Manual',    desc: 'Guru input daftar hadir langsung',   Icon: BookOpen },
]

export function UbahModeSesiModal({ open, onClose, token, modeSaat, onSuccess }: Props) {
  const { mutate, isPending } = useUbahModeSesi()

  const [mode, setMode]           = useState<ModeSesi>('QR_LURING')
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle')
  const [coords, setCoords]       = useState<{ lat: number; lng: number } | null>(null)

  // Reset ke mode saat ini setiap modal dibuka
  useEffect(() => {
    if (!open) return
    setMode(modeSaat ?? 'QR_LURING')
    setGpsStatus('idle')
    setCoords(null)
  }, [open, modeSaat])

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
    if (!token) return
    if (mode === 'QR_LURING' && !coords) return
    mutate(
      {
        token,
        payload: {
          mode,
          ...(mode === 'QR_LURING' && coords
            ? { latitudeGuru: coords.lat, longitudeGuru: coords.lng }
            : {}),
        },
      },
      { onSuccess: (res) => onSuccess(res) },
    )
  }

  const isSameMode = mode === modeSaat
  const gpsBlocking = mode === 'QR_LURING' && gpsStatus !== 'granted'
  const canSubmit = !isPending && !isSameMode && !gpsBlocking

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ubah Mode Absensi"
      description="Perubahan berlaku langsung untuk sesi yang sedang berjalan"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button
            variant="primary" size="sm"
            loading={isPending}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Ubah Mode
          </Button>
        </>
      }
    >
      <div className="p-6 space-y-5">

        {/* Mode Options */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Pilih Mode Baru
          </label>
          <div className="grid gap-2">
            {MODE_OPTIONS.map((opt) => {
              const sel     = mode === opt.value
              const isCurr  = opt.value === modeSaat
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
                    <p className={[
                      'text-sm font-semibold',
                      sel ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white',
                    ].join(' ')}>
                      {opt.label}
                      {isCurr && (
                        <span className="ml-2 text-xs font-normal text-gray-400">(mode saat ini)</span>
                      )}
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

        {/* GPS Status */}
        {mode === 'QR_LURING' && <GpsRow status={gpsStatus} />}

        {/* Warning jika mode sama */}
        {isSameMode && (
          <p className="text-xs text-center text-gray-400">
            Pilih mode yang berbeda dari mode saat ini untuk melanjutkan.
          </p>
        )}

      </div>
    </Modal>
  )
}

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
