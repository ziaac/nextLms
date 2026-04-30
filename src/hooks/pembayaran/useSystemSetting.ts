import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SystemSetting } from '@/types/pembayaran.types'

// ─── Query Keys ───────────────────────────────────────────────────

const settingKeys = {
  all: ['settings'] as const,
  public: () => [...settingKeys.all, 'public'] as const,
  admin: () => [...settingKeys.all, 'all'] as const,
}

// ─── Queries ──────────────────────────────────────────────────────

export function usePublicSettings() {
  return useQuery({
    queryKey: settingKeys.public(),
    queryFn: async (): Promise<SystemSetting[]> => {
      const response = await api.get<SystemSetting[]>('/settings/public')
      return response.data
    },
  })
}

export function useAllSettings() {
  return useQuery({
    queryKey: settingKeys.admin(),
    queryFn: async (): Promise<SystemSetting[]> => {
      const response = await api.get<SystemSetting[]>('/settings')
      return response.data
    },
  })
}

// ─── Mutations ────────────────────────────────────────────────────

export function useUpdateSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      key,
      value,
    }: {
      key: string
      value: string
    }): Promise<SystemSetting> => {
      const response = await api.patch<SystemSetting>(`/settings/${key}`, {
        value,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingKeys.all })
    },
  })
}
