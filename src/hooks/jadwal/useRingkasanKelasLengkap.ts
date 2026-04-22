import { useQuery } from '@tanstack/react-query'
import { getRingkasanKelasLengkap, type FilterRingkasanLengkapParams }
  from '@/lib/api/jadwal-ringkasan.api'

export const ringkasanLengkapKeys = {
  list: (params: FilterRingkasanLengkapParams) =>
    ['jadwal', 'ringkasan-lengkap', params] as const,
}

export function useRingkasanKelasLengkap(
  params: FilterRingkasanLengkapParams | null,
) {
  return useQuery({
    queryKey: ringkasanLengkapKeys.list(
      params ?? { semesterId: '' },
    ),
    queryFn:        () => getRingkasanKelasLengkap(params!),
    enabled:        !!params?.semesterId,
    staleTime:      0,
    refetchOnMount: 'always',
  })
}
