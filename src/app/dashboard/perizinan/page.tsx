'use client'

import { useState, useMemo } from 'react'
import { useAuthStore }           from '@/stores/auth.store'
import { PageHeader, Button }     from '@/components/ui'
import { Plus }                   from 'lucide-react'
import { usePerizinanList }       from '@/hooks/perizinan/usePerizinan'
import { PerizinanFilterBar }     from './_components/PerizinanFilterBar'
import { PerizinanTable }         from './_components/PerizinanTable'
import { PerizinanFormModal }     from './_components/PerizinanFormModal'
import { PerizinanDetailModal }   from './_components/PerizinanDetailModal'
import type { PerizinanItem }     from '@/types/perizinan.types'
import type { StatusPerizinan, JenisPerizinan } from '@/types/enums'

const MANAJEMEN_ROLES = [
  'SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH',
  'WAKIL_KEPALA', 'STAFF_TU',
]
const APPROVE_ROLES = [
  'SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH',
  'WAKIL_KEPALA', 'STAFF_TU', 'GURU',
]

export default function PerizinanPage() {
  const { user } = useAuthStore()

  const isSiswa    = user?.role === 'SISWA'
  const isManajemen = MANAJEMEN_ROLES.includes(user?.role ?? '')
  const canApprove  = APPROVE_ROLES.includes(user?.role ?? '')

  // ── Filter ────────────────────────────────────────────────────
  const [page,           setPage]           = useState(1)
  const [status,         setStatus]         = useState<StatusPerizinan | ''>('')
  const [jenis,          setJenis]          = useState<JenisPerizinan  | ''>('')
  const [tanggalMulai,   setTanggalMulai]   = useState('')
  const [tanggalSelesai, setTanggalSelesai] = useState('')

  // ── Modal ────────────────────────────────────────────────────
  const [formOpen,    setFormOpen]    = useState(false)
  const [detailItem,  setDetailItem]  = useState<PerizinanItem | null>(null)

  // ── Query params ─────────────────────────────────────────────
  const queryParams = useMemo(() => ({
    page,
    limit: 15,
    ...(isSiswa && user?.id ? { userId: user.id } : {}),
    ...(status         ? { status }         : {}),
    ...(jenis          ? { jenis }           : {}),
    ...(tanggalMulai   ? { tanggalMulai }    : {}),
    ...(tanggalSelesai ? { tanggalSelesai }  : {}),
  }), [page, status, jenis, tanggalMulai, tanggalSelesai, isSiswa, user?.id])

  const { data, isLoading } = usePerizinanList(queryParams)

  const perizinanList = data?.data ?? []
  const meta          = data?.meta ?? { total: 0, page: 1, limit: 15, lastPage: 1 }

  // ── Reset page saat filter berubah ───────────────────────────
  const handleFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v); setPage(1)
  }

  // ── Cek canDelete per item ────────────────────────────────────
  const canDeleteItem = (item: PerizinanItem) => {
    if (item.status !== 'PENDING') return false
    if (isManajemen) return true
    return item.userId === user?.id
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perizinan"
        description="Kelola pengajuan izin tidak hadir siswa"
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={() => setFormOpen(true)}>
            Ajukan Izin
          </Button>
        }
      />

      {/* Filter — sembunyikan filter tanggal untuk siswa */}
      <PerizinanFilterBar
        status={status}
        jenis={jenis}
        tanggalMulai={tanggalMulai}
        tanggalSelesai={tanggalSelesai}
        onStatusChange={handleFilterChange(setStatus)}
        onJenisChange={handleFilterChange(setJenis)}
        onTglMulaiChange={handleFilterChange(setTanggalMulai)}
        onTglSelesaiChange={handleFilterChange(setTanggalSelesai)}
      />

      {/* Info count */}
      <p className="text-xs text-gray-400 -mt-3">
        Total{' '}
        <span className="font-medium text-gray-600 dark:text-gray-300">
          {meta.total} perizinan
        </span>
      </p>

      <PerizinanTable
        data={perizinanList}
        meta={meta}
        isLoading={isLoading}
        page={page}
        onPageChange={setPage}
        onSelect={setDetailItem}
        showNama={!isSiswa}
      />

      <PerizinanFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        siswaId={isSiswa ? user?.id : undefined}
        isAdmin={!isSiswa}
      />

      <PerizinanDetailModal
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        item={detailItem}
        canApprove={canApprove && !isSiswa}
        canDelete={detailItem ? canDeleteItem(detailItem) : false}
        isSiswa={isSiswa}
      />
    </div>
  )
}
