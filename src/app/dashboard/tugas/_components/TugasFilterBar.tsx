'use client'

import { useMemo }                 from 'react'
import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import { Combobox }                from '@/components/ui/Combobox'
import { useMataPelajaranList }    from '@/hooks/mata-pelajaran/useMataPelajaran'
import { TujuanTugas, BentukTugas } from '@/types/tugas.types'

interface Props {
  search:            string
  mapelTingkatId:    string   // ← baru
  kelasId:           string
  tujuan?:           TujuanTugas
  bentuk?:           BentukTugas
  guruId:            string
  onSearchChange:       (v: string) => void
  onMapelTingkatChange: (v: string) => void   // ← baru
  onKelasChange:        (v: string) => void
  onTujuanChange:       (v: TujuanTugas | '') => void
  onBentukChange:       (v: BentukTugas | '') => void
  onReset:              () => void
}

export function TugasFilterBar({
  search, mapelTingkatId, kelasId, tujuan, bentuk, guruId,
  onSearchChange, onMapelTingkatChange, onKelasChange, onTujuanChange, onBentukChange, onReset,
}: Props) {

  // ── Fetch mapel guru di semester aktif ──────────────────────────
  const { data: mapelData } = useMataPelajaranList(
    { guruId, semesterIsActive: true },   // fix: tambah semesterIsActive
    { enabled: !!guruId },
  )
  const mapelList = mapelData?.data ?? []

  // ── Mata Pelajaran options (unique by mataPelajaranTingkatId) ──
  const mapelTingkatOptions = useMemo(() => {
    const map = new Map<string, string>()
    mapelList.forEach((m) => {
      const mt = m.mataPelajaranTingkat
      if (mt?.id) map.set(mt.id, mt.masterMapel?.nama ?? mt.id)
    })
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [mapelList])

  // ── Kelas options — hanya kelas di mana guru mengajar mapel tsb ──
  const kelasOptions = useMemo(() => {
    const filtered = mapelTingkatId
      ? mapelList.filter((m) => m.mataPelajaranTingkatId === mapelTingkatId)
      : mapelList
    const map = new Map<string, string>()
    filtered.forEach((m) => {
      const kId   = (m as any).kelasId ?? m.kelas?.id
      const kNama = m.kelas?.namaKelas
      if (kId && kNama) map.set(kId, kNama)
    })
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [mapelList, mapelTingkatId])

  const tujuanOptions = [
    { value: '',                         label: 'Semua Tujuan' },
    { value: TujuanTugas.TUGAS_HARIAN,   label: 'Tugas Harian' },
    { value: TujuanTugas.PENGAYAAN,      label: 'Pengayaan' },
    { value: TujuanTugas.REMEDIAL,       label: 'Remedial' },
    { value: TujuanTugas.PROYEK,         label: 'Proyek' },
    { value: TujuanTugas.UTS,            label: 'UTS' },
    { value: TujuanTugas.UAS,            label: 'UAS' },
    { value: TujuanTugas.PORTOFOLIO,     label: 'Portofolio' },
    { value: TujuanTugas.PRAKTIKUM,      label: 'Praktikum' },
    { value: TujuanTugas.LAINNYA,        label: 'Lainnya' },
  ]

  const bentukOptions = [
    { value: '',                              label: 'Semua Bentuk' },
    { value: BentukTugas.FILE_SUBMISSION,     label: 'File Upload' },
    { value: BentukTugas.RICH_TEXT,           label: 'Ketik Langsung' },
    { value: BentukTugas.HYBRID,              label: 'Hybrid' },
    { value: BentukTugas.QUIZ_MULTIPLE_CHOICE, label: 'Quiz (PG)' },
    { value: BentukTugas.QUIZ_MIX,            label: 'Quiz (Mix)' },
  ]

  const hasFilter  = !!(search || mapelTingkatId || kelasId || tujuan || bentuk)
  const activeCount = [search, mapelTingkatId, kelasId, tujuan, bentuk].filter(Boolean).length

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
          <SlidersHorizontal className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          Filter
          {hasFilter && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">
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
        placeholder="Cari judul tugas..."
        className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

        {/* Mata Pelajaran */}
        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Mata Pelajaran</label>
          <Combobox
            options={[{ value: '', label: 'Semua Mapel' }, ...mapelTingkatOptions]}
            value={mapelTingkatId}
            onChange={(v) => { onMapelTingkatChange(v); onKelasChange('') }}
            searchOnly
            minSearchLength={0}
            placeholder="Pilih mapel..."
            className="w-full"
          />
        </div>

        {/* Kelas — dipersempit berdasarkan mapel yang dipilih */}
        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Kelas</label>
          <Combobox
            options={[{ value: '', label: 'Semua Kelas' }, ...kelasOptions]}
            value={kelasId}
            onChange={onKelasChange}
            searchOnly
            minSearchLength={0}
            placeholder="Pilih kelas..."
            className="w-full"
          />
        </div>

        {/* Tujuan */}
        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tujuan</label>
          <Combobox
            options={tujuanOptions}
            value={tujuan || ''}
            onChange={(v) => onTujuanChange((v as TujuanTugas) || '')}
            searchOnly
            minSearchLength={0}
            placeholder="Pilih Tujuan"
            className="w-full"
          />
        </div>

        {/* Bentuk */}
        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Bentuk</label>
          <Combobox
            options={bentukOptions}
            value={bentuk || ''}
            onChange={(v) => onBentukChange((v as BentukTugas) || '')}
            searchOnly
            minSearchLength={0}
            placeholder="Pilih Bentuk"
            className="w-full"
          />
        </div>

      </div>
    </div>
  )
}
