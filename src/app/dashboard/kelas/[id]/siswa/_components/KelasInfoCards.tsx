'use client'

import { BookOpen, UserCheck, DoorOpen, GraduationCap } from 'lucide-react'
import { Skeleton } from '@/components/ui'
import { StatusSiswa } from '@/types/kelas.types'
import type { Kelas, KelasSiswa } from '@/types/kelas.types'

interface Props { kelas: Kelas | null; siswaList: KelasSiswa[] }

export function KelasInfoCards({ kelas, siswaList }: Props) {
  const aktif  = siswaList.filter((s) => s.status === StatusSiswa.AKTIF).length
  const pindah = siswaList.filter((s) => s.status === StatusSiswa.PINDAH).length
  const keluar = siswaList.filter((s) => [StatusSiswa.KELUAR, StatusSiswa.DO, StatusSiswa.MENGUNDURKAN_DIRI].includes(s.status)).length
  const lulus  = siswaList.filter((s) => s.status === StatusSiswa.LULUS).length

  if (!kelas) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
    </div>
  )

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <InfoCard icon={<BookOpen className="h-4 w-4" />} label="Kelas" value={kelas.namaKelas} sub={kelas.waliKelas?.profile.namaLengkap ?? 'Belum ada wali kelas'} color="emerald" />
      <InfoCard icon={<UserCheck className="h-4 w-4" />} label="Siswa Aktif" value={String(aktif)} sub={`dari ${kelas.kuotaMaksimal} kuota`} color="blue" />
      <InfoCard icon={<DoorOpen className="h-4 w-4" />} label="Pindah / Keluar" value={String(pindah + keluar)} sub={`${pindah} pindah · ${keluar} keluar`} color="yellow" />
      <InfoCard icon={<GraduationCap className="h-4 w-4" />} label="Lulus" value={String(lulus)} sub="Seluruh masa aktif" color="purple" />
    </div>
  )
}

type Color = 'emerald' | 'blue' | 'yellow' | 'purple'
const colorCls: Record<Color, { bg: string; icon: string; value: string }> = {
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400', value: 'text-emerald-700 dark:text-emerald-300' },
  blue:    { bg: 'bg-blue-50 dark:bg-blue-900/20',       icon: 'text-blue-600 dark:text-blue-400',       value: 'text-blue-700 dark:text-blue-300' },
  yellow:  { bg: 'bg-yellow-50 dark:bg-yellow-900/20',   icon: 'text-yellow-600 dark:text-yellow-400',   value: 'text-yellow-700 dark:text-yellow-300' },
  purple:  { bg: 'bg-purple-50 dark:bg-purple-900/20',   icon: 'text-purple-600 dark:text-purple-400',   value: 'text-purple-700 dark:text-purple-300' },
}

function InfoCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: Color }) {
  const cls = colorCls[color]
  return (
    <div className={`rounded-lg p-4 flex flex-col gap-1 ${cls.bg}`}>
      <div className={`flex items-center gap-1.5 text-xs font-medium ${cls.icon}`}>{icon}{label}</div>
      <p className={`text-xl font-bold ${cls.value}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{sub}</p>
    </div>
  )
}
