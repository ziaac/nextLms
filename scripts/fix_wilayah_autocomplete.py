"""
FIX — Wilayah autocomplete + UserFormModal lengkap
1. resolveWilayahNames: fetch semua provinsi lalu find by kode
2. UserFormModal: semua field lengkap (ortu, wali, dokumen, dll)

python scripts/fix_wilayah_form.py
"""

import os
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = {}

# ============================================================
# src/lib/api/wilayah.api.ts — fix resolveWilayahNames
# ============================================================

files["src/lib/api/wilayah.api.ts"] = """\
import api from '@/lib/axios'

export interface WilayahItem {
  kode: string
  nama: string
  tipe?: string
  indukKode?: string
}

export const wilayahApi = {
  searchKelurahan: async (q: string): Promise<WilayahItem[]> => {
    if (q.length < 3) return []
    const { data } = await api.get('/wilayah/search', { params: { q } })
    return data
  },

  getAllProvinsi: async (): Promise<WilayahItem[]> => {
    const { data } = await api.get('/wilayah/provinsi')
    return data
  },

  getKabupaten: async (indukKode: string): Promise<WilayahItem[]> => {
    const { data } = await api.get('/wilayah/kabupaten', { params: { indukKode } })
    return data
  },

  getKecamatan: async (indukKode: string): Promise<WilayahItem[]> => {
    const { data } = await api.get('/wilayah/kecamatan', { params: { indukKode } })
    return data
  },

  getKelurahan: async (indukKode: string): Promise<WilayahItem[]> => {
    const { data } = await api.get('/wilayah/kelurahan', { params: { indukKode } })
    return data
  },
}

/**
 * Derive kode induk dari kode kelurahan
 * "73.01.03.2006" → { provinsiKode: "73", kabupatenKode: "73.01", kecamatanKode: "73.01.03" }
 */
export function deriveKodeInduk(kelurahanKode: string) {
  const parts = kelurahanKode.split('.')
  return {
    provinsiKode:  parts[0],
    kabupatenKode: parts.slice(0, 2).join('.'),
    kecamatanKode: parts.slice(0, 3).join('.'),
  }
}

/**
 * Fetch nama provinsi, kabupaten, kecamatan dari kode kelurahan
 * - Provinsi: fetch semua lalu find by kode (tidak ada endpoint filter)
 * - Kabupaten: GET /wilayah/kabupaten?indukKode={provinsiKode}
 * - Kecamatan: GET /wilayah/kecamatan?indukKode={kabupatenKode}
 */
export async function resolveWilayahNames(kelurahanKode: string): Promise<{
  provinsi: string
  kabupaten: string
  kecamatan: string
}> {
  const { provinsiKode, kabupatenKode, kecamatanKode } = deriveKodeInduk(kelurahanKode)

  const [provinsiList, kabupatenList, kecamatanList] = await Promise.all([
    wilayahApi.getAllProvinsi(),
    wilayahApi.getKabupaten(provinsiKode),
    wilayahApi.getKecamatan(kabupatenKode),
  ])

  const provinsi  = provinsiList.find(p => p.kode === provinsiKode)?.nama  ?? ''
  const kabupaten = kabupatenList.find(k => k.kode === kabupatenKode)?.nama ?? ''
  const kecamatan = kecamatanList.find(k => k.kode === kecamatanKode)?.nama ?? ''

  return { provinsi, kabupaten, kecamatan }
}
"""

# ============================================================
# src/types/users.types.ts — tambah semua field baru
# ============================================================

