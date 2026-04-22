import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
} from '@/types/akademik.types'

// ── Query Keys ────────────────────────────────────────────────
export const masterMapelKeys = {
  all:    (f?: FilterMasterMapelParams) => ['master-mapel', f ?? {}] as const,
  detail: (id: string) => ['master-mapel', id] as const,
}

export const mapelTingkatKeys = {
  byTingkat:     (id: string) => ['mapel-tingkat', 'by-tingkat', id] as const,
  byMasterMapel: (id: string) => ['mapel-tingkat', 'by-master', id] as const,
  detail:        (id: string) => ['mapel-tingkat', id] as const,
}

export const mataPelajaranKeys = {
  all:    (f?: FilterMataPelajaranParams) => ['mata-pelajaran', f ?? {}] as const,
  detail: (id: string) => ['mata-pelajaran', id] as const,
}

export const guruKeys = {
  all: ['guru-list'] as const,
}

// ── Master Mapel ──────────────────────────────────────────────
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['master-mapel'] })
      toast.success('Master mapel berhasil ditambahkan')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Gagal menambahkan master mapel'),
  })
}

export function useUpdateMasterMapel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMasterMapelPayload }) =>
      masterMapelApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['master-mapel'] })
      toast.success('Master mapel berhasil diperbarui')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Gagal memperbarui master mapel'),
  })
}

export function useDeleteMasterMapel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => masterMapelApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['master-mapel'] })
      toast.success('Master mapel berhasil dihapus')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Gagal menghapus master mapel'),
  })
}

// ── MapelTingkat ──────────────────────────────────────────────
export function useMapelTingkatByTingkat(tingkatKelasId: string | null) {
  return useQuery({
    queryKey: mapelTingkatKeys.byTingkat(tingkatKelasId ?? ''),
    queryFn:  () => mapelTingkatApi.getByTingkat(tingkatKelasId!),
    enabled:  !!tingkatKelasId,
    staleTime: 1000 * 60 * 5,
  })
}

// Fetch 1 mapelTingkat by id — untuk dapatkan guruMapel pool
export function useMapelTingkatById(id: string | null) {
  return useQuery({
    queryKey: mapelTingkatKeys.detail(id ?? ''),
    queryFn:  () => mapelTingkatApi.getOne(id!),
    enabled:  !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateMapelTingkat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMapelTingkatPayload) => mapelTingkatApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mapel-tingkat'] })
      toast.success('Mapel tingkat berhasil ditambahkan')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Gagal menambahkan mapel tingkat'),
  })
}

export function useDeleteMapelTingkat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mapelTingkatApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mapel-tingkat'] })
      toast.success('Mapel tingkat berhasil dihapus')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Gagal menghapus mapel tingkat'),
  })
}

export function useSetGuruPool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SetGuruPoolPayload }) =>
      mapelTingkatApi.setGuruPool(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mapel-tingkat'] })
      toast.success('Pool guru berhasil diperbarui')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Gagal memperbarui pool guru'),
  })
}

export function useAddGuru() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, guruId }: { id: string; guruId: string }) =>
      mapelTingkatApi.addGuru(id, guruId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mapel-tingkat'] })
      toast.success('Guru berhasil ditambahkan')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Gagal menambahkan guru'),
  })
}

export function useRemoveGuru() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, guruId }: { id: string; guruId: string }) =>
      mapelTingkatApi.removeGuru(id, guruId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mapel-tingkat'] })
      toast.success('Guru berhasil dihapus')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Gagal menghapus guru'),
  })
}

export function useGuruList() {
  return useQuery({
    queryKey: guruKeys.all,
    queryFn:  () => usersApi.getByRole('GURU'),
    staleTime: 1000 * 60 * 10,
  })
}

// ── MataPelajaran ─────────────────────────────────────────────
export function useMataPelajaranList(filter?: FilterMataPelajaranParams) {
  return useQuery({
    queryKey: mataPelajaranKeys.all(filter),
    queryFn:  () => mataPelajaranApi.getAll(filter),
    staleTime: 1000 * 60 * 5,
  })
}

export function useMataPelajaranById(id: string | null) {
  return useQuery({
    queryKey: mataPelajaranKeys.detail(id ?? ''),
    queryFn:  () => mataPelajaranApi.getOne(id!),
    enabled:  !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateMataPelajaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMataPelajaranPayload) => mataPelajaranApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mata-pelajaran'] })
      toast.success('Mata pelajaran berhasil ditambahkan')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Gagal menambahkan mata pelajaran'),
  })
}

export function useUpdateMataPelajaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMataPelajaranPayload }) =>
      mataPelajaranApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['mata-pelajaran'] })
      qc.invalidateQueries({ queryKey: mataPelajaranKeys.detail(id) })
      toast.success('Mata pelajaran berhasil diperbarui')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Gagal memperbarui mata pelajaran'),
  })
}

export function useToggleMataPelajaranActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mataPelajaranApi.toggleActive(id),
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: ['mata-pelajaran'] })
      qc.invalidateQueries({ queryKey: mataPelajaranKeys.detail(id) })
      toast.success(`Mata pelajaran berhasil ${data.isActive ? 'diaktifkan' : 'dinonaktifkan'}`)
    },
    onError: (err: Error) => toast.error(err.message ?? 'Gagal mengubah status'),
  })
}

export function useDeleteMataPelajaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mataPelajaranApi.remove(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['mata-pelajaran'] })
      qc.removeQueries({ queryKey: mataPelajaranKeys.detail(id) })
      toast.success('Mata pelajaran berhasil dihapus')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Gagal menghapus mata pelajaran'),
  })
}

export function useBulkCopyMataPelajaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      sourceSemesterId,
      targetSemesterId,
      kelasId,
    }: {
      sourceSemesterId: string
      targetSemesterId: string
      kelasId?:         string
    }) => mataPelajaranApi.bulkCopy(sourceSemesterId, targetSemesterId, kelasId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['mata-pelajaran'] })
      toast.success(`${data.count} mata pelajaran berhasil disalin`)
    },
    onError: (err: Error) => toast.error(err.message ?? 'Gagal menyalin mata pelajaran'),
  })
}
