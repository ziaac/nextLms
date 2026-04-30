'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { CheckCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui'
import { useMarkAllAsRead, useClearReadNotifikasi } from '@/hooks/notifikasi'
import { NotifikasiFilter } from './NotifikasiFilter'
import { NotifikasiList } from './NotifikasiList'
import type { NotifikasiQueryParams } from '@/types/notifikasi.types'
import type { TipeNotifikasi } from '@/types/enums'

export function NotifikasiPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  const markAllAsRead = useMarkAllAsRead()
  const clearRead = useClearReadNotifikasi()

  // Baca filter dari search params
  const tipeParam = searchParams.get('tipe') as TipeNotifikasi | null
  const isReadParam = searchParams.get('isRead')
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10)

  const queryParams: NotifikasiQueryParams = {
    page: pageParam,
    limit: 20,
    ...(tipeParam && { tipe: tipeParam }),
    ...(isReadParam !== null && isReadParam !== '' && {
      isRead: isReadParam === 'true',
    }),
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`/dashboard/notifikasi?${params.toString()}`)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate(undefined, {
      onSuccess: (data) => toast.success(data.message),
      onError: () => toast.error('Gagal menandai semua notifikasi'),
    })
  }

  const handleClearRead = () => {
    clearRead.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(data.message)
        setShowConfirmClear(false)
      },
      onError: () => {
        toast.error('Gagal menghapus notifikasi')
        setShowConfirmClear(false)
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notifikasi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Semua notifikasi dan pemberitahuan Anda
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
            className="flex items-center gap-1.5"
          >
            <CheckCheck size={14} />
            Tandai semua dibaca
          </Button>

          {!showConfirmClear ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmClear(true)}
              className="flex items-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/40 dark:hover:bg-red-900/20"
            >
              <Trash2 size={14} />
              Hapus yang sudah dibaca
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Yakin?</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearRead}
                disabled={clearRead.isPending}
                className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400"
              >
                Ya, hapus
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmClear(false)}
              >
                Batal
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filter */}
      <NotifikasiFilter />

      {/* List */}
      <NotifikasiList
        params={queryParams}
        onPageChange={handlePageChange}
      />
    </div>
  )
}
