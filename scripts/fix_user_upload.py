"""
FIX:
1. Dropdown kelurahan tampilkan nama kecamatan + kabupaten (cache)
2. Upload dokumen (akta, KK, KIP) langsung di form

python scripts/fix_wilayah_upload.py
"""

import os
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = {}

# ============================================================
# src/lib/api/wilayah.api.ts — tambah cache kecamatan
# ============================================================

files["src/lib/api/wilayah.api.ts"] = """\
import api from '@/lib/axios'

export interface WilayahItem {
  kode: string
  nama: string
  tipe?: string
  indukKode?: string
}

// ── Cache in-memory ───────────────────────────────────────────────
const cache = {
  provinsi:  null as WilayahItem[] | null,
  kabupaten: new Map<string, WilayahItem[]>(),
  kecamatan: new Map<string, WilayahItem[]>(),
}

export const wilayahApi = {
  searchKelurahan: async (q: string): Promise<WilayahItem[]> => {
    if (q.length < 3) return []
    const { data } = await api.get('/wilayah/search', { params: { q } })
    return (data as WilayahItem[]).filter(item => item.tipe === 'KELURAHAN_DESA')
  },

  getAllProvinsi: async (): Promise<WilayahItem[]> => {
    if (cache.provinsi) return cache.provinsi
    const { data } = await api.get('/wilayah/provinsi')
    cache.provinsi = data
    return data
  },

  getKabupaten: async (indukKode: string): Promise<WilayahItem[]> => {
    if (cache.kabupaten.has(indukKode)) return cache.kabupaten.get(indukKode)!
    const { data } = await api.get('/wilayah/kabupaten', { params: { indukKode } })
    cache.kabupaten.set(indukKode, data)
    return data
  },

  getKecamatan: async (indukKode: string): Promise<WilayahItem[]> => {
    if (cache.kecamatan.has(indukKode)) return cache.kecamatan.get(indukKode)!
    const { data } = await api.get('/wilayah/kecamatan', { params: { indukKode } })
    cache.kecamatan.set(indukKode, data)
    return data
  },
}

export function deriveKodeInduk(kelurahanKode: string) {
  const parts = kelurahanKode.split('.')
  return {
    provinsiKode:  parts[0],
    kabupatenKode: parts.slice(0, 2).join('.'),
    kecamatanKode: parts.slice(0, 3).join('.'),
  }
}

export async function resolveWilayahNames(kelurahanKode: string) {
  const { provinsiKode, kabupatenKode, kecamatanKode } = deriveKodeInduk(kelurahanKode)

  const [provinsiList, kabupatenList, kecamatanList] = await Promise.all([
    wilayahApi.getAllProvinsi(),
    wilayahApi.getKabupaten(provinsiKode),
    wilayahApi.getKecamatan(kabupatenKode),
  ])

  return {
    provinsi:  provinsiList.find(p => p.kode === provinsiKode)?.nama  ?? '',
    kabupaten: kabupatenList.find(k => k.kode === kabupatenKode)?.nama ?? '',
    kecamatan: kecamatanList.find(k => k.kode === kecamatanKode)?.nama ?? '',
  }
}

/**
 * Pre-fetch nama kecamatan & kabupaten untuk list kelurahan
 * Dijalankan sekali saat dropdown terbuka, hasilnya di-cache
 */
export async function enrichKelurahanList(
  items: WilayahItem[],
): Promise<(WilayahItem & { namaKecamatan: string; namaKabupaten: string })[]> {
  if (items.length === 0) return []

  // Kumpulkan semua unique kabupatenKode yang dibutuhkan
  const kabupatenKodeSet = new Set(
    items.map(item => deriveKodeInduk(item.kode).kabupatenKode)
  )

  // Fetch kecamatan untuk setiap kabupaten unik (paralel, dengan cache)
  const provinsiKode = deriveKodeInduk(items[0].kode).provinsiKode
  await wilayahApi.getKabupaten(provinsiKode) // cache kabupaten

  await Promise.all(
    Array.from(kabupatenKodeSet).map(kode => wilayahApi.getKecamatan(kode))
  )

  // Enrich setiap item dengan nama kecamatan & kabupaten dari cache
  return items.map(item => {
    const { kabupatenKode, kecamatanKode } = deriveKodeInduk(item.kode)
    const kabList = cache.kabupaten.get(provinsiKode) ?? []
    const kecList = cache.kecamatan.get(kabupatenKode) ?? []

    return {
      ...item,
      namaKabupaten: kabList.find(k => k.kode === kabupatenKode)?.nama ?? kabupatenKode,
      namaKecamatan: kecList.find(k => k.kode === kecamatanKode)?.nama ?? kecamatanKode,
    }
  })
}
"""

