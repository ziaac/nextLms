"""
FASE 7A ADDITION:
1. Slide-over panel detail user (role-aware)
2. Filter tahun masuk di halaman users

python scripts/fase7a_detail_user.py
"""

import os
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = {}

# ============================================================
# src/components/ui/SlideOver.tsx
# ============================================================

files["src/components/ui/SlideOver.tsx"] = """\
'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SlideOverProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  width?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const WIDTH = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
}

export function SlideOver({
  open, onClose, title, description, width = 'md', children,
}: SlideOverProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full',
          'bg-white dark:bg-gray-900',
          'border-l border-gray-200 dark:border-gray-200',
          'shadow-2xl flex flex-col',
          'transition-transform duration-300 ease-in-out',
          WIDTH[width],
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-200 flex-shrink-0">
          <div className="space-y-0.5 pr-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
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
"""

# ============================================================
# src/app/dashboard/users/_components/UserDetailPanel.tsx
# ============================================================

files["src/app/dashboard/users/_components/UserDetailPanel.tsx"] = """\
'use client'

import { SlideOver } from '@/components/ui'
import { Badge } from '@/components/ui'
import { RoleBadge } from './UserBadge'
import { useUser } from '@/hooks/users/useUsers'
import { getInitials, getPublicFileUrl } from '@/lib/utils'
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

export function UserDetailPanel({ user, onClose, onEdit }: UserDetailPanelProps) {
  const { data, isLoading } = useUser(user?.id ?? '')
  const isSiswa = user?.role === 'SISWA'

  const nama  = data?.profile?.namaLengkap ?? user?.profile?.namaLengkap ?? '-'
  const foto  = data?.profile?.fotoUrl ? getFileUrl(data.profile.fotoUrl) : null

  return (
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
        <div className="p-6 space-y-6">

          {/* ── Avatar + info utama ─────────────────────── */}
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
                {isSiswa && data.profile.tahunMasuk && (
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

          {/* ── Akun ────────────────────────────────────── */}
          <Section title="Akun">
            <Grid>
              <Field label="Email"    value={data.email} />
              <Field label="Username" value={data.username} />
              <Field label="Login Terakhir"
                value={data.lastLoginAt ? formatTanggalSaja(data.lastLoginAt) : '-'} />
              <Field label="Login Count" value={data.loginCount?.toString()} />
            </Grid>
          </Section>

          {/* ── Identitas ───────────────────────────────── */}
          <Section title="Identitas Pribadi">
            <Grid>
              <Field label="Nama Lengkap"   value={data.profile.namaLengkap} />
              <Field label="Jenis Kelamin"
                value={data.profile.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
              <Field label="Tempat Lahir"   value={data.profile.tempatLahir} />
              <Field label="Tanggal Lahir"
                value={data.profile.tanggalLahir ? formatTanggalSaja(data.profile.tanggalLahir) : undefined} />
              <Field label="Agama"          value={data.profile.agama} />
              <Field label="Gol. Darah"     value={data.profile.bloodType} />
              <Field label="Tinggi"         value={data.profile.tinggi ? `${data.profile.tinggi} cm` : undefined} />
              <Field label="Berat"          value={data.profile.berat ? `${data.profile.berat} kg` : undefined} />
            </Grid>
          </Section>

          {/* ── Nomor Identitas ─────────────────────────── */}
          <Section title="Nomor Identitas">
            <Grid>
              <Field label="NIK"   value={data.profile.nik} />
              <Field label="No. KK" value={data.profile.noKK} />
              {isSiswa && <Field label="NISN" value={data.profile.nisn} />}
              {!isSiswa && <Field label="NIP"  value={data.profile.nip} />}
              {!isSiswa && <Field label="NUPTK" value={data.profile.nuptk} />}
            </Grid>
          </Section>

          {/* ── Kontak ──────────────────────────────────── */}
          <Section title="Kontak">
            <Grid>
              <Field label="No. HP"       value={data.profile.noTelepon} />
              <Field label="WhatsApp"     value={data.profile.noWa} />
              <Field label="Telp Rumah"   value={data.profile.noTelpRumah} />
            </Grid>
          </Section>

          {/* ── Alamat ──────────────────────────────────── */}
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

          {/* ── SISWA ONLY ──────────────────────────────── */}
          {isSiswa && (
            <>
              <Section title="Data Siswa">
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
                      <DocItem label="Akta Kelahiran" docKey={data.profile.aktaKey} />
                    )}
                    {data.profile.kkKey && (
                      <DocItem label="Kartu Keluarga" docKey={data.profile.kkKey} />
                    )}
                    {data.profile.kipKey && (
                      <DocItem label="KIP / PKH" docKey={data.profile.kipKey} />
                    )}
                  </div>
                </Section>
              )}
            </>
          )}

        </div>
      ) : null}
    </SlideOver>
  )
}

// ── Sub-components ────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-200 pt-3">
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

function DocItem({ label, docKey }: { label: string; docKey: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Tersedia</span>
    </div>
  )
}
"""

