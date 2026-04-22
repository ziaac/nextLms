import { useQuery } from '@tanstack/react-query'
import { jadwalWaliApi } from '@/lib/api/jadwal-wali.api'

export function useJadwalKelasWali(semesterId: string | null) {
  return useQuery({
    queryKey:  ['jadwal-wali', 'kelas', semesterId],
    queryFn:   () => jadwalWaliApi.getKelasWaliMingguan(semesterId!),
    enabled:   !!semesterId,
    staleTime: 0,
  })
}
