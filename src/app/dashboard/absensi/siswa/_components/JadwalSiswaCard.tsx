'use client'

import {
  Clock, Camera, Wifi, BookOpen,
  CheckCircle2, AlertCircle, MinusCircle, Timer,
  FileCheck, RotateCcw, LogIn,
} from 'lucide-react'
import { useRouter }  from 'next/navigation'
import { Button }     from '@/components/ui/Button'
import type { AbsensiStatusItem } from '@/types'
import type { PerizinanItem }    from '@/types/perizinan.types'

interface Props {
  item:            AbsensiStatusItem
  onIzin:          () => void
  perizinanAktif?: PerizinanItem | null   // perizinan yang sudah diajukan untuk hari ini
}

const STATUS_MAP = {
  HADIR:       { label: 'Hadir',       cls: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400', Icon: CheckCircle2 },
  TERLAMBAT:   { label: 'Terlambat',   cls: 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400',    Icon: AlertCircle  },
  SAKIT:       { label: 'Sakit',       cls: 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',            Icon: MinusCircle  },
  IZIN:        { label: 'Izin',        cls: 'text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',    Icon: MinusCircle  },
  ALPA:        { label: 'Alpa',        cls: 'text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400',                Icon: AlertCircle  },
  TAP:         { label: 'TAP',         cls: 'text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400',    Icon: AlertCircle  },
  BELUM_ABSEN: { label: 'Belum Absen', cls: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400',             Icon: Timer        },
} as const

const MODE_MAP = {
  QR_LURING: { label: 'Sesi aktif — Scan QR + GPS', Icon: Camera,   cls: 'text-emerald-600 dark:text-emerald-400' },
  QR_WFH:    { label: 'Sesi aktif — Scan QR',       Icon: Wifi,     cls: 'text-blue-600 dark:text-blue-400'       },
  MANUAL:    { label: 'Sesi aktif — Absen Manual',  Icon: BookOpen, cls: 'text-gray-500 dark:text-gray-400'       },
} as const

const STATUS_PERIZINAN_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING:            { label: 'Izin menunggu persetujuan', cls: 'text-amber-600 dark:text-amber-400'  },
  REVISION_REQUESTED: { label: 'Izin perlu direvisi',       cls: 'text-purple-600 dark:text-purple-400' },
  APPROVED:           { label: 'Izin disetujui',            cls: 'text-emerald-600 dark:text-emerald-400' },
}

export function JadwalSiswaCard({ item, onIzin, perizinanAktif }: Props) {
  const router = useRouter()

  const statusKey = (item.statusAbsensi in STATUS_MAP
    ? item.statusAbsensi
    : 'BELUM_ABSEN') as keyof typeof STATUS_MAP

  const { label: statusLabel, cls: statusCls, Icon: StatusIcon } = STATUS_MAP[statusKey]
  const modeCfg = item.modeSesi ? MODE_MAP[item.modeSesi] : null

  const sudahTercatat = ['HADIR', 'TERLAMBAT', 'SAKIT', 'IZIN', 'ALPA'].includes(
    item.statusAbsensi,
  )

  const sesiAktif  = item.statusSesi === 'AKTIF'
  const bisaScan   = sesiAktif && !sudahTercatat && item.modeSesi !== 'MANUAL'
  const showAction = bisaScan || !sudahTercatat

  // Cek perizinan aktif hari ini
  const hasPerizinanAktif = perizinanAktif &&
    ['PENDING', 'REVISION_REQUESTED', 'APPROVED'].includes(perizinanAktif.status)
  const perizinanCfg = perizinanAktif
    ? STATUS_PERIZINAN_LABEL[perizinanAktif.status]
    : null

  const handleScan = () => {
    router.push('/dashboard/absensi/scan-kamera')
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3 hover:shadow-sm transition-shadow">

      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white truncate">
            {item.namaMapel}
          </p>
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
      {sesiAktif && modeCfg && (
        <div className={'flex items-center gap-1.5 text-xs font-medium ' + modeCfg.cls}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <modeCfg.Icon size={12} />
          <span>{modeCfg.label}</span>
        </div>
      )}

      {/* Info perizinan aktif */}
      {hasPerizinanAktif && perizinanCfg && (
        <div className={[
          'flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg',
          perizinanAktif!.status === 'REVISION_REQUESTED'
            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
            : perizinanAktif!.status === 'APPROVED'
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
        ].join(' ')}>
          <FileCheck size={12} className="shrink-0" />
          <span className="flex-1">{perizinanCfg.label}</span>
          {perizinanAktif!.status === 'REVISION_REQUESTED' && (
            <button
              type="button"
              onClick={() => router.push('/dashboard/perizinan')}
              className="underline text-[10px] shrink-0"
            >
              Lihat
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      {showAction && (
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">

          {bisaScan && (
            <Button
              variant="primary" size="sm" className="w-full"
              leftIcon={<Camera size={14} />}
              onClick={handleScan}
            >
              Scan Absensi
            </Button>
          )}

          {sesiAktif && item.modeSesi === 'MANUAL' && !sudahTercatat && (
            <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs text-gray-500">
              <BookOpen size={12} />
              <span>Guru akan mengabsenkan kamu</span>
            </div>
          )}

          {/* Tombol izin — ganti berdasarkan status perizinan */}
          {hasPerizinanAktif && perizinanAktif!.status === 'PENDING' ? (
            <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-600 dark:text-amber-400">
              <FileCheck size={12} />
              <span>Izin sudah diajukan — menunggu persetujuan</span>
            </div>
          ) : hasPerizinanAktif && perizinanAktif!.status === 'REVISION_REQUESTED' ? (
            <Button
              variant="warning" size="sm" className="w-full"
              leftIcon={<RotateCcw size={14} />}
              onClick={() => router.push('/dashboard/perizinan')}
            >
              Perbarui Pengajuan Izin
            </Button>
          ) : hasPerizinanAktif && perizinanAktif!.status === 'APPROVED' ? (
            // Izin sudah approved — cek sisa hari
            (() => {
              const hariIni = new Date(); hariIni.setHours(0,0,0,0)
              const selesai = new Date(perizinanAktif!.tanggalSelesai); selesai.setHours(0,0,0,0)
              const sisa = Math.round((selesai.getTime() - hariIni.getTime()) / 86400000) + 1
              return sisa > 1 ? (
                <Button
                  variant="warning" size="sm" className="w-full"
                  leftIcon={<LogIn size={14} />}
                  onClick={() => router.push('/dashboard/perizinan')}
                >
                  Masuk Mulai Besok
                </Button>
              ) : null
            })()
          ) : !hasPerizinanAktif ? (
            !sudahTercatat && (
              <Button
                variant="outline" size="sm" className="w-full"
                onClick={onIzin}
              >
                Ajukan Izin / Sakit
              </Button>
            )
          ) : null}

        </div>
      )}
    </div>
  )
}
