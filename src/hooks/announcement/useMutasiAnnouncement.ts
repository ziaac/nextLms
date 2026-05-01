import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { announcementApi } from '@/lib/api/announcement.api'
import type { CreateAnnouncementDto, UpdateAnnouncementDto } from '@/types/announcement.types'
import { announcementKeys } from './useAnnouncement'

export function useCreateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateAnnouncementDto) => announcementApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: announcementKeys.lists })
      toast.success('Pengumuman berhasil dibuat')
    },
  })
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAnnouncementDto }) =>
      announcementApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: announcementKeys.lists })
      toast.success('Pengumuman berhasil diperbarui')
    },
  })
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => announcementApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: announcementKeys.lists })
      toast.success('Pengumuman berhasil dihapus')
    },
  })
}
