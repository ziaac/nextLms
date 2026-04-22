import api from '@/lib/axios'

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

export const uploadApi = {
  suratPerizinan:    (file: File) => uploadPrivateFile(file, '/upload/perizinan'),
  fotoProfil:        (file: File) => uploadPrivateFile(file, '/upload/profil'),
  biodataAkta:       (file: File) => uploadPrivateFile(file, '/upload/biodata/akta'),
  biodataKK:         (file: File) => uploadPrivateFile(file, '/upload/biodata/kk'),
  biodataKIP:        (file: File) => uploadPrivateFile(file, '/upload/biodata/kip'),
  dokumenPengajaran: (file: File) => uploadPrivateFile(file, '/upload/dokumen-pengajaran'),
  materiPelajaran:   (file: File) => uploadPrivateFile(file, '/upload/materi'),
  tugas:             (file: File) => uploadPrivateFile(file, '/upload/tugas'),
}
