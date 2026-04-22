"""
FIX — Sesuaikan types dengan struktur response backend (nested profile)
+ Form edit lengkap semua field yang tersedia

Cara pakai:
  python scripts/fix_users_complete.py
"""

import os
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = {}

# ============================================================
# src/types/users.types.ts — sesuai response backend aktual
# ============================================================

files["src/types/users.types.ts"] = """\
import type { UserRole, JenisKelamin, Agama } from './enums'

/** Profile nested — dari GET /users (list, partial) */
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
  nik: string | null
  noWa: string | null
  alamat: string | null
  tempatLahir: string
  tanggalLahir: string
  agama: Agama
  jenisKelamin: JenisKelamin
  kelurahan: string | null
  kecamatan: string | null
  kabupaten: string | null
  provinsi: string | null
  kodePos: string | null
  createdAt: string
  updatedAt: string
}

/** Item di list GET /users */
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

/** Detail dari GET /users/:id atau PUT /users/:id */
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

/** POST /users */
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
  nik?: string
  nisn?: string
  nip?: string
  nuptk?: string
  noTelepon?: string
  noWa?: string
  alamat?: string
  isActive?: boolean
}

/** PUT /users/:id — semua optional kecuali yang wajib */
export interface UpdateUserDto {
  namaLengkap?: string
  username?: string
  jenisKelamin?: JenisKelamin
  tempatLahir?: string
  tanggalLahir?: string
  agama?: Agama
  nik?: string
  nisn?: string
  nip?: string
  nuptk?: string
  noTelepon?: string
  noWa?: string
  alamat?: string
  isActive?: boolean
}
"""

# ============================================================
# src/types/enums.ts — tambah JenisKelamin & Agama yang benar
# ============================================================

files["src/types/enums.ts"] = """\
export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'KEPALA_SEKOLAH'
  | 'WAKIL_KEPALA'
  | 'GURU'
  | 'WALI_KELAS'
  | 'SISWA'
  | 'ORANG_TUA'
  | 'STAFF_TU'
  | 'STAFF_KEUANGAN'

export type JenisKelamin = 'L' | 'P'

export type Agama = 'ISLAM'

export type NamaSemester = 'GANJIL' | 'GENAP'

export type Hari =
  | 'SENIN' | 'SELASA' | 'RABU' | 'KAMIS'
  | 'JUMAT' | 'SABTU' | 'MINGGU'

export type StatusAbsensi =
  | 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA' | 'TERLAMBAT' | 'TAP'

export type StatusTagihan =
  | 'BELUM_BAYAR' | 'CICILAN' | 'LUNAS' | 'TERLAMBAT'

export type StatusPembayaran = 'PENDING' | 'VERIFIED' | 'REJECTED'

export type MetodePembayaran =
  | 'TUNAI' | 'TRANSFER' | 'VIRTUAL_ACCOUNT'
  | 'QRIS' | 'EDC' | 'MOBILE_BANKING'

export type TingkatLomba =
  | 'SEKOLAH' | 'KECAMATAN' | 'KABUPATEN_KOTA'
  | 'PROVINSI' | 'NASIONAL' | 'INTERNASIONAL'

export type HasilPrestasi =
  | 'JUARA_1' | 'JUARA_2' | 'JUARA_3'
  | 'JUARA_HARAPAN' | 'FINALIS' | 'PESERTA' | 'LAINNYA'

export type StatusPerizinan = 'PENDING' | 'APPROVED' | 'REJECTED'

export type JenisPerizinan =
  | 'SAKIT' | 'IZIN' | 'CUTI' | 'DINAS' | 'KEPERLUAN_KELUARGA'

export type StatusBerita = 'DRAFT' | 'PUBLISHED'

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export type StatusPengumpulan = 'DRAFT' | 'SUBMITTED' | 'DINILAI' | 'REVISI'

export type JenisSikap = 'POSITIF' | 'NEGATIF'

export type StatusAnggota = 'AKTIF' | 'NONAKTIF' | 'KELUAR'

export type StatusBiodata =
  | 'DRAFT' | 'SUBMITTED' | 'DIVERIFIKASI' | 'DITOLAK'

export type StatusAkhirTahun =
  | 'NAIK_KELAS' | 'TIDAK_NAIK' | 'LULUS' | 'DO' | 'MENGUNDURKAN_DIRI'

export type TipeKalender =
  | 'LIBUR_NASIONAL' | 'LIBUR_SEKOLAH' | 'UJIAN'
  | 'KEGIATAN_SEKOLAH' | 'RAPAT' | 'LAINNYA'

export type TipeNotifikasi =
  | 'INFO' | 'TUGAS' | 'PENILAIAN' | 'PEMBAYARAN'
  | 'ABSENSI' | 'PENGUMUMAN' | 'SIKAP' | 'PERIZINAN'
  | 'EKSTRAKURIKULER' | 'SISTEM'
"""

