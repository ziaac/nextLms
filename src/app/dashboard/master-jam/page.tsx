'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { isManajemen } from '@/lib/helpers/role'
import { useMasterJamList } from '@/hooks/master-jam/useMasterJam'
import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
import { PageHeader, Button, Select } from '@/components/ui'
import { Plus } from 'lucide-react'
import { MasterJamTable } from './_components/MasterJamTable'
import { MasterJamFormModal } from './_components/MasterJamFormModal'
import { MasterJamSkeleton } from './_components/MasterJamSkeleton'
import type { MasterJam } from '@/types/master-jam.types'
import type { TipeHari } from '@/types/master-jam.types'
import { TIPE_HARI_LIST, TIPE_HARI_LABEL } from '@/types/master-jam.types'

export default function MasterJamPage() {
  const { user } = useAuthStore()
  const bolehAkses = isManajemen(user?.role)

  const [tingkatId, setTingkatId]   = useState('')
  const [tipeHari, setTipeHari]     = useState<TipeHari | ''>('')
  const [editTarget, setEditTarget] = useState<MasterJam | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const { data: tingkatListRaw } = useTingkatKelasList()
  const tingkatList = (tingkatListRaw as unknown as { id: string; nama: string }[] | undefined) ?? []

  // Auto-select tingkat pertama
  useEffect(() => {
    if (tingkatId || !tingkatList.length) return
    setTingkatId(tingkatList[0]?.id ?? '')
  }, [tingkatList, tingkatId])

  const { data: masterJamRaw, isLoading } = useMasterJamList(
    tingkatId
      ? { tingkatKelasId: tingkatId, tipeHari: tipeHari || undefined }
      : undefined,
  )
  const masterJamList = (masterJamRaw as MasterJam[] | undefined) ?? []

  // Sort by urutan
  const sorted = useMemo(
    () => [...masterJamList].sort((a, b) => a.urutan - b.urutan),
    [masterJamList],
  )

  if (!user || (!bolehAkses && user)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }

  const tingkatOpts = [
    { label: '— Pilih Tingkat —', value: '' },
    ...tingkatList.map((t) => ({ label: 'Kelas ' + t.nama, value: t.id })),
  ]
  const tipeOpts = [
    { label: 'Semua Tipe', value: '' },
    ...TIPE_HARI_LIST.map((t) => ({ label: TIPE_HARI_LABEL[t], value: t })),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Jam Pelajaran"
        description="Kelola template sesi jam pelajaran per tingkat kelas"
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Tambah Sesi
          </Button>
        }
      />

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select
          options={tingkatOpts}
          value={tingkatId}
          onChange={(e) => setTingkatId(e.target.value)}
          className="w-44"
        />
        <Select
          options={tipeOpts}
          value={tipeHari}
          onChange={(e) => setTipeHari(e.target.value as TipeHari | '')}
          className="w-40"
        />
      </div>

      {isLoading ? (
        <MasterJamSkeleton />
      ) : (
        <MasterJamTable
          data={sorted}
          onEdit={setEditTarget}
        />
      )}

      {/* Create Modal */}
      <MasterJamFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultTingkatId={tingkatId}
      />

      {/* Edit Modal */}
      <MasterJamFormModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        editData={editTarget}
        defaultTingkatId={tingkatId}
      />
    </div>
  )
}
