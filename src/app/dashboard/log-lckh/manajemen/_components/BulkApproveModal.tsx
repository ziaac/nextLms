'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { Modal, Button, Select, Spinner } from '@/components/ui'
import { useBulkSetujuiLckh } from '@/hooks/guru-log/useGuruLog'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'sonner'
import type { GuruLckhSummaryItem } from '@/types/guru-log.types'
import api from '@/lib/axios'

interface BulkApproveModalProps {
  open:       boolean
  onClose:    () => void
  selected:   GuruLckhSummaryItem[]
  onSuccess?: () => void
}

interface AtasanUser {
  id:      string
  profile: { namaLengkap: string } | null
}

export function BulkApproveModal({ open, onClose, selected, onSuccess }: BulkApproveModalProps) {
  const { user }    = useAuthStore()
  const isAdminLevel = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'

  const [atasanId, setAtasanId] = useState('')
  const bulkMutation = useBulkSetujuiLckh()

  // Ambil list kepsek + wakil untuk admin level
  const { data: atasanList = [] } = useQuery({
    queryKey: ['users', 'kepsek-wakil-bulk'],
    queryFn: async () => {
      const [r1, r2] = await Promise.all([
        api.get<AtasanUser[]>('/users/by-role/KEPALA_SEKOLAH'),
        api.get<AtasanUser[]>('/users/by-role/WAKIL_KEPALA'),
      ])
      return [...r1.data, ...r2.data]
    },
    enabled: open && isAdminLevel,
    staleTime: 1000 * 60 * 10,
  })

  const atasanOptions = atasanList.map((u) => ({
    value: u.id,
    label: u.profile?.namaLengkap ?? u.id,
  }))

  // Hitung total hari yang akan disetujui
  const totalHari = selected.reduce((sum, g) => sum + g.tanggalAktifPending.length, 0)

  const handleApprove = async () => {
    if (isAdminLevel && !atasanId) {
      toast.error('Pilih atasan yang akan menandatangani')
      return
    }

    let successCount = 0
    let failCount    = 0

    // Proses satu per satu per guru
    for (const guru of selected) {
      if (guru.tanggalAktifPending.length === 0) continue
      try {
        await bulkMutation.mutateAsync({
          guruId:      guru.guruId,
          tanggalList: guru.tanggalAktifPending,
          atasanId:    isAdminLevel ? atasanId : undefined,
        })
        successCount++
      } catch {
        failCount++
      }
    }

    if (successCount > 0) {
      toast.success(
        `LCKH ${successCount} guru berhasil disetujui (${totalHari} hari)`,
      )
    }
    if (failCount > 0) {
      toast.error(`${failCount} guru gagal disetujui`)
    }

    onSuccess?.()
    onClose()
    setAtasanId('')
  }

  const handleClose = () => {
    if (bulkMutation.isPending) return
    setAtasanId('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Setujui LCKH Massal"
      size="md"
      footer={
        <div className="flex gap-2 justify-end">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={bulkMutation.isPending}
          >
            Batal
          </Button>
          <Button
            onClick={handleApprove}
            disabled={bulkMutation.isPending || (isAdminLevel && !atasanId) || selected.length === 0}
          >
            {bulkMutation.isPending ? (
              <><Spinner />&nbsp;Menyetujui...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 mr-1.5" />Setujui {selected.length} Guru</>
            )}
          </Button>
        </div>
      }
    >
      <div className="px-6 py-5 space-y-5">
        {/* Info */}
        <div className="flex gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold">Konfirmasi Persetujuan Massal</p>
            <p className="mt-0.5 text-amber-700 dark:text-amber-400">
              Menyetujui <strong>{totalHari} hari</strong> LCKH dari{' '}
              <strong>{selected.length} guru</strong>. Tindakan ini dapat dibatalkan per hari.
            </p>
          </div>
        </div>

        {/* Pilih atasan (hanya untuk admin level) */}
        {isAdminLevel && (
          <Select
            label="Tandatangani atas nama *"
            options={atasanOptions}
            value={atasanId}
            placeholder="Pilih Kepala Sekolah / Wakil Kepala"
            onChange={(e) => setAtasanId(e.target.value)}
          />
        )}

        {/* Daftar guru yang dipilih */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Guru yang akan disetujui
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {selected.map((guru) => (
              <div
                key={guru.guruId}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {guru.namaLengkap}
                </span>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                  {guru.tanggalAktifPending.length} hari
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
