import api from '@/lib/axios'
import type {
  HarianQueryParams,
  HarianItem,
  DetailHarianResponse,
  CreateEksternalPayload,
  UpdateEksternalPayload,
  GuruLogEksternalItem,
  ArsipBulanItem,
  ArsipQueryParams,
  ListGuruSummaryParams,
  ListGuruSummaryResponse,
  PendingVerifikasiResponse,
} from '@/types/guru-log.types'

// ── Harian ────────────────────────────────────────────────────────────────────

export const getHarianLog = (params: HarianQueryParams): Promise<HarianItem[]> =>
  api.get<HarianItem[]>('/guru-log/harian', { params }).then((r) => r.data)

export const getDetailHarian = (
  tanggal: string,
  guruId?: string,
): Promise<DetailHarianResponse> =>
  api
    .get<DetailHarianResponse>(`/guru-log/harian/${tanggal}`, {
      params: guruId ? { guruId } : undefined,
    })
    .then((r) => r.data)

// ── Aktivitas Eksternal ───────────────────────────────────────────────────────

export const createEksternal = (
  payload: CreateEksternalPayload,
): Promise<GuruLogEksternalItem> =>
  api.post<GuruLogEksternalItem>('/guru-log/eksternal', payload).then((r) => r.data)

export const updateEksternal = (
  id: string,
  payload: UpdateEksternalPayload,
): Promise<GuruLogEksternalItem> =>
  api.put<GuruLogEksternalItem>(`/guru-log/eksternal/${id}`, payload).then((r) => r.data)

export const deleteEksternal = (id: string): Promise<{ message: string }> =>
  api.delete<{ message: string }>(`/guru-log/eksternal/${id}`).then((r) => r.data)

// ── Cetak PDF ─────────────────────────────────────────────────────────────────

export const downloadLckhPdf = async (
  tanggal: string,
  guruId?: string,
): Promise<void> => {
  const res = await api.get<Blob>(`/guru-log/cetak/${tanggal}`, {
    params: guruId ? { guruId } : undefined,
    responseType: 'blob',
  })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = `LCKH-${tanggal}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Arsip ─────────────────────────────────────────────────────────────────────

export const getArsipLog = (params: ArsipQueryParams): Promise<ArsipBulanItem[]> =>
  api.get<ArsipBulanItem[]>('/guru-log/arsip', { params }).then((r) => r.data)

// ── Persetujuan ───────────────────────────────────────────────────────────────

export interface PersetujuanResponse {
  isApproved: boolean
  atasanNama: string | null
  atasanId: string | null
  approvedAt: string | null
  tandaTanganSnapshot: string | null
}

export interface SetujuiPayload {
  tanggalList: string[]
  guruId: string
  atasanId?: string
}

export const getPersetujuan = (tanggal: string, guruId?: string): Promise<PersetujuanResponse> =>
  api
    .get<PersetujuanResponse>(`/guru-log/persetujuan/${tanggal}`, {
      params: guruId ? { guruId } : undefined,
    })
    .then((r) => r.data)

export const setujuiLckh = (payload: SetujuiPayload): Promise<{ approved: string[]; skipped: string[] }> =>
  api.post('/guru-log/setujui', payload).then((r) => r.data)

export const batalkanPersetujuan = (guruId: string, tanggal: string): Promise<{ message: string }> =>
  api.delete(`/guru-log/setujui/${guruId}/${tanggal}`).then((r) => r.data)

// ── Upload Tanda Tangan ───────────────────────────────────────────────────────

export const uploadTandaTangan = async (file: File): Promise<string> => {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<{ key: string }>('/upload/tanda-tangan', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.key
}

export const saveTandaTanganKey = (key: string): Promise<{ message: string; tandaTanganKey: string }> =>
  api.patch('/users/me/tanda-tangan', { tandaTanganKey: key }).then((r) => r.data)

// ── Manajemen: List Guru Summary ──────────────────────────────────────────────

export const getListGuruSummary = (
  params?: ListGuruSummaryParams,
): Promise<ListGuruSummaryResponse> =>
  api.get<ListGuruSummaryResponse>('/guru-log/list-guru-summary', { params }).then((r) => r.data)

export const getPendingVerifikasi = (params?: {
  bulan?: number
  tahun?: number
}): Promise<PendingVerifikasiResponse> =>
  api.get<PendingVerifikasiResponse>('/guru-log/pending-verifikasi', { params }).then((r) => r.data)
