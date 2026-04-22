'use client'

import { useState, useMemo } from 'react'
import { Modal, Button, Select } from '@/components/ui'
import { ArrowRight } from 'lucide-react'
import { useTahunAjaranActive, useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
import { useKelasList } from '@/hooks/kelas/useKelas'
import type { HariEnum } from '@/types/jadwal.types'
import { HARI_LIST } from '@/types/jadwal.types'
import type { HariConfig, PreModalParams } from './jadwal-form.types'

interface Props {
  open:      boolean
  onClose:   () => void
  onConfirm: (params: PreModalParams) => void
}

const HARI_LABEL: Record<HariEnum, string> = {
  SENIN: 'Senin', SELASA: 'Selasa', RABU: 'Rabu',
  KAMIS: 'Kamis', JUMAT:  'Jumat',  SABTU: 'Sabtu',
}

const DEFAULT_HARI_CONFIG: HariConfig[] = HARI_LIST.map((h) => ({
  hari: h, aktif: h !== 'SABTU',
}))

export function PreModalKonfigurasi({ open, onClose, onConfirm }: Props) {
  const [taId, setTaId]             = useState('')
  const [semesterId, setSemesterId] = useState('')
  const [tingkatId, setTingkatId]   = useState('')
  const [kelasId, setKelasId]       = useState('')
  const [hariConfig, setHariConfig] = useState<HariConfig[]>(DEFAULT_HARI_CONFIG)

  const { data: taAktifRaw } = useTahunAjaranActive()
  const { data: taListRaw }  = useTahunAjaranList()

  const taAktif = useMemo(() => {
    if (!taAktifRaw) return null
    const arr = taAktifRaw as unknown as { id: string; isActive?: boolean }[]
    if (!Array.isArray(arr)) return taAktifRaw as unknown as { id: string }
    return arr.find((t) => t.isActive) ?? arr[0] ?? null
  }, [taAktifRaw])

  const resolvedTaId = taId || taAktif?.id || ''

  const { data: semesterListRaw } = useSemesterByTahunAjaran(resolvedTaId || null)
  const { data: tingkatListRaw }  = useTingkatKelasList()
  const { data: kelasListRaw }    = useKelasList(
    resolvedTaId ? { tahunAjaranId: resolvedTaId, tingkatKelasId: tingkatId || undefined } : undefined,
  )

  const resolvedSemesterId = useMemo(() => {
    if (semesterId) return semesterId
    const arr = semesterListRaw as unknown as { id: string; isActive?: boolean }[] | undefined ?? []
    return arr.find((s) => s.isActive)?.id ?? arr[0]?.id ?? ''
  }, [semesterId, semesterListRaw])

  const taArr      = (taListRaw as unknown as { id: string; nama: string }[] | undefined) ?? []
  const semArr     = (semesterListRaw as unknown as { id: string; nama: string; isActive: boolean }[] | undefined) ?? []
  const tingkatArr = (tingkatListRaw as unknown as { id: string; nama: string }[] | undefined) ?? []
  const kelasArr   = (kelasListRaw as unknown as { id: string; namaKelas: string }[] | undefined) ?? []

  const taOptions = taArr.map((t) => ({ label: t.nama, value: t.id }))
  const smtOptions = [
    { label: '— Pilih Semester —', value: '' },
    ...semArr.map((s) => ({ label: s.nama + (s.isActive ? ' (Aktif)' : ''), value: s.id })),
  ]
  const tingkatOpts = [
    { label: '— Semua Tingkat —', value: '' },
    ...tingkatArr.map((t) => ({ label: 'Kelas ' + t.nama, value: t.id })),
  ]
  const kelasOpts = [
    { label: kelasArr.length ? '— Pilih Kelas —' : '— Pilih TA terlebih dahulu —', value: '' },
    ...kelasArr.map((k) => ({ label: k.namaKelas, value: k.id })),
  ]

  const canConfirm = !!resolvedTaId && !!resolvedSemesterId && !!kelasId &&
    hariConfig.some((h) => h.aktif)

  const toggleHari = (hari: HariEnum) =>
    setHariConfig((prev) => prev.map((h) => (h.hari === hari ? { ...h, aktif: !h.aktif } : h)))

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm({
      kelasId,
      semesterId: resolvedSemesterId,
      hariConfig: hariConfig.filter((h) => h.aktif),
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Konfigurasi Jadwal Perkelas" size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!canConfirm} rightIcon={<ArrowRight className="w-4 h-4 shrink-0" strokeWidth={2.5} />}>
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
            <Select options={taOptions} value={resolvedTaId}
              onChange={(e) => { setTaId(e.target.value); setSemesterId(''); setKelasId('') }} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Semester <span className="text-red-500">*</span>
            </label>
            <Select options={smtOptions} value={resolvedSemesterId}
              onChange={(e) => setSemesterId(e.target.value)} />
          </div>
        </div>

        {/* Tingkat & Kelas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tingkat <span className="text-xs text-gray-400">(filter kelas)</span>
            </label>
            <Select options={tingkatOpts} value={tingkatId}
              onChange={(e) => { setTingkatId(e.target.value); setKelasId('') }} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Kelas <span className="text-red-500">*</span>
            </label>
            <Select options={kelasOpts} value={kelasId}
              onChange={(e) => setKelasId(e.target.value)} />
          </div>
        </div>

        {!resolvedTaId && (
          <p className="text-xs text-amber-500">
            Pilih Tahun Ajaran agar daftar kelas muncul.
          </p>
        )}

        {/* Hari aktif — hanya checkbox, tanpa jumlahJam */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Hari Aktif
          </label>
          <p className="text-xs text-gray-400 -mt-1">
            Jumlah sesi per hari ditentukan otomatis dari Master Jam Pelajaran
          </p>
          <div className="grid grid-cols-3 gap-2">
            {hariConfig.map((h) => (
              <button
                key={h.hari}
                type="button"
                onClick={() => toggleHari(h.hari)}
                className={
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 border transition-colors text-left ' +
                  (h.aktif
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50')
                }
              >
                <div className={
                  'h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ' +
                  (h.aktif
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-gray-300 dark:border-gray-600')
                }>
                  {h.aktif && (
                    <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={
                  'text-sm font-medium ' +
                  (h.aktif ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-400')
                }>
                  {HARI_LABEL[h.hari]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
