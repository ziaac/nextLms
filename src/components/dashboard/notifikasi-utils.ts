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

/**
 * Normalisasi actionUrl dari notifikasi lama yang mungkin punya format URL yang salah.
 * Contoh: notifikasi PENGUMUMAN lama menyimpan `/pengumuman/:id` (halaman publik, 404 untuk user login)
 * seharusnya `/dashboard/announcement?detail=:id`.
 */
export function resolveNotifikasiUrl(
  actionUrl: string | null,
  tipe: TipeNotifikasi,
  referenceId: string | null,
): string | null {
  if (!actionUrl) return null

  // Perbaiki URL lama pengumuman: /pengumuman/:id → /dashboard/announcement?detail=:id
  const pengumumanLama = actionUrl.match(/^\/pengumuman\/([a-f0-9-]+)$/)
  if (pengumumanLama) {
    const id = referenceId ?? pengumumanLama[1]
    return `/dashboard/announcement?detail=${id}`
  }

  return actionUrl
}
