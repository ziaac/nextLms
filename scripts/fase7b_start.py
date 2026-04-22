"""
FASE 7B — Tahun Ajaran & Semester
Deploy semua file ke posisi yang benar di project Next.js.

Jalankan dari ROOT project (sejajar folder src/):
    python scripts/fase7b_tahun_ajaran.py
"""

import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = {}

# ============================================================
# src/types/tahun-ajaran.types.ts
# ============================================================

files["src/types/tahun-ajaran.types.ts"] = """\
// ============================================================
// FASE 7B — Tahun Ajaran & Semester Types
// ============================================================

export type NamaSemester = 'GANJIL' | 'GENAP'

// ── Tahun Ajaran ─────────────────────────────────────────────
export interface TahunAjaran {
  id: string
  nama: string
  tanggalMulai: string   // ISO date string
  tanggalSelesai: string // ISO date string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTahunAjaranPayload {
  nama: string
  tanggalMulai: string
  tanggalSelesai: string
  isActive?: boolean
}

export interface UpdateTahunAjaranPayload extends Partial<CreateTahunAjaranPayload> {}

// ── Semester ──────────────────────────────────────────────────
export interface Semester {
  id: string
  tahunAjaranId: string
  nama: NamaSemester
  urutan: number        // 1 | 2
  tanggalMulai: string
  tanggalSelesai: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSemesterPayload {
  tahunAjaranId: string
  nama: NamaSemester
  urutan: number
  tanggalMulai: string
  tanggalSelesai: string
  isActive?: boolean
}

export interface UpdateSemesterPayload extends Partial<Omit<CreateSemesterPayload, 'tahunAjaranId'>> {}
"""

# ============================================================
# src/types/index.ts  — tambah export baru
# ============================================================

files["src/types/index.ts"] = """\
export * from './api.types'
export * from './auth.types'
export * from './enums'
export * from './users.types'
export * from './tahun-ajaran.types'
"""

# ============================================================
# src/lib/api/tahun-ajaran.api.ts
# ============================================================

files["src/lib/api/tahun-ajaran.api.ts"] = """\
import api from '@/lib/axios'
import type {
  TahunAjaran,
  CreateTahunAjaranPayload,
  UpdateTahunAjaranPayload,
} from '@/types/tahun-ajaran.types'

const BASE = '/tahun-ajaran'

export const tahunAjaranApi = {
  /** GET /tahun-ajaran — semua tahun ajaran */
  getAll: async (): Promise<TahunAjaran[]> => {
    const res = await api.get<TahunAjaran[]>(BASE)
    return res.data
  },

  /** GET /tahun-ajaran/aktif — semua yang aktif (bisa multiple) */
  getAllActive: async (): Promise<TahunAjaran[]> => {
    const res = await api.get<TahunAjaran[]>(`${BASE}/aktif`)
    return res.data
  },

  /** GET /tahun-ajaran/aktif/terkini — satu aktif terbaru */
  getOneActive: async (): Promise<TahunAjaran> => {
    const res = await api.get<TahunAjaran>(`${BASE}/aktif/terkini`)
    return res.data
  },

  /** GET /tahun-ajaran/:id */
  getOne: async (id: string): Promise<TahunAjaran> => {
    const res = await api.get<TahunAjaran>(`${BASE}/${id}`)
    return res.data
  },

  /** POST /tahun-ajaran */
  create: async (payload: CreateTahunAjaranPayload): Promise<TahunAjaran> => {
    const res = await api.post<TahunAjaran>(BASE, payload)
    return res.data
  },

  /** PATCH /tahun-ajaran/:id */
  update: async (id: string, payload: UpdateTahunAjaranPayload): Promise<TahunAjaran> => {
    const res = await api.patch<TahunAjaran>(`${BASE}/${id}`, payload)
    return res.data
  },

  /** PATCH /tahun-ajaran/:id/toggle-active */
  toggleActive: async (id: string): Promise<TahunAjaran> => {
    const res = await api.patch<TahunAjaran>(`${BASE}/${id}/toggle-active`)
    return res.data
  },

  /** PATCH /tahun-ajaran/:id/set-active-single */
  setActiveSingle: async (id: string): Promise<TahunAjaran> => {
    const res = await api.patch<TahunAjaran>(`${BASE}/${id}/set-active-single`)
    return res.data
  },

  /** DELETE /tahun-ajaran/:id */
  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`)
  },
}
"""

# ============================================================
# src/lib/api/semester.api.ts
# ============================================================

