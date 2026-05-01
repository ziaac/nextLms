'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SlideOver } from '@/components/ui'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { ChevronDown, ChevronRight, Archive, BookOpen } from 'lucide-react'
import type { Semester } from '@/types/tahun-ajaran.types'

interface SikapArsipSlideOverProps {
  open:              boolean
  onClose:           () => void
  activeSemesterId?: string   // semester aktif saat ini — dikecualikan dari list
}

interface TahunAjaranItem {
  id:       string
  nama:     string
  isActive: boolean
}

// ── Semester list per TA ──────────────────────────────────────────────────────

function SemesterList({
  tahunAjaranId,
  isActiveTa,
  activeSemesterId,
  onSelect,
}: {
  tahunAjaranId:    string
  isActiveTa:       boolean
  activeSemesterId?: string
  onSelect:         (semId: string) => void
}) {
  const { data: semListRaw = [], isLoading } = useSemesterByTahunAjaran(tahunAjaranId)
  const semList = semListRaw as Semester[]

  if (isLoading) {
    return (
      <div className="pl-4 py-2 space-y-1">
        {[1, 2].map((i) => (
          <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  // Untuk TA aktif: hanya tampilkan semester yang TIDAK aktif (bukan semester aktif saat ini)
  // Untuk TA non-aktif: tampilkan semua semester
  const visibleSemesters = isActiveTa
    ? semList.filter((s) => !s.isActive && s.id !== activeSemesterId)
    : semList

  if (visibleSemesters.length === 0) {
    return (
      <p className="pl-4 py-2 text-xs text-gray-400 italic">
        {isActiveTa ? 'Tidak ada semester arsip.' : 'Tidak ada semester.'}
      </p>
    )
  }

  return (
    <div className="pl-4 py-1 space-y-1">
      {visibleSemesters.map((sem) => (
        <button
          key={sem.id}
          type="button"
          onClick={() => onSelect(sem.id)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors group"
        >
          <BookOpen className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-500 shrink-0" />
          <span>Semester {sem.nama === 'GANJIL' ? 'Ganjil' : 'Genap'}</span>
        </button>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function SikapArsipSlideOver({ open, onClose, activeSemesterId }: SikapArsipSlideOverProps) {
  const router = useRouter()
  const [expandedTa, setExpandedTa] = useState<string | null>(null)

  const { data: taListRaw = [], isLoading } = useTahunAjaranList()
  const allTaList = taListRaw as TahunAjaranItem[]

  // Tampilkan semua TA, urutkan: aktif di atas, lalu non-aktif terbaru
  const taList = [...allTaList].sort((a, b) => {
    if (a.isActive && !b.isActive) return -1
    if (!a.isActive && b.isActive) return 1
    return b.nama.localeCompare(a.nama)
  })

  const handleSelectSemester = (semId: string) => {
    onClose()
    router.push(`/dashboard/sikap/arsip?semesterId=${semId}`)
  }

  // Cek apakah ada konten yang bisa ditampilkan
  const hasContent = taList.length > 0

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Arsip Catatan Sikap"
      description="Pilih semester untuk melihat data historis"
      width="sm"
    >
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !hasContent ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <Archive className="w-10 h-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-400">Belum ada data arsip.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {taList.map((ta) => (
            <div key={ta.id} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedTa(expandedTa === ta.id ? null : ta.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {ta.nama}
                  </span>
                  {ta.isActive && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                      Aktif
                    </span>
                  )}
                </div>
                {expandedTa === ta.id
                  ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                }
              </button>
              {expandedTa === ta.id && (
                <SemesterList
                  tahunAjaranId={ta.id}
                  isActiveTa={ta.isActive}
                  activeSemesterId={activeSemesterId}
                  onSelect={handleSelectSemester}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </SlideOver>
  )
}
