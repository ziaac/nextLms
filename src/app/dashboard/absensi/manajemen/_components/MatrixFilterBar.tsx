'use client'

import { useMemo }                  from 'react'
import { Combobox }                 from '@/components/ui/Combobox'
import type { ComboboxOption }      from '@/components/ui/Combobox'
import { useKelasList }             from '@/hooks/kelas/useKelas'
import { useMataPelajaranList }     from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useTahunAjaranList }       from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'

interface Props {
  // Controlled state dari parent
  tahunAjaranId:     string
  kelasId:           string
  semesterId:        string
  mataPelajaranId:   string
  // Callbacks — parent reset child saat parent berubah
  onTahunAjaranChange: (v: string) => void
  onKelasChange:       (v: string) => void
  onSemesterChange:    (v: string) => void
  onMapelChange:       (v: string) => void
}

export function MatrixFilterBar({
  tahunAjaranId, kelasId, semesterId, mataPelajaranId,
  onTahunAjaranChange, onKelasChange, onSemesterChange, onMapelChange,
}: Props) {

  // ── Data fetching — hierarki: TA → Kelas → Semester → Mapel ──────────────
  const { data: taListRaw }      = useTahunAjaranList()
  const { data: kelasData }      = useKelasList(
    tahunAjaranId ? { tahunAjaranId } : undefined,
  )
  const { data: semesterListRaw } = useSemesterByTahunAjaran(
    tahunAjaranId || null,
  )
  const { data: mapelData }      = useMataPelajaranList(
    kelasId && semesterId ? { kelasId, semesterId } : undefined,
  )

  // ── Options ───────────────────────────────────────────────────────────────

  const taOptions: ComboboxOption[] = useMemo(() => {
    const list = (taListRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? []
    return list.map((ta) => ({
      label: ta.nama + (ta.isActive ? ' ✓' : ''),
      value: ta.id,
    }))
  }, [taListRaw])

  const kelasOptions: ComboboxOption[] = useMemo(() => {
    const list = Array.isArray(kelasData)
      ? kelasData
      : (kelasData as { data?: { id: string; namaKelas: string }[] } | undefined)?.data ?? []
    return (list as { id: string; namaKelas: string }[]).map((k) => ({
      label: k.namaKelas,
      value: k.id,
    }))
  }, [kelasData])

  const semesterOptions: ComboboxOption[] = useMemo(() => {
    const list = (semesterListRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? []
    return list.map((s) => ({
      label: `Semester ${s.nama}` + (s.isActive ? ' (Aktif)' : ''),
      value: s.id,
    }))
  }, [semesterListRaw])

  const mapelOptions: ComboboxOption[] = useMemo(() => {
    const list = Array.isArray(mapelData)
      ? mapelData
      : (mapelData as { data?: unknown[] } | undefined)?.data ?? []
    return (list as { id: string; mataPelajaranTingkat?: { masterMapel?: { nama?: string } } }[])
      .map((m) => ({
        label: m.mataPelajaranTingkat?.masterMapel?.nama ?? m.id,
        value: m.id,
      }))
  }, [mapelData])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Filter Rekap
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

        {/* 1. Tahun Ajaran */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-500">
            Tahun Ajaran
          </label>
          <Combobox
            options={taOptions}
            value={tahunAjaranId}
            onChange={onTahunAjaranChange}
            placeholder="Pilih tahun ajaran..."
          />
        </div>

        {/* 2. Kelas — aktif setelah TA dipilih */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-500">
            Kelas
          </label>
          <Combobox
            options={kelasOptions}
            value={kelasId}
            onChange={onKelasChange}
            placeholder={tahunAjaranId ? 'Pilih kelas...' : 'Pilih tahun ajaran dulu'}
            disabled={!tahunAjaranId}
          />
        </div>

        {/* 3. Semester — aktif setelah TA dipilih */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-500">
            Semester
          </label>
          <Combobox
            options={semesterOptions}
            value={semesterId}
            onChange={onSemesterChange}
            placeholder={tahunAjaranId ? 'Pilih semester...' : 'Pilih tahun ajaran dulu'}
            disabled={!tahunAjaranId}
          />
        </div>

        {/* 4. Mata Pelajaran — aktif setelah Kelas + Semester dipilih */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-500">
            Mata Pelajaran
          </label>
          <Combobox
            options={mapelOptions}
            value={mataPelajaranId}
            onChange={onMapelChange}
            placeholder={
              !kelasId    ? 'Pilih kelas dulu' :
              !semesterId ? 'Pilih semester dulu' :
              'Pilih mata pelajaran...'
            }
            disabled={!kelasId || !semesterId}
          />
        </div>

      </div>
    </div>
  )
}
