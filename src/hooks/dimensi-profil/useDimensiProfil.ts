import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getMasterDimensi,
  getDimensiByMapelTingkat,
  setDimensiMapelTingkat,
  getPenilaianGrid,
  bulkUpsertPenilaian,
  getRingkasanDimensiSiswa,
  createDimensi,
  updateDimensi,
  deleteDimensi,
  createSubDimensi,
  updateSubDimensi,
  deleteSubDimensi,
} from '@/lib/api/dimensi-profil.api'
import type {
  BulkUpsertPayload,
  CreateDimensiPayload,
  UpdateDimensiPayload,
  CreateSubDimensiPayload,
  UpdateSubDimensiPayload,
} from '@/types/dimensi-profil.types'

// ── Keys ────────────────────────────────────────────────────────────

export const DIMENSI_KEYS = {
  master:          ['dimensi-profil', 'master']                          as const,
  byMapelTingkat:  (id: string) => ['dimensi-profil', 'mpt', id]        as const,
  penilaianGrid:   (id: string) => ['dimensi-profil', 'grid', id]       as const,
  ringkasanSiswa:  (siswaId: string, semId: string) =>
    ['dimensi-profil', 'siswa', siswaId, semId]                          as const,
}

// ── Master dimensi (semua sub-dimensi) ──────────────────────────────
export function useMasterDimensi() {
  return useQuery({
    queryKey: DIMENSI_KEYS.master,
    queryFn:  getMasterDimensi,
    staleTime: 1000 * 60 * 60, // 1 jam — data seed jarang berubah
  })
}

// ── Sub-dimensi yang dipilih untuk sebuah MataPelajaranTingkat ──────
export function useDimensiByMapelTingkat(mataPelajaranTingkatId: string | null) {
  return useQuery({
    queryKey: DIMENSI_KEYS.byMapelTingkat(mataPelajaranTingkatId ?? ''),
    queryFn:  () => getDimensiByMapelTingkat(mataPelajaranTingkatId!),
    enabled:  !!mataPelajaranTingkatId,
  })
}

// ── Manajemen: set sub-dimensi ────────────────────────────────────
export function useSetDimensiMapelTingkat(mataPelajaranTingkatId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (subDimensiIds: string[]) =>
      setDimensiMapelTingkat(mataPelajaranTingkatId, subDimensiIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: DIMENSI_KEYS.byMapelTingkat(mataPelajaranTingkatId) })
    },
  })
}

// ── Guru: grid penilaian ──────────────────────────────────────────
export function usePenilaianGrid(mataPelajaranId: string | null) {
  return useQuery({
    queryKey: DIMENSI_KEYS.penilaianGrid(mataPelajaranId ?? ''),
    queryFn:  () => getPenilaianGrid(mataPelajaranId!),
    enabled:  !!mataPelajaranId,
  })
}

// ── Guru: simpan penilaian ────────────────────────────────────────
export function useBulkUpsertPenilaian(mataPelajaranId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: BulkUpsertPayload) =>
      bulkUpsertPenilaian(mataPelajaranId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: DIMENSI_KEYS.penilaianGrid(mataPelajaranId) })
    },
  })
}

// ── Admin CRUD: Dimensi ───────────────────────────────────────────
export function useCreateDimensi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDimensiPayload) => createDimensi(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: DIMENSI_KEYS.master }),
  })
}
export function useUpdateDimensi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDimensiPayload }) =>
      updateDimensi(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: DIMENSI_KEYS.master }),
  })
}
export function useDeleteDimensi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDimensi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: DIMENSI_KEYS.master }),
  })
}

// ── Admin CRUD: Sub-Dimensi ───────────────────────────────────────
export function useCreateSubDimensi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ dimensiId, payload }: { dimensiId: string; payload: CreateSubDimensiPayload }) =>
      createSubDimensi(dimensiId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: DIMENSI_KEYS.master }),
  })
}
export function useUpdateSubDimensi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSubDimensiPayload }) =>
      updateSubDimensi(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: DIMENSI_KEYS.master }),
  })
}
export function useDeleteSubDimensi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSubDimensi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: DIMENSI_KEYS.master }),
  })
}

// ── Siswa: ringkasan ──────────────────────────────────────────────
export function useRingkasanDimensiSiswa(siswaId: string | null, semesterId: string | null) {
  return useQuery({
    queryKey: DIMENSI_KEYS.ringkasanSiswa(siswaId ?? '', semesterId ?? ''),
    queryFn:  () => getRingkasanDimensiSiswa(siswaId!, semesterId!),
    enabled:  !!siswaId && !!semesterId,
  })
}
