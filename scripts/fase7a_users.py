"""
FASE 7A — Shared UI Components + Manajemen Users
LMS MAN 2 Kota Makassar

Cara pakai:
  1. Letakkan di: nextjslms/scripts/fase7a_users.py
  2. Jalankan dari root project:
       python scripts/fase7a_users.py
  3. Install dependency tambahan:
       npm install @tanstack/react-table
"""

import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

files = {}

# ============================================================
# SHARED UI COMPONENTS
# ============================================================

# src/components/ui/Modal.tsx
files["src/components/ui/Modal.tsx"] = """\
'use client'

import { useEffect, useRef } from 'react'
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

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
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
          'relative w-full bg-white dark:bg-gray-900',
          'rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800',
          'flex flex-col max-h-[90vh]',
          SIZE[size],
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-200 flex-shrink-0">
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
    </div>
  )
}

interface ModalFooterProps {
  children: React.ReactNode
}
export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-200 flex-shrink-0">
      {children}
    </div>
  )
}
"""

# src/components/ui/Button.tsx
files["src/components/ui/Button.tsx"] = """\
import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const VARIANT = {
  primary:   'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 focus:ring-gray-400',
  danger:    'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  ghost:     'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 focus:ring-gray-400',
  outline:   'border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-gray-400',
}

const SIZE = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-xl transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          VARIANT[variant],
          SIZE[size],
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    )
  }
)
Button.displayName = 'Button'
"""

# src/components/ui/Input.tsx
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
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border bg-white dark:bg-gray-800',
              'text-base text-gray-900 dark:text-white',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'outline-none transition',
              'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-red-400 dark:border-red-600'
                : 'border-gray-300 dark:border-gray-700',
              leftIcon ? 'pl-10' : 'px-4',
              rightIcon ? 'pr-10' : 'px-4',
              'py-2.5',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
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

# src/components/ui/Select.tsx
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
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full rounded-xl border bg-white dark:bg-gray-800',
            'px-4 py-2.5 text-base text-gray-900 dark:text-white',
            'outline-none transition appearance-none',
            'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-red-400 dark:border-red-600'
              : 'border-gray-300 dark:border-gray-700',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
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

# src/components/ui/Badge.tsx
files["src/components/ui/Badge.tsx"] = """\
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const VARIANT = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400',
  danger:  'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  info:    'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  purple:  'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        VARIANT[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
"""

# src/components/ui/Pagination.tsx
files["src/components/ui/Pagination.tsx"] = """\
'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  // Hitung range halaman yang ditampilkan
  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Menampilkan <span className="font-medium text-gray-700 dark:text-gray-300">{from}–{to}</span>{' '}
        dari <span className="font-medium text-gray-700 dark:text-gray-300">{total}</span> data
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                p === page
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
"""

# src/components/ui/SearchInput.tsx
files["src/components/ui/SearchInput.tsx"] = """\
'use client'

import { useRef } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder = 'Cari...', className }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className={cn('relative', className)}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full h-10 pl-9 pr-9 rounded-xl text-sm
          border border-gray-300 dark:border-gray-700
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-white
          placeholder:text-gray-400 dark:placeholder:text-gray-500
          outline-none transition
          focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
        "
      />
      {value && (
        <button
          onClick={() => { onChange(''); inputRef.current?.focus() }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
"""

# src/components/ui/ConfirmModal.tsx
files["src/components/ui/ConfirmModal.tsx"] = """\
'use client'

import { AlertTriangle } from 'lucide-react'
import { Modal, ModalFooter } from './Modal'
import { Button } from './Button'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
  variant?: 'danger' | 'warning'
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Hapus',
  loading = false,
  variant = 'danger',
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="p-6 space-y-4">
        <div className={`
          w-12 h-12 rounded-2xl flex items-center justify-center
          ${variant === 'danger'
            ? 'bg-red-100 dark:bg-red-950/50'
            : 'bg-yellow-100 dark:bg-yellow-950/50'}
        `}>
          <AlertTriangle
            size={22}
            className={variant === 'danger' ? 'text-red-600' : 'text-yellow-600'}
          />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
"""

