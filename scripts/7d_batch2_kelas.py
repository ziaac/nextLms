import os, textwrap

files = {}

# ============================================================
# 1. src/hooks/kelas/useKelas.ts
# ============================================================
files["src/hooks/kelas/useKelas.ts"] = textwrap.dedent("""\
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

    // ─── Query Key Factory ────────────────────────────────────────────────────────

    export const kelasKeys = {
      all: ["kelas"] as const,
      detail: (id: string) => ["kelas", id] as const,
      statistik: (id: string) => ["kelas", id, "statistik"] as const,
      siswa: (id: string) => ["kelas", id, "siswa"] as const,
      siswaHistory: (siswaId: string) =>
        ["kelas", "siswa", siswaId, "history"] as const,
    };

    // ─── useKelasList ─────────────────────────────────────────────────────────────

    export function useKelasList(params?: KelasFilterParams) {
      return useQuery({
        queryKey: [...kelasKeys.all, params],
        queryFn: () => getKelasList(params),
        staleTime: 1000 * 60 * 5,
      });
    }

    // ─── useKelasById ─────────────────────────────────────────────────────────────

    export function useKelasById(id: string | null) {
      return useQuery({
        queryKey: kelasKeys.detail(id ?? ""),
        queryFn: () => getKelasById(id!),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
      });
    }

    // ─── useKelasStatistik ────────────────────────────────────────────────────────

    export function useKelasStatistik(id: string | null) {
      return useQuery({
        queryKey: kelasKeys.statistik(id ?? ""),
        queryFn: () => getKelasStatistik(id!),
        enabled: !!id,
        staleTime: 1000 * 60 * 2,
      });
    }

    // ─── useWaliKelasList (dropdown guru/wali kelas) ──────────────────────────────

    export function useWaliKelasList() {
      return useQuery({
        queryKey: ["users", "by-role", "GURU"],
        queryFn: () => getUsersByRole("GURU"),
        staleTime: 1000 * 60 * 10,
      });
    }

    // ─── useCreateKelas ───────────────────────────────────────────────────────────

    export function useCreateKelas() {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (dto: CreateKelasDto) => createKelas(dto),
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: kelasKeys.all });
          toast.success("Kelas berhasil dibuat");
        },
        onError: (err: Error) => {
          toast.error(err.message ?? "Gagal membuat kelas");
        },
      });
    }

    // ─── useUpdateKelas ───────────────────────────────────────────────────────────

    export function useUpdateKelas(id: string) {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (dto: UpdateKelasDto) => updateKelas(id, dto),
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: kelasKeys.all });
          qc.invalidateQueries({ queryKey: kelasKeys.detail(id) });
          toast.success("Kelas berhasil diperbarui");
        },
        onError: (err: Error) => {
          toast.error(err.message ?? "Gagal memperbarui kelas");
        },
      });
    }

    // ─── useDeleteKelas ───────────────────────────────────────────────────────────

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

    // ─── useCopySiswaKelas ────────────────────────────────────────────────────────

    export function useCopySiswaKelas(kelasId: string) {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: () => copySiswaKelas(kelasId),
        onSuccess: (data) => {
          qc.invalidateQueries({ queryKey: kelasKeys.siswa(kelasId) });
          qc.invalidateQueries({ queryKey: kelasKeys.statistik(kelasId) });
          toast.success(`${data.count} siswa berhasil disalin dari tahun ajaran sebelumnya`);
        },
        onError: (err: Error) => {
          toast.error(err.message ?? "Gagal menyalin siswa");
        },
      });
    }

    // ─── useProsesAkhirTahun ──────────────────────────────────────────────────────

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
""")

