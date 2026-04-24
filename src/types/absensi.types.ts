import type { StatusAbsensi, ModeSesi, StatusSesi } from './enums'

// ── Sesi ──────────────────────────────────────────────────────────────────────

export interface BukaSesiPayload {
  jadwalPelajaranId: string
  tanggal:           string
  mode:              ModeSesi
  durasiMenit?:      number
  toleransiMenit?:   number
  requireGps?:       boolean
  latitudeGuru?:     number
  longitudeGuru?:    number
  radiusMeter?:      number
}

export interface SesiResponse {
  token:             string
  guruId:            string
  jadwalPelajaranId: string
  kelasId:           string
  semesterId:        string
  mataPelajaranId:   string
  tanggal:           string
  jamMulai:          string
  toleransiMenit:    number
  mode:              ModeSesi
  requireGps:        boolean
  latitudeGuru?:     number
  longitudeGuru?:    number
  radiusMeter?:      number
  expiresAt:         string
  ttlDetik:          number
}

export interface SesiDetail {
  token:             string
  guruId:            string
  jadwalPelajaranId: string
  kelasId:           string
  mataPelajaranId:   string
  tanggal:           string
  jamMulai:          string
  toleransiMenit:    number
  mode:              ModeSesi
  requireGps:        boolean
  radiusMeter?:      number
  expiresAt:         string
}

export interface PesertaSesi {
  id:          string
  nama:        string
  absen:       number
  sudahScan:   boolean
  statusSiswa: string
  isEligible:  boolean
  statusAbsen: string | null
}

export interface StatistikSesi {
  total: number
  hadir: number
  sisa:  number
}

export interface SesiDetailResponse {
  sesi:      SesiDetail
  statistik: StatistikSesi
  peserta:   PesertaSesi[]
}

// ── My Status Hari Ini ────────────────────────────────────────────────────────

export interface KelasWali {
  id:        string
  namaKelas: string
}

export interface AbsensiStatusItem {
  jadwalId:      string
  namaMapel:     string
  namaKelas:     string
  jam:           string
  isOngoing:     boolean
  statusSesi:    StatusSesi | null
  tokenSesi:     string | null
  statusAbsensi: string
  modeSesi:      ModeSesi | null
}

export interface MyStatusHariIniResponse {
  isWaliKelas: boolean
  kelasWali:   KelasWali[]
  total:       number
  data:        AbsensiStatusItem[]
}

// ── Scan ──────────────────────────────────────────────────────────────────────

export interface ScanPayload {
  token:      string
  latitude?:  number
  longitude?: number
}

export interface ScanResponse {
  message: string
  status:  StatusAbsensi
}

// ── Manual Bulk ───────────────────────────────────────────────────────────────

export interface AbsensiManualItem {
  userId:       string
  status:       StatusAbsensi
  keterangan?:  string
}

export interface ManualBulkPayload {
  jadwalPelajaranId: string
  tanggal:           string
  absensi:           AbsensiManualItem[]
}

// ── Manual Single (upsert satu record) ───────────────────────────────────────

export interface ManualSinglePayload {
  userId:            string
  jadwalPelajaranId: string
  tanggal:           string
  status:            import('./enums').StatusAbsensi
  keterangan?:       string
}

// ── Override ──────────────────────────────────────────────────────────────────

export interface OverridePayload {
  status:       StatusAbsensi
  keterangan?:  string
}

// ── Matrix ────────────────────────────────────────────────────────────────────

export interface MatrixMetadata {
  namaMapel:           string
  jadwalPelajaranId:   string | null
  targetPertemuan:     number | null
  realisasiPertemuan:  number
}

export interface MatrixSiswaSummary {
  H: number
  I: number
  S: number
  A: number
}

export interface MatrixKehadiranItem {
  tanggal: string
  status:  string | null
  id:      string | null
}

export interface MatrixSiswaRow {
  userId:     string
  nomorAbsen: number
  nama:       string
  nisn:       string
  statusSiswa: string
  kehadiran:  MatrixKehadiranItem[]
  summary:    MatrixSiswaSummary
}

export interface MatrixResponse {
  metadata:       MatrixMetadata
  listPertemuan:  (string | null)[]
  dataSiswa:      MatrixSiswaRow[]
}

// ── Reports ───────────────────────────────────────────────────────────────────

export interface SiswaKritisItem {
  userId:     string
  nama:       string
  nisn:       string
  jumlahAlpa: number
  kelasNama:  string
}

export interface GuruDetailReport {
  guruId:            string
  nama:              string
  statusKepatuhan:   string
  persentaseHadir:   number
  totalJP:           number
}

export interface RekapHonorItem {
  bulan:    number
  totalJP:  number
  bobot:    number
  nominal:  number
}

// ── Sesi Actions ──────────────────────────────────────────────────────────────

export interface OverrideSiswaPayload {
  userId:       string
  status:       import('./enums').StatusAbsensi
  keterangan?:  string
}

export interface OverrideSiswaResponse {
  message: string
  data: {
    id:                string
    userId:            string
    status:            import('./enums').StatusAbsensi
    keterangan?:       string
    tanggal:           string
    jadwalPelajaranId: string
    createdBy:         string
  }
}

export interface UbahModeSesiPayload {
  mode:           ModeSesi
  latitudeGuru?:  number
  longitudeGuru?: number
}

