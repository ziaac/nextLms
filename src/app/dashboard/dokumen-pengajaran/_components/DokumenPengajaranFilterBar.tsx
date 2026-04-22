'use client'

import { useMemo }                      from 'react'
import { RotateCcw, SlidersHorizontal }  from 'lucide-react'
import { Select }                        from '@/components/ui'
import { Combobox }                      from '@/components/ui/Combobox'
import { useTahunAjaranList }            from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran }      from '@/hooks/semester/useSemester'
import { useTingkatKelasList }           from '@/hooks/tingkat-kelas/useTingkatKelas'
import { useKelasList }                  from '@/hooks/kelas/useKelas'
import { useGuruList }                   from '@/hooks/mata-pelajaran/useMataPelajaran'
import type { JenisDokumen, StatusDokumenPengajaran } from '@/types/enums'
import type { TingkatKelas }             from '@/types/akademik.types'
import type { Kelas }                    from '@/types/kelas.types'

const STATUS_OPTIONS = [
  { label: 'Semua Status',   value: '' },
  { label: 'Draft',          value: 'DRAFT' },
  { label: 'Diajukan',       value: 'SUBMITTED' },
  { label: 'Disetujui',      value: 'APPROVED' },
  { label: 'Perlu Revisi',   value: 'REVISION_REQUESTED' },
]

const JENIS_OPTIONS = [
  { label: 'Semua Jenis',            value: '' },
  { label: 'CP',                     value: 'CP' },
  { label: 'ATP',                    value: 'ATP' },
  { label: 'Modul Ajar / RPP',       value: 'MODUL_AJAR_RPP' },
  { label: 'Modul Projek P5',        value: 'MODUL_PROJEK_P5' },
  { label: 'KKTP',                   value: 'KKTP' },
  { label: 'Rincian Minggu Efektif', value: 'RINCIAN_MINGGU_EFEKTIF' },
  { label: 'Buku Pegangan',          value: 'BUKU_PEGANGAN' },
  { label: 'Lainnya',                value: 'LAINNYA' },
]

interface Props {
  // Filter dasar (semua role)
  status:         StatusDokumenPengajaran | ''
  jenisDokumen:   JenisDokumen | ''
  onStatusChange: (v: StatusDokumenPengajaran | '') => void
  onJenisChange:  (v: JenisDokumen | '') => void

  // Filter guru — kelas
  isGuru?:              boolean
  guruKelasId?:         string
  guruKelasOptions?:    { value: string; label: string }[]
  onGuruKelasChange?:   (v: string) => void

  // Filter admin (opsional)
  isAdmin?:              boolean
  tahunAjaranId?:        string
  semesterId?:           string
  tingkatKelasId?:       string
  kelasId?:              string
  guruId?:               string
  onTahunAjaranChange?:  (v: string) => void
  onSemesterChange?:     (v: string) => void
  onTingkatChange?:      (v: string) => void
  onKelasChange?:        (v: string) => void
  onGuruChange?:         (v: string) => void
  onReset?:              () => void
}

