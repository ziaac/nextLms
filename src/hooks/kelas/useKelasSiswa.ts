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
  updateNomorAbsen,
  generateNomorAbsen,
  updateStatusAkhirTahun,
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
    onSuccess: (_data, dto) => {
      qc.invalidateQueries({ queryKey: kelasKeys.siswa(kelasId) });
      qc.invalidateQueries({ queryKey: kelasKeys.statistik(kelasId) });
      
      // Invalidate UI Profil Siswa
      if (dto.siswaId) {
        qc.invalidateQueries({ queryKey: ["users", dto.siswaId] });
      }
      
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
    onSuccess: (data, dto) => {
      qc.invalidateQueries({ queryKey: kelasKeys.siswa(kelasId) });
      qc.invalidateQueries({ queryKey: kelasKeys.statistik(kelasId) });
      
      // Invalidate UI Profil Siswa (Strict Typed berdasarkan DTO aslinya)
      if (dto.siswa && Array.isArray(dto.siswa)) {
        dto.siswa.forEach((item) => {
          if (item.siswaId) {
            qc.invalidateQueries({ queryKey: ["users", item.siswaId] });
          }
        });
      }
      
      toast.success(`${data.total ?? 'Beberapa'} siswa berhasil ditambahkan ke kelas`);
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
    onSuccess: (_data, { siswaId, dto }) => {
      // Invalidate kelas lama
      qc.invalidateQueries({ queryKey: kelasKeys.siswa(kelasIdLama) });
      qc.invalidateQueries({ queryKey: kelasKeys.statistik(kelasIdLama) });
      
      // Invalidate kelas baru (tujuan)
      qc.invalidateQueries({ queryKey: kelasKeys.siswa(dto.kelasBaruId) });
      qc.invalidateQueries({ queryKey: kelasKeys.statistik(dto.kelasBaruId) });
      
      // Invalidate UI Profil Siswa agar merefleksikan kelas barunya
      qc.invalidateQueries({ queryKey: ["users", siswaId] });
      
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
      qc.invalidateQueries({ queryKey: kelasKeys.siswaHistory(siswaId) });
      
      // Invalidate UI Profil Siswa agar kelasnya menjadi kosong
      qc.invalidateQueries({ queryKey: ["users", siswaId] });
      
      toast.success("Siswa berhasil dikeluarkan dari kelas");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Gagal mengeluarkan siswa");
    },
  });
}
// ─── useUpdateNomorAbsen ───────────────────────────────────────────────────────────────────────────────

export function useUpdateNomorAbsen(kelasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ siswaId, nomorAbsen }: { siswaId: string; nomorAbsen: number }) =>
      updateNomorAbsen(kelasId, siswaId, nomorAbsen),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kelasKeys.siswa(kelasId) });
      toast.success("Nomor absen berhasil diperbarui");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Gagal memperbarui nomor absen");
    },
  });
}

export function useGenerateNomorAbsen(kelasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => generateNomorAbsen(kelasId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: kelasKeys.siswa(kelasId) });
      toast.success(`Nomor absen ${data.count} siswa berhasil di-generate (urutan A-Z)`);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Gagal generate nomor absen");
    },
  });
}

// ─── useUpdateStatusAkhirTahun ────────────────────────────────────────────────────────────────────────

export function useUpdateStatusAkhirTahun(kelasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      siswaId,
      statusAkhirTahun,
      catatanAkhirTahun,
    }: {
      siswaId: string;
      statusAkhirTahun: string;
      catatanAkhirTahun?: string;
    }) => updateStatusAkhirTahun(kelasId, siswaId, { statusAkhirTahun, catatanAkhirTahun }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kelasKeys.siswa(kelasId) });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Gagal memperbarui status akhir tahun");
    },
  });
}
