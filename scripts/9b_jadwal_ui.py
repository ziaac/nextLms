#!/usr/bin/env python3
"""
BATCH 2 — JADWAL MANAJEMEN MAIN PAGE
Generates:
  1. src/app/dashboard/jadwal/page.tsx
  2. src/app/dashboard/jadwal/manajemen/page.tsx
  3. src/app/dashboard/jadwal/manajemen/_components/JadwalFilterBar.tsx
  4. src/app/dashboard/jadwal/manajemen/_components/KelasRingkasanTable.tsx
  5. src/app/dashboard/jadwal/manajemen/_components/JadwalPrintModal.tsx
  6. src/app/dashboard/jadwal/manajemen/_components/CopySemesterModal.tsx

Run from project root:
  python batch2_jadwal_manajemen.py
"""

import os

BASE = os.path.join("src")
FILES = {}

# ─────────────────────────────────────────────────────────────────
# 1. REDIRECT PAGE
# ─────────────────────────────────────────────────────────────────
FILES["app/dashboard/jadwal/page.tsx"] = '''\
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { isManajemen, isGuru } from '@/lib/helpers/role'
import { Spinner } from '@/components/ui'

export default function JadwalRedirectPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return
    if (isManajemen(user.role)) {
      router.replace('/dashboard/jadwal/manajemen')
    } else if (isGuru(user.role)) {
      router.replace('/dashboard/jadwal/guru')
    } else {
      router.replace('/dashboard/jadwal/kelas')
    }
  }, [user, router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner />
    </div>
  )
}
'''

