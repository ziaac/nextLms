import { create } from 'zustand'
import type { Socket } from 'socket.io-client'

interface NotificationState {
  unreadCount: number
  socket: Socket | null

  setSocket: (socket: Socket | null) => void
  setUnreadCount: (count: number) => void
  incrementUnread: () => void
  resetUnread: () => void
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  unreadCount: 0,
  socket: null,

  setSocket: (socket) => set({ socket }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  resetUnread: () => set({ unreadCount: 0 }),
}))
