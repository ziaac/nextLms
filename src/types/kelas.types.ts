import type { Ruangan } from './ruangan.types'
import type { UserRole } from "./enums";

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum StatusSiswa {
  AKTIF               = "AKTIF",
  PINDAH              = "PINDAH",
  KELUAR              = "KELUAR",
  LULUS               = "LULUS",
  DO                  = "DO",
  MENGUNDURKAN_DIRI   = "MENGUNDURKAN_DIRI",
}

export enum StatusAkhirTahun {
  NAIK_KELAS          = "NAIK_KELAS",
  TIDAK_NAIK          = "TIDAK_NAIK",
  LULUS               = "LULUS",
  DO                  = "DO",
  MENGUNDURKAN_DIRI   = "MENGUNDURKAN_DIRI",
}

export enum JenisKelamin {
  L = "L",
  P = "P",
}

// ─── TahunAjaran (shape sesuai response /kelas) ──────────────────────────────
// CATATAN: /kelas hanya return { nama, isActive } — tanpa id
// Gunakan tahunAjaranId dari field root jika butuh id
export interface TahunAjaranSingkat {
  nama:     string;
  isActive: boolean;
}

// ─── TingkatKelas (shape sesuai response /kelas) ─────────────────────────────
// CATATAN: /kelas hanya return { nama, jenjang } — tanpa id & urutan
// Gunakan tingkatKelasId dari field root jika butuh id
export interface TingkatKelasSingkat {
  nama:    string;
  jenjang: string;
}

// ─── Profil Guru (field sensitif di-exclude) ─────────────────────────────────
// CATATAN: Backend mengembalikan passwordHash di response waliKelas —
// ini adalah security issue yang perlu difix di backend.
// Di frontend kita type hanya field yang seharusnya dipakai.
export interface ProfilWaliKelas {
  namaLengkap: string;
  fotoUrl:     string | null;
}

export interface WaliKelas {
  id:      string;
  email:   string;
  role:    UserRole;
  profile: ProfilWaliKelas;
  // Field sensitif (passwordHash, dll) sengaja tidak di-type
  // agar tidak diakses secara tidak sengaja di komponen
}

// ─── Count Kelas ─────────────────────────────────────────────────────────────
export interface KelasCount {
  kelasSiswa: number;
}

// ─── Kelas (shape sesuai response /kelas) ────────────────────────────────────
export interface Kelas {
  id:             string;
  tahunAjaranId:  string;
  tingkatKelasId: string;
  namaKelas:      string;
  kodeKelas:      string | null;
  waliKelasId:    string | null;
  kuotaMaksimal:  number;
  ruanganId:      string | null;
  ruangan:        Ruangan | null;
  createdAt:      string;
  updatedAt:      string;

  // Relasi
  tahunAjaran:  TahunAjaranSingkat;
  tingkatKelas: TingkatKelasSingkat;
  waliKelas:    WaliKelas | null;
  _count:       KelasCount;
}
// ─── Statistik Kelas ─────────────────────────────────────────────────────────
export interface KelasStatistik {
  kelas:         { id: string; namaKelas: string };
  kuotaMaksimal: number;
  jumlahSiswa:   number;
  kuotaTersisa:  number;
  siswaLaki:     number;
  siswaPerempuan: number;
}

// ─── DTO Create / Update ──────────────────────────────────────────────────────
export interface CreateKelasDto {
  tahunAjaranId:  string;
  tingkatKelasId: string;
  namaKelas:      string;
  kodeKelas?:     string;
  waliKelasId?:   string;
  kuotaMaksimal?: number;
  ruanganId?:       string;
}

export type UpdateKelasDto = Partial<CreateKelasDto>;

// ─── Filter Query ─────────────────────────────────────────────────────────────
export interface KelasFilterParams {
  tahunAjaranId?:  string;
  tingkatKelasId?: string;
  namaKelas?:      string;
  semesterId?:     string;
}

