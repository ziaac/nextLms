import api from '@/lib/axios'
import type { LoginDto, LoginResponse, RefreshResponse } from '@/types'

export const authApi = {
  login: async (dto: LoginDto): Promise<LoginResponse> => {
    const res = await api.post('/auth/login', dto)
    return res.data as LoginResponse
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },

  logoutAll: async (): Promise<void> => {
    await api.post('/auth/logout-all')
  },

  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const { data } = await api.post<RefreshResponse>('/auth/refresh', {
      refreshToken,
    })
    return data
  },
}
