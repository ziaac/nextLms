import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { semesterApi } from '@/lib/api/semester.api'
import type { CreateSemesterPayload, UpdateSemesterPayload } from '@/types/tahun-ajaran.types'
import { useTahunAjaranActive } from '@/hooks/tahun-ajaran/useTahunAjaran'

// ── Query Keys ────────────────────────────────────────────────
export const semesterKeys = {
  byTahunAjaran: (tahunAjaranId: string) => ['semester', 'by-ta', tahunAjaranId] as const,
  active:        ['semester', 'aktif'] as const,
  detail:        (id: string) => ['semester', id] as const,
}

// ── Queries ───────────────────────────────────────────────────

/** Lazy — hanya fetch saat tahunAjaranId tersedia (klik row) */
export function useSemesterByTahunAjaran(tahunAjaranId: string | null) {
  return useQuery({
    queryKey: semesterKeys.byTahunAjaran(tahunAjaranId ?? ''),
    queryFn:  () => semesterApi.getByTahunAjaran(tahunAjaranId!),
    enabled:  !!tahunAjaranId,
    staleTime: 1000 * 60 * 5, // 5 menit cache
  })
}

export function useSemesterActive() {
  return useQuery({
    queryKey: semesterKeys.active,
    queryFn:  semesterApi.getAllActive,
  })
}

// ── Mutations ─────────────────────────────────────────────────
export function useCreateSemester() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSemesterPayload) => semesterApi.create(payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: semesterKeys.byTahunAjaran(vars.tahunAjaranId) })
      qc.invalidateQueries({ queryKey: semesterKeys.active })
    },
  })
}

export function useUpdateSemester() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateSemesterPayload
      tahunAjaranId: string
    }) => semesterApi.update(id, payload),
    onSuccess: (_data, { tahunAjaranId }) => {
      qc.invalidateQueries({ queryKey: semesterKeys.byTahunAjaran(tahunAjaranId) })
      qc.invalidateQueries({ queryKey: semesterKeys.active })
    },
  })
}

export function useToggleSemesterActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; tahunAjaranId: string }) =>
      semesterApi.toggleActive(id),
    onSuccess: (_data, { tahunAjaranId }) => {
      qc.invalidateQueries({ queryKey: semesterKeys.byTahunAjaran(tahunAjaranId) })
      qc.invalidateQueries({ queryKey: semesterKeys.active })
    },
  })
}

export function useDeleteSemester() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; tahunAjaranId: string }) =>
      semesterApi.remove(id),
    onSuccess: (_data, { tahunAjaranId }) => {
      qc.invalidateQueries({ queryKey: semesterKeys.byTahunAjaran(tahunAjaranId) })
      qc.invalidateQueries({ queryKey: semesterKeys.active })
    },
  })
}

// ── Label semester aktif (reusable) ──────────────────────────
// Returns "Semester Genap 2024/2025" or null saat loading
export function useActiveSemesterLabel(): string | null {
  const { data: taListRaw = [] } = useTahunAjaranActive()
  const taList  = taListRaw as { id: string; nama: string }[]
  const taAktif = taList[0] ?? null

  const { data: semListRaw = [] } = useSemesterByTahunAjaran(taAktif?.id ?? null)
  const semAktif = (semListRaw as { id: string; nama: string; isActive?: boolean; urutan?: number }[])
    .filter((s) => s.isActive)
    .sort((a, b) => (b.urutan ?? 0) - (a.urutan ?? 0))[0] ?? null

  if (!semAktif || !taAktif) return null
  return `Semester ${semAktif.nama} ${taAktif.nama}`
}
