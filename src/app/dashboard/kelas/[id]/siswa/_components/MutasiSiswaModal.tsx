'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, Button, Input, Select } from '@/components/ui'
import { useKelasList } from '@/hooks/kelas/useKelas'
import { KelasSearch } from '@/app/dashboard/kelas/_components/KelasSearch'
import { usePindahSiswa, useKeluarkanSiswa } from '@/hooks/kelas/useKelasSiswa'
import { getErrorMessage } from '@/lib/utils'
import { StatusSiswa } from '@/types/kelas.types'
import type { KelasSiswa } from '@/types/kelas.types'

type TipeMutasi = 'PINDAH' | 'KELUAR'

const schemaPindah = z.object({
  kelasBaruId:   z.string().min(1, 'Pilih kelas tujuan'),
  tanggalPindah: z.string().min(1, 'Tanggal pindah wajib diisi'),
  alasan:        z.string().optional(),
})
const schemaKeluar = z.object({
  status:        z.enum([StatusSiswa.KELUAR, StatusSiswa.DO, StatusSiswa.MENGUNDURKAN_DIRI]).refine(val => !!val, { message: 'Pilih status' }),
  tanggalKeluar: z.string().min(1, 'Tanggal keluar wajib diisi'),
  alasan:        z.string().optional(),
})

type PindahValues = z.infer<typeof schemaPindah>
type KeluarValues = z.infer<typeof schemaKeluar>

const STATUS_KELUAR_OPTIONS = [
  { label: 'Pilih status keluar', value: '' },
  { label: 'Keluar', value: StatusSiswa.KELUAR },
  { label: 'Drop Out (DO)', value: StatusSiswa.DO },
  { label: 'Mengundurkan Diri', value: StatusSiswa.MENGUNDURKAN_DIRI },
]

const textareaCls = 'w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none'
const labelCls = 'text-sm font-medium text-gray-700 dark:text-gray-300'

interface Props { open: boolean; onClose: () => void; kelasSiswa: KelasSiswa | null; kelasId: string }

const PINDAH_FORM_ID = 'mutasi-pindah-form'
const KELUAR_FORM_ID = 'mutasi-keluar-form'

export function MutasiSiswaModal({ open, onClose, kelasSiswa, kelasId }: Props) {
  const [tipeMutasi, setTipeMutasi] = useState<TipeMutasi>('PINDAH')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: kelasData = [] } = useKelasList()
  const pindahMutation = usePindahSiswa(kelasId)
  const keluarMutation = useKeluarkanSiswa(kelasId)


  const pindahForm = useForm<PindahValues>({ resolver: zodResolver(schemaPindah), defaultValues: { kelasBaruId: '', tanggalPindah: '', alasan: '' } })
  const keluarForm = useForm<KeluarValues>({ resolver: zodResolver(schemaKeluar), defaultValues: { tanggalKeluar: '', alasan: '' } })

  useEffect(() => {
    if (!open) return
    setTipeMutasi('PINDAH')
    setSubmitError(null)
    pindahForm.reset()
    keluarForm.reset()
  }, [open])

  const isPending = pindahMutation.isPending || keluarMutation.isPending

  const handlePindah = pindahForm.handleSubmit(async (values) => {
    if (!kelasSiswa) return
    setSubmitError(null)
    try {
      await pindahMutation.mutateAsync({ siswaId: kelasSiswa.siswaId, dto: { kelasBaruId: values.kelasBaruId, tanggalPindah: values.tanggalPindah, alasan: values.alasan || undefined } })
      onClose()
    } catch (err) { setSubmitError(getErrorMessage(err)) }
  })

  const handleKeluar = keluarForm.handleSubmit(async (values) => {
    if (!kelasSiswa) return
    setSubmitError(null)
    try {
      await keluarMutation.mutateAsync({ siswaId: kelasSiswa.siswaId, dto: { tanggalKeluar: values.tanggalKeluar, status: values.status, alasan: values.alasan || undefined } })
      onClose()
    } catch (err) { setSubmitError(getErrorMessage(err)) }
  })

  return (
    <Modal open={open} onClose={onClose}
      title={`Mutasi — ${kelasSiswa?.siswa.profile.namaLengkap ?? ''}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          {tipeMutasi === 'PINDAH'
            ? <Button type="submit" form={PINDAH_FORM_ID} loading={isPending}>Pindahkan Siswa</Button>
            : <Button type="submit" form={KELUAR_FORM_ID} loading={isPending} className="bg-red-600 hover:bg-red-700">Keluarkan Siswa</Button>
          }
        </>
      }
    >
      <div className="p-6 space-y-4">
        {submitError && <ErrorBox message={submitError} />}

        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {(['PINDAH', 'KELUAR'] as TipeMutasi[]).map((tipe) => (
            <button key={tipe} type="button" onClick={() => { setTipeMutasi(tipe); setSubmitError(null) }}
              className={['flex-1 py-2.5 text-sm font-medium transition-colors',
                tipeMutasi === tipe ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
              ].join(' ')}>
              {tipe === 'PINDAH' ? 'Pindah Kelas' : 'Keluar / Lulus / DO'}
            </button>
          ))}
        </div>

        {tipeMutasi === 'PINDAH' && (
          <form id={PINDAH_FORM_ID} onSubmit={handlePindah} className="space-y-4">
          <div className="space-y-1">
            <label className={labelCls}>Kelas Tujuan <span className="text-red-500">*</span></label>
            <Controller name="kelasBaruId" control={pindahForm.control} render={({ field }) => (
              <KelasSearch 
                kelasList={kelasData}       // 1. Tambahkan baris ini
                selectedId={field.value}    // 2. Ubah 'value' menjadi 'selectedId'
                onChange={field.onChange}
                excludeId={kelasId}
              />
            )} />
            {pindahForm.formState.errors.kelasBaruId && <p className="text-xs text-red-500">{pindahForm.formState.errors.kelasBaruId.message}</p>}
          </div>
            <div className="space-y-1">
              <label className={labelCls}>Tanggal Pindah <span className="text-red-500">*</span></label>
              <Input {...pindahForm.register('tanggalPindah')} type="date" error={pindahForm.formState.errors.tanggalPindah?.message} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Alasan (opsional)</label>
              <textarea {...pindahForm.register('alasan')} rows={3} placeholder="Alasan kepindahan..." className={textareaCls} />
            </div>
          </form>
        )}

        {tipeMutasi === 'KELUAR' && (
          <form id={KELUAR_FORM_ID} onSubmit={handleKeluar} className="space-y-4">
            <div className="space-y-1">
              <label className={labelCls}>Status Keluar <span className="text-red-500">*</span></label>
              <Controller name="status" control={keluarForm.control} render={({ field }) => (
                <Select options={STATUS_KELUAR_OPTIONS} value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value as KeluarValues['status'])} />
              )} />
              {keluarForm.formState.errors.status && <p className="text-xs text-red-500">{keluarForm.formState.errors.status.message}</p>}
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Tanggal Keluar <span className="text-red-500">*</span></label>
              <Input {...keluarForm.register('tanggalKeluar')} type="date" error={keluarForm.formState.errors.tanggalKeluar?.message} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Alasan (opsional)</label>
              <textarea {...keluarForm.register('alasan')} rows={3} placeholder="Alasan keluar..." className={textareaCls} />
            </div>
          </form>
        )}
      </div>
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
