import api from '@/lib/axios'
import type { RingkasanKelasItem } from '@/types/jadwal.types'

export interface FilterRingkasanLengkapParams {
  semesterId:     string
  tingkatKelasId?: string
}

/**
 * GET /jadwal-pelajaran/ringkasan-kelas-lengkap
 * Mengembalikan SEMUA kelas pada TA dari semesterId,
 * termasuk kelas yang belum punya jadwal (totalJam=0).
 */
export async function getRingkasanKelasLengkap(
  params: FilterRingkasanLengkapParams,
): Promise<RingkasanKelasItem[]> {
  const { data } = await api.get<RingkasanKelasItem[]>(
    '/jadwal-pelajaran/ringkasan-kelas-lengkap',
    { params },
  )
  return data
}
