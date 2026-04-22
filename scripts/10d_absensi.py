import os

ROOT = r"D:\projects\LMS-MAN\Code\nextjslms\src"
FILES = {}

# ─────────────────────────────────────────────────────────────────────────────
# FIX 1: types/absensi.types.ts
# Rename JadwalHariIniItem → AbsensiStatusItem (hindari collision dengan
# JadwalHariIniItem di jadwal-view.types.ts yang di-export dari index.ts)
# ─────────────────────────────────────────────────────────────────────────────
FILES["types/absensi.types.ts"] = (
    "import type { StatusAbsensi, ModeSesi } from './enums'\n"
    "\n"
    "// ── Sesi ──────────────────────────────────────────────────────────────────────\n"
    "\n"
    "export interface BukaSesiPayload {\n"
    "  jadwalPelajaranId: string\n"
    "  tanggal: string\n"
    "  durasiMenit: number\n"
    "  toleransiMenit: number\n"
    "  requireGps: boolean\n"
    "  latitudeGuru?: number\n"
    "  longitudeGuru?: number\n"
    "  radiusMeter?: number\n"
    "}\n"
    "\n"
    "export interface SesiResponse {\n"
    "  token: string\n"
    "  guruId: string\n"
    "  jadwalPelajaranId: string\n"
    "  kelasId: string\n"
    "  semesterId: string\n"
    "  mataPelajaranId: string\n"
    "  tanggal: string\n"
    "  jamMulai: string\n"
    "  toleransiMenit: number\n"
    "  mode: ModeSesi\n"
    "  requireGps: boolean\n"
    "  latitudeGuru?: number\n"
    "  longitudeGuru?: number\n"
    "  radiusMeter?: number\n"
    "  expiresAt: string\n"
    "  ttlDetik: number\n"
    "}\n"
    "\n"
    "export interface SesiDetail {\n"
    "  token: string\n"
    "  guruId: string\n"
    "  jadwalPelajaranId: string\n"
    "  kelasId: string\n"
    "  mataPelajaranId: string\n"
    "  tanggal: string\n"
    "  jamMulai: string\n"
    "  toleransiMenit: number\n"
    "  mode: ModeSesi\n"
    "  requireGps: boolean\n"
    "  radiusMeter?: number\n"
    "  expiresAt: string\n"
    "}\n"
    "\n"
    "export interface PesertaSesi {\n"
    "  id: string\n"
    "  nama: string\n"
    "  absen: number\n"
    "  sudahScan: boolean\n"
    "  statusSiswa: string\n"
    "  isEligible: boolean\n"
    "}\n"
    "\n"
    "export interface StatistikSesi {\n"
    "  total: number\n"
    "  hadir: number\n"
    "  sisa: number\n"
    "}\n"
    "\n"
    "export interface SesiDetailResponse {\n"
    "  sesi: SesiDetail\n"
    "  statistik: StatistikSesi\n"
    "  peserta: PesertaSesi[]\n"
    "}\n"
    "\n"
    "// ── My Status Hari Ini ────────────────────────────────────────────────────────\n"
    "// CATATAN: Nama AbsensiStatusItem dipakai (bukan JadwalHariIniItem) untuk\n"
    "// menghindari collision dengan JadwalHariIniItem di jadwal-view.types.ts\n"
    "\n"
    "export interface KelasWali {\n"
    "  id: string\n"
    "  namaKelas: string\n"
    "}\n"
    "\n"
    "export interface AbsensiStatusItem {\n"
    "  jadwalId: string\n"
    "  namaMapel: string\n"
    "  jam: string\n"
    "  isOngoing: boolean\n"
    "  statusAbsensi: string\n"
    "  modeSesi: ModeSesi | null\n"
    "}\n"
    "\n"
    "export interface MyStatusHariIniResponse {\n"
    "  isWaliKelas: boolean\n"
    "  kelasWali: KelasWali[]\n"
    "  total: number\n"
    "  data: AbsensiStatusItem[]\n"
    "}\n"
    "\n"
    "// ── Scan ──────────────────────────────────────────────────────────────────────\n"
    "\n"
    "export interface ScanPayload {\n"
    "  token: string\n"
    "  latitude?: number\n"
    "  longitude?: number\n"
    "}\n"
    "\n"
    "export interface ScanResponse {\n"
    "  message: string\n"
    "  status: StatusAbsensi\n"
    "}\n"
    "\n"
    "// ── Manual Bulk ───────────────────────────────────────────────────────────────\n"
    "\n"
    "export interface AbsensiManualItem {\n"
    "  userId: string\n"
    "  status: StatusAbsensi\n"
    "  keterangan?: string\n"
    "}\n"
    "\n"
    "export interface ManualBulkPayload {\n"
    "  jadwalPelajaranId: string\n"
    "  tanggal: string\n"
    "  absensi: AbsensiManualItem[]\n"
    "}\n"
    "\n"
    "// ── Override ──────────────────────────────────────────────────────────────────\n"
    "\n"
    "export interface OverridePayload {\n"
    "  status: StatusAbsensi\n"
    "  keterangan?: string\n"
    "}\n"
    "\n"
    "// ── Matrix ────────────────────────────────────────────────────────────────────\n"
    "\n"
    "export interface MatrixMetadata {\n"
    "  namaMapel: string\n"
    "  targetPertemuan: number | null\n"
    "  realisasiPertemuan: number\n"
    "}\n"
    "\n"
    "export interface MatrixSiswaSummary {\n"
    "  H: number\n"
    "  I: number\n"
    "  S: number\n"
    "  A: number\n"
    "}\n"
    "\n"
    "export interface MatrixSiswaRow {\n"
    "  no: number\n"
    "  nama: string\n"
    "  nisn: string\n"
    "  kehadiran: (string | null)[]\n"
    "  summary: MatrixSiswaSummary\n"
    "}\n"
    "\n"
    "export interface MatrixResponse {\n"
    "  metadata: MatrixMetadata\n"
    "  listPertemuan: (string | null)[]\n"
    "  dataSiswa: MatrixSiswaRow[]\n"
    "}\n"
    "\n"
    "// ── Reports ───────────────────────────────────────────────────────────────────\n"
    "\n"
    "export interface SiswaKritisItem {\n"
    "  userId: string\n"
    "  nama: string\n"
    "  nisn: string\n"
    "  jumlahAlpa: number\n"
    "  kelasNama: string\n"
    "}\n"
    "\n"
    "export interface GuruDetailReport {\n"
    "  guruId: string\n"
    "  nama: string\n"
    "  statusKepatuhan: string\n"
    "  persentaseHadir: number\n"
    "  totalJP: number\n"
    "}\n"
    "\n"
    "export interface RekapHonorItem {\n"
    "  bulan: number\n"
    "  totalJP: number\n"
    "  bobot: number\n"
    "  nominal: number\n"
    "}\n"
    "\n"
    "// ── Sesi Actions ──────────────────────────────────────────────────────────────\n"
    "\n"
    "export interface PerpanjangPayload {\n"
    "  tambahanMenit: number\n"
    "}\n"
    "\n"
    "// ── Public Stats ──────────────────────────────────────────────────────────────\n"
    "\n"
    "export interface PublicStatsMonitoring {\n"
    "  jamSekarang: string\n"
    "  totalJadwalSeharusnya: number\n"
    "  totalSesiAktif: number\n"
    "  persentaseKBM: number\n"
    "}\n"
    "\n"
    "export interface PublicStatsLiveItem {\n"
    "  mapel: string\n"
    "  kelas: string\n"
    "  status: string\n"
    "}\n"
    "\n"
    "export interface PublicStatsKehadiran {\n"
    "  status: string\n"
    "  _count: number\n"
    "}\n"
    "\n"
    "export interface PublicStatsAchievement {\n"
    "  label: string\n"
    "  topList: string[]\n"
    "}\n"
    "\n"
    "export interface PublicStatsResponse {\n"
    "  monitoring: PublicStatsMonitoring\n"
    "  liveList: PublicStatsLiveItem[]\n"
    "  sekolah: {\n"
    "    kehadiranHariIni: PublicStatsKehadiran[]\n"
    "    updateTerakhir: string\n"
    "  }\n"
    "  achievement: PublicStatsAchievement\n"
    "}\n"
)