files["src/lib/api/semester.api.ts"] = """\
import api from '@/lib/axios'
import type {
  Semester,
  CreateSemesterPayload,
  UpdateSemesterPayload,
} from '@/types/tahun-ajaran.types'

const BASE = '/semester'

export const semesterApi = {
  /** GET /semester?tahunAjaranId=xxx — list semester per tahun ajaran */
  getByTahunAjaran: async (tahunAjaranId: string): Promise<Semester[]> => {
    const res = await api.get<Semester[]>(BASE, { params: { tahunAjaranId } })
    return res.data
  },

  /** GET /semester/aktif — semua semester aktif */
  getAllActive: async (): Promise<Semester[]> => {
    const res = await api.get<Semester[]>(`${BASE}/aktif`)
    return res.data
  },

  /** GET /semester/:id */
  getOne: async (id: string): Promise<Semester> => {
    const res = await api.get<Semester>(`${BASE}/${id}`)
    return res.data
  },

  /** POST /semester */
  create: async (payload: CreateSemesterPayload): Promise<Semester> => {
    const res = await api.post<Semester>(BASE, payload)
    return res.data
  },

  /** PATCH /semester/:id */
  update: async (id: string, payload: UpdateSemesterPayload): Promise<Semester> => {
    const res = await api.patch<Semester>(`${BASE}/${id}`, payload)
    return res.data
  },

  /** PATCH /semester/:id/toggle-active */
  toggleActive: async (id: string): Promise<Semester> => {
    const res = await api.patch<Semester>(`${BASE}/${id}/toggle-active`)
    return res.data
  },

  /** DELETE /semester/:id */
  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`)
  },
}
"""

# ============================================================
# src/hooks/tahun-ajaran/useTahunAjaran.ts
# ============================================================

files["src/hooks/tahun-ajaran/useTahunAjaran.ts"] = """\
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tahunAjaranApi } from '@/lib/api/tahun-ajaran.api'
import type { CreateTahunAjaranPayload, UpdateTahunAjaranPayload } from '@/types/tahun-ajaran.types'

// ── Query Keys ────────────────────────────────────────────────
export const tahunAjaranKeys = {
  all:       ['tahun-ajaran'] as const,
  active:    ['tahun-ajaran', 'aktif'] as const,
  oneActive: ['tahun-ajaran', 'aktif', 'terkini'] as const,
  detail:    (id: string) => ['tahun-ajaran', id] as const,
}

// ── Queries ───────────────────────────────────────────────────
export function useTahunAjaranList() {
  return useQuery({
    queryKey: tahunAjaranKeys.all,
    queryFn:  tahunAjaranApi.getAll,
  })
}

export function useTahunAjaranActive() {
  return useQuery({
    queryKey: tahunAjaranKeys.active,
    queryFn:  tahunAjaranApi.getAllActive,
  })
}

export function useTahunAjaranOneActive() {
  return useQuery({
    queryKey: tahunAjaranKeys.oneActive,
    queryFn:  tahunAjaranApi.getOneActive,
  })
}

export function useTahunAjaranDetail(id: string | null) {
  return useQuery({
    queryKey: tahunAjaranKeys.detail(id ?? ''),
    queryFn:  () => tahunAjaranApi.getOne(id!),
    enabled:  !!id,
  })
}

// ── Mutations ─────────────────────────────────────────────────
export function useCreateTahunAjaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTahunAjaranPayload) => tahunAjaranApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.all })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.active })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.oneActive })
    },
  })
}

export function useUpdateTahunAjaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTahunAjaranPayload }) =>
      tahunAjaranApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.all })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.active })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.oneActive })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.detail(id) })
    },
  })
}

export function useToggleTahunAjaranActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tahunAjaranApi.toggleActive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.all })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.active })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.oneActive })
    },
  })
}

export function useSetActiveSingleTahunAjaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tahunAjaranApi.setActiveSingle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.all })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.active })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.oneActive })
    },
  })
}

export function useDeleteTahunAjaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tahunAjaranApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.all })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.active })
      qc.invalidateQueries({ queryKey: tahunAjaranKeys.oneActive })
    },
  })
}
"""

# ============================================================
# src/hooks/semester/useSemester.ts
# ============================================================

