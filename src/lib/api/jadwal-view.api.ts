import api from '@/lib/axios'
import type { JadwalMingguanResponse } from '@/types/jadwal-view.types'

export const jadwalViewApi = {
  getMyMingguan: async (semesterId: string): Promise<JadwalMingguanResponse> => {
    const { data } = await api.get('/jadwal-pelajaran/my/mingguan', { params: { semesterId } })
    return data
  },

  getKelasMingguan: async (kelasId: string, semesterId: string): Promise<JadwalMingguanResponse> => {
    const { data } = await api.get('/jadwal-pelajaran/kelas/' + kelasId + '/mingguan', { params: { semesterId } })
    return data
  },

  getHariIni: async (semesterId: string): Promise<unknown[]> => {
    const { data } = await api.get('/jadwal-pelajaran/my/hari-ini', { params: { semesterId } })
    // Response: { totalJp, data: [...] } atau flat array
    if (Array.isArray(data)) return data
    if (data?.data && Array.isArray(data.data)) return data.data
    return []
  },

  exportGuru: async (guruId: string, semesterId: string): Promise<Blob> => {
    const { data } = await api.get('/jadwal-pelajaran/export/guru/' + guruId, {
      params: { semesterId }, responseType: 'blob',
    })
    return data as Blob
  },

  // Export untuk siswa/wali kelas — backend resolve kelasId dari token
  exportMy: async (semesterId: string): Promise<Blob> => {
    const { data } = await api.get('/jadwal-pelajaran/export/my/export', {
      params: { semesterId }, responseType: 'blob',
    })
    return data as Blob
  },

  exportKelas: async (kelasId: string, semesterId: string): Promise<Blob> => {
    const { data } = await api.get('/jadwal-pelajaran/export/kelas/' + kelasId, {
      params: { semesterId }, responseType: 'blob',
    })
    return data as Blob
  },
}
