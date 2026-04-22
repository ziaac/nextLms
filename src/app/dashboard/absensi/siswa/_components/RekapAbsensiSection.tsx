'use client'

import { useState }                  from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Spinner }                   from '@/components/ui/Spinner'
import { useMyRiwayatAbsensi }       from '@/hooks/absensi/useRekapSiswa'
import type { AbsensiHistoryItem }   from '@/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CLS: Record<string, string> = {
  HADIR:     'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20',
  TERLAMBAT: 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20',
  SAKIT:     'text-blue-700 bg-blue-50 dark:bg-blue-900/20',
  IZIN:      'text-purple-700 bg-purple-50 dark:bg-purple-900/20',
  ALPA:      'text-red-700 bg-red-50 dark:bg-red-900/20',
  TAP:       'text-orange-700 bg-orange-50 dark:bg-orange-900/20',
}

const STAT_KEYS: { key: string; label: string; color: string }[] = [
  { key: 'HADIR',     label: 'Hadir',     color: 'text-emerald-600' },
  { key: 'TERLAMBAT', label: 'Terlambat', color: 'text-yellow-600'  },
  { key: 'SAKIT',     label: 'Sakit',     color: 'text-blue-600'    },
  { key: 'IZIN',      label: 'Izin',      color: 'text-purple-600'  },
  { key: 'ALPA',      label: 'Alpa',      color: 'text-red-600'     },
]

const LIMIT = 15

// ── Component ─────────────────────────────────────────────────────────────────

export function RekapAbsensiSection() {
  const [page, setPage] = useState(1)

  // Default: semester aktif saja — isSemesterActive=true
  const { data: history, isLoading } = useMyRiwayatAbsensi({
    page,
    limit: LIMIT,
    isSemesterActive: true,
  })

  const items    = history?.data ?? []
  const meta     = history?.meta
  const lastPage = meta?.lastPage ?? 1
  const total    = meta?.total    ?? 0

  // Summary akumulatif dari meta (seluruh semester, bukan hanya page ini)
  const summary  = meta?.summary

  // Nama semester dari item pertama (jika tersedia)
  const namaSemester = items[0]?.jadwalPelajaran?.semester?.nama ?? null

  const fmtTgl = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      timeZone: 'Asia/Makassar',
    })

  return (
    <div className="space-y-4">

      {/* Header semester */}
      {namaSemester && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
            {namaSemester}
          </span>
          <span className="text-xs text-gray-400">Semester Aktif</span>
        </div>
      )}

      {/* Summary cards — dari meta.summary (akumulatif seluruh semester) */}
      {isLoading ? (
        <div className="grid grid-cols-5 gap-2">
          {STAT_KEYS.map(({ key }) => (
            <div key={key} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {STAT_KEYS.map(({ key, label, color }) => (
            <div
              key={key}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 text-center"
            >
              <p className={'text-2xl font-bold tabular-nums ' + color}>
                {summary ? (summary as unknown as Record<string, number>)[key] ?? 0 : 0}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Header list */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Riwayat Kehadiran
        </p>
        {total > 0 && (
          <span className="text-xs text-gray-400 tabular-nums">{total} total</span>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10"><Spinner /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8 italic">
          Belum ada riwayat kehadiran semester ini.
        </p>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
          {items.map((item: AbsensiHistoryItem) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.jadwalPelajaran?.mataPelajaran?.nama ?? 'Mata Pelajaran'}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                  <span>{fmtTgl(item.tanggal)}</span>
                  {item.jadwalPelajaran?.masterJam && (
                    <span>
                      {item.jadwalPelajaran.masterJam.jamMulai}
                      {' – '}
                      {item.jadwalPelajaran.masterJam.jamSelesai}
                    </span>
                  )}
                </div>
              </div>
              <span className={
                'text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ' +
                (STATUS_CLS[item.status] ?? 'text-gray-600 bg-gray-100')
              }>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between px-1">
          <PagBtn
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} />
          </PagBtn>
          <span className="text-xs text-gray-500 tabular-nums">
            Halaman {page} / {lastPage}
          </span>
          <PagBtn
            disabled={page >= lastPage}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
          >
            <ChevronRight size={14} />
          </PagBtn>
        </div>
      )}

    </div>
  )
}

// ── Pagination Button ─────────────────────────────────────────────────────────

function PagBtn({
  children, disabled, onClick,
}: {
  children: React.ReactNode; disabled?: boolean; onClick?: () => void
}) {
  return (
    <button
      type="button" disabled={disabled} onClick={onClick}
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-200 hover:text-emerald-600 transition-colors"
    >
      {children}
    </button>
  )
}
