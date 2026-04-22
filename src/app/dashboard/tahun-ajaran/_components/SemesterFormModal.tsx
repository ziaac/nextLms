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
    nama:           z.enum(['GANJIL', 'GENAP'] as const),
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
      <form id="sem-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 space-y-5">
          <div ref={formTopRef} />
          {submitError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
            </div>
          )}

          {/* Nama Semester */}
          <div>
            <Select
              label="Nama Semester"
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

          {/* Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tanggal Mulai"
              type="date"
              {...register('tanggalMulai')}
              error={errors.tanggalMulai?.message}
            />
            <Input
              label="Tanggal Selesai"
              type="date"
              {...register('tanggalSelesai')}
              error={errors.tanggalSelesai?.message}
            />
          </div>

          {/* isActive — hanya create */}
          {!isEdit && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="sem-isActive"
                {...register('isActive')}
                className="w-4 h-4 rounded accent-emerald-600"
              />
              <label htmlFor="sem-isActive" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                Langsung aktifkan semester ini
              </label>
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
