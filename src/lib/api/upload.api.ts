import api from '@/lib/axios'
import { validateImageFile } from '@/lib/api/pendaftaran.api'

export interface UploadPrivateResult {
  key: string
  bucket: string
}

export interface PresignedUrlResult {
  url: string
  expiresIn: number
}

/**
 * Upload file ke endpoint private, return key MinIO
 */
export async function uploadPrivateFile(
  file: File,
  endpoint: string,
): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<UploadPrivateResult>(endpoint, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.key
}

/**
 * Get presigned URL untuk file private
 * POST /upload/presigned
 */
export async function getPresignedUrl(
  key: string,
  expirySeconds = 3600,
): Promise<string> {
  const { data } = await api.post<PresignedUrlResult>('/upload/presigned', {
    key,
    expirySeconds,
  })
  return data.url
}

/**
 * Upload file ke endpoint public, return URL langsung (bukan key private)
 */
export async function uploadPublicFile(
  file: File,
  endpoint: string,
): Promise<{ url: string; key: string }> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<{ url: string; key: string }>(endpoint, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const uploadApi = {
  suratPerizinan:    (file: File) => uploadPrivateFile(file, '/upload/perizinan'),
  fotoProfil:        (file: File) => { validateImageFile(file); return uploadPrivateFile(file, '/upload/profil') },
  biodataAkta:       (file: File) => uploadPrivateFile(file, '/upload/biodata/akta'),
  biodataKK:         (file: File) => uploadPrivateFile(file, '/upload/biodata/kk'),
  biodataKIP:        (file: File) => uploadPrivateFile(file, '/upload/biodata/kip'),
  biodataIjazah:     (file: File) => uploadPrivateFile(file, '/upload/biodata/ijazah'),
  biodataRapor:      (file: File) => uploadPrivateFile(file, '/upload/biodata/rapor'),
  biodataSkhun:      (file: File) => uploadPrivateFile(file, '/upload/biodata/skhun'),
  biodataSertifikat: (file: File) => uploadPrivateFile(file, '/upload/biodata/sertifikat'),
  biodataKtpOrtu:    (file: File) => uploadPrivateFile(file, '/upload/biodata/ktp-ortu'),
  dokumenPengajaran: (file: File) => uploadPrivateFile(file, '/upload/dokumen-pengajaran'),
  materiPelajaran:   (file: File) => uploadPrivateFile(file, '/upload/materi'),
  tugas:             (file: File) => uploadPrivateFile(file, '/upload/tugas/file'),
  tugasSubmit:       (file: File) => uploadPrivateFile(file, '/upload/tugas/submit'),

  // ── Homepage (public files — return { url, key }) ──────────────
  homepageSlider:  (file: File) => { validateImageFile(file); return uploadPublicFile(file, '/upload/homepage/slider') },
  homepageBerita:  (file: File) => { validateImageFile(file); return uploadPublicFile(file, '/upload/homepage/berita') },
  homepageGaleri:  (file: File) => { validateImageFile(file); return uploadPublicFile(file, '/upload/homepage/galeri') },
  homepageFoto:    (file: File) => { validateImageFile(file); return uploadPublicFile(file, '/upload/homepage/foto') },
  homepageProfil:  (file: File) => { validateImageFile(file); return uploadPublicFile(file, '/upload/homepage/profil-madrasah') },
}
