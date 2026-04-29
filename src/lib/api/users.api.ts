import api from '@/lib/axios'
import type { PaginatedResponse, PaginationParams } from '@/types'
import type { UserItem, UserDetail, CreateUserDto, UpdateUserDto } from '@/types/users.types'

export interface UsersParams extends PaginationParams {
  role?: string
  tahunMasuk?: number
}

export const usersApi = {
  getAll: async (params?: UsersParams): Promise<PaginatedResponse<UserItem>> => {
    const { data } = await api.get('/users', { params })
    return data
  },

  getById: async (id: string): Promise<UserDetail> => {
    const { data } = await api.get(`/users/${id}`)
    return data
  },

  /** GET /users/by-role/:role — list user tanpa pagination by role */
  getByRole: async (role: string): Promise<UserDetail[]> => {
    const { data } = await api.get(`/users/by-role/${role}`)
    return data
  },

  create: async (dto: CreateUserDto): Promise<UserDetail> => {
    const { data } = await api.post('/users', dto)
    return data
  },

  update: async (id: string, dto: UpdateUserDto): Promise<UserDetail> => {
    const { data } = await api.put(`/users/${id}`, dto)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`)
  },

  toggleActive: async (id: string): Promise<UserDetail> => {
    const { data } = await api.patch(`/users/${id}/toggle-active`, {})
    return data
  },

  /** PATCH /users/me/profile — update profil sendiri (semua role) */
  updateMe: async (dto: UpdateUserDto): Promise<UserDetail> => {
    const { data } = await api.patch('/users/me/profile', dto)
    return data
  },

  updateFoto: async (id: string, fotoUrl: string): Promise<void> => {
    await api.patch(`/users/${id}/foto`, { fotoUrl })
  },
  resetPassword: async (id: string, newPassword: string): Promise<void> => {
    await api.patch(`/users/${id}/reset-password`, { newPassword })
  },
  updateTandaTanganById: (id: string, tandaTanganKey: string) =>
    api.patch(`/users/${id}/tanda-tangan`, { tandaTanganKey }).then((r) => r.data),
}
