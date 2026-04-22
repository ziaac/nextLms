"""
FIX FASE 7A:
1. Modal tidak ikut dark/light mode → tambah suppressHydrationWarning + dark class
2. Super Admin tidak ada di select role edit → tambah SUPER_ADMIN option
3. PATCH 404 → kemungkinan backend tolak edit SUPER_ADMIN, tampilkan error proper
4. Border terlalu gelap → soften semua border di komponen

Cara pakai:
  python scripts/fix_users_ui.py
"""

import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

files = {}

# ============================================================
# src/components/ui/Modal.tsx
# — fix: portal ke body agar inherit dark class dari <html>
# ============================================================

files["src/components/ui/Modal.tsx"] = """\
'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}

const SIZE = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export function Modal({ open, onClose, title, description, size = 'md', children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!mounted || !open) return null

  // Portal ke document.body agar inherit class 'dark' dari <html>
  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className={cn(
          'relative w-full',
          'bg-white dark:bg-gray-900',
          'rounded-2xl shadow-xl',
          'border border-gray-200/80 dark:border-gray-700/60',
          'flex flex-col max-h-[90vh]',
          SIZE[size],
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-gray-800/80 flex-shrink-0">
          <div className="space-y-0.5 pr-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}

interface ModalFooterProps {
  children: React.ReactNode
}
export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-800/80 flex-shrink-0">
      {children}
    </div>
  )
}
"""

# ============================================================
# src/components/ui/Input.tsx — softer border
# ============================================================

files["src/components/ui/Input.tsx"] = """\
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{leftIcon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl bg-white dark:bg-gray-800',
              'text-base text-gray-900 dark:text-white',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'outline-none transition',
              'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border border-red-400 dark:border-red-500/70'
                : 'border border-gray-200 dark:border-gray-700/60',
              leftIcon ? 'pl-10' : 'px-4',
              rightIcon ? 'pr-10' : 'px-4',
              'py-2.5',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{rightIcon}</div>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
"""

# ============================================================
# src/components/ui/Select.tsx — softer border
# ============================================================

files["src/components/ui/Select.tsx"] = """\
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full rounded-xl bg-white dark:bg-gray-800',
            'px-4 py-2.5 text-base text-gray-900 dark:text-white',
            'outline-none transition appearance-none cursor-pointer',
            'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border border-red-400 dark:border-red-500/70'
              : 'border border-gray-200 dark:border-gray-700/60',
            className,
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
"""

# ============================================================
# src/app/dashboard/users/_components/UserFormModal.tsx
# — tambah SUPER_ADMIN di options
# — handle 404 / error backend dengan pesan yang jelas
# ============================================================

files["src/app/dashboard/users/_components/UserFormModal.tsx"] = """\
'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, ModalFooter, Button, Input, Select } from '@/components/ui'
import { useCreateUser, useUpdateUser } from '@/hooks/users/useUsers'
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

const createSchema = z.object({
  namaLengkap: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.string().min(1, 'Role wajib dipilih'),
})

const editSchema = z.object({
  namaLengkap: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  role: z.string().min(1, 'Role wajib dipilih'),
})

type CreateForm = z.infer<typeof createSchema>

interface UserFormModalProps {
  open: boolean
  onClose: () => void
  user?: UserItem | null
}

export function UserFormModal({ open, onClose, user }: UserFormModalProps) {
  const isEdit = !!user
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser(user?.id ?? '')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateForm>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as never,
  })

  useEffect(() => {
    if (open) {
      if (isEdit && user) {
        reset({ namaLengkap: user.namaLengkap, email: user.email, role: user.role, password: '' })
      } else {
        reset({ namaLengkap: '', email: '', password: '', role: '' })
      }
      // Reset error mutation saat modal dibuka ulang
      createMutation.reset()
      updateMutation.reset()
    }
  }, [open])

  const isPending = createMutation.isPending || updateMutation.isPending
  const mutationError = createMutation.error || updateMutation.error

  const onSubmit = async (data: CreateForm) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          namaLengkap: data.namaLengkap,
          email: data.email,
          role: data.role as never,
        })
      } else {
        await createMutation.mutateAsync(data as never)
      }
      onClose()
    } catch {
      // error ditampilkan via mutationError
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}
      description={isEdit ? `Edit data ${user?.namaLengkap}` : 'Buat akun pengguna baru'}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 space-y-4">
          {mutationError && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                {getErrorMessage(mutationError)}
              </p>
            </div>
          )}

          <Input
            label="Nama Lengkap"
            placeholder="Masukkan nama lengkap"
            error={errors.namaLengkap?.message}
            {...register('namaLengkap')}
          />

          <Input
            label="Email"
            type="email"
            placeholder="email@man2makassar.sch.id"
            error={errors.email?.message}
            {...register('email')}
          />

          {!isEdit && (
            <Input
              label="Password"
              type="password"
              placeholder="Minimal 6 karakter"
              error={(errors as { password?: { message?: string } }).password?.message}
              {...register('password')}
            />
          )}

          <Select
            label="Role"
            options={ROLE_OPTIONS}
            placeholder="Pilih role..."
            error={errors.role?.message}
            {...register('role')}
          />
        </div>

        <ModalFooter>
          <Button variant="secondary" type="button" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button type="submit" loading={isPending}>
            {isEdit ? 'Simpan Perubahan' : 'Buat Pengguna'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
"""