# ============================================================
# src/components/ui/WilayahAutocomplete.tsx
# — tampilkan nama kecamatan + kabupaten di dropdown
# ============================================================

files["src/components/ui/WilayahAutocomplete.tsx"] = """\
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  wilayahApi, resolveWilayahNames, enrichKelurahanList,
  type WilayahItem,
} from '@/lib/api/wilayah.api'
import { useDebounce } from '@/hooks/useDebounce'

export interface WilayahValue {
  kelurahan: string
  kecamatan: string
  kabupaten: string
  provinsi: string
  kodeKelurahan?: string
}

type EnrichedItem = WilayahItem & { namaKecamatan: string; namaKabupaten: string }

interface WilayahAutocompleteProps {
  value?: WilayahValue
  onChange: (value: WilayahValue) => void
  label?: string
  error?: string
  disabled?: boolean
}

export function WilayahAutocomplete({
  value, onChange, label = 'Kelurahan / Desa', error, disabled,
}: WilayahAutocompleteProps) {
  const [query, setQuery]           = useState(value?.kelurahan ?? '')
  const [results, setResults]       = useState<EnrichedItem[]>([])
  const [open, setOpen]             = useState(false)
  const [searching, setSearching]   = useState(false)
  const [enriching, setEnriching]   = useState(false)
  const [resolving, setResolving]   = useState(false)
  const [selected, setSelected]     = useState(false)

  const containerRef   = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    if (value?.kelurahan && value.kelurahan !== query) {
      setQuery(value.kelurahan)
      setSelected(true)
    }
  }, [value?.kelurahan])

  useEffect(() => {
    if (selected) return
    if (debouncedQuery.length < 3) { setResults([]); setOpen(false); return }

    let cancelled = false
    setSearching(true)

    wilayahApi.searchKelurahan(debouncedQuery)
      .then(async (raw) => {
        if (cancelled) return
        setSearching(false)

        if (raw.length === 0) { setResults([]); setOpen(false); return }

        // Tampilkan dulu tanpa enrich
        const preliminary = raw.map(item => ({
          ...item, namaKecamatan: '...', namaKabupaten: '...',
        }))
        setResults(preliminary)
        setOpen(true)

        // Enrich dengan nama kecamatan + kabupaten
        setEnriching(true)
        const enriched = await enrichKelurahanList(raw).catch(() => preliminary)
        if (!cancelled) {
          setResults(enriched)
          setEnriching(false)
        }
      })
      .catch(() => {
        if (!cancelled) { setSearching(false); setResults([]) }
      })

    return () => { cancelled = true }
  }, [debouncedQuery, selected])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = useCallback(async (item: EnrichedItem) => {
    setQuery(item.nama)
    setSelected(true)
    setOpen(false)
    setResolving(true)

    try {
      const { provinsi, kabupaten, kecamatan } = await resolveWilayahNames(item.kode)
      onChange({ kelurahan: item.nama, kecamatan, kabupaten, provinsi, kodeKelurahan: item.kode })
    } catch {
      onChange({ kelurahan: item.nama, kecamatan: item.namaKecamatan, kabupaten: item.namaKabupaten, provinsi: '', kodeKelurahan: item.kode })
    } finally {
      setResolving(false)
    }
  }, [onChange])

  const handleClear = () => {
    setQuery(''); setSelected(false); setResults([])
    onChange({ kelurahan: '', kecamatan: '', kabupaten: '', provinsi: '' })
  }

  const isLoading = searching || resolving

  return (
    <div ref={containerRef} className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="relative">
        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(false) }}
          onFocus={() => { if (results.length > 0 && !selected) setOpen(true) }}
          placeholder="Ketik nama kelurahan (min. 3 huruf)..."
          disabled={disabled || resolving}
          className={cn(
            'w-full rounded-xl bg-white dark:bg-gray-800 pl-9 pr-9 py-2.5',
            'text-base text-gray-900 dark:text-white',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'outline-none transition',
            'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border border-red-400 dark:border-red-500/70'
              : 'border border-gray-200 dark:border-gray-700/60',
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading
            ? <Loader2 size={15} className="animate-spin text-gray-400" />
            : query
              ? <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={15} /></button>
              : null
          }
        </div>

        {/* Dropdown */}
        {open && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 shadow-lg">
            {results.map((item) => (
              <button
                key={item.kode}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700/40 last:border-0"
              >
                <p className="font-medium text-gray-900 dark:text-white">{item.nama}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {enriching && item.namaKecamatan === '...'
                    ? <span className="italic">Memuat lokasi...</span>
                    : <>{item.namaKecamatan} · {item.namaKabupaten}</>
                  }
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Auto-filled */}
      {resolving && (
        <div className="grid grid-cols-3 gap-2">
          {['Kecamatan', 'Kabupaten / Kota', 'Provinsi'].map(l => (
            <AutoFilledField key={l} label={l} value="..." />
          ))}
        </div>
      )}
      {!resolving && (value?.kecamatan || value?.kabupaten || value?.provinsi) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <AutoFilledField label="Kecamatan"       value={value?.kecamatan ?? ''} />
          <AutoFilledField label="Kabupaten / Kota" value={value?.kabupaten ?? ''} />
          <AutoFilledField label="Provinsi"         value={value?.provinsi  ?? ''} />
        </div>
      )}
    </div>
  )
}

function AutoFilledField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 px-3 py-2 space-y-0.5">
      <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-800 dark:text-gray-200 truncate font-medium">
        {value && value !== '...'
          ? value
          : <span className="text-gray-400 italic font-normal">{value === '...' ? '...' : '—'}</span>
        }
      </p>
    </div>
  )
}
"""

