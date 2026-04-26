import type {
  JalurPendaftaran, StatusSiswaLulus, StatusBiodata,
  StatusAnak, StatusSekolahAsal, StatusOrtuKandung, StatusOrangTua,
  JenisKelamin, Agama,
} from './enums'
import type { BloodType, JenisTinggal, AlatTransportasi, JenjangPendidikan } from './users.types'

// ── SiswaLulus (seed table oleh admin) ────────────────────────────
export interface SiswaLulus {
  id: string
  tahunAjaranId: string
  noPendaftaran: string
  nama: string
  tanggalLahir: string
  jalurPendaftaran: JalurPendaftaran | null
  status: StatusSiswaLulus
  createdAt: string
  tahunAjaran: { nama: string; semester: unknown[] }
  biodata: BiodataSummary | null
}

export interface BiodataSummary {
  id: string
  status: StatusBiodata
  nisn: string | null
  peminatan: string | null
}

// ── BiodataSiswaBaru (diisi oleh calon siswa) ─────────────────────
export interface BiodataSiswaBaru {
  id: string
  siswaLulusId: string
  // Identitas
  nisn: string | null
  nis: string | null
  namaLengkap: string
  namaPanggilan: string | null
  jenisKelamin: JenisKelamin
  tempatLahir: string
  tanggalLahir: string
  agama: Agama
  noKK: string | null
  // Alamat
  alamat: string | null
  kelurahan: string | null
  kecamatan: string | null
  kabupaten: string | null
  provinsi: string | null
  kodePos: string | null
  noTelepon: string | null
  noWa: string | null
  noTelpRumah: string | null
  email: string | null
  // Personal
  anakKe: number | null
  jumlahSaudaraKandung: number | null
  statusAnak: StatusAnak | null
  citaCita: string | null
  hobi: string | null
  riwayatPenyakit: string | null
  kebutuhanKhusus: string | null
  ukuranBaju: string | null
  bloodType: BloodType | null
  tinggi: number | null
  berat: number | null
  jenisTinggal: JenisTinggal | null
  alatTransportasi: AlatTransportasi | null
  jarakKeSekolah: number | null
  penerimaKIP: boolean
  nomorKIP: string | null
  peminatan: string | null
  // Sekolah Asal
  namaSekolahAsal: string | null
  alamatSekolahAsal: string | null
  npsnSekolahAsal: string | null
  statusSekolahAsal: StatusSekolahAsal | null
  // Orang Tua
  statusOrtuKandung: StatusOrtuKandung | null
  namaAyah: string | null
  nikAyah: string | null
  statusAyah: StatusOrangTua | null
  pekerjaanAyah: string | null
  pendidikanAyah: JenjangPendidikan | null
  penghasilanAyah: string | null
  noTelpAyah: string | null
  namaIbu: string | null
  nikIbu: string | null
  statusIbu: StatusOrangTua | null
  pekerjaanIbu: string | null
  pendidikanIbu: JenjangPendidikan | null
  penghasilanIbu: string | null
  noTelpIbu: string | null
  namaWali: string | null
  nikWali: string | null
  hubunganWali: string | null
  pekerjaanWali: string | null
  pendidikanWali: JenjangPendidikan | null
  penghasilanWali: string | null
  noTelpWali: string | null
  // Dokumen keys
  fotoUrl: string | null
  aktaKey: string | null
  kkKey: string | null
  kipKey: string | null
  ijazahLaluKey: string | null
  raporKey: string | null
  skhunKey: string | null
  sertifikatKey: string | null
  ktpOrtuKey: string | null
  // Status
  status: StatusBiodata
  catatanAdmin: string | null
  userId: string | null
  verifiedAt: string | null
  createdAt: string
  updatedAt: string
  siswaLulus?: SiswaLulus
}

// ── Verifikasi Identitas response ─────────────────────────────────
export interface VerifikasiIdentitasResult {
  id: string
  nama: string
  noPendaftaran: string
  jalurPendaftaran: JalurPendaftaran | null
  tahunAjaran: { nama: string }
  status: StatusSiswaLulus
  sudahIsiBiodata: boolean
  biodataId: string | null
  biodataStatus: StatusBiodata | null
}

// ── Buatkan Akun result ───────────────────────────────────────────
export interface BuatkanAkunResult {
  berhasil: number
  dilewati: number
  error: number
  detail: Array<{
    siswaLulusId: string
    nama: string
    status: 'berhasil' | 'dilewati' | 'error'
    email?: string
    passwordAwal?: string
    alasan?: string
  }>
}