# ============================================================
# src/lib/api/users.api.ts — getById pakai UserDetail
# ============================================================

files["src/lib/api/users.api.ts"] = """\
import api from '@/lib/axios'
import type { PaginatedResponse, PaginationParams } from '@/types'
import type { UserItem, UserDetail, CreateUserDto, UpdateUserDto } from '@/types/users.types'

export interface UsersParams extends PaginationParams {
  role?: string
}

export const usersApi = {
  getAll: async (params?: UsersParams): Promise<PaginatedResponse<UserItem>> => {
    const { data } = await api.get('/users', { params })
    return data
  },

  getById: async (id: string): Promise<UserDetail> => {
    const { data } = await api.get(`/users/${id}`)
    return data
  },

  create: async (dto: CreateUserDto): Promise<UserDetail> => {
    const { data } = await api.post('/users', dto)
    return data
  },

  /** PUT /users/:id — backend pakai PUT bukan PATCH */
  update: async (id: string, dto: UpdateUserDto): Promise<UserDetail> => {
    const { data } = await api.put(`/users/${id}`, dto)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`)
  },

  toggleActive: async (id: string): Promise<UserDetail> => {
    const { data } = await api.patch(`/users/${id}/toggle-active`)
    return data
  },

  resetPassword: async (id: string, newPassword: string): Promise<void> => {
    await api.patch(`/users/${id}/reset-password`, { newPassword })
  },
}
"""

# ============================================================
# src/hooks/users/useUsers.ts — useUser fetch detail dulu
# ============================================================

files["src/hooks/users/useUsers.ts"] = """\
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, type UsersParams } from '@/lib/api/users.api'
import { getErrorMessage } from '@/lib/utils'
import type { CreateUserDto, UpdateUserDto } from '@/types/users.types'

export const USER_KEYS = {
  all:    ['users'] as const,
  list:   (params?: UsersParams) => ['users', 'list', params] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
}

export function useUsers(params?: UsersParams) {
  return useQuery({
    queryKey: USER_KEYS.list(params),
    queryFn:  () => usersApi.getAll(params),
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: USER_KEYS.detail(id),
    queryFn:  () => usersApi.getById(id),
    enabled:  !!id,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateUserDto) => usersApi.create(dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: USER_KEYS.all }),
  })
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateUserDto) => usersApi.update(id, dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: USER_KEYS.all }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: USER_KEYS.all }),
  })
}

export function useUserErrorMessage(error: unknown) {
  return error ? getErrorMessage(error) : null
}
"""

# ============================================================
# UserTable.tsx — baca namaLengkap dari profile
# ============================================================

