
import api from '@/lib/axios'
import { PaginatedResponse } from '@/types/api.types'
import {
  TugasItem,
  TugasQueryParams,
  PengumpulanTugas,
  RekapPengumpulanItem,
  StatusPengumpulan,
  NilaiRekapResponse,
} from '@/types/tugas.types'

const BASE = '/tugas'

// --- TUGAS MANAGEMENT (GURU/ADMIN) ---

export const createTugas = (payload: any) =>
  api.post<TugasItem>(BASE, payload).then((r) => r.data)

export const getListTugas = (params: TugasQueryParams) =>
  api.get<PaginatedResponse<TugasItem>>(BASE, { params }).then((r) => r.data)

export const getDetailTugas = (id: string) =>
  api.get<TugasItem>(`${BASE}/${id}`).then((r) => r.data)

export const updateTugas = (id: string, payload: any) =>
  api.put<TugasItem>(`${BASE}/${id}`, payload).then((r) => r.data)

export const publishTugas = (id: string) =>
  api.patch<TugasItem>(`${BASE}/${id}/publish`).then((r) => r.data)

export const deleteTugas = (id: string) =>
  api.delete<{ message: string }>(`${BASE}/${id}`).then((r) => r.data)

export const getRekapPengumpulan = (tugasId: string) =>
  api.get<RekapPengumpulanItem[]>(`${BASE}/${tugasId}/rekap`).then((r) => r.data)

// --- SUBMISSION (SISWA) ---

export const submitTugas = (tugasId: string, payload: any) =>
  api.post<PengumpulanTugas>(`${BASE}/${tugasId}/submit`, payload).then((r) => r.data)

export const getMySubmission = (tugasId: string) =>
  api.get<PengumpulanTugas>(`${BASE}/${tugasId}/pengumpulan`).then((r) => r.data)

export const getMyNilaiRekap = () =>
  api.get<NilaiRekapResponse>(`${BASE}/my/nilai-rekap`).then((r) => r.data)

// --- GRADING (GURU) ---

export const getSubmissionDetail = (id: string) =>
  api.get<PengumpulanTugas>(`${BASE}/pengumpulan/${id}`).then((r) => r.data)

export const bulkCopyTugas = (payload: {
  tugasIds: string[]
  targetMataPelajaranIds: string[]
  tanggalMulai?: string
  tanggalSelesai?: string
}) =>
  api.post<{ count: number; message: string }>(`${BASE}/bulk-copy`, payload).then(r => r.data)

export interface UpdateSubmissionPayload {
  status:   StatusPengumpulan
  catatan?: string
  nilai?:   number          // wajib jika status === DINILAI
}

export const updateSubmissionStatus = (id: string, payload: UpdateSubmissionPayload) =>
  api.patch<PengumpulanTugas>(`${BASE}/pengumpulan/${id}/status`, payload).then((r) => r.data)

export interface NilaiManualPayload {
  siswaId: string
  nilai:   number
  catatan?: string
}

export const nilaiManualTugas = (tugasId: string, payload: NilaiManualPayload) =>
  api.post<PengumpulanTugas>(`${BASE}/${tugasId}/nilai-manual`, payload).then((r) => r.data)

// --- TARIK KEMBALI / KEMBALIKAN ---

/** Siswa menarik kembali pengumpulan (SUBMITTED → DRAFT), hanya boleh sebelum deadline */
export const tarikKembaliSubmission = (tugasId: string) =>
  api.patch<PengumpulanTugas>(`${BASE}/${tugasId}/tarik-kembali`, {}).then((r) => r.data)

/** Guru mengembalikan pengumpulan ke siswa (SUBMITTED → DRAFT), bukan UTS/UAS */
export const kembalikanPengumpulan = (pengumpulanId: string) =>
  api.patch<PengumpulanTugas>(`${BASE}/pengumpulan/${pengumpulanId}/kembalikan`, {}).then((r) => r.data)