# ─────────────────────────────────────────────────────────────────────────────
# FIX 2: hooks/absensi/useMyStatusHariIni.ts
# Update return type reference
# ─────────────────────────────────────────────────────────────────────────────
FILES["hooks/absensi/useMyStatusHariIni.ts"] = """import { useQuery } from '@tanstack/react-query'
import { getMyStatusHariIni } from '@/lib/api/absensi.api'
import { useSemesterActive }  from '@/hooks/semester/useSemester'

export const myStatusKeys = {
  hariIni: (semesterId: string) =>
    ['absensi', 'my-status-hari-ini', semesterId] as const,
}

export function useMyStatusHariIni() {
  const { data: semesters } = useSemesterActive()
  const activeSemester = semesters?.find((s) => s.isActive) ?? semesters?.[0]
  const semesterId     = activeSemester?.id ?? ''

  const query = useQuery({
    queryKey: myStatusKeys.hariIni(semesterId),
    queryFn:  () => getMyStatusHariIni(semesterId),
    enabled:  !!semesterId,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })

  return {
    ...query,
    semesterId,
    aktiveSemesterNama: activeSemester?.nama ?? '',
    isWaliKelas: query.data?.isWaliKelas ?? false,
    kelasWali:   query.data?.kelasWali ?? [],
    // AbsensiStatusItem[] — nama diubah untuk hindari collision dengan jadwal types
    jadwalList:  query.data?.data ?? [],
  }
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# FIX 3: absensi/siswa/page.tsx
# Update import: JadwalHariIniItem → AbsensiStatusItem
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/siswa/page.tsx"] = """'use client'