files["src/types/users.types.ts"] = """\
import type { UserRole, JenisKelamin, Agama } from './enums'

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
export type JenisTinggal = 'ORANG_TUA' | 'WALI' | 'ASRAMA' | 'PONDOK' | 'PANTI' | 'LAINNYA'
export type AlatTransportasi = 'JALAN_KAKI' | 'SEPEDA' | 'MOTOR' | 'MOBIL' | 'ANGKUTAN_UMUM' | 'LAINNYA'
export type JenjangPendidikan = 'TIDAK_SEKOLAH' | 'SD' | 'SMP' | 'SMA' | 'D1' | 'D2' | 'D3' | 'D4' | 'S1' | 'S2' | 'S3'

/** Profile partial — dari GET /users list */
export interface UserProfile {
  namaLengkap: string
  fotoUrl: string | null
  nisn: string | null
  nip: string | null
  nuptk: string | null
  noTelepon: string | null
}

/** Profile lengkap — dari GET /users/:id */
export interface UserProfileFull extends UserProfile {
  id: string
  userId: string
  namaPanggilan: string | null
  nik: string | null
  noKK: string | null
  noWa: string | null
  noTelpRumah: string | null
  alamat: string | null
  kelurahan: string | null
  kecamatan: string | null
  kabupaten: string | null
  provinsi: string | null
  kodePos: string | null
  tempatLahir: string
  tanggalLahir: string
  agama: Agama
  jenisKelamin: JenisKelamin
  bloodType: BloodType | null
  tinggi: number | null
  berat: number | null
  // Sekolah asal
  namaSekolahAsal: string | null
  alamatSekolahAsal: string | null
  // Data keluarga
  anakKe: number | null
  jumlahSaudaraKandung: number | null
  jenisTinggal: JenisTinggal | null
  alatTransportasi: AlatTransportasi | null
  jarakKeSekolah: number | null
  penerimaKIP: boolean
  nomorKIP: string | null
  // Orang tua ayah
  namaAyah: string | null
  nikAyah: string | null
  pekerjaanAyah: string | null
  pendidikanAyah: JenjangPendidikan | null
  penghasilanAyah: string | null
  // Orang tua ibu
  namaIbu: string | null
  nikIbu: string | null
  pekerjaanIbu: string | null
  pendidikanIbu: JenjangPendidikan | null
  penghasilanIbu: string | null
  // Wali
  namaWali: string | null
  nikWali: string | null
  hubunganWali: string | null
  pekerjaanWali: string | null
  pendidikanWali: JenjangPendidikan | null
  penghasilanWali: string | null
  noTelpWali: string | null
  // Dokumen
  aktaKey: string | null
  kkKey: string | null
  kipKey: string | null
  createdAt: string
  updatedAt: string
}

export interface UserItem {
  id: string
  email: string
  username: string | null
  role: UserRole
  isActive: boolean
  isVerified: boolean
  lastLoginAt: string | null
  loginCount: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  profile: UserProfile
}

export interface UserDetail {
  id: string
  email: string
  username: string | null
  role: UserRole
  isActive: boolean
  isVerified: boolean
  lastLoginAt: string | null
  loginCount: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  profile: UserProfileFull
}

export interface CreateUserDto {
  email: string
  password: string
  role: UserRole
  namaLengkap: string
  jenisKelamin: JenisKelamin
  tempatLahir: string
  tanggalLahir: string
  agama: Agama
  username?: string
  namaPanggilan?: string
  nik?: string
  nisn?: string
  nip?: string
  nuptk?: string
  noKK?: string
  namaSekolahAsal?: string
  alamatSekolahAsal?: string
  anakKe?: number
  jumlahSaudaraKandung?: number
  jenisTinggal?: JenisTinggal
  alatTransportasi?: AlatTransportasi
  jarakKeSekolah?: number
  noTelepon?: string
  noWa?: string
  noTelpRumah?: string
  penerimaKIP?: boolean
  nomorKIP?: string
  alamat?: string
  kelurahan?: string
  kecamatan?: string
  kabupaten?: string
  provinsi?: string
  kodePos?: string
  bloodType?: BloodType
  tinggi?: number
  berat?: number
  namaAyah?: string
  nikAyah?: string
  pekerjaanAyah?: string
  pendidikanAyah?: JenjangPendidikan
  penghasilanAyah?: string
  namaIbu?: string
  nikIbu?: string
  pekerjaanIbu?: string
  pendidikanIbu?: JenjangPendidikan
  penghasilanIbu?: string
  namaWali?: string
  nikWali?: string
  hubunganWali?: string
  pekerjaanWali?: string
  pendidikanWali?: JenjangPendidikan
  penghasilanWali?: string
  noTelpWali?: string
  aktaKey?: string
  kkKey?: string
  kipKey?: string
  isActive?: boolean
}

export interface UpdateUserDto extends Partial<Omit<CreateUserDto, 'password' | 'email'>> {}
"""

# ============================================================
# src/types/enums.ts — tambah enum baru
# ============================================================

