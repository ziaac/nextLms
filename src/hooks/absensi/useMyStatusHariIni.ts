import { useQuery } from '@tanstack/react-query'
import { getMyStatusHariIni } from '@/lib/api/absensi.api'
import { useSemesterActive }  from '@/hooks/semester/useSemester'

export const myStatusKeys = {
  hariIni: (semesterId: string) =>
    ['absensi', 'my-status-hari-ini', semesterId] as const,
}

/**
 * @param overrideSemesterId - Jika diisi, pakai semester ini.
 *   Jika kosong, fallback ke semester aktif dari useSemesterActive.
 */
export function useMyStatusHariIni(overrideSemesterId?: string) {
  const { data: semesters } = useSemesterActive()
  const activeSemester = semesters?.find((s) => s.isActive) ?? semesters?.[0]

  // Prioritas: override → aktif → kosong
  const semesterId = overrideSemesterId || activeSemester?.id || ''

  const query = useQuery({
    queryKey: myStatusKeys.hariIni(semesterId),
    queryFn:  () => getMyStatusHariIni(semesterId),
    enabled:  !!semesterId,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })

  return {
    ...query,
    semesterId,
    aktiveSemesterNama: activeSemester?.nama ?? '',
    isWaliKelas: query.data?.isWaliKelas ?? false,
    kelasWali:   query.data?.kelasWali   ?? [],
    jadwalList:  query.data?.data        ?? [],
  }
}