files["src/hooks/semester/useSemester.ts"] = """\
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { semesterApi } from '@/lib/api/semester.api'
import type { CreateSemesterPayload, UpdateSemesterPayload } from '@/types/tahun-ajaran.types'

// ── Query Keys ────────────────────────────────────────────────
export const semesterKeys = {
  byTahunAjaran: (tahunAjaranId: string) => ['semester', 'by-ta', tahunAjaranId] as const,
  active:        ['semester', 'aktif'] as const,
  detail:        (id: string) => ['semester', id] as const,
}

// ── Queries ───────────────────────────────────────────────────

/** Lazy — hanya fetch saat tahunAjaranId tersedia (klik row) */
export function useSemesterByTahunAjaran(tahunAjaranId: string | null) {
  return useQuery({
    queryKey: semesterKeys.byTahunAjaran(tahunAjaranId ?? ''),
    queryFn:  () => semesterApi.getByTahunAjaran(tahunAjaranId!),
    enabled:  !!tahunAjaranId,
    staleTime: 1000 * 60 * 5, // 5 menit cache
  })
}

export function useSemesterActive() {
  return useQuery({
    queryKey: semesterKeys.active,
    queryFn:  semesterApi.getAllActive,
  })
}

// ── Mutations ─────────────────────────────────────────────────
export function useCreateSemester() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSemesterPayload) => semesterApi.create(payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: semesterKeys.byTahunAjaran(vars.tahunAjaranId) })
      qc.invalidateQueries({ queryKey: semesterKeys.active })
    },
  })
}

export function useUpdateSemester() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateSemesterPayload
      tahunAjaranId: string
    }) => semesterApi.update(id, payload),
    onSuccess: (_data, { tahunAjaranId }) => {
      qc.invalidateQueries({ queryKey: semesterKeys.byTahunAjaran(tahunAjaranId) })
      qc.invalidateQueries({ queryKey: semesterKeys.active })
    },
  })
}

export function useToggleSemesterActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; tahunAjaranId: string }) =>
      semesterApi.toggleActive(id),
    onSuccess: (_data, { tahunAjaranId }) => {
      qc.invalidateQueries({ queryKey: semesterKeys.byTahunAjaran(tahunAjaranId) })
      qc.invalidateQueries({ queryKey: semesterKeys.active })
    },
  })
}

export function useDeleteSemester() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; tahunAjaranId: string }) =>
      semesterApi.remove(id),
    onSuccess: (_data, { tahunAjaranId }) => {
      qc.invalidateQueries({ queryKey: semesterKeys.byTahunAjaran(tahunAjaranId) })
      qc.invalidateQueries({ queryKey: semesterKeys.active })
    },
  })
}
"""

# ============================================================
# src/app/dashboard/tahun-ajaran/_components/TahunAjaranFormModal.tsx
# ============================================================

