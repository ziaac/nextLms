import type { TipeNotifikasi } from '@/types/enums'

// Menggunakan logo MAN 2 Makassar sebagai icon default
const DEFAULT_ICON = 'https://storagelms.man2kotamakassar.sch.id/static-assets/static_logoman-50.png'

export function getTipeIcon(tipe: TipeNotifikasi): string {
  // Semua tipe notifikasi menggunakan logo MAN 2 Makassar
  return DEFAULT_ICON
}

export function getTipeLabel(tipe: TipeNotifikasi): string {
  const labels: Record<TipeNotifikasi, string> = {
    INFO:           'Info',
    TUGAS:          'Tugas',
    PENILAIAN:      'Penilaian',
    PEMBAYARAN:     'Pembayaran',
    ABSENSI:        'Absensi',
    PENGUMUMAN:     'Pengumuman',
    SIKAP:          'Sikap',
    PERIZINAN:      'Perizinan',
    EKSTRAKURIKULER:'Ekstrakurikuler',
    SISTEM:         'Sistem',
  }
  return labels[tipe] ?? tipe
}
