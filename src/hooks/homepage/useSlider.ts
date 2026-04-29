'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sliderApi } from '@/lib/api/homepage.api'
import type { CreateSliderDto, UpdateSliderDto, ReorderItem } from '@/types/homepage.types'

export const sliderKeys = {
  list: (onlyActive?: boolean) => ['homepage', 'slider', { onlyActive }] as const,
}

export function useSliderList(onlyActive = false) {
  return useQuery({
    queryKey: sliderKeys.list(onlyActive),
    queryFn:  () => sliderApi.list(onlyActive),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateSlider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateSliderDto) => sliderApi.create(dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['homepage', 'slider'] }),
  })
}

export function useUpdateSlider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSliderDto }) =>
      sliderApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['homepage', 'slider'] }),
  })
}

export function useReorderSlider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (items: ReorderItem[]) => sliderApi.reorder(items),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['homepage', 'slider'] }),
  })
}

export function useDeleteSlider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sliderApi.remove(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['homepage', 'slider'] }),
  })
}
