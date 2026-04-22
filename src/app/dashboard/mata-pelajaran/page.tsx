'use client'

import { useState } from 'react'
import { PageHeader, Button } from '@/components/ui'
import { useMasterMapelList } from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useDebounce } from '@/hooks/useDebounce'
import MapelMasterTable from './_components/MapelMasterTable'
import MapelFormModal   from './_components/MapelFormModal'
import MapelFilters     from './_components/MapelFilters'
import type { MasterMapel, FilterMasterMapelParams } from '@/types/akademik.types'

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

export default function MataPelajaranPage() {
  const [filter,   setFilter]   = useState<FilterMasterMapelParams>({})
  const [formOpen, setFormOpen] = useState(false)
  const [editData, setEditData] = useState<MasterMapel | null>(null)

  const debouncedSearch = useDebounce(filter.search, 300)
  const activeFilter    = { ...filter, search: debouncedSearch || undefined }
  const { data, isLoading } = useMasterMapelList(activeFilter)

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title="Master Mata Pelajaran"
          description="Katalog induk mata pelajaran. Untuk pemetaan ke tingkat kelas, buka menu Mapel per Tingkat."
          actions={
            <Button onClick={() => { setEditData(null); setFormOpen(true) }}>
              <span className="flex items-center gap-1.5">
                <PlusIcon />
                Tambah Mapel
              </span>
            </Button>
          }
        />

        {data && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {data.length} mata pelajaran terdaftar
          </p>
        )}

        <MapelFilters filter={filter} onChange={setFilter} />

        <MapelMasterTable
          data={data ?? []}
          isLoading={isLoading}
          onEdit={(m) => { setEditData(m); setFormOpen(true) }}
        />
      </div>

      <MapelFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        data={editData}
      />
    </>
  )
}
