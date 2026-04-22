"""
FIX — File Preview untuk dokumen private (Akta, KK, KIP)
1. upload.api.ts — tambah getPresignedUrl
2. FilePreview.tsx — komponen viewer modal
3. FileUpload.tsx — tambah tombol View
4. UserDetailPanel.tsx — DocItem bisa diklik preview

python scripts/fix_file_preview.py
"""

import os
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = {}

# ============================================================
# src/lib/api/upload.api.ts
# ============================================================

files["src/lib/api/upload.api.ts"] = """\
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
  biodataAkta: (file: File) => uploadPrivateFile(file, '/upload/biodata/akta'),
  biodataKK:   (file: File) => uploadPrivateFile(file, '/upload/biodata/kk'),
  biodataKIP:  (file: File) => uploadPrivateFile(file, '/upload/biodata/kip'),
}
"""

# ============================================================
# src/components/ui/FilePreview.tsx
# — modal viewer untuk file private (PDF & gambar)
# ============================================================

files["src/components/ui/FilePreview.tsx"] = """\
'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, AlertCircle, Download, ExternalLink } from 'lucide-react'
import { getPresignedUrl } from '@/lib/api/upload.api'

interface FilePreviewProps {
  open: boolean
  onClose: () => void
  docKey: string | null
  label?: string
}

type FileType = 'pdf' | 'image' | 'unknown'

function getFileType(key: string): FileType {
  const ext = key.split('.').pop()?.toLowerCase()
  if (!ext) return 'unknown'
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  return 'unknown'
}

export function FilePreview({ open, onClose, docKey, label = 'Dokumen' }: FilePreviewProps) {
  const [url, setUrl]         = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark]   = useState(false)

  useEffect(() => {
    setMounted(true)
    const update = () => setIsDark(document.documentElement.classList.contains('dark'))
    update()
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  // Fetch presigned URL saat open
  useEffect(() => {
    if (!open || !docKey) return
    setUrl(null)
    setError(null)
    setLoading(true)

    getPresignedUrl(docKey)
      .then((presignedUrl) => setUrl(presignedUrl))
      .catch(() => setError('Gagal memuat file. Coba lagi.'))
      .finally(() => setLoading(false))
  }, [open, docKey])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!mounted || !open || !docKey) return null

  const fileType = getFileType(docKey)

  return createPortal(
    <div className={isDark ? 'dark' : ''}>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Panel */}
        <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-600/60 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-600/60 flex-shrink-0"
            style={{ backgroundColor: isDark ? 'rgb(17,24,39)' : 'white' }}>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{label}</h3>
            <div className="flex items-center gap-2">
              {url && (
                <>
                  <a
                    href={url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Download size={14} />
                    Unduh
                  </a>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ExternalLink size={14} />
                    Buka Tab Baru
                  </a>
                </>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-auto bg-gray-50 dark:bg-gray-800/50">
            {loading && (
              <div className="flex items-center justify-center h-64 gap-3">
                <Loader2 size={24} className="animate-spin text-emerald-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Memuat file...</span>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <AlertCircle size={32} className="text-red-400" />
                <p className="text-sm text-red-500">{error}</p>
                <button
                  onClick={() => {
                    setError(null)
                    setLoading(true)
                    getPresignedUrl(docKey)
                      .then(setUrl)
                      .catch(() => setError('Gagal memuat file. Coba lagi.'))
                      .finally(() => setLoading(false))
                  }}
                  className="text-sm text-emerald-600 hover:underline"
                >
                  Coba lagi
                </button>
              </div>
            )}

            {url && !loading && !error && (
              <>
                {fileType === 'pdf' && (
                  <iframe
                    src={url}
                    className="w-full h-full min-h-[70vh]"
                    title={label}
                  />
                )}
                {fileType === 'image' && (
                  <div className="flex items-center justify-center p-4 min-h-[70vh]">
                    <img
                      src={url}
                      alt={label}
                      className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
                    />
                  </div>
                )}
                {fileType === 'unknown' && (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      File ini tidak dapat ditampilkan langsung.
                    </p>
                    <a
                      href={url}
                      download
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      Unduh File
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
"""

