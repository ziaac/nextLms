'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Modal, Button, Select } from '@/components/ui'
import { TimePicker } from '@/components/ui/TimePicker'
import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
import { useCreateMasterJam, useUpdateMasterJam } from '@/hooks/master-jam/useMasterJam'
import { TIPE_HARI_LIST, TIPE_HARI_LABEL } from '@/types/master-jam.types'
import type { MasterJam, CreateMasterJamPayload } from '@/types/master-jam.types'

const schema = z.object({
  namaSesi:       z.string().min(1, 'Nama sesi wajib diisi'),
  jamMulai:       z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:mm'),
  jamSelesai:     z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:mm'),
  bobotJp:        z.coerce.number().min(1).max(10),
  tipeHari:       z.enum(['REGULER', 'JUMAT', 'SENIN', 'KHUSUS']),
  isIstirahat:    z.boolean(),
  urutan:         z.coerce.number().min(1),
  tingkatKelasId: z.string().min(1, 'Tingkat wajib dipilih'),
})

type FormValues = {
  namaSesi:       string
  jamMulai:       string
  jamSelesai:     string
  bobotJp:        number
  tipeHari:       'REGULER' | 'JUMAT' | 'SENIN' | 'KHUSUS'
  isIstirahat:    boolean
  urutan:         number
  tingkatKelasId: string
}

const FORM_ID = 'master-jam-form'

interface Props {
  open:             boolean
  onClose:          () => void
  editData?:        MasterJam | null
  defaultTingkatId: string
}

export function MasterJamFormModal({ open, onClose, editData, defaultTingkatId }: Props) {
  const isEdit = !!editData

  const { data: tingkatListRaw } = useTingkatKelasList()
  const tingkatList = (tingkatListRaw as unknown as { id: string; nama: string }[] | undefined) ?? []

  const createMutation = useCreateMasterJam()
  const updateMutation = useUpdateMasterJam()
  const isPending      = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      namaSesi: '', jamMulai: '', jamSelesai: '',
      bobotJp: 1, tipeHari: 'REGULER', isIstirahat: false,
      urutan: 1, tingkatKelasId: defaultTingkatId,
    },
  })

  useEffect(() => {
    if (!open) return
    if (editData) {
      reset({
        namaSesi:       editData.namaSesi,
        jamMulai:       editData.jamMulai,
        jamSelesai:     editData.jamSelesai,
        bobotJp:        editData.bobotJp,
        tipeHari:       editData.tipeHari,
        isIstirahat:    editData.isIstirahat,
        urutan:         editData.urutan,
        tingkatKelasId: editData.tingkatKelasId,
      })
    } else {
      reset({
        namaSesi: '', jamMulai: '', jamSelesai: '',
        bobotJp: 1, tipeHari: 'REGULER', isIstirahat: false,
        urutan: 1, tingkatKelasId: defaultTingkatId,
      })
    }
  }, [open, editData, defaultTingkatId, reset])

  const onSubmit = async (values: FormValues) => {
    const payload: CreateMasterJamPayload = {
      namaSesi:       values.namaSesi,
      jamMulai:       values.jamMulai,
      jamSelesai:     values.jamSelesai,
      bobotJp:        Number(values.bobotJp),
      tipeHari:       values.tipeHari,
      isIstirahat:    values.isIstirahat,
      urutan:         Number(values.urutan),
      tingkatKelasId: values.tingkatKelasId,
    }
    try {
      if (isEdit && editData) {
        await updateMutation.mutateAsync({ id: editData.id, payload })
        toast.success('Sesi berhasil diperbarui')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Sesi berhasil ditambahkan')
      }
      onClose()
    } catch {
      toast.error(isEdit ? 'Gagal memperbarui sesi' : 'Gagal menambahkan sesi')
    }
  }

  const watchTingkat   = watch('tingkatKelasId')
  const watchTipeHari  = watch('tipeHari')
  const watchJamMulai  = watch('jamMulai')
  const watchJamSelesai = watch('jamSelesai')

  const tingkatOpts = tingkatList.map((t) => ({ label: 'Kelas ' + t.nama, value: t.id }))
  const tipeOpts    = TIPE_HARI_LIST.map((t) => ({ label: TIPE_HARI_LABEL[t], value: t }))

  const inputClass = (hasError?: boolean) =>
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors bg-white dark:bg-gray-900 ' +
    (hasError
      ? 'border-red-400 focus:ring-1 focus:ring-red-400'
      : 'border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Sesi Jam' : 'Tambah Sesi Jam'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button variant="primary" type="submit" form={FORM_ID} disabled={isPending}>
            {isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Sesi'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit as never)}>
        <div className="p-6 space-y-4">
          {/* Tingkat */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tingkat Kelas <span className="text-red-500">*</span>
            </label>
            <Select
              options={tingkatOpts}
              value={watchTingkat}
              onChange={(e) => setValue('tingkatKelasId', e.target.value, { shouldValidate: true })}
            />
            {errors.tingkatKelasId && (
              <p className="text-xs text-red-500">{errors.tingkatKelasId.message}</p>
            )}
          </div>

          {/* Nama Sesi + Urutan */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nama Sesi <span className="text-red-500">*</span>
              </label>
              <input
                {...register('namaSesi')}
                placeholder="Sesi 1, Istirahat, ..."
                className={inputClass(!!errors.namaSesi)}
              />
              {errors.namaSesi && (
                <p className="text-xs text-red-500">{errors.namaSesi.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Urutan</label>
              <input
                type="number" min={1}
                {...register('urutan')}
                className={inputClass(!!errors.urutan)}
              />
            </div>
          </div>

          {/* Jam Mulai & Selesai — TimePicker */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Jam Mulai <span className="text-red-500">*</span>
              </label>
              <TimePicker
                value={watchJamMulai}
                onChange={(v) => setValue('jamMulai', v, { shouldValidate: true })}
              />
              {errors.jamMulai && (
                <p className="text-xs text-red-500">{errors.jamMulai.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Jam Selesai <span className="text-red-500">*</span>
              </label>
              <TimePicker
                value={watchJamSelesai}
                onChange={(v) => setValue('jamSelesai', v, { shouldValidate: true })}
              />
              {errors.jamSelesai && (
                <p className="text-xs text-red-500">{errors.jamSelesai.message}</p>
              )}
            </div>
          </div>

          {/* Tipe Hari + Bobot JP */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipe Hari <span className="text-red-500">*</span>
              </label>
              <Select
                options={tipeOpts}
                value={watchTipeHari}
                onChange={(e) => setValue('tipeHari', e.target.value as FormValues['tipeHari'], { shouldValidate: true })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bobot JP</label>
              <input
                type="number" min={1} max={10}
                {...register('bobotJp')}
                className={inputClass(!!errors.bobotJp)}
              />
            </div>
          </div>

          {/* Istirahat */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <input
              type="checkbox" id="isIstirahat"
              {...register('isIstirahat')}
              className="h-4 w-4 rounded border-gray-300 text-amber-500"
            />
            <label htmlFor="isIstirahat" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              Sesi ini adalah{" "}
              <span className="font-semibold text-amber-600">istirahat</span>
              <span className="text-xs text-gray-400 ml-1">
                (tidak dipakai untuk input jadwal pelajaran)
              </span>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  )
}
