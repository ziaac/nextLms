import api from '@/lib/axios'
import type { PaginatedResponse } from '@/types/api.types'
import type {
  Tagihan,
  CreateTagihanDto,
  BulkGenerateTagihanDto,
  QueryTagihanDto,
  RekapSiswaResponse,
  RekapKelasResponse,
  QueryRekapKelasDto,
} from '@/types/pembayaran.types'

const BASE = '/tagihan'

// ─── API Functions ────────────────────────────────────────────────

export async function getTagihanList(
  params?: QueryTagihanDto,
): Promise<PaginatedResponse<Tagihan>> {
  const response = await api.get<PaginatedResponse<Tagihan>>(BASE, { params })
  return response.data
}

export async function getTagihanDetail(id: string): Promise<Tagihan> {
  const response = await api.get<Tagihan>(`${BASE}/${id}`)
  return response.data
}

export async function createTagihan(dto: CreateTagihanDto): Promise<Tagihan> {
  const response = await api.post<Tagihan>(BASE, dto)
  return response.data
}

export async function bulkGenerateTagihan(
  dto: BulkGenerateTagihanDto,
): Promise<{ message: string; jumlahDibuat: number }> {
  const response = await api.post<{ message: string; jumlahDibuat: number }>(
    `${BASE}/bulk-generate`,
    dto,
  )
  return response.data
}

export async function updateTagihan(
  id: string,
  dto: Partial<CreateTagihanDto>,
): Promise<Tagihan> {
  const response = await api.patch<Tagihan>(`${BASE}/${id}`, dto)
  return response.data
}

export async function deleteTagihan(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`)
}

export async function getRekapSiswa(
  siswaId: string,
  tahunAjaranId?: string,
): Promise<RekapSiswaResponse> {
  const response = await api.get<RekapSiswaResponse>(
    `${BASE}/rekap/siswa/${siswaId}`,
    { params: tahunAjaranId ? { tahunAjaranId } : undefined },
  )
  return response.data
}

export async function getRekapKelas(
  params: QueryRekapKelasDto,
): Promise<RekapKelasResponse[]> {
  const response = await api.get<RekapKelasResponse[]>(`${BASE}/rekap/kelas`, {
    params,
  })
  return response.data
}