# ============================================================
# src/app/dashboard/users/_components/UserFilters.tsx
# — tambah filter tahun masuk
# ============================================================

files["src/app/dashboard/users/_components/UserFilters.tsx"] = """\
'use client'

import { SearchInput } from '@/components/ui'
import { Select } from '@/components/ui'

const ROLE_OPTIONS = [
  { value: '', label: 'Semua Role' },
  { value: 'SUPER_ADMIN',    label: 'Super Admin' },
  { value: 'ADMIN',          label: 'Admin' },
  { value: 'KEPALA_SEKOLAH', label: 'Kepala Sekolah' },
  { value: 'WAKIL_KEPALA',   label: 'Wakil Kepala' },
  { value: 'GURU',           label: 'Guru' },
  { value: 'SISWA',          label: 'Siswa' },
  { value: 'STAFF_TU',       label: 'Staff TU' },
  { value: 'STAFF_KEUANGAN', label: 'Staff Keuangan' },
]

interface UserFiltersProps {
  search: string
  role: string
  tahunMasuk: string
  onSearchChange: (v: string) => void
  onRoleChange: (v: string) => void
  onTahunMasukChange: (v: string) => void
}

export function UserFilters({
  search, role, tahunMasuk,
  onSearchChange, onRoleChange, onTahunMasukChange,
}: UserFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Cari nama atau email..."
        className="sm:w-72"
      />
      <Select
        options={ROLE_OPTIONS}
        value={role}
        onChange={(e) => onRoleChange(e.target.value)}
        className="sm:w-44"
      />
      <div className="relative sm:w-36">
        <input
          type="number"
          value={tahunMasuk}
          onChange={(e) => onTahunMasukChange(e.target.value)}
          placeholder="Angkatan..."
          min={2000}
          max={2100}
          className="
            w-full h-10 px-3 rounded-xl text-sm
            border border-gray-200 dark:border-gray-200
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            outline-none transition
            focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
          "
        />
      </div>
    </div>
  )
}
"""

# ============================================================
# src/lib/api/users.api.ts — tambah tahunMasuk ke params
# ============================================================

files["src/lib/api/users.api.ts"] = """\
import api from '@/lib/axios'
import type { PaginatedResponse, PaginationParams } from '@/types'
import type { UserItem, UserDetail, CreateUserDto, UpdateUserDto } from '@/types/users.types'

export interface UsersParams extends PaginationParams {
  role?: string
  tahunMasuk?: number
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

  /** PUT /users/:id — backend pakai PUT */
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
# src/app/dashboard/users/page.tsx — integrasi semua
# ============================================================

files["src/app/dashboard/users/page.tsx"] = """\
'use client'

import { useState, useCallback } from 'react'
import { UserPlus } from 'lucide-react'
import { PageHeader, Button } from '@/components/ui'
import { UserFilters } from './_components/UserFilters'
import { UserTable } from './_components/UserTable'
import { UserFormModal } from './_components/UserFormModal'
import { UserDetailPanel } from './_components/UserDetailPanel'
import { useUsers } from '@/hooks/users/useUsers'
import { useDebounce } from '@/hooks/useDebounce'
import type { UserItem } from '@/types/users.types'

