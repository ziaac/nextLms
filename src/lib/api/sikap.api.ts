import api from '@/lib/axios'
import type {
  CatatanSikapItem,
  CatatanSikapListResponse,
  RekapSiswaResponse,
  MasterSikapListResponse,
  CreateCatatanSikapPayload,
  JenisSikap,
  RekapKelasResponse,
  SiswaKelasItem,
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

// ── Rekap Kelas & Siswa Kelas ─────────────────────────────────────────────────
export const getRekapKelas = (kelasId: string, semesterId?: string): Promise<RekapKelasResponse> =>
  api
    .get<RekapKelasResponse>(`${BASE}/rekap/kelas/${kelasId}`, {
      params: semesterId ? { semesterId } : {},
    })
    .then((r) => r.data)

export const getSiswaKelas = (kelasId: string, semesterId?: string): Promise<SiswaKelasItem[]> =>
  api
    .get<SiswaKelasItem[]>(`${BASE}/rekap/siswa-kelas/${kelasId}`, {
      params: semesterId ? { semesterId } : {},
    })
    .then((r) => r.data)

// ── Export PDF ────────────────────────────────────────────────────────────────
export const exportSiswaPdf = (siswaId: string, semesterId?: string): Promise<Blob> =>
  api
    .get(`${BASE}/export/siswa/${siswaId}`, {
      params: semesterId ? { semesterId } : {},
      responseType: 'blob',
    })
    .then((r) => r.data as Blob)

export const exportKelasPdf = (kelasId: string, semesterId?: string): Promise<Blob> =>
  api
    .get(`${BASE}/export/kelas/${kelasId}`, {
      params: semesterId ? { semesterId } : {},
      responseType: 'blob',
    })
    .then((r) => r.data as Blob)

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
      params: { limit: 100, isActive: true, ...params },
    })
    .then((r) => r.data)
