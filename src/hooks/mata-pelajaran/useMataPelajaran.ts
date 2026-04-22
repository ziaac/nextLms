import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { masterMapelApi }   from '@/lib/api/master-mapel.api'
import { mataPelajaranApi } from '@/lib/api/mata-pelajaran.api'
import { mapelTingkatApi }  from '@/lib/api/mapel-tingkat.api'
import { usersApi }         from '@/lib/api/users.api'
import type {
  CreateMasterMapelPayload,
  UpdateMasterMapelPayload,
  FilterMasterMapelParams,
  CreateMataPelajaranPayload,
  UpdateMataPelajaranPayload,
  FilterMataPelajaranParams,
  CreateMapelTingkatPayload,
  SetGuruPoolPayload,
  BulkPerKelasPreviewPayload,
  BulkPerKelasPreviewResponse,
  BulkPerKelasExecutePayload,
  BulkPerKelasExecuteResponse,
} from '@/types/akademik.types'

// ── Query Keys ────────────────────────────────────────────────
export const masterMapelKeys = {
  all:    (f?: FilterMasterMapelParams) => ['master-mapel', f ?? {}] as const,
  detail: (id: string) => ['master-mapel', id] as const,
}

export const mapelTingkatKeys = {
  byTingkat:     (id: string) => ['mapel-tingkat', 'by-tingkat', id] as const,
  byMasterMapel: (id: string) => ['mapel-tingkat', 'by-master', id] as const,
}

export const mataPelajaranKeys = {
  all:    (f?: FilterMataPelajaranParams) => ['mata-pelajaran', f ?? {}] as const,
  detail: (id: string) => ['mata-pelajaran', id] as const,
}

export const guruKeys = {
  all: ['guru-list'] as const,
}

// ── Master Mapel Queries ──────────────────────────────────────
export function useMasterMapelList(filter?: FilterMasterMapelParams) {
  return useQuery({
    queryKey: masterMapelKeys.all(filter),
    queryFn:  () => masterMapelApi.getAll(filter),
    staleTime: 1000 * 60 * 10,
  })
}

export function useCreateMasterMapel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMasterMapelPayload) => masterMapelApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master-mapel'] }),
  })
}

export function useUpdateMasterMapel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMasterMapelPayload }) =>
      masterMapelApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master-mapel'] }),
  })
}

export function useDeleteMasterMapel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => masterMapelApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master-mapel'] }),
  })
}

// ── MapelTingkat Queries ──────────────────────────────────────
export function useMapelTingkatByTingkat(tingkatKelasId: string | null) {
  return useQuery({
    queryKey: mapelTingkatKeys.byTingkat(tingkatKelasId ?? ''),
    queryFn:  () => mapelTingkatApi.getByTingkat(tingkatKelasId!),
    enabled:  !!tingkatKelasId,
    staleTime: 1000 * 60 * 3,
  })
}

export function useCreateMapelTingkat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMapelTingkatPayload) => mapelTingkatApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mapel-tingkat'] }),
  })
}

export function useDeleteMapelTingkat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mapelTingkatApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mapel-tingkat'] }),
  })
}

// ── Guru Pool ─────────────────────────────────────────────────
export function useGuruList() {
  return useQuery({
    queryKey: guruKeys.all,
    queryFn:  () => usersApi.getByRole('GURU'),
    staleTime: 1000 * 60 * 10,
  })
}

export function useAddGuru() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, guruId }: { id: string; guruId: string }) =>
      mapelTingkatApi.addGuru(id, guruId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mapel-tingkat'] }),
  })
}

export function useRemoveGuru() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, guruId }: { id: string; guruId: string }) =>
      mapelTingkatApi.removeGuru(id, guruId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mapel-tingkat'] }),
  })
}

export function useSetGuruPool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SetGuruPoolPayload }) =>
      mapelTingkatApi.setGuruPool(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mapel-tingkat'] }),
  })
}

// ── MataPelajaran (sesi aktif) ────────────────────────────────
export function useMataPelajaranList(
  filter?: FilterMataPelajaranParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: mataPelajaranKeys.all(filter),
    queryFn:  () => mataPelajaranApi.getAll(filter),
    enabled: options?.enabled ?? true, // Tahan fetching jika di-set false
  })
}

export function useCreateMataPelajaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMataPelajaranPayload) => mataPelajaranApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mata-pelajaran'] }),
  })
}

export function useUpdateMataPelajaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMataPelajaranPayload }) =>
      mataPelajaranApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mata-pelajaran'] }),
  })
}

export function useToggleMataPelajaranActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mataPelajaranApi.toggleActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mata-pelajaran'] }),
  })
}

export function useDeleteMataPelajaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mataPelajaranApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mata-pelajaran'] }),
  })
}


// Tambahkan fungsi yang benar-benar hilang ini:
export function useMapelTingkatByMapel(mataPelajaranId: string | null) {
  return useQuery({
    queryKey: mapelTingkatKeys.byMasterMapel(mataPelajaranId ?? ''),
    queryFn:  () => mapelTingkatApi.getByMasterMapel(mataPelajaranId!), // Pastikan API ini ada di mapel-tingkat.api.ts
    enabled:  !!mataPelajaranId,
  })
}

// Ubah nama useCreateMapelTingkat menjadi:
export function useAssignMapelTingkat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMapelTingkatPayload) => mapelTingkatApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mapel-tingkat'] }),
  })
}

// Ubah nama useDeleteMapelTingkat menjadi:
export function useRemoveMapelTingkat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mapelTingkatApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mapel-tingkat'] }),
  })
}
// ── Bulk Per Kelas ────────────────────────────────────────────
export function useBulkPerKelasPreview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: BulkPerKelasPreviewPayload): Promise<BulkPerKelasPreviewResponse> =>
      mataPelajaranApi.bulkPerKelasPreview(payload),
  })
}

export function useBulkPerKelasExecute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: BulkPerKelasExecutePayload): Promise<BulkPerKelasExecuteResponse> =>
      mataPelajaranApi.bulkPerKelasExecute(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mata-pelajaran'] }),
  })
}
