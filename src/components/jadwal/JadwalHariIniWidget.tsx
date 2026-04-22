'use client'

import { Clock, MapPin, Radio, Users, User } from 'lucide-react'
import { useJadwalHariIni } from '@/hooks/jadwal/useJadwalView'

interface Props {
  semesterId: string
  label?:     string
}

interface Item {
  id:           string
  jam:          string
  namaMapel:    string
  infoTambahan: string
  ruangan:      string
  isOngoing:    boolean
}

function normalize(raw: Record<string, unknown>): Item {
  const jamMulai   = (raw['jamMulai']  as string) ?? ''
  const jamSelesai = (raw['jamSelesai'] as string) ?? ''

  // ruangan "-" dari backend = tidak ada ruangan
  const ruanganRaw = raw['ruangan'] as string | null | undefined
  const ruangan    = (!ruanganRaw || ruanganRaw === '-') ? '' : ruanganRaw

  // info tambahan: namaKelas (guru) | namaGuru (siswa)
  const infoTambahan = (raw['namaKelas'] as string)
    ?? (raw['namaGuru']  as string)
    ?? ''

  // isOngoing dari backend (otomatis false saat jam lewat)
  const isOngoing = Boolean(raw['isOngoing'])

  return {
    id:           String(raw['id'] ?? ''),
    jam:          jamMulai + ' – ' + jamSelesai,
    namaMapel:    (raw['namaMapel'] as string) ?? '—',
    infoTambahan,
    ruangan,
    isOngoing,
  }
}

export function JadwalHariIniWidget({ semesterId, label = 'Jadwal' }: Props) {
  const { data: rawData, isLoading } = useJadwalHariIni(semesterId)

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse space-y-3">
        <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
        {[1,2,3].map((i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />)}
      </div>
    )
  }

  const rawArr = Array.isArray(rawData) ? rawData as Record<string, unknown>[] : []
  const items  = rawArr.map(normalize)
  const ongoing  = items.find((i) => i.isOngoing)
  const upcoming = items.filter((i) => !i.isOngoing)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{label} Hari Ini</p>
          <p className="text-[10px] text-gray-400 capitalize">{today}</p>
        </div>
        <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
          {items.length} sesi
        </span>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-gray-400">Tidak ada jadwal hari ini</p>
          <p className="text-xs text-gray-300 mt-1">Selamat beristirahat...</p>
        </div>
      ) : (
        <div className="p-3 space-y-2">
          {ongoing && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Sedang Berlangsung
                </span>
              </div>
              <ItemRow item={ongoing} />
            </div>
          )}
          {upcoming.map((item) => (
            <div key={item.id} className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 p-3">
              <ItemRow item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ItemRow({ item }: { item: Item }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{item.namaMapel}</p>
        {item.infoTambahan && (
          <div className="flex items-center gap-1 mt-0.5">
            <Users className="h-2.5 w-2.5 text-gray-400 shrink-0" />
            <span className="text-[10px] text-gray-500 truncate">{item.infoTambahan}</span>
          </div>
        )}
        {item.ruangan && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="h-2.5 w-2.5 text-gray-400 shrink-0" />
            <span className="text-[10px] text-gray-400 truncate">{item.ruangan}</span>
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <div className="flex items-center gap-1 justify-end">
          <Clock className="h-2.5 w-2.5 text-gray-400" />
          <span className="text-[10px] font-mono font-semibold text-gray-700 dark:text-gray-300">
            {item.jam.split(' – ')[0]}
          </span>
        </div>
        <p className="text-[10px] font-mono text-gray-400">{item.jam.split(' – ')[1]}</p>
      </div>
    </div>
  )
}
