'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket'

/**
 * Komponen ini mount setelah login, menghubungkan socket dan
 * mendengarkan event notifikasi realtime.
 * Tidak merender UI apapun.
 */
export function SocketInitializer() {
  const user = useAuthStore((s) => s.user)
  const { setSocket, incrementUnread } = useNotificationStore()

  useEffect(() => {
    if (!user) return

    const socket = connectSocket(user.id)
    setSocket(socket)

    socket.on('notifikasi:baru', () => {
      incrementUnread()
    })

    return () => {
      socket.off('notifikasi:baru')
      disconnectSocket()
      setSocket(null)
    }
  }, [user?.id])

  return null
}
