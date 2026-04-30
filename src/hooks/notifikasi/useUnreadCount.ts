import { useQuery } from '@tanstack/react-query'
import { getUnreadCount } from '@/lib/api/notifikasi.api'
import { useNotificationStore } from '@/stores/notification.store'
import { notifikasiKeys } from './useNotifikasi'

export function useUnreadCount() {
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)

  return useQuery({
    queryKey: notifikasiKeys.unreadCount,
    queryFn:  async () => {
      const data = await getUnreadCount()
      setUnreadCount(data.count)
      return data
    },
    staleTime: 1000 * 30, // 30 detik
  })
}
