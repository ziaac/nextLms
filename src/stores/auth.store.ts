import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthUser } from '@/types'
import { setAuthCookie, clearAuthCookie } from '@/lib/cookie'

// ── sessionStorage key untuk accessToken ─────────────────────
// Tidak dipersist ke localStorage karena security,
// tapi perlu survive di tab yang sama.
const ACCESS_TOKEN_KEY = 'lms-access-token'

export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

function saveAccessToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
  else sessionStorage.removeItem(ACCESS_TOKEN_KEY)
}

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
        saveAccessToken(accessToken)
        setAuthCookie({ isAuthenticated: true, user: { role: user.role } })
        set({ user, accessToken, refreshToken, isAuthenticated: true })
      },

      setTokens: (accessToken, refreshToken) => {
        saveAccessToken(accessToken)
        set({ accessToken, refreshToken })
      },

      setUser: (user) => {
        setAuthCookie({ isAuthenticated: true, user: { role: user.role } })
        set({ user })
      },

      logout: () => {
        saveAccessToken(null)
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
        // accessToken TIDAK dipersist ke localStorage
      }),
      // Setelah rehydrate dari localStorage, restore accessToken
      // dari sessionStorage jika ada
      onRehydrateStorage: () => (state) => {
        if (state) {
          const token = getStoredAccessToken()
          if (token) state.accessToken = token
        }
      },
    },
  ),
)
