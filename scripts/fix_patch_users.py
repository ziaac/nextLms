"""
FIX — PATCH /users/:id 404
Sesuaikan payload dengan yang backend terima:
  { namaLengkap, noTelepon }

Cara pakai:
  python scripts/fix_patch_users.py
"""

import os
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = {}

# ============================================================
# src/types/users.types.ts — tambah noTelepon
# ============================================================

files["src/types/users.types.ts"] = """\
import type { UserRole } from './enums'

export interface UserItem {
  id: string
  email: string
  role: UserRole
  namaLengkap: string
  fotoUrl: string | null
  isActive: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface UserDetail extends UserItem {
  noTelepon?: string | null
}

export interface CreateUserDto {
  email: string
  password: string
  role: UserRole
  namaLengkap: string
}

/** PATCH /users/:id — hanya field ini yang diizinkan backend */
export interface UpdateUserDto {
  namaLengkap?: string
  noTelepon?: string
}

export interface UpdateProfileDto {
  namaLengkap?: string
  noHp?: string
  alamat?: string
}
"""

# ============================================================
# src/lib/api/users.api.ts — PATCH hanya kirim field yg diizinkan
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

  /**
   * PATCH /users/:id
   * Backend hanya menerima: namaLengkap, noTelepon
   * Email & role TIDAK bisa diubah via endpoint ini
   */
  update: async (id: string, dto: UpdateUserDto): Promise<UserDetail> => {
    const payload: UpdateUserDto = {}
    if (dto.namaLengkap !== undefined) payload.namaLengkap = dto.namaLengkap
    if (dto.noTelepon   !== undefined) payload.noTelepon   = dto.noTelepon
    const { data } = await api.patch(`/users/${id}`, payload)
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
# src/app/dashboard/users/_components/UserFormModal.tsx
# — form edit: hanya namaLengkap + noTelepon
# — email & role tampil readonly (info only)
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
  email:       z.string().email('Format email tidak valid'),
  password:    z.string().min(6, 'Password minimal 6 karakter'),
  role:        z.string().min(1, 'Role wajib dipilih'),
})

// Edit: hanya field yang diizinkan PATCH /users/:id
const editSchema = z.object({
  namaLengkap: z.string().min(2, 'Nama minimal 2 karakter'),
  noTelepon:   z.string().optional(),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm   = z.infer<typeof editSchema>

interface UserFormModalProps {
  open: boolean
  onClose: () => void
  user?: UserItem | null
}

export function UserFormModal({ open, onClose, user }: UserFormModalProps) {
  const isEdit = !!user
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser(user?.id ?? '')

  // Form create
  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { namaLengkap: '', email: '', password: '', role: '' },
  })

  // Form edit
  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { namaLengkap: '', noTelepon: '' },
  })

  useEffect(() => {
    if (open) {
      createMutation.reset()
      updateMutation.reset()
      if (isEdit && user) {
        editForm.reset({ namaLengkap: user.namaLengkap, noTelepon: '' })
      } else {
        createForm.reset({ namaLengkap: '', email: '', password: '', role: '' })
      }
    }
  }, [open, user?.id])

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
      await updateMutation.mutateAsync({
        namaLengkap: data.namaLengkap,
        noTelepon:   data.noTelepon || undefined,
      })
      onClose()
    } catch { /* via mutationError */ }
  }

  const roleLabel = ROLE_OPTIONS.find(r => r.value === user?.role)?.label ?? user?.role

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}
      description={isEdit
        ? `Edit data ${user?.namaLengkap}`
        : 'Buat akun pengguna baru'}
    >
      {/* ── FORM EDIT ── */}
      {isEdit ? (
        <form onSubmit={editForm.handleSubmit(onSubmitEdit)}>
          <div className="p-6 space-y-4">
            {mutationError && <ErrorBox message={getErrorMessage(mutationError)} />}

            {/* Info readonly */}
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Email" value={user?.email ?? '-'} />
              <InfoField label="Role"  value={roleLabel ?? '-'} />
            </div>

            <Input
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap"
              error={editForm.formState.errors.namaLengkap?.message}
              {...editForm.register('namaLengkap')}
            />

            <Input
              label="No. Telepon"
              placeholder="08xxxxxxxxxx (opsional)"
              error={editForm.formState.errors.noTelepon?.message}
              {...editForm.register('noTelepon')}
            />

            <p className="text-xs text-gray-400 dark:text-gray-500">
              * Email dan role tidak dapat diubah di sini
            </p>
          </div>

          <ModalFooter>
            <Button variant="secondary" type="button" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" loading={isPending}>
              Simpan Perubahan
            </Button>
          </ModalFooter>
        </form>

      /* ── FORM CREATE ── */
      ) : (
        <form onSubmit={createForm.handleSubmit(onSubmitCreate)}>
          <div className="p-6 space-y-4">
            {mutationError && <ErrorBox message={getErrorMessage(mutationError)} />}

            <Input
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap"
              error={createForm.formState.errors.namaLengkap?.message}
              {...createForm.register('namaLengkap')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="email@man2makassar.sch.id"
              error={createForm.formState.errors.email?.message}
              {...createForm.register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Minimal 6 karakter"
              error={createForm.formState.errors.password?.message}
              {...createForm.register('password')}
            />
            <Select
              label="Role"
              options={ROLE_OPTIONS}
              placeholder="Pilih role..."
              error={createForm.formState.errors.role?.message}
              {...createForm.register('role')}
            />
          </div>

          <ModalFooter>
            <Button variant="secondary" type="button" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" loading={isPending}>
              Buat Pengguna
            </Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
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
  ✅ PATCH /users/:id — hanya kirim namaLengkap + noTelepon
  ✅ Form edit pisah dari form create (schema berbeda)
  ✅ Email & role tampil readonly di form edit
  ✅ types/users.types.ts disesuaikan

npm run dev → coba edit user lagi
""")

if __name__ == "__main__":
    print("🔧 Fix PATCH /users/:id — sesuaikan payload dengan backend\n")
    write_files(files, BASE)