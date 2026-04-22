import { useQuery } from '@tanstack/react-query'
import {
  getMyRiwayatAbsensi,
  getAbsensiDetailSemester,
  type MyRiwayatQuery,
} from '@/lib/api/absensi.api'

export { type MyRiwayatQuery }

export const rekapSiswaKeys = {
  riwayat:        (q: MyRiwayatQuery) =>
    ['absensi', 'my-riwayat', q] as const,
  detailSemester: (siswaId: string, semesterId: string) =>
    ['absensi', 'detail-semester', siswaId, semesterId] as const,
}

/**
 * GET /absensi/my/riwayat
 * Backend auto-lock userId ke siswa yang sedang login — tidak perlu kirim siswaId.
 * Untuk admin/guru, gunakan getAbsensiHistory('/absensi') dengan param userId.
 */
export function useMyRiwayatAbsensi(query: MyRiwayatQuery) {
  return useQuery({
    queryKey: rekapSiswaKeys.riwayat(query),
    queryFn:  () => getMyRiwayatAbsensi(query),
    staleTime: 1000 * 60,
    placeholderData: (prev) => prev,
  })
}

export function useAbsensiDetailSemester(
  siswaId: string | null,
  semesterId: string | null,
) {
  return useQuery({
    queryKey: rekapSiswaKeys.detailSemester(siswaId ?? '', semesterId ?? ''),
    queryFn:  () => getAbsensiDetailSemester(siswaId!, semesterId!),
    enabled:  !!siswaId && !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}
