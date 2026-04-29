import type { 
  UserRole, 
  JenisKelamin, 
  Agama,
  JalurPendaftaran,
  StatusAnak,
  StatusOrangTua,
  StatusOrtuKandung,
  StatusSekolahAsal,
} from './enums'

export type BloodType = 'A_POS' | 'A_NEG' | 'B_POS' | 'B_NEG' | 'AB_POS' | 'AB_NEG' | 'O_POS' | 'O_NEG'
export type JenisTinggal = 'ORANG_TUA' | 'WALI' | 'ASRAMA' | 'PONDOK' | 'PANTI' | 'LAINNYA'
export type AlatTransportasi = 'JALAN_KAKI' | 'SEPEDA' | 'MOTOR' | 'MOBIL' | 'ANGKUTAN_UMUM' | 'LAINNYA'
export type JenjangPendidikan = 'TIDAK_SEKOLAH' | 'SD' | 'SMP' | 'SMA' | 'D1' | 'D2' | 'D3' | 'D4' | 'S1' | 'S2' | 'S3'

/** Profile partial — dari GET /users list */
export interface UserProfile {
  namaLengkap: string
  fotoUrl: string | null
  nisn: string | null
  nip: string | null
  nuptk: string | null
  noTelepon: string | null
  tahunMasuk?: number | null
}

/** Profile lengkap — dari GET /users/:id */
export interface UserProfileFull extends UserProfile {
  id: string
  userId: string
  namaPanggilan: string | null
  nik: string | null
  noKK: string | null
  noWa: string | null
  noTelpRumah: string | null
  alamat: string | null
  kelurahan: string | null
  kecamatan: string | null
  kabupaten: string | null
  provinsi: string | null
  kodePos: string | null
  tempatLahir: string
  tanggalLahir: string
  agama: Agama
  jenisKelamin: JenisKelamin
  bloodType: BloodType | null
  tinggi: number | null
  berat: number | null
  // Sekolah asal
  namaSekolahAsal: string | null
  alamatSekolahAsal: string | null
  npsnSekolahAsal: string | null
  statusSekolahAsal: StatusSekolahAsal | null
  // Data keluarga
  anakKe: number | null
  jumlahSaudaraKandung: number | null
  statusAnak: StatusAnak | null
  jenisTinggal: JenisTinggal | null
  alatTransportasi: AlatTransportasi | null
  jarakKeSekolah: number | null
  penerimaKIP: boolean
  nomorKIP: string | null
  // Data pribadi siswa
  citaCita: string | null
  hobi: string | null
  riwayatPenyakit: string | null
  kebutuhanKhusus: string | null
  ukuranBaju: string | null
  // Pendaftaran siswa
  nis: string | null
  nomorPendaftaran: string | null
  jalurPendaftaran: JalurPendaftaran | null
  tanggalDaftar: string | null
  // Orang tua — status umum
  statusOrtuKandung: StatusOrtuKandung | null
  // Orang tua ayah
  namaAyah: string | null
  nikAyah: string | null
  statusAyah: StatusOrangTua | null
  pekerjaanAyah: string | null
  pendidikanAyah: JenjangPendidikan | null
  penghasilanAyah: string | null
  noTelpAyah: string | null
  // Orang tua ibu
  namaIbu: string | null
  nikIbu: string | null
  statusIbu: StatusOrangTua | null
  pekerjaanIbu: string | null
  pendidikanIbu: JenjangPendidikan | null
  penghasilanIbu: string | null
  noTelpIbu: string | null
  // Wali
  namaWali: string | null
  nikWali: string | null
  hubunganWali: string | null
  pekerjaanWali: string | null
  pendidikanWali: JenjangPendidikan | null
  penghasilanWali: string | null
  noTelpWali: string | null
  // Dokumen
  aktaKey: string | null
  kkKey: string | null
  kipKey: string | null
  ijazahLaluKey: string | null
  raporKey: string | null
  skhunKey: string | null
  sertifikatKey: string | null
  ktpOrtuKey: string | null
  tahunMasuk: number | null
  createdAt: string
  updatedAt: string
}

export interface UserItem {
  id: string
  email: string
  username: string | null
  role: UserRole
  isActive: boolean
  isVerified: boolean
  lastLoginAt: string | null
  loginCount: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  profile: UserProfile
}

export interface UserDetail {
  id: string
  email: string
  username: string | null
  role: UserRole
  isActive: boolean
  isVerified: boolean
  lastLoginAt: string | null
  loginCount: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  profile: UserProfileFull
}

export interface CreateUserDto {
  email: string
  password: string
  role: UserRole
  namaLengkap: string
  jenisKelamin: JenisKelamin
  tempatLahir: string
  tanggalLahir: string
  agama: Agama
  username?: string
  namaPanggilan?: string
  nik?: string
  nisn?: string
  nip?: string
  nuptk?: string
  noKK?: string
  namaSekolahAsal?: string
  alamatSekolahAsal?: string
  anakKe?: number
  jumlahSaudaraKandung?: number
  jenisTinggal?: JenisTinggal
  alatTransportasi?: AlatTransportasi
  jarakKeSekolah?: number
  noTelepon?: string
  noWa?: string
  noTelpRumah?: string
  penerimaKIP?: boolean
  nomorKIP?: string
  alamat?: string
  kelurahan?: string
  kecamatan?: string
  kabupaten?: string
  provinsi?: string
  kodePos?: string
  bloodType?: BloodType
  tinggi?: number
  berat?: number
  namaAyah?: string
  nikAyah?: string
  pekerjaanAyah?: string
  pendidikanAyah?: JenjangPendidikan
  penghasilanAyah?: string
  namaIbu?: string
  nikIbu?: string
  pekerjaanIbu?: string
  pendidikanIbu?: JenjangPendidikan
  penghasilanIbu?: string
  namaWali?: string
  nikWali?: string
  hubunganWali?: string
  pekerjaanWali?: string
  pendidikanWali?: JenjangPendidikan
  penghasilanWali?: string
  noTelpWali?: string
  aktaKey?: string
  kkKey?: string
  kipKey?: string
  isActive?: boolean
  // Siswa extended fields
  nis?: string
  nomorPendaftaran?: string
  jalurPendaftaran?: JalurPendaftaran
  npsnSekolahAsal?: string
  statusSekolahAsal?: StatusSekolahAsal
  statusAnak?: StatusAnak
  statusOrtuKandung?: StatusOrtuKandung
  statusAyah?: StatusOrangTua
  statusIbu?: StatusOrangTua
  noTelpAyah?: string
  noTelpIbu?: string
  citaCita?: string
  hobi?: string
  riwayatPenyakit?: string
  kebutuhanKhusus?: string
  ukuranBaju?: string
  ijazahLaluKey?: string
  raporKey?: string
  skhunKey?: string
  sertifikatKey?: string
  ktpOrtuKey?: string
  tahunMasuk?: number
}

export interface UpdateUserDto extends Partial<Omit<CreateUserDto, 'password' | 'email'>> {
  // All extended fields are now inherited from CreateUserDto
}
