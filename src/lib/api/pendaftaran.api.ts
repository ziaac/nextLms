import apiAuth, { apiPublic } from '@/lib/axios'
import type { VerifikasiIdentitasResult, BiodataSiswaBaru, SiswaLulus, BuatkanAkunResult } from '@/types/pendaftaran.types'
import type { PaginatedResponse, PaginationParams } from '@/types'

// ── Validasi file gambar (client-side) ──────────────────────────────────────

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * Validasi file gambar sebelum dikirim ke server.
 * Melempar Error jika file tidak valid (ukuran atau tipe MIME tidak sesuai).
 *
 * @param file - File yang akan divalidasi
 * @throws Error dengan pesan dalam Bahasa Indonesia jika validasi gagal
 */
export function validateImageFile(file: File): void {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as typeof ALLOWED_IMAGE_MIME_TYPES[number])) {
    throw new Error(
      `Tipe file tidak didukung: "${file.type || 'tidak diketahui'}". ` +
      'Hanya file gambar JPG, PNG, atau WebP yang diizinkan.',
    )
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    throw new Error(
      `Ukuran file terlalu besar: ${sizeMB} MB. Maksimal ukuran file adalah 5 MB.`,
    )
  }
}

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
    const res = await apiPublic.post('/pendaftaran-ulang/verifikasi-identitas', data)
    return res.data
  },

  // Buat biodata baru
  createBiodata: async (data: Record<string, unknown>): Promise<BiodataSiswaBaru> => {
    const res = await apiPublic.post('/pendaftaran-ulang/biodata', data)
    return res.data
  },

  // Update biodata (siswa masih DRAFT)
  updateBiodata: async (id: string, data: Record<string, unknown>): Promise<BiodataSiswaBaru> => {
    const res = await apiPublic.patch(`/pendaftaran-ulang/biodata/${id}`, data)
    return res.data
  },

  // Submit biodata (DRAFT → DIAJUKAN)
  submitBiodata: async (id: string): Promise<BiodataSiswaBaru> => {
    const res = await apiPublic.patch(`/pendaftaran-ulang/biodata/${id}/submit`)
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
