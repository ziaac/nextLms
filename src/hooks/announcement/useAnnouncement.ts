import { useQuery } from '@tanstack/react-query'
import { announcementApi } from '@/lib/api/announcement.api'
import type { QueryAnnouncementDto } from '@/types/announcement.types'

export const announcementKeys = {
  all:    ['announcement']                                                    as const,
  lists:  ['announcement', 'list']                                            as const,
  list:   (params?: QueryAnnouncementDto) =>
            ['announcement', 'list', params ?? {}]                            as const,
  admin:  (params?: QueryAnnouncementDto) =>
            ['announcement', 'admin', params ?? {}]                           as const,
  detail: (id: string) => ['announcement', 'detail', id]                     as const,
}

export function useAnnouncements(params?: QueryAnnouncementDto) {
  return useQuery({
    queryKey: announcementKeys.list(params),
    queryFn:  () => announcementApi.getAll(params),
    staleTime: 0,
  })
}

export function useAnnouncementsAdmin(params?: QueryAnnouncementDto) {
  return useQuery({
    queryKey: announcementKeys.admin(params),
    queryFn:  () => announcementApi.getAllAdmin(params),
    staleTime: 0,
  })
}

export function useAnnouncementDetail(id: string | null) {
  return useQuery({
    queryKey: announcementKeys.detail(id ?? ''),
    queryFn:  () => announcementApi.getOne(id!),
    enabled:  !!id,
    staleTime: 5 * 60 * 1000,
  })
}