import { useState }            from 'react'
import { Calendar }            from 'lucide-react'
import { PageHeader }          from '@/components/ui/PageHeader'
import { EmptyState }          from '@/components/ui/EmptyState'
import { Spinner }             from '@/components/ui/Spinner'
import { useMyStatusHariIni }  from '@/hooks/absensi/useMyStatusHariIni'
import { JadwalSiswaCard }     from './_components/JadwalSiswaCard'
import { PengajuanIzinModal }  from './_components/PengajuanIzinModal'
import type { AbsensiStatusItem } from '@/types'

export default function AbsensiSiswaPage() {
  const { jadwalList, isLoading, aktiveSemesterNama } = useMyStatusHariIni()
  const [izinTarget, setIzinTarget] = useState<AbsensiStatusItem | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Absensi Hari Ini"
        description={aktiveSemesterNama ? `Semester ${aktiveSemesterNama}` : undefined}
      />

      {jadwalList.length === 0 ? (
        <EmptyState
          icon={<Calendar size={22} />}
          title="Tidak ada jadwal hari ini"
          description="Kamu tidak memiliki jadwal pelajaran untuk hari ini."
        />
      ) : (
        <div className="grid gap-3">
          {jadwalList.map((item) => (
            <JadwalSiswaCard
              key={item.jadwalId}
              item={item}
              onIzin={() => setIzinTarget(item)}
            />
          ))}
        </div>
      )}

      <PengajuanIzinModal
        open={!!izinTarget}
        onClose={() => setIzinTarget(null)}
        jadwal={izinTarget}
      />
    </div>
  )
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# FIX 4: JadwalSiswaCard.tsx
# Update import: JadwalHariIniItem → AbsensiStatusItem
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/siswa/_components/JadwalSiswaCard.tsx"] = """'use client'

import {
  Clock, Camera, Wifi, BookOpen,
  CheckCircle2, AlertCircle, MinusCircle, Timer,
} from 'lucide-react'
import { Button }              from '@/components/ui/Button'
import type { AbsensiStatusItem } from '@/types'

interface Props {
  item:   AbsensiStatusItem
  onIzin: () => void
}

