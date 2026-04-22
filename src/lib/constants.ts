export const API_URL = process.env.NEXT_PUBLIC_API_URL!
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL!
export const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL!
export const TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE ?? 'Asia/Makassar'
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'LMS MAN 2 Kota Makassar'
export const APP_SHORT_NAME = process.env.NEXT_PUBLIC_APP_SHORT_NAME ?? 'LMS MAN 2'

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 10

/**
 * Akses file public MinIO.
 * Jika fotoUrl sudah berupa full URL (http/https), kembalikan langsung.
 * Jika berupa key saja, gabungkan dengan STORAGE_URL.
 */
export const getPublicFileUrl = (urlOrKey: string): string => {
  if (!urlOrKey) return ''
  if (urlOrKey.startsWith('http')) return urlOrKey
  return `${STORAGE_URL}/lms-public/${urlOrKey}`
}