# src/components/ui/EmptyState.tsx
files["src/components/ui/EmptyState.tsx"] = """\
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}
"""

# src/components/ui/PageHeader.tsx
files["src/components/ui/PageHeader.tsx"] = """\
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4', className)}>
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}
"""

# src/components/ui/Skeleton.tsx
files["src/components/ui/Skeleton.tsx"] = """\
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700',
        className,
      )}
    />
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
"""

# src/components/ui/index.ts
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
"""

# ============================================================
# USERS — Types
# ============================================================

files["src/types/users.types.ts"] = """\
import type { UserRole } from './enums'

export interface UserItem {
  id: string
  email: string
  role: UserRole
  namaLengkap: string
  fotoUrl: string | null
  isVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UserDetail extends UserItem {
  profile?: {
    nip?: string
    nis?: string
    noHp?: string
    alamat?: string
  } | null
}

export interface CreateUserDto {
  email: string
  password: string
  role: UserRole
  namaLengkap: string
}

export interface UpdateUserDto {
  email?: string
  role?: UserRole
  namaLengkap?: string
  isActive?: boolean
}

export interface UpdateProfileDto {
  namaLengkap?: string
  noHp?: string
  alamat?: string
}
"""

# ============================================================
# USERS — API
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

  update: async (id: string, dto: UpdateUserDto): Promise<UserDetail> => {
    const { data } = await api.patch(`/users/${id}`, dto)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`)
  },
}
"""

# ============================================================
# USERS — Hooks
# ============================================================

files["src/hooks/users/useUsers.ts"] = """\
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, type UsersParams } from '@/lib/api/users.api'
import { getErrorMessage } from '@/lib/utils'
import type { CreateUserDto, UpdateUserDto } from '@/types/users.types'

export const USER_KEYS = {
  all: ['users'] as const,
  list: (params?: UsersParams) => ['users', 'list', params] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
}

export function useUsers(params?: UsersParams) {
  return useQuery({
    queryKey: USER_KEYS.list(params),
    queryFn: () => usersApi.getAll(params),
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: USER_KEYS.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateUserDto) => usersApi.create(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: USER_KEYS.all }) },
  })
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateUserDto) => usersApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: USER_KEYS.all }) },
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: USER_KEYS.all }) },
  })
}

export function useUserErrorMessage(error: unknown) {
  return error ? getErrorMessage(error) : null
}
"""

# ============================================================
# USERS — Components
# ============================================================

files["src/app/dashboard/users/_components/UserBadge.tsx"] = """\
import { Badge } from '@/components/ui'
import type { UserRole } from '@/types'

const ROLE_CONFIG: Record<UserRole, { label: string; variant: 'success' | 'info' | 'warning' | 'purple' | 'default' | 'danger' }> = {
  SUPER_ADMIN:    { label: 'Super Admin',    variant: 'danger' },
  ADMIN:          { label: 'Admin',          variant: 'warning' },
  KEPALA_SEKOLAH: { label: 'Kepala Sekolah', variant: 'purple' },
  WAKIL_KEPALA:   { label: 'Wakil Kepala',   variant: 'purple' },
  GURU:           { label: 'Guru',           variant: 'info' },
  WALI_KELAS:     { label: 'Wali Kelas',     variant: 'info' },
  SISWA:          { label: 'Siswa',          variant: 'success' },
  ORANG_TUA:      { label: 'Orang Tua',      variant: 'default' },
  STAFF_TU:       { label: 'Staff TU',       variant: 'default' },
  STAFF_KEUANGAN: { label: 'Staff Keuangan', variant: 'default' },
}

export function RoleBadge({ role }: { role: UserRole }) {
  const config = ROLE_CONFIG[role] ?? { label: role, variant: 'default' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
"""

files["src/app/dashboard/users/_components/UserFilters.tsx"] = """\
'use client'

import { SearchInput } from '@/components/ui'
import { Select } from '@/components/ui'
import type { UserRole } from '@/types'

const ROLE_OPTIONS = [
  { value: '', label: 'Semua Role' },
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

interface UserFiltersProps {
  search: string
  role: string
  onSearchChange: (v: string) => void
  onRoleChange: (v: string) => void
}

export function UserFilters({ search, role, onSearchChange, onRoleChange }: UserFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
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
        className="sm:w-48"
      />
    </div>
  )
}
"""

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
type EditForm = z.infer<typeof editSchema>

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
      reset(isEdit
        ? { namaLengkap: user.namaLengkap, email: user.email, role: user.role }
        : { namaLengkap: '', email: '', password: '', role: '' }
      )
    }
  }, [open, user])

  const isPending = createMutation.isPending || updateMutation.isPending
  const mutationError = createMutation.error || updateMutation.error

  const onSubmit = async (data: CreateForm) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ namaLengkap: data.namaLengkap, email: data.email, role: data.role as never })
      } else {
        await createMutation.mutateAsync(data as never)
      }
      onClose()
    } catch { /* handled by mutationError */ }
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
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3">
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

