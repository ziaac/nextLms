'use client'

import {
  Camera, Wifi, BookOpen, Eye,
  CheckCircle2, AlertCircle, MinusCircle, Timer,
  Ban, PlayCircle, SwitchCamera,
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
  HADIR:       { label: 'Hadir',  cls: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400', Icon: CheckCircle2 },
  TERLAMBAT:   { label: 'Lambat', cls: 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400',    Icon: AlertCircle  },
  SAKIT:       { label: 'Sakit',  cls: 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',            Icon: MinusCircle  },
  IZIN:        { label: 'Izin',   cls: 'text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',    Icon: MinusCircle  },
  ALPA:        { label: 'Alpa',   cls: 'text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400',                Icon: AlertCircle  },
  BELUM_ABSEN: { label: 'Belum',  cls: 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400',             Icon: Timer        },
} as const

const MODE_MAP = {
  QR_LURING: { label: 'QR + GPS', Icon: Camera,   cls: 'text-emerald-600 dark:text-emerald-400' },
  QR_WFH:    { label: 'QR WFH',   Icon: Wifi,     cls: 'text-blue-600 dark:text-blue-400'       },
  MANUAL:    { label: 'Manual',   Icon: BookOpen, cls: 'text-gray-500 dark:text-gray-400'       },
} as const

function getSesiState(statusSesi: StatusSesi | null, isOngoing: boolean) {
  if (statusSesi === 'AKTIF')
    return { type: 'aktif' as const,   dotCls: 'bg-emerald-400 animate-pulse', textCls: 'text-emerald-600 dark:text-emerald-400', label: 'Sesi berjalan'      }
  if (statusSesi === 'SELESAI' || statusSesi === 'EXPIRED')
    return { type: 'selesai' as const, dotCls: 'bg-gray-300 dark:bg-gray-600', textCls: 'text-gray-400 dark:text-gray-500',       label: 'Sesi selesai'       }
  if (isOngoing && (!statusSesi || statusSesi === 'BELUM_BUKA'))
    return { type: 'ongoing' as const, dotCls: 'bg-blue-400 animate-pulse',   textCls: 'text-blue-600 dark:text-blue-400',       label: 'Jam sedang berlangsung' }
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

  const jamParts   = item.jam.split(/\s*[-–]\s*/)
  const jamMulai   = jamParts[0]?.trim() ?? item.jam
  const jamSelesai = jamParts[1]?.trim() ?? ''

  return (
    <div className={[
      'bg-white dark:bg-gray-900 rounded-xl border overflow-hidden transition-all',
      isSesiAktif
        ? 'border-emerald-200 dark:border-emerald-800 shadow-sm'
        : isSesiSelesai
        ? 'border-gray-200 dark:border-gray-700'
        : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm',
    ].join(' ')}>

      {/* ── Konten utama — layout sama dengan SlotCard ─────────── */}
      <div className="flex items-start gap-3 px-3.5 py-3">

        {/* Kiri */}
        <div className="flex-1 min-w-0">

          {/* Status + mode (badge kecil) */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className={'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ' + statusCls}>
              <StatusIcon size={8} />
              {statusLabel}
            </span>
            {modeCfg && isSesiAktif && (
              <span className={'inline-flex items-center gap-0.5 text-[10px] font-medium ' + modeCfg.cls}>
                <modeCfg.Icon size={9} />
                {modeCfg.label}
              </span>
            )}
          </div>

          {/* Nama mapel — muted, kecil */}
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate leading-snug">
            {item.namaMapel}
          </p>

          {/* Nama kelas — prominent */}
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate mt-0.5 leading-snug">
            {item.namaKelas ?? '—'}
          </p>

          {/* Sesi state indicator */}
          {sesiState.type !== 'idle' && (
            <div className={'flex items-center gap-1 mt-1.5 text-[10px] font-medium ' + sesiState.textCls}>
              <span className={'w-1.5 h-1.5 rounded-full flex-shrink-0 ' + sesiState.dotCls} />
              {sesiState.label}
            </div>
          )}
        </div>

        {/* Kanan: jam — persis seperti SlotCard */}
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

      {/* ── Tombol aksi ─────────────────────────────────────────── */}
      <div className="border-t border-gray-100 dark:border-gray-800 px-3.5 py-2.5 space-y-1.5">

        {/* AKTIF + MANUAL */}
        {isSesiAktif && isModeManual && (
          <>
            <Button variant="primary" size="sm" className="w-full" leftIcon={<BookOpen size={13} />} onClick={onKelolaAktif}>
              Absen Manual
            </Button>
            <Button variant="secondary" size="sm" className="w-full" leftIcon={<SwitchCamera size={12} />} onClick={onUbahMode}>
              Ubah Mode
            </Button>
          </>
        )}

        {/* AKTIF + QR */}
        {isSesiAktif && !isModeManual && (
          <>
            <Button variant="primary" size="sm" className="w-full" leftIcon={<Eye size={13} />} onClick={onKelolaAktif} disabled={!hasToken}>
              Kelola Sesi Aktif
            </Button>
            <Button variant="secondary" size="sm" className="w-full" leftIcon={<SwitchCamera size={12} />} onClick={onUbahMode}>
              Ubah Mode
            </Button>
          </>
        )}

        {/* SELESAI / EXPIRED */}
        {isSesiSelesai && (
          <Button variant="secondary" size="sm" className="w-full" leftIcon={<Eye size={12} />} onClick={onRekap}>
            Lihat Rekap
          </Button>
        )}

        {/* Belum ada sesi */}
        {!isSesiAktif && !isSesiSelesai && (
          canBukaSesi ? (
            <Button variant="secondary" size="sm" className="w-full" leftIcon={<PlayCircle size={13} />} onClick={onBukaSesi}>
              Buka Absensi
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-gray-400">
              <Ban size={10} /> Tidak dapat membuka sesi
            </div>
          )
        )}
      </div>
    </div>
  )
}
