import api from '@/lib/axios'
import type { SiswaPerKelasItem } from '@/types/perizinan.types'

export const getSiswaPerKelas = (
  kelasId:    string,
  semesterId: string,
): Promise<SiswaPerKelasItem[]> =>
  api
    .get<SiswaPerKelasItem[]>(`/absensi-report/kelas/${kelasId}`, {
      params: { semesterId },
    })
    .then((r) => r.data)
