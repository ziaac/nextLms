import os, textwrap

files = {}

# ============================================================
# 1. src/types/kelas.types.ts
# ============================================================
files["src/types/kelas.types.ts"] = textwrap.dedent("""\
    import type { TahunAjaran } from "./tahun-ajaran.types";
    import type { TingkatKelas } from "./akademik.types";
    import type { UserRole } from "./enums";

    // ─── Enums ───────────────────────────────────────────────────────────────────

    export enum StatusSiswa {
      AKTIF = "AKTIF",
      PINDAH = "PINDAH",
      KELUAR = "KELUAR",
      LULUS = "LULUS",
      DO = "DO",
      MENGUNDURKAN_DIRI = "MENGUNDURKAN_DIRI",
    }

    export enum StatusAkhirTahun {
      NAIK_KELAS = "NAIK_KELAS",
      TIDAK_NAIK = "TIDAK_NAIK",
      LULUS = "LULUS",
      DO = "DO",
      MENGUNDURKAN_DIRI = "MENGUNDURKAN_DIRI",
    }

    export enum JenisKelamin {
      L = "L",
      P = "P",
    }

    // ─── Wali Kelas (subset User) ────────────────────────────────────────────────

    export interface WaliKelas {
      id: string;
      profile: {
        namaLengkap: string;
        fotoUrl: string | null;
      };
    }

    // ─── Kelas ───────────────────────────────────────────────────────────────────

    export interface Kelas {
      id: string;
      tahunAjaranId: string;
      tingkatKelasId: string;
      namaKelas: string;
      kodeKelas: string | null;
      waliKelasId: string | null;
      kuotaMaksimal: number;
      ruangan: string | null;
      createdAt: string;
      updatedAt: string;
      tahunAjaran: TahunAjaran;
      tingkatKelas: TingkatKelas;
      waliKelas: WaliKelas | null;
    }

    // ─── Statistik Kelas ─────────────────────────────────────────────────────────

    export interface KelasStatistik {
      totalSiswa: number;
      kuotaMaksimal: number;
      sisaKuota: number;
      berdasarkanStatus: {
        AKTIF: number;
        PINDAH: number;
        KELUAR: number;
        LULUS: number;
        DO: number;
        MENGUNDURKAN_DIRI?: number;
      };
      berdasarkanGender: {
        L: number;
        P: number;
      };
    }

    // ─── DTO Create / Update Kelas ───────────────────────────────────────────────

    export interface CreateKelasDto {
      tahunAjaranId: string;
      tingkatKelasId: string;
      namaKelas: string;
      kodeKelas?: string;
      waliKelasId?: string;
      kuotaMaksimal?: number;
      ruangan?: string;
    }

    export type UpdateKelasDto = Partial<CreateKelasDto>;

    // ─── Filter Query Kelas ──────────────────────────────────────────────────────

    export interface KelasFilterParams {
      tahunAjaranId?: string;
      tingkatKelasId?: string;
      namaKelas?: string;
    }

    // ─── Profil Siswa (subset Profile) ───────────────────────────────────────────

    export interface ProfilSiswa {
      namaLengkap: string;
      nisn: string | null;
      nik: string | null;
      jenisKelamin: JenisKelamin;
      tempatLahir: string;
      tanggalLahir: string;
      agama: string;
      alamat: string | null;
      kecamatan: string | null;
      kabupaten: string | null;
      provinsi: string | null;
      noTelepon: string | null;
      noWa: string | null;
      fotoUrl: string | null;
      namaAyah: string | null;
      pekerjaanAyah: string | null;
      namaIbu: string | null;
      pekerjaanIbu: string | null;
      namaWali: string | null;
      hubunganWali: string | null;
      noTelpWali: string | null;
    }

    // ─── Siswa (subset User) ─────────────────────────────────────────────────────

    export interface SiswaUser {
      id: string;
      email: string;
      isActive: boolean;
      profile: ProfilSiswa;
    }

    // ─── Kelas Siswa ─────────────────────────────────────────────────────────────

    export interface KelasSiswa {
      id: string;
      kelasId: string;
      siswaId: string;
      tahunAjaranId: string;
      nomorAbsen: number | null;
      status: StatusSiswa;
      tanggalMasuk: string;
      tanggalKeluar: string | null;
      alasanKeluar: string | null;
      statusAkhirTahun: StatusAkhirTahun | null;
      catatanAkhirTahun: string | null;
      createdAt: string;
      updatedAt: string;
      siswa: SiswaUser;
    }

    // ─── DTO Tambah Siswa ke Kelas ───────────────────────────────────────────────

    export interface TambahSiswaKeKelasDto {
      siswaId: string;
      tanggalMasuk: string;
      nomorAbsen?: number;
    }

    export interface TambahSiswaBulkItem {
      siswaId: string;
      tanggalMasuk: string;
      nomorAbsen?: number;
    }

    export interface TambahSiswaBulkDto {
      siswa: TambahSiswaBulkItem[];
    }

    // ─── DTO Pindah / Keluar Siswa ───────────────────────────────────────────────

    export interface PindahSiswaDto {
      kelasBaruId: string;
      tanggalPindah: string;
      alasan?: string;
    }

    export interface KeluarSiswaDto {
      tanggalKeluar: string;
      status: Extract<StatusSiswa, StatusSiswa.KELUAR | StatusSiswa.DO | StatusSiswa.MENGUNDURKAN_DIRI>;
      alasan?: string;
    }

    // ─── History Kelas Siswa ─────────────────────────────────────────────────────

    export interface KelasSiswaHistory {
      id: string;
      kelasId: string;
      kelas: Pick<Kelas, "id" | "namaKelas" | "tahunAjaran" | "tingkatKelas">;
      nomorAbsen: number | null;
      status: StatusSiswa;
      tanggalMasuk: string;
      tanggalKeluar: string | null;
      alasanKeluar: string | null;
      statusAkhirTahun: StatusAkhirTahun | null;
    }

    // ─── Statistik Siswa (untuk Slider) ──────────────────────────────────────────

    export interface AbsensiRekap {
      hadir: number;
      sakit: number;
      izin: number;
      alpa: number;
      total: number;
      persentaseHadir: number;
    }

    export interface CatatanSikapItem {
      id: string;
      tanggal: string;
      keterangan: string;
      poin: number;
      jenis: "POSITIF" | "NEGATIF";
    }

    export interface CatatanSikapRekap {
      totalPositif: number;
      totalNegatif: number;
      totalPoin: number;
      riwayat?: CatatanSikapItem[];
    }

    export interface PrestasiItem {
      id: string;
      nama: string;
      tingkat: string;
      peringkat: string;
      tanggal: string;
      keterangan: string | null;
    }

    export interface NilaiRapor {
      mataPelajaran: string;
      nilai: number;
      predikat: string;
    }

    // ─── User by Role (dropdown wali kelas) ─────────────────────────────────────

    export interface UserByRole {
      id: string;
      email: string;
      role: UserRole;
      profile: {
        namaLengkap: string;
        fotoUrl: string | null;
        nip: string | null;
      };
    }
""")

