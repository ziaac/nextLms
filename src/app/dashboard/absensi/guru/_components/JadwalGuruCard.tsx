'use client'

import {
  Camera, Wifi, BookOpen, Eye,
  CheckCircle2, AlertCircle, MinusCircle, Timer,
  RefreshCw, Ban, PlayCircle, SwitchCamera,
} from 'lucide-react'
import { Button }                from '@/components/ui/Button'
import type { AbsensiStatusItem } from '@/types'
import type { StatusSesi }        from '@/types/enums'

interface Props {
  item:              AbsensiStatusItem
  isActivelyManaged: boolean
  canBukaSesi?:      boolean
  onBukaSesi:        () => void
  onKelolaAktif:     () => void
  onPerpanjang:      () => void
  onUbahMode:        () => void
  onRekap?:          () => void
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

function getSesiState(statusSesi: StatusSesi | null, isOngoing: boolean) {
  if (statusSesi === 'AKTIF') {
    return { type: 'aktif' as const,   dotCls: 'bg-emerald-400 animate-pulse', textCls: 'text-emerald-600 dark:text-emerald-400', label: 'Sesi sedang berjalan' }
  }
  if (statusSesi === 'SELESAI' || statusSesi === 'EXPIRED') {
    return { type: 'selesai' as const, dotCls: 'bg-red-400',                   textCls: 'text-red-500 dark:text-red-400',         label: 'Sesi telah berakhir'  }
  }
  if (isOngoing && (!statusSesi || statusSesi === 'BELUM_BUKA')) {
    return { type: 'ongoing' as const, dotCls: 'bg-blue-400 animate-pulse',    textCls: 'text-blue-600 dark:text-blue-400',       label: 'Jam pelajaran berlangsung' }
  }
  return { type: 'idle' as const, dotCls: '', textCls: '', label: '' }
}

export function JadwalGuruCard({
  item, isActivelyManaged, canBukaSesi = true,
  onBukaSesi, onKelolaAktif, onPerpanjang, onUbahMode, onRekap,
}: Props) {
  const statusKey = (item.statusAbsensi in STATUS_MAP
    ? item.statusAbsensi : 'BELUM_ABSEN') as keyof typeof STATUS_MAP

  const { label: statusLabel, cls: statusCls, Icon: StatusIcon } = STATUS_MAP[statusKey]
  const modeCfg   = item.modeSesi ? MODE_MAP[item.modeSesi] : null
  const sesiState = getSesiState(item.statusSesi, item.isOngoing)

  const isSesiAktif   = item.statusSesi === 'AKTIF'
  const isSesiSelesai = item.statusSesi === 'SELESAI' || item.statusSesi === 'EXPIRED'
  const isModeManual  = item.modeSesi === 'MANUAL'
  const hasToken      = !!item.tokenSesi

  // Parse "07:00-07:45" → jamMulai / jamSelesai
  const jamParts  = item.jam.split(/\s*[-–]\s*/)
  const jamMulai  = jamParts[0]?.trim() ?? item.jam
  const jamSelesai = jamParts[1]?.trim() ?? ''

  return (
    <div className={[
      'bg-white dark:bg-gray-900 rounded-2xl border p-4 space-y-3 transition-shadow hover:shadow-sm',
      isSesiAktif   ? 'border-emerald-200 dark:border-emerald-800' :
      isSesiSelesai ? 'border-red-200 dark:border-red-900/40' :
                      'border-gray-200 dark:border-gray-800',
    ].join(' ')}>

      {/* Header: status badge kiri, jam kanan */}
      <div className="flex items-start justify-between gap-3">

        {/* Kiri: status + info */}
        <div className="min-w-0 flex-1 space-y-1">
          <span className={'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ' + statusCls}>
            <StatusIcon size={10} />
            {statusLabel}
          </span>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate leading-snug">
            {item.namaMapel}
          </p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate leading-snug">
            {item.namaKelas ?? '—'}
          </p>
        </div>

        {/* Kanan: jam */}
        <div className="text-right shrink-0 pt-0.5">
          <p className="text-lg font-bold font-mono text-gray-700 dark:text-gray-200 leading-tight tabular-nums">
            {jamMulai}
          </p>
          {jamSelesai && (
            <p className="text-sm font-mono text-gray-400 leading-tight tabular-nums">
              {jamSelesai}
            </p>
          )}
        </div>
      </div>

      {/* Sesi state indicator */}
      {sesiState.type !== 'idle' && (
        <div className={'flex items-center gap-1.5 text-xs font-medium ' + sesiState.textCls}>
          <span className={'w-1.5 h-1.5 rounded-full flex-shrink-0 ' + sesiState.dotCls} />
          {modeCfg && isSesiAktif && <modeCfg.Icon size={12} />}
          {isSesiSelesai && <Ban size={12} />}
          <span>{sesiState.label}</span>
          {isSesiAktif && modeCfg && (
            <span className="text-gray-400 font-normal">— {modeCfg.label}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">

        {/* AKTIF + MANUAL: Absen Manual + Ubah Mode */}
        {isSesiAktif && isModeManual && (
          <>
            <Button
              variant="primary" size="sm" className="w-full"
              leftIcon={<BookOpen size={14} />}
              onClick={onKelolaAktif}
            >
              Absen Manual
            </Button>
            <Button
              variant="secondary" size="sm" className="w-full"
              leftIcon={<SwitchCamera size={13} />}
              onClick={onUbahMode}
            >
              Ubah Mode Absensi
            </Button>
          </>
        )}

        {/* AKTIF + QR: Kelola Sesi + Ubah Mode */}
        {isSesiAktif && !isModeManual && (
          <>
            <Button
              variant="primary" size="sm" className="w-full"
              leftIcon={<Eye size={14} />}
              onClick={onKelolaAktif}
              disabled={!hasToken}
            >
              Kelola Sesi Aktif
            </Button>
            <Button
              variant="secondary" size="sm" className="w-full"
              leftIcon={<SwitchCamera size={13} />}
              onClick={onUbahMode}
            >
              Ubah Mode Absensi
            </Button>
          </>
        )}

        {/* SELESAI / EXPIRED */}
        {isSesiSelesai && (
          <Button
            variant="secondary" size="sm" className="w-full"
            leftIcon={<Eye size={13} />}
            onClick={onRekap}
          >
            Lihat Rekap Absensi
          </Button>
        )}

        {/* Belum ada sesi */}
        {!isSesiAktif && !isSesiSelesai && (
          canBukaSesi ? (
            <Button
              variant="secondary" size="sm" className="w-full"
              leftIcon={<PlayCircle size={14} />}
              onClick={onBukaSesi}
            >
              Buka Absensi
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs text-gray-400">
              <Ban size={12} />
              Tidak dapat membuka sesi
            </div>
          )
        )}
      </div>
    </div>
  )
}