# ─────────────────────────────────────────────────────────────────
# 2. MANAJEMEN PAGE
# ─────────────────────────────────────────────────────────────────
FILES["app/dashboard/jadwal/manajemen/page.tsx"] = '''\
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { isManajemen } from '@/lib/helpers/role'
import { useTahunAjaranActive, useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { useRingkasanSemuaKelas } from '@/hooks/jadwal/useJadwal'
import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
import { PageHeader, Spinner, Button } from '@/components/ui'
import { CalendarDays, Copy, Plus, Printer } from 'lucide-react'
import { JadwalFilterBar } from './_components/JadwalFilterBar'
import { KelasRingkasanTable } from './_components/KelasRingkasanTable'
import { JadwalPrintModal } from './_components/JadwalPrintModal'
import { CopySemesterModal } from './_components/CopySemesterModal'
import { PreModalKonfigurasi } from './buat-jadwal/_components/PreModalKonfigurasi'

export default function JadwalManajemenPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  // ── Access control ────────────────────────────────────────────
  const bolehAkses = isManajemen(user?.role)

  // ── Filter state ──────────────────────────────────────────────
  const [selectedTaId, setSelectedTaId]         = useState<string>('')
  const [selectedSemesterId, setSelectedSemId]  = useState<string>('')
  const [selectedTingkatId, setSelectedTingkat] = useState<string>('')
  const [search, setSearch]                     = useState('')

  // ── Modal state ───────────────────────────────────────────────
  const [printOpen, setPrintOpen]   = useState(false)
  const [copyOpen, setCopyOpen]     = useState(false)
  const [buatOpen, setBuatOpen]     = useState(false)

  // ── Data: TA aktif sebagai default ────────────────────────────
  const { data: taAktif, isLoading: loadingTa } = useTahunAjaranActive()
  const { data: taList }                         = useTahunAjaranList()

  // Resolve TA yang dipilih (fallback ke aktif)
  const resolvedTaId = selectedTaId || taAktif?.id || ''

  const { data: semesterList } = useSemesterByTahunAjaran(resolvedTaId || null)

  // Auto-select semester aktif saat TA berubah
  const resolvedSemesterId = useMemo(() => {
    if (selectedSemesterId) return selectedSemesterId
    if (!semesterList) return ''
    const aktif = semesterList.find((s) => s.isActive)
    return aktif?.id ?? semesterList[0]?.id ?? ''
  }, [selectedSemesterId, semesterList])

  const { data: tingkatList } = useTingkatKelasList()

  // ── Ringkasan kelas ───────────────────────────────────────────
  const ringkasanParams = useMemo(() => {
    if (!resolvedSemesterId) return null
    return {
      semesterId:    resolvedSemesterId,
      tingkatKelasId: selectedTingkatId || undefined,
    }
  }, [resolvedSemesterId, selectedTingkatId])

  const {
    data: ringkasanList,
    isLoading: loadingRingkasan,
    refetch,
  } = useRingkasanSemuaKelas(ringkasanParams)

  // ── Filtered by search ────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!ringkasanList) return []
    if (!search.trim()) return ringkasanList
    const q = search.toLowerCase()
    return ringkasanList.filter((k) =>
      k.namaKelas.toLowerCase().includes(q),
    )
  }, [ringkasanList, search])

  // ── Redirect jika tidak punya akses ───────────────────────────
  if (!user) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>
  if (!bolehAkses) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-gray-500">Anda tidak memiliki akses ke halaman ini.</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Jadwal Pelajaran"
        description="Kelola jadwal pelajaran per kelas untuk setiap semester"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCopyOpen(true)}
            >
              <Copy className="h-4 w-4 mr-1.5" />
              Copy dari Semester Lalu
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPrintOpen(true)}
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Cetak / Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setBuatOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Buat Jadwal Perkelas
            </Button>
          </div>
        }
      />

      {/* ── Filter Bar ── */}
      <JadwalFilterBar
        taList={taList ?? []}
        selectedTaId={resolvedTaId}
        onTaChange={(id) => { setSelectedTaId(id); setSelectedSemId('') }}
        semesterList={semesterList ?? []}
        selectedSemesterId={resolvedSemesterId}
        onSemesterChange={setSelectedSemId}
        tingkatList={tingkatList ?? []}
        selectedTingkatId={selectedTingkatId}
        onTingkatChange={setSelectedTingkat}
        search={search}
        onSearchChange={setSearch}
      />

      {/* ── Tabel Kelas ── */}
      <KelasRingkasanTable
        data={filtered}
        isLoading={loadingRingkasan || loadingTa}
        semesterId={resolvedSemesterId}
        onRefresh={refetch}
      />

      {/* ── Modals ── */}
      <JadwalPrintModal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        taList={taList ?? []}
        defaultTaId={resolvedTaId}
        defaultSemesterId={resolvedSemesterId}
      />

      <CopySemesterModal
        open={copyOpen}
        onClose={() => setCopyOpen(false)}
        taList={taList ?? []}
        onSuccess={() => { setCopyOpen(false); refetch() }}
      />

      {/* Pre-modal buat jadwal perkelas */}
      <PreModalKonfigurasi
        open={buatOpen}
        onClose={() => setBuatOpen(false)}
        onConfirm={(params) => {
          setBuatOpen(false)
          router.push(
            '/dashboard/jadwal/manajemen/buat-jadwal?' +
            'kelasId=' + params.kelasId +
            '&semesterId=' + params.semesterId +
            '&hariConfig=' + encodeURIComponent(JSON.stringify(params.hariConfig)),
          )
        }}
      />
    </div>
  )
}
'''

# ─────────────────────────────────────────────────────────────────
# 3. FILTER BAR
# ─────────────────────────────────────────────────────────────────
FILES["app/dashboard/jadwal/manajemen/_components/JadwalFilterBar.tsx"] = '''\
'use client'

import { Select, SearchInput } from '@/components/ui'

interface TaOption    { id: string; nama: string }
interface SmtOption   { id: string; nama: string; isActive: boolean }
interface TingkatOpt  { id: string; nama: string }

interface Props {
  taList:             TaOption[]
  selectedTaId:       string
  onTaChange:         (id: string) => void
  semesterList:       SmtOption[]
  selectedSemesterId: string
  onSemesterChange:   (id: string) => void
  tingkatList:        TingkatOpt[]
  selectedTingkatId:  string
  onTingkatChange:    (id: string) => void
  search:             string
  onSearchChange:     (v: string) => void
}

export function JadwalFilterBar({
  taList, selectedTaId, onTaChange,
  semesterList, selectedSemesterId, onSemesterChange,
  tingkatList, selectedTingkatId, onTingkatChange,
  search, onSearchChange,
}: Props) {
  const taOptions = taList.map((t) => ({ label: t.nama, value: t.id }))

  const smtOptions = semesterList.map((s) => ({
    label: s.nama + (s.isActive ? ' (Aktif)' : ''),
    value: s.id,
  }))

  const tingkatOptions = [
    { label: 'Semua Tingkat', value: '' },
    ...tingkatList.map((t) => ({ label: 'Kelas ' + t.nama, value: t.id })),
  ]

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Cari nama kelas..."
        className="w-56"
      />
      <Select
        options={taOptions}
        value={selectedTaId}
        onChange={(e) => onTaChange(e.target.value)}
        className="w-40"
      />
      <Select
        options={smtOptions}
        value={selectedSemesterId}
        onChange={(e) => onSemesterChange(e.target.value)}
        className="w-44"
      />
      <Select
        options={tingkatOptions}
        value={selectedTingkatId}
        onChange={(e) => onTingkatChange(e.target.value)}
        className="w-44"
      />
    </div>
  )
}
'''

