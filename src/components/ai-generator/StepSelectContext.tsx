'use client'

import { useEffect, useMemo } from 'react'
import { Select } from '@/components/ui'
import { Calendar } from 'lucide-react'
import { useSemesterOptions } from '@/hooks/semester/useSemester'
import { useMataPelajaranList } from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useAuthStore } from '@/stores/auth.store'

export interface ContextValue {
  tahunAjaranId:          string
  semesterId:             string
  tingkatKelasId:         string
  mataPelajaranTingkatId: string
  /** ID unik MataPelajaran (per kelas) — untuk label dropdown yang memuat nama kelas */
  mataPelajaranId:        string
}

interface Props {
  value:    ContextValue
  onChange: (val: ContextValue) => void
}

export function StepSelectContext({ value, onChange }: Props) {
  const user = useAuthStore((s) => s.user)
  const { activeSem, taAktif, isLoading: loadingSem } = useSemesterOptions()

  // Auto-set TA + Semester aktif ke dalam context value
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!taAktif?.id || !activeSem?.id) return
    if (value.tahunAjaranId === taAktif.id && value.semesterId === activeSem.id) return
    onChange({
      tahunAjaranId:          taAktif.id,
      semesterId:             activeSem.id,
      tingkatKelasId:         '',
      mataPelajaranTingkatId: '',
      mataPelajaranId:        '',
    })
  }, [taAktif?.id, activeSem?.id])

  // Semua mata pelajaran guru di semester aktif
  const { data: mapelData, isLoading: loadingMapel } = useMataPelajaranList(
    { guruId: user?.id, semesterId: activeSem?.id, limit: 100 },
    { enabled: !!user?.id && !!activeSem?.id },
  )
  const allMapel = mapelData?.data ?? []

  // Derive unique tingkat dari daftar mapel guru
  const tingkatOptions = useMemo(() => {
    const seen = new Set<string>()
    const opts: { value: string; label: string }[] = []
    for (const mp of allMapel) {
      const tk = mp.mataPelajaranTingkat?.tingkatKelas
      if (tk && !seen.has(tk.id)) {
        seen.add(tk.id)
        opts.push({ value: tk.id, label: tk.nama })
      }
    }
    return opts
  }, [allMapel])

  // Filter mapel berdasarkan tingkat yang dipilih
  // Gunakan mp.id sebagai value agar tiap baris unik (satu guru bisa mengampu
  // mapel yang sama di kelas berbeda, mis. Fisika X-A dan Fisika X-B).
  const mapelOptions = useMemo(() => {
    if (!value.tingkatKelasId) return []
    return allMapel
      .filter((mp) => mp.mataPelajaranTingkat?.tingkatKelasId === value.tingkatKelasId)
      .map((mp) => ({
        value: mp.id,
        label: [
          mp.mataPelajaranTingkat?.masterMapel?.nama ?? mp.id,
          mp.kelas?.namaKelas,
        ]
          .filter(Boolean)
          .join(' — '),
      }))
  }, [allMapel, value.tingkatKelasId])

  const semLabel =
    taAktif && activeSem
      ? `${taAktif.nama} — Semester ${activeSem.nama === 'GANJIL' ? 'Ganjil' : 'Genap'}`
      : null

  const noMapel = !loadingMapel && !loadingSem && activeSem && allMapel.length === 0

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Pilih Konteks Pembelajaran
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Pilih tingkat kelas dan mata pelajaran yang Anda ampu.
        </p>
      </div>

      {/* Badge semester aktif (read-only) */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
        <Calendar size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {loadingSem ? 'Memuat semester aktif…' : semLabel ?? 'Belum ada semester aktif'}
        </span>
      </div>

      {noMapel ? (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/20 px-4 py-5 text-center text-sm text-amber-700 dark:text-amber-400">
          Tidak ada mata pelajaran yang ditugaskan untuk semester ini.
          Hubungi admin untuk memastikan Anda sudah ditetapkan sebagai guru pengampu.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tingkat Kelas"
            placeholder={loadingMapel ? 'Memuat…' : 'Pilih tingkat kelas'}
            options={tingkatOptions}
            value={value.tingkatKelasId}
            disabled={loadingMapel || loadingSem || tingkatOptions.length === 0}
            onChange={(e) =>
              onChange({
                ...value,
                tingkatKelasId:         e.target.value,
                mataPelajaranTingkatId: '',
                mataPelajaranId:        '',
              })
            }
          />
          <Select
            label="Mata Pelajaran"
            placeholder="Pilih mata pelajaran"
            options={mapelOptions}
            value={value.mataPelajaranId}
            disabled={!value.tingkatKelasId || mapelOptions.length === 0}
            onChange={(e) => {
              const selectedId = e.target.value
              const selected = allMapel.find((mp) => mp.id === selectedId)
              onChange({
                ...value,
                mataPelajaranId:        selectedId,
                mataPelajaranTingkatId: selected?.mataPelajaranTingkatId ?? '',
              })
            }}
          />
        </div>
      )}
    </div>
  )
}
