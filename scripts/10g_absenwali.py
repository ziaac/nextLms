import os

ROOT = r"D:\projects\LMS-MAN\Code\nextjslms\src"
FILES = {}

# ─────────────────────────────────────────────────────────────────────────────
# 1. types/absensi.types.ts — tambah types baru
# ─────────────────────────────────────────────────────────────────────────────
FILES["types/absensi.types.ts"] = (
    "import type { StatusAbsensi, ModeSesi } from './enums'\n"
    "\n"
    "// ── Sesi ─────────────────────────────────────────────────────────────────────\n"
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
    "// ── Scan ─────────────────────────────────────────────────────────────────────\n"
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
    "// ── Override ─────────────────────────────────────────────────────────────────\n"
    "\n"
    "export interface OverridePayload {\n"
    "  status: StatusAbsensi\n"
    "  keterangan?: string\n"
    "}\n"
    "\n"
    "// ── Matrix ───────────────────────────────────────────────────────────────────\n"
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
    "// ── Reports ──────────────────────────────────────────────────────────────────\n"
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
    "// ── Sesi Actions ─────────────────────────────────────────────────────────────\n"
    "\n"
    "export interface PerpanjangPayload {\n"
    "  tambahanMenit: number\n"
    "}\n"
    "\n"
    "// ── Public Stats ─────────────────────────────────────────────────────────────\n"
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
    "\n"
    "// ── Rekap Kelas Wali Hari Ini ─────────────────────────────────────────────────\n"
    "\n"
    "export interface RekapKelasWaliSummary {\n"
    "  HADIR: number\n"
    "  TERLAMBAT: number\n"
    "  SAKIT: number\n"
    "  IZIN: number\n"
    "  ALPA: number\n"
    "  TAP: number\n"
    "}\n"
    "\n"
    "export interface RekapKelasWaliSiswa {\n"
    "  id: string\n"
    "  userId: string\n"
    "  status: StatusAbsensi\n"
    "  waktuMasuk: string | null\n"
    "  user: {\n"
    "    profile: {\n"
    "      namaLengkap: string\n"
    "      nisn: string | null\n"
    "    }\n"
    "  }\n"
    "}\n"
    "\n"
    "export interface RekapKelasWaliResponse {\n"
    "  tanggal: string\n"
    "  total: number\n"
    "  summary: RekapKelasWaliSummary\n"
    "  data: RekapKelasWaliSiswa[]\n"
    "}\n"
    "\n"
    "// ── History Absensi Siswa ─────────────────────────────────────────────────────\n"
    "\n"
    "export interface AbsensiHistoryItem {\n"
    "  id: string\n"
    "  userId: string\n"
    "  tanggal: string\n"
    "  status: StatusAbsensi\n"
    "  waktuMasuk: string | null\n"
    "  jadwalPelajaran: {\n"
    "    id: string\n"
    "    mataPelajaran: {\n"
    "      id: string\n"
    "      nama: string\n"
    "    } | null\n"
    "    masterJam: {\n"
    "      jamMulai: string\n"
    "      jamSelesai: string\n"
    "    } | null\n"
    "  } | null\n"
    "}\n"
    "\n"
    "export interface AbsensiHistoryResponse {\n"
    "  data: AbsensiHistoryItem[]\n"
    "  meta: {\n"
    "    total: number\n"
    "    page: number\n"
    "    lastPage: number\n"
    "  }\n"
    "}\n"
    "\n"
    "export interface AbsensiHistoryQuery {\n"
    "  page?: number\n"
    "  limit?: number\n"
    "  kelasId?: string\n"
    "  masterJamId?: string\n"
    "  semesterId?: string\n"
    "}\n"
    "\n"
    "// ── Rekap Summary Siswa ───────────────────────────────────────────────────────\n"
    "\n"
    "export interface RekapSiswaRiwayatItem {\n"
    "  id: string\n"
    "  tanggal: string\n"
    "  status: StatusAbsensi\n"
    "  jadwalPelajaran: {\n"
    "    mataPelajaran: {\n"
    "      nama: string\n"
    "    } | null\n"
    "  } | null\n"
    "}\n"
    "\n"
    "export interface RekapSiswaResponse {\n"
    "  total: number\n"
    "  riwayat: RekapSiswaRiwayatItem[]\n"
    "}\n"
    "\n"
    "// ── Detail Semester Siswa ─────────────────────────────────────────────────────\n"
    "\n"
    "export interface AbsensiDetailSemesterItem {\n"
    "  id: string\n"
    "  tanggal: string\n"
    "  status: StatusAbsensi\n"
    "  jadwalPelajaran: {\n"
    "    id: string\n"
    "    mataPelajaran: {\n"
    "      id: string\n"
    "      mataPelajaranTingkat: {\n"
    "        masterMapel: { nama: string }\n"
    "      } | null\n"
    "    } | null\n"
    "  } | null\n"
    "}\n"
)

