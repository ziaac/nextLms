import { useQuery } from '@tanstack/react-query'
import { getNotifikasi } from '@/lib/api/notifikasi.api'
import type { NotifikasiQueryParams } from '@/types/notifikasi.types'

// ── Query Key Factory ─────────────────────────────────────────────────────────
export const notifikasiKeys = {
  all:         ['notifikasi']                                          as const,
  lists:       ['notifikasi', 'list']                                  as const,
  list:        (params: NotifikasiQueryParams) =>
                 ['notifikasi', 'list', params]                        as const,
  unreadCount: ['notifikasi', 'unread-count']                          as const,
}

// ── useNotifikasi ─────────────────────────────────────────────────────────────
export function useNotifikasi(params: NotifikasiQueryParams) {
  return useQuery({
    queryKey: notifikasiKeys.list(params),
    queryFn:  () => getNotifikasi(params),
    staleTime: 0,
  })
}
