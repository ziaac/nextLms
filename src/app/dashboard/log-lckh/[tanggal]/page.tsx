'use client'

import { use, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { PageHeader, Button, Skeleton } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'
import { isManajemen } from '@/lib/helpers/role'
import {
  useDetailHarian,
  useCreateEksternal,
  useUpdateEksternal,
  useDeleteEksternal,
  useHideInternal,
  useDownloadLckhPdf,
} from '@/hooks/guru-log/useGuruLog'
import { AktivitasInternalList } from '../_components/AktivitasInternalList'
import { AktivitasEksternalTable } from '../_components/AktivitasEksternalTable'
import { PersetujuanPanel } from '../_components/PersetujuanPanel'
import { toast } from 'sonner'
import { ArrowLeft, Printer } from 'lucide-react'
import { formatTanggalSaja } from '@/lib/helpers/timezone'

interface PageProps {
  params: Promise<{ tanggal: string }>
}

function LogDetailContent({ tanggal }: { tanggal: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()

  // Manajemen bisa lihat log guru lain via ?guruId=
  const queryGuruId = searchParams.get('guruId') ?? undefined
  const isViewingOther = isManajemen(user?.role) && !!queryGuruId
  const targetGuruId = queryGuruId ?? user?.id ?? ''

  const { data, isLoading, error } = useDetailHarian(tanggal, queryGuruId)

  const createMutation   = useCreateEksternal(tanggal)
  const updateMutation   = useUpdateEksternal(tanggal)
  const deleteMutation   = useDeleteEksternal(tanggal)
  const hideMutation     = useHideInternal(tanggal)
  const downloadMutation = useDownloadLckhPdf()

  useEffect(() => {
    if (error) toast.error('Gagal memuat data log harian')
  }, [error])

  // Readonly jika melihat log orang lain (manajemen view-only) atau bulan berbeda
  const today = new Date()
  const todayMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const isReadonly = isViewingOther || tanggal.slice(0, 7) < todayMonth

  const namaHari = data?.namaHari ?? ''
  const tanggalLabel = (() => {
    try { return formatTanggalSaja(new Date(`${tanggal}T12:00:00`)) }
    catch { return tanggal }
  })()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-0.5 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <PageHeader
            title={`Log LCKH — ${namaHari ? `${namaHari}, ` : ''}${tanggalLabel}`}
            description={isViewingOther ? 'Melihat log guru lain (mode baca)' : 'Detail aktivitas harian: internal sistem dan eksternal.'}
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadMutation.mutate({ tanggal, guruId: queryGuruId })}
                disabled={downloadMutation.isPending}
              >
                <Printer className="w-4 h-4 mr-1.5" />
                {downloadMutation.isPending ? 'Mengunduh...' : 'Cetak PDF'}
              </Button>
            }
          />
        </div>
      </div>

      {/* Status Persetujuan */}
      <section>
        <PersetujuanPanel tanggal={tanggal} guruId={targetGuruId} />
      </section>

      {/* Aktivitas Internal */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Aktivitas Internal Sistem</h2>
          {!isLoading && (
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {data?.aktivitasInternal.length ?? 0} aktivitas
            </span>
          )}
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          {isLoading
            ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
            : <AktivitasInternalList
                data={data?.aktivitasInternal ?? []}
                isLoading={false}
                readonly={isReadonly}
                onHide={isReadonly ? undefined : (tipe, refId) => hideMutation.mutate({ tipe, refId })}
                isHiding={hideMutation.isPending}
              />
          }
        </div>
      </section>

      {/* Aktivitas Eksternal */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Aktivitas Eksternal</h2>
          {!isLoading && (
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {data?.aktivitasEksternal.length ?? 0} aktivitas
            </span>
          )}
          {!isReadonly && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full font-medium">
              Dapat diedit
            </span>
          )}
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <AktivitasEksternalTable
            tanggal={tanggal}
            data={data?.aktivitasEksternal ?? []}
            isLoading={isLoading}
            onAdd={(payload) => createMutation.mutate(payload)}
            onUpdate={(id, payload) => updateMutation.mutate({ id, payload })}
            onDelete={(id) => deleteMutation.mutate(id)}
            isAdding={createMutation.isPending}
            isUpdating={updateMutation.isPending}
            isDeleting={deleteMutation.isPending}
            readonly={isReadonly}
          />
        </div>
      </section>
    </div>
  )
}

export default function LogDetailPage({ params }: PageProps) {
  const { tanggal } = use(params)
  return (
    <Suspense fallback={<Skeleton className="h-80 w-full rounded-2xl" />}>
      <LogDetailContent tanggal={tanggal} />
    </Suspense>
  )
}