# ─────────────────────────────────────────────────────────────────
# 4. KELAS RINGKASAN TABLE
# ─────────────────────────────────────────────────────────────────
FILES["app/dashboard/jadwal/manajemen/_components/KelasRingkasanTable.tsx"] = '''\
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Spinner } from '@/components/ui'
import { BookOpen, ChevronDown, ChevronRight, Clock, RefreshCw } from 'lucide-react'
import type { RingkasanKelasItem } from '@/types/jadwal.types'

interface Props {
  data:       RingkasanKelasItem[]
  isLoading:  boolean
  semesterId: string
  onRefresh:  () => void
}

export function KelasRingkasanTable({ data, isLoading, semesterId, onRefresh }: Props) {
  const router  = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpand = (kelasId: string) => {
    setExpandedId((prev) => (prev === kelasId ? null : kelasId))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
        <CalendarDaysIcon className="h-12 w-12 opacity-30" />
        <p className="text-sm">Belum ada data jadwal untuk semester ini.</p>
        <Button variant="secondary" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="grid grid-cols-[1fr_120px_140px_180px] gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        <span>Kelas</span>
        <span className="text-center">Total Jam</span>
        <span className="text-center">Mapel Terjadwal</span>
        <span className="text-right">Aksi</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {data.map((kelas) => (
          <div key={kelas.kelasId}>
            {/* Main row */}
            <div className="grid grid-cols-[1fr_120px_140px_180px] gap-4 px-5 py-3.5 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              {/* Nama Kelas */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleExpand(kelas.kelasId)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {expandedId === kelas.kelasId
                    ? <ChevronDown className="h-4 w-4" />
                    : <ChevronRight className="h-4 w-4" />
                  }
                </button>
                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {kelas.namaKelas}
                </span>
              </div>

              {/* Total Jam */}
              <div className="flex items-center justify-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {kelas.totalSemuaJam}
                </span>
                <span className="text-xs text-gray-400">jam</span>
              </div>

              {/* Jumlah Mapel */}
              <div className="flex justify-center">
                <Badge
                  variant={kelas.rincianPerMapel.length > 0 ? 'success' : 'warning'}
                  size="sm"
                >
                  {kelas.rincianPerMapel.length} mapel
                </Badge>
              </div>

              {/* Aksi */}
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => {
                    router.push('/dashboard/pembelajaran/manajemen?kelasId=' + kelas.kelasId)
                  }}
                >
                  <BookOpen className="h-3.5 w-3.5 mr-1" />
                  Mata Pelajaran
                </Button>
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => {
                    router.push(
                      '/dashboard/jadwal/manajemen/buat-jadwal?kelasId=' +
                      kelas.kelasId +
                      '&semesterId=' + semesterId
                    )
                  }}
                >
                  Atur Jadwal
                </Button>
              </div>
            </div>

            {/* Expanded: rincian per mapel */}
            {expandedId === kelas.kelasId && (
              <div className="bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-700 px-10 py-3">
                {kelas.rincianPerMapel.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">
                    Belum ada jadwal di kelas ini.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {kelas.rincianPerMapel.map((mapel) => (
                      <div
                        key={mapel.mapelId}
                        className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                            {mapel.namaMapel}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{mapel.guru}</p>
                        </div>
                        <Badge variant="info" size="sm" className="ml-2 shrink-0">
                          {mapel.totalJam} jam
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Local icon fallback
function CalendarDaysIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}
'''