files["src/app/dashboard/tahun-ajaran/_components/TahunAjaranFormModal.tsx"] = """\
'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, Button, Input } from '@/components/ui'
import {
  useCreateTahunAjaran,
  useUpdateTahunAjaran,
} from '@/hooks/tahun-ajaran/useTahunAjaran'
import { getErrorMessage } from '@/lib/utils'
import type { TahunAjaran } from '@/types/tahun-ajaran.types'

// ── Schema ────────────────────────────────────────────────────
const schema = z
  .object({
    nama:           z.string().min(1, 'Nama wajib diisi'),
    tanggalMulai:   z.string().min(1, 'Tanggal mulai wajib diisi'),
    tanggalSelesai: z.string().min(1, 'Tanggal selesai wajib diisi'),
    isActive:       z.boolean().optional(),
  })
  .refine(
    (d) => !d.tanggalMulai || !d.tanggalSelesai || d.tanggalSelesai > d.tanggalMulai,
    { message: 'Tanggal selesai harus setelah tanggal mulai', path: ['tanggalSelesai'] },
  )

type FormValues = z.infer<typeof schema>

// ── Props ─────────────────────────────────────────────────────
interface Props {
  open:    boolean
  onClose: () => void
  data?:   TahunAjaran | null
}

// ── Helper: auto-generate nama dari tanggalMulai ──────────────
function buildNamaFromDate(isoDate: string): string {
  if (!isoDate) return ''
  const year = new Date(isoDate).getFullYear()
  if (isNaN(year)) return ''
  return `${year}/${year + 1}`
}

// ── Component ─────────────────────────────────────────────────
export default function TahunAjaranFormModal({ open, onClose, data }: Props) {
  const isEdit = !!data

  const createMutation = useCreateTahunAjaran()
  const updateMutation = useUpdateTahunAjaran()
  const mutation       = isEdit ? updateMutation : createMutation

  const [submitError, setSubmitError] = useState<string | null>(null)
  const formTopRef                    = useRef<HTMLDivElement>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nama:           '',
      tanggalMulai:   '',
      tanggalSelesai: '',
      isActive:       false,
    },
  })

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = form

  const tanggalMulai = watch('tanggalMulai')

  // ── useEffect 1: reset state saat modal buka ──────────────
  const prevOpen = useRef(false)
  useEffect(() => {
    if (open && !prevOpen.current) {
      mutation.reset()
      setSubmitError(null)
    }
    prevOpen.current = open
    if (!open && !isEdit) {
      reset()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── useEffect 2: populate form saat edit ──────────────────
  useEffect(() => {
    if (!open || !isEdit || !data) return
    reset({
      nama:           data.nama,
      tanggalMulai:   data.tanggalMulai.split('T')[0],
      tanggalSelesai: data.tanggalSelesai.split('T')[0],
      isActive:       data.isActive,
    })
  }, [open, data?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-generate nama dari tanggalMulai (create only) ────
  useEffect(() => {
    if (isEdit) return
    const generated = buildNamaFromDate(tanggalMulai)
    if (generated) setValue('nama', generated)
  }, [tanggalMulai, isEdit]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit ────────────────────────────────────────────────
  const onSubmit = async (values: FormValues) => {
    setSubmitError(null)
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: data!.id, payload: values })
      } else {
        await createMutation.mutateAsync(values)
      }
      onClose()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setTimeout(() => {
        formTopRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }
  }

  const isPending = mutation.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
      size="md"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button type="submit" form="ta-form" loading={isPending}>
            {isEdit ? 'Simpan Perubahan' : 'Tambah'}
          </Button>
        </>
      }
    >
      <form id="ta-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div ref={formTopRef} />
        {submitError && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {submitError}
          </div>
        )}

        {/* Nama */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nama Tahun Ajaran
          </label>
          <Input
            {...register('nama')}
            placeholder="Contoh: 2025/2026"
            error={errors.nama?.message}
          />
          {!isEdit && tanggalMulai && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Auto-generate dari tanggal mulai · bisa diubah manual
            </p>
          )}
        </div>

        {/* Tanggal Mulai */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tanggal Mulai
          </label>
          <Input
            type="date"
            {...register('tanggalMulai')}
            error={errors.tanggalMulai?.message}
          />
        </div>

        {/* Tanggal Selesai */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tanggal Selesai
          </label>
          <Input
            type="date"
            {...register('tanggalSelesai')}
            error={errors.tanggalSelesai?.message}
          />
        </div>

        {/* isActive — hanya create */}
        {!isEdit && (
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="ta-isActive"
              {...register('isActive')}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="ta-isActive" className="text-sm text-gray-700 dark:text-gray-300">
              Langsung aktifkan tahun ajaran ini
            </label>
          </div>
        )}
      </form>
    </Modal>
  )
}
"""

# ============================================================
# src/app/dashboard/tahun-ajaran/_components/SemesterFormModal.tsx
# ============================================================

