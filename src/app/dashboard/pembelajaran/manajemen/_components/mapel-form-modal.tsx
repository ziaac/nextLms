'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm, Controller }         from 'react-hook-form'
import { zodResolver }                 from '@hookform/resolvers/zod'
import { z }                           from 'zod'
import { Modal, Button, Input, Select, Combobox } from '@/components/ui'
import {
  useMapelTingkatByTingkat,
  useMapelTingkatById,
  useCreateMataPelajaran,
  useUpdateMataPelajaran,
} from '@/hooks/useMataPelajaran'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { useKelasList }            from '@/hooks/kelas/useKelas'
import { useTahunAjaranList }      from '@/hooks/tahun-ajaran/useTahunAjaran'
import { getErrorMessage }         from '@/lib/utils'
import type { MataPelajaran }      from '@/types/akademik.types'


const FORM_ID = 'mapel-form'

const schema = z.object({
  mataPelajaranTingkatId: z.string().min(1, 'Pilih mata pelajaran'),
  semesterId:             z.string().min(1, 'Pilih semester'),
  kelasId:                z.string().min(1, 'Pilih kelas'),
  ruanganId:              z.string().optional(), // <--- TAMBAHAN
  kkm:                    z.coerce.number().min(0).max(100),
  bobot:                  z.coerce.number().min(1).max(10),
  targetPertemuan:        z.coerce.number().min(1).max(100).default(16),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open:      boolean
  onClose:   () => void
  editData?: MataPelajaran | null
  kelasId?:        string
  tahunAjaranId?:  string
  tingkatKelasId?: string
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 px-4 py-3">
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
    </div>
  )
}

