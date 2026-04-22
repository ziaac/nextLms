import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { jadwalApi } from '@/lib/api/jadwal.api'
import type {
  CreateJadwalPayload,
  BulkJadwalPayload,
  BulkMapelJadwalPayload,
  KetersediaanRequest,
  FilterRingkasanParams,
  HariEnum,
} from '@/types/jadwal.types'

export const jadwalKeys = {
  mingguan:      (kelasId: string, semesterId: string) => ['jadwal', 'mingguan', kelasId, semesterId] as const,
  byGuru:        (guruId: string, semesterId: string)  => ['jadwal', 'guru', guruId, semesterId] as const,
  detail:        (id: string)                          => ['jadwal', 'detail', id] as const,
  ringkasan:     (params: FilterRingkasanParams)       => ['jadwal', 'ringkasan', params] as const,
  rosterKelas:   (kelasId: string, semesterId: string) => ['jadwal', 'roster-kelas', kelasId, semesterId] as const,
  rosterGuru:    (guruId: string, semesterId: string)  => ['jadwal', 'roster-guru', guruId, semesterId] as const,
  bebanMengajar: (guruId: string, semesterId?: string) => ['jadwal', 'beban', guruId, semesterId ?? ''] as const,
  rekapGuru:     ()                                    => ['jadwal', 'rekap-guru'] as const,
  ketersediaan:  (payload: KetersediaanRequest)        => ['jadwal', 'ketersediaan', payload] as const,
}

export function useJadwalMingguan(kelasId: string | null, semesterId: string | null) {
  return useQuery({
    queryKey: jadwalKeys.mingguan(kelasId ?? '', semesterId ?? ''),
    queryFn:  () => jadwalApi.getMingguan(kelasId!, semesterId!),
    enabled:  !!kelasId && !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useJadwalGuru(guruId: string | null, semesterId: string | null) {
  return useQuery({
    queryKey: jadwalKeys.byGuru(guruId ?? '', semesterId ?? ''),
    queryFn:  () => jadwalApi.getByGuru(guruId!, semesterId!),
    enabled:  !!guruId && !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useJadwalDetail(id: string | null) {
  return useQuery({
    queryKey: jadwalKeys.detail(id ?? ''),
    queryFn:  () => jadwalApi.getById(id!),
    enabled:  !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useRingkasanSemuaKelas(params: FilterRingkasanParams | null) {
  return useQuery({
    queryKey:       jadwalKeys.ringkasan(params ?? { semesterId: '' }),
    queryFn:        () => jadwalApi.getRingkasanSemuaKelas(params!),
    enabled:        !!params?.semesterId,
    staleTime:      0,
    refetchOnMount: 'always',
  })
}

export function useRosterKelas(kelasId: string | null, semesterId: string | null) {
  return useQuery({
    queryKey: jadwalKeys.rosterKelas(kelasId ?? '', semesterId ?? ''),
    queryFn:  () => jadwalApi.getRosterKelas(kelasId!, semesterId!),
    enabled:  !!kelasId && !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useRosterGuru(guruId: string | null, semesterId: string | null) {
  return useQuery({
    queryKey: jadwalKeys.rosterGuru(guruId ?? '', semesterId ?? ''),
    queryFn:  () => jadwalApi.getRosterGuru(guruId!, semesterId!),
    enabled:  !!guruId && !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}

/** semesterId opsional */
export function useBebanMengajar(guruId: string | null, semesterId?: string | null) {
  return useQuery({
    queryKey: jadwalKeys.bebanMengajar(guruId ?? '', semesterId ?? undefined),
    queryFn:  () => jadwalApi.getBebanMengajar(guruId!, semesterId ?? undefined),
    enabled:  !!guruId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useRekapGuruMapel() {
  return useQuery({
    queryKey: jadwalKeys.rekapGuru(),
    queryFn:  jadwalApi.getRekapGuru,
    staleTime: 1000 * 60 * 10,
  })
}

export function useKetersediaan(payload: KetersediaanRequest | null) {
  return useQuery({
    queryKey: jadwalKeys.ketersediaan(
      payload ?? { semesterId: '', hari: 'SENIN' as const, masterJamId: '' },
    ),
    queryFn:  () => jadwalApi.checkKetersediaan(payload!),
    enabled:  !!payload?.semesterId && !!payload?.hari && !!payload?.masterJamId,
    staleTime: 0,
  })
}

export function useCreateJadwal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateJadwalPayload) => jadwalApi.create(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['jadwal'] }),
  })
}

export function useBulkJadwalByKelas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: BulkJadwalPayload) => jadwalApi.bulkByKelas(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['jadwal'] }),
  })
}

export function useBulkJadwalByMapel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: BulkMapelJadwalPayload) => jadwalApi.bulkByMapel(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['jadwal'] }),
  })
}

export function useDeleteJadwal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => jadwalApi.remove(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['jadwal'] }),
  })
}

export function useCopySemesterJadwal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sourceSemesterId, targetSemesterId }: { sourceSemesterId: string; targetSemesterId: string }) =>
      jadwalApi.copySemester(sourceSemesterId, targetSemesterId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jadwal'] }),
  })
}

export function useExportJadwalSekolah() {
  return useMutation({
    mutationFn: async (semesterId: string) => {
      const blob = await jadwalApi.exportJadwalSekolah({ semesterId })
      triggerDownload(blob, 'jadwal-sekolah.xlsx')
    },
  })
}

export function useExportJadwalKelas() {
  return useMutation({
    mutationFn: async ({ semesterId, kelasId }: { semesterId: string; kelasId: string }) => {
      const blob = await jadwalApi.exportJadwalKelas({ semesterId, kelasId })
      triggerDownload(blob, 'jadwal-kelas.xlsx')
    },
  })
}

export function useExportJadwalGuru() {
  return useMutation({
    mutationFn: async ({ semesterId, guruId }: { semesterId: string; guruId?: string }) => {
      const blob = await jadwalApi.exportJadwalGuru({ semesterId, guruId })
      triggerDownload(blob, guruId ? 'jadwal-guru.xlsx' : 'jadwal-guru-saya.xlsx')
    },
  })
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