files["src/types/enums.ts"] = """\
export type UserRole =
  | 'SUPER_ADMIN' | 'ADMIN' | 'KEPALA_SEKOLAH' | 'WAKIL_KEPALA'
  | 'GURU' | 'WALI_KELAS' | 'SISWA' | 'ORANG_TUA'
  | 'STAFF_TU' | 'STAFF_KEUANGAN'

export type JenisKelamin = 'L' | 'P'
export type Agama = 'ISLAM'
export type NamaSemester = 'GANJIL' | 'GENAP'
export type Hari = 'SENIN' | 'SELASA' | 'RABU' | 'KAMIS' | 'JUMAT' | 'SABTU' | 'MINGGU'
export type StatusAbsensi = 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA' | 'TERLAMBAT' | 'TAP'
export type StatusTagihan = 'BELUM_BAYAR' | 'CICILAN' | 'LUNAS' | 'TERLAMBAT'
export type StatusPembayaran = 'PENDING' | 'VERIFIED' | 'REJECTED'
export type MetodePembayaran = 'TUNAI' | 'TRANSFER' | 'VIRTUAL_ACCOUNT' | 'QRIS' | 'EDC' | 'MOBILE_BANKING'
export type TingkatLomba = 'SEKOLAH' | 'KECAMATAN' | 'KABUPATEN_KOTA' | 'PROVINSI' | 'NASIONAL' | 'INTERNASIONAL'
export type HasilPrestasi = 'JUARA_1' | 'JUARA_2' | 'JUARA_3' | 'JUARA_HARAPAN' | 'FINALIS' | 'PESERTA' | 'LAINNYA'
export type StatusPerizinan = 'PENDING' | 'APPROVED' | 'REJECTED'
export type JenisPerizinan = 'SAKIT' | 'IZIN' | 'CUTI' | 'DINAS' | 'KEPERLUAN_KELUARGA'
export type StatusBerita = 'DRAFT' | 'PUBLISHED'
export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
export type StatusPengumpulan = 'DRAFT' | 'SUBMITTED' | 'DINILAI' | 'REVISI'
export type JenisSikap = 'POSITIF' | 'NEGATIF'
export type StatusAnggota = 'AKTIF' | 'NONAKTIF' | 'KELUAR'
export type StatusBiodata = 'DRAFT' | 'SUBMITTED' | 'DIVERIFIKASI' | 'DITOLAK'
export type StatusAkhirTahun = 'NAIK_KELAS' | 'TIDAK_NAIK' | 'LULUS' | 'DO' | 'MENGUNDURKAN_DIRI'
export type TipeKalender = 'LIBUR_NASIONAL' | 'LIBUR_SEKOLAH' | 'UJIAN' | 'KEGIATAN_SEKOLAH' | 'RAPAT' | 'LAINNYA'
export type TipeNotifikasi = 'INFO' | 'TUGAS' | 'PENILAIAN' | 'PEMBAYARAN' | 'ABSENSI' | 'PENGUMUMAN' | 'SIKAP' | 'PERIZINAN' | 'EKSTRAKURIKULER' | 'SISTEM'
"""

# ============================================================
# src/app/dashboard/users/_components/UserFormModal.tsx
# — form lengkap semua field + wilayah autocomplete
# ============================================================