export function MapelFormModal({
  open, onClose, editData,
  kelasId: kelasIdCtx,
  tahunAjaranId: tahunAjaranIdCtx,
  tingkatKelasId: tingkatKelasIdCtx,
}: Props) {
  const [submitError, setSubmitError]             = useState<string | null>(null)
  const [selectedTingkatId, setSelectedTingkatId] = useState<string>(tingkatKelasIdCtx ?? '')
  const [selectedTAId, setSelectedTAId]           = useState<string>(tahunAjaranIdCtx ?? '')
  const formTopRef                                = useRef<HTMLDivElement>(null)

  const hasKelasCtx = !!kelasIdCtx

  const { data: tahunAjaranList = [] }  = useTahunAjaranList()
  const { data: semesterList = [] }     = useSemesterByTahunAjaran(selectedTAId || null)
  const { data: kelasList = [] }        = useKelasList(
    selectedTAId ? { tahunAjaranId: selectedTAId } : undefined,
  )
  const { data: mapelTingkatList = [] } = useMapelTingkatByTingkat(selectedTingkatId || null)

  const createMutation = useCreateMataPelajaran()
  const updateMutation = useUpdateMataPelajaran()

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    // FIX: zodResolver(schema as never) untuk hindari type mismatch z.coerce
    resolver: zodResolver(schema as never),
    defaultValues: {
      mataPelajaranTingkatId: '',
      semesterId:             '',
      kelasId:                kelasIdCtx ?? '',
      kkm:                    75,
      bobot:                  2,
      ruanganId:              '',
      targetPertemuan:        16,
    },
  })

  const watchedMapelTingkatId = watch('mataPelajaranTingkatId')
  const { data: selectedMapelTingkat } = useMapelTingkatById(watchedMapelTingkatId || null)
  void selectedMapelTingkat // suppress unused warning
  const watchedKelasId = watch('kelasId')
  useEffect(() => {
    // Berjalan di belakang layar: jika kelas dipilih & ini bukan mode edit
    if (watchedKelasId && !editData) {
      const kelasTerpilih = kelasList.find((k) => k.id === watchedKelasId)
      // Set ruanganId milik form dengan ruanganId milik kelas
      setValue('ruanganId', kelasTerpilih?.ruanganId || '')
    }
  }, [watchedKelasId, kelasList, setValue, editData])

  useEffect(() => {
    if (!open) return
    setSubmitError(null)
    if (editData) {
      reset({
        mataPelajaranTingkatId: editData.mataPelajaranTingkatId,
        semesterId:             editData.semesterId,
        kelasId:                editData.kelasId,
        kkm:                    editData.kkm,
        bobot:                  editData.bobot,
        ruanganId:              editData.ruanganId ?? '', // <-- TAMBAHAN
        targetPertemuan:        16,
      })
      setSelectedTingkatId(editData.mataPelajaranTingkat.tingkatKelasId)
      setSelectedTAId(editData.kelas.tahunAjaranId)
    } else {
      reset({
        mataPelajaranTingkatId: '',
        semesterId:             '',
        kelasId:                kelasIdCtx ?? '',
        kkm:                    75,
        bobot:                  2,
        ruanganId:              '',
        targetPertemuan:        16,
      })
      setSelectedTingkatId(tingkatKelasIdCtx ?? '')
      setSelectedTAId(tahunAjaranIdCtx ?? '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editData?.id])

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      if (editData) {
        // FIX: Hapus "as never", biarkan TypeScript yang memvalidasi
        await updateMutation.mutateAsync({ id: editData.id, payload: values })
      } else {
        await createMutation.mutateAsync(values)
      }
      onClose()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  })

  // Options
  const taOptions = [
    { label: 'Pilih Tahun Ajaran', value: '' },
    ...tahunAjaranList.map((ta) => ({ label: ta.nama, value: ta.id })),
  ]
  const semesterOptions = [
    { label: 'Pilih Semester', value: '' },
    ...semesterList.map((s) => ({ label: `Semester ${s.nama}`, value: s.id })),
  ]
  const kelasOptions = [
    { label: 'Pilih Kelas', value: '' },
    ...kelasList.map((k) => ({ label: k.namaKelas, value: k.id })),
  ]
  const mapelOptions = mapelTingkatList.map((mt) => ({
    label: `${mt.masterMapel.kode} — ${mt.masterMapel.nama}`,
    value: mt.id,
    hint:  mt.masterMapel.kode,
  }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editData ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" form={FORM_ID} loading={isPending}>
            {editData ? 'Simpan Perubahan' : 'Tambah'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit}>
        <div className="p-6 space-y-5">
          <div ref={formTopRef} />
          {submitError && <ErrorBox message={submitError} />}

          {/* Tahun Ajaran */}
          {!hasKelasCtx && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tahun Ajaran <span className="text-red-500">*</span>
              </label>
              <Select
                options={taOptions}
                value={selectedTAId}
                onChange={(e) => {
                  setSelectedTAId(e.target.value)
                  setValue('kelasId', '')
                  setValue('semesterId', '')
                }}
              />
            </div>
          )}

          {/* Semester */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Semester <span className="text-red-500">*</span>
            </label>
            <Controller
              name="semesterId"
              control={control}
              render={({ field }) => (
                <Select
                  options={semesterOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            {errors.semesterId && (
              <p className="text-xs text-red-500">{errors.semesterId.message}</p>
            )}
          </div>

          {/* Kelas */}
          {!hasKelasCtx && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Kelas <span className="text-red-500">*</span>
              </label>
              <Controller
                name="kelasId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={kelasOptions}
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.value)
                      const kelas = kelasList.find((k) => k.id === e.target.value)
                      if (kelas) setSelectedTingkatId(kelas.tingkatKelasId)
                    }}
                  />
                )}
              />
              {errors.kelasId && (
                <p className="text-xs text-red-500">{errors.kelasId.message}</p>
              )}
            </div>
          )}

          {/* Mata Pelajaran */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mata Pelajaran <span className="text-red-500">*</span>
            </label>
            <Controller
              name="mataPelajaranTingkatId"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={mapelOptions}
                  value={field.value}
                  onChange={field.onChange}
                  searchOnly
                  minSearchLength={3}
                  placeholder={
                    !selectedTingkatId && !hasKelasCtx
                      ? 'Pilih kelas dahulu...'
                      : 'Cari mata pelajaran...'
                  }
                  disabled={!selectedTingkatId}
                  hasError={!!errors.mataPelajaranTingkatId}
                />
              )}
            />
            {errors.mataPelajaranTingkatId && (
              <p className="text-xs text-red-500">{errors.mataPelajaranTingkatId.message}</p>
            )}
          </div>

          {/* KKM, Bobot, Target Pertemuan */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">KKM</label>
              <Input
                {...register('kkm')}
                type="number" min={0} max={100}
                error={errors.kkm?.message}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bobot/Pekan</label>
              <Input
                {...register('bobot')}
                type="number" min={1} max={10}
                error={errors.bobot?.message}
              />
            </div>
            {/* FIX: field baru targetPertemuan */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Target Pertemuan
              </label>
              <Input
                {...register('targetPertemuan')}
                type="number" min={1} max={100}
                placeholder="16"
                error={errors.targetPertemuan?.message}
              />
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Default: 16 pertemuan</p>
            </div>
          </div>

        </div>
      </form>
    </Modal>
  )
}
