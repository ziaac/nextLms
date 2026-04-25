'use client'

import { useState, useMemo, Suspense } from 'react'
import { Plus, Trophy, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { useActiveSemesterLabel } from '@/hooks/semester/useSemester'
import { usePrestasiList, useDeletePrestasi, useVerifikasiPrestasi } from '@/hooks/prestasi/usePrestasi'
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox'
import { ConfirmModal } from '@/components/ui'
import { Spinner } from '@/components/ui/Spinner'
import { PrestasiCard } from './_components/PrestasiCard'
import { PrestasiFormModal } from './_components/PrestasiFormModal'
import { toast } from 'sonner'
import type { PrestasiItem, TingkatLomba, HasilPrestasi } from '@/types/prestasi.types'
import { TINGKAT_LABEL as TL, TINGKAT_COLOR } from '@/types/prestasi.types'

// ── Role constants ────────────────────────────────────────────────────────────
const ADMIN_ROLES    = ['SUPER_ADMIN', 'ADMIN']
const VERIFIER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'WALI_KELAS']

// ── Tingkat stat/filter order ─────────────────────────────────────────────────
const TINGKAT_STAT: TingkatLomba[] = [
  'INTERNASIONAL', 'NASIONAL', 'PROVINSI', 'KABUPATEN_KOTA', 'KECAMATAN', 'SEKOLAH',
]

const TINGKAT_FILTER_OPTIONS: ComboboxOption[] = [
  { value: '', label: 'Semua Tingkat' },
  ...TINGKAT_STAT.map((t) => ({ value: t, label: TL[t] })),
]

export default function PrestasiPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner /></div>}>
      <PrestasiContent />
    </Suspense>
  )
}