files["src/app/dashboard/users/_components/UserTable.tsx"] = """\
'use client'

import { useState } from 'react'
import { Pencil, Trash2, Users } from 'lucide-react'
import { Button, Badge, Pagination, EmptyState, TableSkeleton, ConfirmModal } from '@/components/ui'
import { RoleBadge } from './UserBadge'
import { UserFormModal } from './UserFormModal'
import { useDeleteUser } from '@/hooks/users/useUsers'
import { getInitials, getPublicFileUrl } from '@/lib/utils'
import { getPublicFileUrl as getFileUrl } from '@/lib/constants'
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
    } catch { /* error shown in toast nanti */ }
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
            <tr className="border-b border-gray-200 dark:border-gray-800">
              {['Pengguna', 'Role', 'Status', 'Dibuat', 'Aksi'].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.data.map((user) => {
              const fotoUrl = user.fotoUrl ? getFileUrl(user.fotoUrl) : null
              return (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
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
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isActive ? 'success' : 'default'}>
                      {user.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                    {formatTanggalPendek(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Pencil size={14} />}
                        onClick={() => setEditUser(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Trash2 size={14} />}
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
          const fotoUrl = user.fotoUrl ? getFileUrl(user.fotoUrl) : null
          return (
            <div
              key={user.id}
              className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
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
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                </div>
                <RoleBadge role={user.role} />
              </div>
              <div className="flex items-center justify-between">
                <Badge variant={user.isActive ? 'success' : 'default'}>
                  {user.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" leftIcon={<Pencil size={13} />} onClick={() => setEditUser(user)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 size={13} />}
                    onClick={() => setDeleteId(user.id)}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    Hapus
                  </Button>
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
      <UserFormModal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
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
# USERS — Page
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

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v)
    setPage(1)
  }, [])

  const handleRoleChange = useCallback((v: string) => {
    setRole(v)
    setPage(1)
  }, [])

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

      {/* Filters */}
      <UserFilters
        search={search}
        role={role}
        onSearchChange={handleSearchChange}
        onRoleChange={handleRoleChange}
      />

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-6">
        <UserTable
          data={data}
          isLoading={isLoading}
          page={page}
          onPageChange={setPage}
        />
      </div>

      {/* Create Modal */}
      <UserFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  )
}
"""

# ============================================================
# SHARED HOOK — useDebounce
# ============================================================

files["src/hooks/useDebounce.ts"] = """\
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
"""

# ============================================================
# UPDATE types/index.ts
# ============================================================

files["src/types/index.ts"] = """\
export * from './enums'
export * from './api.types'
export * from './auth.types'
export * from './users.types'
"""

# ============================================================
# WRITE FILES
# ============================================================

def write_files(files_dict, base):
    print(f"📁 Base: {base}\n")
    for path, content in files_dict.items():
        full = os.path.join(base, path.replace("/", os.sep))
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  ✅ {path}")

    print(f"""
🎉 {len(files_dict)} file berhasil dibuat!

📦 Install dependency tambahan:
   npm install @tanstack/react-table

🚀 Akses halaman:
   http://localhost:3005/dashboard/users

✅ FASE 7A selesai! Lanjut ke FASE 7B — Tahun Ajaran & Semester
""")

if __name__ == "__main__":
    print("🚀 FASE 7A — Shared UI Components + Manajemen Users\n")
    write_files(files, BASE)