// ─── Profil Siswa ─────────────────────────────────────────────────────────────
export interface ProfilSiswa {
  namaLengkap:   string;
  nisn:          string | null;
  nik:           string | null;
  jenisKelamin:  JenisKelamin;
  tempatLahir:   string;
  tanggalLahir:  string;
  agama:         string;
  alamat:        string | null;
  kecamatan:     string | null;
  kabupaten:     string | null;
  provinsi:      string | null;
  noTelepon:     string | null;
  noWa:          string | null;
  fotoUrl:       string | null;
  namaAyah:      string | null;
  pekerjaanAyah: string | null;
  namaIbu:       string | null;
  pekerjaanIbu:  string | null;
  namaWali:      string | null;
  hubunganWali:  string | null;
  noTelpWali:    string | null;
}

export interface SiswaUser {
  id:       string;
  email:    string;
  isActive: boolean;
  profile:  ProfilSiswa;
}

// ─── Kelas Siswa ─────────────────────────────────────────────────────────────
export interface KelasSiswa {
  id:                  string;
  kelasId:             string;
  siswaId:             string;
  tahunAjaranId:       string;
  nomorAbsen:          number | null;
  status:              StatusSiswa;
  tanggalMasuk:        string;
  tanggalKeluar:       string | null;
  alasanKeluar:        string | null;
  statusAkhirTahun:    StatusAkhirTahun | null;
  catatanAkhirTahun:   string | null;
  createdAt:           string;
  updatedAt:           string;
  siswa:               SiswaUser;
}

// ─── DTO Siswa ────────────────────────────────────────────────────────────────
export interface TambahSiswaKeKelasDto {
  siswaId:      string;
  tanggalMasuk: string;
  nomorAbsen?:  number;
}

// 1. Buat interface baru khusus untuk item siswa di dalam array Bulk
export interface BulkSiswaItemDto {
  siswaId: string;
  nomorAbsen?: number;
}

// 2. Perbaiki TambahSiswaBulkDto agar sesuai dengan backend NestJS
export interface TambahSiswaBulkDto {
  tanggalMasuk: string;       // Posisikan tanggalMasuk di luar array
  siswa: BulkSiswaItemDto[];  // Gunakan interface baru yang tidak mewajibkan tanggalMasuk
}

export interface PindahSiswaDto {
  kelasBaruId:   string;
  tanggalPindah: string;
  alasan?:       string;
}

export interface KeluarSiswaDto {
  tanggalKeluar: string;
  status: Extract<
    StatusSiswa,
    StatusSiswa.KELUAR | StatusSiswa.DO | StatusSiswa.MENGUNDURKAN_DIRI
  >;
  alasan?: string;
}

// ─── History Kelas Siswa ──────────────────────────────────────────────────────
export interface KelasSiswaHistory {
  id:               string;
  kelasId:          string;
  kelas:            Pick<Kelas, "id" | "namaKelas" | "tahunAjaran" | "tingkatKelas">;
  nomorAbsen:       number | null;
  status:           StatusSiswa;
  tanggalMasuk:     string;
  tanggalKeluar:    string | null;
  alasanKeluar:     string | null;
  statusAkhirTahun: StatusAkhirTahun | null;
}

// ─── User by Role (dropdown) ──────────────────────────────────────────────────
export interface UserByRole {
  id:      string;
  email:   string;
  role:    UserRole;
  profile: {
    namaLengkap: string;
    fotoUrl:     string | null;
    nip:         string | null;
    nisn?: string | null;
  };
  // Tersedia saat query dengan showAll=true + tahunAjaranId
  sudahDiKelas?: boolean;
  infoKelas?:    { id: string; namaKelas: string } | null;
}

export interface AbsensiRekap {
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
  totalHadir: number;
  totalIzin: number;
  totalSakit: number;
  totalAlfa: number;
  persentaseKehadiran: number;
}

// ─── Catatan Sikap ───────────────────────────────────────────────────────────
export interface CatatanSikapRekap {
  id: string;
  tanggal: string;
  kategori: 'POSITIF' | 'NEGATIF';
  catatan: string;
  poin?: number;
}

// ─── Prestasi ────────────────────────────────────────────────────────────────
export interface PrestasiItem {
  id: string;
  tanggal: string;
  namaPrestasi: string;
  peringkat: string;
  tingkat: string;
  keterangan?: string;
}

// ─── Nilai Rapor ─────────────────────────────────────────────────────────────
export interface NilaiRapor {
  id: string;
  mapelNama: string;
  kkm: number;
  nilaiPengetahuan: number;
  predikatPengetahuan: string;
  nilaiKeterampilan: number;
  predikatKeterampilan: string;
  catatan?: string;
}