# ============================================================
# 2. src/lib/api/kelas.api.ts
# ============================================================
files["src/lib/api/kelas.api.ts"] = textwrap.dedent("""\
    import { axiosInstance } from "@/lib/axios";
    import type {
      Kelas,
      KelasStatistik,
      KelasFilterParams,
      CreateKelasDto,
      UpdateKelasDto,
      UserByRole,
    } from "@/types/kelas.types";

    const BASE = "/kelas";

    // ─── List Kelas (tanpa pagination) ───────────────────────────────────────────

    export async function getKelasList(
      params?: KelasFilterParams
    ): Promise<{ data: Kelas[] }> {
      const response = await axiosInstance.get<{ data: Kelas[] }>(BASE, {
        params: { limit: 100, ...params },
      });
      return response.data;
    }

    // ─── Detail Kelas ─────────────────────────────────────────────────────────────

    export async function getKelasById(id: string): Promise<Kelas> {
      const response = await axiosInstance.get<Kelas>(`${BASE}/${id}`);
      return response.data;
    }

    // ─── Statistik Kelas ─────────────────────────────────────────────────────────

    export async function getKelasStatistik(id: string): Promise<KelasStatistik> {
      const response = await axiosInstance.get<KelasStatistik>(
        `${BASE}/${id}/statistik`
      );
      return response.data;
    }

    // ─── Create Kelas ─────────────────────────────────────────────────────────────

    export async function createKelas(dto: CreateKelasDto): Promise<Kelas> {
      const response = await axiosInstance.post<Kelas>(BASE, dto);
      return response.data;
    }

    // ─── Update Kelas ─────────────────────────────────────────────────────────────

    export async function updateKelas(
      id: string,
      dto: UpdateKelasDto
    ): Promise<Kelas> {
      const response = await axiosInstance.patch<Kelas>(`${BASE}/${id}`, dto);
      return response.data;
    }

    // ─── Delete Kelas ─────────────────────────────────────────────────────────────

    export async function deleteKelas(id: string): Promise<void> {
      await axiosInstance.delete(`${BASE}/${id}`);
    }

    // ─── Copy Siswa dari Tahun Ajaran Sebelumnya ─────────────────────────────────

    export async function copySiswaKelas(id: string): Promise<{ count: number }> {
      const response = await axiosInstance.post<{ count: number }>(
        `${BASE}/${id}/copy-siswa`
      );
      return response.data;
    }

    // ─── Proses Akhir Tahun ──────────────────────────────────────────────────────

    export async function prosesAkhirTahun(
      id: string,
      dto: UpdateKelasDto
    ): Promise<Kelas> {
      const response = await axiosInstance.patch<Kelas>(
        `${BASE}/${id}/proses-akhir-tahun`,
        dto
      );
      return response.data;
    }

    // ─── Users by Role (dropdown wali kelas) ─────────────────────────────────────

    export async function getUsersByRole(role: string): Promise<UserByRole[]> {
      const response = await axiosInstance.get<UserByRole[]>(
        `/users/by-role/${role}`
      );
      return response.data;
    }
""")

