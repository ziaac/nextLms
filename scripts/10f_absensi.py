import os

ROOT = r"D:\projects\LMS-MAN\Code\nextjslms\src"
FILES = {}

# ─────────────────────────────────────────────────────────────────────────────
# 1. app/dashboard/absensi/manajemen/page.tsx
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/manajemen/page.tsx"] = """'use client'

import { useState }              from 'react'
import { Download }              from 'lucide-react'
import { PageHeader }            from '@/components/ui/PageHeader'
import { Button }                from '@/components/ui/Button'
import { Spinner }               from '@/components/ui/Spinner'
import { useSemesterActive }     from '@/hooks/semester/useSemester'
import { useMatrixRekap, useOverrideAbsensi, useExportMatrix } from '@/hooks/absensi/useAbsensiManajemen'
import { MatrixFilterBar }       from './_components/MatrixFilterBar'
import { MatrixTable }           from './_components/MatrixTable'
import { OverrideModal }         from './_components/OverrideModal'
import { SiswaKritisWidget }     from './_components/SiswaKritisWidget'

interface OverrideTarget {
  absensiId: string
  namaSiswa: string
  tanggal:   string
}

export default function AbsensiManajemenPage() {
  const { data: semesters } = useSemesterActive()
  const activeSemester = semesters?.find((s) => s.isActive) ?? semesters?.[0]
  const semesterId     = activeSemester?.id ?? ''

  // Filter state
  const [kelasId, setKelasId]           = useState('')
  const [mataPelajaranId, setMapelId]   = useState('')

  // Override modal
  const [overrideTarget, setOverrideTarget] = useState<OverrideTarget | null>(null)

  const { data: matrix, isLoading, isFetching } = useMatrixRekap({
    kelasId,
    mataPelajaranId,
    semesterId,
  })

  const override    = useOverrideAbsensi()
  const exportMatrix = useExportMatrix()

  const canExport = !!kelasId && !!mataPelajaranId && !!semesterId

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap Absensi"
        description={activeSemester ? `Semester ${activeSemester.nama} \u2014 ${activeSemester.tahunAjaran?.nama ?? ''}` : undefined}
        actions={
          <Button
            variant="secondary" size="sm"
            leftIcon={<Download size={14} />}
            disabled={!canExport}
            loading={exportMatrix.isPending}
            onClick={() => exportMatrix.mutate({ kelasId, mataPelajaranId, semesterId })}
          >
            Export PDF
          </Button>
        }
      />

      {/* Mini Stats */}
      {semesterId && <SiswaKritisWidget semesterId={semesterId} />}

      {/* Filter */}
      <MatrixFilterBar
        semesterId={semesterId}
        kelasId={kelasId}
        mataPelajaranId={mataPelajaranId}
        onKelasChange={(v) => { setKelasId(v); setMapelId('') }}
        onMapelChange={setMapelId}
      />

      {/* Matrix */}
      {isLoading || isFetching ? (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
          <Spinner />
          <span className="text-sm">Memuat data rekap...</span>
        </div>
      ) : matrix ? (
        <MatrixTable
          matrix={matrix}
          onOverride={(target) => setOverrideTarget(target)}
        />
      ) : (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-400">
            Pilih kelas dan mata pelajaran untuk menampilkan rekap absensi.
          </p>
        </div>
      )}

      <OverrideModal
        open={!!overrideTarget}
        target={overrideTarget}
        onClose={() => setOverrideTarget(null)}
        onSubmit={(status, keterangan) => {
          if (!overrideTarget) return
          override.mutate(
            { id: overrideTarget.absensiId, payload: { status, keterangan } },
            { onSuccess: () => setOverrideTarget(null) },
          )
        }}
        isPending={override.isPending}
      />
    </div>
  )
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# 2. _components/MatrixFilterBar.tsx
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/manajemen/_components/MatrixFilterBar.tsx"] = """'use client'

import { useMemo }               from 'react'
import { Combobox }              from '@/components/ui/Combobox'
import type { ComboboxOption }   from '@/components/ui/Combobox'
import { useKelasList }          from '@/hooks/kelas/useKelas'
import { useMataPelajaranList }  from '@/hooks/mata-pelajaran/useMataPelajaran'