# ============================================================
# src/components/ui/index.ts
# ============================================================

files["src/components/ui/index.ts"] = """\
export * from './Modal'
export * from './Button'
export * from './Input'
export * from './Select'
export * from './Badge'
export * from './Pagination'
export * from './SearchInput'
export * from './ConfirmModal'
export * from './EmptyState'
export * from './PageHeader'
export * from './Skeleton'
export * from './WilayahAutocomplete'
export * from './FileUpload'
export * from './SlideOver'
export * from './FilePreview'
"""

# ============================================================
# src/components/ui/FileUpload.tsx
# — tambah tombol View jika sudah ada file
# ============================================================

files["src/components/ui/FileUpload.tsx"] = """\
'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, X, Loader2, CheckCircle, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FilePreview } from './FilePreview'

interface FileUploadProps {
  label: string
  hint?: string
  accept?: string
  onUpload: (file: File) => Promise<string>
  onSuccess: (key: string) => void
  currentKey?: string | null
  disabled?: boolean
  previewLabel?: string
}

export function FileUpload({
  label, hint, accept = '.pdf,.jpg,.jpeg,.png',
  onUpload, onSuccess, currentKey, disabled,
  previewLabel,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [uploaded, setUploaded]   = useState(!!currentKey)
  const [previewOpen, setPreviewOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync currentKey → uploaded state
  useEffect(() => {
    setUploaded(!!currentKey)
  }, [currentKey])

  const handleFile = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const key = await onUpload(file)
      onSuccess(key)
      setUploaded(true)
    } catch {
      setError('Upload gagal. Coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleReset = () => {
    setUploaded(false)
    setError(null)
    onSuccess('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {uploaded && !uploading ? (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 space-y-2">
          <div className="flex items-center gap-3">
            <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
            <span className="text-sm text-emerald-700 dark:text-emerald-400 flex-1">
              File tersedia
            </span>
            {!disabled && (
              <button type="button" onClick={handleReset}
                className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
          {/* Tombol View */}
          {currentKey && (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors"
            >
              <Eye size={13} />
              Lihat File
            </button>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-2',
            'rounded-xl border-2 border-dashed px-4 py-5',
            'transition-colors cursor-pointer',
            disabled || uploading
              ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700'
              : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20',
          )}
        >
          {uploading
            ? <Loader2 size={20} className="animate-spin text-emerald-500" />
            : <Upload size={20} className="text-gray-400" />
          }
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {uploading ? 'Mengupload...' : 'Klik atau drag & drop file'}
            </p>
            {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Preview Modal */}
      <FilePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        docKey={currentKey ?? null}
        label={previewLabel ?? label}
      />
    </div>
  )
}
"""

# ============================================================
# src/app/dashboard/users/_components/UserDetailPanel.tsx
# — DocItem dengan tombol preview
# ============================================================

