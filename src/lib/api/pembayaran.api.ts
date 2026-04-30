import api from '@/lib/axios'
import type { PaginatedResponse } from '@/types/api.types'
import type {
  Pembayaran,
  CreatePembayaranDto,
  DigitalPaymentDto,
  VerifikasiPembayaranDto,
  QueryPembayaranDto,
  RekapPembayaranResponse,
  RekapQueryDto,
  CreateSnapTokenDto,
  SnapTokenResponse,
  CreateDokuCheckoutDto,
  DokuCheckoutResponse,
} from '@/types/pembayaran.types'

const BASE = '/pembayaran'

// ─── API Functions ────────────────────────────────────────────────

export async function getPembayaranList(
  params?: QueryPembayaranDto,
): Promise<PaginatedResponse<Pembayaran>> {
  const response = await api.get<PaginatedResponse<Pembayaran>>(BASE, {
    params,
  })
  return response.data
}

export async function getPembayaranDetail(id: string): Promise<Pembayaran> {
  const response = await api.get<Pembayaran>(`${BASE}/${id}`)
  return response.data
}

export async function createPembayaran(
  dto: CreatePembayaranDto,
): Promise<Pembayaran> {
  const response = await api.post<Pembayaran>(BASE, dto)
  return response.data
}

export async function digitalPayment(
  dto: DigitalPaymentDto,
): Promise<Pembayaran> {
  const response = await api.post<Pembayaran>(`${BASE}/digital`, dto)
  return response.data
}

export async function verifikasiPembayaran(
  id: string,
  dto: VerifikasiPembayaranDto,
): Promise<Pembayaran> {
  const response = await api.patch<Pembayaran>(`${BASE}/${id}/verifikasi`, dto)
  return response.data
}

export async function getRekapPembayaran(
  params: RekapQueryDto,
): Promise<RekapPembayaranResponse> {
  const response = await api.get<RekapPembayaranResponse>(`${BASE}/rekap`, {
    params,
  })
  return response.data
}

export async function createSnapToken(
  dto: CreateSnapTokenDto,
): Promise<SnapTokenResponse> {
  const response = await api.post<SnapTokenResponse>(
    `${BASE}/create-snap-token`,
    dto,
  )
  return response.data
}

export async function createDokuCheckout(
  dto: CreateDokuCheckoutDto,
): Promise<DokuCheckoutResponse> {
  const response = await api.post<DokuCheckoutResponse>(
    `${BASE}/create-doku-checkout`,
    dto,
  )
  return response.data
}
