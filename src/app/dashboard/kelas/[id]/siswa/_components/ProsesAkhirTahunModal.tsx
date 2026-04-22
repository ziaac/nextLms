'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GraduationCap } from 'lucide-react'
import { Modal, Button, Select } from '@/components/ui'
import { useProsesAkhirTahun } from '@/hooks/kelas/useKelas'
import { getErrorMessage } from '@/lib/utils'
import { StatusAkhirTahun } from '@/types/kelas.types'

const FORM_ID = 'proses-akhir-tahun-form'

function getStatusOptions(tingkatNama: string) {
  const isKelas12 = tingkatNama.includes('12') || tingkatNama.toLowerCase().includes('xii')
  return [
    { label: 'Pilih status default', value: '' },
    ...(isKelas12
      ? [{ label: 'Lulus', value: StatusAkhirTahun.LULUS }]
      : [{ label: 'Naik Kelas', value: StatusAkhirTahun.NAIK_KELAS }]
    ),
    { label: 'Tidak Naik Kelas', value: StatusAkhirTahun.TIDAK_NAIK },
  ]
}

const schema = z.object({
  defaultStatus: z.string().min(1, 'Pilih status default untuk seluruh siswa'),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  kelasId: string
  namaKelas: string
  tingkatNama: string
  jumlahSiswa: number
}

export function ProsesAkhirTahunModal({ open, onClose, kelasId, namaKelas, tingkatNama, jumlahSiswa }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const mutation = useProsesAkhirTahun(kelasId)
  const statusOptions = getStatusOptions(tingkatNama)

  const { handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { defaultStatus: '' },
  })

  const handleClose = () => { reset(); setSubmitError(null); onClose() }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      await mutation.mutateAsync({ defaultStatus: values.defaultStatus } as never)
      handleClose()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    }
  })

  return (
    <Modal open={open} onClose={handleClose} title="Proses Akhir Tahun" size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Batal</Button>
          <Button type="submit" form={FORM_ID} loading={mutation.isPending}
            leftIcon={<GraduationCap className="h-4 w-4" />}>
            Proses {jumlahSiswa} Siswa
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit}>
        <div className="p-6 space-y-4">
          {submitError && <ErrorBox message={submitError} />}

          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
            <p className="font-medium">Proses Akhir Tahun — {namaKelas}</p>
            <p>Status ini akan diterapkan ke <strong>semua {jumlahSiswa} siswa aktif</strong> sebagai default. Anda tetap bisa mengubah status per-siswa setelahnya.</p>
            <p className="text-xs">DO dan Mengundurkan Diri diatur per-siswa secara individual.</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status Default untuk Semua Siswa <span className="text-red-500">*</span>
            </label>
            <Controller name="defaultStatus" control={control} render={({ field }) => (
              <Select options={statusOptions} value={field.value} onChange={(e) => field.onChange(e.target.value)} />
            )} />
            {errors.defaultStatus && <p className="text-xs text-red-500">{errors.defaultStatus.message}</p>}
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