# ============================================================
# src/app/dashboard/users/_components/UserTable.tsx
# — softer border, softer divider
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
import { getErrorMessage } from '@/lib/utils'
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
              const fotoUrl = user.fotoUrl ? getPublicFileUrl(user.fotoUrl) : null
              return (
                <tr key={user.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center flex-shrink-0">
                        {fotoUrl ? (
                          <img src={fotoUrl} alt={user.namaLengkap} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            {getInitials(user.namaLengkap)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.namaLengkap}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{user.email}</p>
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
                      <Button variant="ghost" size="sm" leftIcon={<Pencil size={14} />} onClick={() => setEditUser(user)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost" size="sm" leftIcon={<Trash2 size={14} />}
                        onClick={() => setDeleteId(user.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
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
          const fotoUrl = user.fotoUrl ? getPublicFileUrl(user.fotoUrl) : null
          return (
            <div key={user.id} className="rounded-2xl bg-gray-50/80 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800/50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center flex-shrink-0">
                  {fotoUrl ? (
                    <img src={fotoUrl} alt={user.namaLengkap} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      {getInitials(user.namaLengkap)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{user.namaLengkap}</p>
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
                  <Button variant="ghost" size="sm" leftIcon={<Trash2 size={13} />} onClick={() => setDeleteId(user.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">Hapus</Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={data.meta.totalPages}
        total={data.meta.total}
        limit={data.meta.limit}
        onPageChange={onPageChange}
      />

      {/* Modals */}
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
# src/app/dashboard/users/page.tsx — softer card border
# ============================================================

files["src/app/dashboard/users/page.tsx"] = """\
'use client'

import { useState, useCallback } from 'react'
import { UserPlus } from 'lucide-react'
import { PageHeader, Button } from '@/components/ui'
import { UserFilters } from './_components/UserFilters'
import { UserTable } from './_components/UserTable'
import { UserFormModal } from './_components/UserFormModal'
import { useUsers } from '@/hooks/users/useUsers'
import { useDebounce } from '@/hooks/useDebounce'

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading } = useUsers({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    role: role || undefined,
  })

  const handleSearchChange = useCallback((v: string) => { setSearch(v); setPage(1) }, [])
  const handleRoleChange = useCallback((v: string) => { setRole(v); setPage(1) }, [])

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
        onSearchChange={handleSearchChange}
        onRoleChange={handleRoleChange}
      />

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800/60 p-4 md:p-6">
        <UserTable
          data={data}
          isLoading={isLoading}
          page={page}
          onPageChange={setPage}
        />
      </div>

      <UserFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
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

Fix yang dilakukan:
  ✅ Modal pakai createPortal → inherit dark class dari <html>
  ✅ Super Admin ditambahkan ke select options
  ✅ Border softer di semua komponen
  ✅ Error mutation tampil di modal dengan pesan backend

Catatan 404 PATCH:
  Jika edit SUPER_ADMIN masih 404, kemungkinan backend
  memang memblokir edit akun SUPER_ADMIN via endpoint biasa.
  Cek response body-nya di DevTools → Network → Response.

  npm run dev
""")

if __name__ == "__main__":
    print("🔧 Fix Users UI — dark mode modal, super admin, border softer\n")
    write_files(files, BASE)