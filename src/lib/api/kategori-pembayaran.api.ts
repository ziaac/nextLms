import api from '@/lib/axios'
import type { PaginatedResponse } from '@/types/api.types'
import type {
  KategoriPembayaran,
  CreateKategoriPembayaranDto,
  UpdateKategoriPembayaranDto,
  QueryKategoriPembayaranDto,
} from '@/types/pembayaran.types'

const BASE = '/kategori-pembayaran'

// ─── API Functions ────────────────────────────────────────────────

export async function getKategoriPembayaranList(
  params?: QueryKategoriPembayaranDto,
): Promise<PaginatedResponse<KategoriPembayaran>> {
  const response = await api.get<PaginatedResponse<KategoriPembayaran>>(BASE, {
    params,
  })
  return response.data
}

export async function getKategoriPembayaranDetail(
  id: string,
): Promise<KategoriPembayaran> {
  const response = await api.get<KategoriPembayaran>(`${BASE}/${id}`)
  return response.data
}

export async function createKategoriPembayaran(
  dto: CreateKategoriPembayaranDto,
): Promise<KategoriPembayaran> {
  const response = await api.post<KategoriPembayaran>(BASE, dto)
  return response.data
}

export async function bulkCreateKategoriPembayaran(
  dtos: CreateKategoriPembayaranDto[],
): Promise<KategoriPembayaran[]> {
  const response = await api.post<KategoriPembayaran[]>(`${BASE}/bulk`, dtos)
  return response.data
}

export async function updateKategoriPembayaran(
  id: string,
  dto: UpdateKategoriPembayaranDto,
): Promise<KategoriPembayaran> {
  const response = await api.patch<KategoriPembayaran>(`${BASE}/${id}`, dto)
  return response.data
}

export async function toggleActiveKategoriPembayaran(
  id: string,
): Promise<KategoriPembayaran> {
  const response = await api.patch<KategoriPembayaran>(
    `${BASE}/${id}/toggle-active`,
  )
  return response.data
}

export async function deleteKategoriPembayaran(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`)
}
