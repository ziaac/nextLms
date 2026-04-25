import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getDiskusiMateri, createDiskusiMateri, deleteDiskusiMateri,
  pinDiskusiMateri, createBalasanMateri, deleteBalasanMateri, toggleDiskusiMateri,
  getDiskusiTugas, createDiskusiTugas, deleteDiskusiTugas,
  pinDiskusiTugas, createBalasanTugas, deleteBalasanTugas, toggleDiskusiTugas,
  CreateDiskusiPayload, CreateBalasanPayload,
} from '@/lib/api/diskusi.api'

// ─── keys ─────────────────────────────────────────────────────────────────────
export const diskusiKeys = {
  materi: (materiId: string) => ['diskusi', 'materi', materiId] as const,
  tugas:  (tugasId:  string) => ['diskusi', 'tugas',  tugasId]  as const,
}

// ═════════════════════════════════════════════════════════════════════════════
// MATERI
// ═════════════════════════════════════════════════════════════════════════════

export function useDiskusiMateri(materiId: string | null) {
  return useQuery({
    queryKey: diskusiKeys.materi(materiId ?? ''),
    queryFn:  () => getDiskusiMateri(materiId!),
    enabled:  !!materiId,
    staleTime: 30_000,
  })
}

export function useCreateDiskusiMateri(materiId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDiskusiPayload) => createDiskusiMateri(materiId, payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: diskusiKeys.materi(materiId) }),
  })
}

export function useDeleteDiskusiMateri(materiId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (diskusiId: string) => deleteDiskusiMateri(diskusiId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: diskusiKeys.materi(materiId) }),
  })
}

export function usePinDiskusiMateri(materiId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (diskusiId: string) => pinDiskusiMateri(diskusiId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: diskusiKeys.materi(materiId) }),
  })
}

export function useCreateBalasanMateri(materiId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ diskusiId, payload }: { diskusiId: string; payload: CreateBalasanPayload }) =>
      createBalasanMateri(diskusiId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: diskusiKeys.materi(materiId) }),
  })
}

export function useDeleteBalasanMateri(materiId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (balasanId: string) => deleteBalasanMateri(balasanId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: diskusiKeys.materi(materiId) }),
  })
}

export function useToggleDiskusiMateri(materiId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => toggleDiskusiMateri(materiId),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: diskusiKeys.materi(materiId) })
      qc.invalidateQueries({ queryKey: ['materi-pelajaran'] })
    },
  })
}

// ═════════════════════════════════════════════════════════════════════════════
// TUGAS
// ═════════════════════════════════════════════════════════════════════════════

export function useDiskusiTugas(tugasId: string | null) {
  return useQuery({
    queryKey: diskusiKeys.tugas(tugasId ?? ''),
    queryFn:  () => getDiskusiTugas(tugasId!),
    enabled:  !!tugasId,
    staleTime: 30_000,
  })
}

export function useCreateDiskusiTugas(tugasId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDiskusiPayload) => createDiskusiTugas(tugasId, payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: diskusiKeys.tugas(tugasId) }),
  })
}

export function useDeleteDiskusiTugas(tugasId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (diskusiId: string) => deleteDiskusiTugas(diskusiId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: diskusiKeys.tugas(tugasId) }),
  })
}

export function usePinDiskusiTugas(tugasId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (diskusiId: string) => pinDiskusiTugas(diskusiId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: diskusiKeys.tugas(tugasId) }),
  })
}

export function useCreateBalasanTugas(tugasId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ diskusiId, payload }: { diskusiId: string; payload: CreateBalasanPayload }) =>
      createBalasanTugas(diskusiId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: diskusiKeys.tugas(tugasId) }),
  })
}

export function useDeleteBalasanTugas(tugasId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (balasanId: string) => deleteBalasanTugas(balasanId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: diskusiKeys.tugas(tugasId) }),
  })
}

export function useToggleDiskusiTugas(tugasId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => toggleDiskusiTugas(tugasId),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: diskusiKeys.tugas(tugasId) })
      qc.invalidateQueries({ queryKey: ['tugas'] })
    },
  })
}
