'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { KalenderGrid } from '@/components/kalender/KalenderGrid'
import { KalenderLegenda } from '@/components/kalender/KalenderLegenda'
import { KalenderEventModal } from '@/components/kalender/KalenderEventModal'
import type { KalenderAkademik, TipeKalender } from '@/types/kalender-akademik.types'

const BULAN_NAMA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

interface Props {
  initialData: KalenderAkademik[]
  initialBulan: number
  initialTahun: number
}

export function KalenderPublikContent({ initialData, initialBulan, initialTahun }: Props) {
  const [bulan, setBulan] = useState(initialBulan)
  const [tahun, setTahun] = useState(initialTahun)
  const [filterTipe, setFilterTipe] = useState<TipeKalender | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<KalenderAkademik | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Fetch data kalender untuk bulan yang dipilih
  // Note: Untuk halaman publik, kita gunakan publicApi.kalenderPublik
  const { data: events = initialData, isLoading } = useQuery({
    queryKey: ['kalender-publik', bulan, tahun],
    queryFn: async () => {
      // Import publicApi di sini untuk client component
      const { publicApi } = await import('@/lib/api/public.api')
      return publicApi.kalenderPublik({ bulan, tahun })
    },
    initialData: bulan === initialBulan && tahun === initialTahun ? initialData : undefined,
    staleTime: 5 * 60 * 1000,
  })

  // Navigasi bulan
  const handlePrevMonth = () => {
    if (bulan === 1) {
      setBulan(12)
      setTahun(tahun - 1)
    } else {
      setBulan(bulan - 1)
    }
  }

  const handleNextMonth = () => {
    if (bulan === 12) {
      setBulan(1)
      setTahun(tahun + 1)
    } else {
      setBulan(bulan + 1)
    }
  }

  const handleEventClick = (event: KalenderAkademik) => {
    setSelectedEvent(event)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedEvent(null)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header dengan navigasi bulan */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white min-w-[200px] text-center">
            {BULAN_NAMA[bulan - 1]} {tahun}
          </h2>
          
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Tombol kembali ke bulan ini */}
        <button
          type="button"
          onClick={() => {
            const now = new Date()
            setBulan(now.getMonth() + 1)
            setTahun(now.getFullYear())
          }}
          className="px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
        >
          Bulan Ini
        </button>
      </div>

      {/* Filter legenda */}
      <div className="mb-6">
        <KalenderLegenda filterTipe={filterTipe} onFilterChange={setFilterTipe} />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
        </div>
      )}

      {/* Kalender grid */}
      {!isLoading && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <KalenderGrid
            tahun={tahun}
            bulan={bulan}
            events={events}
            filterTipe={filterTipe}
            canEdit={false} // Public view - no edit
            onEventClick={handleEventClick}
            onEditClick={() => {}} // No-op
            onDeleteClick={() => {}} // No-op
          />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && events.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Tidak Ada Event
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Belum ada event yang dijadwalkan untuk bulan ini.
          </p>
        </div>
      )}

      {/* Detail modal */}
      {selectedEvent && (
        <KalenderEventModal
          open={modalOpen}
          onClose={handleCloseModal}
          mode="detail"
          event={selectedEvent}
          tahunAjaranId="" // Not needed for detail view
        />
      )}
    </div>
  )
}
