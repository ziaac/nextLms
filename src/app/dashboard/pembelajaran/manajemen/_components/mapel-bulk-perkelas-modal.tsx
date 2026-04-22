'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver }         from '@hookform/resolvers/zod'
import { z }                   from 'zod'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Modal, Button, Input, Select, Combobox } from '@/components/ui'
import { useSemesterByTahunAjaran }     from '@/hooks/semester/useSemester'
import { useTahunAjaranList }           from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useTingkatKelasList }          from '@/hooks/tingkat-kelas/useTingkatKelas'
import { useMapelTingkatByTingkat }     from '@/hooks/useMataPelajaran'
import {
  useBulkPerKelasPreview,
  useBulkPerKelasExecute,
} from '@/hooks/mata-pelajaran/useMataPelajaran'
import { getErrorMessage } from '@/lib/utils'
import { toast }           from 'sonner'
import type {
  BulkPerKelasPreviewResponse,
  BulkPerKelasPreviewItem,
} from '@/types/akademik.types'

// ── Schema Step 1 ─────────────────────────────────────────────
const step1Schema = z.object({
  semesterId:             z.string().min(1, 'Pilih semester'),
  tingkatKelasId:         z.string().min(1, 'Pilih tingkat'),
  mataPelajaranTingkatId: z.string().min(1, 'Pilih mata pelajaran'),
  kkm:                    z.coerce.number().min(0).max(100).default(75),
  bobot:                  z.coerce.number().min(1).max(10).default(2),
  targetPertemuan:        z.coerce.number().min(1).max(100).default(16),
})
type Step1Values = z.infer<typeof step1Schema>

interface Props {
  open:    boolean
  onClose: () => void
}

// ── Badge status per baris ────────────────────────────────────
function StatusBadge({ exists }: { exists: boolean }) {
  if (exists) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
        <AlertCircle className="w-3 h-3" />
        Sudah ada
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
      <CheckCircle2 className="w-3 h-3" />
      Akan dibuat
    </span>
  )
}

// ── Progress bar sederhana ────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 bg-emerald-500 rounded-full transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

const FORM_ID = 'bulk-perkelas-step1'

