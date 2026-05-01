'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Modal, Button, Input } from '@/components/ui'
import { useCreateMasterSikap, useUpdateMasterSikap } from '@/hooks/master-sikap/useMasterSikap'
import type { MasterSikap } from '@/types/master-sikap.types'

const schema = z.object({
  jenis:    z.enum(['POSITIF', 'NEGATIF']),
  kode:     z.string().min(1).max(20),
  nama:     z.string().min(1).max(150),
  uraian:   z.string().min(1),
  point:    z.coerce.number().min(-1000).max(1000),
  level:    z.coerce.number().min(1).max(10).optional(),
  kategori: z.string().max(50).optional(),
  sanksi:   z.string().optional(),
  isActive: z.boolean().optional(),
})

type FormValues = {
  jenis:    'POSITIF' | 'NEGATIF'
  kode:     string
  nama:     string
  uraian:   string
  point:    number
  level?:   number
  kategori?: string
  sanksi?:   string
  isActive?: boolean
}

interface Props {
  open: boolean
  onClose: () => void
  editData?: MasterSikap | null
}

export function MasterSikapFormModal({ open, onClose, editData }: Props) {
  const isEdit = !!editData
  const create = useCreateMasterSikap()
  const update = useUpdateMasterSikap()

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: { jenis: 'NEGATIF', level: 1, isActive: true },
  })

  const jenis = watch('jenis')

  useEffect(() => {
    if (open && editData) {
      reset({
        jenis:    editData.jenis,
        kode:     editData.kode,
        nama:     editData.nama,
        uraian:   editData.uraian,
        point:    editData.point,
        level:    editData.level,
        kategori: editData.kategori ?? '',
        sanksi:   editData.sanksi ?? '',
        isActive: editData.isActive,
      })
    } else if (open && !editData) {
      reset({ jenis: 'NEGATIF', level: 1, isActive: true, point: 0 })
    }
  }, [open, editData, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && editData) {
        await update.mutateAsync({ id: editData.id, payload: values })
        toast.success('Master sikap berhasil diperbarui')
      } else {
        await create.mutateAsync(values)
        toast.success('Master sikap berhasil ditambahkan')
      }
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Gagal menyimpan data')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Master Sikap' : 'Tambah Master Sikap'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4 p-6">

        {/* Jenis */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Jenis <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            {(['POSITIF', 'NEGATIF'] as const).map((j) => (
              <button
                key={j}
                type="button"
                onClick={() => setValue('jenis', j)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  jenis === j
                    ? j === 'POSITIF'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-400'
                      : 'bg-red-50 border-red-300 text-red-700 dark:bg-red-950/30 dark:border-red-700 dark:text-red-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                }`}
              >
                {j === 'POSITIF' ? '✦ Positif' : '✦ Negatif'}
              </button>
            ))}
          </div>
          {errors.jenis && <p className="text-xs text-red-500 mt-1">{errors.jenis.message}</p>}
        </div>

        {/* Kode & Nama */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Kode"
            placeholder="cth: P001"
            error={errors.kode?.message}
            {...register('kode')}
          />
          <Input
            label="Nama"
            placeholder="cth: Membantu teman"
            error={errors.nama?.message}
            {...register('nama')}
          />
        </div>

        {/* Uraian */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Uraian <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            placeholder="Deskripsi lengkap perilaku..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 resize-none"
            {...register('uraian')}
          />
          {errors.uraian && <p className="text-xs text-red-500 mt-1">{errors.uraian.message}</p>}
        </div>

        {/* Point, Level, Kategori */}
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Poin"
            type="number"
            placeholder="cth: 10 atau -5"
            error={errors.point?.message}
            {...register('point')}
          />
          <Input
            label="Level (1–10)"
            type="number"
            placeholder="1"
            error={errors.level?.message}
            {...register('level')}
          />
          <Input
            label="Kategori"
            placeholder="cth: Akademik"
            error={errors.kategori?.message}
            {...register('kategori')}
          />
        </div>

        {/* Sanksi */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Sanksi <span className="text-gray-400 font-normal">(opsional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Sanksi yang diberikan jika pelanggaran ini terjadi..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 resize-none"
            {...register('sanksi')}
          />
        </div>

        {/* Status */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input type="checkbox" className="w-4 h-4 rounded accent-emerald-600" {...register('isActive')} />
          <span className="text-sm text-gray-700 dark:text-gray-300">Aktif</span>
        </label>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