# ============================================================
# 2. src/hooks/kelas/useKelasSiswa.ts
# ============================================================
files["src/hooks/kelas/useKelasSiswa.ts"] = textwrap.dedent("""\
    import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
    import { toast } from "sonner";
    import {
      getSiswaByKelas,
      tambahSiswaKeKelas,
      tambahSiswaBulk,
      pindahSiswa,
      keluarkanSiswa,
      getKelasSiswaHistory,
      getAbsensiRekapSiswa,
      getCatatanSikapRekap,
      getPrestasiSiswa,
      getNilaiRaporSiswa,
    } from "@/lib/api/kelas-siswa.api";
    import type {
      TambahSiswaKeKelasDto,
      TambahSiswaBulkDto,
      PindahSiswaDto,
      KeluarSiswaDto,
    } from "@/types/kelas.types";
    import { kelasKeys } from "./useKelas";

    // ─── useSiswaByKelas ──────────────────────────────────────────────────────────

    export function useSiswaByKelas(kelasId: string | null) {
      return useQuery({
        queryKey: kelasKeys.siswa(kelasId ?? ""),
        queryFn: () => getSiswaByKelas(kelasId!),
        enabled: !!kelasId,
        staleTime: 1000 * 60 * 3,
      });
    }

    // ─── useKelasSiswaHistory ─────────────────────────────────────────────────────

    export function useKelasSiswaHistory(siswaId: string | null) {
      return useQuery({
        queryKey: kelasKeys.siswaHistory(siswaId ?? ""),
        queryFn: () => getKelasSiswaHistory(siswaId!),
        enabled: !!siswaId,
        staleTime: 1000 * 60 * 5,
      });
    }

    // ─── Statistik Siswa (Slider) ─────────────────────────────────────────────────

    export function useAbsensiRekapSiswa(siswaId: string | null) {
      return useQuery({
        queryKey: ["absensi", "rekap", siswaId],
        queryFn: () => getAbsensiRekapSiswa(siswaId!),
        enabled: !!siswaId,
        staleTime: 1000 * 60 * 5,
      });
    }

    export function useCatatanSikapRekap(siswaId: string | null) {
      return useQuery({
        queryKey: ["catatan-sikap", "rekap", siswaId],
        queryFn: () => getCatatanSikapRekap(siswaId!),
        enabled: !!siswaId,
        staleTime: 1000 * 60 * 5,
      });
    }

    export function usePrestasiSiswa(siswaId: string | null) {
      return useQuery({
        queryKey: ["prestasi", siswaId],
        queryFn: () => getPrestasiSiswa(siswaId!),
        enabled: !!siswaId,
        staleTime: 1000 * 60 * 5,
      });
    }

    export function useNilaiRaporSiswa(siswaId: string | null) {
      return useQuery({
        queryKey: ["penilaian", "rapor", siswaId],
        queryFn: () => getNilaiRaporSiswa(siswaId!),
        enabled: !!siswaId,
        staleTime: 1000 * 60 * 5,
      });
    }

    // ─── useTambahSiswa ───────────────────────────────────────────────────────────

    export function useTambahSiswa(kelasId: string) {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (dto: TambahSiswaKeKelasDto) =>
          tambahSiswaKeKelas(kelasId, dto),
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: kelasKeys.siswa(kelasId) });
          qc.invalidateQueries({ queryKey: kelasKeys.statistik(kelasId) });
          toast.success("Siswa berhasil ditambahkan ke kelas");
        },
        onError: (err: Error) => {
          toast.error(err.message ?? "Gagal menambahkan siswa");
        },
      });
    }

    // ─── useTambahSiswaBulk ───────────────────────────────────────────────────────

    export function useTambahSiswaBulk(kelasId: string) {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (dto: TambahSiswaBulkDto) =>
          tambahSiswaBulk(kelasId, dto),
        onSuccess: (data) => {
          qc.invalidateQueries({ queryKey: kelasKeys.siswa(kelasId) });
          qc.invalidateQueries({ queryKey: kelasKeys.statistik(kelasId) });
          toast.success(`${data.count} siswa berhasil ditambahkan ke kelas`);
        },
        onError: (err: Error) => {
          toast.error(err.message ?? "Gagal menambahkan siswa secara bulk");
        },
      });
    }

    // ─── usePindahSiswa ───────────────────────────────────────────────────────────

    export function usePindahSiswa(kelasIdLama: string) {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: ({
          siswaId,
          dto,
        }: {
          siswaId: string;
          dto: PindahSiswaDto;
        }) => pindahSiswa(kelasIdLama, siswaId, dto),
        onSuccess: (_data, { dto }) => {
          // Invalidate kelas lama
          qc.invalidateQueries({ queryKey: kelasKeys.siswa(kelasIdLama) });
          qc.invalidateQueries({ queryKey: kelasKeys.statistik(kelasIdLama) });
          // Invalidate kelas baru (tujuan)
          qc.invalidateQueries({ queryKey: kelasKeys.siswa(dto.kelasBaruId) });
          qc.invalidateQueries({
            queryKey: kelasKeys.statistik(dto.kelasBaruId),
          });
          toast.success("Siswa berhasil dipindahkan ke kelas lain");
        },
        onError: (err: Error) => {
          toast.error(err.message ?? "Gagal memindahkan siswa");
        },
      });
    }

    // ─── useKeluarkanSiswa ────────────────────────────────────────────────────────

    export function useKeluarkanSiswa(kelasId: string) {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: ({
          siswaId,
          dto,
        }: {
          siswaId: string;
          dto: KeluarSiswaDto;
        }) => keluarkanSiswa(kelasId, siswaId, dto),
        onSuccess: (_data, { siswaId }) => {
          qc.invalidateQueries({ queryKey: kelasKeys.siswa(kelasId) });
          qc.invalidateQueries({ queryKey: kelasKeys.statistik(kelasId) });
          qc.invalidateQueries({
            queryKey: kelasKeys.siswaHistory(siswaId),
          });
          toast.success("Siswa berhasil dikeluarkan dari kelas");
        },
        onError: (err: Error) => {
          toast.error(err.message ?? "Gagal mengeluarkan siswa");
        },
      });
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
    print("\nBatch 2 selesai - Hooks (2 files)")