import api from '@/lib/axios'
import type {
  NotifikasiItem,
  NotifikasiListResponse,
  NotifikasiQueryParams,
  UnreadCountResponse,
  MarkAsReadResponse,
  ClearReadResponse,
  BroadcastPayload,
} from '@/types/notifikasi.types'

export const getNotifikasi = (params: NotifikasiQueryParams) =>
  api
    .get<NotifikasiListResponse>('/notifikasi', { params })
    .then((r) => r.data)

export const getUnreadCount = () =>
  api.get<UnreadCountResponse>('/notifikasi/unread-count').then((r) => r.data)

export const markAsRead = (id: string) =>
  api
    .patch<NotifikasiItem>(`/notifikasi/${id}/read`, {})
    .then((r) => r.data)

export const markAllAsRead = () =>
  api
    .patch<MarkAsReadResponse>('/notifikasi/read-all', {})
    .then((r) => r.data)

export const removeNotifikasi = (id: string) =>
  api.delete<{ message: string }>(`/notifikasi/${id}`).then((r) => r.data)

export const clearReadNotifikasi = () =>
  api
    .delete<ClearReadResponse>('/notifikasi/clear-read')
    .then((r) => r.data)

export const broadcastNotifikasi = (payload: BroadcastPayload) =>
  api
    .post<{ message: string; count: number }>('/notifikasi/broadcast', payload)
    .then((r) => r.data)
