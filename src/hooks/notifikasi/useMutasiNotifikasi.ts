import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  markAsRead,
  markAllAsRead,
  removeNotifikasi,
  clearReadNotifikasi,
} from '@/lib/api/notifikasi.api'
import { useNotificationStore } from '@/stores/notification.store'
import { notifikasiKeys } from './useNotifikasi'

// ── useMarkAsRead ─────────────────────────────────────────────────────────────
export function useMarkAsRead() {
  const qc = useQueryClient()
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)

  return useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: notifikasiKeys.all })
      // Sync unread count ke store setelah invalidate
      const data = await qc.fetchQuery({
        queryKey: notifikasiKeys.unreadCount,
        queryFn: () => import('@/lib/api/notifikasi.api').then((m) => m.getUnreadCount()),
        staleTime: 0,
      })
      setUnreadCount(data.count)
    },
  })
}

// ── useMarkAllAsRead ──────────────────────────────────────────────────────────
export function useMarkAllAsRead() {
  const qc = useQueryClient()
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)

  return useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: notifikasiKeys.all })
      setUnreadCount(0)
    },
  })
}

// ── useRemoveNotifikasi ───────────────────────────────────────────────────────
export function useRemoveNotifikasi() {
  const qc = useQueryClient()
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)

  return useMutation({
    mutationFn: (id: string) => removeNotifikasi(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: notifikasiKeys.all })
      const data = await qc.fetchQuery({
        queryKey: notifikasiKeys.unreadCount,
        queryFn: () => import('@/lib/api/notifikasi.api').then((m) => m.getUnreadCount()),
        staleTime: 0,
      })
      setUnreadCount(data.count)
    },
  })
}

// ── useClearReadNotifikasi ────────────────────────────────────────────────────
export function useClearReadNotifikasi() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: () => clearReadNotifikasi(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notifikasiKeys.all })
      // Unread count tidak berubah saat clear-read (hanya hapus yang sudah dibaca)
    },
  })
}
