import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getKelasList,
  getKelasById,
  getKelasStatistik,
  createKelas,
  updateKelas,
  deleteKelas,
  copySiswaKelas,
  prosesAkhirTahun,
  getUsersByRole,
} from "@/lib/api/kelas.api";
import type {
  CreateKelasDto,
  UpdateKelasDto,
  KelasFilterParams,
} from "@/types/kelas.types";

// ─── Query Key Factory ────────────────────────────────────────────────

export const kelasKeys = {
  all: ["kelas"] as const,
  detail: (id: string) => ["kelas", id] as const,
  statistik: (id: string) => ["kelas", id, "statistik"] as const,
  siswa: (id: string) => ["kelas", id, "siswa"] as const,
  siswaHistory: (siswaId: string) =>
    ["kelas", "siswa", siswaId, "history"] as const,
};

// ─── useKelasList ─────────────────────────────────────────────────────────────────────────────────

export function useKelasList(params?: KelasFilterParams, enabled: boolean = true) {
  return useQuery({
    queryKey: [...kelasKeys.all, params],
    queryFn: () => getKelasList(params),
    staleTime: 1000 * 60 * 5,
    enabled: enabled, // <-- Tambahkan baris ini
  });
}
// ─── useKelasById ─────────────────────────────────────────────────────────────────────────────────

export function useKelasById(id: string | null) {
  return useQuery({
    queryKey: kelasKeys.detail(id ?? ""),
    queryFn: () => getKelasById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── useKelasStatistik ────────────────────────────────────────────────────────────────────────────

export function useKelasStatistik(id: string | null) {
  return useQuery({
    queryKey: kelasKeys.statistik(id ?? ""),
    queryFn: () => getKelasStatistik(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

// ─── useWaliKelasList ──────────────────────────────────────────────────────────────────────────────

export function useWaliKelasList() {
  return useQuery({
    queryKey: ["users", "by-role", "GURU"],
    queryFn: () => getUsersByRole("GURU"),
    staleTime: 1000 * 60 * 10,
  });
}

// ─── useCreateKelas ─────────────────────────────────────────────────────────────────────────────────

export function useCreateKelas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateKelasDto) => createKelas(dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: kelasKeys.all });
      // Invalidate cache profil guru yang baru di-assign sebagai wali kelas
      if (data.waliKelasId) {
        qc.invalidateQueries({ queryKey: ["users", data.waliKelasId] });
      }
      toast.success("Kelas berhasil dibuat");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Gagal membuat kelas");
    },
  });
}

// ─── useUpdateKelas ─────────────────────────────────────────────────────────────────────────────────

export function useUpdateKelas(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateKelasDto) => updateKelas(id, dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: kelasKeys.all });
      qc.invalidateQueries({ queryKey: kelasKeys.detail(id) });
      // Invalidate cache profil guru yang di-assign/diganti sebagai wali kelas
      if (data.waliKelasId) {
        qc.invalidateQueries({ queryKey: ["users", data.waliKelasId] });
      }
      toast.success("Kelas berhasil diperbarui");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Gagal memperbarui kelas");
    },
  });
}

// ─── useDeleteKelas ─────────────────────────────────────────────────────────────────────────────────

export function useDeleteKelas(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteKelas(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kelasKeys.all });
      qc.removeQueries({ queryKey: kelasKeys.detail(id) });
      qc.removeQueries({ queryKey: kelasKeys.statistik(id) });
      toast.success("Kelas berhasil dihapus");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Gagal menghapus kelas");
    },
  });
}

// ─── useCopySiswaKelas ────────────────────────────────────────────────────────────────────────────

export function useCopySiswaKelas(kelasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { sourceKelasId: string; tanggalMasuk: string }) =>
      copySiswaKelas(kelasId, body),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: kelasKeys.siswa(kelasId) });
      qc.invalidateQueries({ queryKey: kelasKeys.statistik(kelasId) });
      toast.success(`${data.berhasil} siswa berhasil disalin, ${data.gagal} gagal`);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Gagal menyalin siswa");
    },
  });
}

// ─── useProsesAkhirTahun ──────────────────────────────────────────────────────────────────────────────

export function useProsesAkhirTahun(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateKelasDto) => prosesAkhirTahun(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kelasKeys.all });
      qc.invalidateQueries({ queryKey: kelasKeys.detail(id) });
      qc.invalidateQueries({ queryKey: kelasKeys.statistik(id) });
      qc.invalidateQueries({ queryKey: kelasKeys.siswa(id) });
      toast.success("Proses akhir tahun berhasil dijalankan");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Gagal memproses akhir tahun");
    },
  });
}
