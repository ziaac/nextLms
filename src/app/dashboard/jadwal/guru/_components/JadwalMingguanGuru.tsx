'use client'

import { BookOpen, MapPin, Users, Clock } from 'lucide-react'
import { groupByHari } from '@/lib/helpers/jadwal-normalize'
import type { JadwalMingguanResponse, JadwalMingguanItem } from '@/types/jadwal-view.types'
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
  hideStats?:   boolean
}

export function JadwalMingguanGuruView({ data, isLoading, selectedHari, hideStats }: Props) {
  if (isLoading) return <Skeleton />

  const items        = data?.data ?? []
  const grouped      = groupByHari(items)
  const allHariAktif = HARI_LIST.filter((h) => (grouped[h]?.length ?? 0) > 0)
  const hariAktif    = selectedHari === 'ALL'
    ? allHariAktif
    : allHariAktif.filter((h) => h === selectedHari)

  const totalJp     = data?.totalJp ?? 0
  const uniqueKelas = new Set(items.map((i) => i.namaKelas).filter(Boolean)).size

  if (allHariAktif.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <BookOpen className="h-8 w-8 text-gray-300" />
        </div>
        <p className="text-sm text-gray-500">Belum ada jadwal mengajar semester ini</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats — ditampilkan jika tidak pakai sidebar (hideStats=false) */}
      {!hideStats && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Clock className="h-4 w-4 text-emerald-500" />}
            label="Total JP" value={totalJp + ' JP'} sub="semester ini"
          />
          <StatCard
            icon={<BookOpen className="h-4 w-4 text-blue-500" />}
            label="Hari Mengajar" value={allHariAktif.length + ' hari'} sub="per minggu"
          />
          <StatCard
            icon={<Users className="h-4 w-4 text-purple-500" />}
            label="Kelas" value={uniqueKelas + ' kelas'} sub="diajarkan"
          />
        </div>
      )}

      {hariAktif.length === 0 && selectedHari !== 'ALL' && (
        <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
          Tidak ada jadwal hari {HARI_LABEL[selectedHari as HariEnum]}
        </div>
      )}

      {/* Jadwal per hari */}
      {hariAktif.map((hari) => {
        const slots = grouped[hari] ?? []
        const totalJpHari = slots.reduce((s, i) => s + i.jpSesi, 0)

        return (
          <div
            key={hari}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Day header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {HARI_LABEL[hari]}
              </span>
              <span className="text-[10px] text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-full">
                {totalJpHari} JP · {slots.length} sesi
              </span>
            </div>

            {/* Slots — 1 col mobile, 2 col tablet, 3 col desktop */}
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {slots.map((item) => (
                <SlotCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Slot Card ────────────────────────────────────────────────────────
function SlotCard({ item }: { item: JadwalMingguanItem }) {
  return (
    <div className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm transition-all">

      {/* Kiri: konten */}
      <div className="flex-1 min-w-0">
        {/* Nama mapel — kecil, muted */}
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate leading-snug">
          {item.namaMapel}
        </p>
        {/* Nama kelas — prominent */}
        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate mt-0.5 leading-snug">
          {item.namaKelas}
        </p>
        {/* Ruangan */}
        {item.ruangan ? (
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="h-2.5 w-2.5 text-gray-400 shrink-0" />
            <span className="text-[10px] text-gray-400 truncate">{item.ruangan}</span>
          </div>
        ) : (
          <div className="mt-1 h-3.5" />
        )}
      </div>

      {/* Kanan: jam — seperti clock di kalender */}
      <div className="text-right shrink-0 pt-0.5">
        <p className="text-lg font-bold font-mono text-gray-700 dark:text-gray-200 leading-tight tabular-nums">
          {item.jamMulai}
        </p>
        <p className="text-sm font-mono text-gray-400 leading-tight tabular-nums">
          {item.jamSelesai}
        </p>
      </div>
    </div>
  )
}

// ── Stat card (dipakai saat tidak pakai sidebar) ─────────────────────
function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string; sub: string
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center gap-2 mb-1">{icon}
        <span className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{value}</p>
      <p className="text-[10px] text-gray-400">{sub}</p>
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="h-9 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />
          <div className="p-3 space-y-2">
            {[1, 2].map((j) => (
              <div key={j} className="flex items-start gap-3 px-3.5 py-3 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-4/5" />
                  <div className="h-2.5 bg-gray-50 dark:bg-gray-800/50 rounded w-1/2" />
                </div>
                <div className="space-y-1 text-right">
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-12" />
                  <div className="h-3 bg-gray-50 dark:bg-gray-800/50 rounded w-10 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
