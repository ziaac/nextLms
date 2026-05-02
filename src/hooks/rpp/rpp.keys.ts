import type { RppFilterParams } from '@/types/rpp.types'

export const rppKeys = {
  all:    ['rpp'] as const,
  lists:  () => [...rppKeys.all, 'list'] as const,
  list:   (filters: RppFilterParams) => [...rppKeys.lists(), filters] as const,
  detail: (id: string) => [...rppKeys.all, id] as const,
}
