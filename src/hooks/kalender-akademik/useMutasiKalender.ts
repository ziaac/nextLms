import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { kalenderAkademikApi } from '@/lib/api/kalender-akademik.api'
import type { CreateKalenderAkademikDto, UpdateKalenderAkademikDto, BulkCreateKalenderDto } from '@/types/kalender-akademik.types'
import { kalenderKeys } from './useKalenderAkademik'

export function useCreateKalender() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateKalenderAkademikDto) => kalenderAkademikApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kalenderKeys.all })
      toast.success('Event kalender berhasil ditambahkan')
    },
  })
}

export function useUpdateKalender() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateKalenderAkademikDto }) =>
      kalenderAkademikApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kalenderKeys.all })
      toast.success('Event kalender berhasil diperbarui')
    },
  })
}

export function useDeleteKalender() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => kalenderAkademikApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kalenderKeys.all })
      toast.success('Event kalender berhasil dihapus')
    },
  })
}

export function useBulkCreateKalender() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: BulkCreateKalenderDto) => kalenderAkademikApi.bulkCreate(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kalenderKeys.all })
      toast.success('Event kalender berhasil diimpor')
    },
  })
}
