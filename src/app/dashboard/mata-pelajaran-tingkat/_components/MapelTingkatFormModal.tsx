'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, Button, Select } from '@/components/ui'
import {
  useCreateMapelTingkat,
  useMasterMapelList,
} from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
import { getErrorMessage } from '@/lib/utils'

const schema = z.object({
  masterMapelId:  z.string().min(1, 'Mata pelajaran wajib dipilih'),
  tingkatKelasId: z.string().min(1, 'Tingkat kelas wajib dipilih'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open:    boolean
  onClose: () => void
}

export default function MapelTingkatFormModal({ open, onClose }: Props) {
  const createMutation = useCreateMapelTingkat()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const formTopRef                    = useRef<HTMLDivElement>(null)

  const { data: allMasterMapel } = useMasterMapelList()
  const { data: allTingkat }     = useTingkatKelasList()

  const masterMapelOptions = (allMasterMapel ?? []).map((m) => ({
    value: m.id,
    label: `[${m.kode}] ${m.nama}`,
  }))

  const tingkatOptions = (allTingkat ?? [])
    .sort((a, b) => a.urutan - b.urutan)
    .map((t) => ({ value: t.id, label: `Tingkat ${t.nama}` }))

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { masterMapelId: '', tingkatKelasId: '' },
  })

  const { handleSubmit, formState: { errors }, watch, reset } = form

  const prevOpen = useRef(false)
  useEffect(() => {
    if (open && !prevOpen.current) {
      createMutation.reset()
      setSubmitError(null)
      reset()
    }
    prevOpen.current = open
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null)
    try {
      await createMutation.mutateAsync(values)
      onClose()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  const selectedMapel   = allMasterMapel?.find((m) => m.id === watch('masterMapelId'))
  const selectedTingkat = allTingkat?.find((t) => t.id === watch('tingkatKelasId'))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Mata Pelajaran per Tingkat"
      size="md"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}
            disabled={createMutation.isPending}>
            Batal
          </Button>
          <Button type="submit" form="mpt-form" loading={createMutation.isPending}>
            Tambah
          </Button>
        </>
      }
    >
      <form id="mpt-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 space-y-5">
          <div ref={formTopRef} />
          {submitError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/70
              dark:border-red-800/50 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
            </div>
          )}

          <Select
            label="Mata Pelajaran"
            options={masterMapelOptions}
            value={watch('masterMapelId')}
            placeholder="Pilih mata pelajaran..."
            onChange={(e) =>
              form.setValue('masterMapelId', e.target.value, { shouldValidate: true })
            }
            error={errors.masterMapelId?.message}
          />

          <Select
            label="Tingkat Kelas"
            options={tingkatOptions}
            value={watch('tingkatKelasId')}
            placeholder="Pilih tingkat..."
            onChange={(e) =>
              form.setValue('tingkatKelasId', e.target.value, { shouldValidate: true })
            }
            error={errors.tingkatKelasId?.message}
          />

          {selectedMapel && selectedTingkat && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/10
              border border-emerald-200 dark:border-emerald-700/50 px-4 py-3">
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Akan dibuat: <strong>{selectedMapel.nama}</strong> untuk{' '}
                <strong>Tingkat {selectedTingkat.nama}</strong>
              </p>
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