# ============================================================
# src/lib/api/upload.api.ts — upload helper
# ============================================================

files["src/lib/api/upload.api.ts"] = """\
import api from '@/lib/axios'

export interface UploadPrivateResult {
  key: string
  bucket: string
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

export const uploadApi = {
  biodataAkta:  (file: File) => uploadPrivateFile(file, '/upload/biodata/akta'),
  biodataKK:    (file: File) => uploadPrivateFile(file, '/upload/biodata/kk'),
  biodataKIP:   (file: File) => uploadPrivateFile(file, '/upload/biodata/kip'),
}
"""

# ============================================================
# src/components/ui/FileUpload.tsx — reusable upload component
# ============================================================

files["src/components/ui/FileUpload.tsx"] = """\
'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, Loader2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  label: string
  hint?: string
  accept?: string
  onUpload: (file: File) => Promise<string>  // returns key
  onSuccess: (key: string) => void
  currentKey?: string | null
  disabled?: boolean
}

export function FileUpload({
  label, hint, accept = '.pdf,.jpg,.jpeg,.png',
  onUpload, onSuccess, currentKey, disabled,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [uploaded, setUploaded]   = useState(!!currentKey)
  const inputRef = useRef<HTMLInputElement>(null)

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
        /* Uploaded state */
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3">
          <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
          <span className="text-sm text-emerald-700 dark:text-emerald-400 flex-1">
            File berhasil diupload
          </span>
          {!disabled && (
            <button type="button" onClick={handleReset}
              className="text-gray-400 hover:text-red-500 transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        /* Upload zone */
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
          {uploading ? (
            <Loader2 size={20} className="animate-spin text-emerald-500" />
          ) : (
            <Upload size={20} className="text-gray-400" />
          )}
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
    </div>
  )
}
"""

