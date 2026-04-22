import { useQuery } from '@tanstack/react-query'
import {
  getRekapKelasWaliHariIni,
  getRekapSemesterPerKelas,
  getKinerjaGuru,
  getMatrixRekap,
  getJadwalHariIniWali,
  getGuruDetailJadwal,
} from '@/lib/api/absensi.api'
import { getListPerizinan } from '@/lib/api/perizinan.api'
import type { MatrixQueryParams } from '@/lib/api/absensi.api'

export const waliKelasKeys = {
  rekapHarian:   (kelasId: string) =>
    ['absensi', 'wali', 'harian', kelasId] as const,
  rekapSemester: (kelasId: string, semesterId: string) =>
    ['absensi', 'wali', 'semester', kelasId, semesterId] as const,
  matrixMapel:   (p: MatrixQueryParams) =>
    ['absensi', 'wali', 'matrix', p.kelasId, p.mataPelajaranId, p.semesterId] as const,
  izinPending:   (kelasId: string) =>
    ['perizinan', 'wali', 'pending', kelasId] as const,
  kinerjaGuru:   (guruId: string, semesterId: string, bulan?: number) =>
    ['absensi', 'kinerja-guru', guruId, semesterId, bulan] as const,
  jadwalHariIni: (semesterId: string, kelasId: string) =>
    ['absensi', 'wali', 'jadwal-hari-ini', semesterId, kelasId] as const,
}

// ── Rekap Hari Ini ────────────────────────────────────────────────────────────
export function useRekapHarianWali(kelasId: string | null) {
  return useQuery({
    queryKey: waliKelasKeys.rekapHarian(kelasId ?? ''),
    queryFn:  () => getRekapKelasWaliHariIni(kelasId!),
    enabled:  !!kelasId,
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 2,
  })
}

// ── Rekap Semester Per Kelas ──────────────────────────────────────────────────
export function useRekapSemesterKelas(
  kelasId:    string | null,
  semesterId: string | null,
) {
  return useQuery({
    queryKey: waliKelasKeys.rekapSemester(kelasId ?? '', semesterId ?? ''),
    queryFn:  () => getRekapSemesterPerKelas(kelasId!, semesterId!),
    enabled:  !!kelasId && !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}

// ── Matrix Mapel ──────────────────────────────────────────────────────────────
export function useMatrixMapelWali(params: Partial<MatrixQueryParams>) {
  const isReady = !!params.kelasId && !!params.mataPelajaranId && !!params.semesterId
  return useQuery({
    queryKey: waliKelasKeys.matrixMapel(params as MatrixQueryParams),
    queryFn:  () => getMatrixRekap(params as MatrixQueryParams),
    enabled:  isReady,
    staleTime: 1000 * 60 * 2,
  })
}

// ── Izin Pending ──────────────────────────────────────────────────────────────
export function useIzinPendingWali(kelasId: string | null) {
  return useQuery({
    queryKey: waliKelasKeys.izinPending(kelasId ?? ''),
    queryFn:  () => getListPerizinan({ page: 1, limit: 50 }),
    // Semua status yang perlu ditindak: PENDING dan REVISION_REQUESTED
    enabled:  !!kelasId,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })
}

// ── Kinerja Guru ──────────────────────────────────────────────────────────────
export function useKinerjaGuru(
  guruId:     string | null,
  semesterId: string | null,
  bulan?:     number,
) {
  return useQuery({
    queryKey: waliKelasKeys.kinerjaGuru(guruId ?? '', semesterId ?? '', bulan),
    queryFn:  () => getKinerjaGuru(guruId!, semesterId!, bulan),
    enabled:  !!guruId && !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}

// ── Guru Detail: Target vs Realisasi per Jadwal ───────────────────────────────
export function useGuruDetailJadwal(
  guruId:     string | null,
  semesterId: string | null,
) {
  return useQuery({
    queryKey: ['absensi', 'guru-detail-jadwal', guruId ?? '', semesterId ?? ''],
    queryFn:  () => getGuruDetailJadwal(guruId!, semesterId!),
    enabled:  !!guruId && !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}

// ── Jadwal Hari Ini Kelas Wali ────────────────────────────────────────────────
export function useJadwalHariIniWali(
  semesterId: string | null,
  kelasId:    string | null,
) {
  return useQuery({
    queryKey: waliKelasKeys.jadwalHariIni(semesterId ?? '', kelasId ?? ''),
    queryFn:  () => getJadwalHariIniWali(semesterId!, kelasId!),
    enabled:  !!semesterId && !!kelasId,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })
}