files["src/app/dashboard/users/_components/UserTable.tsx"] = """\
'use client'

import { useState } from 'react'
import { Pencil, Trash2, Users } from 'lucide-react'
import { Button, Badge, Pagination, EmptyState, TableSkeleton, ConfirmModal } from '@/components/ui'
import { RoleBadge } from './UserBadge'
import { UserFormModal } from './UserFormModal'
import { useDeleteUser } from '@/hooks/users/useUsers'
import { getInitials } from '@/lib/utils'
import { getPublicFileUrl } from '@/lib/constants'
import { formatTanggalPendek } from '@/lib/helpers/timezone'
import type { UserItem } from '@/types/users.types'
import type { PaginatedResponse } from '@/types'

interface UserTableProps {
  data: PaginatedResponse<UserItem> | undefined
  isLoading: boolean
  page: number
  onPageChange: (page: number) => void
}

export function UserTable({ data, isLoading, page, onPageChange }: UserTableProps) {
  const [editUser, setEditUser] = useState<UserItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const deleteMutation = useDeleteUser()

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      setDeleteId(null)
    } catch { /* ignore */ }
  }

  if (isLoading) return <TableSkeleton rows={8} cols={5} />

  if (!data?.data?.length) {
    return (
      <EmptyState
        icon={<Users size={24} />}
        title="Belum ada pengguna"
        description="Tambahkan pengguna baru dengan tombol di atas"
      />
    )
  }

  return (
    <>
      {/* Table — desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800/70">
              {['Pengguna', 'Role', 'Status', 'Dibuat', 'Aksi'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/80 dark:divide-gray-800/50">
            {data.data.map((user) => {
              const nama    = user.profile?.namaLengkap ?? user.email
              const fotoUrl = user.profile?.fotoUrl ? getPublicFileUrl(user.profile.fotoUrl) : null
              return (
                <tr key={user.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center flex-shrink-0">
                        {fotoUrl
                          ? <img src={fotoUrl} alt={nama} className="w-full h-full object-cover" />
                          : <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{getInitials(nama)}</span>
                        }
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{nama}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{user.email}</p>
                        {user.username && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">@{user.username}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isActive ? 'success' : 'default'}>
                      {user.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">
                    {formatTanggalPendek(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" leftIcon={<Pencil size={14} />} onClick={() => setEditUser(user)}>Edit</Button>
                      <Button variant="ghost" size="sm" leftIcon={<Trash2 size={14} />} onClick={() => setDeleteId(user.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                        Hapus
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {data.data.map((user) => {
          const nama    = user.profile?.namaLengkap ?? user.email
          const fotoUrl = user.profile?.fotoUrl ? getPublicFileUrl(user.profile.fotoUrl) : null
          return (
            <div key={user.id} className="rounded-2xl bg-gray-50/80 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800/50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center flex-shrink-0">
                  {fotoUrl
                    ? <img src={fotoUrl} alt={nama} className="w-full h-full object-cover" />
                    : <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{getInitials(nama)}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{nama}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                </div>
                <RoleBadge role={user.role} />
              </div>
              <div className="flex items-center justify-between">
                <Badge variant={user.isActive ? 'success' : 'default'}>
                  {user.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" leftIcon={<Pencil size={13} />} onClick={() => setEditUser(user)}>Edit</Button>
                  <Button variant="ghost" size="sm" leftIcon={<Trash2 size={13} />} onClick={() => setDeleteId(user.id)}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">Hapus</Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Pagination
        page={page}
        totalPages={data.meta.totalPages}
        total={data.meta.total}
        limit={data.meta.limit}
        onPageChange={onPageChange}
      />

      <UserFormModal open={!!editUser} onClose={() => setEditUser(null)} user={editUser} />
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title="Hapus Pengguna"
        description="Pengguna yang dihapus tidak dapat dikembalikan. Lanjutkan?"
        confirmLabel="Hapus"
      />
    </>
  )
}
"""

# ============================================================
# UserFormModal.tsx — form lengkap, fetch detail dulu saat edit
# ============================================================