# ─────────────────────────────────────────────────────────────────
# 5. PRINT MODAL
# ─────────────────────────────────────────────────────────────────
FILES["app/dashboard/jadwal/manajemen/_components/JadwalPrintModal.tsx"] = '''\
'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Modal, Button, Select, Spinner } from '@/components/ui'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
import { useKelasList } from '@/hooks/kelas/useKelas'
import { useGuruList } from '@/hooks/mata-pelajaran/useMataPelajaran'
import {
  useExportJadwalSekolah,
  useExportJadwalKelas,
  useExportJadwalGuru,
} from '@/hooks/jadwal/useJadwal'
import { Download, School, Users, User } from 'lucide-react'

type JenisExport = 'sekolah' | 'kelas' | 'guru'

interface TaOption { id: string; nama: string }

interface Props {
  open:               boolean
  onClose:            () => void
  taList:             TaOption[]
  defaultTaId:        string
  defaultSemesterId:  string
}

const FORM_ID = 'jadwal-print-form'

export function JadwalPrintModal({
  open, onClose, taList, defaultTaId, defaultSemesterId,
}: Props) {
  const [taId, setTaId]             = useState(defaultTaId)
  const [semesterId, setSemesterId] = useState(defaultSemesterId)
  const [tingkatId, setTingkatId]   = useState('')
  const [kelasId, setKelasId]       = useState('')
  const [guruId, setGuruId]         = useState('')
  const [jenis, setJenis]           = useState<JenisExport>('sekolah')

  const { data: semesterList } = useSemesterByTahunAjaran(taId || null)
  const { data: tingkatList }  = useTingkatKelasList()
  const { data: kelasList }    = useKelasList({ semesterId: semesterId || undefined, tingkatKelasId: tingkatId || undefined })
  const { data: guruList }     = useGuruList()

  const exportSekolah = useExportJadwalSekolah()
  const exportKelas   = useExportJadwalKelas()
  const exportGuru    = useExportJadwalGuru()

  const isLoading = exportSekolah.isPending || exportKelas.isPending || exportGuru.isPending

  const canDownload = useMemo(() => {
    if (!semesterId) return false
    if (jenis === 'kelas' && !kelasId) return false
    if (jenis === 'guru' && !guruId) return false
    return true
  }, [semesterId, jenis, kelasId, guruId])

  const handleDownload = async () => {
    if (!canDownload) return
    try {
      if (jenis === 'sekolah') {
        await exportSekolah.mutateAsync(semesterId)
        toast.success('Export jadwal sekolah berhasil')
      } else if (jenis === 'kelas') {
        await exportKelas.mutateAsync({ semesterId, kelasId })
        toast.success('Export jadwal kelas berhasil')
      } else {
        await exportGuru.mutateAsync({ semesterId, guruId: guruId || undefined })
        toast.success('Export jadwal guru berhasil')
      }
      onClose()
    } catch {
      toast.error('Gagal export jadwal')
    }
  }

  const taOptions   = taList.map((t) => ({ label: t.nama, value: t.id }))
  const smtOptions  = (semesterList ?? []).map((s) => ({
    label: s.nama + (s.isActive ? ' (Aktif)' : ''),
    value: s.id,
  }))
  const tingkatOpts = [
    { label: 'Semua Tingkat', value: '' },
    ...(tingkatList ?? []).map((t) => ({ label: 'Kelas ' + t.nama, value: t.id })),
  ]
  const kelasOpts = [
    { label: '— Pilih Kelas —', value: '' },
    ...(kelasList?.data ?? []).map((k: { id: string; namaKelas: string }) => ({
      label: k.namaKelas,
      value: k.id,
    })),
  ]
  const guruOpts = [
    { label: '— Pilih Guru —', value: '' },
    ...(guruList ?? []).map((g: { id: string; profile: { namaLengkap: string } }) => ({
      label: g.profile.namaLengkap,
      value: g.id,
    })),
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cetak / Export Jadwal"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            onClick={handleDownload}
            disabled={!canDownload || isLoading}
          >
            {isLoading ? <Spinner size="sm" className="mr-2" /> : <Download className="h-4 w-4 mr-1.5" />}
            Download Excel
          </Button>
        </>
      }
    >
      <div className="p-6 space-y-5">
        {/* Jenis Export */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Jenis Export
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'sekolah', label: 'Jadwal Sekolah', icon: School },
              { value: 'kelas',   label: 'Per Kelas',      icon: Users },
              { value: 'guru',    label: 'Per Guru',        icon: User },
            ] as { value: JenisExport; label: string; icon: React.ElementType }[]).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setJenis(value)}
                className={
                  'flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-xs font-medium transition-colors ' +
                  (jenis === value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400')
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* TA & Semester — wajib */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tahun Ajaran <span className="text-red-500">*</span>
            </label>
            <Select
              options={taOptions}
              value={taId}
              onChange={(e) => { setTaId(e.target.value); setSemesterId('') }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Semester <span className="text-red-500">*</span>
            </label>
            <Select
              options={[{ label: '— Pilih Semester —', value: '' }, ...smtOptions]}
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
            />
          </div>
        </div>

        {/* Tingkat (opsional, untuk sekolah & kelas) */}
        {(jenis === 'sekolah' || jenis === 'kelas') && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tingkat <span className="text-xs text-gray-400">(opsional)</span>
            </label>
            <Select
              options={tingkatOpts}
              value={tingkatId}
              onChange={(e) => { setTingkatId(e.target.value); setKelasId('') }}
            />
          </div>
        )}

        {/* Kelas (wajib jika jenis === kelas) */}
        {jenis === 'kelas' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Kelas <span className="text-red-500">*</span>
            </label>
            <Select
              options={kelasOpts}
              value={kelasId}
              onChange={(e) => setKelasId(e.target.value)}
            />
          </div>
        )}

        {/* Guru (wajib jika jenis === guru) */}
        {jenis === 'guru' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Guru <span className="text-red-500">*</span>
            </label>
            <Select
              options={guruOpts}
              value={guruId}
              onChange={(e) => setGuruId(e.target.value)}
            />
          </div>
        )}
      </div>
    </Modal>
  )
}
'''

