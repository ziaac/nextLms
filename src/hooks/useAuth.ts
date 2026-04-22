'use client'
import { useState } from 'react'
import { authApi } from '@/lib/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import { clearAuthCookie } from '@/lib/cookie'
import { getErrorMessage } from '@/lib/utils'
import type { LoginDto } from '@/types'

export function useAuth() {
  const { setAuth, logout: storeLogout, user, isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (dto: LoginDto) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await authApi.login(dto)
      if (!res?.user?.id) throw new Error('Response login tidak valid')

      // 1. Simpan ke store + cookie
      setAuth(res.user, res.accessToken, res.refreshToken)

      // 2. Connect socket
      connectSocket(res.user.id)

      // 3. Baca ?redirect= dari URL — fallback ke /dashboard
      //    Pakai window.location.search karena useSearchParams tidak tersedia
      //    di konteks ini (dipanggil dari form, bukan page)
      const params   = new URLSearchParams(window.location.search)
      const rawRedirect = params.get('redirect') ?? '/dashboard'

      // Keamanan: hanya izinkan relative path (cegah open-redirect)
      const safePath = rawRedirect.startsWith('/') ? rawRedirect : '/dashboard'

      // Pakai window.location.href agar middleware baca cookie yang baru ditulis
      window.location.href = safePath
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    } finally {
      disconnectSocket()
      clearAuthCookie()
      storeLogout()
      window.location.href = '/login'
    }
  }

  return { login, logout, isLoading, error, user, isAuthenticated }
}
