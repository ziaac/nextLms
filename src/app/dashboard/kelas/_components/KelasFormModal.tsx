'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod'
import { Modal, Button, Input, Select } from '@/components/ui'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
import { useRuanganList } from '@/hooks/ruangan/useRuangan'
import { useCreateKelas, useUpdateKelas, useWaliKelasList } from '@/hooks/kelas/useKelas'
import { WaliKelasSearch } from './WaliKelasSearch'
import { getErrorMessage } from '@/lib/utils'
import type { Kelas } from '@/types/kelas.types'
import { RuanganSearch } from './RuanganSearch'


const schema = z.object({
  tahunAjaranId:  z.string().min(1, 'Tahun ajaran wajib dipilih'),
  tingkatKelasId: z.string().min(1, 'Tingkat kelas wajib dipilih'),
  namaKelas:      z.string().min(1, 'Nama kelas wajib diisi').max(50),
  kodeKelas:      z.string().max(20).optional().or(z.literal('')),
  waliKelasId:    z.string().optional().or(z.literal('')),
  kuotaMaksimal: z.coerce.number().int().min(1).max(100).default(36),
  ruanganId:      z.string().optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>
const FORM_ID = 'kelas-form'

interface Props { open: boolean; onClose: () => void; editData: Kelas | null }

export function KelasFormModal({ open, onClose, editData }: Props) {
  const isEdit = !!editData
  const [submitError, setSubmitError] = useState<string | null>(null)
  const formTopRef = useRef<HTMLDivElement>(null)

  const { data: tahunAjaranData }  = useTahunAjaranList()
  const { data: tingkatKelasData } = useTingkatKelasList()
  const { data: waliKelasList }    = useWaliKelasList()

  const createMutation = useCreateKelas()
  const updateMutation = useUpdateKelas(editData?.id ?? '')
  const isPending = createMutation.isPending || updateMutation.isPending

  const tahunAjaranList  = tahunAjaranData  ?? []
  const tingkatKelasList = tingkatKelasData ?? []

  const tahunAjaranOptions = [
    { label: 'Pilih Tahun Ajaran', value: '' },
    ...tahunAjaranList.map((t) => ({ label: t.nama, value: t.id })),
  ]
  const tingkatKelasOptions = [
    { label: 'Pilih Tingkat Kelas', value: '' },
    ...tingkatKelasList.map((t) => ({ label: t.nama, value: t.id })),
  ]

  const { data: ruanganList = [] } = useRuanganList()
const [ruanganSearch, setRuanganSearch] = useState('')
const ruanganFiltered = ruanganList
  .filter(r => r.isActive && r.jenis === 'KELAS')
  .filter(r =>
    !ruanganSearch ||
    r.nama.toLowerCase().includes(ruanganSearch.toLowerCase()) ||
    r.kode.toLowerCase().includes(ruanganSearch.toLowerCase())
  )
const ruanganOptions = [
  { label: 'Tidak ada / Pilih Ruangan', value: '' },
  ...ruanganFiltered.map(r => ({
    label: `${r.kode} — ${r.nama} (${r.kapasitas} org)`,
    value: r.id,
  })),
]

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { tahunAjaranId: '', tingkatKelasId: '', namaKelas: '', kodeKelas: '', waliKelasId: '', kuotaMaksimal: 36, ruanganId: '' },
  })

  useEffect(() => {
    if (!open) return
    setSubmitError(null)
    reset(editData ? {
      tahunAjaranId:  editData.tahunAjaranId,
      tingkatKelasId: editData.tingkatKelasId,
      namaKelas:      editData.namaKelas,
      kodeKelas:      editData.kodeKelas ?? '',
      waliKelasId:    editData.waliKelasId ?? '',
      kuotaMaksimal:  editData.kuotaMaksimal,
      ruanganId:      editData.ruangan?.id ?? '',
    } : { tahunAjaranId: '', tingkatKelasId: '', namaKelas: '', kodeKelas: '', waliKelasId: '', kuotaMaksimal: 36, ruanganId: '' })
  }, [open, editData?.id])

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    const dto = {
      tahunAjaranId: values.tahunAjaranId, tingkatKelasId: values.tingkatKelasId,
      namaKelas: values.namaKelas, kodeKelas: values.kodeKelas || undefined,
      waliKelasId: values.waliKelasId || undefined, kuotaMaksimal: values.kuotaMaksimal,
      ruanganId: values.ruanganId || undefined,
    }
    try {
      if (isEdit) await updateMutation.mutateAsync(dto)
      else        await createMutation.mutateAsync(dto)
      onClose()
    } catch (err) {
      const msg = getErrorMessage(err)
      setSubmitError(msg)
      setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  })

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Kelas' : 'Tambah Kelas Baru'} size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={isPending}>Batal</Button>
          <Button type="submit" form={FORM_ID} loading={isPending}>
            {isEdit ? 'Simpan Perubahan' : 'Tambah Kelas'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit}>
        <div className="p-6 space-y-4">
          <div ref={formTopRef} />
          {submitError && <ErrorBox message={submitError} />}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tahun Ajaran <span className="text-red-500">*</span></label>
            <Controller name="tahunAjaranId" control={control} render={({ field }) => (
              <Select options={tahunAjaranOptions} value={field.value} onChange={(e) => field.onChange(e.target.value)} />
            )} />
            {errors.tahunAjaranId && <p className="text-xs text-red-500">{errors.tahunAjaranId.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tingkat Kelas <span className="text-red-500">*</span></label>
            <Controller name="tingkatKelasId" control={control} render={({ field }) => (
              <Select options={tingkatKelasOptions} value={field.value} onChange={(e) => field.onChange(e.target.value)} />
            )} />
            {errors.tingkatKelasId && <p className="text-xs text-red-500">{errors.tingkatKelasId.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Kelas <span className="text-red-500">*</span></label>
            <Input {...register('namaKelas')} placeholder="Contoh: XII IPA 1" error={errors.namaKelas?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kode Kelas</label>
              <Input {...register('kodeKelas')} placeholder="XII-IPA-1" error={errors.kodeKelas?.message} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ruangan</label>
              <Controller name="ruanganId" control={control} render={({ field }) => (
                <RuanganSearch
                  ruanganList={ruanganList}
                  selectedId={field.value ?? ''}
                  onChange={field.onChange}
                  filterJenis="KELAS"
                />
              )} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Wali Kelas</label>
            <Controller name="waliKelasId" control={control} render={({ field }) => (
              <WaliKelasSearch waliList={waliKelasList ?? []} selectedId={field.value ?? ''} onChange={field.onChange} />
            )} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kuota Maksimal Siswa</label>
            <Input {...register('kuotaMaksimal')} type="number" min={1} max={100} placeholder="36" error={errors.kuotaMaksimal?.message} />
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
