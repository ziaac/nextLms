'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { PageHeader, Button, Input, Select, Skeleton } from '@/components/ui'
import { Plus, Search } from 'lucide-react'
import { useMasterSikapList, useMasterSikapSummary } from '@/hooks/master-sikap/useMasterSikap'
import { MasterSikapTable } from './_components/MasterSikapTable'
import { MasterSikapFormModal } from './_components/MasterSikapFormModal'
import type { MasterSikap, JenisSikap } from '@/types/master-sikap.types'

const JENIS_OPTS = [
  { value: '',         label: 'Semua Jenis'  },
  { value: 'POSITIF',  label: '+ Positif'    },
  { value: 'NEGATIF',  label: '− Negatif'    },
]

const STATUS_OPTS = [
  { value: '',      label: 'Semua Status' },
  { value: 'true',  label: 'Aktif'        },
  { value: 'false', label: 'Nonaktif'     },
]

export default function MasterSikapPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'

  const [search,     setSearch]     = useState('')
  const [jenis,      setJenis]      = useState<JenisSikap | ''>('')
  const [isActive,   setIsActive]   = useState<string>('')
  const [editTarget, setEditTarget] = useState<MasterSikap | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const params = {
    search:   search || undefined,
    jenis:    jenis   || undefined,
    isActive: isActive === '' ? undefined : isActive === 'true',
    limit:    100,
  }

  const { data, isLoading } = useMasterSikapList(params)
  const { data: summary }   = useMasterSikapSummary()

  const items = data?.data ?? []

  if (!user) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Sikap"
        description="Kelola referensi perilaku positif dan negatif untuk pencatatan sikap siswa"
        actions={
          isAdmin ? (
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Tambah
            </Button>
          ) : undefined
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',   value: summary?.total,       color: 'text-gray-800 dark:text-gray-200' },
          { label: 'Aktif',   value: summary?.totalActive, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Positif', value: summary?.positif,     color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Negatif', value: summary?.negatif,     color: 'text-red-600 dark:text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${color}`}>
              {value ?? <Skeleton className="h-7 w-10 rounded mt-1" />}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kode, nama, uraian..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
          />
        </div>
        <Select
          options={JENIS_OPTS}
          value={jenis}
          onChange={(e) => setJenis(e.target.value as JenisSikap | '')}
          className="w-36"
        />
        <Select
          options={STATUS_OPTS}
          value={isActive}
          onChange={(e) => setIsActive(e.target.value)}
          className="w-36"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <MasterSikapTable data={items} onEdit={setEditTarget} />
      )}

      {/* Modals */}
      <MasterSikapFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <MasterSikapFormModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        editData={editTarget}
      />
    </div>
  )
}