files["src/app/dashboard/users/_components/UserDetailPanel.tsx"] = """\
'use client'

import { useState } from 'react'
import { Eye } from 'lucide-react'
import { SlideOver, Badge } from '@/components/ui'
import { FilePreview } from '@/components/ui/FilePreview'
import { RoleBadge } from './UserBadge'
import { useUser } from '@/hooks/users/useUsers'
import { getInitials } from '@/lib/utils'
import { getPublicFileUrl as getFileUrl } from '@/lib/constants'
import { formatTanggalSaja } from '@/lib/helpers/timezone'
import type { UserItem } from '@/types/users.types'

interface UserDetailPanelProps {
  user: UserItem | null
  onClose: () => void
  onEdit: (user: UserItem) => void
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin',
  KEPALA_SEKOLAH: 'Kepala Sekolah', WAKIL_KEPALA: 'Wakil Kepala',
  GURU: 'Guru', WALI_KELAS: 'Wali Kelas', SISWA: 'Siswa',
  ORANG_TUA: 'Orang Tua', STAFF_TU: 'Staff TU', STAFF_KEUANGAN: 'Staff Keuangan',
}

const PENDIDIKAN_LABEL: Record<string, string> = {
  TIDAK_SEKOLAH: 'Tidak Sekolah', SD: 'SD', SMP: 'SMP', SMA: 'SMA/SMK',
  D1: 'D1', D2: 'D2', D3: 'D3', D4: 'D4', S1: 'S1', S2: 'S2', S3: 'S3',
}

const TINGGAL_LABEL: Record<string, string> = {
  ORANG_TUA: 'Bersama Orang Tua', WALI: 'Bersama Wali',
  ASRAMA: 'Asrama', PONDOK: 'Pondok Pesantren',
  PANTI: 'Panti Asuhan', LAINNYA: 'Lainnya',
}

const TRANSPORTASI_LABEL: Record<string, string> = {
  JALAN_KAKI: 'Jalan Kaki', SEPEDA: 'Sepeda', MOTOR: 'Motor',
  MOBIL: 'Mobil', ANGKUTAN_UMUM: 'Angkutan Umum', LAINNYA: 'Lainnya',
}

const BLOOD_DISPLAY: Record<string, string> = {
  A_POS: 'A+', A_NEG: 'A-', B_POS: 'B+', B_NEG: 'B-',
  AB_POS: 'AB+', AB_NEG: 'AB-', O_POS: 'O+', O_NEG: 'O-',
}

export function UserDetailPanel({ user, onClose, onEdit }: UserDetailPanelProps) {
  const { data, isLoading } = useUser(user?.id ?? '')
  const [preview, setPreview] = useState<{ key: string; label: string } | null>(null)

  const nama = data?.profile?.namaLengkap ?? user?.profile?.namaLengkap ?? '-'
  const foto = data?.profile?.fotoUrl ? getFileUrl(data.profile.fotoUrl) : null

  return (
    <>
      <SlideOver
        open={!!user}
        onClose={onClose}
        title="Detail Pengguna"
        description={user ? ROLE_LABEL[user.role] : ''}
        width="lg"
      >
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <div className="p-6 space-y-6 pb-10">

            {/* Avatar + info utama */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center flex-shrink-0">
                {foto
                  ? <img src={foto} alt={nama} className="w-full h-full object-cover" />
                  : <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{getInitials(nama)}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{nama}</h3>
                {data.profile.namaPanggilan && (
                  <p className="text-sm text-gray-400">Panggilan: {data.profile.namaPanggilan}</p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <RoleBadge role={data.role} />
                  <Badge variant={data.isActive ? 'success' : 'default'}>
                    {data.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                  {data.profile.tahunMasuk && (
                    <Badge variant="info">Angkatan {data.profile.tahunMasuk}</Badge>
                  )}
                </div>
              </div>
              <button
                onClick={() => { onClose(); onEdit(user!) }}
                className="flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                Edit
              </button>
            </div>

            {/* Akun */}
            <Section title="Akun">
              <Grid>
                <Field label="Email"         value={data.email} />
                <Field label="Username"      value={data.username} />
                <Field label="Login Terakhir"
                  value={data.lastLoginAt ? formatTanggalSaja(data.lastLoginAt) : '-'} />
                <Field label="Login Count"   value={data.loginCount?.toString()} />
              </Grid>
            </Section>

            {/* Identitas */}
            <Section title="Identitas Pribadi">
              <Grid>
                <Field label="Nama Lengkap"  value={data.profile.namaLengkap} />
                <Field label="Jenis Kelamin"
                  value={data.profile.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
                <Field label="Tempat Lahir"  value={data.profile.tempatLahir} />
                <Field label="Tanggal Lahir"
                  value={data.profile.tanggalLahir ? formatTanggalSaja(data.profile.tanggalLahir) : undefined} />
                <Field label="Agama"         value={data.profile.agama} />
                <Field label="Gol. Darah"
                  value={data.profile.bloodType ? BLOOD_DISPLAY[data.profile.bloodType] : undefined} />
                <Field label="Tinggi"        value={data.profile.tinggi ? `${data.profile.tinggi} cm` : undefined} />
                <Field label="Berat"         value={data.profile.berat ? `${data.profile.berat} kg` : undefined} />
              </Grid>
            </Section>

            {/* Nomor Identitas */}
            <Section title="Nomor Identitas">
              <Grid>
                <Field label="NIK"    value={data.profile.nik} />
                <Field label="No. KK" value={data.profile.noKK} />
                <Field label="NISN"   value={data.profile.nisn} />
                <Field label="NIP"    value={data.profile.nip} />
                <Field label="NUPTK"  value={data.profile.nuptk} />
              </Grid>
            </Section>

            {/* Kontak */}
            <Section title="Kontak">
              <Grid>
                <Field label="No. HP"     value={data.profile.noTelepon} />
                <Field label="WhatsApp"   value={data.profile.noWa} />
                <Field label="Telp Rumah" value={data.profile.noTelpRumah} />
              </Grid>
            </Section>

            {/* Alamat */}
            <Section title="Alamat">
              <div className="space-y-2">
                {data.profile.alamat && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">{data.profile.alamat}</p>
                )}
                <Grid>
                  <Field label="Kelurahan" value={data.profile.kelurahan} />
                  <Field label="Kecamatan" value={data.profile.kecamatan} />
                  <Field label="Kabupaten" value={data.profile.kabupaten} />
                  <Field label="Provinsi"  value={data.profile.provinsi} />
                  <Field label="Kode Pos"  value={data.profile.kodePos} />
                </Grid>
              </div>
            </Section>

            {/* Data Tambahan */}
            <Section title="Data Tambahan">
              <Grid>
                <Field label="Tahun Masuk"    value={data.profile.tahunMasuk?.toString()} />
                <Field label="Sekolah Asal"   value={data.profile.namaSekolahAsal} />
                <Field label="Anak Ke-"       value={data.profile.anakKe?.toString()} />
                <Field label="Jml Saudara"    value={data.profile.jumlahSaudaraKandung?.toString()} />
                <Field label="Jenis Tinggal"
                  value={data.profile.jenisTinggal ? TINGGAL_LABEL[data.profile.jenisTinggal] : undefined} />
                <Field label="Transportasi"
                  value={data.profile.alatTransportasi ? TRANSPORTASI_LABEL[data.profile.alatTransportasi] : undefined} />
                <Field label="Jarak ke Sekolah"
                  value={data.profile.jarakKeSekolah ? `${data.profile.jarakKeSekolah} km` : undefined} />
                <Field label="Penerima KIP"
                  value={data.profile.penerimaKIP ? 'Ya' : 'Tidak'} />
                {data.profile.penerimaKIP && (
                  <Field label="Nomor KIP" value={data.profile.nomorKIP} />
                )}
              </Grid>
            </Section>

            {/* Data Ayah */}
            <Section title="Data Orang Tua — Ayah">
              <Grid>
                <Field label="Nama"       value={data.profile.namaAyah} />
                <Field label="NIK"        value={data.profile.nikAyah} />
                <Field label="Pekerjaan"  value={data.profile.pekerjaanAyah} />
                <Field label="Pendidikan"
                  value={data.profile.pendidikanAyah ? PENDIDIKAN_LABEL[data.profile.pendidikanAyah] : undefined} />
                <Field label="Penghasilan" value={data.profile.penghasilanAyah} />
              </Grid>
            </Section>

            {/* Data Ibu */}
            <Section title="Data Orang Tua — Ibu">
              <Grid>
                <Field label="Nama"       value={data.profile.namaIbu} />
                <Field label="NIK"        value={data.profile.nikIbu} />
                <Field label="Pekerjaan"  value={data.profile.pekerjaanIbu} />
                <Field label="Pendidikan"
                  value={data.profile.pendidikanIbu ? PENDIDIKAN_LABEL[data.profile.pendidikanIbu] : undefined} />
                <Field label="Penghasilan" value={data.profile.penghasilanIbu} />
              </Grid>
            </Section>

            {/* Data Wali */}
            {data.profile.namaWali && (
              <Section title="Data Wali">
                <Grid>
                  <Field label="Nama"        value={data.profile.namaWali} />
                  <Field label="Hubungan"    value={data.profile.hubunganWali} />
                  <Field label="NIK"         value={data.profile.nikWali} />
                  <Field label="No. Telp"    value={data.profile.noTelpWali} />
                  <Field label="Pekerjaan"   value={data.profile.pekerjaanWali} />
                  <Field label="Pendidikan"
                    value={data.profile.pendidikanWali ? PENDIDIKAN_LABEL[data.profile.pendidikanWali] : undefined} />
                  <Field label="Penghasilan" value={data.profile.penghasilanWali} />
                </Grid>
              </Section>
            )}

            {/* Dokumen */}
            {(data.profile.aktaKey || data.profile.kkKey || data.profile.kipKey) && (
              <Section title="Dokumen">
                <div className="space-y-2">
                  {data.profile.aktaKey && (
                    <DocItem
                      label="Akta Kelahiran"
                      docKey={data.profile.aktaKey}
                      onPreview={() => setPreview({ key: data.profile.aktaKey!, label: 'Akta Kelahiran' })}
                    />
                  )}
                  {data.profile.kkKey && (
                    <DocItem
                      label="Kartu Keluarga"
                      docKey={data.profile.kkKey}
                      onPreview={() => setPreview({ key: data.profile.kkKey!, label: 'Kartu Keluarga' })}
                    />
                  )}
                  {data.profile.kipKey && (
                    <DocItem
                      label="KIP / PKH"
                      docKey={data.profile.kipKey}
                      onPreview={() => setPreview({ key: data.profile.kipKey!, label: 'KIP / PKH' })}
                    />
                  )}
                </div>
              </Section>
            )}

          </div>
        ) : null}
      </SlideOver>

      {/* File Preview Modal */}
      <FilePreview
        open={!!preview}
        onClose={() => setPreview(null)}
        docKey={preview?.key ?? null}
        label={preview?.label}
      />
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-600/60 pt-3">
        {title}
      </p>
      {children}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-gray-800 dark:text-gray-200">{value}</p>
    </div>
  )
}

function DocItem({ label, docKey, onPreview }: {
  label: string
  docKey: string
  onPreview: () => void
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <button
        type="button"
        onClick={onPreview}
        className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
      >
        <Eye size={13} />
        Lihat
      </button>
    </div>
  )
}
"""

# ============================================================
# WRITE
# ============================================================

def write_files(files_dict, base):
    for path, content in files_dict.items():
        full = os.path.join(base, path.replace("/", os.sep))
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  ✅ {path}")
    print(f"""
🎉 {len(files_dict)} file dibuat/diupdate!

Fitur baru:
  ✅ upload.api.ts — getPresignedUrl via POST /upload/presigned
  ✅ FilePreview.tsx — modal viewer PDF & gambar, tombol unduh + buka tab baru
  ✅ FileUpload.tsx — tombol "Lihat File" saat file sudah diupload
  ✅ UserDetailPanel.tsx — DocItem bisa diklik untuk preview, bloodType display fix

npm run dev → test klik dokumen di detail panel
""")

if __name__ == "__main__":
    print("🔧 Fix File Preview\n")
    write_files(files, BASE)