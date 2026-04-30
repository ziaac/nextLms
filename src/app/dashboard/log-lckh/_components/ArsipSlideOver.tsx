'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SlideOver, Skeleton, Select } from '@/components/ui'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useArsipLog } from '@/hooks/guru-log/useGuruLog'
import type { ArsipBulanItem, HarianItem } from '@/types/guru-log.types'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface ArsipSlideOverProps {
  open:    boolean
  onClose: () => void
}

export function ArsipSlideOver({ open, onClose }: ArsipSlideOverProps) {
  const router = useRouter()
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const [expandedBulan, setExpandedBulan] = useState<string | null>(null)

  const { data: taList = [] } = useTahunAjaranList()

  const taOptions = (taList as { id: string; nama: string }[]).map((t) => ({
    value: t.id,
    label: t.nama,
  }))

  // Query arsip — semua semester dalam tahun ajaran yang dipilih
  const { data: arsipData = [], isLoading } = useArsipLog(
    tahunAjaranId ? { tahunAjaranId } : null,
  )

  const handleBulanClick = (key: string) => {
    setExpandedBulan(expandedBulan === key ? null : key)
  }

  const handleHariClick = (tanggal: string) => {
    onClose()
    router.push(`/dashboard/log-lckh/${tanggal}`)
  }

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Arsip Log LCKH"
      description="Riwayat log per tahun ajaran"
      width="md"
    >
      <div className="space-y-4">
        {/* Filter — hanya tahun ajaran */}
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
          <Select
            label="Tahun Ajaran"
            options={taOptions}
            value={tahunAjaranId}
            placeholder="Pilih tahun ajaran"
            onChange={(e) => {
              setTahunAjaranId(e.target.value)
              setExpandedBulan(null)
            }}
          />
        </div>

        {/* Content */}
        {!tahunAjaranId ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Pilih tahun ajaran untuk melihat arsip.
          </p>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : arsipData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Belum ada data arsip.
          </p>
        ) : (
          <div className="space-y-1">
            {arsipData.map((bulan: ArsipBulanItem, idx: number) => {
              const key        = `${bulan.tahun}-${bulan.bulan}-${idx}`
              const isExpanded = expandedBulan === key

              return (
                <div key={key} className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  {/* Baris bulan */}
                  <button
                    type="button"
                    onClick={() => handleBulanClick(key)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded
                        ? <ChevronDown  className="w-4 h-4 text-gray-400" />
                        : <ChevronRight className="w-4 h-4 text-gray-400" />
                      }
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {bulan.namaBulan} {bulan.tahun}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {bulan.totalAktivitas} aktivitas
                    </span>
                  </button>

                  {/* Expand: list hari yang ada aktivitas */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800/50">
                      {bulan.harian
                        .filter((h: HarianItem) => h.jumlahInternal > 0 || h.jumlahEksternal > 0)
                        .map((h: HarianItem) => {
                          const [, , d] = h.tanggal.split('-')
                          return (
                            <button
                              key={h.tanggal}
                              type="button"
                              onClick={() => handleHariClick(h.tanggal)}
                              className="w-full flex items-center justify-between px-4 py-2.5 pl-11 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
                            >
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {h.namaHari}, {parseInt(d, 10)} {bulan.namaBulan}
                              </span>
                              <span className="text-xs text-gray-400">
                                {h.jumlahInternal + h.jumlahEksternal} aktivitas
                              </span>
                            </button>
                          )
                        })}
                      {bulan.harian.every(
                        (h: HarianItem) => h.jumlahInternal === 0 && h.jumlahEksternal === 0,
                      ) && (
                        <p className="text-xs text-gray-400 text-center py-3 pl-11">
                          Tidak ada aktivitas di bulan ini.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </SlideOver>
  )
}
