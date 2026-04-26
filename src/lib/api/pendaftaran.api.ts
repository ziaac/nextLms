import axios from 'axios'
import { API_URL } from '@/lib/constants'
import type { VerifikasiIdentitasResult, BiodataSiswaBaru, SiswaLulus, BuatkanAkunResult } from '@/types/pendaftaran.types'
import type { PaginatedResponse, PaginationParams } from '@/types'

// Public API — tanpa auth header
const publicApi = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// Auth API — dengan token (untuk admin)
import apiAuth from '@/lib/axios'

export interface SiswaLulusParams extends PaginationParams {
  tahunAjaranId?: string
  status?: string
  jalurPendaftaran?: string
  search?: string
}

export interface BiodataParams extends PaginationParams {
  tahunAjaranId?: string
  status?: string
  jalurPendaftaran?: string
  peminatan?: string
  search?: string
}

export const pendaftaranPublicApi = {
  // Verifikasi identitas calon siswa
  verifikasiIdentitas: async (data: {
    noPendaftaran: string
    tanggalLahir: string
  }): Promise<VerifikasiIdentitasResult> => {
    const res = await publicApi.post('/pendaftaran-ulang/verifikasi-identitas', data)
    return res.data
  },

  // Buat biodata baru
  createBiodata: async (data: Record<string, unknown>): Promise<BiodataSiswaBaru> => {
    const res = await publicApi.post('/pendaftaran-ulang/biodata', data)
    return res.data
  },

  // Update biodata (siswa masih DRAFT)
  updateBiodata: async (id: string, data: Record<string, unknown>): Promise<BiodataSiswaBaru> => {
    const res = await publicApi.patch(`/pendaftaran-ulang/biodata/${id}`, data)
    return res.data
  },

  // Submit biodata (DRAFT → DIAJUKAN)
  submitBiodata: async (id: string): Promise<BiodataSiswaBaru> => {
    const res = await publicApi.patch(`/pendaftaran-ulang/biodata/${id}/submit`)
    return res.data
  },
}

export const pendaftaranAdminApi = {
  // SiswaLulus CRUD
  getSiswaLulus: async (params?: SiswaLulusParams): Promise<PaginatedResponse<SiswaLulus>> => {
    const { data } = await apiAuth.get('/pendaftaran-ulang/siswa-lulus', { params })
    return data
  },

  getSiswaLulusById: async (id: string): Promise<SiswaLulus> => {
    const { data } = await apiAuth.get(`/pendaftaran-ulang/siswa-lulus/${id}`)
    return data
  },

  getTahunList: async (): Promise<Array<{ tahunAjaranId: string; nama: string }>> => {
    const { data } = await apiAuth.get('/pendaftaran-ulang/siswa-lulus/tahun-list')
    return data
  },

  createSiswaLulus: async (body: Record<string, unknown>): Promise<SiswaLulus> => {
    const { data } = await apiAuth.post('/pendaftaran-ulang/siswa-lulus', body)
    return data
  },

  bulkImport: async (data: unknown[]): Promise<{ message: string; count: number }> => {
    const res = await apiAuth.post('/pendaftaran-ulang/siswa-lulus/bulk', { data })
    return res.data
  },

  updateSiswaLulus: async (id: string, body: Record<string, unknown>): Promise<SiswaLulus> => {
    const { data } = await apiAuth.patch(`/pendaftaran-ulang/siswa-lulus/${id}`, body)
    return data
  },

  deleteSiswaLulus: async (id: string): Promise<void> => {
    await apiAuth.delete(`/pendaftaran-ulang/siswa-lulus/${id}`)
  },

  // Biodata admin
  getBiodata: async (params?: BiodataParams): Promise<PaginatedResponse<BiodataSiswaBaru>> => {
    const { data } = await apiAuth.get('/pendaftaran-ulang/biodata', { params })
    return data
  },

  getBiodataById: async (id: string): Promise<BiodataSiswaBaru> => {
    const { data } = await apiAuth.get(`/pendaftaran-ulang/biodata/${id}`)
    return data
  },

  verifikasiBiodata: async (id: string, body: { status: string; catatanAdmin?: string }): Promise<BiodataSiswaBaru> => {
    const { data } = await apiAuth.patch(`/pendaftaran-ulang/biodata/${id}/verifikasi`, body)
    return data
  },

  // Bulk import biodata dari sistem lama
  bulkImportBiodata: async (
    tahunAjaranId: string,
    data: Record<string, unknown>[],
  ): Promise<{ dibuat: number; diperbarui: number; dilewati: number; error: number; total: number; errorDetail: { noPendaftaran: string; alasan: string }[] }> => {
    const { data: res } = await apiAuth.post('/pendaftaran-ulang/biodata/bulk-import', { tahunAjaranId, data })
    return res
  },

  // Bulk verifikasi biodata → DITERIMA
  bulkVerifikasiBiodata: async (biodataIds: string[]): Promise<{ updated: number; total: number }> => {
    const { data } = await apiAuth.post('/pendaftaran-ulang/biodata/bulk-verifikasi', { biodataIds })
    return data
  },

  // Buatkan akun
  buatkanAkun: async (siswaLulusIds: string[]): Promise<BuatkanAkunResult> => {
    const { data } = await apiAuth.post('/pendaftaran-ulang/buatkan-akun', { siswaLulusIds })
    return data
  },

  // Statistik
  getStatistik: async (tahunAjaranId: string): Promise<Record<string, unknown>> => {
    const { data } = await apiAuth.get('/pendaftaran-ulang/statistik', { params: { tahunAjaranId } })
    return data
  },
}