interface Props {
  semesterId:        string
  kelasId:           string
  mataPelajaranId:   string
  onKelasChange:     (v: string) => void
  onMapelChange:     (v: string) => void
}

export function MatrixFilterBar({
  semesterId, kelasId, mataPelajaranId,
  onKelasChange, onMapelChange,
}: Props) {
  // Kelas list — ambil semua, filter bisa ditambah nanti
  const { data: kelasData } = useKelasList()

  // Mapel list — filter by kelasId + semesterId aktif
  const { data: mapelData } = useMataPelajaranList(
    kelasId ? { kelasId, semesterId } : undefined,
  )

  const kelasOptions: ComboboxOption[] = useMemo(() => {
    const list = Array.isArray(kelasData) ? kelasData : (kelasData as { data?: { id: string; namaKelas: string }[] } | undefined)?.data ?? []
    return list.map((k: { id: string; namaKelas: string }) => ({
      label: k.namaKelas,
      value: k.id,
    }))
  }, [kelasData])

  const mapelOptions: ComboboxOption[] = useMemo(() => {
    const list = Array.isArray(mapelData) ? mapelData : (mapelData as { data?: { id: string; mataPelajaranTingkat?: { masterMapel?: { nama?: string } } }[] } | undefined)?.data ?? []
    return list.map((m: { id: string; mataPelajaranTingkat?: { masterMapel?: { nama?: string } } }) => ({
      label: m.mataPelajaranTingkat?.masterMapel?.nama ?? m.id,
      value: m.id,
    }))
  }, [mapelData])

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Kelas
          </label>
          <Combobox
            options={kelasOptions}
            value={kelasId}
            onChange={onKelasChange}
            placeholder="Pilih kelas..."
            disabled={!semesterId}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Mata Pelajaran
          </label>
          <Combobox
            options={mapelOptions}
            value={mataPelajaranId}
            onChange={onMapelChange}
            placeholder={kelasId ? 'Pilih mata pelajaran...' : 'Pilih kelas dulu'}
            disabled={!kelasId}
          />
        </div>
      </div>
    </div>
  )
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# 3. _components/MatrixTable.tsx
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/manajemen/_components/MatrixTable.tsx"] = """'use client'

import { Pencil } from 'lucide-react'
import type { MatrixResponse } from '@/types'

interface OverrideTarget {
  absensiId: string
  namaSiswa: string
  tanggal:   string
}

interface Props {
  matrix:     MatrixResponse
  onOverride: (target: OverrideTarget) => void
}

const STATUS_CLS: Record<string, string> = {
  H:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  S:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  I:    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  A:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  TAP:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  T:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
}