files["src/app/dashboard/tahun-ajaran/_components/SemesterFormModal.tsx"] = """\
'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, Button, Input, Select } from '@/components/ui'
import {
  useCreateSemester,
  useUpdateSemester,
} from '@/hooks/semester/useSemester'
import { getErrorMessage } from '@/lib/utils'
import type { Semester } from '@/types/tahun-ajaran.types'

// ── Schema ────────────────────────────────────────────────────
const schema = z
  .object({
    nama:           z.enum(['GANJIL', 'GENAP'], { required_error: 'Nama semester wajib dipilih' }),
    tanggalMulai:   z.string().min(1, 'Tanggal mulai wajib diisi'),
    tanggalSelesai: z.string().min(1, 'Tanggal selesai wajib diisi'),
    isActive:       z.boolean().optional(),
  })
  .refine(
    (d) => !d.tanggalMulai || !d.tanggalSelesai || d.tanggalSelesai > d.tanggalMulai,
    { message: 'Tanggal selesai harus setelah tanggal mulai', path: ['tanggalSelesai'] },
  )

type FormValues = z.infer<typeof schema>

const NAMA_OPTIONS = [
  { value: 'GANJIL', label: 'Ganjil (Urutan 1)' },
  { value: 'GENAP',  label: 'Genap (Urutan 2)'  },
]

// ── Props ─────────────────────────────────────────────────────
interface Props {
  open:          boolean
  onClose:       () => void
  tahunAjaranId: string
  data?:         Semester | null
}

// ── Component ─────────────────────────────────────────────────
export default function SemesterFormModal({ open, onClose, tahunAjaranId, data }: Props) {
  const isEdit = !!data

  const createMutation = useCreateSemester()
  const updateMutation = useUpdateSemester()
  const mutation       = isEdit ? updateMutation : createMutation

  const [submitError, setSubmitError] = useState<string | null>(null)
  const formTopRef                    = useRef<HTMLDivElement>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nama:           undefined,
      tanggalMulai:   '',
      tanggalSelesai: '',
      isActive:       false,
    },
  })

  const { register, handleSubmit, formState: { errors }, watch, reset } = form

  const namaValue = watch('nama')
  const urutan    = namaValue === 'GANJIL' ? 1 : namaValue === 'GENAP' ? 2 : undefined

  // ── useEffect 1: reset state saat modal buka ──────────────
  const prevOpen = useRef(false)
  useEffect(() => {
    if (open && !prevOpen.current) {
      mutation.reset()
      setSubmitError(null)
    }
    prevOpen.current = open
    if (!open && !isEdit) {
      reset()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── useEffect 2: populate form saat edit ──────────────────
  useEffect(() => {
    if (!open || !isEdit || !data) return
    reset({
      nama:           data.nama,
      tanggalMulai:   data.tanggalMulai.split('T')[0],
      tanggalSelesai: data.tanggalSelesai.split('T')[0],
      isActive:       data.isActive,
    })
  }, [open, data?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit ────────────────────────────────────────────────
  const onSubmit = async (values: FormValues) => {
    setSubmitError(null)
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: data!.id,
          tahunAjaranId,
          payload: {
            nama:           values.nama,
            urutan:         urutan!,
            tanggalMulai:   values.tanggalMulai,
            tanggalSelesai: values.tanggalSelesai,
            isActive:       values.isActive,
          },
        })
      } else {
        await createMutation.mutateAsync({
          tahunAjaranId,
          nama:           values.nama,
          urutan:         urutan!,
          tanggalMulai:   values.tanggalMulai,
          tanggalSelesai: values.tanggalSelesai,
          isActive:       values.isActive,
        })
      }
      onClose()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setTimeout(() => {
        formTopRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }
  }

  const isPending = mutation.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Semester' : 'Tambah Semester'}
      size="md"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button type="submit" form="sem-form" loading={isPending}>
            {isEdit ? 'Simpan Perubahan' : 'Tambah'}
          </Button>
        </>
      }
    >
      <form id="sem-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div ref={formTopRef} />
        {submitError && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {submitError}
          </div>
        )}

        {/* Nama Semester */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nama Semester
          </label>
          <Select
            options={NAMA_OPTIONS}
            value={watch('nama')}
            placeholder="Pilih semester"
            {...register('nama')}
            error={errors.nama?.message}
          />
          {namaValue && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Urutan otomatis: {urutan}
            </p>
          )}
        </div>

        {/* Tanggal Mulai */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tanggal Mulai
          </label>
          <Input
            type="date"
            {...register('tanggalMulai')}
            error={errors.tanggalMulai?.message}
          />
        </div>

        {/* Tanggal Selesai */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tanggal Selesai
          </label>
          <Input
            type="date"
            {...register('tanggalSelesai')}
            error={errors.tanggalSelesai?.message}
          />
        </div>

        {/* isActive — hanya create */}
        {!isEdit && (
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="sem-isActive"
              {...register('isActive')}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="sem-isActive" className="text-sm text-gray-700 dark:text-gray-300">
              Langsung aktifkan semester ini
            </label>
          </div>
        )}
      </form>
    </Modal>
  )
}
"""

# ============================================================
# src/app/dashboard/tahun-ajaran/_components/SemesterPanel.tsx
# ============================================================

