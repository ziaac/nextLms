'use client'

import { Clock, BookOpen, Camera, Wifi, CheckCircle2, AlertCircle, Timer, Ban } from 'lucide-react'
import { Spinner }              from '@/components/ui/Spinner'
import { EmptyState }           from '@/components/ui/EmptyState'
import { useJadwalHariIniWali } from '@/hooks/absensi/useWaliKelas'

interface Props {
  kelasId:    string
  semesterId: string
}

const STATUS_SESI_CFG: Record<string, { label: string; dot: string; text: string }> = {
  AKTIF:      { label: 'Sesi aktif',    dot: 'bg-emerald-400 animate-pulse', text: 'text-emerald-600 dark:text-emerald-400' },
  SELESAI:    { label: 'Sesi selesai',  dot: 'bg-gray-400',                  text: 'text-gray-500'                          },
  EXPIRED:    { label: 'Sesi berakhir', dot: 'bg-red-400',                   text: 'text-red-500'                           },
  DITUTUP:    { label: 'Ditutup',       dot: 'bg-gray-400',                  text: 'text-gray-500'                          },
  BELUM_BUKA: { label: 'Belum dibuka',  dot: 'bg-gray-300',                  text: 'text-gray-400'                          },
}

const MODE_ICON: Record<string, React.ElementType> = {
  QR_LURING: Camera,
  QR_WFH:    Wifi,
  MANUAL:    BookOpen,
}

export function RekapHarianTab({ kelasId, semesterId }: Props) {
  const { data, isLoading } = useJadwalHariIniWali(semesterId || null, kelasId || null)

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Spinner /></div>
  }

  if (!data || data.data.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen size={22} />}
        title="Tidak ada jadwal hari ini"
        description="Tidak ada jadwal pelajaran untuk kelas ini hari ini."
      />
    )
  }

  return (
    <div className="space-y-3">

      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="font-medium text-gray-900 dark:text-white">{data.namaKelas}</span>
        <span>·</span>
        <span>{data.hari}</span>
        <span>·</span>
        <span>{data.totalJadwal} jadwal</span>
      </div>

      {/* Grid jadwal — 1 col mobile, 2 col sm, 3 col lg, 4 col xl */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {data.data.map((item) => {
          const sesiCfg     = item.statusSesi
            ? (STATUS_SESI_CFG[item.statusSesi] ?? STATUS_SESI_CFG['BELUM_BUKA'])
            : STATUS_SESI_CFG['BELUM_BUKA']
          const isSesiAktif = item.statusSesi === 'AKTIF'
          const isSesiDone  = item.statusSesi === 'SELESAI' || item.statusSesi === 'EXPIRED'
          const ModeIcon    = item.modeSesi ? (MODE_ICON[item.modeSesi] ?? null) : null

          // Jam alert logic
          const alertNode = (() => {
            if (isSesiAktif) return (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={10} />
                <span>Guru sudah membuka</span>
              </span>
            )
            if (!isSesiDone && item.isOngoing) return (
              <span className="inline-flex items-center gap-1 text-orange-500">
                <AlertCircle size={10} />
                <span>Sesi belum dibuka</span>
              </span>
            )
            if (!item.isOngoing && (!item.statusSesi || item.statusSesi === 'BELUM_BUKA')) {
              const [endH, endM] = (item.jam.split('-')[1] ?? '').split(':').map(Number)
              const now    = new Date()
              const nowMin = now.getHours() * 60 + now.getMinutes()
              const endMin = (endH ?? 0) * 60 + (endM ?? 0)
              return nowMin > endMin ? (
                <span className="inline-flex items-center gap-1 text-gray-400">
                  <Ban size={10} />
                  <span>Tidak dibuka</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-gray-400">
                  <Timer size={10} />
                  <span>Belum waktunya</span>
                </span>
              )
            }
            return null
          })()

          return (
            <div
              key={item.jadwalId}
              className={[
                'bg-white dark:bg-gray-900 rounded-xl border p-3 space-y-2 transition-shadow hover:shadow-sm',
                isSesiAktif ? 'border-emerald-200 dark:border-emerald-800'
                  : isSesiDone ? 'border-gray-100 dark:border-gray-800/60'
                  : 'border-gray-200 dark:border-gray-800',
              ].join(' ')}
            >
              {/* Top: namaMapel + jam */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-snug truncate">
                    {item.namaMapel}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">{item.namaGuru}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold font-mono text-gray-700 dark:text-gray-200 leading-tight tabular-nums">
                    {item.jam.split(/[-–]/)[0]?.trim()}
                  </p>
                  <p className="text-[10px] font-mono text-gray-400 leading-tight tabular-nums">
                    {item.jam.split(/[-–]/)[1]?.trim()}
                  </p>
                </div>
              </div>

              {/* Status sesi */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-2 space-y-1">
                <div className={'flex items-center gap-1.5 text-[10px] font-medium ' + sesiCfg.text}>
                  <span className={'w-1.5 h-1.5 rounded-full flex-shrink-0 ' + sesiCfg.dot} />
                  {ModeIcon && isSesiAktif && <ModeIcon size={10} />}
                  <span>{sesiCfg.label}</span>
                </div>
                {alertNode && (
                  <div className="text-[10px] font-medium text-gray-500 pl-3">
                    {alertNode}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
