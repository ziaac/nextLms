/**
 * Helper untuk sync auth state ke cookie
 * agar Next.js middleware (server-side) bisa membacanya.
 */

const COOKIE_NAME = 'lms-auth'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 hari

export function setAuthCookie(state: {
  isAuthenticated: boolean
  user: { role: string } | null
}) {
  if (typeof document === 'undefined') return
  const value = encodeURIComponent(JSON.stringify({ state }))
  document.cookie = [
    `${COOKIE_NAME}=${value}`,
    `path=/`,
    `max-age=${COOKIE_MAX_AGE}`,
    `SameSite=Lax`,
    // Uncomment di production jika pakai HTTPS:
    // `Secure`,
  ].join('; ')
}

export function clearAuthCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`
}