export interface UbahModeSesiResponse {
  message:    string
  mode:       ModeSesi
  requireGps: boolean
}

export interface PerpanjangPayload {
  tambahanMenit: number
}

// ── Public Stats ──────────────────────────────────────────────────────────────

export interface PublicStatsMonitoring {
  jamSekarang:           string
  totalJadwalSeharusnya: number
  totalSesiAktif:        number
  persentaseKBM:         number
}

export interface PublicStatsLiveItem {
  mapel:  string
  kelas:  string
  status: string
}

export interface PublicStatsKehadiran {
  status: string
  _count: number
}

export interface PublicStatsAchievement {
  label:   string
  topList: string[]
}

export interface PublicStatsResponse {
  monitoring: PublicStatsMonitoring
  liveList:   PublicStatsLiveItem[]
  sekolah: {
    kehadiranHariIni: PublicStatsKehadiran[]
    updateTerakhir:   string
  }
  achievement: PublicStatsAchievement
}

// ── Rekap Kelas Wali Hari Ini ─────────────────────────────────────────────────

export interface RekapKelasWaliSummary {
  HADIR:     number
  TERLAMBAT: number
  SAKIT:     number
  IZIN:      number
  ALPA:      number
  TAP:       number
}

export interface RekapKelasWaliSiswa {
  id:          string
  userId?:     string
  status:      StatusAbsensi
  waktuMasuk?: string | null
  user: {
    profile: {
      namaLengkap: string
      nisn:        string | null
    }
  }
}

export interface RekapKelasWaliResponse {
  tanggal: string
  total:   number
  summary: RekapKelasWaliSummary
  data:    RekapKelasWaliSiswa[]
}

// ── History Absensi Siswa ─────────────────────────────────────────────────────

export interface AbsensiHistorySummary {
  HADIR:     number
  TERLAMBAT: number
  IZIN:      number
  SAKIT:     number
  ALPA:      number
  TAP:       number
}

export interface AbsensiHistoryItem {
  id:          string
  userId?:     string
  tanggal:     string
  status:      StatusAbsensi
  waktuMasuk?: string | null
  jadwalPelajaran: {
    id?:      string
    semester?: { nama: string; isActive: boolean } | null
    mataPelajaran: {
      id?:  string
      nama: string
    } | null
    masterJam: {
      jamMulai:   string
      jamSelesai: string
    } | null
  } | null
}

export interface AbsensiHistoryResponse {
  data: AbsensiHistoryItem[]
  meta: {
    total:    number
    page:     number
    lastPage: number
    summary?: AbsensiHistorySummary
  }
}

export interface AbsensiHistoryQuery {
  page?:             number
  limit?:            number
  kelasId?:          string
  masterJamId?:      string
  semesterId?:       string
  isSemesterActive?: boolean
  status?:           StatusAbsensi
  tanggalMulai?:     string
  tanggalSelesai?:   string
}

// ── Rekap Summary Siswa ───────────────────────────────────────────────────────

export interface RekapSiswaRiwayatItem {
  id:      string
  tanggal: string
  status:  StatusAbsensi
  jadwalPelajaran: {
    mataPelajaran: {
      nama: string
    } | null
  } | null
}

export interface RekapSiswaResponse {
  total:   number
  riwayat: RekapSiswaRiwayatItem[]
}

// ── Detail Semester Siswa ─────────────────────────────────────────────────────

export interface AbsensiDetailSemesterItem {
  id:      string
  tanggal: string
  status:  StatusAbsensi
  jadwalPelajaran: {
    id: string
    mataPelajaran: {
      id: string
      mataPelajaranTingkat: {
        masterMapel: { nama: string }
      } | null
    } | null
  } | null
}

// ── Rekap Semester Per Kelas (Wali Kelas) ─────────────────────────────────────

export interface RekapSemesterSiswaRekap {
  H: number
  I: number
  S: number
  A: number
}

export interface RekapSemesterSiswaItem {
  id:          string
  nama:        string
  nisn:        string
  statusSiswa: string
  rekap:       RekapSemesterSiswaRekap
}

// ── Kinerja Guru Per Semester ─────────────────────────────────────────────────

export interface KinerjaGuruRincian {
  namaMapel:       string
  jumlahPertemuan: number
  totalJP:         number
}

export interface KinerjaGuruResponse {
  guruId:           string
  totalPertemuan:   number
  totalJamMengajar: number
  rincianPerMapel:  KinerjaGuruRincian[]
}

// ── Matrix Siswa ──────────────────────────────────────────────────────────────
export interface MatrixSiswaSesi {
  pertemuan:  number
  tanggal:    string | null
  status:     'H' | 'I' | 'S' | 'A' | null
  waktuMasuk: string | null
}

export interface MatrixSiswaMapelRow {
  mataPelajaranId:    string
  namaMapel:          string
  targetPertemuan:    number
  realisasiPertemuan: number
  sesi:               MatrixSiswaSesi[]
  summary:            { H: number; I: number; S: number; A: number }
}

export interface MatrixSiswaResponse {
  siswa: {
    id:        string
    nama:      string
    nisn:      string
    namaKelas: string
  } | null
  semester: {
    id:          string
    nama:        string
    tahunAjaran: string
  } | null
  maxPertemuan: number
  mapel:        MatrixSiswaMapelRow[]
}
