import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pendaftaranAdminApi, type SiswaLulusParams } from '@/lib/api/pendaftaran.api'
import type { BiodataSiswaBaru } from '@/types/pendaftaran.types'
import { getErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

export const PENDAFTARAN_KEYS = {
  all:       ['pendaftaran'] as const,
  siswa:     (p?: SiswaLulusParams) => ['pendaftaran', 'siswa', p] as const,
  siswaOne:  (id: string) => ['pendaftaran', 'siswa', id] as const,
  tahunList: ['pendaftaran', 'tahun-list'] as const,
  statistik: (id: string) => ['pendaftaran', 'statistik', id] as const,
}

export function useSiswaLulus(params?: SiswaLulusParams) {
  return useQuery({
    queryKey: PENDAFTARAN_KEYS.siswa(params),
    queryFn:  () => pendaftaranAdminApi.getSiswaLulus(params),
  })
}

export function useSiswaLulusById(id: string) {
  return useQuery({
    queryKey: PENDAFTARAN_KEYS.siswaOne(id),
    queryFn:  () => pendaftaranAdminApi.getSiswaLulusById(id),
    enabled:  !!id,
  })
}

export function useTahunList() {
  return useQuery({
    queryKey: PENDAFTARAN_KEYS.tahunList,
    queryFn:  () => pendaftaranAdminApi.getTahunList(),
  })
}

export function useBiodataById(id: string | null) {
  return useQuery<BiodataSiswaBaru>({
    queryKey: ['pendaftaran', 'biodata', id],
    queryFn:  () => pendaftaranAdminApi.getBiodataById(id!),
    enabled:  !!id,
  })
}

export function useStatistik(tahunAjaranId: string) {
  return useQuery({
    queryKey: PENDAFTARAN_KEYS.statistik(tahunAjaranId),
    queryFn:  () => pendaftaranAdminApi.getStatistik(tahunAjaranId),
    enabled:  !!tahunAjaranId,
  })
}

export function useCreateSiswaLulus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => pendaftaranAdminApi.createSiswaLulus(data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: PENDAFTARAN_KEYS.all })
      toast.success('Data berhasil ditambahkan')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateSiswaLulus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      pendaftaranAdminApi.updateSiswaLulus(id, data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: PENDAFTARAN_KEYS.all })
      toast.success('Data berhasil diperbarui')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteSiswaLulus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pendaftaranAdminApi.deleteSiswaLulus(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: PENDAFTARAN_KEYS.all })
      toast.success('Data berhasil dihapus')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useBulkImport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown[]) => pendaftaranAdminApi.bulkImport(data),
    onSuccess:  (res) => {
      qc.invalidateQueries({ queryKey: PENDAFTARAN_KEYS.all })
      toast.success(`${res.count} data berhasil diimport`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useBulkImportBiodata() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ tahunAjaranId, data }: { tahunAjaranId: string; data: Record<string, unknown>[] }) =>
      pendaftaranAdminApi.bulkImportBiodata(tahunAjaranId, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: PENDAFTARAN_KEYS.all })
      toast.success(`${res.dibuat} dibuat · ${res.diperbarui} diperbarui`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useBulkVerifikasiBiodata() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (biodataIds: string[]) => pendaftaranAdminApi.bulkVerifikasiBiodata(biodataIds),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: PENDAFTARAN_KEYS.all })
      toast.success(`${res.updated} biodata berhasil diverifikasi sebagai Diterima`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useBuatkanAkun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => pendaftaranAdminApi.buatkanAkun(ids),
    onSuccess:  (res) => {
      qc.invalidateQueries({ queryKey: PENDAFTARAN_KEYS.all })
      toast.success(`${res.berhasil} akun berhasil dibuat`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
