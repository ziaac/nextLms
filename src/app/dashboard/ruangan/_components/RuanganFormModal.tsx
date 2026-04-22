'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, Button, Input, Select } from '@/components/ui'
import { useCreateRuangan, useUpdateRuangan } from '@/hooks/ruangan/useRuangan'
import { getErrorMessage } from '@/lib/utils'
import type { Ruangan } from '@/types/ruangan.types'

const FORM_ID = 'ruangan-form'

const JENIS_OPTIONS = [
  { label: 'Pilih Jenis', value: '' },
  { label: 'Kelas', value: 'KELAS' },
  { label: 'Laboratorium', value: 'LAB' },
  { label: 'Aula', value: 'AULA' },
  { label: 'Kantor', value: 'KANTOR' },
  { label: 'Lainnya', value: 'LAINNYA' },
]

const schema = z.object({
  kode:      z.string().min(1, 'Kode wajib diisi').max(20),
  nama:      z.string().min(1, 'Nama wajib diisi').max(100),
  kapasitas: z.coerce.number().int().min(1).max(500),
  jenis:     z.enum(['KELAS', 'LAB', 'AULA', 'KANTOR', 'LAINNYA']),
  isActive:  z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open:      boolean
  onClose:   () => void
  editData?: Ruangan | null
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200/70 px-4 py-3">
      <p className="text-sm text-red-600">{message}</p>
    </div>
  )
}

export function RuanganFormModal({ open, onClose, editData }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const formTopRef = useRef<HTMLDivElement>(null)
  const isEdit = !!editData

  const createMutation = useCreateRuangan()
  const updateMutation = useUpdateRuangan(editData?.id ?? '')
  const isPending = createMutation.isPending || updateMutation.isPending

  const { register, handleSubmit, control, reset, formState: { errors } } =
    useForm<FormValues>({ resolver: zodResolver(schema) as never })

  useEffect(() => {
    if (!open) return
    setSubmitError(null)
    reset(editData ? {
      kode:      editData.kode,
      nama:      editData.nama,
      kapasitas: editData.kapasitas,
      jenis:     editData.jenis,
      isActive:  editData.isActive,
    } : { kode: '', nama: '', kapasitas: 36, jenis: 'KELAS', isActive: true })
  }, [open, editData?.id])

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(values as never)
      } else {
        await createMutation.mutateAsync(values as never)
      }
      onClose()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Ruangan' : 'Tambah Ruangan'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" form={FORM_ID} loading={isPending}>
            {isEdit ? 'Simpan Perubahan' : 'Tambah Ruangan'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit}>
        <div className="p-6 space-y-4">
          <div ref={formTopRef} />
          {submitError && <ErrorBox message={submitError} />}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Kode <span className="text-red-500">*</span>
              </label>
              <Input {...register('kode')} placeholder="A-1" error={errors.kode?.message} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Kapasitas <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('kapasitas')}
                type="number"
                placeholder="36"
                error={errors.kapasitas?.message}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nama Ruangan <span className="text-red-500">*</span>
            </label>
            <Input {...register('nama')} placeholder="Gedung A Ruang 1" error={errors.nama?.message} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Jenis <span className="text-red-500">*</span>
            </label>
            <Select
              options={JENIS_OPTIONS}
              {...register('jenis')}
              error={errors.jenis?.message}
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
