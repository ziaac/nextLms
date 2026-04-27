'use client'

import { useState, useMemo } from 'react'
import {
  Plus, Pencil, Trash2, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, BookMarked, MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSemesterOptions } from '@/hooks/semester/useSemester'
import { useCatatanSikapList, useDeleteCatatanSikap } from '@/hooks/sikap/useSikap'
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox'
import { ConfirmModal } from '@/components/ui'
import { SikapFormModal } from './SikapFormModal'
import { Spinner } from '@/components/ui/Spinner'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import type { CatatanSikapItem, JenisSikap } from '@/types/sikap.types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15

function fmtTanggal(iso: string) {
  try { return format(new Date(iso), 'd MMM yyyy', { locale: localeId }) }
  catch { return iso }
}
function fmtWaktu(iso: string) {
  try { return format(new Date(iso), 'HH:mm') }
  catch { return '' }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function JenisChip({ jenis }: { jenis: JenisSikap }) {
  const isPos = jenis === 'POSITIF'
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
      isPos
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    )}>
      {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {isPos ? 'Positif' : 'Negatif'}
    </span>
  )
}

function PointBadge({ point, jenis }: { point: number; jenis: JenisSikap }) {
  const isPos = jenis === 'POSITIF'
  return (
    <span className={cn(
      'text-xs font-bold tabular-nums',
      isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
    )}>
      {isPos ? `+${point}` : `-${Math.abs(point)}`}
    </span>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

interface Props {
  currentUserId:   string
  canDeleteAny:    boolean   // ADMIN / SUPER_ADMIN
}

export function SikapGuruView({ currentUserId, canDeleteAny }: Props) {
  // ── Filter state ──────────────────────────────────────────────
  const [semesterId,  setSemesterId]  = useState('')
  const [jenisFilter, setJenisFilter] = useState<JenisSikap | ''>('')
  const [page,        setPage]        = useState(1)

  // ── Modal state ───────────────────────────────────────────────
  const [formOpen,     setFormOpen]     = useState(false)
  const [editItem,     setEditItem]     = useState<CatatanSikapItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CatatanSikapItem | null>(null)

  // ── Remote data ───────────────────────────────────────────────
  const { options: semOptionsRaw } = useSemesterOptions()
  const semFilterOptions: ComboboxOption[] = useMemo(() => [
    { value: '', label: 'Semua Semester' },
    ...semOptionsRaw,
  ], [semOptionsRaw])

  const queryParams = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    ...(semesterId  ? { semesterId }  : {}),
    ...(jenisFilter ? { jenis: jenisFilter } : {}),
  }), [page, semesterId, jenisFilter])

  const { data: listData, isLoading } = useCatatanSikapList(queryParams)
  const rows = listData?.data ?? []
  const total = listData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const deleteMut = useDeleteCatatanSikap()

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      toast.success('Catatan berhasil dihapus')
      setDeleteTarget(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Gagal menghapus catatan')
    }
  }

  const openEdit = (item: CatatanSikapItem) => {
    setEditItem(item)
    setFormOpen(true)
  }

  const handleFilterChange = (fn: () => void) => { fn(); setPage(1) }

  return (
    <div className="space-y-5">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">Catatan Sikap</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Kelola catatan sikap &amp; disiplin siswa
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditItem(null); setFormOpen(true) }}
          className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shrink-0"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Tambah Catatan</span>
        </button>
      </div>

      {/* ── Filters ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Semester */}
        <div className="w-52">
          <Combobox
            options={semFilterOptions}
            value={semesterId}
            onChange={(v) => handleFilterChange(() => setSemesterId(v))}
            size="sm"
          />
        </div>

        {/* Jenis filter pills */}
        <div className="flex gap-1.5">
          {(['', 'POSITIF', 'NEGATIF'] as const).map((j) => (
            <button
              key={j}
              type="button"
              onClick={() => handleFilterChange(() => setJenisFilter(j))}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                jenisFilter === j
                  ? j === 'POSITIF'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : j === 'NEGATIF'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
              )}
            >
              {j === '' ? 'Semua' : j === 'POSITIF' ? 'Positif' : 'Negatif'}
            </button>
          ))}
        </div>

        {total > 0 && (
          <p className="ml-auto text-xs text-gray-400">
            {total} catatan
          </p>
        )}
      </div>

      {/* ── Table / Cards ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
            <BookMarked size={22} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Belum ada catatan</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Tanggal</th>
                  <th className="text-left px-4 py-3 font-medium">Siswa</th>
                  <th className="text-left px-4 py-3 font-medium">Kategori Sikap</th>
                  <th className="text-center px-4 py-3 font-medium">Jenis</th>
                  <th className="text-center px-4 py-3 font-medium">Poin</th>
                  <th className="text-left px-4 py-3 font-medium">Lokasi</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      <p>{fmtTanggal(row.tanggal)}</p>
                      <p className="text-gray-400">{fmtWaktu(row.waktu)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        {row.siswa?.profile?.namaLengkap ?? '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 dark:text-gray-300 font-medium">{row.masterSikap.nama}</p>
                      {row.masterSikap.kategori && (
                        <p className="text-xs text-gray-400">{row.masterSikap.kategori}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <JenisChip jenis={row.masterSikap.jenis} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <PointBadge point={row.masterSikap.point} jenis={row.masterSikap.jenis} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[120px] truncate">
                      {row.lokasi ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {(canDeleteAny || row.guruId === currentUserId) && (
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            title="Edit"
                            className="p-1.5 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(row)}
                            title="Hapus"
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                      {row.siswa?.profile?.namaLengkap ?? '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {row.masterSikap.nama}
                      {row.masterSikap.kategori ? ` · ${row.masterSikap.kategori}` : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <JenisChip jenis={row.masterSikap.jenis} />
                      <PointBadge point={row.masterSikap.point} jenis={row.masterSikap.jenis} />
                      <span className="text-[10px] text-gray-400">
                        {fmtTanggal(row.tanggal)} {fmtWaktu(row.waktu)}
                      </span>
                    </div>
                    {row.lokasi && (
                      <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <MapPin size={10} className="shrink-0" />
                        {row.lokasi}
                      </p>
                    )}
                  </div>
                  {(canDeleteAny || row.guruId === currentUserId) && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="p-2 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        className="p-2 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-400">
                Hal. {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modals ────────────────────────────────────────────── */}
      <SikapFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null) }}
        editItem={editItem}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Catatan Sikap"
        confirmLabel="Hapus"
        isLoading={deleteMut.isPending}
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Yakin ingin menghapus catatan{' '}
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            &ldquo;{deleteTarget?.masterSikap?.nama}&rdquo;
          </span>{' '}
          untuk{' '}
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {deleteTarget?.siswa?.profile?.namaLengkap ?? 'siswa ini'}
          </span>
          ?
        </p>
      </ConfirmModal>
    </div>
  )
}
