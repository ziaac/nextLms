'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, GraduationCap, User, BookOpen } from 'lucide-react'
import { ThemeToggle } from '@/components/dashboard/ThemeToggle'
import { Combobox } from '@/components/ui'
import type { ComboboxOption } from '@/components/ui/Combobox'
import { jadwalPublikApi } from '@/lib/api/jadwal-publik.api'
import { JadwalKelasMatrix } from './_components/JadwalKelasMatrix'
import { JadwalGuruMatrix } from './_components/JadwalGuruMatrix'
import type { NamaSemester } from '@/types/tahun-ajaran.types'

const LOGO_URL = 'https://storagelms.man2kotamakassar.sch.id/static-assets/static_logoman-150h.png'

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
                {Math.random() > 0.4 ? (
                  <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-2 h-14">
                    <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mb-1.5" />
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/5" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function JadwalPublikPage() {
  const [mode, setMode]               = useState<ViewMode>('kelas')
  const [semesterId, setSemesterId]   = useState('')
  const [tingkatId, setTingkatId]     = useState('')
  const [kelasId, setKelasId]         = useState('')
  const [guruId, setGuruId]           = useState('')
  const [logoError, setLogoError]     = useState(false)

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

  // ── Auto-select semester (urutan DESC sudah dari backend) ─────────────────
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
    <main className="min-h-screen bg-gradient-to-br from-emerald-50/60 via-white to-emerald-100/40 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/60 dark:border-gray-700/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">

          {/* Back button */}
          <Link
            href="/login"
            className="group flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Kembali</span>
          </Link>

          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

          {/* Logo + judul */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {!logoError ? (
              <img
                src={LOGO_URL}
                alt="Logo MAN 2"
                className="h-8 w-auto object-contain shrink-0"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">Jadwal Pelajaran</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">MAN 2 Kota Makassar</p>
            </div>
          </div>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Badge semester aktif */}
          {activeSemester && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 px-3 py-1.5 shrink-0">
              <CalendarDays className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {NAMA_SEMESTER_LABEL[activeSemester.nama]} · {activeSemester.tahunAjaran.nama}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* ── Filter Panel ─────────────────────────────────────────────────── */}
        <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-100/80 dark:border-gray-700/40 p-5">

          {/* Mode tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-700/60 w-fit mb-5">
            {([['kelas', GraduationCap, 'Per Kelas'], ['guru', User, 'Per Guru']] as const).map(([m, Icon, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
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
                <p className="text-xs text-gray-400 mt-0.5">{selectedKelas.tingkatKelas.nama} · {activeSemester ? `Semester ${NAMA_SEMESTER_LABEL[activeSemester.nama]} ${activeSemester.tahunAjaran.nama}` : ''}</p>
              </>
            ) : mode === 'guru' && selectedGuru ? (
              <>
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{selectedGuru.namaLengkap}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{selectedGuru.nip ?? 'Jadwal Mengajar'} · {activeSemester ? `Semester ${NAMA_SEMESTER_LABEL[activeSemester.nama]} ${activeSemester.tahunAjaran.nama}` : ''}</p>
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

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="pt-4 pb-2 text-center text-xs text-gray-300 dark:text-gray-600">
          LMS MAN 2 Kota Makassar · Jadwal Publik
        </footer>
      </div>
    </main>
  )
}
