'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Copy } from 'lucide-react'
import { Modal, Button, Input } from '@/components/ui'
import { useKelasList, useCopySiswaKelas } from '@/hooks/kelas/useKelas'
import { KelasSearch } from '@/app/dashboard/kelas/_components/KelasSearch'
import { getErrorMessage } from '@/lib/utils'

const FORM_ID = 'copy-siswa-form'
const schema = z.object({
  sourceKelasId: z.string().min(1, 'Pilih kelas sumber'),
  tanggalMasuk:  z.string().min(1, 'Tanggal masuk wajib diisi'),
})
type FormValues = z.infer<typeof schema>

interface Props { open: boolean; onClose: () => void; kelasId: string; namaKelas: string; tahunAjaranId: string }

export function CopySiswaModal({ open, onClose, kelasId, namaKelas, tahunAjaranId }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const mutation = useCopySiswaKelas(kelasId)
  const { data: allKelas = [] } = useKelasList()


  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { sourceKelasId: '', tanggalMasuk: '' },
  })

  const handleClose = () => { reset(); setSubmitError(null); onClose() }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      const result = await mutation.mutateAsync({ sourceKelasId: values.sourceKelasId, tanggalMasuk: values.tanggalMasuk })
      handleClose()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    }
  })

  return (
    <Modal open={open} onClose={handleClose} title="Salin Siswa dari Kelas Lain"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Batal</Button>
          <Button type="submit" form={FORM_ID} loading={mutation.isPending}
            leftIcon={<Copy className="h-4 w-4" />}>Salin Siswa</Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit}>
        <div className="p-6 space-y-4">
          {submitError && <ErrorBox message={submitError} />}

          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
            <p>Menyalin siswa <strong>NAIK_KELAS</strong> dari kelas sumber ke <strong>{namaKelas}</strong>.</p>
            <p className="text-xs">Siswa yang sudah ada tidak akan diduplikat.</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kelas Sumber <span className="text-red-500">*</span></label>
            <Controller name="sourceKelasId" control={control} render={({ field }) => (
              <KelasSearch
                kelasList={allKelas}
                selectedId={field.value}
                onChange={field.onChange}
                excludeId={kelasId}
                filterTahunAjaranId={tahunAjaranId}
                placeholder="Cari kelas (tahun lalu)..."
              />
            )} />
            {errors.sourceKelasId && <p className="text-xs text-red-500">{errors.sourceKelasId.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Masuk <span className="text-red-500">*</span></label>
            <Input {...register('tanggalMasuk')} type="date" error={errors.tanggalMasuk?.message} />
          </div>

          {allKelas.filter((k) => k.id !== kelasId && k.tahunAjaranId !== tahunAjaranId).length === 0 && (
            <p className="text-xs text-gray-400 italic">Tidak ada kelas dari tahun ajaran lain yang tersedia.</p>
          )}
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
