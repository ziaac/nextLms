import api from '@/lib/axios'
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
  RekapSemesterSiswaItem,
  KinerjaGuruResponse,
} from '@/types'

// ── Sesi ──────────────────────────────────────────────────────────────────────

export const bukaSesi = (payload: BukaSesiPayload) =>
  api.post<SesiResponse>('/absensi/sesi', payload).then((r) => r.data)

export const getSesiDetail = (token: string) =>
  api.get<SesiDetailResponse>('/absensi/sesi/' + token).then((r) => r.data)

export const overrideSiswaSesi = (
  token:   string,
  payload: import('@/types').OverrideSiswaPayload,
) =>
  api
    .post<import('@/types').OverrideSiswaResponse>(
      '/absensi/sesi/' + token + '/override-siswa',
      payload,
    )
    .then((r) => r.data)

export const ubahModeSesi = (token: string, payload: import('@/types').UbahModeSesiPayload) =>
  api.patch<import('@/types').UbahModeSesiResponse>('/absensi/sesi/' + token + '/mode', payload).then((r) => r.data)

export const perpanjangSesi = (token: string, payload: PerpanjangPayload) =>
  api.patch('/absensi/sesi/' + token + '/perpanjang', payload).then((r) => r.data)

export const tutupSesi = (token: string) =>
  api.patch('/absensi/sesi/' + token + '/tutup', {}).then((r) => r.data)

// ── Scan ──────────────────────────────────────────────────────────────────────

export const scanQR = (payload: ScanPayload) =>
  api.post<ScanResponse>('/absensi/scan', payload).then((r) => r.data)

// ── My ────────────────────────────────────────────────────────────────────────

export const getMyStatusHariIni = (semesterId: string) =>
  api.get<MyStatusHariIniResponse>('/absensi/my/status-hari-ini', {
    params: { semesterId },
  }).then((r) => r.data)

// ── Manual Bulk ───────────────────────────────────────────────────────────────

export const simpanManualSingle = (payload: import('@/types').ManualSinglePayload) =>
  api.post('/absensi/manual', payload).then((r) => r.data)

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

export const exportMatrixBlob = async (params: MatrixQueryParams): Promise<void> => {
  const res = await api.get<Blob>('/absensi/export/matrix', {
    params,
    responseType: 'blob',
  })
  const url = URL.createObjectURL(res.data)
  const a   = document.createElement('a')
  a.href    = url
  a.download = `rekap-absensi-${params.mataPelajaranId}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const exportMatrix = (params: MatrixQueryParams) =>
  api.get<Blob>('/absensi/export/matrix', { params, responseType: 'blob' })

// ── Wali Kelas ────────────────────────────────────────────────────────────────


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


// ── My Riwayat (Siswa) ────────────────────────────────────────────────────────
// GET /absensi/my/riwayat — backend auto-lock userId ke siswa yang login
// Berbeda dengan getAbsensiHistory yang untuk admin/guru

export interface MyRiwayatQuery {
  page?:             number
  limit?:            number
  kelasId?:          string
  masterJamId?:      string
  semesterId?:       string
  isSemesterActive?: boolean
  status?:           string
  tanggalMulai?:     string
  tanggalSelesai?:   string
}

export const getMyRiwayatAbsensi = (params: MyRiwayatQuery) =>
  api.get<AbsensiHistoryResponse>('/absensi/my/riwayat', { params }).then((r) => r.data)


// ── Guru Detail (Target vs Realisasi) ────────────────────────────────────────
// GET /absensi-report/guru/detail/:guruId?semesterId={...}

export interface GuruDetailJadwalItem {
  id: string
  mataPelajaran: {
    targetPertemuan?: number | null
    mataPelajaranTingkat: {
      masterMapel: { nama: string }
    }
  } | null
  _count: { absensi: number }
}

export const getGuruDetailJadwal = (guruId: string, semesterId: string) =>
  api
    .get<GuruDetailJadwalItem[]>('/absensi-report/guru/detail/' + guruId, {
      params: { semesterId },
    })
    .then((r) => r.data)

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

// ── Wali Kelas — Rekap Hari Ini (endpoint yang benar) ────────────────────────
// GET /absensi/my/kelas-wali/rekap-hari-ini?kelasId={id}

export interface JadwalHariIniWaliItem {
  jadwalId:   string
  namaMapel:  string
  namaGuru:   string
  jam:        string
  isOngoing:  boolean
  statusSesi: string | null
  tokenSesi:  string | null
  modeSesi?:  string | null
}

export interface JadwalHariIniWaliResponse {
  kelasId:    string
  namaKelas:  string
  hari:       string
  totalJadwal: number
  data:       JadwalHariIniWaliItem[]
}

export const getJadwalHariIniWali = (semesterId: string, kelasId: string) =>
  api.get<JadwalHariIniWaliResponse>('/absensi/my/kelas-wali/jadwal-hari-ini', {
    params: { semesterId, kelasId },
  }).then((r) => r.data)

export const getRekapKelasWaliHariIni = (kelasId: string) =>
  api.get<RekapKelasWaliResponse>('/absensi/my/kelas-wali/rekap-hari-ini', {
    params: { kelasId },
  }).then((r) => r.data)

// ── Rekap Semester Per Kelas (Wali Kelas) ─────────────────────────────────────
// GET /absensi-report/siswa/per-kelas/:kelasId?semesterId={id}

export const getRekapSemesterPerKelas = (kelasId: string, semesterId: string) =>
  api
    .get<RekapSemesterSiswaItem[]>(
      '/absensi-report/siswa/per-kelas/' + kelasId,
      { params: { semesterId } },
    )
    .then((r) => r.data)

// ── Kinerja Guru Per Semester ─────────────────────────────────────────────────
// GET /absensi/rekap/guru/:guruId?semesterId={id}&bulan={n}

export const getKinerjaGuru = (
  guruId: string,
  semesterId: string,
  bulan?: number,
) =>
  api
    .get<KinerjaGuruResponse>('/absensi/rekap/guru/' + guruId, {
      params: { semesterId, ...(bulan ? { bulan } : {}) },
    })
    .then((r) => r.data)

export async function batalkanScanSiswa(
  token:  string,
  userId: string,
): Promise<{ message: string }> {
  const { data } = await api.delete(`/absensi/sesi/${token}/batalkan-scan/${userId}`)
  return data
}

export interface RekapJadwalItem {
  id:          string
  namaLengkap: string
  nisn:        string
  status:      string
  waktuMasuk:  string | null
  keterangan:  string | null
}

export interface RekapJadwalResponse {
  tanggal: string
  total:   number
  summary: { HADIR: number; TERLAMBAT: number; SAKIT: number; IZIN: number; ALPA: number; TAP: number }
  data:    RekapJadwalItem[]
}

export const getRekapJadwalHariIni = (jadwalPelajaranId: string): Promise<RekapJadwalResponse> =>
  api.get<RekapJadwalResponse>(`/absensi/rekap-jadwal/${jadwalPelajaranId}`).then((r) => r.data)
