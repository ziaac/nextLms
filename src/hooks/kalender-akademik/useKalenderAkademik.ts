import { useQuery } from '@tanstack/react-query'
import { kalenderAkademikApi } from '@/lib/api/kalender-akademik.api'
import type { QueryKalenderBulan, QueryKalenderTahunAjaran } from '@/types/kalender-akademik.types'

export const kalenderKeys = {
  all:         ['kalender-akademik']                                          as const,
  bulan:       (params: QueryKalenderBulan) =>
                 ['kalender-akademik', 'bulan', params]                       as const,
  tahunAjaran: (params: QueryKalenderTahunAjaran) =>
                 ['kalender-akademik', 'tahun-ajaran', params]                as const,
  detail:      (id: string) => ['kalender-akademik', 'detail', id]           as const,
}

export function useKalenderBulan(params: QueryKalenderBulan) {
  return useQuery({
    queryKey: kalenderKeys.bulan(params),
    queryFn:  () => kalenderAkademikApi.getByBulan(params),
    enabled:  !!params.tahunAjaranId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useKalenderTahunAjaran(params: QueryKalenderTahunAjaran) {
  return useQuery({
    queryKey: kalenderKeys.tahunAjaran(params),
    queryFn:  () => kalenderAkademikApi.getByTahunAjaran(params),
    enabled:  !!params.tahunAjaranId,
    staleTime: 5 * 60 * 1000,
  })
}
