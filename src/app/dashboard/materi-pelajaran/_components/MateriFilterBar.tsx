'use client'

import { useMemo }                      from 'react'
import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import { Select }                        from '@/components/ui'
import { Combobox }                      from '@/components/ui/Combobox'
import { useTahunAjaranList }            from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran }      from '@/hooks/semester/useSemester'
import { useTingkatKelasList }           from '@/hooks/tingkat-kelas/useTingkatKelas'
import { useMataPelajaranList }          from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useGuruList }                   from '@/hooks/mata-pelajaran/useMataPelajaran'
import type { TipeMateri }               from '@/types/materi-pelajaran.types'
import type { TingkatKelas }             from '@/types/akademik.types'

const TIPE_OPTIONS = [
  { label: 'Semua Tipe',    value: '' },
  { label: 'Teks',          value: 'TEXT' },
  { label: 'PDF',           value: 'PDF' },
  { label: 'Slideshow',     value: 'SLIDESHOW' },
  { label: 'Audio',         value: 'AUDIO' },
  { label: 'YouTube',       value: 'VIDEO_YOUTUBE' },
]

const STATUS_OPTIONS = [
  { label: 'Semua Status',  value: '' },
  { label: 'Draft',         value: 'false' },
  { label: 'Terpublikasi',  value: 'true' },
]

interface Props {
  search:         string
  tahunAjaranId:  string
  semesterId:     string
  tingkatKelasId: string
  mapelTingkatId: string
  kelasId:        string
  guruId:         string
  tipeMateri:     TipeMateri | ''
  isPublished:    '' | 'true' | 'false'
  onSearchChange:        (v: string) => void
  onTahunAjaranChange:   (v: string) => void
  onSemesterChange:      (v: string) => void
  onTingkatChange:       (v: string) => void
  onMapelTingkatChange:  (v: string) => void
  onKelasChange:         (v: string) => void
  onGuruChange:          (v: string) => void
  onTipeChange:          (v: TipeMateri | '') => void
  onStatusChange:        (v: '' | 'true' | 'false') => void
  onReset:               () => void
}

export function MateriFilterBar({
  search, tahunAjaranId, semesterId, tingkatKelasId, mapelTingkatId,
  kelasId, guruId, tipeMateri, isPublished,
  onSearchChange, onTahunAjaranChange, onSemesterChange, onTingkatChange,
  onMapelTingkatChange, onKelasChange, onGuruChange, onTipeChange,
  onStatusChange, onReset,
}: Props) {

  const { data: taRaw }     = useTahunAjaranList()
  const taList = (taRaw as { id: string; nama: string }[] | undefined) ?? []

  const { data: semRaw }    = useSemesterByTahunAjaran(tahunAjaranId || null)
  const semList = (semRaw as { id: string; nama: string }[] | undefined) ?? []

  const { data: tingkatRaw } = useTingkatKelasList()
  const tingkatList = (tingkatRaw as TingkatKelas[] | undefined) ?? []

  // Mapel list — untuk opsi MapelTingkat & Kelas (filter by tingkat+semester)
  const { data: mapelData } = useMataPelajaranList(
    semesterId ? {
      semesterId,
      ...(tingkatKelasId ? { tingkatKelasId } : {}),
      ...(guruId         ? { guruId }         : {}),
      limit: 200,
    } : undefined,
    { enabled: !!semesterId },
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

  // Kelas options (unique, filtered by mapelTingkat if set)
  const kelasOptions = useMemo(() => {
    const filtered = mapelTingkatId
      ? mapelList.filter((m) => m.mataPelajaranTingkatId === mapelTingkatId)
      : mapelList
    return filtered.map((m) => ({
      value: m.kelasId,
      label: m.kelas?.namaKelas ?? m.kelasId,
    }))
  }, [mapelList, mapelTingkatId])

  const { data: guruRaw } = useGuruList()
  const guruOptions = useMemo(() =>
    (guruRaw ?? []).map((g) => ({
      value: g.id,
      label: g.profile?.namaLengkap ?? g.username ?? g.id,
    })),
  [guruRaw])

  const hasFilter = !!(search || tahunAjaranId || semesterId || tingkatKelasId ||
    mapelTingkatId || kelasId || guruId || tipeMateri || isPublished)

  const activeCount = [search, tahunAjaranId, semesterId, tingkatKelasId,
    mapelTingkatId, kelasId, guruId, tipeMateri, isPublished]
    .filter(Boolean).length

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

      {/* Grid filter */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

        {/* Tahun Ajaran */}
        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tahun Ajaran</label>
          <Select
            options={[
              { label: 'Semua TA', value: '' },
              ...taList.map((t) => ({ label: t.nama, value: t.id })),
            ]}
            value={tahunAjaranId}
            onChange={(e) => { onTahunAjaranChange(e.target.value); onSemesterChange('') }}
            className="w-full"
          />
        </div>

        {/* Semester */}
        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Semester</label>
          <Select
            options={[
              { label: 'Semua Semester', value: '' },
              ...semList.map((s) => ({ label: s.nama, value: s.id })),
            ]}
            value={semesterId}
            onChange={(e) => { onSemesterChange(e.target.value); onMapelTingkatChange(''); onKelasChange('') }}
            disabled={!tahunAjaranId}
            className="w-full"
          />
        </div>

        {/* Tingkat */}
        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tingkat</label>
          <Select
            options={[
              { label: 'Semua Tingkat', value: '' },
              ...tingkatList.map((t) => ({ label: t.nama, value: t.id })),
            ]}
            value={tingkatKelasId}
            onChange={(e) => { onTingkatChange(e.target.value); onMapelTingkatChange(''); onKelasChange('') }}
            className="w-full"
          />
        </div>

        {/* Mata Pelajaran Tingkat */}
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

        {/* Guru */}
        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Guru</label>
          <Combobox
            options={[{ value: '', label: 'Semua Guru' }, ...guruOptions]}
            value={guruId}
            onChange={onGuruChange}
            searchOnly
            minSearchLength={0}
            placeholder="Cari guru..."
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
