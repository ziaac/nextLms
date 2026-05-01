'use client'

import { useMemo } from 'react'
import {
  KalenderAkademik,
  TipeKalender,
  expandEventRange,
  getKalenderDayBgColor,
} from '@/types/kalender-akademik.types'
import { formatTanggalKey } from '@/lib/helpers/timezone'
import { KalenderEventBadge } from './KalenderEventBadge'

const HARI_HEADER = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

interface KalenderGridProps {
  tahun: number
  bulan: number
  events: KalenderAkademik[]
  filterTipe: TipeKalender | null
  canEdit: boolean
  onEventClick: (event: KalenderAkademik) => void
  onEditClick: (event: KalenderAkademik) => void
  onDeleteClick: (event: KalenderAkademik) => void
}

export function KalenderGrid({
  tahun, bulan, events, filterTipe, canEdit,
  onEventClick, onEditClick, onDeleteClick,
}: KalenderGridProps) {
  // Build map: tanggal string → events[]
  const eventsByDate = useMemo(() => {
    const map = new Map<string, KalenderAkademik[]>()
    const filteredEvents = filterTipe
      ? events.filter((e) => e.tipe === filterTipe)
      : events

    for (const event of filteredEvents) {
      const dates = expandEventRange(event)
      for (const date of dates) {
        if (!map.has(date)) map.set(date, [])
        map.get(date)!.push(event)
      }
    }
    return map
  }, [events, filterTipe])

  // Generate hari dalam bulan
  const daysInMonth = useMemo(() => {
    const days: Date[] = []
    const d = new Date(tahun, bulan - 1, 1)
    while (d.getMonth() === bulan - 1) {
      days.push(new Date(d))
      d.setDate(d.getDate() + 1)
    }
    return days
  }, [tahun, bulan])

  // Padding awal: hari pertama bulan (0=Sen, 6=Min)
  const firstDayOfWeek = useMemo(() => {
    const day = new Date(tahun, bulan - 1, 1).getDay()
    // Konversi: JS Sunday=0 → kita Min=6, Monday=1 → kita Sen=0
    return day === 0 ? 6 : day - 1
  }, [tahun, bulan])

  const today = formatTanggalKey(new Date())

  return (
    <div className="w-full">
      {/* Header hari */}
      <div className="grid grid-cols-7 mb-1">
        {HARI_HEADER.map((h) => (
          <div
            key={h}
            className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
          >
            {h}
          </div>
        ))}
      </div>

      {/* Grid hari */}
      <div className="grid grid-cols-7 border-l border-t border-gray-200 dark:border-gray-700">
        {/* Padding kosong di awal */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div
            key={`pad-${i}`}
            className="border-r border-b border-gray-200 dark:border-gray-700 min-h-[100px] bg-gray-50 dark:bg-gray-900/50"
          />
        ))}

        {/* Hari-hari dalam bulan */}
        {daysInMonth.map((day) => {
          const dateStr = formatTanggalKey(day)
          const dayEvents = eventsByDate.get(dateStr) ?? []
          const bgColor = getKalenderDayBgColor(dayEvents)
          const isToday = dateStr === today

          return (
            <div
              key={dateStr}
              className={`border-r border-b border-gray-200 dark:border-gray-700 min-h-[100px] p-1.5 ${bgColor}`}
            >
              {/* Nomor tanggal */}
              <div
                className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {day.getDate()}
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {dayEvents.map((event) => (
                  <div key={event.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => onEventClick(event)}
                      className="w-full text-left"
                    >
                      <KalenderEventBadge
                        tipe={event.tipe}
                        isLibur={event.isLibur}
                        size="sm"
                      />
                    </button>
                    {canEdit && (
                      <div className="absolute right-0 top-0 hidden group-hover:flex gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onEditClick(event) }}
                          className="rounded p-0.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          aria-label={`Edit ${event.judul}`}
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onDeleteClick(event) }}
                          className="rounded p-0.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                          aria-label={`Hapus ${event.judul}`}
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
