import api from '@/lib/axios'
import type {
  EkskulItem,
  EkskulListResponse,
  AnggotaEkskulItem,
  MyMembershipsResponse,
  DaftarMandiriPayload,
  QueryEkskul,
} from '@/types/ekskul.types'

const BASE = '/ekstrakurikuler'

// ── Ekskul ────────────────────────────────────────────────────────────────────
export const getEkskulList = (q?: QueryEkskul) =>
  api.get<EkskulListResponse>(BASE, { params: { limit: 50, ...q } }).then((r) => r.data)

export const getEkskulDetail = (id: string) =>
  api.get<EkskulItem>(`${BASE}/${id}`).then((r) => r.data)

// ── Membership siswa ──────────────────────────────────────────────────────────
export const getMyMemberships = (tahunAjaranId?: string) =>
  api
    .get<MyMembershipsResponse>(`${BASE}/my/memberships`, {
      params: tahunAjaranId ? { tahunAjaranId } : {},
    })
    .then((r) => r.data)

export const daftarMandiri = (payload: DaftarMandiriPayload) =>
  api.post<AnggotaEkskulItem>(`${BASE}/daftar/mandiri`, payload).then((r) => r.data)

// ── Kegiatan ──────────────────────────────────────────────────────────────────
export const getKegiatanEkskul = (id: string, page = 1, limit = 10) =>
  api
    .get(`${BASE}/${id}/kegiatan`, { params: { page, limit } })
    .then((r) => r.data)

// ── Anggota ───────────────────────────────────────────────────────────────────
export const getAnggotaEkskul = (id: string, status?: string, tahunAjaranId?: string) =>
  api
    .get(`${BASE}/${id}/anggota`, { params: { status, tahunAjaranId } })
    .then((r) => r.data)

export const approvalAnggota = (anggotaId: string, action: 'APPROVE' | 'REJECT') =>
  api
    .patch(`${BASE}/anggota/${anggotaId}/approval`, null, { params: { action } })
    .then((r) => r.data)
