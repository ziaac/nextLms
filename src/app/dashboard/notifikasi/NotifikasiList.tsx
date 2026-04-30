'use client'

import { Bell } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton, Pagination } from '@/components/ui'
import { useNotifikasi } from '@/hooks/notifikasi'
import { NotifikasiItem } from './NotifikasiItem'
import type { NotifikasiQueryParams } from '@/types/notifikasi.types'

interface NotifikasiListProps {
  params: NotifikasiQueryParams
  onPageChange: (page: number) => void
}

export function NotifikasiList({ params, onPageChange }: NotifikasiListProps) {
  const { data, isLoading, isError } = useNotifikasi(params)

  if (isError) {
    toast.error('Gagal memuat notifikasi')
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  const notifikasi = data?.data ?? []
  const meta = data?.meta

  if (notifikasi.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
        <Bell size={40} className="mb-3 opacity-30" />
        <p className="text-sm font-medium">Tidak ada notifikasi</p>
        <p className="text-xs mt-1 opacity-70">Notifikasi akan muncul di sini</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notifikasi.map((item) => (
        <NotifikasiItem key={item.id} item={item} />
      ))}

      {meta && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={meta.limit}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}