# ============================================================
# 3. src/lib/api/kelas-siswa.api.ts
# ============================================================
files["src/lib/api/kelas-siswa.api.ts"] = textwrap.dedent("""\
    import { axiosInstance } from "@/lib/axios";
    import type {
      KelasSiswa,
      KelasSiswaHistory,
      TambahSiswaKeKelasDto,
      TambahSiswaBulkDto,
      PindahSiswaDto,
      KeluarSiswaDto,
      AbsensiRekap,
      CatatanSikapRekap,
      PrestasiItem,
      NilaiRapor,
    } from "@/types/kelas.types";

    const BASE = "/kelas";

    // ─── List Siswa di Kelas (tanpa pagination) ───────────────────────────────────

    export async function getSiswaByKelas(
      kelasId: string
    ): Promise<{ data: KelasSiswa[] }> {
      const response = await axiosInstance.get<{ data: KelasSiswa[] }>(
        `${BASE}/${kelasId}/siswa`
      );
      return response.data;
    }

    // ─── Tambah Siswa ke Kelas (single) ──────────────────────────────────────────

    export async function tambahSiswaKeKelas(
      kelasId: string,
      dto: TambahSiswaKeKelasDto
    ): Promise<KelasSiswa> {
      const response = await axiosInstance.post<KelasSiswa>(
        `${BASE}/${kelasId}/siswa`,
        dto
      );
      return response.data;
    }

    // ─── Tambah Siswa Bulk ────────────────────────────────────────────────────────

    export async function tambahSiswaBulk(
      kelasId: string,
      dto: TambahSiswaBulkDto
    ): Promise<{ count: number; data: KelasSiswa[] }> {
      const response = await axiosInstance.post<{
        count: number;
        data: KelasSiswa[];
      }>(`${BASE}/${kelasId}/siswa/bulk`, dto);
      return response.data;
    }

    // ─── Pindah Siswa ke Kelas Lain ──────────────────────────────────────────────

    export async function pindahSiswa(
      kelasId: string,
      siswaId: string,
      dto: PindahSiswaDto
    ): Promise<KelasSiswa> {
      const response = await axiosInstance.patch<KelasSiswa>(
        `${BASE}/${kelasId}/siswa/${siswaId}/pindah`,
        dto
      );
      return response.data;
    }

    // ─── Keluarkan Siswa dari Kelas ───────────────────────────────────────────────

    export async function keluarkanSiswa(
      kelasId: string,
      siswaId: string,
      dto: KeluarSiswaDto
    ): Promise<KelasSiswa> {
      const response = await axiosInstance.patch<KelasSiswa>(
        `${BASE}/${kelasId}/siswa/${siswaId}/keluar`,
        dto
      );
      return response.data;
    }

    // ─── History Kelas Siswa ──────────────────────────────────────────────────────

    export async function getKelasSiswaHistory(
      siswaId: string
    ): Promise<{ data: KelasSiswaHistory[] }> {
      const response = await axiosInstance.get<{ data: KelasSiswaHistory[] }>(
        `${BASE}/siswa/${siswaId}/history`
      );
      return response.data;
    }

    // ─── Statistik Siswa (untuk Slider Profil) ────────────────────────────────────

    export async function getAbsensiRekapSiswa(
      siswaId: string
    ): Promise<AbsensiRekap> {
      const response = await axiosInstance.get<AbsensiRekap>(
        `/absensi/rekap/siswa/${siswaId}`
      );
      return response.data;
    }

    export async function getCatatanSikapRekap(
      siswaId: string
    ): Promise<CatatanSikapRekap> {
      const response = await axiosInstance.get<CatatanSikapRekap>(
        `/catatan-sikap/rekap/${siswaId}`
      );
      return response.data;
    }

    export async function getPrestasiSiswa(
      siswaId: string
    ): Promise<{ data: PrestasiItem[] }> {
      const response = await axiosInstance.get<{ data: PrestasiItem[] }>(
        `/prestasi`,
        { params: { siswaId } }
      );
      return response.data;
    }

    export async function getNilaiRaporSiswa(
      siswaId: string
    ): Promise<{ data: NilaiRapor[] }> {
      const response = await axiosInstance.get<{ data: NilaiRapor[] }>(
        `/penilaian/rapor/${siswaId}`
      );
      return response.data;
    }
""")

# ─── Writer ───────────────────────────────────────────────────────────────────

def write_files(base_dir: str = ".") -> None:
    for rel_path, content in files.items():
        full_path = os.path.join(base_dir, rel_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  {rel_path}")

if __name__ == "__main__":
    import sys
    base = sys.argv[1] if len(sys.argv) > 1 else "."
    write_files(base)
    print("\nBatch 1 selesai - Types + API Layer (3 files)")