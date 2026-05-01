import type { TipeKalender } from '@/types/enums'
import { formatTanggalKey } from '@/lib/helpers/timezone'

export type { TipeKalender }

export const TIPE_KALENDER_LABEL: Record<TipeKalender, string> = {
  LIBUR_NASIONAL:   'Libur Nasional',
  LIBUR_SEKOLAH:    'Libur Sekolah',
  UJIAN:            'Ujian',
  KEGIATAN_SEKOLAH: 'Kegiatan Sekolah',
  RAPAT:            'Rapat',
  LAINNYA:          'Lainnya',
}

// Warna badge per tipe — Tailwind class string
export const TIPE_KALENDER_COLOR: Record<TipeKalender, string> = {
  LIBUR_NASIONAL:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  LIBUR_SEKOLAH:    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  UJIAN:            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  KEGIATAN_SEKOLAH: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  RAPAT:            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  LAINNYA:          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

// Warna latar tanggal di grid kalender saat isLibur: true
export const LIBUR_BG_COLOR = 'bg-red-50 dark:bg-red-950/20'

export interface KalenderAkademik {
  id:             string
  tahunAjaranId:  string
  semesterId:     string | null
  tanggal:        string          // ISO date string (YYYY-MM-DD)
  tanggalSelesai: string | null   // ISO date string (YYYY-MM-DD)
  judul:          string
  deskripsi:      string | null
  tipe:           TipeKalender
  isLibur:        boolean
  createdBy:      string
  createdAt:      string
  updatedAt:      string
  tahunAjaran:    { nama: string }
  semester:       { nama: string } | null
  creator:        {
    id:      string
    profile: { namaLengkap: string } | null
  }
}

export interface CreateKalenderAkademikDto {
  tahunAjaranId:   string
  semesterId?:     string
  tanggal:         string          // YYYY-MM-DD
  tanggalSelesai?: string          // YYYY-MM-DD
  judul:           string          // maks 200 karakter
  deskripsi?:      string
  tipe:            TipeKalender
  isLibur?:        boolean
}

export type UpdateKalenderAkademikDto = Partial<CreateKalenderAkademikDto>

export interface QueryKalenderBulan {
  tahunAjaranId: string
  bulan:         number           // 1-12
  tahun:         number           // e.g. 2025
}

export interface QueryKalenderTahunAjaran {
  tahunAjaranId: string
  semesterId?:   string
}

export interface BulkCreateKalenderDto {
  items: CreateKalenderAkademikDto[]
}

/**
 * Mengembalikan class warna latar untuk sel tanggal di grid kalender.
 * Jika event memiliki isLibur: true, kembalikan warna libur.
 */
export function getKalenderDayBgColor(events: KalenderAkademik[]): string {
  const hasLibur = events.some((e) => e.isLibur)
  return hasLibur ? LIBUR_BG_COLOR : ''
}

/**
 * Mengekspansi event multi-hari menjadi array tanggal (YYYY-MM-DD).
 * Digunakan untuk menentukan hari mana saja yang dicakup oleh event.
 */
export function expandEventRange(
  event: Pick<KalenderAkademik, 'tanggal' | 'tanggalSelesai'>
): string[] {
  const start = new Date(event.tanggal)
  const end = event.tanggalSelesai ? new Date(event.tanggalSelesai) : new Date(event.tanggal)
  const dates: string[] = []
  const current = new Date(start)
  while (current <= end) {
    dates.push(formatTanggalKey(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}