# ─────────────────────────────────────────────────────────────────────────────
# 2. lib/api/absensi.api.ts — tambah endpoint baru
# ─────────────────────────────────────────────────────────────────────────────
FILES["lib/api/absensi.api.ts"] = """import api from '@/lib/axios'
import type {
  BukaSesiPayload,
  SesiResponse,
  SesiDetailResponse,
  ScanPayload,
  ScanResponse,
  ManualBulkPayload,
  OverridePayload,
  MatrixResponse,
  MyStatusHariIniResponse,
  SiswaKritisItem,
  GuruDetailReport,
  PerpanjangPayload,
  PublicStatsResponse,
  RekapKelasWaliResponse,
  AbsensiHistoryResponse,
  AbsensiHistoryQuery,
  RekapSiswaResponse,
  AbsensiDetailSemesterItem,
} from '@/types'

// ── Sesi ──────────────────────────────────────────────────────────────────────

export const bukaSesi = (payload: BukaSesiPayload) =>
  api.post<SesiResponse>('/absensi/sesi', payload).then((r) => r.data)

export const getSesiDetail = (token: string) =>
  api.get<SesiDetailResponse>('/absensi/sesi/' + token).then((r) => r.data)

export const perpanjangSesi = (token: string, payload: PerpanjangPayload) =>
  api.patch('/absensi/sesi/' + token + '/perpanjang', payload).then((r) => r.data)

export const tutupSesi = (token: string) =>
  api.patch('/absensi/sesi/' + token + '/tutup').then((r) => r.data)

// ── Scan ──────────────────────────────────────────────────────────────────────

export const scanQR = (payload: ScanPayload) =>
  api.post<ScanResponse>('/absensi/scan', payload).then((r) => r.data)

// ── My ────────────────────────────────────────────────────────────────────────

export const getMyStatusHariIni = (semesterId: string) =>
  api.get<MyStatusHariIniResponse>('/absensi/my/status-hari-ini', {
    params: { semesterId },
  }).then((r) => r.data)

// ── Manual Bulk ───────────────────────────────────────────────────────────────

export const simpanManualBulk = (payload: ManualBulkPayload) =>
  api.post('/absensi/manual/bulk', payload).then((r) => r.data)

// ── Override ──────────────────────────────────────────────────────────────────

export const overrideAbsensi = (id: string, payload: OverridePayload) =>
  api.patch('/absensi/' + id + '/override', payload).then((r) => r.data)

// ── Matrix ────────────────────────────────────────────────────────────────────

export interface MatrixQueryParams {
  kelasId: string
  mataPelajaranId: string
  semesterId: string
}

export const getMatrixRekap = (params: MatrixQueryParams) =>
  api.get<MatrixResponse>('/absensi/rekap/matrix', { params }).then((r) => r.data)

export const exportMatrix = (params: MatrixQueryParams) =>
  api.get<Blob>('/absensi/export/matrix', { params, responseType: 'blob' })

// ── Wali Kelas ────────────────────────────────────────────────────────────────

export const getRekapKelasWaliHariIni = (kelasId: string) =>
  api.get<RekapKelasWaliResponse>('/absensi/rekap-kelas-wali-hari-ini', {
    params: { kelasId },
  }).then((r) => r.data)

// ── History & Rekap Siswa ─────────────────────────────────────────────────────

export const getAbsensiHistory = (params: AbsensiHistoryQuery) =>
  api.get<AbsensiHistoryResponse>('/absensi', { params }).then((r) => r.data)

export const getRekapSiswa = (siswaId: string, tanggalMulai?: string, tanggalSelesai?: string) =>
  api.get<RekapSiswaResponse>('/absensi/rekap-siswa/' + siswaId, {
    params: { tanggalMulai, tanggalSelesai },
  }).then((r) => r.data)

export const getAbsensiDetailSemester = (siswaId: string, semesterId: string) =>
  api.get<AbsensiDetailSemesterItem[]>(
    '/absensi-report/siswa/' + siswaId + '/detail',
    { params: { semesterId } },
  ).then((r) => r.data)

// ── Reports ───────────────────────────────────────────────────────────────────

export const getSiswaKritis = (semesterId: string) =>
  api.get<SiswaKritisItem[]>('/absensi-report/siswa/kritis', {
    params: { semesterId },
  }).then((r) => r.data)

export const getGuruDetail = (guruId: string, semesterId: string) =>
  api.get<GuruDetailReport>('/absensi-report/guru/detail/' + guruId, {
    params: { semesterId },
  }).then((r) => r.data)

export const getRekapHonorGuru = (guruId: string, semesterId: string, bulan: number) =>
  api.get('/absensi/rekap/guru/' + guruId, {
    params: { semesterId, bulan },
  }).then((r) => r.data)

// ── Public ────────────────────────────────────────────────────────────────────

export const getPublicStats = () =>
  api.get<PublicStatsResponse>('/absensi-public/stats').then((r) => r.data)
"""