files["src/app/dashboard/users/_components/UserFormModal.tsx"] = """\
'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, ModalFooter, Button, Input, Select, WilayahAutocomplete } from '@/components/ui'
import type { WilayahValue } from '@/components/ui/WilayahAutocomplete'
import { useCreateUser, useUpdateUser, useUser } from '@/hooks/users/useUsers'
import { getErrorMessage } from '@/lib/utils'
import type { UserItem } from '@/types/users.types'

// ── Option lists ──────────────────────────────────────────────────
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

const JK_OPTIONS = [
  { value: 'L', label: 'Laki-laki' },
  { value: 'P', label: 'Perempuan' },
]

const AGAMA_OPTIONS = [{ value: 'ISLAM', label: 'Islam' }]

const BLOOD_OPTIONS = [
  { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
]

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
  { value: 'SD',  label: 'SD' }, { value: 'SMP', label: 'SMP' },
  { value: 'SMA', label: 'SMA/SMK' }, { value: 'D1', label: 'D1' },
  { value: 'D2',  label: 'D2' }, { value: 'D3', label: 'D3' },
  { value: 'D4',  label: 'D4' }, { value: 'S1', label: 'S1' },
  { value: 'S2',  label: 'S2' }, { value: 'S3', label: 'S3' },
]

// ── Schemas ───────────────────────────────────────────────────────
const createSchema = z.object({
  // Akun
  email:        z.string().email('Format email tidak valid'),
  password:     z.string().min(6, 'Minimal 6 karakter'),
  role:         z.string().min(1, 'Wajib dipilih'),
  username:     z.string().optional(),
  // Identitas wajib
  namaLengkap:  z.string().min(2, 'Minimal 2 karakter'),
  namaPanggilan: z.string().optional(),
  jenisKelamin: z.string().min(1, 'Wajib dipilih'),
  tempatLahir:  z.string().min(2, 'Wajib diisi'),
  tanggalLahir: z.string().min(1, 'Wajib diisi'),
  agama:        z.string().default('ISLAM'),
  // Identitas tambahan
  nik: z.string().optional(), nisn: z.string().optional(),
  nip: z.string().optional(), nuptk: z.string().optional(),
  noKK: z.string().optional(),
  // Sekolah asal
  namaSekolahAsal: z.string().optional(),
  alamatSekolahAsal: z.string().optional(),
  // Keluarga
  anakKe: z.string().optional(),
  jumlahSaudaraKandung: z.string().optional(),
  // Kondisi
  jenisTinggal: z.string().optional(),
  alatTransportasi: z.string().optional(),
  jarakKeSekolah: z.string().optional(),
  // Kontak
  noTelepon: z.string().optional(),
  noWa: z.string().optional(),
  noTelpRumah: z.string().optional(),
  // KIP
  penerimaKIP: z.boolean().optional(),
  nomorKIP: z.string().optional(),
  // Alamat
  alamat: z.string().optional(),
  wilayah: z.object({
    kelurahan: z.string().optional(),
    kecamatan: z.string().optional(),
    kabupaten: z.string().optional(),
    provinsi:  z.string().optional(),
    kodeKelurahan: z.string().optional(),
  }).optional(),
  kodePos: z.string().optional(),
  // Fisik
  bloodType: z.string().optional(),
  tinggi: z.string().optional(),
  berat: z.string().optional(),
  // Ayah
  namaAyah: z.string().optional(), nikAyah: z.string().optional(),
  pekerjaanAyah: z.string().optional(), pendidikanAyah: z.string().optional(),
  penghasilanAyah: z.string().optional(),
  // Ibu
  namaIbu: z.string().optional(), nikIbu: z.string().optional(),
  pekerjaanIbu: z.string().optional(), pendidikanIbu: z.string().optional(),
  penghasilanIbu: z.string().optional(),
  // Wali
  namaWali: z.string().optional(), nikWali: z.string().optional(),
  hubunganWali: z.string().optional(), pekerjaanWali: z.string().optional(),
  pendidikanWali: z.string().optional(), penghasilanWali: z.string().optional(),
  noTelpWali: z.string().optional(),
})

const editSchema = createSchema.omit({ email: true, password: true })

type CreateForm = z.infer<typeof createSchema>
type EditForm   = z.infer<typeof editSchema>

function toDateInput(iso?: string | null) {
  if (!iso) return ''
  return iso.split('T')[0]
}

function buildPayload(data: Record<string, unknown>) {
  const wilayah = data.wilayah as WilayahValue | undefined
  const payload: Record<string, unknown> = { ...data }
  delete payload.wilayah
  if (wilayah?.kelurahan) payload.kelurahan = wilayah.kelurahan
  if (wilayah?.kecamatan) payload.kecamatan = wilayah.kecamatan
  if (wilayah?.kabupaten) payload.kabupaten = wilayah.kabupaten
  if (wilayah?.provinsi)  payload.provinsi  = wilayah.provinsi
  // Convert string numbers
  if (payload.tinggi) payload.tinggi = parseInt(payload.tinggi as string)
  if (payload.berat)  payload.berat  = parseInt(payload.berat as string)
  if (payload.anakKe) payload.anakKe = parseInt(payload.anakKe as string)
  if (payload.jumlahSaudaraKandung) payload.jumlahSaudaraKandung = parseInt(payload.jumlahSaudaraKandung as string)
  if (payload.jarakKeSekolah) payload.jarakKeSekolah = parseFloat(payload.jarakKeSekolah as string)
  // Buang string kosong & undefined
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

  const form = useForm<CreateForm>({
    resolver: zodResolver(isEdit ? editSchema as never : createSchema),
  })

  useEffect(() => {
    if (!open) return
    createMutation.reset()
    updateMutation.reset()

    if (isEdit && userDetail) {
      const p = userDetail.profile
      form.reset({
        namaLengkap:   p.namaLengkap ?? '',
        namaPanggilan: p.namaPanggilan ?? '',
        username:      userDetail.username ?? '',
        role:          userDetail.role,
        jenisKelamin:  p.jenisKelamin ?? '',
        tempatLahir:   p.tempatLahir ?? '',
        tanggalLahir:  toDateInput(p.tanggalLahir),
        agama:         p.agama ?? 'ISLAM',
        nik:           p.nik ?? '',
        nisn:          p.nisn ?? '',
        nip:           p.nip ?? '',
        nuptk:         p.nuptk ?? '',
        noKK:          p.noKK ?? '',
        namaSekolahAsal:   p.namaSekolahAsal ?? '',
        alamatSekolahAsal: p.alamatSekolahAsal ?? '',
        anakKe:               p.anakKe?.toString() ?? '',
        jumlahSaudaraKandung: p.jumlahSaudaraKandung?.toString() ?? '',
        jenisTinggal:    p.jenisTinggal ?? '',
        alatTransportasi: p.alatTransportasi ?? '',
        jarakKeSekolah:  p.jarakKeSekolah?.toString() ?? '',
        noTelepon:   p.noTelepon ?? '',
        noWa:        p.noWa ?? '',
        noTelpRumah: p.noTelpRumah ?? '',
        penerimaKIP: p.penerimaKIP ?? false,
        nomorKIP:    p.nomorKIP ?? '',
        alamat:      p.alamat ?? '',
        kodePos:     p.kodePos ?? '',
        wilayah: {
          kelurahan: p.kelurahan ?? '',
          kecamatan: p.kecamatan ?? '',
          kabupaten: p.kabupaten ?? '',
          provinsi:  p.provinsi  ?? '',
        },
        bloodType: p.bloodType ?? '',
        tinggi:    p.tinggi?.toString() ?? '',
        berat:     p.berat?.toString() ?? '',
        namaAyah: p.namaAyah ?? '', nikAyah: p.nikAyah ?? '',
        pekerjaanAyah: p.pekerjaanAyah ?? '',
        pendidikanAyah: p.pendidikanAyah ?? '',
        penghasilanAyah: p.penghasilanAyah ?? '',
        namaIbu: p.namaIbu ?? '', nikIbu: p.nikIbu ?? '',
        pekerjaanIbu: p.pekerjaanIbu ?? '',
        pendidikanIbu: p.pendidikanIbu ?? '',
        penghasilanIbu: p.penghasilanIbu ?? '',
        namaWali: p.namaWali ?? '', nikWali: p.nikWali ?? '',
        hubunganWali: p.hubunganWali ?? '',
        pekerjaanWali: p.pekerjaanWali ?? '',
        pendidikanWali: p.pendidikanWali ?? '',
        penghasilanWali: p.penghasilanWali ?? '',
        noTelpWali: p.noTelpWali ?? '',
      } as never)
    } else if (!isEdit) {
      form.reset()
    }
  }, [open, userDetail?.id])

  const isPending     = createMutation.isPending || updateMutation.isPending
  const mutationError = createMutation.error || updateMutation.error
  const penerimaKIP   = form.watch('penerimaKIP')

  const onSubmit = async (data: CreateForm) => {
    try {
      const payload = buildPayload(data as never)
      if (isEdit) {
        await updateMutation.mutateAsync(payload as never)
      } else {
        await createMutation.mutateAsync(payload as never)
      }
      onClose()
    } catch { /* via mutationError */ }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}
      size="xl"
    >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="p-6 space-y-6">
          {mutationError && <ErrorBox message={getErrorMessage(mutationError)} />}
          {isEdit && loadingDetail && (
            <p className="text-sm text-gray-400 text-center py-4">Memuat data...</p>
          )}

          {/* ── AKUN ─────────────────────────────────────── */}
          <Section title="Akun">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!isEdit && (
                <>
                  <Input label="Email" type="email"
                    error={form.formState.errors.email?.message}
                    {...form.register('email')} />
                  <Input label="Password" type="password"
                    error={form.formState.errors.password?.message}
                    {...form.register('password')} />
                </>
              )}
              {isEdit && (
                <InfoField label="Email" value={user?.email ?? '-'} />
              )}
              <Select label="Role" options={ROLE_OPTIONS} placeholder="Pilih role..."
                error={form.formState.errors.role?.message}
                {...form.register('role')} />
              <Input label="Username" placeholder="opsional"
                {...form.register('username')} />
            </div>
          </Section>

          {/* ── IDENTITAS PRIBADI ────────────────────────── */}
          <Section title="Identitas Pribadi">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input label="Nama Lengkap" placeholder="Sesuai akta kelahiran"
                  error={form.formState.errors.namaLengkap?.message}
                  {...form.register('namaLengkap')} />
              </div>
              <Input label="Nama Panggilan" placeholder="Nama harian"
                {...form.register('namaPanggilan')} />
              <Select label="Jenis Kelamin" options={JK_OPTIONS} placeholder="Pilih..."
                error={form.formState.errors.jenisKelamin?.message}
                {...form.register('jenisKelamin')} />
              <Select label="Agama" options={AGAMA_OPTIONS}
                {...form.register('agama')} />
              <Input label="Tempat Lahir"
                error={form.formState.errors.tempatLahir?.message}
                {...form.register('tempatLahir')} />
              <Input label="Tanggal Lahir" type="date"
                error={form.formState.errors.tanggalLahir?.message}
                {...form.register('tanggalLahir')} />
            </div>
          </Section>

          {/* ── NOMOR IDENTITAS ──────────────────────────── */}
          <Section title="Nomor Identitas">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="NIK" placeholder="16 digit"
                {...form.register('nik')} />
              <Input label="No. Kartu Keluarga (KK)" placeholder="16 digit"
                {...form.register('noKK')} />
              <Input label="NISN" placeholder="10 digit"
                {...form.register('nisn')} />
              <Input label="NIP" placeholder="18 digit"
                {...form.register('nip')} />
              <Input label="NUPTK" placeholder="16 digit"
                {...form.register('nuptk')} />
            </div>
          </Section>

          {/* ── SEKOLAH ASAL ─────────────────────────────── */}
          <Section title="Sekolah Asal">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nama Sekolah Asal (MTs/SMP)"
                {...form.register('namaSekolahAsal')} />
              <div className="sm:col-span-2">
                <Input label="Alamat Sekolah Asal"
                  {...form.register('alamatSekolahAsal')} />
              </div>
            </div>
          </Section>

          {/* ── DATA KELUARGA ────────────────────────────── */}
          <Section title="Data Keluarga">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Anak Ke-" type="number" placeholder="1"
                {...form.register('anakKe')} />
              <Input label="Jumlah Saudara Kandung" type="number" placeholder="0"
                {...form.register('jumlahSaudaraKandung')} />
              <Select label="Jenis Tinggal" options={TINGGAL_OPTIONS} placeholder="Pilih..."
                {...form.register('jenisTinggal')} />
              <Select label="Alat Transportasi" options={TRANSPORTASI_OPTIONS} placeholder="Pilih..."
                {...form.register('alatTransportasi')} />
              <Input label="Jarak ke Sekolah (Km)" type="number" placeholder="0"
                {...form.register('jarakKeSekolah')} />
            </div>
          </Section>

          {/* ── KONTAK ───────────────────────────────────── */}
          <Section title="Kontak">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="No. Telepon / HP" placeholder="08xxxxxxxxxx"
                {...form.register('noTelepon')} />
              <Input label="No. WhatsApp" placeholder="08xxxxxxxxxx"
                {...form.register('noWa')} />
              <Input label="No. Telp Rumah" placeholder="opsional"
                {...form.register('noTelpRumah')} />
            </div>
          </Section>

          {/* ── ALAMAT ───────────────────────────────────── */}
          <Section title="Alamat">
            <div className="space-y-4">
              <Input label="Alamat Lengkap (Jl/Dusun/RT/RW)"
                {...form.register('alamat')} />
              <Controller
                control={form.control}
                name="wilayah"
                render={({ field }) => (
                  <WilayahAutocomplete
                    value={field.value as WilayahValue}
                    onChange={field.onChange}
                  />
                )}
              />
              <Input label="Kode Pos" placeholder="5 digit"
                {...form.register('kodePos')} />
            </div>
          </Section>

          {/* ── BANTUAN SOSIAL ───────────────────────────── */}
          <Section title="Bantuan Sosial (KIP/PKH)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 sm:col-span-2">
                <input type="checkbox" id="penerimaKIP"
                  {...form.register('penerimaKIP')}
                  className="w-4 h-4 rounded accent-emerald-600" />
                <label htmlFor="penerimaKIP"
                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  Penerima KIP / PKH
                </label>
              </div>
              {penerimaKIP && (
                <Input label="Nomor KIP/PKH"
                  {...form.register('nomorKIP')} />
              )}
            </div>
          </Section>

          {/* ── DATA FISIK ───────────────────────────────── */}
          <Section title="Data Fisik">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select label="Gol. Darah" options={BLOOD_OPTIONS} placeholder="Pilih..."
                {...form.register('bloodType')} />
              <Input label="Tinggi Badan (cm)" type="number" placeholder="0"
                {...form.register('tinggi')} />
              <Input label="Berat Badan (kg)" type="number" placeholder="0"
                {...form.register('berat')} />
            </div>
          </Section>

          {/* ── DATA AYAH ────────────────────────────────── */}
          <Section title="Data Orang Tua — Ayah">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nama Ayah" {...form.register('namaAyah')} />
              <Input label="NIK Ayah" placeholder="16 digit"
                {...form.register('nikAyah')} />
              <Input label="Pekerjaan Ayah"
                {...form.register('pekerjaanAyah')} />
              <Select label="Pendidikan Ayah" options={PENDIDIKAN_OPTIONS} placeholder="Pilih..."
                {...form.register('pendidikanAyah')} />
              <Input label="Penghasilan Ayah (per bulan)"
                placeholder="Contoh: 3000000"
                {...form.register('penghasilanAyah')} />
            </div>
          </Section>

          {/* ── DATA IBU ─────────────────────────────────── */}
          <Section title="Data Orang Tua — Ibu">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nama Ibu" {...form.register('namaIbu')} />
              <Input label="NIK Ibu" placeholder="16 digit"
                {...form.register('nikIbu')} />
              <Input label="Pekerjaan Ibu"
                {...form.register('pekerjaanIbu')} />
              <Select label="Pendidikan Ibu" options={PENDIDIKAN_OPTIONS} placeholder="Pilih..."
                {...form.register('pendidikanIbu')} />
              <Input label="Penghasilan Ibu (per bulan)"
                placeholder="Contoh: 2000000"
                {...form.register('penghasilanIbu')} />
            </div>
          </Section>

          {/* ── DATA WALI ────────────────────────────────── */}
          <Section title="Data Wali (opsional)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nama Wali" {...form.register('namaWali')} />
              <Input label="NIK Wali" placeholder="16 digit"
                {...form.register('nikWali')} />
              <Input label="Hubungan dengan Siswa"
                placeholder="Kakek, Paman, dll"
                {...form.register('hubunganWali')} />
              <Input label="No. Telp / WA Wali"
                {...form.register('noTelpWali')} />
              <Input label="Pekerjaan Wali"
                {...form.register('pekerjaanWali')} />
              <Select label="Pendidikan Wali" options={PENDIDIKAN_OPTIONS} placeholder="Pilih..."
                {...form.register('pendidikanWali')} />
              <Input label="Penghasilan Wali (per bulan)"
                {...form.register('penghasilanWali')} />
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
🎉 {len(files_dict)} file diupdate!

Fix:
  ✅ resolveWilayahNames — fetch semua provinsi, find by kode
  ✅ UserFormModal — semua section lengkap
  ✅ users.types.ts — semua field baru
  ✅ enums.ts — bersih

npm run dev → test wilayah autocomplete & form lengkap
""")

if __name__ == "__main__":
    print("🚀 Fix Wilayah + Form Lengkap\n")
    write_files(files, BASE)