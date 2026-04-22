import api from '@/lib/axios'
import type { KelasWali } from '@/types/jadwal-wali.types'

export const jadwalWaliApi = {
  getKelasWaliMingguan: async (semesterId: string): Promise<KelasWali[]> => {
    const { data } = await api.get('/jadwal-pelajaran/my/kelas-wali/mingguan', {
      params: { semesterId },
    })
    return Array.isArray(data) ? data : (data?.data ?? [])
  },
}