export function MatrixTable({ matrix, onOverride }: Props) {
  const { metadata, listPertemuan, dataSiswa } = matrix
  const target = metadata.targetPertemuan ?? listPertemuan.length

  // Format tanggal "2026-04-15" → "15/04"
  const fmtTgl = (iso: string) => {
    const [, m, d] = iso.split('-')
    return `${d}/${m}`
  }

  return (
    <div className="space-y-3">
      {/* Meta info */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {metadata.namaMapel}
        </span>
        <span className="text-xs text-gray-500">
          Realisasi: <strong>{metadata.realisasiPertemuan}</strong>
          {metadata.targetPertemuan ? ` / ${metadata.targetPertemuan}` : ''}
        </span>
        {/* Legenda */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {[
            { k: 'H', l: 'Hadir'   },
            { k: 'S', l: 'Sakit'   },
            { k: 'I', l: 'Izin'    },
            { k: 'A', l: 'Alpa'    },
            { k: 'T', l: 'Lambat'  },
          ].map(({ k, l }) => (
            <span key={k} className={'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ' + (STATUS_CLS[k] ?? '')}>
              {k} <span className="font-normal text-[10px] opacity-75">{l}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-max w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8 sticky left-0 bg-gray-50 dark:bg-gray-800/60">
                No
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[160px] sticky left-8 bg-gray-50 dark:bg-gray-800/60">
                Nama
              </th>
              {/* Pertemuan columns */}
              {Array.from({ length: target }, (_, i) => {
                const tgl = listPertemuan[i]
                const isNull = tgl === null || tgl === undefined
                return (
                  <th
                    key={i}
                    className={[
                      'px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide w-14',
                      isNull
                        ? 'text-gray-300 dark:text-gray-600'
                        : 'text-gray-500',
                    ].join(' ')}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{i + 1}</span>
                      {tgl && <span className="font-normal normal-case text-[9px] text-gray-400">{fmtTgl(tgl)}</span>}
                    </div>
                  </th>
                )
              })}
              {/* Summary cols */}
              {['H', 'S', 'I', 'A'].map((k) => (
                <th key={k} className={'px-2 py-3 text-center text-xs font-bold w-10 ' + (STATUS_CLS[k] ?? 'text-gray-500')}>
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {dataSiswa.map((siswa) => (
              <tr
                key={siswa.nisn}
                className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors"
              >
                {/* No */}
                <td className="px-3 py-2.5 text-xs text-gray-400 text-right tabular-nums sticky left-0 bg-white dark:bg-gray-900 group-hover:bg-gray-50">
                  {siswa.no}
                </td>
                {/* Nama */}
                <td className="px-3 py-2.5 sticky left-8 bg-white dark:bg-gray-900">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[160px]">
                    {siswa.nama}
                  </p>
                  <p className="text-[10px] text-gray-400">{siswa.nisn}</p>
                </td>
                {/* Sel absensi per pertemuan */}
                {Array.from({ length: target }, (_, i) => {
                  const tgl    = listPertemuan[i]
                  const status = siswa.kehadiran[i]
                  const isActive  = tgl !== null && tgl !== undefined
                  const hasStatus = status !== null && status !== undefined && status !== '-'

                  return (
                    <td key={i} className="px-1 py-2 text-center">
                      {!isActive ? (
                        // Kolom target belum terealisasi — muted
                        <span className="inline-block w-8 h-6 rounded bg-gray-50 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-700" />
                      ) : hasStatus ? (
                        // Ada data — tampilkan badge + tombol edit
                        <div className="relative inline-flex group">
                          <span className={[
                            'inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold',
                            STATUS_CLS[status] ?? 'bg-gray-100 text-gray-600',
                          ].join(' ')}>
                            {status}
                          </span>
                          {/* Edit overlay */}
                          <button
                            onClick={() => onOverride({
                              // Kita kirim composite key — backend butuh absensiId
                              // TODO: tambahkan absensiId ke response matrix jika belum ada
                              absensiId: `${siswa.nisn}:${tgl}`,
                              namaSiswa: siswa.nama,
                              tanggal:   tgl ?? '',
                            })}
                            className="absolute inset-0 flex items-center justify-center rounded bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Koreksi absensi"
                          >
                            <Pencil size={10} className="text-white" />
                          </button>
                        </div>
                      ) : (
                        // Kosong — tidak ada data absensi
                        <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 text-xs">
                          -
                        </span>
                      )}
                    </td>
                  )
                })}
                {/* Summary */}
                {(['H', 'S', 'I', 'A'] as const).map((k) => (
                  <td key={k} className="px-2 py-2 text-center text-xs font-semibold tabular-nums">
                    <span className={siswa.summary[k] > 0 ? (STATUS_CLS[k] ?? '') + ' px-1.5 py-0.5 rounded' : 'text-gray-300'}>
                      {siswa.summary[k]}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
            {dataSiswa.length === 0 && (
              <tr>
                <td colSpan={target + 6} className="text-center py-10 text-sm text-gray-400 italic">
                  Tidak ada data siswa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# 4. _components/OverrideModal.tsx
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/manajemen/_components/OverrideModal.tsx"] = """'use client'

import { useState, useEffect }  from 'react'
import { Modal }               from '@/components/ui/Modal'
import { Button }              from '@/components/ui/Button'
import { Combobox }            from '@/components/ui/Combobox'
import type { ComboboxOption } from '@/components/ui/Combobox'
import type { StatusAbsensi }  from '@/types'

const STATUS_OPTIONS: ComboboxOption[] = [
  { label: 'Hadir',     value: 'HADIR'     },
  { label: 'Sakit',     value: 'SAKIT'     },
  { label: 'Izin',      value: 'IZIN'      },
  { label: 'Alpa',      value: 'ALPA'      },
  { label: 'Terlambat', value: 'TERLAMBAT' },
  { label: 'TAP',       value: 'TAP'       },
]

interface OverrideTarget {
  absensiId: string
  namaSiswa: string
  tanggal:   string
}

interface Props {
  open:      boolean
  target:    OverrideTarget | null
  onClose:   () => void
  onSubmit:  (status: StatusAbsensi, keterangan?: string) => void
  isPending: boolean
}

export function OverrideModal({ open, target, onClose, onSubmit, isPending }: Props) {
  const [status, setStatus]         = useState<string>('')
  const [keterangan, setKeterangan] = useState('')

  useEffect(() => {
    if (!open) return
    setStatus('')
    setKeterangan('')
  }, [open])

  const canSubmit = !!status && !isPending

  // Format "2026-04-15" → "15/04/2026"
  const fmtTgl = (iso: string) => iso.split('-').reverse().join('/')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Koreksi Absensi"
      description={target ? `${target.namaSiswa} \u2014 ${fmtTgl(target.tanggal)}` : undefined}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button
            variant="primary" size="sm"
            loading={isPending} disabled={!canSubmit}
            onClick={() => onSubmit(status as StatusAbsensi, keterangan || undefined)}
          >
            Simpan Koreksi
          </Button>
        </>
      }
    >
      <div className="p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status Baru <span className="text-red-500">*</span>
          </label>
          <Combobox
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
            placeholder="Pilih status..."
            hasError={!status}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Keterangan
            <span className="ml-1.5 text-xs text-gray-400 font-normal">(opsional)</span>
          </label>
          <input
            type="text"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Contoh: Diubah Admin — ada surat dokter"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>
    </Modal>
  )
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# 5. _components/SiswaKritisWidget.tsx
# ─────────────────────────────────────────────────────────────────────────────
FILES["app/dashboard/absensi/manajemen/_components/SiswaKritisWidget.tsx"] = """'use client'

import { AlertTriangle } from 'lucide-react'
import { useSiswaKritis } from '@/hooks/absensi/useAbsensiManajemen'

interface Props {
  semesterId: string
}

export function SiswaKritisWidget({ semesterId }: Props) {
  const { data, isLoading } = useSiswaKritis(semesterId)

  if (isLoading || !data || data.length === 0) return null

  return (
    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">
          Siswa Perlu Perhatian \u2014 Alpa Berlebihan
        </p>
        <span className="ml-auto text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
          {data.length} siswa
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {data.slice(0, 9).map((s) => (
          <div
            key={s.userId}
            className="flex items-center justify-between gap-2 bg-white dark:bg-gray-900 rounded-xl px-3 py-2 border border-red-100 dark:border-red-900"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.nama}</p>
              <p className="text-xs text-gray-400">{s.kelasNama}</p>
            </div>
            <span className="text-xs font-bold text-red-600 dark:text-red-400 flex-shrink-0 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-lg">
              {s.jumlahAlpa}x Alpa
            </span>
          </div>
        ))}
        {data.length > 9 && (
          <div className="flex items-center justify-center text-xs text-red-400 italic">
            +{data.length - 9} siswa lainnya
          </div>
        )}
      </div>
    </div>
  )
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# WRITER
# ─────────────────────────────────────────────────────────────────────────────
def write_files():
    for relative_path, content in FILES.items():
        full_path = os.path.join(ROOT, relative_path.replace('/', os.sep))
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[OK] {relative_path}")

if __name__ == '__main__':
    write_files()
    print("\n✅ Batch 5 selesai — 5 file digenerate.")
    print("   Verifikasi: npx tsc --noEmit 2>&1 | Select-String 'manajemen|MatrixTable|OverrideModal|SiswaKritis|MatrixFilter'")