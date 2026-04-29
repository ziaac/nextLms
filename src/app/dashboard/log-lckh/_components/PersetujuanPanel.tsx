'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { isManajemen } from '@/lib/helpers/role'
import { usePersetujuan, useSetujuiLckh, useBatalkanPersetujuan } from '@/hooks/guru-log/useGuruLog'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { Skeleton, Select } from '@/components/ui'
import { CheckCircle2, XCircle, ShieldCheck, Trash2 } from 'lucide-react'
import { formatTanggalSaja } from '@/lib/helpers/timezone'
import { getPresignedUrl } from '@/lib/api/upload.api'
import { useQuery } from '@tanstack/react-query'

interface PersetujuanPanelProps {
  tanggal: string
  guruId: string  // ID guru yang log-nya ditampilkan
}

export function PersetujuanPanel({ tanggal, guruId }: PersetujuanPanelProps) {
  const { user } = useAuthStore()
  const bolehSetujui = isManajemen(user?.role) || user?.role === 'KEPALA_SEKOLAH' || user?.role === 'WAKIL_KEPALA'
  const isAdminLevel = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'

  const [atasanId, setAtasanId] = useState('')

  const { data: persetujuan, isLoading } = usePersetujuan(tanggal, guruId)
  const setujuiMutation = useSetujuiLckh(tanggal)
  const batalkanMutation = useBatalkanPersetujuan(tanggal)

  // Untuk admin: pilih atasan yang akan menandatangani
  const { data: allUsers = [], isLoading: loadingAtasan } = useQuery({
    queryKey: ['users', 'kepsek-wakil'],
    queryFn: async () => {
      const api = (await import('@/lib/axios')).default
      const res = await api.get('/users/by-role/KEPALA_SEKOLAH')
      const res2 = await api.get('/users/by-role/WAKIL_KEPALA')
      return [
        ...(res.data as { id: string; profile: { namaLengkap: string } | null }[]),
        ...(res2.data as { id: string; profile: { namaLengkap: string } | null }[]),
      ]
    },
    enabled: isAdminLevel,
    staleTime: 1000 * 60 * 10,
  })

  // Presigned URL untuk TTD atasan (jika ada snapshot)
  const { data: ttdUrl } = useQuery({
    queryKey: ['presigned', persetujuan?.tandaTanganSnapshot],
    queryFn: () => getPresignedUrl(persetujuan!.tandaTanganSnapshot!),
    enabled: !!persetujuan?.tandaTanganSnapshot,
    staleTime: 1000 * 60 * 50,
  })

  if (isLoading) return <Skeleton className="h-16 w-full rounded-xl" />

  const atasanOptions = (allUsers as { id: string; profile: { namaLengkap: string } | null }[]).map((u) => ({
    value: u.id,
    label: u.profile?.namaLengkap ?? u.id,
  }))

  const handleSetujui = () => {
    setujuiMutation.mutate({
      tanggalList: [tanggal],
      guruId,
      atasanId: isAdminLevel ? atasanId || undefined : undefined,
    })
  }

  const handleBatalkan = () => {
    if (window.confirm('Batalkan persetujuan LCKH ini?')) {
      batalkanMutation.mutate({ guruId })
    }
  }

  if (persetujuan?.isApproved) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Disetujui oleh {persetujuan.atasanNama ?? '—'}
            </p>
            {persetujuan.approvedAt && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                {formatTanggalSaja(persetujuan.approvedAt)}
              </p>
            )}
          </div>
          {ttdUrl && (
            <img
              src={ttdUrl}
              alt="TTD Atasan"
              className="h-8 max-w-[80px] object-contain ml-2 opacity-80"
            />
          )}
        </div>
        {bolehSetujui && (
          <button
            type="button"
            onClick={handleBatalkan}
            disabled={batalkanMutation.isPending}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-colors"
            title="Batalkan persetujuan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  if (!bolehSetujui) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 px-4 py-3">
        <XCircle className="w-5 h-5 text-gray-400 shrink-0" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Belum disetujui atasan</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Belum disetujui</p>
      </div>

      {isAdminLevel && (
        <Select
          label="Tandatangani atas nama"
          options={atasanOptions}
          value={atasanId}
          placeholder={loadingAtasan ? 'Memuat daftar atasan...' : 'Pilih Kepala Sekolah / Wakil'}
          onChange={(e) => setAtasanId(e.target.value)}
          disabled={loadingAtasan}
        />
      )}

      <button
        type="button"
        onClick={handleSetujui}
        disabled={setujuiMutation.isPending || (isAdminLevel && !atasanId)}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        <CheckCircle2 className="w-4 h-4" />
        {setujuiMutation.isPending ? 'Menyetujui...' : 'Setujui & Tanda Tangani'}
      </button>
    </div>
  )
}
