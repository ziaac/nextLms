'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, GraduationCap, User } from 'lucide-react'
import { Combobox } from '@/components/ui'
import type { ComboboxOption } from '@/components/ui/Combobox'
import { jadwalPublikApi } from '@/lib/api/jadwal-publik.api'
import { JadwalKelasMatrix } from './JadwalKelasMatrix'
import { JadwalGuruMatrix } from './JadwalGuruMatrix'
import type { NamaSemester } from '@/types/tahun-ajaran.types'

type ViewMode = 'kelas' | 'guru'

const NAMA_SEMESTER_LABEL: Record<NamaSemester, string> = {
  GANJIL: 'Ganjil',
  GENAP:  'Genap',
}

// ── Skeleton loaders ──────────────────────────────────────────────────────────
function MatrixSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-emerald-600/30 h-11" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex border-t border-gray-100 dark:border-gray-800">
            <div className="w-28 shrink-0 border-r border-gray-100 dark:border-gray-800 p-3">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-14 mb-1" />
              <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-10" />
            </div>
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex-1 p-2 border-r last:border-r-0 border-gray-100 dark:border-gray-800">
                <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-2 h-14">
                  <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mb-1.5" />
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/5" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main content ──────────────────────────────────────────────────────────────
export function JadwalPublikContent() {
  const [mode, setMode]             = useState<ViewMode>('kelas')
  const [semesterId, setSemesterId] = useState('')
  const [tingkatId, setTingkatId]   = useState('')
  const [kelasId, setKelasId]       = useState('')
  const [guruId, setGuruId]         = useState('')

  // ── Fetch filter data ─────────────────────────────────────────────────────
  const { data: semesterList = [], isLoading: loadingSem } = useQuery({
    queryKey: ['jadwal-publik', 'semester-aktif'],
    queryFn: jadwalPublikApi.getSemesterAktif,
    staleTime: 5 * 60 * 1000,
  })

  const { data: filterData, isLoading: loadingFilter } = useQuery({
    queryKey: ['jadwal-publik', 'tingkat-guru'],
    queryFn: jadwalPublikApi.getTingkatGuru,
    staleTime: 5 * 60 * 1000,
  })

  const { data: kelasList = [], isLoading: loadingKelas } = useQuery({
    queryKey: ['jadwal-publik', 'kelas', tingkatId],
    queryFn: () => jadwalPublikApi.getKelas(tingkatId || undefined),
    staleTime: 5 * 60 * 1000,
  })

  // ── Combobox options ──────────────────────────────────────────────────────
  const semesterOptions = useMemo<ComboboxOption[]>(() =>
    semesterList.map((s) => ({
      value: s.id,
      label: `${NAMA_SEMESTER_LABEL[s.nama]} — ${s.tahunAjaran.nama}`,
    })), [semesterList])

  const tingkatOptions = useMemo<ComboboxOption[]>(() => [
    { value: '', label: 'Semua Tingkat' },
    ...(filterData?.tingkat ?? []).map((t) => ({ value: t.id, label: t.nama })),
  ], [filterData])

  const kelasOptions = useMemo<ComboboxOption[]>(() =>
    kelasList.map((k) => ({
      value: k.id,
      label: k.namaKelas,
      hint:  tingkatId ? undefined : k.tingkatKelas.nama,
    })), [kelasList, tingkatId])

  const guruOptions = useMemo<ComboboxOption[]>(() =>
    (filterData?.guru ?? []).map((g) => ({
      value: g.id,
      label: g.namaLengkap,
      hint:  g.nip ?? undefined,
    })), [filterData])

  // ── Auto-select semester ──────────────────────────────────────────────────
  useEffect(() => {
    if (semesterList.length > 0 && !semesterId) {
      setSemesterId(semesterList[0].id)
    }
  }, [semesterList, semesterId])

  // ── Reset downstream when filter changes ─────────────────────────────────
  useEffect(() => { setKelasId('') }, [tingkatId])
  useEffect(() => { setTingkatId(''); setKelasId(''); setGuruId('') }, [mode])

  // ── Fetch roster ─────────────────────────────────────────────────────────
  const enableRosterKelas = mode === 'kelas' && !!kelasId && !!semesterId
  const enableRosterGuru  = mode === 'guru'  && !!guruId  && !!semesterId

  const { data: rosterKelas, isLoading: loadingRosterKelas, isError: errorRosterKelas } = useQuery({
    queryKey: ['jadwal-publik', 'roster-kelas', kelasId, semesterId],
    queryFn: () => jadwalPublikApi.getRosterKelas(kelasId, semesterId),
    enabled: enableRosterKelas,
    staleTime: 5 * 60 * 1000,
  })

  const { data: rosterGuru, isLoading: loadingRosterGuru, isError: errorRosterGuru } = useQuery({
    queryKey: ['jadwal-publik', 'roster-guru', guruId, semesterId],
    queryFn: () => jadwalPublikApi.getRosterGuru(guruId, semesterId),
    enabled: enableRosterGuru,
    staleTime: 5 * 60 * 1000,
  })

  // ── Derived display labels ────────────────────────────────────────────────
  const activeSemester = useMemo(
    () => semesterList.find((s) => s.id === semesterId),
    [semesterList, semesterId],
  )
  const selectedKelas = useMemo(
    () => kelasList.find((k) => k.id === kelasId),
    [kelasList, kelasId],
  )
  const selectedGuru = useMemo(
    () => filterData?.guru.find((g) => g.id === guruId),
    [filterData, guruId],
  )

  const isLoadingMatrix = mode === 'kelas' ? loadingRosterKelas : loadingRosterGuru
  const hasError        = mode === 'kelas' ? errorRosterKelas  : errorRosterGuru
  const showMatrix      = mode === 'kelas' ? !!rosterKelas : !!rosterGuru
  const needsSelection  = mode === 'kelas' ? !kelasId : !guruId

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">

      {/* ── Filter Panel ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">

        {/* Mode tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 w-fit mb-5">
          {([['kelas', GraduationCap, 'Per Kelas'], ['guru', User, 'Per Guru']] as const).map(([m, Icon, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m
                  ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Semester */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Semester</label>
            <Combobox
              options={semesterOptions}
              value={semesterId}
              onChange={setSemesterId}
              placeholder="Pilih semester..."
              disabled={loadingSem}
            />
          </div>

          {mode === 'kelas' ? (
            <>
              {/* Tingkat */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tingkat</label>
                <Combobox
                  options={tingkatOptions}
                  value={tingkatId}
                  onChange={setTingkatId}
                  placeholder="Semua tingkat"
                  disabled={loadingFilter}
                />
              </div>

              {/* Kelas */}
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Kelas</label>
                <Combobox
                  options={kelasOptions}
                  value={kelasId}
                  onChange={setKelasId}
                  placeholder="Pilih kelas..."
                  disabled={loadingKelas || kelasList.length === 0}
                  searchable={kelasList.length > 8}
                  searchPlaceholder="Cari kelas..."
                  minSearchLength={1}
                />
              </div>
            </>
          ) : (
            /* Guru */
            <div className="space-y-1.5 sm:col-span-3">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Guru</label>
              <Combobox
                options={guruOptions}
                value={guruId}
                onChange={setGuruId}
                placeholder="Pilih guru..."
                disabled={loadingFilter}
                searchable
                searchPlaceholder="Cari nama atau NIP..."
                minSearchLength={1}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Judul jadwal ─────────────────────────────────────────────────── */}
      {(showMatrix || isLoadingMatrix) && (
        <div>
          {mode === 'kelas' && selectedKelas ? (
            <>
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{selectedKelas.namaKelas}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedKelas.tingkatKelas.nama} · {activeSemester ? `Semester ${NAMA_SEMESTER_LABEL[activeSemester.nama]} ${activeSemester.tahunAjaran.nama}` : ''}
              </p>
            </>
          ) : mode === 'guru' && selectedGuru ? (
            <>
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{selectedGuru.namaLengkap}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedGuru.nip ?? 'Jadwal Mengajar'} · {activeSemester ? `Semester ${NAMA_SEMESTER_LABEL[activeSemester.nama]} ${activeSemester.tahunAjaran.nama}` : ''}
              </p>
            </>
          ) : null}
        </div>
      )}

      {/* ── Matrix Area ──────────────────────────────────────────────────── */}
      {isLoadingMatrix ? (
        <MatrixSkeleton />
      ) : hasError ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-400">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-sm font-medium">Gagal memuat jadwal</p>
          <p className="text-xs text-gray-400 mt-1">Periksa koneksi atau coba lagi</p>
        </div>
      ) : showMatrix && mode === 'kelas' && rosterKelas ? (
        <JadwalKelasMatrix roster={rosterKelas} />
      ) : showMatrix && mode === 'guru' && rosterGuru ? (
        <JadwalGuruMatrix roster={rosterGuru} />
      ) : needsSelection ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <CalendarDays className="h-8 w-8 text-emerald-400 dark:text-emerald-500" />
          </div>
          <p className="text-base font-medium text-gray-600 dark:text-gray-300">
            {mode === 'kelas' ? 'Pilih kelas untuk melihat jadwal' : 'Pilih guru untuk melihat jadwal mengajar'}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Gunakan filter di atas untuk memilih
          </p>
        </div>
      ) : null}
    </div>
  )
}
