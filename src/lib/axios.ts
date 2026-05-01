import axios from 'axios'
import { API_URL } from './constants'
import { useAuthStore, getStoredAccessToken } from '@/stores/auth.store'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor ───────────────────────────────────────
api.interceptors.request.use((config) => {
  // Coba dari zustand store dulu, fallback ke sessionStorage
  const token =
    useAuthStore.getState().accessToken ?? getStoredAccessToken()

  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor: auto-refresh saat 401 ───────────────
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: string) => void
  reject: (reason: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        })

        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken)
        processQueue(null, data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch (err) {
        processQueue(err, null)
        useAuthStore.getState().logout()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api

/**
 * Instance axios untuk endpoint publik (tanpa auth header / interceptor token).
 * Gunakan ini untuk endpoint yang tidak memerlukan autentikasi.
 */
export const apiPublic = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})
