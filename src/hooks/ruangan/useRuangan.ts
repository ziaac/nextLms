import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ruanganApi } from '@/lib/api/ruangan.api'
import type { CreateRuanganDto, UpdateRuanganDto } from '@/types/ruangan.types'

export const ruanganKeys = {
  all: ['ruangan'] as const,
}

export function useRuanganList() {
  return useQuery({
    queryKey: ruanganKeys.all,
    queryFn:  ruanganApi.getAll,
    staleTime: 1000 * 60 * 10,
  })
}

export function useCreateRuangan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateRuanganDto) => ruanganApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ruanganKeys.all })
      toast.success('Ruangan berhasil ditambahkan')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Gagal menambahkan ruangan'),
  })
}

export function useUpdateRuangan(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateRuanganDto) => ruanganApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ruanganKeys.all })
      toast.success('Ruangan berhasil diperbarui')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Gagal memperbarui ruangan'),
  })
}

export function useDeleteRuangan(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => ruanganApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ruanganKeys.all })
      toast.success('Ruangan berhasil dihapus')
    },
    onError: (err: Error) => toast.error(err.message ?? 'Gagal menghapus ruangan'),
  })
}

// ─── useRuanganByJenis ──────────────────────────────────────────
// Ambil ruangan berdasarkan jenis (LAB, LAINNYA, KELAS, dst)
// Response: { data: Ruangan[], meta: {...} }
export function useRuanganByJenis(jenis: string | null) {
  return useQuery({
    queryKey: ['ruangan', 'by-jenis', jenis ?? ''],
    queryFn: async () => {
      const { data } = await import('@/lib/axios').then((m) => m.default.get('/ruangan', {
        params: { jenis, limit: 100, isActive: true },
      }))
      // Response: { data: [...], meta: {...} } ATAU langsung array
      return (Array.isArray(data) ? data : (data.data ?? [])) as {
        id: string; kode: string; nama: string; jenis: string; isActive: boolean
      }[]
    },
    enabled: !!jenis,
    staleTime: 1000 * 60 * 10,
  })
}