function PrestasiContent() {
  const { user }  = useAuthStore()
  const semLabel  = useActiveSemesterLabel()

  if (!user) return <div className="flex justify-center py-12"><Spinner /></div>

  const isSiswa   = user.role === 'SISWA'
  const isAdmin   = ADMIN_ROLES.includes(user.role)
  const canVerify = VERIFIER_ROLES.includes(user.role)

  // ── Filter state ──────────────────────────────────────────────
  const [tingkatFilter, setTingkatFilter] = useState<TingkatLomba | ''>('')
  const [hasilFilter,   setHasilFilter]   = useState<HasilPrestasi | ''>('')
  const [statusFilter,  setStatusFilter]  = useState<'' | 'verified' | 'pending'>('')
  const [page,          setPage]          = useState(1)

  // ── Modal state ───────────────────────────────────────────────
  const [formOpen,     setFormOpen]     = useState(false)
  const [editItem,     setEditItem]     = useState<PrestasiItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PrestasiItem | null>(null)
  const [verifyTarget, setVerifyTarget] = useState<PrestasiItem | null>(null)

  // ── Query ─────────────────────────────────────────────────────
  const queryParams = useMemo(() => ({
    limit: 50,
    ...(tingkatFilter  ? { tingkat: tingkatFilter }       : {}),
    ...(hasilFilter    ? { hasilPrestasi: hasilFilter }   : {}),
    ...(statusFilter === 'verified' ? { isVerified: true }  : {}),
    ...(statusFilter === 'pending'  ? { isVerified: false } : {}),
  }), [tingkatFilter, hasilFilter, statusFilter])

  const { data: listData, isLoading } = usePrestasiList(queryParams)
  const all = listData?.data ?? []

  // ── Stats ─────────────────────────────────────────────────────
  const { data: allDataRaw } = usePrestasiList({}, { enabled: isSiswa })
  const allItems = isSiswa ? (allDataRaw?.data ?? []) : all

  const stats = useMemo(() => {
    const base = isSiswa ? allItems : all
    return {
      total:     base.length,
      verified:  base.filter((p) => p.isVerified).length,
      pending:   base.filter((p) => !p.isVerified).length,
      byTingkat: TINGKAT_STAT.reduce<Partial<Record<TingkatLomba, number>>>((acc, t) => {
        const count = base.filter((p) => p.tingkat === t).length
        if (count > 0) acc[t] = count
        return acc
      }, {}),
    }
  }, [allItems, all, isSiswa])

  // ── Mutations ─────────────────────────────────────────────────
  const deleteMut = useDeletePrestasi()
  const verifyMut = useVerifikasiPrestasi()

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      toast.success('Prestasi berhasil dihapus')
      setDeleteTarget(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Gagal menghapus')
    }
  }

  const handleVerify = async () => {
    if (!verifyTarget) return
    try {
      await verifyMut.mutateAsync(verifyTarget.id)
      toast.success('Prestasi berhasil diverifikasi')
      setVerifyTarget(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Gagal verifikasi')
    }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {isSiswa ? 'Prestasi Saya' : 'Prestasi Siswa'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {semLabel ?? 'Memuat...'}
          </p>
        </div>
        {(isSiswa || canVerify) && (
          <button type="button"
            onClick={() => { setEditItem(null); setFormOpen(true) }}
            className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shrink-0">
            <Plus size={15} />
            <span className="hidden sm:inline">
              {isSiswa ? 'Ajukan Prestasi' : 'Input Prestasi'}
            </span>
          </button>
        )}
      </div>

      {/* ── Stats bar ───────────────────────────────────────── */}
      {!isLoading && stats.total > 0 && (
        <div
          className="overflow-x-auto -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          <div className="flex gap-2 items-stretch w-max pb-1">
            {/* Total */}
            <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2.5 min-w-[64px]">
              <div className="flex items-center gap-1">
                <Trophy size={12} className="text-amber-500" />
                <p className="text-sm font-bold tabular-nums text-gray-800 dark:text-gray-200">{stats.total}</p>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">Total</p>
            </div>
            <div className="w-px bg-gray-100 dark:bg-gray-800 self-stretch my-1" />
            {/* Verified */}
            <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/30 rounded-xl px-4 py-2.5 min-w-[64px]">
              <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{stats.verified}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap flex items-center gap-0.5">
                <ShieldCheck size={9} /> Verified
              </p>
            </div>
            {/* Pending */}
            {stats.pending > 0 && (
              <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-amber-100 dark:border-amber-900/30 rounded-xl px-4 py-2.5 min-w-[64px]">
                <p className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">{stats.pending}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">Menunggu</p>
              </div>
            )}
            <div className="w-px bg-gray-100 dark:bg-gray-800 self-stretch my-1" />
            {/* Per tingkat */}
            {TINGKAT_STAT.map((t) => {
              const count = stats.byTingkat[t]
              if (!count) return null
              return (
                <div key={t} className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-3.5 py-2.5 min-w-[56px]">
                  <p className="text-sm font-bold tabular-nums text-gray-700 dark:text-gray-300">{count}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">{TL[t]}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Filter bar ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Tingkat combobox */}
        <div className="w-44">
          <Combobox
            options={TINGKAT_FILTER_OPTIONS}
            value={tingkatFilter}
            onChange={(v) => { setTingkatFilter(v as TingkatLomba | ''); setPage(1) }}
            size="sm"
          />
        </div>

        {/* Status pills */}
        <div className="flex gap-1.5">
          {(['', 'verified', 'pending'] as const).map((s) => (
            <button key={s} type="button"
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                statusFilter === s
                  ? s === 'verified'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : s === 'pending'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
              )}>
              {s === '' ? 'Semua' : s === 'verified' ? 'Terverifikasi' : 'Menunggu'}
            </button>
          ))}
        </div>

        {all.length > 0 && (
          <p className="ml-auto text-xs text-gray-400">{all.length} prestasi</p>
        )}
      </div>

      {/* ── Card Grid ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : all.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
            <Trophy size={24} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Belum ada prestasi</p>
          {isSiswa && (
            <p className="text-xs text-gray-400 mt-1">
              Raih prestasi dan ajukan untuk dicatat di sini
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {all.map((item) => (
            <PrestasiCard
              key={item.id}
              item={item}
              isSiswa={isSiswa}
              canVerify={canVerify}
              canDeleteAny={isAdmin}
              currentUserId={user.id}
              onEdit={(i) => { setEditItem(i); setFormOpen(true) }}
              onDelete={setDeleteTarget}
              onVerify={setVerifyTarget}
            />
          ))}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────── */}
      <PrestasiFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null) }}
        editItem={editItem}
        siswaId={!isSiswa && canVerify ? undefined : user.id}
      />

      <ConfirmModal
        open={!!verifyTarget}
        onClose={() => setVerifyTarget(null)}
        onConfirm={handleVerify}
        title="Verifikasi Prestasi"
        confirmLabel="Ya, Verifikasi"
        isLoading={verifyMut.isPending}
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Verifikasi prestasi{' '}
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            &ldquo;{verifyTarget?.judul}&rdquo;
          </span>
          ?{' '}
          Setelah diverifikasi, siswa tidak dapat mengeditnya lagi.
        </p>
      </ConfirmModal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Prestasi"
        confirmLabel="Hapus"
        isLoading={deleteMut.isPending}
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Yakin ingin menghapus prestasi{' '}
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            &ldquo;{deleteTarget?.judul}&rdquo;
          </span>
          ?
        </p>
      </ConfirmModal>
    </div>
  )
}
