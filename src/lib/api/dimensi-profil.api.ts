import api from '@/lib/axios'
import type { AxiosResponse } from 'axios'
import type {
  MasterDimensiResponse,
  DimensiGrouped,
  PenilaianGridResponse,
  BulkUpsertPayload,
  DimensiRingkasanSiswa,
  DimensiProfil,
  SubDimensiProfil,
  CreateDimensiPayload,
  UpdateDimensiPayload,
  CreateSubDimensiPayload,
  UpdateSubDimensiPayload,
} from '@/types/dimensi-profil.types'

const BASE = '/dimensi-profil'

// ── Master (semua dimensi + sub-dimensi dari seed) ──────────────────
export const getMasterDimensi = (): Promise<MasterDimensiResponse> =>
  api.get<MasterDimensiResponse>(`${BASE}/master`).then((r: AxiosResponse<MasterDimensiResponse>) => r.data)

// ── Sub-dimensi yang dipilih untuk MataPelajaranTingkat ─────────────
export const getDimensiByMapelTingkat = (mataPelajaranTingkatId: string): Promise<DimensiGrouped[]> =>
  api.get<DimensiGrouped[]>(`${BASE}/mata-pelajaran-tingkat/${mataPelajaranTingkatId}`)
    .then((r: AxiosResponse<DimensiGrouped[]>) => r.data)

// ── Manajemen: SET sub-dimensi untuk MataPelajaranTingkat ───────────
export const setDimensiMapelTingkat = (
  mataPelajaranTingkatId: string,
  subDimensiIds: string[],
): Promise<DimensiGrouped[]> =>
  api.put<DimensiGrouped[]>(
    `${BASE}/mata-pelajaran-tingkat/${mataPelajaranTingkatId}`,
    { subDimensiIds },
  ).then((r: AxiosResponse<DimensiGrouped[]>) => r.data)

// ── Guru: ambil grid penilaian ──────────────────────────────────────
export const getPenilaianGrid = (mataPelajaranId: string): Promise<PenilaianGridResponse> =>
  api.get<PenilaianGridResponse>(`${BASE}/penilaian/${mataPelajaranId}`)
    .then((r: AxiosResponse<PenilaianGridResponse>) => r.data)

// ── Guru: bulk-upsert penilaian ─────────────────────────────────────
export const bulkUpsertPenilaian = (
  mataPelajaranId: string,
  payload: BulkUpsertPayload,
): Promise<{ message: string }> =>
  api.put<{ message: string }>(`${BASE}/penilaian/${mataPelajaranId}`, payload)
    .then((r: AxiosResponse<{ message: string }>) => r.data)

// ── Admin CRUD: Dimensi ─────────────────────────────────────────────
export const createDimensi = (payload: CreateDimensiPayload): Promise<DimensiProfil> =>
  api.post<DimensiProfil>(`${BASE}/master/dimensi`, payload)
    .then((r: AxiosResponse<DimensiProfil>) => r.data)

export const updateDimensi = (id: string, payload: UpdateDimensiPayload): Promise<DimensiProfil> =>
  api.put<DimensiProfil>(`${BASE}/master/dimensi/${id}`, payload)
    .then((r: AxiosResponse<DimensiProfil>) => r.data)

export const deleteDimensi = (id: string): Promise<{ message: string }> =>
  api.delete<{ message: string }>(`${BASE}/master/dimensi/${id}`)
    .then((r: AxiosResponse<{ message: string }>) => r.data)

// ── Admin CRUD: Sub-Dimensi ─────────────────────────────────────────
export const createSubDimensi = (dimensiId: string, payload: CreateSubDimensiPayload): Promise<SubDimensiProfil> =>
  api.post<SubDimensiProfil>(`${BASE}/master/dimensi/${dimensiId}/sub`, payload)
    .then((r: AxiosResponse<SubDimensiProfil>) => r.data)

export const updateSubDimensi = (id: string, payload: UpdateSubDimensiPayload): Promise<SubDimensiProfil> =>
  api.put<SubDimensiProfil>(`${BASE}/master/sub-dimensi/${id}`, payload)
    .then((r: AxiosResponse<SubDimensiProfil>) => r.data)

export const deleteSubDimensi = (id: string): Promise<{ message: string }> =>
  api.delete<{ message: string }>(`${BASE}/master/sub-dimensi/${id}`)
    .then((r: AxiosResponse<{ message: string }>) => r.data)

// ── Siswa: ringkasan dimensi profil ────────────────────────────────
export const getRingkasanDimensiSiswa = (
  siswaId: string,
  semesterId: string,
): Promise<DimensiRingkasanSiswa[]> =>
  api.get<DimensiRingkasanSiswa[]>(`${BASE}/siswa/${siswaId}`, { params: { semesterId } })
    .then((r: AxiosResponse<DimensiRingkasanSiswa[]>) => r.data)
