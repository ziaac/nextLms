'use client'

import { useState } from 'react'
import { Skeleton, ConfirmModal } from '@/components/ui'
import type { AktivitasInternalItem, TipeAktivitasInternal } from '@/types/guru-log.types'
import { formatTanggalLengkap } from '@/lib/helpers/timezone'
import {
  QrCode,
  BookOpen,
  ClipboardList,
  FolderOpen,
  BookMarked,
  Star,
  EyeOff,
} from 'lucide-react'

const TIPE_CONFIG: Record<TipeAktivitasInternal, { label: string; icon: React.ElementType; color: string }> = {
  ABSENSI:       { label: 'Absensi',        icon: QrCode,        color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
  MATERI:        { label: 'Materi',          icon: BookOpen,      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' },
  TUGAS:         { label: 'Tugas',           icon: ClipboardList, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
  DOKUMEN:       { label: 'Dokumen',         icon: FolderOpen,    color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30' },
  SIKAP:         { label: 'Catatan Sikap',   icon: BookMarked,    color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30' },
  DIMENSI_PROFIL:{ label: 'Dimensi Profil',  icon: Star,          color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' },
}

interface AktivitasInternalListProps {
  data:       AktivitasInternalItem[]
  isLoading:  boolean
  readonly?:  boolean
  onHide?:    (tipe: TipeAktivitasInternal, refId: string) => void
  isHiding?:  boolean
}

export function AktivitasInternalList({
  data,
  isLoading,
  readonly = false,
  onHide,
  isHiding = false,
}: AktivitasInternalListProps) {
  const [confirmItem, setConfirmItem] = useState<AktivitasInternalItem | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        Tidak ada aktivitas internal tercatat pada hari ini.
      </p>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {data.map((item) => {
          const cfg = TIPE_CONFIG[item.tipe] ?? TIPE_CONFIG.MATERI
          const Icon = cfg.icon
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 group"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{item.deskripsi}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {formatTanggalLengkap(item.waktu)}
                  </span>
                </div>
              </div>

              {/* Tombol sembunyikan — hanya tampil saat bukan readonly dan ada handler */}
              {!readonly && onHide && (
                <button
                  type="button"
                  title="Sembunyikan dari LCKH"
                  onClick={() => setConfirmItem(item)}
                  className="shrink-0 p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Konfirmasi sembunyikan */}
      <ConfirmModal
        open={!!confirmItem}
        onClose={() => setConfirmItem(null)}
        onConfirm={() => {
          if (confirmItem && onHide) {
            onHide(confirmItem.tipe, confirmItem.id)
          }
          setConfirmItem(null)
        }}
        title="Sembunyikan dari LCKH?"
        description="Aktivitas ini tidak akan tampil di laporan LCKH Anda. Data asli tidak dihapus dari sistem."
        confirmLabel="Sembunyikan"
        isLoading={isHiding}
        variant="warning"
      />
    </>
  )
}
