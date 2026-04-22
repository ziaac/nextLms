'use client'

import { BookOpen, MapPin, User } from 'lucide-react'
import { groupByHari } from '@/lib/helpers/jadwal-normalize'
import type { JadwalMingguanResponse } from '@/types/jadwal-view.types'
import type { HariEnum } from '@/types/jadwal.types'

const HARI_LIST: HariEnum[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']
const HARI_LABEL: Record<HariEnum, string> = {
  SENIN: 'Senin', SELASA: 'Selasa', RABU: 'Rabu',
  KAMIS: 'Kamis', JUMAT: "Jum'at", SABTU: 'Sabtu',
}

interface Props {
  data:         JadwalMingguanResponse | undefined
  isLoading:    boolean
  selectedHari: HariEnum | 'ALL'
}

export function JadwalMingguanSiswaView({ data, isLoading, selectedHari }: Props) {
  if (isLoading) return <Skeleton />

  const items        = data?.data ?? []
  const grouped      = groupByHari(items)
  const allHariAktif = HARI_LIST.filter((h) => (grouped[h]?.length ?? 0) > 0)
  const hariAktif    = selectedHari === 'ALL'
    ? allHariAktif
    : allHariAktif.filter((h) => h === selectedHari)
  const totalJp      = data?.totalJp ?? 0

  if (allHariAktif.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <BookOpen className="h-8 w-8 text-gray-300" />
        </div>
        <p className="text-sm text-gray-500">Belum ada jadwal untuk semester ini</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Total JP</p>
          <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{totalJp} JP</p>
          <p className="text-[10px] text-gray-400">semester ini</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Hari Sekolah</p>
          <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{allHariAktif.length} hari</p>
          <p className="text-[10px] text-gray-400">per minggu</p>
        </div>
      </div>

      {hariAktif.length === 0 && selectedHari !== 'ALL' && (
        <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
          Tidak ada jadwal hari {HARI_LABEL[selectedHari as HariEnum]}
        </div>
      )}

      {hariAktif.map((hari) => (
        <div key={hari} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              {HARI_LABEL[hari]}
            </span>
            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {grouped[hari]?.length} pelajaran
            </span>
          </div>
          <div className="p-3 space-y-2">
            {grouped[hari]?.map((item, idx) => (
              <div key={item.id}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                <span className="text-[10px] font-bold text-gray-400 w-4 shrink-0 mt-0.5 text-center">{idx + 1}</span>
                <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{item.namaMapel}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {item.namaGuru && (
                        <div className="flex items-center gap-1">
                          <User className="h-2.5 w-2.5 text-gray-400" />
                          <span className="text-[10px] text-gray-500">{item.namaGuru}</span>
                        </div>
                      )}
                      {item.ruangan && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5 text-gray-400" />
                          <span className="text-[10px] text-gray-500">{item.ruangan}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-mono text-gray-700 dark:text-gray-200 leading-tight">{item.jamMulai}</p>
                    <p className="text-xs font-mono text-gray-400 leading-tight">{item.jamSelesai}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 gap-3">
        {[1,2].map((i) => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg" />)}
      </div>
      {[1,2,3,4].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="h-9 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />
          <div className="p-3 space-y-2">
            {[1,2,3].map((j) => <div key={j} className="h-12 bg-gray-50 dark:bg-gray-800 rounded-lg" />)}
          </div>
        </div>
      ))}
    </div>
  )
}