const STATUS_MAP = {
  HADIR:       { label: 'Hadir',       cls: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400', Icon: CheckCircle2 },
  TERLAMBAT:   { label: 'Terlambat',   cls: 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400',    Icon: AlertCircle  },
  SAKIT:       { label: 'Sakit',       cls: 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',            Icon: MinusCircle  },
  IZIN:        { label: 'Izin',        cls: 'text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',    Icon: MinusCircle  },
  ALPA:        { label: 'Alpa',        cls: 'text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400',                Icon: AlertCircle  },
  TAP:         { label: 'TAP',         cls: 'text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400',    Icon: AlertCircle  },
  BELUM_ABSEN: { label: 'Belum Absen', cls: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400',             Icon: Timer        },
} as const

const MODE_MAP = {
  QR_LURING: { label: 'Sesi aktif \u2014 Scan QR + GPS', Icon: Camera,   cls: 'text-emerald-600 dark:text-emerald-400' },
  QR_WFH:    { label: 'Sesi aktif \u2014 Scan QR',       Icon: Wifi,     cls: 'text-blue-600 dark:text-blue-400'       },
  MANUAL:    { label: 'Sesi aktif \u2014 Absen Manual',  Icon: BookOpen, cls: 'text-gray-500 dark:text-gray-400'       },
} as const

export function JadwalSiswaCard({ item, onIzin }: Props) {
  const statusKey = (item.statusAbsensi in STATUS_MAP
    ? item.statusAbsensi
    : 'BELUM_ABSEN') as keyof typeof STATUS_MAP

  const { label: statusLabel, cls: statusCls, Icon: StatusIcon } = STATUS_MAP[statusKey]
  const modeCfg = item.modeSesi ? MODE_MAP[item.modeSesi] : null

  const sudahTercatat = ['HADIR', 'TERLAMBAT', 'SAKIT', 'IZIN', 'ALPA'].includes(
    item.statusAbsensi,
  )

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3 hover:shadow-sm transition-shadow">

      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white truncate">
            {item.namaMapel}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 text-gray-500">
            <Clock size={11} />
            <span className="text-xs">{item.jam}</span>
          </div>
        </div>
        <span className={'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ' + statusCls}>
          <StatusIcon size={11} />
          {statusLabel}
        </span>
      </div>

      {/* Mode sesi indicator */}
      {item.isOngoing && modeCfg && (
        <div className={'flex items-center gap-1.5 text-xs font-medium ' + modeCfg.cls}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <modeCfg.Icon size={12} />
          <span>{modeCfg.label}</span>
          {item.modeSesi !== 'MANUAL' && (
            <span className="ml-1 text-gray-400 font-normal">
              \u2014 Scan QR dari guru kamu
            </span>
          )}
        </div>
      )}

      {/* Tombol izin */}
      {!sudahTercatat && (
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" size="sm" onClick={onIzin} className="w-full">
            Ajukan Izin / Sakit
          </Button>
        </div>
      )}
    </div>
  )
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# FIX 5: PengajuanIzinModal.tsx
# - Update import: JadwalHariIniItem → AbsensiStatusItem
# - Fix z.enum(): tambah "as const" untuk fix overload error
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/siswa/_components/PengajuanIzinModal.tsx"] = """'use client'

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
    jenis:          z.enum(JENIS_VALUES, { required_error: 'Jenis izin wajib dipilih' }),
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
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
              {errors.tanggalMulai && <p className="text-xs text-red-500">{errors.tanggalMulai.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sampai <span className="text-red-500">*</span>
              </label>
              <input type="date" {...register('tanggalSelesai')}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
              {errors.tanggalSelesai && <p className="text-xs text-red-500">{errors.tanggalSelesai.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Alasan <span className="text-red-500">*</span>
            </label>
            <textarea rows={3} {...register('alasan')} placeholder="Tuliskan alasan izin kamu..."
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none" />
            {errors.alasan && <p className="text-xs text-red-500">{errors.alasan.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Link Bukti <span className="text-xs text-gray-400 font-normal">(opsional)</span>
            </label>
            <input type="url" {...register('fileBuktiUrl')} placeholder="https://drive.google.com/..."
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            {errors.fileBuktiUrl && <p className="text-xs text-red-500">{errors.fileBuktiUrl.message}</p>}
          </div>
        </div>
      )}
    </Modal>
  )
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# FIX 6: scan/page.tsx
# Fix: "status && SCAN_ERRORS[status]" → "SCAN_ERRORS[status ?? -1]"
# Sebelumnya: jika status=0, ekspresi return 0 (number) bukan string
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/scan/page.tsx"] = """'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams }  from 'next/navigation'
import { useQuery }         from '@tanstack/react-query'
import {
  MapPin, AlertTriangle, CheckCircle2,
  XCircle, Loader2, Clock,
} from 'lucide-react'
import { getSesiDetail, scanQR } from '@/lib/api/absensi.api'
import { Button }  from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

// ── Constants ─────────────────────────────────────────────────────────────────

const SCAN_ERRORS: Record<number, string> = {
  400: 'Kamu berada di luar area absensi atau sesi belum dimulai.',
  403: 'Kamu bukan bagian dari kelas ini.',
  404: 'Token QR sudah kadaluarsa atau tidak ditemukan.',
  409: 'Kamu sudah tercatat hadir untuk sesi ini.',
}

const MODE_LABEL: Record<string, string> = {
  QR_LURING: 'QR + Verifikasi Lokasi',
  QR_WFH:    'QR Jarak Jauh',
  MANUAL:    'Manual',
}

const FALLBACK_ERR = 'Terjadi kesalahan. Silakan coba lagi.'

// ── Types ─────────────────────────────────────────────────────────────────────

type GpsStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
type PageState = 'loading' | 'confirm' | 'submitting' | 'success' | 'error' | 'invalid'

// ── Inner Component ───────────────────────────────────────────────────────────

function ScanContent() {
  const searchParams = useSearchParams()
  const token        = searchParams.get('token')

  const [pageState, setPageState] = useState<PageState>('loading')
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle')
  const [coords, setCoords]       = useState<{ lat: number; lng: number } | null>(null)
  const [errorMsg, setErrorMsg]   = useState<string>('')

  const { data, isError } = useQuery({
    queryKey: ['absensi', 'sesi-scan', token ?? ''],
    queryFn:  () => getSesiDetail(token!),
    enabled:  !!token,
    retry:    1,
    staleTime: 0,
  })

  useEffect(() => { if (data)    setPageState('confirm') }, [data])
  useEffect(() => { if (isError) setPageState('invalid') }, [isError])

  useEffect(() => {
    if (!data?.sesi.requireGps) return
    if (!navigator.geolocation) { setGpsStatus('unavailable'); return }
    setGpsStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsStatus('granted')
      },
      () => setGpsStatus('denied'),
      { timeout: 10_000, enableHighAccuracy: true, maximumAge: 0 },
    )
  }, [data?.sesi.requireGps])

  const handleAbsen = async () => {
    if (!token) return
    if (data?.sesi.requireGps && gpsStatus !== 'granted') return
    setPageState('submitting')
    try {
      await scanQR({ token, latitude: coords?.lat, longitude: coords?.lng })
      setPageState('success')
    } catch (err) {
      // FIX: gunakan SCAN_ERRORS[status ?? -1] agar tidak return 0 (number)
      const status = (err as { response?: { status?: number } })?.response?.status
      setErrorMsg(SCAN_ERRORS[status ?? -1] ?? FALLBACK_ERR)
      setPageState('error')
    }
  }

  // ── No token ──────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <ScanShell>
        <IconBox><XCircle className="text-red-400" size={28} /></IconBox>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Link Tidak Valid</h1>
        <p className="text-sm text-gray-500 text-center max-w-xs">
          Token absensi tidak ditemukan. Pastikan kamu scan QR dari gurumu.
        </p>
      </ScanShell>
    )
  }

  if (pageState === 'loading') {
    return (
      <ScanShell>
        <Spinner />
        <p className="text-sm text-gray-500">Memuat informasi sesi...</p>
      </ScanShell>
    )
  }

  if (pageState === 'invalid') {
    return (
      <ScanShell>
        <IconBox><AlertTriangle className="text-orange-400" size={28} /></IconBox>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Sesi Tidak Tersedia</h1>
        <p className="text-sm text-gray-500 text-center max-w-xs">
          Token QR sudah kadaluarsa atau tidak ditemukan. Minta guru membuka sesi baru.
        </p>
      </ScanShell>
    )
  }

  if (pageState === 'success') {
    return (
      <ScanShell>
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle2 className="text-emerald-500" size={32} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Absensi Tercatat!</h1>
        <p className="text-sm text-gray-500 text-center">
          Kehadiran kamu berhasil dicatat. Selamat belajar!
        </p>
      </ScanShell>
    )
  }

  if (pageState === 'error') {
    return (
      <ScanShell>
        <IconBox><XCircle className="text-red-400" size={28} /></IconBox>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Absensi Gagal</h1>
        <p className="text-sm text-gray-500 text-center max-w-xs">{errorMsg}</p>
        <Button variant="secondary" size="sm" onClick={() => setPageState('confirm')}>
          Coba Lagi
        </Button>
      </ScanShell>
    )
  }

  // ── Confirm ───────────────────────────────────────────────────────────────
  const sesi         = data!.sesi
  const statistik    = data!.statistik
  const gpsBlocking  = sesi.requireGps && gpsStatus !== 'granted'
  const isSubmitting = pageState === 'submitting'
  const tanggalDisplay = sesi.tanggal.split('-').reverse().join('/')
  const expiredDisplay = new Date(sesi.expiresAt).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar',
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-start justify-center p-4 pt-8">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Konfirmasi Absensi</h1>
          <p className="text-sm text-gray-500">Pastikan data berikut sesuai sebelum absen</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          <InfoRow label="Tanggal"   value={tanggalDisplay} />
          <InfoRow label="Jam Mulai" value={sesi.jamMulai} />
          <InfoRow label="Mode"      value={MODE_LABEL[sesi.mode] ?? sesi.mode} />
          <InfoRow label="Toleransi" value={sesi.toleransiMenit + ' menit'} />
          <InfoRow label="Berakhir"  value={expiredDisplay} />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <StatBadge label="Total" value={statistik.total} />
            <StatBadge label="Hadir" value={statistik.hadir} color="text-emerald-600" />
            <StatBadge label="Sisa"  value={statistik.sisa}  color="text-orange-500"  />
          </div>
        </div>

        {sesi.requireGps && <GpsIndicator status={gpsStatus} />}

        <Button
          variant="primary" size="lg" className="w-full"
          loading={isSubmitting}
          disabled={gpsBlocking || isSubmitting}
          onClick={handleAbsen}
        >
          {isSubmitting ? 'Mencatat absensi...' : 'Absen Sekarang'}
        </Button>

        {gpsBlocking && gpsStatus !== 'requesting' && (
          <p className="text-xs text-center text-orange-500 px-2">
            Sesi ini memerlukan verifikasi lokasi. Izinkan akses GPS di browser kamu.
          </p>
        )}
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ScanShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center gap-4 p-6 text-center">
      {children}
    </div>
  )
}

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-4">
      <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white text-right">{value}</span>
    </div>
  )
}

