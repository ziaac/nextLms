import { TIMEZONE } from '../constants'

/**
 * Format tanggal ke locale Indonesia dengan timezone dari setting aplikasi.
 * Default: Asia/Makassar (WITA). Dapat dikonfigurasi via NEXT_PUBLIC_TIMEZONE.
 */
export const formatTanggal = (
  date: string | Date,
  opts?: Intl.DateTimeFormatOptions,
): string =>
  new Intl.DateTimeFormat('id-ID', { timeZone: TIMEZONE, ...opts }).format(
    new Date(date),
  )


export const formatTanggalLengkap = (date: string | Date): string =>
  formatTanggal(date, { dateStyle: 'full', timeStyle: 'short' })

export const formatTanggalSaja = (date: string | Date): string =>
  formatTanggal(date, { dateStyle: 'long' })

export const formatWaktu = (date: string | Date): string =>
  formatTanggal(date, { timeStyle: 'short' })

export const formatTanggalPendek = (date: string | Date): string =>
  formatTanggal(date, { dateStyle: 'medium' })

/** Cek apakah tanggal sudah lewat */
export const isPast = (date: string | Date): boolean =>
  new Date(date) < new Date()

/** Cek apakah tanggal hari ini */
export const isToday = (date: string | Date): boolean => {
  const d = new Date(date)
  const now = new Date()
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
}

/**
 * Format jam dari DateTime string atau time string
 * Input: "1970-01-01T07:30:00.000Z" atau "07:30:00" atau "07:30"
 * Output: "07:30"
 */
export function formatJam(val: string | null | undefined): string {
  if (!val) return '--:--'
  // Jika ISO datetime — ambil jam UTC
  if (val.includes('T')) {
    const d = new Date(val)
    const h = String(d.getUTCHours()).padStart(2, '0')
    const m = String(d.getUTCMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }
  // Jika sudah format HH:MM:SS atau HH:MM
  return val.slice(0, 5)
}

// export function formatJam(isoString: string): string {
//   if (!isoString) return '-'
//   const d = new Date(isoString)
//   return d.toLocaleTimeString('id-ID', {
//     hour:   '2-digit',
//     minute: '2-digit',
//     timeZone: 'UTC',  // ← wajib UTC karena tanggalnya epoch
//   })
//   // Output: "07.30"
// }

// Untuk format lengkap dengan hari:
export function formatHariJam(hari: string, jamMulai: string): string {
  const hariMap: Record<string, string> = {
    SENIN: 'Sen', SELASA: 'Sel', RABU: 'Rab',
    KAMIS: 'Kam', JUMAT: 'Jum', SABTU: 'Sab', MINGGU: 'Min',
  }
  return `${hariMap[hari] ?? hari} ${formatJam(jamMulai)}`
  // Output: "Sen 07.30"
}
