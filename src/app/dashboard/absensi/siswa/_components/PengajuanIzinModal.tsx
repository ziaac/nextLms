'use client'

import { useEffect }           from 'react'
import { useForm }             from 'react-hook-form'
import { zodResolver }         from '@hookform/resolvers/zod'
import { z }                   from 'zod'
import { Modal }               from '@/components/ui/Modal'
import { Button }              from '@/components/ui/Button'
import { Combobox }            from '@/components/ui/Combobox'
import type { ComboboxOption } from '@/components/ui/Combobox'
import { useAjukanPerizinan }  from '@/hooks/absensi/usePerizinan'
import { useAuthStore }        from '@/stores/auth.store'
import type { AbsensiStatusItem, JenisPerizinan } from '@/types'

// ── Options ───────────────────────────────────────────────────────────────────

const JENIS_OPTIONS: ComboboxOption[] = [
  { label: 'Sakit',              value: 'SAKIT'              },
  { label: 'Izin',               value: 'IZIN'               },
  { label: 'Cuti',               value: 'CUTI'               },
  { label: 'Dinas',              value: 'DINAS'              },
  { label: 'Keperluan Keluarga', value: 'KEPERLUAN_KELUARGA' },
]

const JENIS_VALUES = ['SAKIT', 'IZIN', 'CUTI', 'DINAS', 'KEPERLUAN_KELUARGA'] as const

// FIX: gunakan "as const" agar TS resolve overload z.enum() dengan benar
const schema = z
  .object({
    jenis:          z.enum(JENIS_VALUES),
    tanggalMulai:   z.string().min(1, 'Tanggal mulai wajib diisi'),
    tanggalSelesai: z.string().min(1, 'Tanggal selesai wajib diisi'),
    alasan:         z.string().min(5, 'Alasan minimal 5 karakter'),
    fileBuktiUrl:   z.string().url('Format URL tidak valid').or(z.literal('')).optional(),
  })
  .refine((d) => d.tanggalSelesai >= d.tanggalMulai, {
    message: 'Tanggal selesai tidak boleh sebelum tanggal mulai',
    path:    ['tanggalSelesai'],
  })

type FormData = z.infer<typeof schema>

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open:    boolean
  onClose: () => void
  jadwal:  AbsensiStatusItem | null
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PengajuanIzinModal({ open, onClose, jadwal }: Props) {
  const user = useAuthStore((s) => s.user)
  const { mutate, isPending, isSuccess, reset: resetMutation } = useAjukanPerizinan()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema as never),
    defaultValues: { tanggalMulai: '', tanggalSelesai: '', alasan: '', fileBuktiUrl: '' },
  })

  useEffect(() => {
    if (!open) return
    const today = new Date().toISOString().slice(0, 10)
    reset({
      jenis:          undefined as unknown as FormData['jenis'],
      tanggalMulai:   today,
      tanggalSelesai: today,
      alasan:         '',
      fileBuktiUrl:   '',
    })
    resetMutation()
    // Intentional: reset & resetMutation adalah stable references dari react-hook-form/react-query.
    // Menambahkan keduanya ke deps akan menyebabkan infinite re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onSubmit = (data: FormData) => {
    if (!user?.id) return
    mutate(
      {
        userId:         user.id,
        jenis:          data.jenis as JenisPerizinan,
        tanggalMulai:   data.tanggalMulai,
        tanggalSelesai: data.tanggalSelesai,
        alasan:         data.alasan,
        fileBuktiUrl:   data.fileBuktiUrl || undefined,
      },
      { onSuccess: () => setTimeout(onClose, 1_400) },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajukan Izin / Sakit"
      description={jadwal?.namaMapel}
      size="md"
      footer={
        !isSuccess ? (
          <>
            <Button variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button variant="primary" size="sm" loading={isPending} onClick={handleSubmit(onSubmit)}>
              Kirim Pengajuan
            </Button>
          </>
        ) : undefined
      }
    >
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-7 h-7 text-emerald-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-semibold text-gray-900 dark:text-white">Pengajuan Terkirim</p>
          <p className="text-sm text-gray-500 text-center">
            Izin kamu sedang menunggu persetujuan wali kelas.
          </p>
        </div>
      ) : (
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Jenis Izin <span className="text-red-500">*</span>
            </label>
            <Combobox
              options={JENIS_OPTIONS}
              value={watch('jenis') ?? ''}
              onChange={(val) => setValue('jenis', val as FormData['jenis'], { shouldValidate: true })}
              placeholder="Pilih jenis izin"
              hasError={!!errors.jenis}
            />
            {errors.jenis && <p className="text-xs text-red-500">{errors.jenis.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Dari <span className="text-red-500">*</span>
              </label>
              <input type="date" {...register('tanggalMulai')}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
              {errors.tanggalMulai && <p className="text-xs text-red-500">{errors.tanggalMulai.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sampai <span className="text-red-500">*</span>
              </label>
              <input type="date" {...register('tanggalSelesai')}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
              {errors.tanggalSelesai && <p className="text-xs text-red-500">{errors.tanggalSelesai.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Alasan <span className="text-red-500">*</span>
            </label>
            <textarea rows={3} {...register('alasan')} placeholder="Tuliskan alasan izin kamu..."
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none" />
            {errors.alasan && <p className="text-xs text-red-500">{errors.alasan.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Link Bukti <span className="text-xs text-gray-400 font-normal">(opsional)</span>
            </label>
            <input type="url" {...register('fileBuktiUrl')} placeholder="https://drive.google.com/..."
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            {errors.fileBuktiUrl && <p className="text-xs text-red-500">{errors.fileBuktiUrl.message}</p>}
          </div>
        </div>
      )}
    </Modal>
  )
}
