'use client'

import { Skeleton } from '@/components/ui'
import { FileText } from 'lucide-react'
import { useDokumenPengajaranList } from '@/hooks/dokumen-pengajaran/useDokumenPengajaran'
import type { DokumenPengajaranItem } from '@/types/dokumen-pengajaran.types'
import { cn } from '@/lib/utils'

interface Props {
  semesterId:    string
  tahunAjaranId: string
  selectedIds:   string[]
  onChange:      (ids: string[]) => void
}

export function StepSelectDokumen({
  semesterId,
  tahunAjaranId,
  selectedIds,
  onChange,
}: Props) {
  const { data, isLoading } = useDokumenPengajaranList(
    {
      semesterId:    semesterId    || undefined,
      tahunAjaranId: tahunAjaranId || undefined,
      limit:         100,
    },
    { enabled: !!semesterId || !!tahunAjaranId },
  )

  const dokumenList: DokumenPengajaranItem[] = data?.data ?? []

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Pilih Dokumen Referensi
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          AI akan menggunakan dokumen pengajaran yang Anda pilih sebagai sumber konten.
          Pilih minimal <strong>1 dokumen</strong>.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : dokumenList.length === 0 ? (
        <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          <FileText className="mx-auto h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">Belum ada dokumen pengajaran untuk konteks ini.</p>
          <p className="text-xs mt-1 text-gray-400">
            Upload dokumen (buku ajar, silabus, dll.) melalui menu Dokumen Pengajaran.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {dokumenList.map((doc) => {
            const checked = selectedIds.includes(doc.id)
            return (
              <label
                key={doc.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  checked
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(doc.id)}
                  className="mt-0.5 accent-emerald-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {doc.judul}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {doc.jenisDokumen} · {new Date(doc.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </label>
            )
          })}
        </div>
      )}

      {/* Footer counter */}
      <p className={cn(
        'text-xs',
        selectedIds.length === 0 ? 'text-red-400' : 'text-gray-400',
      )}>
        {selectedIds.length === 0
          ? '⚠ Belum ada dokumen dipilih'
          : `${selectedIds.length} dokumen dipilih`}
      </p>
    </div>
  )
}
