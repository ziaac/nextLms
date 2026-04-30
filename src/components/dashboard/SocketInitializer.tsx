'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket'
import { getUnreadCount } from '@/lib/api/notifikasi.api'
import { queryClient } from '@/lib/query-client'
import { notifikasiKeys } from '@/hooks/notifikasi'
import type { NotifikasiBaru } from '@/types/notifikasi.types'

/**
 * Komponen ini mount setelah login, menghubungkan socket dan
 * mendengarkan event notifikasi realtime.
 * Tidak merender UI apapun.
 */
export function SocketInitializer() {
  const user = useAuthStore((s) => s.user)
  const { setSocket, setUnreadCount, incrementUnread } = useNotificationStore()
  const pathname = usePathname()

  useEffect(() => {
    if (!user) return

    // Fetch unread count dari API saat mount (sebelum socket connect)
    getUnreadCount()
      .then((data) => setUnreadCount(data.count))
      .catch(() => {
        // Silent fail — socket tetap connect meskipun fetch gagal
      })

    const socket = connectSocket(user.id)
    setSocket(socket)

    const handleNotifikasiBaru = (data: NotifikasiBaru) => {
      const isOnNotifikasiPage = pathname === '/dashboard/notifikasi'

      if (isOnNotifikasiPage) {
        // Di halaman notifikasi: invalidate list agar auto-refresh, tapi jangan increment badge
        queryClient.invalidateQueries({ queryKey: notifikasiKeys.lists })
      } else {
        // Di halaman lain: increment badge
        incrementUnread()
      }

      // Tampilkan toast notifikasi realtime
      toast(data.judul, {
        description: data.pesan,
        duration: 5000,
        action: data.actionUrl
          ? {
              label: 'Lihat',
              onClick: () => {
                window.location.href = data.actionUrl as string
              },
            }
          : undefined,
      })
    }

    socket.on('notifikasi:baru', handleNotifikasiBaru)

    return () => {
      socket.off('notifikasi:baru', handleNotifikasiBaru)
      disconnectSocket()
      setSocket(null)
    }
  }, [user?.id])

  return null
}