export function DokumenPengajaranFilterBar({
  status, jenisDokumen, onStatusChange, onJenisChange,
  isGuru, guruKelasId = '', guruKelasOptions = [], onGuruKelasChange,
  isAdmin,
  tahunAjaranId = '', semesterId = '', tingkatKelasId = '', kelasId = '', guruId = '',
  onTahunAjaranChange, onSemesterChange, onTingkatChange, onKelasChange, onGuruChange,
  onReset,
}: Props) {

  // ── Data hooks (hanya dipakai saat isAdmin) ──────────────────
  const { data: taListRaw }   = useTahunAjaranList()
  const taList = (taListRaw as { id: string; nama: string }[] | undefined) ?? []

  const { data: semListRaw }  = useSemesterByTahunAjaran(isAdmin && tahunAjaranId ? tahunAjaranId : null)
  const semList = (semListRaw as { id: string; nama: string }[] | undefined) ?? []

  const { data: tingkatRaw }  = useTingkatKelasList()
  const tingkatList = (tingkatRaw as TingkatKelas[] | undefined) ?? []

  const { data: kelasRaw }    = useKelasList(
    isAdmin ? { tingkatKelasId: tingkatKelasId || undefined } : undefined,
    !!isAdmin,
  )
  const kelasList: Kelas[] = kelasRaw ?? []

  const { data: guruRaw }     = useGuruList()
  const guruList  = guruRaw ?? []

  // ── Deteksi filter aktif ─────────────────────────────────────
  const hasActiveFilter = !!(
    status || jenisDokumen || guruKelasId ||
    (isAdmin && (tahunAjaranId || semesterId || tingkatKelasId || kelasId || guruId))
  )

  // ── Combobox options ─────────────────────────────────────────
  const kelasOptions = useMemo(() =>
    kelasList.map((k: Kelas) => ({
      value: k.id,
      label: k.namaKelas,
      hint:  k.tingkatKelas?.nama,
    })),
  [kelasList])

  const guruOptions = useMemo(() =>
    guruList.map((g) => ({
      value: g.id,
      label: g.profile?.namaLengkap ?? g.username ?? g.id,
    })),
  [guruList])

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">

      {/* ── Header panel ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
          <SlidersHorizontal className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          Filter
          {hasActiveFilter && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
              {[status, jenisDokumen, guruKelasId, tahunAjaranId, semesterId, tingkatKelasId, kelasId, guruId].filter(Boolean).length}
            </span>
          )}
        </div>

        {/* Tombol Reset — muncul hanya jika ada filter aktif */}
        {hasActiveFilter && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium
                       text-red-500 hover:text-red-600 hover:bg-red-50
                       dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20
                       border border-red-200 dark:border-red-800/50
                       transition-colors whitespace-nowrap"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* ── Semua filter dalam satu grid 4 kolom ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

        {/* ── Admin only ── */}
        {isAdmin && (<>
          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tahun Ajaran</label>
            <Select
              options={[
                { label: 'Semua TA', value: '' },
                ...taList.map((t) => ({ label: t.nama, value: t.id })),
              ]}
              value={tahunAjaranId}
              onChange={(e) => { onTahunAjaranChange?.(e.target.value); onSemesterChange?.('') }}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Semester</label>
            <Select
              options={[
                { label: 'Semua Semester', value: '' },
                ...semList.map((s) => ({ label: s.nama, value: s.id })),
              ]}
              value={semesterId}
              onChange={(e) => onSemesterChange?.(e.target.value)}
              disabled={!tahunAjaranId}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tingkat</label>
            <Select
              options={[
                { label: 'Semua Tingkat', value: '' },
                ...tingkatList.map((t) => ({ label: t.nama, value: t.id })),
              ]}
              value={tingkatKelasId}
              onChange={(e) => { onTingkatChange?.(e.target.value); onKelasChange?.('') }}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Kelas</label>
            <Combobox
              options={kelasOptions}
              value={kelasId}
              onChange={(v) => onKelasChange?.(v)}
              searchOnly
              minSearchLength={0}
              placeholder="Cari kelas..."
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Guru</label>
            <Combobox
              options={guruOptions}
              value={guruId}
              onChange={(v) => onGuruChange?.(v)}
              searchOnly
              minSearchLength={0}
              placeholder="Cari guru..."
              className="w-full"
            />
          </div>
        </>)}

        {/* ── Filter kelas guru ── */}
        {isGuru && guruKelasOptions.length > 0 && (
          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Kelas</label>
            <Select
              options={[
                { label: 'Semua Kelas', value: '' },
                ...guruKelasOptions,
              ]}
              value={guruKelasId}
              onChange={(e) => onGuruKelasChange?.(e.target.value)}
              className="w-full"
            />
          </div>
        )}

        {/* ── Semua role ── */}
        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => onStatusChange(e.target.value as StatusDokumenPengajaran | '')}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Jenis Dokumen</label>
          <Select
            options={JENIS_OPTIONS}
            value={jenisDokumen}
            onChange={(e) => onJenisChange(e.target.value as JenisDokumen | '')}
            className="w-full"
          />
        </div>

      </div>

    </div>
  )

}
