'use client'

import { useState, useMemo }        from 'react'
import { useRouter }                from 'next/navigation'
import {
  Archive, BookOpen, ClipboardList,
  CalendarDays, FileText,
} from 'lucide-react'
import { SlideOver, Button, Badge, Skeleton } from '@/components/ui'
import { Select }                   from '@/components/ui'
import { useMataPelajaranList }     from '@/hooks/useMataPelajaran'
import { useTahunAjaranList }       from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'

interface Props {
  open:    boolean
  onClose: () => void
  guruId:  string
}

export function MapelArsipSlideover({ open, onClose, guruId }: Props) {
  const router = useRouter()
  const [taId,       setTaId]       = useState('')
  const [semesterId, setSemesterId] = useState('')

  // ── TA list (semua TA — aktif pun bisa punya semester arsip) ───
  const { data: taListRaw } = useTahunAjaranList()
  const taList = (taListRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? []
  const taOptions = useMemo(() =>
    taList.map((t) => ({ label: t.nama + (t.isActive ? ' (Aktif)' : ''), value: t.id })),
    [taList],
  )

  // ── Semester untuk TA yang dipilih — hanya yang tidak aktif ────
  const { data: semListRaw } = useSemesterByTahunAjaran(taId || null)
  const semList = (semListRaw as { id: string; nama: string; urutan?: number; isActive?: boolean }[] | undefined) ?? []
  // Hanya semester yang sudah selesai (non-aktif)
  const semOptions = semList
    .filter((s) => !s.isActive)
    .map((s)    => ({ label: s.nama, value: s.id }))

  // Label display dari filter yang dipilih
  const taNama  = taList.find((t) => t.id === taId)?.nama ?? ''
  const semItem = semList.find((s) => s.id === semesterId)
  const semNama = semItem?.nama ?? ''

  // ── Data mapel — hanya fetch setelah filter lengkap ───────────
  const { data: arsipResponse, isLoading } = useMataPelajaranList(
    open && guruId && !!semesterId ? { guruId, semesterId } : undefined,
  )
  const arsipList = arsipResponse?.data ?? []

  const handleTaChange = (v: string) => { setTaId(v); setSemesterId('') }
  const handleClose    = () => { setTaId(''); setSemesterId(''); onClose() }
  const nav = (path: string) => { router.push(path); handleClose() }

  // URL ke halaman arsip detail (read-only) dengan context lengkap
  const arsipUrl = (mapel: { id: string; kelasId?: string; kelas?: { id: string } }, tab: string) => {
    const kelasId = mapel.kelasId ?? mapel.kelas?.id ?? ''
    const p = new URLSearchParams({ semesterId, taId, semNama, taNama, kelasId, tab })
    return `/dashboard/pembelajaran/arsip/${mapel.id}?${p.toString()}`
  }

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title="Arsip Mata Pelajaran"
      description="Riwayat pengajaran semester yang telah selesai"
      width="md"
    >
      <div className="space-y-5">

        {/* ── Filter TA & Semester ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Tahun Ajaran
            </label>
            <Select
              options={[
                { label: taOptions.length === 0 ? 'Tidak ada data' : 'Pilih Tahun Ajaran...', value: '' },
                ...taOptions,
              ]}
              value={taId}
              onChange={(e) => handleTaChange(e.target.value)}
              disabled={taOptions.length === 0}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Semester
            </label>
            <Select
              options={[
                {
                  label: !taId
                    ? 'Pilih TA dulu...'
                    : semOptions.length === 0
                      ? 'Semua semester masih aktif'
                      : 'Pilih Semester...',
                  value: '',
                },
                ...semOptions,
              ]}
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
              disabled={!taId || semOptions.length === 0}
            />
          </div>
        </div>

        {/* ── Prompt: belum pilih filter ── */}
        {!semesterId && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Archive className="w-7 h-7 text-gray-300 dark:text-gray-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Pilih periode arsip</p>
              <p className="text-xs text-gray-400 mt-1">
                Pilih tahun ajaran dan semester untuk melihat riwayat mata pelajaran Anda.
              </p>
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {semesterId && isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        )}

        {/* ── Empty ── */}
        {semesterId && !isLoading && arsipList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
            <BookOpen className="w-8 h-8 opacity-40" />
            <p className="text-sm">Tidak ada mata pelajaran pada semester ini.</p>
          </div>
        )}

        {/* ── List mapel ── */}
        {semesterId && !isLoading && arsipList.length > 0 && (
          <div className="space-y-3">

            {/* Banner konteks periode */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
              <Archive className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                {taNama} · Semester {semNama}
              </p>
              <span className="ml-auto text-[10px] text-amber-500 shrink-0">
                {arsipList.length} mapel
              </span>
            </div>

            {arsipList.map((mapel) => (
              <div
                key={mapel.id}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60 p-4 space-y-3"
              >
                {/* Identitas mapel + badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-700 dark:text-gray-200 text-sm truncate">
                      {mapel.mataPelajaranTingkat.masterMapel.nama}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {mapel.kelas.namaKelas} · {mapel.mataPelajaranTingkat.masterMapel.kode}
                    </p>
                  </div>
                  <Badge variant="warning">Arsip</Badge>
                </div>

                {/* Identitas akademik — strip kecil */}
                <div className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg px-2.5 py-1.5 font-medium tracking-wide">
                  {taNama} · Semester {semNama}
                </div>

                {/* Navigasi read-only → /pembelajaran/arsip/[id]?tab=... */}
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    size="sm" variant="ghost"
                    leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                    onClick={() => nav(arsipUrl(mapel, 'materi'))}
                  >
                    Materi
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    leftIcon={<ClipboardList className="w-3.5 h-3.5" />}
                    onClick={() => nav(arsipUrl(mapel, 'tugas'))}
                  >
                    Tugas
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    leftIcon={<CalendarDays className="w-3.5 h-3.5" />}
                    onClick={() => nav(arsipUrl(mapel, 'absensi'))}
                  >
                    Absensi
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    leftIcon={<FileText className="w-3.5 h-3.5" />}
                    onClick={() => nav(arsipUrl(mapel, 'dokumen'))}
                  >
                    Dokumen
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </SlideOver>
  )
}