files["src/app/dashboard/users/_components/UserFormModal.tsx"] = """\
'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, ModalFooter, Button, Input, Select } from '@/components/ui'
import { useCreateUser, useUpdateUser, useUser } from '@/hooks/users/useUsers'
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

const JK_OPTIONS   = [{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]
const AGAMA_OPTIONS = [{ value: 'ISLAM', label: 'Islam' }]

// ── Schema create ─────────────────────────────────────────────
const createSchema = z.object({
  namaLengkap:  z.string().min(2, 'Minimal 2 karakter'),
  email:        z.string().email('Format email tidak valid'),
  password:     z.string().min(6, 'Minimal 6 karakter'),
  role:         z.string().min(1, 'Wajib dipilih'),
  jenisKelamin: z.string().min(1, 'Wajib dipilih'),
  tempatLahir:  z.string().min(2, 'Wajib diisi'),
  tanggalLahir: z.string().min(1, 'Wajib diisi'),
  agama:        z.string().min(1, 'Wajib dipilih'),
  username:     z.string().optional(),
  noTelepon:    z.string().optional(),
  noWa:         z.string().optional(),
  alamat:       z.string().optional(),
  nip:          z.string().optional(),
  nuptk:        z.string().optional(),
  nisn:         z.string().optional(),
  nik:          z.string().optional(),
})

// ── Schema edit ───────────────────────────────────────────────
const editSchema = z.object({
  namaLengkap:  z.string().min(2, 'Minimal 2 karakter'),
  username:     z.string().optional(),
  jenisKelamin: z.string().optional(),
  tempatLahir:  z.string().optional(),
  tanggalLahir: z.string().optional(),
  agama:        z.string().optional(),
  noTelepon:    z.string().optional(),
  noWa:         z.string().optional(),
  alamat:       z.string().optional(),
  nip:          z.string().optional(),
  nuptk:        z.string().optional(),
  nisn:         z.string().optional(),
  nik:          z.string().optional(),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm   = z.infer<typeof editSchema>

interface UserFormModalProps {
  open: boolean
  onClose: () => void
  user?: UserItem | null
}

// Format tanggal ISO → YYYY-MM-DD untuk input date
function toDateInput(iso?: string | null): string {
  if (!iso) return ''
  return iso.split('T')[0]
}

export function UserFormModal({ open, onClose, user }: UserFormModalProps) {
  const isEdit = !!user

  // Fetch detail user saat edit (dapat profile lengkap)
  const { data: userDetail, isLoading: loadingDetail } = useUser(user?.id ?? '')

  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser(user?.id ?? '')

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      namaLengkap: '', email: '', password: '', role: '',
      jenisKelamin: '', tempatLahir: '', tanggalLahir: '', agama: 'ISLAM',
      username: '', noTelepon: '', noWa: '', alamat: '',
      nip: '', nuptk: '', nisn: '', nik: '',
    },
  })

  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  })

  // Isi form edit saat userDetail sudah loaded
  useEffect(() => {
    if (open && isEdit && userDetail) {
      const p = userDetail.profile
      editForm.reset({
        namaLengkap:  p.namaLengkap ?? '',
        username:     userDetail.username ?? '',
        jenisKelamin: p.jenisKelamin ?? '',
        tempatLahir:  p.tempatLahir ?? '',
        tanggalLahir: toDateInput(p.tanggalLahir),
        agama:        p.agama ?? 'ISLAM',
        noTelepon:    p.noTelepon ?? '',
        noWa:         p.noWa ?? '',
        alamat:       p.alamat ?? '',
        nip:          p.nip ?? '',
        nuptk:        p.nuptk ?? '',
        nisn:         p.nisn ?? '',
        nik:          p.nik ?? '',
      })
    }
    if (open && !isEdit) {
      createForm.reset()
      createMutation.reset()
    }
    if (open && isEdit) {
      updateMutation.reset()
    }
  }, [open, userDetail?.id])

  const isPending     = createMutation.isPending || updateMutation.isPending
  const mutationError = createMutation.error || updateMutation.error

  const onSubmitCreate = async (data: CreateForm) => {
    try {
      await createMutation.mutateAsync(data as never)
      onClose()
    } catch { /* via mutationError */ }
  }

  const onSubmitEdit = async (data: EditForm) => {
    try {
      // Hapus string kosong agar tidak overwrite dengan ''
      const payload = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== '' && v !== undefined)
      )
      await updateMutation.mutateAsync(payload as never)
      onClose()
    } catch { /* via mutationError */ }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}
      size="lg"
    >
      {/* ── FORM EDIT ─────────────────────────────────────── */}
      {isEdit ? (
        <form onSubmit={editForm.handleSubmit(onSubmitEdit)}>
          <div className="p-6 space-y-5">
            {mutationError && <ErrorBox message={getErrorMessage(mutationError)} />}

            {loadingDetail ? (
              <div className="text-sm text-gray-400 text-center py-4">Memuat data...</div>
            ) : (
              <>
                {/* Info readonly */}
                <div className="grid grid-cols-2 gap-3">
                  <InfoField label="Email" value={user?.email ?? '-'} />
                  <InfoField label="Role"  value={ROLE_OPTIONS.find(r => r.value === user?.role)?.label ?? user?.role ?? '-'} />
                </div>

                <SectionTitle>Data Pribadi</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Nama Lengkap" placeholder="Nama lengkap"
                    error={editForm.formState.errors.namaLengkap?.message}
                    {...editForm.register('namaLengkap')} />
                  <Input label="Username" placeholder="username (opsional)"
                    {...editForm.register('username')} />
                  <Select label="Jenis Kelamin" options={JK_OPTIONS} placeholder="Pilih..."
                    {...editForm.register('jenisKelamin')} />
                  <Select label="Agama" options={AGAMA_OPTIONS}
                    {...editForm.register('agama')} />
                  <Input label="Tempat Lahir" placeholder="Kota lahir"
                    {...editForm.register('tempatLahir')} />
                  <Input label="Tanggal Lahir" type="date"
                    {...editForm.register('tanggalLahir')} />
                </div>

                <SectionTitle>Kontak</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="No. Telepon" placeholder="08xxxxxxxxxx"
                    {...editForm.register('noTelepon')} />
                  <Input label="No. WhatsApp" placeholder="08xxxxxxxxxx"
                    {...editForm.register('noWa')} />
                  <div className="sm:col-span-2">
                    <Input label="Alamat" placeholder="Alamat lengkap"
                      {...editForm.register('alamat')} />
                  </div>
                </div>

                <SectionTitle>Nomor Identitas</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="NIK" placeholder="16 digit NIK"
                    {...editForm.register('nik')} />
                  <Input label="NISN" placeholder="NISN siswa"
                    {...editForm.register('nisn')} />
                  <Input label="NIP" placeholder="NIP guru/pegawai"
                    {...editForm.register('nip')} />
                  <Input label="NUPTK" placeholder="NUPTK"
                    {...editForm.register('nuptk')} />
                </div>
              </>
            )}
          </div>

          <ModalFooter>
            <Button variant="secondary" type="button" onClick={onClose} disabled={isPending}>Batal</Button>
            <Button type="submit" loading={isPending || loadingDetail}>Simpan Perubahan</Button>
          </ModalFooter>
        </form>

      /* ── FORM CREATE ───────────────────────────────────── */
      ) : (
        <form onSubmit={createForm.handleSubmit(onSubmitCreate)}>
          <div className="p-6 space-y-5">
            {mutationError && <ErrorBox message={getErrorMessage(mutationError)} />}

            <SectionTitle>Akun</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input label="Nama Lengkap" placeholder="Nama lengkap"
                  error={createForm.formState.errors.namaLengkap?.message}
                  {...createForm.register('namaLengkap')} />
              </div>
              <Input label="Email" type="email" placeholder="email@man2makassar.sch.id"
                error={createForm.formState.errors.email?.message}
                {...createForm.register('email')} />
              <Input label="Username" placeholder="username (opsional)"
                {...createForm.register('username')} />
              <Input label="Password" type="password" placeholder="Minimal 6 karakter"
                error={createForm.formState.errors.password?.message}
                {...createForm.register('password')} />
              <Select label="Role" options={ROLE_OPTIONS} placeholder="Pilih role..."
                error={createForm.formState.errors.role?.message}
                {...createForm.register('role')} />
            </div>

            <SectionTitle>Data Pribadi</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Jenis Kelamin" options={JK_OPTIONS} placeholder="Pilih..."
                error={createForm.formState.errors.jenisKelamin?.message}
                {...createForm.register('jenisKelamin')} />
              <Select label="Agama" options={AGAMA_OPTIONS}
                {...createForm.register('agama')} />
              <Input label="Tempat Lahir" placeholder="Kota lahir"
                error={createForm.formState.errors.tempatLahir?.message}
                {...createForm.register('tempatLahir')} />
              <Input label="Tanggal Lahir" type="date"
                error={createForm.formState.errors.tanggalLahir?.message}
                {...createForm.register('tanggalLahir')} />
            </div>

            <SectionTitle>Kontak</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="No. Telepon" placeholder="08xxxxxxxxxx"
                {...createForm.register('noTelepon')} />
              <Input label="No. WhatsApp" placeholder="08xxxxxxxxxx"
                {...createForm.register('noWa')} />
              <div className="sm:col-span-2">
                <Input label="Alamat" placeholder="Alamat lengkap"
                  {...createForm.register('alamat')} />
              </div>
            </div>

            <SectionTitle>Nomor Identitas</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="NIK" placeholder="16 digit NIK" {...createForm.register('nik')} />
              <Input label="NISN" placeholder="NISN siswa"  {...createForm.register('nisn')} />
              <Input label="NIP"  placeholder="NIP"         {...createForm.register('nip')} />
              <Input label="NUPTK" placeholder="NUPTK"      {...createForm.register('nuptk')} />
            </div>
          </div>

          <ModalFooter>
            <Button variant="secondary" type="button" onClick={onClose} disabled={isPending}>Batal</Button>
            <Button type="submit" loading={isPending}>Buat Pengguna</Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800/70">
      {children}
    </p>
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

Yang difix:
  ✅ UserItem & UserDetail type sesuai response backend (nested profile)
  ✅ UserTable baca namaLengkap dari profile
  ✅ Form edit fetch GET /users/:id dulu → isi semua field dari profile lengkap
  ✅ Form edit: semua field tersedia (kontak, identitas, pribadi)
  ✅ Form create: semua field wajib + opsional
  ✅ PUT /users/:id payload bersih (string kosong dibuang)

npm run dev → coba edit user lagi
""")

if __name__ == "__main__":
    print("🚀 Fix Users Complete — types + form lengkap\n")
    write_files(files, BASE)