# ─────────────────────────────────────────────────────────────────
# 6. COPY SEMESTER MODAL
# ─────────────────────────────────────────────────────────────────
FILES["app/dashboard/jadwal/manajemen/_components/CopySemesterModal.tsx"] = '''\
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Modal, Button, Select, Spinner } from '@/components/ui'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { useCopySemesterJadwal } from '@/hooks/jadwal/useJadwal'
import { ArrowRight } from 'lucide-react'

interface TaOption { id: string; nama: string }

interface Props {
  open:      boolean
  onClose:   () => void
  taList:    TaOption[]
  onSuccess: () => void
}

export function CopySemesterModal({ open, onClose, taList, onSuccess }: Props) {
  const [sourceTaId, setSourceTaId]       = useState('')
  const [sourceSemId, setSourceSemId]     = useState('')
  const [targetTaId, setTargetTaId]       = useState('')
  const [targetSemId, setTargetSemId]     = useState('')

  const { data: sourceSemList } = useSemesterByTahunAjaran(sourceTaId || null)
  const { data: targetSemList } = useSemesterByTahunAjaran(targetTaId || null)

  const copyMutation = useCopySemesterJadwal()

  const taOptions = taList.map((t) => ({ label: t.nama, value: t.id }))

  const sourceSemOpts = [
    { label: '— Pilih Semester Sumber —', value: '' },
    ...(sourceSemList ?? []).map((s) => ({
      label: s.nama + (s.isActive ? ' (Aktif)' : ''),
      value: s.id,
    })),
  ]

  const targetSemOpts = [
    { label: '— Pilih Semester Tujuan —', value: '' },
    ...(targetSemList ?? []).map((s) => ({
      label: s.nama + (s.isActive ? ' (Aktif)' : ''),
      value: s.id,
    })),
  ]

  const canSubmit = !!sourceSemId && !!targetSemId && sourceSemId !== targetSemId

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      const result = await copyMutation.mutateAsync({
        sourceSemesterId: sourceSemId,
        targetSemesterId: targetSemId,
      })
      toast.success(`Berhasil menyalin ${result.count} jadwal ke semester tujuan`)
      onSuccess()
    } catch {
      toast.error('Gagal menyalin jadwal')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Copy Jadwal dari Semester Lain"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit || copyMutation.isPending}
          >
            {copyMutation.isPending
              ? <><Spinner size="sm" className="mr-2" />Menyalin...</>
              : 'Salin Jadwal'
            }
          </Button>
        </>
      }
    >
      <div className="p-6 space-y-5">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Salin semua jadwal dari semester sumber ke semester tujuan.
          Jadwal yang sudah ada di semester tujuan akan tetap ada (tidak ditimpa).
        </p>

        {/* Semester Sumber */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Semester Sumber</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">Tahun Ajaran</label>
              <Select
                options={[{ label: '— Pilih TA —', value: '' }, ...taOptions]}
                value={sourceTaId}
                onChange={(e) => { setSourceTaId(e.target.value); setSourceSemId('') }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">Semester</label>
              <Select
                options={sourceSemOpts}
                value={sourceSemId}
                onChange={(e) => setSourceSemId(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="h-px w-16 bg-gray-200 dark:bg-gray-700" />
            <ArrowRight className="h-4 w-4" />
            <div className="h-px w-16 bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>

        {/* Semester Tujuan */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Semester Tujuan</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">Tahun Ajaran</label>
              <Select
                options={[{ label: '— Pilih TA —', value: '' }, ...taOptions]}
                value={targetTaId}
                onChange={(e) => { setTargetTaId(e.target.value); setTargetSemId('') }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">Semester</label>
              <Select
                options={targetSemOpts}
                value={targetSemId}
                onChange={(e) => setTargetSemId(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Warning jika sama */}
        {sourceSemId && targetSemId && sourceSemId === targetSemId && (
          <p className="text-xs text-red-500">
            Semester sumber dan tujuan tidak boleh sama.
          </p>
        )}
      </div>
    </Modal>
  )
}
'''

