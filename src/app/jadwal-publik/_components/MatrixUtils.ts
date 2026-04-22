import type { HariEnum } from '@/types/jadwal.types'

export const HARI_LIST: HariEnum[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']

export const HARI_LABEL: Record<HariEnum, string> = {
  SENIN:  'Senin',
  SELASA: 'Selasa',
  RABU:   'Rabu',
  KAMIS:  'Kamis',
  JUMAT:  "Jum'at",
  SABTU:  'Sabtu',
}

// Warna konsisten per nama mapel (hash-based)
const CELL_PALETTES = [
  { bg: 'bg-emerald-50  dark:bg-emerald-950/40', border: 'border-emerald-200  dark:border-emerald-800',  title: 'text-emerald-800  dark:text-emerald-300', sub: 'text-emerald-600  dark:text-emerald-400', dot: 'bg-emerald-400'  },
  { bg: 'bg-blue-50     dark:bg-blue-950/40',    border: 'border-blue-200     dark:border-blue-800',     title: 'text-blue-800     dark:text-blue-300',    sub: 'text-blue-600     dark:text-blue-400',    dot: 'bg-blue-400'    },
  { bg: 'bg-violet-50   dark:bg-violet-950/40',  border: 'border-violet-200   dark:border-violet-800',   title: 'text-violet-800   dark:text-violet-300',  sub: 'text-violet-600   dark:text-violet-400',  dot: 'bg-violet-400'  },
  { bg: 'bg-amber-50    dark:bg-amber-950/40',   border: 'border-amber-200    dark:border-amber-800',    title: 'text-amber-800    dark:text-amber-300',   sub: 'text-amber-600    dark:text-amber-400',   dot: 'bg-amber-400'   },
  { bg: 'bg-rose-50     dark:bg-rose-950/40',    border: 'border-rose-200     dark:border-rose-800',     title: 'text-rose-800     dark:text-rose-300',    sub: 'text-rose-600     dark:text-rose-400',    dot: 'bg-rose-400'    },
  { bg: 'bg-indigo-50   dark:bg-indigo-950/40',  border: 'border-indigo-200   dark:border-indigo-800',   title: 'text-indigo-800   dark:text-indigo-300',  sub: 'text-indigo-600   dark:text-indigo-400',  dot: 'bg-indigo-400'  },
  { bg: 'bg-teal-50     dark:bg-teal-950/40',    border: 'border-teal-200     dark:border-teal-800',     title: 'text-teal-800     dark:text-teal-300',    sub: 'text-teal-600     dark:text-teal-400',    dot: 'bg-teal-400'    },
  { bg: 'bg-orange-50   dark:bg-orange-950/40',  border: 'border-orange-200   dark:border-orange-800',   title: 'text-orange-800   dark:text-orange-300',  sub: 'text-orange-600   dark:text-orange-400',  dot: 'bg-orange-400'  },
  { bg: 'bg-pink-50     dark:bg-pink-950/40',    border: 'border-pink-200     dark:border-pink-800',     title: 'text-pink-800     dark:text-pink-300',    sub: 'text-pink-600     dark:text-pink-400',    dot: 'bg-pink-400'    },
  { bg: 'bg-cyan-50     dark:bg-cyan-950/40',    border: 'border-cyan-200     dark:border-cyan-800',     title: 'text-cyan-800     dark:text-cyan-300',    sub: 'text-cyan-600     dark:text-cyan-400',    dot: 'bg-cyan-400'    },
]

export function getMapelPalette(nama: string) {
  let hash = 0
  for (let i = 0; i < nama.length; i++) hash = (hash * 31 + nama.charCodeAt(i)) & 0x7fffffff
  return CELL_PALETTES[hash % CELL_PALETTES.length]
}

/** Kumpulkan semua slot waktu unik dari seluruh hari, sorted ascending */
export function collectTimeSlots(roster: Record<string, { jamMulai: string; jamSelesai: string }[]>): string[] {
  const set = new Set<string>()
  for (const items of Object.values(roster)) {
    for (const item of items) set.add(item.jamMulai)
  }
  return Array.from(set).sort()
}

/** Hari mana saja yang punya jadwal (untuk skip SABTU kalau kosong) */
export function getActiveHari(roster: Record<string, unknown[]>): HariEnum[] {
  return HARI_LIST.filter((h) => (roster[h]?.length ?? 0) > 0)
}
