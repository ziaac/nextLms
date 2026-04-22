'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, Button, Select } from '@/components/ui'
import {
  useCreateTingkatKelas,
  useUpdateTingkatKelas,
} from '@/hooks/tingkat-kelas/useTingkatKelas'
import { getErrorMessage } from '@/lib/utils'
import type { TingkatKelas } from '@/types/akademik.types'

const NAMA_OPTIONS = [
  { value: 'X',   label: 'X (Sepuluh)'     },
  { value: 'XI',  label: 'XI (Sebelas)'    },
  { value: 'XII', label: 'XII (Dua Belas)' },
]

function getUrutan(nama: string): number {
  return nama === 'X' ? 1 : nama === 'XI' ? 2 : 3
}

const schema = z.object({
  nama: z.enum(['X', 'XI', 'XII'] as const),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open:    boolean
  onClose: () => void
  data?:   TingkatKelas | null
}

export default function TingkatKelasFormModal({ open, onClose, data }: Props) {
  const isEdit = !!data

  const createMutation = useCreateTingkatKelas()
  const updateMutation = useUpdateTingkatKelas()
  const mutation       = isEdit ? updateMutation : createMutation

  const [submitError, setSubmitError] = useState<string | null>(null)
  const formTopRef                    = useRef<HTMLDivElement>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nama: undefined },
  })

  const { handleSubmit, formState: { errors }, watch, reset } = form

  const prevOpen = useRef(false)
  useEffect(() => {
    if (open && !prevOpen.current) {
      mutation.reset()
      setSubmitError(null)
    }
    prevOpen.current = open
    if (!open && !isEdit) reset()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || !isEdit || !data) return
    reset({ nama: data.nama as 'X' | 'XI' | 'XII' })
  }, [open, data?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const namaValue = watch('nama')

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null)
    try {
      const payload = {
        nama:    values.nama,
        jenjang: 'MA' as const,
        urutan:  getUrutan(values.nama),
      }
      if (isEdit) {
        await updateMutation.mutateAsync({ id: data!.id, payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onClose()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  const isPending = mutation.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Tingkat Kelas' : 'Tambah Tingkat Kelas'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button type="submit" form="tingkat-form" loading={isPending}>
            {isEdit ? 'Simpan Perubahan' : 'Tambah'}
          </Button>
        </>
      }
    >
      <form id="tingkat-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 space-y-5">
          <div ref={formTopRef} />
          {submitError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
            </div>
          )}

          <Select
            label="Tingkat"
            options={NAMA_OPTIONS}
            value={watch('nama') ?? ''}
            placeholder="Pilih tingkat..."
            onChange={(e) =>
              form.setValue('nama', e.target.value as 'X' | 'XI' | 'XII', { shouldValidate: true })
            }
            error={errors.nama?.message}
          />

          {namaValue && (
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3 space-y-0.5">
              <p className="text-[11px] text-gray-400 dark:text-gray-500">Info otomatis</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Jenjang: <span className="font-medium">MA</span>
                {' · '}
                Urutan: <span className="font-medium">{getUrutan(namaValue)}</span>
              </p>
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