# ─────────────────────────────────────────────────────────────────────────────
# 3. hooks/absensi/useWaliKelas.ts
# ─────────────────────────────────────────────────────────────────────────────
FILES["hooks/absensi/useWaliKelas.ts"] = """import { useQuery } from '@tanstack/react-query'
import { getRekapKelasWaliHariIni, getMatrixRekap } from '@/lib/api/absensi.api'
import { getListPerizinan } from '@/lib/api/perizinan.api'
import type { MatrixQueryParams } from '@/lib/api/absensi.api'

export const waliKelasKeys = {
  rekapHarian:   (kelasId: string) => ['absensi', 'wali', 'harian', kelasId] as const,
  matrixMapel:   (p: MatrixQueryParams) =>
    ['absensi', 'wali', 'matrix', p.kelasId, p.mataPelajaranId, p.semesterId] as const,
  izinPending:   (kelasId: string) => ['perizinan', 'wali', 'pending', kelasId] as const,
}

export function useRekapHarianWali(kelasId: string | null) {
  return useQuery({
    queryKey: waliKelasKeys.rekapHarian(kelasId ?? ''),
    queryFn:  () => getRekapKelasWaliHariIni(kelasId!),
    enabled:  !!kelasId,
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 2,
  })
}

export function useMatrixMapelWali(params: Partial<MatrixQueryParams>) {
  const isReady = !!params.kelasId && !!params.mataPelajaranId && !!params.semesterId
  return useQuery({
    queryKey: waliKelasKeys.matrixMapel(params as MatrixQueryParams),
    queryFn:  () => getMatrixRekap(params as MatrixQueryParams),
    enabled:  isReady,
    staleTime: 1000 * 60 * 2,
  })
}

export function useIzinPendingWali(kelasId: string | null) {
  return useQuery({
    queryKey: waliKelasKeys.izinPending(kelasId ?? ''),
    queryFn:  () => getListPerizinan({ status: 'PENDING', page: 1, limit: 50 }),
    enabled:  !!kelasId,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# 4. hooks/absensi/useRekapSiswa.ts
# ─────────────────────────────────────────────────────────────────────────────
FILES["hooks/absensi/useRekapSiswa.ts"] = """import { useQuery } from '@tanstack/react-query'
import {
  getAbsensiHistory,
  getRekapSiswa,
  getAbsensiDetailSemester,
} from '@/lib/api/absensi.api'
import type { AbsensiHistoryQuery } from '@/types'