# ============================================================
# Update src/components/ui/index.ts
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
"""

# ============================================================
# src/app/dashboard/users/_components/UserFormModal.tsx
# — tambah section dokumen upload
# ============================================================

files["src/app/dashboard/users/_components/UserFormModal.tsx"] = """\
'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Modal, ModalFooter, Button, Input, Select,
  WilayahAutocomplete, FileUpload,
} from '@/components/ui'
import type { WilayahValue } from '@/components/ui/WilayahAutocomplete'
import { useCreateUser, useUpdateUser, useUser } from '@/hooks/users/useUsers'
import { uploadApi } from '@/lib/api/upload.api'
import { getErrorMessage } from '@/lib/utils'
import type { UserItem } from '@/types/users.types'

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN',    label: 'Super Admin' },
  { value: 'ADMIN',          label: 'Admin' },
  { value: 'KEPALA_SEKOLAH', label: 'Kepala Sekolah' },
  { value: 'WAKIL_KEPALA',   label: 'Wakil Kepala' },
  { value: 'GURU',           label: 'Guru' },
  { value: 'WALI_KELAS',     label: 'Wali Kelas' },
  { value: 'SISWA',          label: 'Siswa' },
  { value: 'ORANG_TUA',      label: 'Orang Tua' },
  { value: 'STAFF_TU',       label: 'Staff TU' },
  { value: 'STAFF_KEUANGAN', label: 'Staff Keuangan' },
]
const JK_OPTIONS = [{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]
const AGAMA_OPTIONS = [{ value: 'ISLAM', label: 'Islam' }]
const BLOOD_OPTIONS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(v => ({ value: v, label: v }))
const TINGGAL_OPTIONS = [
  { value: 'ORANG_TUA', label: 'Bersama Orang Tua' },
  { value: 'WALI',      label: 'Bersama Wali' },
  { value: 'ASRAMA',    label: 'Asrama' },
  { value: 'PONDOK',    label: 'Pondok Pesantren' },
  { value: 'PANTI',     label: 'Panti Asuhan' },
  { value: 'LAINNYA',   label: 'Lainnya' },
]
const TRANSPORTASI_OPTIONS = [
  { value: 'JALAN_KAKI',    label: 'Jalan Kaki' },
  { value: 'SEPEDA',        label: 'Sepeda' },
  { value: 'MOTOR',         label: 'Motor' },
  { value: 'MOBIL',         label: 'Mobil' },
  { value: 'ANGKUTAN_UMUM', label: 'Angkutan Umum' },
  { value: 'LAINNYA',       label: 'Lainnya' },
]
const PENDIDIKAN_OPTIONS = [
  { value: 'TIDAK_SEKOLAH', label: 'Tidak Sekolah' },
  { value: 'SD', label: 'SD' }, { value: 'SMP', label: 'SMP' },
  { value: 'SMA', label: 'SMA/SMK' }, { value: 'D1', label: 'D1' },
  { value: 'D2', label: 'D2' }, { value: 'D3', label: 'D3' },
  { value: 'D4', label: 'D4' }, { value: 'S1', label: 'S1' },
  { value: 'S2', label: 'S2' }, { value: 'S3', label: 'S3' },
]

const formSchema = z.object({
  email:        z.string().email('Format email tidak valid').optional(),
  password:     z.string().min(6, 'Minimal 6 karakter').optional(),
  role:         z.string().min(1, 'Wajib dipilih'),
  username:     z.string().optional(),
  namaLengkap:  z.string().min(2, 'Minimal 2 karakter'),
  namaPanggilan: z.string().optional(),
  jenisKelamin: z.string().min(1, 'Wajib dipilih'),
  tempatLahir:  z.string().min(2, 'Wajib diisi'),
  tanggalLahir: z.string().min(1, 'Wajib diisi'),
  agama:        z.string().default('ISLAM'),
  nik:  z.string().optional(), nisn: z.string().optional(),
  nip:  z.string().optional(), nuptk: z.string().optional(),
  noKK: z.string().optional(),
  namaSekolahAsal:   z.string().optional(),
  alamatSekolahAsal: z.string().optional(),
  anakKe:               z.string().optional(),
  jumlahSaudaraKandung: z.string().optional(),
  jenisTinggal:    z.string().optional(),
  alatTransportasi: z.string().optional(),
  jarakKeSekolah:  z.string().optional(),
  noTelepon: z.string().optional(),
  noWa:      z.string().optional(),
  noTelpRumah: z.string().optional(),
  penerimaKIP: z.boolean().optional(),
  nomorKIP:    z.string().optional(),
  alamat:  z.string().optional(),
  kodePos: z.string().optional(),
  wilayah: z.object({
    kelurahan: z.string().optional(), kecamatan: z.string().optional(),
    kabupaten: z.string().optional(), provinsi:  z.string().optional(),
    kodeKelurahan: z.string().optional(),
  }).optional(),
  bloodType: z.string().optional(),
  tinggi:    z.string().optional(),
  berat:     z.string().optional(),
  namaAyah: z.string().optional(), nikAyah: z.string().optional(),
  pekerjaanAyah: z.string().optional(), pendidikanAyah: z.string().optional(),
  penghasilanAyah: z.string().optional(),
  namaIbu: z.string().optional(), nikIbu: z.string().optional(),
  pekerjaanIbu: z.string().optional(), pendidikanIbu: z.string().optional(),
  penghasilanIbu: z.string().optional(),
  namaWali: z.string().optional(), nikWali: z.string().optional(),
  hubunganWali: z.string().optional(), pekerjaanWali: z.string().optional(),
  pendidikanWali: z.string().optional(), penghasilanWali: z.string().optional(),
  noTelpWali: z.string().optional(),
  aktaKey: z.string().optional(),
  kkKey:   z.string().optional(),
  kipKey:  z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

function toDateInput(iso?: string | null) {
  if (!iso) return ''
  return iso.split('T')[0]
}

function buildPayload(data: FormData) {
  const wilayah = data.wilayah as WilayahValue | undefined
  const payload: Record<string, unknown> = { ...data }
  delete payload.wilayah
  if (wilayah?.kelurahan) payload.kelurahan = wilayah.kelurahan
  if (wilayah?.kecamatan) payload.kecamatan = wilayah.kecamatan
  if (wilayah?.kabupaten) payload.kabupaten = wilayah.kabupaten
  if (wilayah?.provinsi)  payload.provinsi  = wilayah.provinsi
  if (payload.tinggi) payload.tinggi = parseInt(payload.tinggi as string)
  if (payload.berat)  payload.berat  = parseInt(payload.berat as string)
  if (payload.anakKe) payload.anakKe = parseInt(payload.anakKe as string)
  if (payload.jumlahSaudaraKandung) payload.jumlahSaudaraKandung = parseInt(payload.jumlahSaudaraKandung as string)
  if (payload.jarakKeSekolah) payload.jarakKeSekolah = parseFloat(payload.jarakKeSekolah as string)
  return Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  )
}

interface UserFormModalProps {
  open: boolean
  onClose: () => void
  user?: UserItem | null
}

export function UserFormModal({ open, onClose, user }: UserFormModalProps) {
  const isEdit = !!user
  const { data: userDetail, isLoading: loadingDetail } = useUser(user?.id ?? '')
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser(user?.id ?? '')

  const form = useForm<FormData>({ resolver: zodResolver(formSchema) })
  const penerimaKIP = form.watch('penerimaKIP')

  useEffect(() => {
    if (!open) return
    createMutation.reset()
    updateMutation.reset()

    if (isEdit && userDetail) {
      const p = userDetail.profile
      form.reset({
        role: userDetail.role, username: userDetail.username ?? '',
        namaLengkap: p.namaLengkap ?? '', namaPanggilan: p.namaPanggilan ?? '',
        jenisKelamin: p.jenisKelamin ?? '', tempatLahir: p.tempatLahir ?? '',
        tanggalLahir: toDateInput(p.tanggalLahir), agama: p.agama ?? 'ISLAM',
        nik: p.nik ?? '', nisn: p.nisn ?? '', nip: p.nip ?? '',
        nuptk: p.nuptk ?? '', noKK: p.noKK ?? '',
        namaSekolahAsal: p.namaSekolahAsal ?? '',
        alamatSekolahAsal: p.alamatSekolahAsal ?? '',
        anakKe: p.anakKe?.toString() ?? '',
        jumlahSaudaraKandung: p.jumlahSaudaraKandung?.toString() ?? '',
        jenisTinggal: p.jenisTinggal ?? '',
        alatTransportasi: p.alatTransportasi ?? '',
        jarakKeSekolah: p.jarakKeSekolah?.toString() ?? '',
        noTelepon: p.noTelepon ?? '', noWa: p.noWa ?? '',
        noTelpRumah: p.noTelpRumah ?? '',
        penerimaKIP: p.penerimaKIP ?? false, nomorKIP: p.nomorKIP ?? '',
        alamat: p.alamat ?? '', kodePos: p.kodePos ?? '',
        wilayah: { kelurahan: p.kelurahan ?? '', kecamatan: p.kecamatan ?? '', kabupaten: p.kabupaten ?? '', provinsi: p.provinsi ?? '' },
        bloodType: p.bloodType ?? '', tinggi: p.tinggi?.toString() ?? '', berat: p.berat?.toString() ?? '',
        namaAyah: p.namaAyah ?? '', nikAyah: p.nikAyah ?? '',
        pekerjaanAyah: p.pekerjaanAyah ?? '', pendidikanAyah: p.pendidikanAyah ?? '',
        penghasilanAyah: p.penghasilanAyah ?? '',
        namaIbu: p.namaIbu ?? '', nikIbu: p.nikIbu ?? '',
        pekerjaanIbu: p.pekerjaanIbu ?? '', pendidikanIbu: p.pendidikanIbu ?? '',
        penghasilanIbu: p.penghasilanIbu ?? '',
        namaWali: p.namaWali ?? '', nikWali: p.nikWali ?? '',
        hubunganWali: p.hubunganWali ?? '', pekerjaanWali: p.pekerjaanWali ?? '',
        pendidikanWali: p.pendidikanWali ?? '', penghasilanWali: p.penghasilanWali ?? '',
        noTelpWali: p.noTelpWali ?? '',
        aktaKey: p.aktaKey ?? '', kkKey: p.kkKey ?? '', kipKey: p.kipKey ?? '',
      } as never)
    } else if (!isEdit) {
      form.reset()
    }
  }, [open, userDetail?.id])

  const isPending = createMutation.isPending || updateMutation.isPending
  const mutationError = createMutation.error || updateMutation.error

  const onSubmit = async (data: FormData) => {
    try {
      const payload = buildPayload(data)
      if (isEdit) await updateMutation.mutateAsync(payload as never)
      else await createMutation.mutateAsync(payload as never)
      onClose()
    } catch { /* via mutationError */ }
  }

  const r = form.register
  const e = form.formState.errors

  return (
    <Modal open={open} onClose={onClose}
      title={isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'} size="xl">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="p-6 space-y-6">
          {mutationError && <ErrorBox message={getErrorMessage(mutationError)} />}
          {isEdit && loadingDetail && <p className="text-sm text-gray-400 text-center py-4">Memuat data...</p>}

          {/* AKUN */}
          <Section title="Akun">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!isEdit && <>
                <Input label="Email" type="email" error={e.email?.message} {...r('email')} />
                <Input label="Password" type="password" error={e.password?.message} {...r('password')} />
              </>}
              {isEdit && <InfoField label="Email" value={user?.email ?? '-'} />}
              <Select label="Role" options={ROLE_OPTIONS} placeholder="Pilih role..." error={e.role?.message} {...r('role')} />
              <Input label="Username" placeholder="opsional" {...r('username')} />
            </div>
          </Section>

          {/* IDENTITAS */}
          <Section title="Identitas Pribadi">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input label="Nama Lengkap" placeholder="Sesuai akta kelahiran" error={e.namaLengkap?.message} {...r('namaLengkap')} />
              </div>
              <Input label="Nama Panggilan" {...r('namaPanggilan')} />
              <Select label="Jenis Kelamin" options={JK_OPTIONS} placeholder="Pilih..." error={e.jenisKelamin?.message} {...r('jenisKelamin')} />
              <Select label="Agama" options={AGAMA_OPTIONS} {...r('agama')} />
              <Input label="Tempat Lahir" error={e.tempatLahir?.message} {...r('tempatLahir')} />
              <Input label="Tanggal Lahir" type="date" error={e.tanggalLahir?.message} {...r('tanggalLahir')} />
            </div>
          </Section>

          {/* NOMOR IDENTITAS */}
          <Section title="Nomor Identitas">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="NIK" placeholder="16 digit" {...r('nik')} />
              <Input label="No. Kartu Keluarga (KK)" placeholder="16 digit" {...r('noKK')} />
              <Input label="NISN" placeholder="10 digit" {...r('nisn')} />
              <Input label="NIP" placeholder="18 digit" {...r('nip')} />
              <Input label="NUPTK" placeholder="16 digit" {...r('nuptk')} />
            </div>
          </Section>

          {/* SEKOLAH ASAL */}
          <Section title="Sekolah Asal">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nama Sekolah Asal (MTs/SMP)" {...r('namaSekolahAsal')} />
              <div className="sm:col-span-2">
                <Input label="Alamat Sekolah Asal" {...r('alamatSekolahAsal')} />
              </div>
            </div>
          </Section>

          {/* DATA KELUARGA */}
          <Section title="Data Keluarga">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Anak Ke-" type="number" placeholder="1" {...r('anakKe')} />
              <Input label="Jumlah Saudara Kandung" type="number" placeholder="0" {...r('jumlahSaudaraKandung')} />
              <Select label="Jenis Tinggal" options={TINGGAL_OPTIONS} placeholder="Pilih..." {...r('jenisTinggal')} />
              <Select label="Alat Transportasi" options={TRANSPORTASI_OPTIONS} placeholder="Pilih..." {...r('alatTransportasi')} />
              <Input label="Jarak ke Sekolah (Km)" type="number" placeholder="0" {...r('jarakKeSekolah')} />
            </div>
          </Section>

          {/* KONTAK */}
          <Section title="Kontak">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="No. Telepon / HP" placeholder="08xxxxxxxxxx" {...r('noTelepon')} />
              <Input label="No. WhatsApp" placeholder="08xxxxxxxxxx" {...r('noWa')} />
              <Input label="No. Telp Rumah" placeholder="opsional" {...r('noTelpRumah')} />
            </div>
          </Section>

          {/* ALAMAT */}
          <Section title="Alamat">
            <div className="space-y-4">
              <Input label="Alamat Lengkap (Jl/Dusun/RT/RW)" {...r('alamat')} />
              <Controller
                control={form.control} name="wilayah"
                render={({ field }) => (
                  <WilayahAutocomplete
                    value={field.value as WilayahValue}
                    onChange={field.onChange}
                  />
                )}
              />
              <Input label="Kode Pos" placeholder="5 digit" {...r('kodePos')} />
            </div>
          </Section>

          {/* BANTUAN SOSIAL */}
          <Section title="Bantuan Sosial (KIP/PKH)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 sm:col-span-2">
                <input type="checkbox" id="penerimaKIP" {...r('penerimaKIP')}
                  className="w-4 h-4 rounded accent-emerald-600" />
                <label htmlFor="penerimaKIP" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  Penerima KIP / PKH
                </label>
              </div>
              {penerimaKIP && <Input label="Nomor KIP/PKH" {...r('nomorKIP')} />}
            </div>
          </Section>

          {/* DATA FISIK */}
          <Section title="Data Fisik">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select label="Gol. Darah" options={BLOOD_OPTIONS} placeholder="Pilih..." {...r('bloodType')} />
              <Input label="Tinggi Badan (cm)" type="number" {...r('tinggi')} />
              <Input label="Berat Badan (kg)" type="number" {...r('berat')} />
            </div>
          </Section>

          {/* DATA AYAH */}
          <Section title="Data Orang Tua — Ayah">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nama Ayah" {...r('namaAyah')} />
              <Input label="NIK Ayah" placeholder="16 digit" {...r('nikAyah')} />
              <Input label="Pekerjaan Ayah" {...r('pekerjaanAyah')} />
              <Select label="Pendidikan Ayah" options={PENDIDIKAN_OPTIONS} placeholder="Pilih..." {...r('pendidikanAyah')} />
              <Input label="Penghasilan Ayah / bulan" placeholder="Rp" {...r('penghasilanAyah')} />
            </div>
          </Section>

          {/* DATA IBU */}
          <Section title="Data Orang Tua — Ibu">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nama Ibu" {...r('namaIbu')} />
              <Input label="NIK Ibu" placeholder="16 digit" {...r('nikIbu')} />
              <Input label="Pekerjaan Ibu" {...r('pekerjaanIbu')} />
              <Select label="Pendidikan Ibu" options={PENDIDIKAN_OPTIONS} placeholder="Pilih..." {...r('pendidikanIbu')} />
              <Input label="Penghasilan Ibu / bulan" placeholder="Rp" {...r('penghasilanIbu')} />
            </div>
          </Section>

          {/* DATA WALI */}
          <Section title="Data Wali (opsional — jika tidak tinggal dengan orang tua)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nama Wali" {...r('namaWali')} />
              <Input label="NIK Wali" placeholder="16 digit" {...r('nikWali')} />
              <Input label="Hubungan dengan Siswa" placeholder="Kakek, Paman, dll" {...r('hubunganWali')} />
              <Input label="No. Telp / WA Wali" {...r('noTelpWali')} />
              <Input label="Pekerjaan Wali" {...r('pekerjaanWali')} />
              <Select label="Pendidikan Wali" options={PENDIDIKAN_OPTIONS} placeholder="Pilih..." {...r('pendidikanWali')} />
              <Input label="Penghasilan Wali / bulan" placeholder="Rp" {...r('penghasilanWali')} />
            </div>
          </Section>

          {/* UPLOAD DOKUMEN */}
          <Section title="Dokumen">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FileUpload
                label="Akta Kelahiran"
                hint="PDF / JPG / PNG, maks 5MB"
                currentKey={form.watch('aktaKey')}
                onUpload={uploadApi.biodataAkta}
                onSuccess={(key) => form.setValue('aktaKey', key)}
              />
              <FileUpload
                label="Kartu Keluarga (KK)"
                hint="PDF / JPG / PNG, maks 5MB"
                currentKey={form.watch('kkKey')}
                onUpload={uploadApi.biodataKK}
                onSuccess={(key) => form.setValue('kkKey', key)}
              />
              {penerimaKIP && (
                <FileUpload
                  label="Kartu KIP / PKH"
                  hint="PDF / JPG / PNG, maks 5MB"
                  currentKey={form.watch('kipKey')}
                  onUpload={uploadApi.biodataKIP}
                  onSuccess={(key) => form.setValue('kipKey', key)}
                />
              )}
            </div>
          </Section>

        </div>

        <ModalFooter>
          <Button variant="secondary" type="button" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button type="submit" loading={isPending || (isEdit && loadingDetail)}>
            {isEdit ? 'Simpan Perubahan' : 'Buat Pengguna'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800/70 pt-3">
        {title}
      </p>
      {children}
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2.5 space-y-0.5">
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{value}</p>
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 px-4 py-3">
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
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

Yang baru:
  ✅ Dropdown kelurahan — tampilkan nama kecamatan + kabupaten
  ✅ Cache in-memory — tidak fetch ulang data yang sama
  ✅ FileUpload component — drag & drop, progress, uploaded state
  ✅ upload.api.ts — helper upload private file
  ✅ UserFormModal — section Dokumen (akta, KK, KIP muncul jika penerimaKIP ✓)

npm run dev → test form lengkap
""")

if __name__ == "__main__":
    print("🚀 Fix Wilayah Dropdown + Upload Dokumen\n")
    write_files(files, BASE)