'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, Button, Select } from '@/components/ui'
import { useUpdateStatusAkhirTahun } from '@/hooks/kelas/useKelasSiswa'
import { getErrorMessage } from '@/lib/utils'
import { StatusAkhirTahun } from '@/types/kelas.types'
import type { KelasSiswa } from '@/types/kelas.types'

const FORM_ID = 'status-akhir-tahun-form'

// Filter opsi berdasarkan tingkat kelas
function getStatusOptions(tingkatNama: string) {
  const isKelas12 = tingkatNama.includes('12') || tingkatNama.toLowerCase().includes('xii')
  const baseOptions = isKelas12
    ? [
        { label: 'Lulus', value: StatusAkhirTahun.LULUS },
        { label: 'Tidak Lulus', value: StatusAkhirTahun.TIDAK_NAIK },
      ]
    : [
        { label: 'Naik Kelas', value: StatusAkhirTahun.NAIK_KELAS },
        { label: 'Tidak Naik Kelas', value: StatusAkhirTahun.TIDAK_NAIK },
      ]
  return [
    { label: 'Pilih status akhir tahun', value: '' },
    ...baseOptions,
    { label: 'Drop Out (DO)', value: StatusAkhirTahun.DO },
    { label: 'Mengundurkan Diri', value: StatusAkhirTahun.MENGUNDURKAN_DIRI },
  ]
}

const schema = z.object({
  statusAkhirTahun:  z.string().min(1, 'Pilih status akhir tahun'),
  catatanAkhirTahun: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  kelasSiswa: KelasSiswa | null
  kelasId: string
  tingkatNama: string
}

export function StatusAkhirTahunModal({ open, onClose, kelasSiswa, kelasId, tingkatNama }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const mutation = useUpdateStatusAkhirTahun(kelasId)
  const statusOptions = getStatusOptions(tingkatNama)

  const { handleSubmit, control, reset, register, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { statusAkhirTahun: '', catatanAkhirTahun: '' },
  })

  useEffect(() => {
    if (!open || !kelasSiswa) return
    setSubmitError(null)
    reset({
      statusAkhirTahun:  kelasSiswa.statusAkhirTahun ?? '',
      catatanAkhirTahun: kelasSiswa.catatanAkhirTahun ?? '',
    })
  }, [open, kelasSiswa?.id])

  const onSubmit = handleSubmit(async (values) => {
    if (!kelasSiswa) return
    setSubmitError(null)
    try {
      await mutation.mutateAsync({
        siswaId: kelasSiswa.siswaId,
        statusAkhirTahun: values.statusAkhirTahun,
        catatanAkhirTahun: values.catatanAkhirTahun || undefined,
      })
      onClose()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    }
  })

  const textareaCls = 'w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none'

  return (
    <Modal open={open} onClose={onClose}
      title={`Status Akhir Tahun — ${kelasSiswa?.siswa.profile.namaLengkap ?? ''}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" form={FORM_ID} loading={mutation.isPending}>Simpan</Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit}>
        <div className="p-6 space-y-4">
          {submitError && <ErrorBox message={submitError} />}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status Akhir Tahun <span className="text-red-500">*</span>
            </label>
            <Controller name="statusAkhirTahun" control={control} render={({ field }) => (
              <Select options={statusOptions} value={field.value} onChange={(e) => field.onChange(e.target.value)} />
            )} />
            {errors.statusAkhirTahun && <p className="text-xs text-red-500">{errors.statusAkhirTahun.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Catatan (opsional)</label>
            <textarea {...register('catatanAkhirTahun')} rows={3}
              placeholder="Catatan tambahan, alasan, dsb..."
              className={textareaCls} />
          </div>
        </div>
      </form>
    </Modal>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 px-4 py-3">
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
    </div>
  )
}
