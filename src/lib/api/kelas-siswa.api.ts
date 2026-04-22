import api from "@/lib/axios";
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

export async function getSiswaByKelas(kelasId: string): Promise<KelasSiswa[]> {
  const response = await api.get<KelasSiswa[]>(`${BASE}/${kelasId}/siswa`);
  return response.data;
}

export async function tambahSiswaKeKelas(
  kelasId: string,
  dto: TambahSiswaKeKelasDto
): Promise<KelasSiswa> {
  const response = await api.post<KelasSiswa>(`${BASE}/${kelasId}/siswa`, dto);
  return response.data;
}

export async function tambahSiswaBulk(
  kelasId: string,
  dto: TambahSiswaBulkDto
): Promise<{ total: number; berhasil: number; gagal: number; detail: { siswaId: string; status: string; id?: string; reason?: string }[] }> {
  const response = await api.post<{
    total: number;
    berhasil: number;
    gagal: number;
    detail: { siswaId: string; status: string; id?: string; reason?: string }[];
  }>(`${BASE}/${kelasId}/siswa/bulk`, dto);
  return response.data;
}

export async function pindahSiswa(
  kelasId: string,
  siswaId: string,
  dto: PindahSiswaDto
): Promise<KelasSiswa> {
  const response = await api.patch<KelasSiswa>(
    `${BASE}/${kelasId}/siswa/${siswaId}/pindah`,
    dto
  );
  return response.data;
}

export async function keluarkanSiswa(
  kelasId: string,
  siswaId: string,
  dto: KeluarSiswaDto
): Promise<KelasSiswa> {
  const response = await api.patch<KelasSiswa>(
    `${BASE}/${kelasId}/siswa/${siswaId}/keluar`,
    dto
  );
  return response.data;
}

export async function getKelasSiswaHistory(
  siswaId: string
): Promise<KelasSiswaHistory[]> {
  const response = await api.get<KelasSiswaHistory[]>(
    `${BASE}/siswa/${siswaId}/history`
  );
  return response.data;
}

export async function getAbsensiRekapSiswa(siswaId: string): Promise<AbsensiRekap> {
  const response = await api.get<AbsensiRekap>(`/absensi/rekap/siswa/${siswaId}`);
  return response.data;
}

export async function getCatatanSikapRekap(siswaId: string): Promise<CatatanSikapRekap> {
  const response = await api.get<CatatanSikapRekap>(`/catatan-sikap/rekap/${siswaId}`);
  return response.data;
}

export async function getPrestasiSiswa(siswaId: string): Promise<{ data: PrestasiItem[] }> {
  const response = await api.get<{ data: PrestasiItem[] }>(`/prestasi`, {
    params: { siswaId },
  });
  return response.data;
}

export async function getNilaiRaporSiswa(siswaId: string): Promise<{ data: NilaiRapor[] }> {
  const response = await api.get<{ data: NilaiRapor[] }>(`/penilaian/rapor/${siswaId}`);
  return response.data;
}

export async function updateNomorAbsen(
  kelasId: string,
  siswaId: string,
  nomorAbsen: number
): Promise<{ message: string; data: KelasSiswa }> {
  const response = await api.patch<{ message: string; data: KelasSiswa }>(
    `${BASE}/${kelasId}/siswa/${siswaId}/absen`,
    { nomorAbsen }
  );
  return response.data;
}

export async function generateNomorAbsen(
  kelasId: string
): Promise<{ message: string; count: number }> {
  const response = await api.post<{ message: string; count: number }>(
    `${BASE}/${kelasId}/siswa/generate-absen`
  );
  return response.data;
}

export interface ExportBiodataSiswaResponse {
  'No.': number;
  'Nomor Absen': number | string;
  'Nama Lengkap': string;
  'NISN': string;
  'NIK': string;
  'L/P': string;
  'Tempat Lahir': string;
  'Tanggal Lahir': string;
  'Agama': string;
  'Alamat Lengkap': string;
  'Email Siswa': string;
  'No. WhatsApp': string;
  'Tanggal Masuk Kelas': string;
  'Nama Ayah': string;
  'Pekerjaan Ayah': string;
  'Nama Ibu': string;
  'Pekerjaan Ibu': string;
  'Nama Wali': string;
}

export async function exportSiswaKelas(
  kelasId: string
): Promise<ExportBiodataSiswaResponse[]> {
  const response = await api.get<ExportBiodataSiswaResponse[]>(
    `${BASE}/${kelasId}/siswa/export`
  );
  return response.data;
}

export async function getKelasSiswaDetail(
  kelasId: string,
  siswaId: string
): Promise<KelasSiswa> {
  const response = await api.get<KelasSiswa>(`${BASE}/${kelasId}/siswa/${siswaId}`);
  return response.data;
}

export async function updateStatusAkhirTahun(
  kelasId: string,
  siswaId: string,
  dto: { statusAkhirTahun: string; catatanAkhirTahun?: string }
): Promise<KelasSiswa> {
  const response = await api.patch<KelasSiswa>(
    `${BASE}/${kelasId}/siswa/${siswaId}/status-akhir-tahun`,
    dto
  );
  return response.data;
}