export const rekapSiswaKeys = {
  history:        (q: AbsensiHistoryQuery) => ['absensi', 'history', q] as const,
  rekap:          (siswaId: string, dari?: string, sampai?: string) =>
    ['absensi', 'rekap-siswa', siswaId, dari, sampai] as const,
  detailSemester: (siswaId: string, semesterId: string) =>
    ['absensi', 'detail-semester', siswaId, semesterId] as const,
}

export function useAbsensiHistory(query: AbsensiHistoryQuery) {
  return useQuery({
    queryKey: rekapSiswaKeys.history(query),
    queryFn:  () => getAbsensiHistory(query),
    staleTime: 1000 * 60,
    placeholderData: (prev) => prev,
  })
}

export function useRekapSiswa(
  siswaId: string | null,
  tanggalMulai?: string,
  tanggalSelesai?: string,
) {
  return useQuery({
    queryKey: rekapSiswaKeys.rekap(siswaId ?? '', tanggalMulai, tanggalSelesai),
    queryFn:  () => getRekapSiswa(siswaId!, tanggalMulai, tanggalSelesai),
    enabled:  !!siswaId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useAbsensiDetailSemester(
  siswaId: string | null,
  semesterId: string | null,
) {
  return useQuery({
    queryKey: rekapSiswaKeys.detailSemester(siswaId ?? '', semesterId ?? ''),
    queryFn:  () => getAbsensiDetailSemester(siswaId!, semesterId!),
    enabled:  !!siswaId && !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# 5. absensi/wali-kelas/page.tsx
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/wali-kelas/page.tsx"] = """'use client'

import { useState }           from 'react'
import { useMyStatusHariIni } from '@/hooks/absensi/useMyStatusHariIni'
import { Spinner }            from '@/components/ui/Spinner'
import { PageHeader }         from '@/components/ui/PageHeader'
import { EmptyState }         from '@/components/ui/EmptyState'
import { Users }              from 'lucide-react'
import { RekapHarianTab }     from './_components/RekapHarianTab'
import { MatrixMapelTab }     from './_components/MatrixMapelTab'
import { IzinPendingTab }     from './_components/IzinPendingTab'

type SubTab = 'harian' | 'matrix' | 'izin'

export default function AbsensiWaliKelasPage() {
  const { isLoading, isWaliKelas, kelasWali, semesterId } = useMyStatusHariIni()
  const [activeKelasId, setActiveKelasId] = useState<string>('')
  const [subTab, setSubTab]               = useState<SubTab>('harian')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    )
  }

  if (!isWaliKelas || kelasWali.length === 0) {
    return (
      <div className="max-w-lg mx-auto">
        <EmptyState
          icon={<Users size={22} />}
          title="Bukan Wali Kelas"
          description="Kamu belum ditugaskan sebagai wali kelas semester ini."
        />
      </div>
    )
  }

  const resolvedKelasId = activeKelasId || kelasWali[0].id
  const namaKelas = kelasWali.find((k) => k.id === resolvedKelasId)?.namaKelas ?? ''

  return (
    <div className="space-y-5">
      <PageHeader title="Wali Kelas" description={namaKelas} />

      {/* Tab Kelas — jika lebih dari 1 kelas */}
      {kelasWali.length > 1 && (
        <div className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-800">
          {kelasWali.map((k) => (
            <TabBtn
              key={k.id}
              active={resolvedKelasId === k.id}
              onClick={() => { setActiveKelasId(k.id); setSubTab('harian') }}
            >
              {k.namaKelas}
            </TabBtn>
          ))}
        </div>
      )}

      {/* Sub-tab per kelas */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {([
          { key: 'harian', label: 'Rekap Hari Ini' },
          { key: 'matrix', label: 'Matrix Mapel' },
          { key: 'izin',   label: 'Izin Masuk' },
        ] as { key: SubTab; label: string }[]).map(({ key, label }) => (
          <TabBtn
            key={key}
            active={subTab === key}
            onClick={() => setSubTab(key)}
          >
            {label}
          </TabBtn>
        ))}
      </div>

      {/* Content */}
      {subTab === 'harian' && (
        <RekapHarianTab kelasId={resolvedKelasId} />
      )}
      {subTab === 'matrix' && (
        <MatrixMapelTab kelasId={resolvedKelasId} semesterId={semesterId} />
      )}
      {subTab === 'izin' && (
        <IzinPendingTab kelasId={resolvedKelasId} />
      )}
    </div>
  )
}

function TabBtn({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
        active
          ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# 6. _components/RekapHarianTab.tsx
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/wali-kelas/_components/RekapHarianTab.tsx"] = """'use client'

import { CheckCircle2, Clock, AlertCircle, MinusCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { useRekapHarianWali } from '@/hooks/absensi/useWaliKelas'
import type { StatusAbsensi } from '@/types'

const STATUS_CFG: Record<string, { cls: string; icon: React.ElementType }> = {
  HADIR:     { cls: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
  TERLAMBAT: { cls: 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20',   icon: Clock        },
  SAKIT:     { cls: 'text-blue-700 bg-blue-50 dark:bg-blue-900/20',         icon: MinusCircle  },
  IZIN:      { cls: 'text-purple-700 bg-purple-50 dark:bg-purple-900/20',   icon: MinusCircle  },
  ALPA:      { cls: 'text-red-700 bg-red-50 dark:bg-red-900/20',            icon: AlertCircle  },
  TAP:       { cls: 'text-orange-700 bg-orange-50 dark:bg-orange-900/20',   icon: AlertCircle  },
}

const SUMMARY_LABELS: { key: keyof import('@/types').RekapKelasWaliSummary; label: string; color: string }[] = [
  { key: 'HADIR',     label: 'Hadir',     color: 'text-emerald-600' },
  { key: 'TERLAMBAT', label: 'Terlambat', color: 'text-yellow-600'  },
  { key: 'SAKIT',     label: 'Sakit',     color: 'text-blue-600'    },
  { key: 'IZIN',      label: 'Izin',      color: 'text-purple-600'  },
  { key: 'ALPA',      label: 'Alpa',      color: 'text-red-600'     },
]

export function RekapHarianTab({ kelasId }: { kelasId: string }) {
  const { data, isLoading } = useRekapHarianWali(kelasId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    )
  }

  if (!data) {
    return (
      <p className="text-sm text-gray-400 text-center py-10 italic">
        Belum ada data absensi hari ini.
      </p>
    )
  }

  const tanggalDisplay = new Date(data.tanggal).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Asia/Makassar',
  })

  return (
    <div className="space-y-4">
      {/* Tanggal + Total */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{tanggalDisplay}</p>
        <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
          {data.total} siswa
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-2">
        {SUMMARY_LABELS.map(({ key, label, color }) => (
          <div
            key={key}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 text-center"
          >
            <p className={'text-2xl font-bold tabular-nums ' + color}>
              {data.summary[key]}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Daftar siswa */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
        {data.data.map((s) => {
          const cfg = STATUS_CFG[s.status] ?? STATUS_CFG.ALPA
          const Icon = cfg.icon
          return (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {s.user.profile.namaLengkap}
                </p>
                {s.user.profile.nisn && (
                  <p className="text-xs text-gray-400 font-mono">{s.user.profile.nisn}</p>
                )}
              </div>
              {s.waktuMasuk && (
                <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">
                  {new Date(s.waktuMasuk).toLocaleTimeString('id-ID', {
                    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar',
                  })}
                </span>
              )}
              <span className={'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ' + cfg.cls}>
                <Icon size={11} />
                {s.status}
              </span>
            </div>
          )
        })}
        {data.data.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8 italic">
            Belum ada data absensi.
          </p>
        )}
      </div>
    </div>
  )
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# 7. _components/MatrixMapelTab.tsx
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/wali-kelas/_components/MatrixMapelTab.tsx"] = """'use client'

import { useState, useMemo }        from 'react'
import { Combobox }                 from '@/components/ui/Combobox'
import type { ComboboxOption }      from '@/components/ui/Combobox'
import { Spinner }                  from '@/components/ui/Spinner'
import { useMataPelajaranList }     from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useMatrixMapelWali }       from '@/hooks/absensi/useWaliKelas'
import { MatrixTable }              from '../../manajemen/_components/MatrixTable'

interface Props {
  kelasId:    string
  semesterId: string
}

export function MatrixMapelTab({ kelasId, semesterId }: Props) {
  const [mapelId, setMapelId] = useState('')

  const { data: mapelData } = useMataPelajaranList(
    kelasId && semesterId ? { kelasId, semesterId } : undefined,
  )

  const mapelOptions: ComboboxOption[] = useMemo(() => {
    const list = Array.isArray(mapelData)
      ? mapelData
      : (mapelData as { data?: unknown[] } | undefined)?.data ?? []
    return (list as { id: string; mataPelajaranTingkat?: { masterMapel?: { nama?: string } } }[])
      .map((m) => ({
        label: m.mataPelajaranTingkat?.masterMapel?.nama ?? m.id,
        value: m.id,
      }))
  }, [mapelData])

  const { data: matrix, isLoading } = useMatrixMapelWali({
    kelasId,
    mataPelajaranId: mapelId,
    semesterId,
  })

  return (
    <div className="space-y-4">
      {/* Filter Mapel */}
      <div className="max-w-xs">
        <Combobox
          options={mapelOptions}
          value={mapelId}
          onChange={setMapelId}
          placeholder="Pilih mata pelajaran..."
          disabled={!semesterId}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      ) : matrix ? (
        // Read-only — onOverride no-op (wali kelas tidak bisa koreksi)
        <MatrixTable
          matrix={matrix}
          onOverride={() => undefined}
        />
      ) : (
        <p className="text-sm text-gray-400 text-center py-10 italic">
          {!mapelId ? 'Pilih mata pelajaran untuk melihat rekap.' : 'Tidak ada data.'}
        </p>
      )}
    </div>
  )
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# 8. _components/IzinPendingTab.tsx
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/wali-kelas/_components/IzinPendingTab.tsx"] = """'use client'

import { CheckCircle2, XCircle, FileText } from 'lucide-react'
import { Modal }                           from '@/components/ui/Modal'
import { Button }                          from '@/components/ui/Button'
import { Spinner }                         from '@/components/ui/Spinner'
import { EmptyState }                      from '@/components/ui/EmptyState'
import { useState }                        from 'react'
import { useIzinPendingWali }              from '@/hooks/absensi/useWaliKelas'
import { useApprovalPerizinan }            from '@/hooks/absensi/usePerizinan'
import type { PerizinanItem }              from '@/types'

const JENIS_LABEL: Record<string, string> = {
  SAKIT:              'Sakit',
  IZIN:               'Izin',
  CUTI:               'Cuti',
  DINAS:              'Dinas',
  KEPERLUAN_KELUARGA: 'Keperluan Keluarga',
}

export function IzinPendingTab({ kelasId }: { kelasId: string }) {
  const { data, isLoading, refetch } = useIzinPendingWali(kelasId)
  const approval   = useApprovalPerizinan()
  const [detail, setDetail]   = useState<PerizinanItem | null>(null)
  const [catatan, setCatatan] = useState('')

  const list = data?.data ?? []

  const handleApprove = (item: PerizinanItem) => {
    approval.mutate(
      { id: item.id, payload: { status: 'APPROVED', catatanApproval: catatan || undefined } },
      { onSuccess: () => { setDetail(null); setCatatan(''); void refetch() } },
    )
  }

  const handleReject = (item: PerizinanItem) => {
    approval.mutate(
      { id: item.id, payload: { status: 'REJECTED', catatanApproval: catatan || undefined } },
      { onSuccess: () => { setDetail(null); setCatatan(''); void refetch() } },
    )
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-16"><Spinner /></div>
  )

  if (list.length === 0) return (
    <EmptyState
      icon={<FileText size={20} />}
      title="Tidak ada izin menunggu"
      description="Semua pengajuan izin siswa sudah diproses."
    />
  )

  const fmtTgl = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    })

  return (
    <div className="space-y-2">
      {list.map((item) => (
        <div
          key={item.id}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex items-start gap-3"
        >
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="font-medium text-sm text-gray-900 dark:text-white">
              {item.user?.profile?.namaLengkap ?? 'Siswa'}
            </p>
            <p className="text-xs text-gray-500">
              {JENIS_LABEL[item.jenis] ?? item.jenis} \u2014 {fmtTgl(item.tanggalMulai)}
              {item.tanggalSelesai !== item.tanggalMulai && ' s/d ' + fmtTgl(item.tanggalSelesai)}
            </p>
            <p className="text-xs text-gray-400 line-clamp-1">{item.alasan}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => { setDetail(item); setCatatan('') }}>
            Tinjau
          </Button>
        </div>
      ))}

      {/* Detail Modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Tinjau Izin"
        description={detail?.user?.profile?.namaLengkap}
        size="sm"
        footer={
          <>
            <Button
              variant="danger" size="sm"
              loading={approval.isPending}
              onClick={() => detail && handleReject(detail)}
            >
              <XCircle size={14} className="mr-1" /> Tolak
            </Button>
            <Button
              variant="primary" size="sm"
              loading={approval.isPending}
              onClick={() => detail && handleApprove(detail)}
            >
              <CheckCircle2 size={14} className="mr-1" /> Setujui
            </Button>
          </>
        }
      >
        {detail && (
          <div className="p-5 space-y-3">
            <InfoRow label="Jenis"   value={JENIS_LABEL[detail.jenis] ?? detail.jenis} />
            <InfoRow label="Periode" value={
              fmtTgl(detail.tanggalMulai) +
              (detail.tanggalSelesai !== detail.tanggalMulai
                ? ' \u2013 ' + fmtTgl(detail.tanggalSelesai)
                : '')
            } />
            <InfoRow label="Alasan"  value={detail.alasan} />
            {detail.fileBuktiUrl && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Bukti</p>
                <a
                  href={detail.fileBuktiUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-emerald-600 hover:underline break-all"
                >
                  {detail.fileBuktiUrl}
                </a>
              </div>
            )}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                Catatan (opsional)
              </label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: OK, semoga lekas sembuh"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-sm text-gray-800 dark:text-gray-200">{value}</p>
    </div>
  )
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# 9. absensi/siswa/_components/RekapAbsensiSection.tsx
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/siswa/_components/RekapAbsensiSection.tsx"] = """'use client'

import { useState }                from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Spinner }                 from '@/components/ui/Spinner'
import { useAuthStore }            from '@/stores/auth.store'
import { useRekapSiswa, useAbsensiHistory } from '@/hooks/absensi/useRekapSiswa'

const STATUS_CLS: Record<string, string> = {
  HADIR:     'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20',
  TERLAMBAT: 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20',
  SAKIT:     'text-blue-700 bg-blue-50 dark:bg-blue-900/20',
  IZIN:      'text-purple-700 bg-purple-50 dark:bg-purple-900/20',
  ALPA:      'text-red-700 bg-red-50 dark:bg-red-900/20',
  TAP:       'text-orange-700 bg-orange-50 dark:bg-orange-900/20',
}

const LIMIT = 10

export function RekapAbsensiSection() {
  const user    = useAuthStore((s) => s.user)
  const siswaId = user?.id ?? null

  const [page, setPage] = useState(1)

  // Summary rekap
  const { data: rekap, isLoading: loadRekap } = useRekapSiswa(siswaId)

  // History pagination
  const { data: history, isLoading: loadHistory } = useAbsensiHistory({
    page,
    limit: LIMIT,
  })

  const items    = history?.data ?? []
  const lastPage = history?.meta.lastPage ?? 1

  // Hitung summary dari riwayat rekap
  const summary = (rekap?.riwayat ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})

  const fmtTgl = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      timeZone: 'Asia/Makassar',
    })

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      {loadRekap ? (
        <div className="h-20 flex items-center justify-center"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {[
            { key: 'HADIR',     label: 'Hadir',     color: 'text-emerald-600' },
            { key: 'TERLAMBAT', label: 'Terlambat', color: 'text-yellow-600'  },
            { key: 'SAKIT',     label: 'Sakit',     color: 'text-blue-600'    },
            { key: 'IZIN',      label: 'Izin',      color: 'text-purple-600'  },
            { key: 'ALPA',      label: 'Alpa',      color: 'text-red-600'     },
          ].map(({ key, label, color }) => (
            <div
              key={key}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 text-center"
            >
              <p className={'text-2xl font-bold tabular-nums ' + color}>
                {summary[key] ?? 0}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* History list */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
          Riwayat Kehadiran
        </p>

        {loadHistory ? (
          <div className="flex items-center justify-center py-10"><Spinner /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8 italic">
            Belum ada riwayat kehadiran.
          </p>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.jadwalPelajaran?.mataPelajaran?.nama ?? 'Mata Pelajaran'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                    <span>{fmtTgl(item.tanggal)}</span>
                    {item.jadwalPelajaran?.masterJam && (
                      <span>
                        {item.jadwalPelajaran.masterJam.jamMulai}
                        {' \u2013 '}
                        {item.jadwalPelajaran.masterJam.jamSelesai}
                      </span>
                    )}
                  </div>
                </div>
                <span className={
                  'text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ' +
                  (STATUS_CLS[item.status] ?? 'text-gray-600 bg-gray-100')
                }>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between pt-2 px-1">
            <Button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="text-xs text-gray-500">
              Halaman {page} / {lastPage}
            </span>
            <Button
              disabled={page >= lastPage}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Inline mini button untuk pagination — hindari import Button berat
function Button({
  children, disabled, onClick,
}: {
  children: React.ReactNode; disabled?: boolean; onClick?: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-300 hover:text-emerald-600 transition-colors"
    >
      {children}
    </button>
  )
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# 10. Update absensi/siswa/page.tsx — tambah tab Rekap
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/siswa/page.tsx"] = """'use client'

import { useState }              from 'react'
import { Calendar, BarChart3 }   from 'lucide-react'
import { PageHeader }            from '@/components/ui/PageHeader'
import { EmptyState }            from '@/components/ui/EmptyState'
import { Spinner }               from '@/components/ui/Spinner'
import { useMyStatusHariIni }    from '@/hooks/absensi/useMyStatusHariIni'
import { JadwalSiswaCard }       from './_components/JadwalSiswaCard'
import { PengajuanIzinModal }    from './_components/PengajuanIzinModal'
import { RekapAbsensiSection }   from './_components/RekapAbsensiSection'
import type { AbsensiStatusItem } from '@/types'

type Tab = 'jadwal' | 'rekap'

export default function AbsensiSiswaPage() {
  const { jadwalList, isLoading, aktiveSemesterNama } = useMyStatusHariIni()
  const [izinTarget, setIzinTarget] = useState<AbsensiStatusItem | null>(null)
  const [tab, setTab]               = useState<Tab>('jadwal')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <PageHeader
        title="Absensi"
        description={aktiveSemesterNama ? 'Semester ' + aktiveSemesterNama : undefined}
      />

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        <TabBtn active={tab === 'jadwal'} onClick={() => setTab('jadwal')}>
          <Calendar size={13} /> Jadwal Hari Ini
        </TabBtn>
        <TabBtn active={tab === 'rekap'} onClick={() => setTab('rekap')}>
          <BarChart3 size={13} /> Rekap Kehadiran
        </TabBtn>
      </div>

      {/* Tab: Jadwal Hari Ini */}
      {tab === 'jadwal' && (
        jadwalList.length === 0 ? (
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
        )
      )}

      {/* Tab: Rekap Kehadiran */}
      {tab === 'rekap' && <RekapAbsensiSection />}

      <PengajuanIzinModal
        open={!!izinTarget}
        onClose={() => setIzinTarget(null)}
        jadwal={izinTarget}
      />
    </div>
  )
}

function TabBtn({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
        active
          ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
      ].join(' ')}
    >
      {children}
    </button>
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
    print("\n✅ Batch 7 selesai — 10 file digenerate.")
    print("   Verifikasi: npx tsc --noEmit 2>&1 | Select-String 'wali-kelas|rekap|RekapAbsensi'")