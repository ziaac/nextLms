'use client'

import { useState, useCallback, useEffect } from 'react'
import { PageHeader, Button, Pagination } from '@/components/ui'
import { RefreshCw, CheckSquare } from 'lucide-react'
import { useListGuruSummary } from '@/hooks/guru-log/useGuruLog'
import { GuruLckhFilterBar } from './_components/GuruLckhFilterBar'
import { GuruLckhTable }     from './_components/GuruLckhTable'
import { BulkApproveModal }  from './_components/BulkApproveModal'
import { toast } from 'sonner'
import type { GuruLckhSummaryItem } from '@/types/guru-log.types'

export default function LckhManajemenPage() {
  const now = new Date()

  const [bulan,       setBulan]       = useState(now.getMonth() + 1)
  const [tahun,       setTahun]       = useState(now.getFullYear())
  const [search,      setSearch]      = useState('')
  const [page,        setPage]        = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkOpen,    setBulkOpen]    = useState(false)

  const { data, isLoading, error, refetch, isFetching } = useListGuruSummary({
    bulan,
    tahun,
    search: search || undefined,
    page,
    limit: 20,
  })

  useEffect(() => {
    if (error) toast.error('Gagal memuat data LCKH guru')
  }, [error])

  // Reset page & selection saat filter berubah
  const handleBulanChange = (v: number) => { setBulan(v); setPage(1); setSelectedIds(new Set()) }
  const handleTahunChange = (v: number) => { setTahun(v); setPage(1); setSelectedIds(new Set()) }
  const handleSearchChange = useCallback((v: string) => {
    setSearch(v); setPage(1); setSelectedIds(new Set())
  }, [])

  const guruList = data?.data ?? []
  const meta     = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 }

  // Toggle select satu guru
  const handleToggleSelect = (guruId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(guruId)) next.delete(guruId)
      else next.add(guruId)
      return next
    })
  }

  // Toggle select semua guru yang punya pending
  const handleToggleAll = () => {
    const selectable = guruList.filter((g) => g.hariPending > 0)
    const allSelected = selectable.every((g) => selectedIds.has(g.guruId))
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(selectable.map((g) => g.guruId)))
    }
  }

  const selectedGuru: GuruLckhSummaryItem[] = guruList.filter((g) => selectedIds.has(g.guruId))

  return (
    <div className="space-y-5">
      <PageHeader
        title="LCKH Guru"
        description="Pantau dan verifikasi Laporan Capaian Kinerja Harian seluruh guru."
        actions={
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                onClick={() => setBulkOpen(true)}
              >
                <CheckSquare className="w-4 h-4 mr-1.5" />
                Setujui {selectedIds.size} Guru
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      />

      <GuruLckhFilterBar
        bulan={bulan}
        tahun={tahun}
        search={search}
        onBulanChange={handleBulanChange}
        onTahunChange={handleTahunChange}
        onSearchChange={handleSearchChange}
      />

      {/* Info count */}
      <p className="text-xs text-gray-400 -mt-2">
        Total{' '}
        <span className="font-medium text-gray-600 dark:text-gray-300">{meta.total} guru</span>
        {selectedIds.size > 0 && (
          <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium">
            · {selectedIds.size} dipilih
          </span>
        )}
      </p>

      <GuruLckhTable
        data={guruList}
        isLoading={isLoading}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleAll={handleToggleAll}
        bulan={bulan}
        tahun={tahun}
      />

      {meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={meta.limit}
          onPageChange={setPage}
        />
      )}

      <BulkApproveModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        selected={selectedGuru}
        onSuccess={() => {
          setSelectedIds(new Set())
          refetch()
        }}
      />
    </div>
  )
}
