'use client'

import { useEffect, useMemo } from 'react'
import { Select } from '@/components/ui'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
import { useKelasList } from '@/hooks/kelas/useKelas'
import type { Semester } from '@/types/tahun-ajaran.types'

interface SikapFilterBarProps {
  tahunAjaranId:       string
  semesterId:          string
  tingkatKelasId:      string
  kelasId:             string
  onTahunAjaranChange: (tahunAjaranId: string, semesterId: string) => void
  onTingkatChange:     (tingkatKelasId: string) => void
  onKelasChange:       (kelasId: string) => void
  // Mode terkunci: TA+Semester tidak bisa diubah, tampil sebagai label
  lockedLabel?:        string   // mis. "Semester Ganjil 2024/2025 (Aktif)"
  arsipMode?:          boolean
  arsipSemesterLabel?: string
}

export function SikapFilterBar({
  tahunAjaranId,
  semesterId,
  tingkatKelasId,
  kelasId,
  onTahunAjaranChange,
  onTingkatChange,
  onKelasChange,
  lockedLabel,
  arsipMode = false,
  arsipSemesterLabel,
}: SikapFilterBarProps) {
  // ── Data fetching ─────────────────────────────────────────────
  const { data: taListRaw = [] } = useTahunAjaranList()
  const taList = taListRaw as { id: string; nama: string; isActive: boolean }[]

  const { data: semListRaw = [] } = useSemesterByTahunAjaran(tahunAjaranId || null)
  const semList = semListRaw as Semester[]

  const { data: tingkatListRaw = [] } = useTingkatKelasList()
  const tingkatList = tingkatListRaw as { id: string; nama: string; jenjang: string; urutan: number }[]

  const { data: kelasListRaw = [] } = useKelasList(
    tahunAjaranId && tingkatKelasId
      ? { tahunAjaranId, tingkatKelasId }
      : undefined,
    !!(tahunAjaranId && tingkatKelasId),
  )
  const kelasList = kelasListRaw as { id: string; namaKelas: string }[]

  // ── Auto-select semester aktif saat TA berubah ────────────────
  useEffect(() => {
    if (arsipMode || !tahunAjaranId || semList.length === 0) return
    const aktif = semList.find((s) => s.isActive) ?? semList[0]
    if (aktif && aktif.id !== semesterId) {
      onTahunAjaranChange(tahunAjaranId, aktif.id)
    }
  // Intentional: semesterId dan onTahunAjaranChange dikeluarkan dari deps.
  // Effect ini hanya perlu berjalan saat daftar semester atau TA berubah.
  // Menambahkan semesterId akan menyebabkan loop karena effect mengubah nilai tersebut.
  // onTahunAjaranChange adalah prop callback yang tidak di-memoize.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semList, tahunAjaranId, arsipMode])

  // ── Options ───────────────────────────────────────────────────
  const taOptions = useMemo(
    () => taList.map((t) => ({ value: t.id, label: t.nama })),
    [taList],
  )

  const semOptions = useMemo(
    () => semList.map((s) => ({
      value: s.id,
      label: `Semester ${s.nama === 'GANJIL' ? 'Ganjil' : 'Genap'}${s.isActive ? ' (Aktif)' : ''}`,
    })),
    [semList],
  )

  const tingkatOptions = useMemo(
    () =>
      [...tingkatList]
        .sort((a, b) => a.urutan - b.urutan)
        .map((t) => ({ value: t.id, label: `Kelas ${t.nama}` })),
    [tingkatList],
  )

  const kelasOptions = useMemo(
    () => kelasList.map((k) => ({ value: k.id, label: k.namaKelas })),
    [kelasList],
  )

  // ── Handlers ──────────────────────────────────────────────────
  const handleTaChange = (e: { target: { value: string } }) => {
    const newTaId = e.target.value
    // Reset tingkat + kelas, semester akan di-auto-select via useEffect
    onTahunAjaranChange(newTaId, '')
    onTingkatChange('')
    onKelasChange('')
  }

  const handleSemChange = (e: { target: { value: string } }) => {
    onTahunAjaranChange(tahunAjaranId, e.target.value)
    onTingkatChange('')
    onKelasChange('')
  }

  const handleTingkatChange = (e: { target: { value: string } }) => {
    onTingkatChange(e.target.value)
    onKelasChange('')
  }

  const handleKelasChange = (e: { target: { value: string } }) => {
    onKelasChange(e.target.value)
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tahun Ajaran + Semester */}
        {lockedLabel ? (
          /* Mode terkunci — tampil sebagai label read-only */
          <div className="sm:col-span-2 flex items-start">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tahun Ajaran & Semester</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {lockedLabel}
                </p>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                  Aktif
                </span>
              </div>
            </div>
          </div>
        ) : !arsipMode ? (
          /* Mode bebas — dropdown TA + Semester */
          <>
            <Select
              label="Tahun Ajaran"
              placeholder="Pilih Tahun Ajaran"
              value={tahunAjaranId}
              onChange={handleTaChange}
              options={taOptions}
            />
            <Select
              label="Semester"
              placeholder="Pilih Semester"
              value={semesterId}
              onChange={handleSemChange}
              options={semOptions}
              disabled={!tahunAjaranId}
            />
          </>
        ) : (
          /* Mode arsip — label semester arsip */
          <div className="sm:col-span-2 flex items-end">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Semester</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {arsipSemesterLabel ?? '—'}
              </p>
            </div>
          </div>
        )}

        {/* Tingkat Kelas */}
        <Select
          label="Tingkat Kelas"
          placeholder="Pilih Tingkat"
          value={tingkatKelasId}
          onChange={handleTingkatChange}
          options={tingkatOptions}
          disabled={!semesterId && !arsipMode}
        />

        {/* Kelas */}
        <div>
          <Select
            label="Kelas"
            placeholder={
              !tingkatKelasId
                ? 'Pilih tingkat dulu'
                : kelasOptions.length === 0
                  ? 'Tidak ada kelas'
                  : 'Pilih Kelas'
            }
            value={kelasId}
            onChange={handleKelasChange}
            options={kelasOptions}
            disabled={!tingkatKelasId}
          />
          {tingkatKelasId && kelasOptions.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Tidak ada kelas tersedia untuk tingkat ini
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