# ─────────────────────────────────────────────────────────────────
# 7. PRE-MODAL KONFIGURASI (placeholder — dibuat lengkap di Batch 3)
# ─────────────────────────────────────────────────────────────────
FILES["app/dashboard/jadwal/manajemen/buat-jadwal/_components/PreModalKonfigurasi.tsx"] = '''\
'use client'

import { useState, useMemo } from 'react'
import { Modal, Button, Select, Spinner } from '@/components/ui'
import { useTahunAjaranActive, useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
import { useKelasList } from '@/hooks/kelas/useKelas'
import type { HariEnum } from '@/types/jadwal.types'
import { HARI_LIST } from '@/types/jadwal.types'

export interface HariConfig {
  hari:      HariEnum
  aktif:     boolean
  jumlahJam: number
}

export interface PreModalParams {
  kelasId:    string
  semesterId: string
  hariConfig: HariConfig[]
}

interface Props {
  open:      boolean
  onClose:   () => void
  onConfirm: (params: PreModalParams) => void
}

const HARI_LABEL: Record<HariEnum, string> = {
  SENIN:   'Senin',
  SELASA:  'Selasa',
  RABU:    'Rabu',
  KAMIS:   'Kamis',
  JUMAT:   'Jumat',
  SABTU:   'Sabtu',
}

const DEFAULT_HARI_CONFIG: HariConfig[] = HARI_LIST.map((h) => ({
  hari:      h,
  aktif:     h !== 'SABTU',
  jumlahJam: h === 'JUMAT' ? 5 : 6,
}))

export function PreModalKonfigurasi({ open, onClose, onConfirm }: Props) {
  const [taId, setTaId]             = useState('')
  const [semesterId, setSemesterId] = useState('')
  const [tingkatId, setTingkatId]   = useState('')
  const [kelasId, setKelasId]       = useState('')
  const [hariConfig, setHariConfig] = useState<HariConfig[]>(DEFAULT_HARI_CONFIG)

  const { data: taAktif }      = useTahunAjaranActive()
  const { data: taList }       = useTahunAjaranList()
  const resolvedTaId           = taId || taAktif?.id || ''
  const { data: semesterList } = useSemesterByTahunAjaran(resolvedTaId || null)
  const { data: tingkatList }  = useTingkatKelasList()
  const { data: kelasList }    = useKelasList({
    semesterId:     semesterId || undefined,
    tingkatKelasId: tingkatId  || undefined,
  })

  const resolvedSemesterId = useMemo(() => {
    if (semesterId) return semesterId
    if (!semesterList) return ''
    return semesterList.find((s) => s.isActive)?.id ?? semesterList[0]?.id ?? ''
  }, [semesterId, semesterList])

  const canConfirm = !!resolvedSemesterId && !!kelasId &&
    hariConfig.some((h) => h.aktif && h.jumlahJam > 0)

  const toggleHari = (hari: HariEnum) => {
    setHariConfig((prev) =>
      prev.map((h) => h.hari === hari ? { ...h, aktif: !h.aktif } : h),
    )
  }

  const setJumlahJam = (hari: HariEnum, val: number) => {
    setHariConfig((prev) =>
      prev.map((h) => h.hari === hari ? { ...h, jumlahJam: Math.max(1, Math.min(12, val)) } : h),
    )
  }

  const taOptions = (taList ?? []).map((t) => ({ label: t.nama, value: t.id }))
  const smtOptions = [
    { label: '— Pilih Semester —', value: '' },
    ...(semesterList ?? []).map((s) => ({
      label: s.nama + (s.isActive ? ' (Aktif)' : ''),
      value: s.id,
    })),
  ]
  const tingkatOpts = [
    { label: '— Semua Tingkat —', value: '' },
    ...(tingkatList ?? []).map((t) => ({ label: 'Kelas ' + t.nama, value: t.id })),
  ]
  const kelasOpts = [
    { label: '— Pilih Kelas —', value: '' },
    ...(kelasList?.data ?? []).map((k: { id: string; namaKelas: string }) => ({
      label: k.namaKelas,
      value: k.id,
    })),
  ]

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm({
      kelasId,
      semesterId: resolvedSemesterId,
      hariConfig: hariConfig.filter((h) => h.aktif),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Konfigurasi Jadwal Perkelas"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!canConfirm}>
            Lanjut ke Form Jadwal
          </Button>
        </>
      }
    >
      <div className="p-6 space-y-5">
        {/* TA & Semester */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tahun Ajaran <span className="text-red-500">*</span>
            </label>
            <Select
              options={taOptions}
              value={resolvedTaId}
              onChange={(e) => { setTaId(e.target.value); setSemesterId('') }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Semester <span className="text-red-500">*</span>
            </label>
            <Select
              options={smtOptions}
              value={resolvedSemesterId}
              onChange={(e) => setSemesterId(e.target.value)}
            />
          </div>
        </div>

        {/* Tingkat & Kelas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tingkat <span className="text-xs text-gray-400">(filter)</span>
            </label>
            <Select
              options={tingkatOpts}
              value={tingkatId}
              onChange={(e) => { setTingkatId(e.target.value); setKelasId('') }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Kelas <span className="text-red-500">*</span>
            </label>
            <Select
              options={kelasOpts}
              value={kelasId}
              onChange={(e) => setKelasId(e.target.value)}
            />
          </div>
        </div>

        {/* Konfigurasi Hari */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Hari & Jumlah Jam Pertemuan
          </label>
          <div className="space-y-2">
            {hariConfig.map((h) => (
              <div
                key={h.hari}
                className={
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-colors ' +
                  (h.aktif
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50')
                }
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={h.aktif}
                  onChange={() => toggleHari(h.hari)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                {/* Label hari */}
                <span className={
                  'w-16 text-sm font-medium ' +
                  (h.aktif ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400')
                }>
                  {HARI_LABEL[h.hari]}
                </span>
                {/* Jumlah jam */}
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-gray-500">Jumlah jam:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={!h.aktif}
                      onClick={() => setJumlahJam(h.hari, h.jumlahJam - 1)}
                      className="h-6 w-6 rounded border border-gray-300 dark:border-gray-600 text-sm font-bold text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      −
                    </button>
                    <span className={
                      'w-6 text-center text-sm font-semibold ' +
                      (h.aktif ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400')
                    }>
                      {h.jumlahJam}
                    </span>
                    <button
                      type="button"
                      disabled={!h.aktif}
                      onClick={() => setJumlahJam(h.hari, h.jumlahJam + 1)}
                      className="h-6 w-6 rounded border border-gray-300 dark:border-gray-600 text-sm font-bold text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
'''

# ─────────────────────────────────────────────────────────────────
# WRITER
# ─────────────────────────────────────────────────────────────────
def write_files():
    for rel_path, content in FILES.items():
        full_path = os.path.join(BASE, rel_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  ✅ {full_path}")

if __name__ == "__main__":
    print("\n🚀 BATCH 2 — Jadwal Manajemen Main Page\n")
    write_files()
    print("\n✅ Batch 2 selesai. Siap lanjut Batch 3 (Form DnD).\n")