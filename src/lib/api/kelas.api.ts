import api from "@/lib/axios";
import type {
  Kelas,
  KelasStatistik,
  KelasFilterParams,
  CreateKelasDto,
  UpdateKelasDto,
  UserByRole,
} from "@/types/kelas.types";

const BASE = "/kelas";

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getKelasList(params?: KelasFilterParams): Promise<Kelas[]> {
  const response = await api.get<Kelas[]>(BASE, { params: { ...params } });
  return response.data ?? [];
}

export async function getKelasById(id: string): Promise<Kelas> {
  const response = await api.get<Kelas>(`${BASE}/${id}`);
  return response.data;
}

export async function getKelasStatistik(id: string): Promise<KelasStatistik> {
  const response = await api.get<KelasStatistik>(`${BASE}/${id}/statistik`);
  return response.data;
}

export async function createKelas(dto: CreateKelasDto): Promise<Kelas> {
  const response = await api.post<Kelas>(BASE, dto);
  return response.data;
}

export async function updateKelas(id: string, dto: UpdateKelasDto): Promise<Kelas> {
  const response = await api.patch<Kelas>(`${BASE}/${id}`, dto);
  return response.data;
}

export async function deleteKelas(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

export async function copySiswaKelas(
  id: string,
  body: { sourceKelasId: string; tanggalMasuk: string },
): Promise<{ message: string; berhasil: number; gagal: number; total: number }> {
  const response = await api.post(`${BASE}/${id}/copy-siswa`, body);
  return response.data;
}

export async function prosesAkhirTahun(id: string, dto: UpdateKelasDto): Promise<Kelas> {
  const response = await api.patch<Kelas>(`${BASE}/${id}/proses-akhir-tahun`, dto);
  return response.data;
}

export async function getUsersByRole(role: string): Promise<UserByRole[]> {
  const response = await api.get<UserByRole[]>(`/users/by-role/${role}`);
  return response.data;
}
