import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function getErrorMessage(error: unknown): string {
  const data = (error as any)?.response?.data
  if (data) {
    const msg = data.message
    if (Array.isArray(msg)) return msg.join(', ')
    if (typeof msg === 'string') return msg
    if (typeof data.error === 'string') return data.error
  }
  if (error instanceof Error) return error.message
  return 'Terjadi kesalahan yang tidak diketahui'
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

/** Ambil 2 inisial dari nama — safe jika undefined/null */
export function getInitials(name?: string | null): string {
  if (!name) return '?'
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

/**
 * Format ISO date string ke format lokal Indonesia (WITA)
 * Contoh: "2025-07-15T00:00:00.000Z" → "15 Jul 2025"
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '-'
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('id-ID', {
    day:      'numeric',
    month:    'short',
    year:     'numeric',
    timeZone: 'Asia/Makassar',
  })
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
