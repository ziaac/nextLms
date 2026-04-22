import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { masterJamApi } from '@/lib/api/master-jam.api'
import type {
  CreateMasterJamPayload,
  UpdateMasterJamPayload,
  FilterMasterJamParams,
  TipeHari,
} from '@/types/master-jam.types'

// ── Query Keys ────────────────────────────────────────────────
export const masterJamKeys = {
  all:       (f?: FilterMasterJamParams) => ['master-jam', f ?? {}] as const,
  detail:    (id: string)                => ['master-jam', id] as const,
  byTingkat: (tingkatKelasId: string, tipeHari?: TipeHari) =>
    ['master-jam', 'by-tingkat', tingkatKelasId, tipeHari ?? 'all'] as const,
}

/** Semua master jam dengan filter opsional */
export function useMasterJamList(filter?: FilterMasterJamParams) {
  return useQuery({
    queryKey: masterJamKeys.all(filter),
    queryFn:  () => masterJamApi.getAll(filter),
    staleTime: 1000 * 60 * 10,
  })
}

/**
 * Master jam per tingkat + tipeHari.
 * Dipakai di form buat-jadwal untuk dropdown sesi.
 * tipeHari ditentukan otomatis dari hari yang dipilih:
 *   JUMAT -> tipeHari: JUMAT | REGULER (backend return yang sesuai)
 *   lainnya -> tipeHari: REGULER
 */
export function useMasterJamByTingkat(
  tingkatKelasId: string | null,
  tipeHari: TipeHari | null,
) {
  return useQuery({
    queryKey: masterJamKeys.byTingkat(tingkatKelasId ?? '', tipeHari ?? undefined),
    queryFn:  () => masterJamApi.getAll({
      tingkatKelasId: tingkatKelasId!,
      tipeHari:       tipeHari!,
    }),
    enabled:   !!tingkatKelasId && !!tipeHari,
    staleTime: 1000 * 60 * 10,
  })
}

/** Detail satu master jam */
export function useMasterJamById(id: string | null) {
  return useQuery({
    queryKey: masterJamKeys.detail(id ?? ''),
    queryFn:  () => masterJamApi.getById(id!),
    enabled:  !!id,
    staleTime: 1000 * 60 * 10,
  })
}

/** Buat master jam */
export function useCreateMasterJam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMasterJamPayload) => masterJamApi.create(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['master-jam'] }),
  })
}

/** Update master jam */
export function useUpdateMasterJam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMasterJamPayload }) =>
      masterJamApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master-jam'] }),
  })
}

/** Hapus master jam */
export function useDeleteMasterJam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => masterJamApi.remove(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['master-jam'] }),
  })
}
