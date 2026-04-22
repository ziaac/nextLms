'use client'

import { useMemo }                 from 'react'
import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import { Select }                  from '@/components/ui'
import { Combobox }                from '@/components/ui/Combobox'
import { useMataPelajaranList }    from '@/hooks/mata-pelajaran/useMataPelajaran'
import type { TipeMateri }         from '@/types/materi-pelajaran.types'

const TIPE_OPTIONS = [
  { label: 'Semua Tipe',   value: '' },
  { label: 'Teks',         value: 'TEXT' },
  { label: 'PDF',          value: 'PDF' },
  { label: 'Slideshow',    value: 'SLIDESHOW' },
  { label: 'Audio',        value: 'AUDIO' },
  { label: 'YouTube',      value: 'VIDEO_YOUTUBE' },
]

const STATUS_OPTIONS = [
  { label: 'Semua Status', value: '' },
  { label: 'Draft',        value: 'false' },
  { label: 'Terpublikasi', value: 'true' },
]

interface Props {
  search:            string
  mapelTingkatId:    string
  kelasId:           string
  guruId:            string
  tipeMateri:        TipeMateri | ''
  isPublished:       '' | 'true' | 'false'
  onSearchChange:       (v: string) => void
  onMapelTingkatChange: (v: string) => void
  onKelasChange:        (v: string) => void
  onTipeChange:         (v: TipeMateri | '') => void
  onStatusChange:       (v: '' | 'true' | 'false') => void
  onReset:              () => void
}

export function MateriGuruFilterBar({
  search, mapelTingkatId, kelasId, guruId, tipeMateri, isPublished,
  onSearchChange, onMapelTingkatChange, onKelasChange, onTipeChange, onStatusChange, onReset,
}: Props) {

  // Ambil semua mata pelajaran milik guru ini (semester aktif)
  const { data: mapelData } = useMataPelajaranList(
    { guruId, semesterIsActive: true },
    { enabled: !!guruId },
  )
  const mapelList = mapelData?.data ?? []

  // MapelTingkat options (unique)
  const mapelTingkatOptions = useMemo(() => {
    const map = new Map<string, string>()
    mapelList.forEach((m) => {
      const mt = m.mataPelajaranTingkat
      if (mt?.id) map.set(mt.id, mt.masterMapel?.nama ?? mt.id)
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [mapelList])

  // Kelas options
  const kelasOptions = useMemo(() => {
    const filtered = mapelTingkatId
      ? mapelList.filter((m) => m.mataPelajaranTingkatId === mapelTingkatId)
      : mapelList
    const map = new Map<string, string>()
    filtered.forEach((m) => {
      if (m.kelasId) map.set(m.kelasId, m.kelas?.namaKelas ?? m.kelasId)
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [mapelList, mapelTingkatId])

  const hasFilter = !!(search || mapelTingkatId || kelasId || tipeMateri || isPublished)
  const activeCount = [search, mapelTingkatId, kelasId, tipeMateri, isPublished].filter(Boolean).length

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
          <SlidersHorizontal className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          Filter
          {hasFilter && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
              {activeCount}
            </span>
          )}
        </div>
        {hasFilter && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/50 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="h-3 w-3" />Reset
          </button>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Cari judul materi..."
        className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Mata Pelajaran */}
        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Mata Pelajaran</label>
          <Combobox
            options={[{ value: '', label: 'Semua Mapel' }, ...mapelTingkatOptions]}
            value={mapelTingkatId}
            onChange={(v) => { onMapelTingkatChange(v); onKelasChange('') }}
            searchOnly
            minSearchLength={0}
            placeholder="Cari mapel..."
            className="w-full"
          />
        </div>

        {/* Kelas */}
        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Kelas</label>
          <Combobox
            options={[{ value: '', label: 'Semua Kelas' }, ...kelasOptions]}
            value={kelasId}
            onChange={onKelasChange}
            searchOnly
            minSearchLength={0}
            placeholder="Cari kelas..."
            className="w-full"
          />
        </div>

        {/* Tipe */}
        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tipe Materi</label>
          <Select
            options={TIPE_OPTIONS}
            value={tipeMateri}
            onChange={(e) => onTipeChange(e.target.value as TipeMateri | '')}
            className="w-full"
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
          <Select
            options={STATUS_OPTIONS}
            value={isPublished}
            onChange={(e) => onStatusChange(e.target.value as '' | 'true' | 'false')}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}
