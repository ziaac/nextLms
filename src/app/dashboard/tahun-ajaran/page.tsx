'use client'

import { useState } from 'react'
import { PageHeader, Button } from '@/components/ui'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import TahunAjaranTable     from './_components/TahunAjaranTable'
import TahunAjaranFormModal from './_components/TahunAjaranFormModal'
import type { TahunAjaran } from '@/types/tahun-ajaran.types'

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

export default function TahunAjaranPage() {
  const { data, isLoading } = useTahunAjaranList()
  const [formOpen, setFormOpen] = useState(false)
  const [editData, setEditData] = useState<TahunAjaran | null>(null)

  const handleAdd = () => {
    setEditData(null)
    setFormOpen(true)
  }

  const handleEdit = (ta: TahunAjaran) => {
    setEditData(ta)
    setFormOpen(true)
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Tahun Ajaran & Semester"
          description="Kelola tahun ajaran dan semester aktif untuk seluruh kegiatan akademik."
          actions={
            <Button onClick={handleAdd}>
              <span className="flex items-center gap-1.5">
                <PlusIcon />
                Tambah Tahun Ajaran
              </span>
            </Button>
          }
        />

        {data && data.length > 0 && (
          <ActiveSummaryBanner data={data} />
        )}

        <TahunAjaranTable
          data={data ?? []}
          isLoading={isLoading}
          onEdit={handleEdit}
        />
      </div>

      <TahunAjaranFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        data={editData}
      />
    </>
  )
}

function ActiveSummaryBanner({ data }: { data: TahunAjaran[] }) {
  const aktif = data.filter((ta) => ta.isActive)
  if (aktif.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 dark:border-amber-700/50
        bg-amber-50 dark:bg-amber-900/10 px-4 py-3 flex items-center gap-3">
        <span className="text-lg">⚠️</span>
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Tidak ada tahun ajaran aktif. Aktifkan salah satu agar sistem berjalan normal.
        </p>
      </div>
    )
  }
  return (
    <div className="rounded-lg border border-emerald-200 dark:border-emerald-700/50
      bg-emerald-30/50 dark:bg-emerald-900/10 px-4 py-3 flex items-center gap-3">
      <span className="text-lg">✓</span>
      <p className="text-sm text-emerald-700 dark:text-emerald-400">
        {aktif.length === 1 ? (
          <>Tahun ajaran aktif: <strong>{aktif[0].nama}</strong></>
        ) : (
          <>{aktif.length} tahun ajaran aktif: <strong>{aktif.map(ta => ta.nama).join(', ')}</strong></>
        )}
      </p>
    </div>
  )
}
