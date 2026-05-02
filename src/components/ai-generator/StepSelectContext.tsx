'use client'

import { useMemo } from 'react'
import { Select } from '@/components/ui'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
import { useMapelTingkatByTingkat } from '@/hooks/mata-pelajaran/useMataPelajaran'

export interface ContextValue {
  tahunAjaranId:          string
  semesterId:             string
  tingkatKelasId:         string
  mataPelajaranTingkatId: string
}

interface Props {
  value:    ContextValue
  onChange: (val: ContextValue) => void
}

export function StepSelectContext({ value, onChange }: Props) {
  const { data: taList }      = useTahunAjaranList()
  const { data: tingkatList } = useTingkatKelasList()
  const { data: semList }     = useSemesterByTahunAjaran(value.tahunAjaranId || null)
  const { data: mtList }      = useMapelTingkatByTingkat(value.tingkatKelasId || null)

  const taOptions = useMemo(
    () =>
      ((taList ?? []) as { id: string; nama: string }[]).map((t) => ({
        value: t.id,
        label: t.nama,
      })),
    [taList],
  )

  const semOptions = useMemo(
    () =>
      ((semList ?? []) as { id: string; nama: string }[]).map((s) => ({
        value: s.id,
        label: s.nama,
      })),
    [semList],
  )

  const tingkatOptions = useMemo(
    () =>
      ((tingkatList ?? []) as { id: string; nama: string }[]).map((t) => ({
        value: t.id,
        label: t.nama,
      })),
    [tingkatList],
  )

  const mtOptions = useMemo(
    () =>
      ((mtList ?? []) as Array<{
        id:           string
        masterMapel?: { nama: string; kode?: string }
      }>).map((m) => ({
        value: m.id,
        label: m.masterMapel ? `${m.masterMapel.nama}${m.masterMapel.kode ? ` (${m.masterMapel.kode})` : ''}` : m.id,
      })),
    [mtList],
  )

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Pilih Konteks Pembelajaran
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Tentukan tahun ajaran, semester, tingkat kelas, dan mata pelajaran.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Tahun Ajaran"
          placeholder="Pilih tahun ajaran"
          options={taOptions}
          value={value.tahunAjaranId}
          onChange={(e) =>
            onChange({
              ...value,
              tahunAjaranId:          e.target.value,
              semesterId:             '',
            })
          }
        />
        <Select
          label="Semester"
          placeholder="Pilih semester"
          options={semOptions}
          value={value.semesterId}
          disabled={!value.tahunAjaranId}
          onChange={(e) => onChange({ ...value, semesterId: e.target.value })}
        />
        <Select
          label="Tingkat Kelas"
          placeholder="Pilih tingkat kelas"
          options={tingkatOptions}
          value={value.tingkatKelasId}
          onChange={(e) =>
            onChange({
              ...value,
              tingkatKelasId:         e.target.value,
              mataPelajaranTingkatId: '',
            })
          }
        />
        <Select
          label="Mata Pelajaran"
          placeholder="Pilih mata pelajaran"
          options={mtOptions}
          value={value.mataPelajaranTingkatId}
          disabled={!value.tingkatKelasId}
          onChange={(e) => onChange({ ...value, mataPelajaranTingkatId: e.target.value })}
        />
      </div>
    </div>
  )
}
