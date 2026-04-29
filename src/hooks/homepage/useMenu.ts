'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { menuApi } from '@/lib/api/homepage.api'
import type { CreateMenuDto, UpdateMenuDto, ReorderItem } from '@/types/homepage.types'

export const menuKeys = {
  list: (onlyActive?: boolean) => ['homepage', 'menu', { onlyActive }] as const,
}

export function useMenuList(onlyActive = false) {
  return useQuery({
    queryKey: menuKeys.list(onlyActive),
    queryFn:  () => menuApi.list(onlyActive),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateMenu() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateMenuDto) => menuApi.create(dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['homepage', 'menu'] }),
  })
}

export function useUpdateMenu() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMenuDto }) =>
      menuApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['homepage', 'menu'] }),
  })
}

export function useReorderMenu() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (items: ReorderItem[]) => menuApi.reorder(items),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['homepage', 'menu'] }),
  })
}

export function useDeleteMenu() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => menuApi.remove(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['homepage', 'menu'] }),
  })
}