export function MapelBulkPerKelasModal({ open, onClose }: Props) {
  const [step,        setStep]        = useState<1 | 2 | 3>(1)
  const [preview,     setPreview]     = useState<BulkPerKelasPreviewResponse | null>(null)
  const [progress,    setProgress]    = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Data hooks ────────────────────────────────────────────
  const { data: tahunAjaranList = [] } = useTahunAjaranList()
  const [selectedTAId, setSelectedTAId] = useState('')

  const { data: semesterList = [] }   = useSemesterByTahunAjaran(selectedTAId || null)
  const { data: tingkatList  = [] }   = useTingkatKelasList()

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema as never),
    defaultValues: { kkm: 75, bobot: 2, targetPertemuan: 16 },
  })

  const watchedTingkatId = watch('tingkatKelasId')
  const { data: mapelTingkatList = [] } = useMapelTingkatByTingkat(watchedTingkatId || null)

  // ── Mutations ─────────────────────────────────────────────
  const previewMutation  = useBulkPerKelasPreview()
  const executeMutation  = useBulkPerKelasExecute()

  // Reset saat modal dibuka/tutup
  useEffect(() => {
    if (!open) return
    setStep(1)
    setPreview(null)
    setProgress(0)
    setSubmitError(null)
    setSelectedTAId('')
    reset({ kkm: 75, bobot: 2, targetPertemuan: 16 })
  }, [open, reset])

  // ── Step 1 → 2: ambil preview ─────────────────────────────
  const onStep1Submit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      const result = await previewMutation.mutateAsync(values)
      setPreview(result)
      setStep(2)
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    }
  })

  // ── Step 2 → 3: eksekusi insert ───────────────────────────
  const onConfirm = async () => {
    if (!preview) return
    setStep(3)
    setProgress(10)

    try {
      // Simulasi progress visual selagi request berjalan
      const timer = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 85))
      }, 300)

      await executeMutation.mutateAsync({
        semesterId:             preview.meta.semester.id,
        mataPelajaranTingkatId: preview.meta.mataPelajaran.id,
        kkm:                    preview.meta.kkm,
        bobot:                  preview.meta.bobot,
        targetPertemuan:        preview.meta.targetPertemuan,
      })

      clearInterval(timer)
      setProgress(100)
      toast.success(`${preview.meta.totalBaru} mata pelajaran berhasil dibuat`)

      // Tutup otomatis setelah 1.2 detik
      setTimeout(() => onClose(), 1200)
    } catch (err) {
      setProgress(0)
      setStep(2)
      setSubmitError(getErrorMessage(err))
    }
  }

  // ── Options ───────────────────────────────────────────────
  const taOptions = [
    { label: 'Pilih Tahun Ajaran', value: '' },
    ...tahunAjaranList.map((ta) => ({ label: ta.nama, value: ta.id })),
  ]
  const semesterOptions = [
    { label: 'Pilih Semester', value: '' },
    ...semesterList.map((s) => ({ label: `Semester ${s.nama}`, value: s.id })),
  ]
  const tingkatOptions = [
    { label: 'Pilih Tingkat', value: '' },
    ...tingkatList.map((t) => ({ label: `${t.nama} — ${t.jenjang}`, value: t.id })),
  ]
  const mapelOptions = mapelTingkatList.map((mt) => ({
    label: `${mt.masterMapel.kode} — ${mt.masterMapel.nama}`,
    value: mt.id,
    hint:  mt.masterMapel.kode,
  }))

  // ── Render title per step ─────────────────────────────────
  const titles: Record<number, string> = {
    1: 'Tambah Bulk per Tingkat',
    2: 'Konfirmasi Data Bulk',
    3: 'Memproses...',
  }

  return (
    <Modal
      open={open}
      onClose={step === 3 ? () => {} : onClose}
      title={titles[step]}
      size="lg"
      footer={
        step === 1 ? (
          <>
            <Button variant="secondary" onClick={onClose}>Batal</Button>
            <Button type="submit" form={FORM_ID} loading={previewMutation.isPending}>
              Lanjut →
            </Button>
          </>
        ) : step === 2 ? (
          <>
            <Button variant="secondary" onClick={() => { setStep(1); setSubmitError(null) }}>
              ← Kembali
            </Button>
            <Button
              onClick={onConfirm}
              disabled={preview?.meta.totalBaru === 0}
              loading={executeMutation.isPending}
            >
              Konfirmasi & Simpan
            </Button>
          </>
        ) : null
      }
    >
      {/* ── STEP 1: Form ──────────────────────────────────── */}
      {step === 1 && (
        <form id={FORM_ID} onSubmit={onStep1Submit}>
          <div className="p-6 space-y-5">
            {submitError && (
              <div className="rounded-lg bg-red-50 border border-red-200/70 px-4 py-3">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            {/* Tahun Ajaran */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tahun Ajaran <span className="text-red-500">*</span>
              </label>
              <Select
                options={taOptions}
                value={selectedTAId}
                onChange={(e) => setSelectedTAId(e.target.value)}
              />
            </div>

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
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={!selectedTAId}
                  />
                )}
              />
              {errors.semesterId && (
                <p className="text-xs text-red-500">{errors.semesterId.message}</p>
              )}
            </div>

            {/* Tingkat Kelas */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tingkat Kelas <span className="text-red-500">*</span>
              </label>
              <Controller
                name="tingkatKelasId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={tingkatOptions}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
              {errors.tingkatKelasId && (
                <p className="text-xs text-red-500">{errors.tingkatKelasId.message}</p>
              )}
            </div>

            {/* Mata Pelajaran */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Mata Pelajaran Tingkat <span className="text-red-500">*</span>
              </label>
              <Controller
                name="mataPelajaranTingkatId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={mapelOptions}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    searchOnly
                    minSearchLength={3}
                    placeholder={watchedTingkatId ? 'Cari mata pelajaran...' : 'Pilih tingkat dahulu'}
                    disabled={!watchedTingkatId}
                    hasError={!!errors.mataPelajaranTingkatId}
                  />
                )}
              />
              {errors.mataPelajaranTingkatId && (
                <p className="text-xs text-red-500">{errors.mataPelajaranTingkatId.message}</p>
              )}
            </div>

            {/* KKM / Bobot / Target */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">KKM</label>
                <Input {...register('kkm')} type="number" min={0} max={100} error={errors.kkm?.message} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bobot/Pekan</label>
                <Input {...register('bobot')} type="number" min={1} max={10} error={errors.bobot?.message} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Pertemuan</label>
                <Input {...register('targetPertemuan')} type="number" min={1} max={100} error={errors.targetPertemuan?.message} />
                <p className="text-[10px] text-gray-400">Default: 16</p>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── STEP 2: Konfirmasi ────────────────────────────── */}
      {step === 2 && preview && (
        <div className="p-6 space-y-5">
          {submitError && (
            <div className="rounded-lg bg-red-50 border border-red-200/70 px-4 py-3">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          {/* Meta info */}
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Semester</span>
              <span className="font-medium">{preview.meta.semester.nama} — {preview.meta.semester.tahunAjaran.nama}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Mata Pelajaran</span>
              <span className="font-medium">{preview.meta.mataPelajaran.kode} — {preview.meta.mataPelajaran.nama}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tingkat</span>
              <span className="font-medium">{preview.meta.mataPelajaran.tingkatKelas.nama}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
            <div className="flex gap-4 text-sm">
              <span className="text-gray-500">KKM: <strong>{preview.meta.kkm}</strong></span>
              <span className="text-gray-500">Bobot: <strong>{preview.meta.bobot} JP</strong></span>
              <span className="text-gray-500">Target: <strong>{preview.meta.targetPertemuan}x</strong></span>
            </div>
          </div>

          {/* Summary badge */}
          <div className="flex gap-3">
            <div className="flex-1 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{preview.meta.totalBaru}</p>
              <p className="text-xs text-emerald-600">Akan Dibuat</p>
            </div>
            <div className="flex-1 rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{preview.meta.totalSkip}</p>
              <p className="text-xs text-amber-600">Sudah Ada (Skip)</p>
            </div>
            <div className="flex-1 rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
              <p className="text-2xl font-bold text-gray-700">{preview.meta.totalKelas}</p>
              <p className="text-xs text-gray-500">Total Kelas</p>
            </div>
          </div>

          {preview.meta.totalBaru === 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
              <p className="text-sm text-amber-700">Semua kelas sudah memiliki mata pelajaran ini. Tidak ada data baru yang akan ditambahkan.</p>
            </div>
          )}

          {/* Tabel kelas */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">Kelas</th>
                  <th className="px-4 py-2.5 text-left">Mata Pelajaran</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {preview.items.map((item: BulkPerKelasPreviewItem) => (
                  <tr key={item.kelasId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-2.5 font-medium">{item.namaKelas}</td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {preview.meta.mataPelajaran.kode} — {preview.meta.mataPelajaran.nama}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <StatusBadge exists={item.alreadyExists} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STEP 3: Progress ──────────────────────────────── */}
      {step === 3 && (
        <div className="p-10 flex flex-col items-center gap-6">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <div className="w-full space-y-2">
            <ProgressBar value={progress} />
            <p className="text-sm text-center text-gray-500">
              {progress < 100 ? 'Menyimpan data...' : 'Selesai!'}
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}