files["src/app/dashboard/tahun-ajaran/_components/SemesterPanel.tsx"] = """\
'use client'

import { useState } from 'react'
import { SlideOver, Button, Badge, Skeleton, EmptyState, ConfirmModal } from '@/components/ui'
import {
  useSemesterByTahunAjaran,
  useToggleSemesterActive,
  useDeleteSemester,
} from '@/hooks/semester/useSemester'
import SemesterFormModal from './SemesterFormModal'
import { formatDate } from '@/lib/utils'
import type { TahunAjaran, Semester } from '@/types/tahun-ajaran.types'

// ── Icons ─────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)
const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.213l-4 1 1-4L16.862 3.487z" />
  </svg>
)
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h8a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
  </svg>
)

// ── Semester Card ─────────────────────────────────────────────
interface SemesterCardProps {
  semester:      Semester
  tahunAjaranId: string
  onEdit:        (s: Semester) => void
}

function SemesterCard({ semester, tahunAjaranId, onEdit }: SemesterCardProps) {
  const toggleMutation = useToggleSemesterActive()
  const deleteMutation = useDeleteSemester()
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <>
      <div className="rounded-xl border border-gray-200 dark:border-gray-600/60 bg-white dark:bg-gray-800 p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Semester {semester.nama === 'GANJIL' ? 'Ganjil' : 'Genap'}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              (urutan {semester.urutan})
            </span>
          </div>
          <Badge variant={semester.isActive ? 'success' : 'default'}>
            {semester.isActive ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </div>

        {/* Tanggal */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
          <div>
            Mulai:{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {formatDate(semester.tanggalMulai)}
            </span>
          </div>
          <div>
            Selesai:{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {formatDate(semester.tanggalSelesai)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-500/50">
          <button
            onClick={() => toggleMutation.mutate({ id: semester.id, tahunAjaranId })}
            disabled={toggleMutation.isPending}
            className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 dark:border-gray-600/60
              text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700
              disabled:opacity-50 transition-colors"
          >
            {toggleMutation.isPending
              ? 'Memproses...'
              : semester.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
          <button
            onClick={() => onEdit(semester)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50
              dark:hover:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors"
            title="Edit"
          >
            <PencilIcon />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50
              dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            title="Hapus"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteMutation.mutate(
            { id: semester.id, tahunAjaranId },
            { onSuccess: () => setConfirmDelete(false) },
          )
        }
        isLoading={deleteMutation.isPending}
        title="Hapus Semester"
        description={`Yakin ingin menghapus Semester ${semester.nama === 'GANJIL' ? 'Ganjil' : 'Genap'}? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        variant="danger"
      />
    </>
  )
}

// ── Main Component ────────────────────────────────────────────
interface Props {
  open:        boolean
  onClose:     () => void
  tahunAjaran: TahunAjaran | null
}

export default function SemesterPanel({ open, onClose, tahunAjaran }: Props) {
  const [formOpen,     setFormOpen]     = useState(false)
  const [editSemester, setEditSemester] = useState<Semester | null>(null)

  const { data: semesters, isLoading } = useSemesterByTahunAjaran(
    open ? tahunAjaran?.id ?? null : null,
  )

  const handleAdd = () => {
    setEditSemester(null)
    setFormOpen(true)
  }

  const handleEdit = (s: Semester) => {
    setEditSemester(s)
    setFormOpen(true)
  }

  if (!tahunAjaran) return null

  return (
    <>
      <SlideOver
        open={open}
        onClose={onClose}
        title={`Semester — ${tahunAjaran.nama}`}
      >
        <div className="flex flex-col h-full">
          {/* Info + tambah */}
          <div className="flex items-center justify-between mb-4">
            <Badge variant={tahunAjaran.isActive ? 'success' : 'default'}>
              TA {tahunAjaran.isActive ? 'Aktif' : 'Nonaktif'}
            </Badge>
            <Button size="sm" onClick={handleAdd}>
              <span className="flex items-center gap-1.5">
                <PlusIcon />
                Tambah Semester
              </span>
            </Button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-36 w-full rounded-xl" />
              <Skeleton className="h-36 w-full rounded-xl" />
            </div>
          ) : !semesters || semesters.length === 0 ? (
            <EmptyState
              title="Belum ada semester"
              description="Tambahkan Semester Ganjil dan Genap untuk tahun ajaran ini."
            />
          ) : (
            <div className="space-y-3">
              {[...semesters]
                .sort((a, b) => a.urutan - b.urutan)
                .map((s) => (
                  <SemesterCard
                    key={s.id}
                    semester={s}
                    tahunAjaranId={tahunAjaran.id}
                    onEdit={handleEdit}
                  />
                ))}
              {semesters.length >= 2 && (
                <p className="text-xs text-center text-gray-400 dark:text-gray-600 pt-2">
                  Kedua semester sudah ditambahkan
                </p>
              )}
            </div>
          )}
        </div>
      </SlideOver>

      <SemesterFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        tahunAjaranId={tahunAjaran.id}
        data={editSemester}
      />
    </>
  )
}
"""

# ============================================================
# src/app/dashboard/tahun-ajaran/_components/TahunAjaranTable.tsx
# ============================================================