function StatBadge({ label, value, color = 'text-gray-900 dark:text-white' }: {
  label: string; value: number; color?: string
}) {
  return (
    <div>
      <p className={'text-xl font-bold ' + color}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

function GpsIndicator({ status }: { status: GpsStatus }) {
  const CFG = {
    idle:        { label: 'Mendeteksi lokasi...',                              cls: 'text-gray-400',    Icon: Clock         },
    requesting:  { label: 'Meminta akses lokasi...',                           cls: 'text-blue-500',    Icon: Loader2       },
    granted:     { label: 'Lokasi berhasil terdeteksi',                        cls: 'text-emerald-600', Icon: MapPin        },
    denied:      { label: 'Akses GPS ditolak \u2014 izinkan di pengaturan browser', cls: 'text-red-500', Icon: AlertTriangle },
    unavailable: { label: 'GPS tidak tersedia di perangkat ini',               cls: 'text-orange-500',  Icon: AlertTriangle },
  } as const
  const { label, cls, Icon } = CFG[status]
  return (
    <div className={'flex items-center gap-2 text-xs font-medium px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 ' + cls}>
      <Icon size={14} className={status === 'requesting' ? 'animate-spin' : ''} />
      <span>{label}</span>
    </div>
  )
}

// ── Page Export ───────────────────────────────────────────────────────────────

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <Spinner />
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  )
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# WRITER
# ─────────────────────────────────────────────────────────────────────────────
def write_files():
    for relative_path, content in FILES.items():
        full_path = os.path.join(ROOT, relative_path.replace('/', os.sep))
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[OK] {relative_path}")

if __name__ == '__main__':
    write_files()
    print("\n✅ Patch Batch 3 selesai — 6 file diupdate.")
    print("   Verifikasi: npx tsc --noEmit 2>&1 | Select-String 'siswa|scan|JadwalSiswa|PengajuanIzin'")