export default function UsersPage() {
  const [page, setPage]             = useState(1)
  const [search, setSearch]         = useState('')
  const [role, setRole]             = useState('')
  const [tahunMasuk, setTahunMasuk] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser]     = useState<UserItem | null>(null)
  const [detailUser, setDetailUser] = useState<UserItem | null>(null)

  const debouncedSearch     = useDebounce(search, 400)
  const debouncedTahunMasuk = useDebounce(tahunMasuk, 600)

  const { data, isLoading } = useUsers({
    page,
    limit: 10,
    search:     debouncedSearch || undefined,
    role:       role || undefined,
    tahunMasuk: debouncedTahunMasuk ? parseInt(debouncedTahunMasuk) : undefined,
  })

  const handleSearchChange     = useCallback((v: string) => { setSearch(v);     setPage(1) }, [])
  const handleRoleChange       = useCallback((v: string) => { setRole(v);       setPage(1) }, [])
  const handleTahunMasukChange = useCallback((v: string) => { setTahunMasuk(v); setPage(1) }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pengguna"
        description={`Total ${data?.meta.total ?? 0} pengguna terdaftar`}
        actions={
          <Button leftIcon={<UserPlus size={16} />} onClick={() => setCreateOpen(true)}>
            Tambah Pengguna
          </Button>
        }
      />

      <UserFilters
        search={search}
        role={role}
        tahunMasuk={tahunMasuk}
        onSearchChange={handleSearchChange}
        onRoleChange={handleRoleChange}
        onTahunMasukChange={handleTahunMasukChange}
      />

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-200 p-4 md:p-6">
        <UserTable
          data={data}
          isLoading={isLoading}
          page={page}
          onPageChange={setPage}
          onRowClick={(user) => setDetailUser(user)}
          onEdit={(user) => setEditUser(user)}
        />
      </div>

      {/* Create Modal */}
      <UserFormModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Edit Modal */}
      <UserFormModal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
      />

      {/* Detail Slide-over */}
      <UserDetailPanel
        user={detailUser}
        onClose={() => setDetailUser(null)}
        onEdit={(user) => {
          setDetailUser(null)
          setEditUser(user)
        }}
      />
    </div>
  )
}
"""

# ============================================================
# src/app/dashboard/users/_components/UserTable.tsx
# — tambah onRowClick & onEdit props
# ============================================================

files["src/app/dashboard/users/_components/UserTable.tsx"] = """\
'use client'

import { useState } from 'react'
import { Pencil, Trash2, Users } from 'lucide-react'
import { Button, Badge, Pagination, EmptyState, TableSkeleton, ConfirmModal } from '@/components/ui'
import { RoleBadge } from './UserBadge'
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
  onRowClick: (user: UserItem) => void
  onEdit: (user: UserItem) => void
}

export function UserTable({
  data, isLoading, page, onPageChange, onRowClick, onEdit,
}: UserTableProps) {
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
            <tr className="border-b border-gray-200 dark:border-gray-200">
              {['Pengguna', 'Role', 'Angkatan', 'Status', 'Dibuat', 'Aksi'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/40">
            {data.data.map((user) => {
              const nama    = user.profile?.namaLengkap ?? user.email
              const fotoUrl = user.profile?.fotoUrl ? getPublicFileUrl(user.profile.fotoUrl) : null
              return (
                <tr
                  key={user.id}
                  onClick={() => onRowClick(user)}
                  className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                >
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
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {user.role === 'SISWA' && (user.profile as any)?.tahunMasuk
                      ? (user.profile as any).tahunMasuk
                      : '—'
                    }
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isActive ? 'success' : 'default'}>
                      {user.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">
                    {formatTanggalPendek(user.createdAt)}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" leftIcon={<Pencil size={14} />}
                        onClick={() => onEdit(user)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" leftIcon={<Trash2 size={14} />}
                        onClick={() => setDeleteId(user.id)}
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
            <div key={user.id}
              onClick={() => onRowClick(user)}
              className="rounded-2xl bg-gray-50/80 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-200 p-4 space-y-3 cursor-pointer active:bg-gray-100 dark:active:bg-gray-800/60"
            >
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
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" leftIcon={<Pencil size={13} />}
                    onClick={() => onEdit(user)}>Edit</Button>
                  <Button variant="ghost" size="sm" leftIcon={<Trash2 size={13} />}
                    onClick={() => setDeleteId(user.id)}
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
  ✅ Klik row → slide-over detail dari kanan
  ✅ Detail role-aware: field siswa hanya tampil jika role SISWA
  ✅ Tombol Edit di slide-over (tutup panel, buka modal edit)
  ✅ Filter angkatan (tahun masuk) dengan debounce
  ✅ Kolom Angkatan di tabel (hanya tampil untuk SISWA)

Catatan:
  Filter tahunMasuk dikirim ke backend sebagai query param.
  Backend perlu support filter ini di FilterUserDto.
  Jika belum, filter hanya akan diabaikan backend (tidak error).

npm run dev → klik row user untuk test slide-over
""")

if __name__ == "__main__":
    print("🚀 User Detail Slide-over + Filter Angkatan\n")
    write_files(files, BASE)