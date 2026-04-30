import type { TipeNotifikasi } from '@/types/enums'

export function getTipeIcon(tipe: TipeNotifikasi): string {
  const icons: Record<TipeNotifikasi, string> = {
    INFO:           'ℹ️',
    TUGAS:          '📚',
    PENILAIAN:      '📊',
    PEMBAYARAN:     '💳',
    ABSENSI:        '📋',
    PENGUMUMAN:     '📢',
    SIKAP:          '⭐',
    PERIZINAN:      '📝',
    EKSTRAKURIKULER:'🏆',
    SISTEM:         '🔔',
  }
  return icons[tipe] ?? '🔔'
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
