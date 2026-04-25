import api from '@/lib/axios'
import type {
  PrestasiItem,
  PrestasiListResponse,
  CreatePrestasiPayload,
  QueryPrestasi,
} from '@/types/prestasi.types'

const BASE = '/prestasi'

export const getPrestasiList = (q: QueryPrestasi) =>
  api.get<PrestasiListResponse>(BASE, { params: q }).then((r) => r.data)

export const getPrestasiDetail = (id: string) =>
  api.get<PrestasiItem>(`${BASE}/${id}`).then((r) => r.data)

export const createPrestasi = (payload: CreatePrestasiPayload) =>
  api.post<PrestasiItem>(BASE, payload).then((r) => r.data)

export const updatePrestasi = (id: string, payload: Partial<CreatePrestasiPayload>) =>
  api.patch<PrestasiItem>(`${BASE}/${id}`, payload).then((r) => r.data)

export const verifikasiPrestasi = (id: string) =>
  api.patch<PrestasiItem>(`${BASE}/${id}/verifikasi`).then((r) => r.data)

export const deletePrestasi = (id: string) =>
  api.delete(`${BASE}/${id}`).then((r) => r.data)