files["src/app/dashboard/tahun-ajaran/_components/TahunAjaranTable.tsx"] = """\
'use client'

import { useState } from 'react'
import { Badge, Skeleton, EmptyState, ConfirmModal } from '@/components/ui'
import {
  useToggleTahunAjaranActive,
  useSetActiveSingleTahunAjaran,
  useDeleteTahunAjaran,
} from '@/hooks/tahun-ajaran/useTahunAjaran'
import { formatDate } from '@/lib/utils'
import type { TahunAjaran } from '@/types/tahun-ajaran.types'

// ── Icons ─────────────────────────────────────────────────────
const ChevronRightIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-90 text-emerald-500' : ''}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)
const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.213l-4 1 1-4L16.862 3.487z" />
  </svg>
)
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h8a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
  </svg>
)
const StarIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.499z" />
  </svg>
)
const CalendarIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

// ── Row ───────────────────────────────────────────────────────
interface RowProps {
  ta:         TahunAjaran
  isSelected: boolean
  onSelect:   () => void
  onEdit:     () => void
}

function TahunAjaranRow({ ta, isSelected, onSelect, onEdit }: RowProps) {
  const toggleMutation    = useToggleTahunAjaranActive()
  const setActiveMutation = useSetActiveSingleTahunAjaran()
  const deleteMutation    = useDeleteTahunAjaran()
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <>
      <div
        className={`
          rounded-xl border transition-all duration-200
          ${isSelected
            ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-sm'
            : 'border-gray-200 dark:border-gray-600/60 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500'
          }
        `}
      >
        {/* Klik row → buka semester panel */}
        <button
          onClick={onSelect}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        >
          <ChevronRightIcon open={isSelected} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                {ta.nama}
              </span>
              <Badge variant={ta.isActive ? 'success' : 'default'} size="sm">
                {ta.isActive ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              <CalendarIcon />
              <span>{formatDate(ta.tanggalMulai)} – {formatDate(ta.tanggalSelesai)}</span>
            </div>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
            Lihat Semester →
          </span>
        </button>

        {/* Action bar — terpisah agar tidak trigger onSelect */}
        <div className="flex items-center gap-1.5 px-4 pb-3 border-t border-gray-100 dark:border-gray-500/50 pt-2">
          <button
            onClick={() => toggleMutation.mutate(ta.id)}
            disabled={toggleMutation.isPending}
            className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600/60
              text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700
              disabled:opacity-50 transition-colors"
          >
            {toggleMutation.isPending ? 'Memproses...' : ta.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          </button>

          {!ta.isActive && (
            <button
              onClick={() => setActiveMutation.mutate(ta.id)}
              disabled={setActiveMutation.isPending}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg
                border border-amber-200 dark:border-amber-700/50
                text-amber-600 dark:text-amber-400
                hover:bg-amber-50 dark:hover:bg-amber-900/20
                disabled:opacity-50 transition-colors"
              title="Nonaktifkan semua, aktifkan hanya ini"
            >
              <StarIcon />
              Aktif Tunggal
            </button>
          )}

          <div className="flex-1" />

          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50
              dark:hover:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors"
            title="Edit"
          >
            <PencilIcon />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50
              dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            title="Hapus"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteMutation.mutate(ta.id, { onSuccess: () => setConfirmDelete(false) })
        }
        isLoading={deleteMutation.isPending}
        title="Hapus Tahun Ajaran"
        description={`Yakin ingin menghapus Tahun Ajaran ${ta.nama}? Semua semester yang terkait akan ikut terhapus.`}
        confirmLabel="Hapus"
        variant="danger"
      />
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────
interface Props {
  data:       TahunAjaran[]
  isLoading:  boolean
  selectedId: string | null
  onSelect:   (ta: TahunAjaran) => void
  onEdit:     (ta: TahunAjaran) => void
}

export default function TahunAjaranTable({ data, isLoading, selectedId, onSelect, onEdit }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Belum ada tahun ajaran"
        description="Klik 'Tambah Tahun Ajaran' untuk menambahkan tahun ajaran pertama."
      />
    )
  }

  return (
    <div className="space-y-3">
      {data.map((ta) => (
        <TahunAjaranRow
          key={ta.id}
          ta={ta}
          isSelected={selectedId === ta.id}
          onSelect={() => onSelect(ta)}
          onEdit={() => onEdit(ta)}
        />
      ))}
    </div>
  )
}
"""

# ============================================================
# src/app/dashboard/tahun-ajaran/page.tsx
# ============================================================

