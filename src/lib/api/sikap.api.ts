import api from '@/lib/axios'
import type {
  CatatanSikapItem,
  CatatanSikapListResponse,
  RekapSiswaResponse,
  MasterSikapListResponse,
  CreateCatatanSikapPayload,
  JenisSikap,
} from '@/types/sikap.types'

const BASE   = '/catatan-sikap'
const MASTER = '/master-sikap'

// ── Query params ──────────────────────────────────────────────────────────────
export interface QueryCatatanSikap {
  page?:          number
  limit?:         number
  siswaId?:       string
  guruId?:        string
  masterSikapId?: string
  jenis?:         JenisSikap
  semesterId?:    string
  tanggalMulai?:  string
  tanggalSelesai?: string
}

// ── Catatan Sikap ─────────────────────────────────────────────────────────────
export const getCatatanSikapList = (q: QueryCatatanSikap) =>
  api.get<CatatanSikapListResponse>(BASE, { params: q }).then((r) => r.data)

export const getRekapSiswa = (siswaId: string, semesterId?: string) =>
  api
    .get<RekapSiswaResponse>(`${BASE}/rekap/${siswaId}`, {
      params: semesterId ? { semesterId } : {},
    })
    .then((r) => r.data)

export const getCatatanSikapDetail = (id: string) =>
  api.get<CatatanSikapItem>(`${BASE}/${id}`).then((r) => r.data)

export const createCatatanSikap = (payload: CreateCatatanSikapPayload) =>
  api.post<CatatanSikapItem>(BASE, payload).then((r) => r.data)

export const updateCatatanSikap = (id: string, payload: Partial<CreateCatatanSikapPayload>) =>
  api.patch<CatatanSikapItem>(`${BASE}/${id}`, payload).then((r) => r.data)

export const deleteCatatanSikap = (id: string) =>
  api.delete(`${BASE}/${id}`).then((r) => r.data)

// ── Master Sikap ──────────────────────────────────────────────────────────────
export interface QueryMasterSikap {
  jenis?:    JenisSikap
  isActive?: boolean
  limit?:    number
  page?:     number
}

export const getMasterSikapList = (params?: QueryMasterSikap) =>
  api
    .get<MasterSikapListResponse>(MASTER, {
      params: { limit: 200, ...params },
    })
    .then((r) => r.data)
