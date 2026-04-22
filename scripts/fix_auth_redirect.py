"""
FIX — Login berhasil tapi tidak redirect ke dashboard
Root cause: middleware membaca cookie, tapi auth state hanya di localStorage

Solusi: setelah setAuth, tulis juga cookie 'lms-auth' agar middleware bisa baca

Cara pakai:
  python scripts/fix_auth_redirect.py
"""

import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

files = {}

# ============================================================
# src/lib/cookie.ts  — helper set/clear cookie
# ============================================================

files["src/lib/cookie.ts"] = """\
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
"""

# ============================================================
# src/stores/auth.store.ts  — sync ke cookie saat setAuth/logout
# ============================================================

files["src/stores/auth.store.ts"] = """\
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthUser } from '@/types'
import { setAuthCookie, clearAuthCookie } from '@/lib/cookie'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean

  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        if (!user?.id) {
          console.error('[authStore] user tidak valid:', user)
          return
        }
        // Sync ke cookie agar middleware bisa baca
        setAuthCookie({ isAuthenticated: true, user: { role: user.role } })
        set({ user, accessToken, refreshToken, isAuthenticated: true })
      },

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setUser: (user) => {
        setAuthCookie({ isAuthenticated: true, user: { role: user.role } })
        set({ user })
      },

      logout: () => {
        clearAuthCookie()
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'lms-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
"""

# ============================================================
# src/hooks/useAuth.ts  — pastikan urutan: setAuth → push
# ============================================================

files["src/hooks/useAuth.ts"] = """\
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import { clearAuthCookie } from '@/lib/cookie'
import { getErrorMessage } from '@/lib/utils'
import type { LoginDto } from '@/types'

export function useAuth() {
  const router = useRouter()
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

      // 3. Redirect — pakai window.location agar middleware
      //    membaca cookie yang baru ditulis
      window.location.href = '/dashboard'
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
"""

# ============================================================
# WRITE
# ============================================================

def write_files(files_dict, base):
    for path, content in files_dict.items():
        full = os.path.join(base, path.replace("/", os.sep))
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  ✅ {path}")
    print("""
🎉 Fix selesai!

Langkah:
  1. Hapus localStorage lama:
     DevTools → Application → Local Storage → Clear All
  2. Hapus cookie lama:
     DevTools → Application → Cookies → Clear All
  3. npm run dev  (tidak perlu restart jika sudah jalan)
  4. Login ulang → seharusnya redirect ke /dashboard
""")

if __name__ == "__main__":
    print("🔧 Fix auth redirect — sync localStorage ke cookie untuk middleware\n")
    write_files(files, BASE)