files["src/app/dashboard/tahun-ajaran/page.tsx"] = """\
'use client'

import { useState } from 'react'
import { PageHeader, Button } from '@/components/ui'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import TahunAjaranTable     from './_components/TahunAjaranTable'
import TahunAjaranFormModal from './_components/TahunAjaranFormModal'
import SemesterPanel        from './_components/SemesterPanel'
import type { TahunAjaran } from '@/types/tahun-ajaran.types'

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

export default function TahunAjaranPage() {
  const { data, isLoading } = useTahunAjaranList()

  const [formOpen,   setFormOpen]   = useState(false)
  const [editData,   setEditData]   = useState<TahunAjaran | null>(null)
  const [panelOpen,  setPanelOpen]  = useState(false)
  const [selectedTA, setSelectedTA] = useState<TahunAjaran | null>(null)

  const handleAdd = () => {
    setEditData(null)
    setFormOpen(true)
  }

  const handleEdit = (ta: TahunAjaran) => {
    setEditData(ta)
    setFormOpen(true)
  }

  const handleSelectTA = (ta: TahunAjaran) => {
    if (selectedTA?.id === ta.id && panelOpen) {
      setPanelOpen(false)
      setSelectedTA(null)
    } else {
      setSelectedTA(ta)
      setPanelOpen(true)
    }
  }

  const handleClosePanel = () => {
    setPanelOpen(false)
    setTimeout(() => setSelectedTA(null), 300)
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Tahun Ajaran & Semester"
          description="Kelola tahun ajaran dan semester aktif untuk seluruh kegiatan akademik."
        >
          <Button onClick={handleAdd}>
            <span className="flex items-center gap-1.5">
              <PlusIcon />
              Tambah Tahun Ajaran
            </span>
          </Button>
        </PageHeader>

        {/* Banner status aktif */}
        {data && data.length > 0 && (
          <ActiveSummaryBanner data={data} />
        )}

        <TahunAjaranTable
          data={data ?? []}
          isLoading={isLoading}
          selectedId={selectedTA?.id ?? null}
          onSelect={handleSelectTA}
          onEdit={handleEdit}
        />
      </div>

      <TahunAjaranFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        data={editData}
      />

      <SemesterPanel
        open={panelOpen}
        onClose={handleClosePanel}
        tahunAjaran={selectedTA}
      />
    </>
  )
}

// ── Banner aktif ──────────────────────────────────────────────
function ActiveSummaryBanner({ data }: { data: TahunAjaran[] }) {
  const aktif = data.filter((ta) => ta.isActive)

  if (aktif.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-700/50
        bg-amber-50 dark:bg-amber-900/10 px-4 py-3 flex items-center gap-3">
        <span className="text-lg">⚠️</span>
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Tidak ada tahun ajaran aktif. Aktifkan salah satu agar sistem berjalan normal.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-700/50
      bg-emerald-50/50 dark:bg-emerald-900/10 px-4 py-3 flex items-center gap-3">
      <span className="text-lg">✓</span>
      <p className="text-sm text-emerald-700 dark:text-emerald-400">
        {aktif.length === 1 ? (
          <>Tahun ajaran aktif: <strong>{aktif[0].nama}</strong></>
        ) : (
          <>{aktif.length} tahun ajaran aktif: <strong>{aktif.map((ta) => ta.nama).join(', ')}</strong></>
        )}
      </p>
    </div>
  )
}
"""

# ============================================================
# WRITE FILES
# ============================================================

def write_files(files_dict: dict, base: str) -> None:
    created, skipped = [], []
    for rel_path, content in files_dict.items():
        full = os.path.join(base, rel_path.replace("/", os.sep))
        os.makedirs(os.path.dirname(full), exist_ok=True)
        mode = "dibuat" if not os.path.exists(full) else "diupdate"
        with open(full, "w", encoding="utf-8") as f:
            f.write(content)
        created.append((mode, rel_path))

    print("\n" + "=" * 60)
    print("  FASE 7B — Tahun Ajaran & Semester")
    print("=" * 60)
    for mode, path in created:
        icon = "✅" if mode == "dibuat" else "🔄"
        print(f"  {icon} [{mode}]  {path}")
    print("=" * 60)
    print(f"\n  Total: {len(created)} file\n")
    print("  Langkah selanjutnya:")
    print("  1. Tambahkan nav entry di src/config/nav.config.ts")
    print("     href: '/dashboard/tahun-ajaran'")
    print("     roles: SUPER_ADMIN, ADMIN, STAFF_TU, KEPALA_SEKOLAH, WAKIL_KEPALA")
    print("  2. npm run dev — buka /dashboard/tahun-ajaran")
    print("  3. Test: tambah TA → klik row → tambah semester Ganjil & Genap")
    print()


if __name__ == "__main__":
    print("\n🚀 Deploy FASE 7B — Tahun Ajaran & Semester\n")
    write_files(files, BASE)