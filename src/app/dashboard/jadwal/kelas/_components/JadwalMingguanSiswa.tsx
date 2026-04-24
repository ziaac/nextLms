'use client'

import { BookOpen, MapPin, User, Clock, GraduationCap } from 'lucide-react'
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

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Clock className="h-4 w-4 text-emerald-500" />}
          label="Total JP" value={totalJp + ' JP'} sub="semester ini"
        />
        <StatCard
          icon={<BookOpen className="h-4 w-4 text-blue-500" />}
          label="Hari Sekolah" value={allHariAktif.length + ' hari'} sub="per minggu"
        />
        <StatCard
          icon={<GraduationCap className="h-4 w-4 text-purple-500" />}
          label="Mata Pelajaran" value={new Set(items.map((i) => i.namaMapel)).size + ' mapel'} sub="per minggu"
        />
      </div>

      {hariAktif.length === 0 && selectedHari !== 'ALL' && (
        <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
          Tidak ada jadwal hari {HARI_LABEL[selectedHari as HariEnum]}
        </div>
      )}

      {hariAktif.map((hari) => {
        const slots = grouped[hari] ?? []
        return (
          <div key={hari} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Day header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {HARI_LABEL[hari]}
              </span>
              <span className="text-[10px] text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-full">
                {slots.length} pelajaran
              </span>
            </div>
            {/* Slots grid — 1 col mobile, 2 tablet, 3 desktop */}
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {slots.map((item) => <SlotCard key={item.id} item={item} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Slot Card (siswa) ─────────────────────────────────────────────────────────
function SlotCard({ item }: { item: JadwalMingguanItem }) {
  return (
    <div className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm transition-all">
      {/* Kiri: konten */}
      <div className="flex-1 min-w-0">
        {/* Nama mapel — prominent (bagi siswa, mapel adalah info utama) */}
        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate leading-snug">
          {item.namaMapel}
        </p>
        {/* Guru — muted */}
        {item.namaGuru && (
          <div className="flex items-center gap-1 mt-0.5">
            <User className="h-2.5 w-2.5 text-gray-400 shrink-0" />
            <span className="text-[10px] text-gray-400 truncate">{item.namaGuru}</span>
          </div>
        )}
        {/* Ruangan */}
        {item.ruangan ? (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="h-2.5 w-2.5 text-gray-400 shrink-0" />
            <span className="text-[10px] text-gray-400 truncate">{item.ruangan}</span>
          </div>
        ) : (
          <div className="mt-0.5 h-3.5" />
        )}
      </div>
      {/* Kanan: jam */}
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

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string; sub: string
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{value}</p>
      <p className="text-[10px] text-gray-400">{sub}</p>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
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
