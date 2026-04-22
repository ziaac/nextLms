'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, Button, Input, Select } from '@/components/ui'
import {
  useCreateMasterMapel,
  useUpdateMasterMapel,
} from '@/hooks/mata-pelajaran/useMataPelajaran'
import { getErrorMessage } from '@/lib/utils'
import type { MasterMapel } from '@/types/akademik.types'

const KATEGORI_OPTIONS = [
  { value: 'WAJIB',             label: 'Wajib'             },
  { value: 'PEMINATAN',         label: 'Peminatan'         },
  { value: 'LINTAS_MINAT',      label: 'Lintas Minat'      },
  { value: 'MULOK',             label: 'Muatan Lokal'      },
  { value: 'PENGEMBANGAN_DIRI', label: 'Pengembangan Diri' },
]

const KELOMPOK_OPTIONS = [
  { value: 'A', label: 'Kelompok A — Wajib Umum'      },
  { value: 'B', label: 'Kelompok B — Wajib Peminatan'  },
  { value: 'C', label: 'Kelompok C — Pilihan'          },
]

const schema = z.object({
  kode:    z.string().min(1, 'Kode wajib diisi'),
  nama:    z.string().min(2, 'Nama minimal 2 karakter'),
  kategori: z.enum(['WAJIB','PEMINATAN','LINTAS_MINAT','MULOK','PENGEMBANGAN_DIRI'] as const),
  kelompok: z.enum(['A','B','C'] as const),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open:    boolean
  onClose: () => void
  data?:   MasterMapel | null
}

export default function MapelFormModal({ open, onClose, data }: Props) {
  const isEdit = !!data

  const createMutation = useCreateMasterMapel()
  const updateMutation = useUpdateMasterMapel()
  const mutation       = isEdit ? updateMutation : createMutation

  const [submitError, setSubmitError] = useState<string | null>(null)
  const formTopRef                    = useRef<HTMLDivElement>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { kode: '', nama: '' },
  })

  const { register, handleSubmit, formState: { errors }, watch, reset } = form

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
    reset({
      kode:     data.kode,
      nama:     data.nama,
      kategori: data.kategori,
      kelompok: data.kelompok,
    })
  }, [open, data?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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
      setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  const isPending = mutation.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
      size="md"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button type="submit" form="mapel-form" loading={isPending}>
            {isEdit ? 'Simpan Perubahan' : 'Tambah'}
          </Button>
        </>
      }
    >
      <form id="mapel-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 space-y-5">
          <div ref={formTopRef} />
          {submitError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Kode" placeholder="PAI, MTK, BIN..."
              error={errors.kode?.message} {...register('kode')} />
            <div className="sm:col-span-2">
              <Input label="Nama Mata Pelajaran" placeholder="Pendidikan Agama Islam"
                error={errors.nama?.message} {...register('nama')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Kategori" options={KATEGORI_OPTIONS} value={watch('kategori') ?? ''}
              placeholder="Pilih kategori..."
              onChange={(e) => form.setValue('kategori', e.target.value as any, { shouldValidate: true })}
              error={errors.kategori?.message} />
            <Select label="Kelompok" options={KELOMPOK_OPTIONS} value={watch('kelompok') ?? ''}
              placeholder="Pilih kelompok..."
              onChange={(e) => form.setValue('kelompok', e.target.value as any, { shouldValidate: true })}
              error={errors.kelompok?.message} />
          </div>
        </div>
      </form>
    </Modal>
  )
}
