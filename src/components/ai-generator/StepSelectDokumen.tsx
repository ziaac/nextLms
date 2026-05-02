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

export function StepSelectDokumen({ semesterId, tahunAjaranId, selectedIds, onChange }: Props) {
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
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Pilih Dokumen Pengajaran (Opsional)
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          AI akan menggunakan dokumen yang dipilih sebagai konteks (RAG). Kosongkan untuk skip.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : dokumenList.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          <FileText className="mx-auto h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">Belum ada dokumen pengajaran untuk konteks ini.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
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

      <p className="text-xs text-gray-400">
        {selectedIds.length} dokumen dipilih
      </p>
    </div>
  )
}
