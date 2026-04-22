'use client'

import { useState, useMemo }            from 'react'
import { BookOpen, BarChart2, Download } from 'lucide-react'
import { SlideOver }                    from '@/components/ui'
import { Spinner }                      from '@/components/ui/Spinner'
import { Modal }                        from '@/components/ui/Modal'
import { SemesterPillFilter }           from '@/components/absensi/SemesterPillFilter'
import { Combobox }                     from '@/components/ui/Combobox'
import type { ComboboxOption }          from '@/components/ui/Combobox'
import { useTahunAjaranList }           from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran }     from '@/hooks/semester/useSemester'
import { useMataPelajaranList }         from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useMatrixMapelWali }           from '@/hooks/absensi/useWaliKelas'
import { exportMatrixBlob }             from '@/lib/api/absensi.api'
import { MatrixTable }                  from '../../manajemen/_components/MatrixTable'
import type { MataPelajaran }           from '@/types/akademik.types'

interface Props {
  open:    boolean
  onClose: () => void
  guruId:  string
}

export function AbsensiArsipSlideover({ open, onClose, guruId }: Props) {
  const [taId, setTaId]             = useState('')
  const [semesterId, setSemesterId] = useState('')
  const [exporting, setExporting]   = useState<string | null>(null)
  const [rekapTarget, setRekapTarget] = useState<MataPelajaran | null>(null)

  const { data: taListRaw }  = useTahunAjaranList()
  const taList = (taListRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? []

  const { data: semListRaw } = useSemesterByTahunAjaran(taId || null)
  const semList = (semListRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? []

  // Hanya TA yang TIDAK aktif
  const taOptions: ComboboxOption[] = useMemo(() =>
    taList
      .filter((t) => !t.isActive)
      .map((t) => ({ label: t.nama, value: t.id })),
    [taList],
  )

  // Hanya semester yang TIDAK aktif
  const pillSemesters = useMemo(() =>
    semList
      .filter((s) => !s.isActive)
      .map((s) => ({ id: s.id, nama: s.nama, isActive: false })),
    [semList],
  )

const { data: mapelResp, isLoading: loadingMapel } = useMataPelajaranList(
  { guruId, semesterId }, // Tetap kirim objeknya
  { enabled: !!guruId && !!semesterId } // Query HANYA jalan jika keduanya ada isinya
)
  const mapelList = (
    (mapelResp as { data?: MataPelajaran[] } | undefined)?.data ?? []
  ) as MataPelajaran[]

  const handleExport = async (m: MataPelajaran) => {
    setExporting(m.id)
    try {
      await exportMatrixBlob({
        kelasId:         m.kelasId,
        mataPelajaranId: m.id,
        semesterId,
      })
    } finally {
      setExporting(null)
    }
  }

  return (
    <>
      <SlideOver open={open} onClose={onClose} title="Arsip Absensi" width="md">
        <div className="space-y-5">
          <p className="text-sm text-gray-500">
            Pilih tahun ajaran dan semester lampau untuk melihat rekap absensi.
          </p>

          {/* Filter */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">Tahun Ajaran (Lampau)</label>
              <Combobox
                options={taOptions}
                value={taId}
                onChange={(v) => { setTaId(v); setSemesterId('') }}
                placeholder={taOptions.length === 0 ? 'Tidak ada arsip' : 'Pilih tahun ajaran...'}
                disabled={taOptions.length === 0}
              />
            </div>
            {taId && pillSemesters.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">Semester</label>
                <SemesterPillFilter
                  semesters={pillSemesters}
                  value={semesterId}
                  onChange={setSemesterId}
                />
              </div>
            )}
            {taId && pillSemesters.length === 0 && (
              <p className="text-xs text-gray-400 italic">
                Tidak ada semester lampau untuk tahun ajaran ini.
              </p>
            )}
          </div>

          {/* List mapel */}
          {!taId || !semesterId ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300">
              <BarChart2 size={32} className="opacity-40 mb-2" />
              <p className="text-sm text-gray-400">Pilih tahun ajaran dan semester lampau</p>
            </div>
          ) : loadingMapel ? (
            <div className="flex items-center justify-center py-10"><Spinner /></div>
          ) : mapelList.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10 italic">
              Tidak ada data mengajar pada semester ini.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {mapelList.length} mata pelajaran diajarkan
              </p>
              {mapelList.map((m) => (
                <div
                  key={m.id}
                  className="w-full flex items-center gap-3 p-3.5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-emerald-200 hover:shadow-sm transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={16} className="text-emerald-600" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setRekapTarget(m)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {m.mataPelajaranTingkat.masterMapel.nama}
                    </p>
                    <p className="text-xs text-gray-400">
                      {m.kelas.namaKelas} · {m.mataPelajaranTingkat.masterMapel.kode}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport(m)}
                    disabled={exporting === m.id}
                    title="Download PDF rekap absensi"
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
                  >
                    {exporting === m.id ? <Spinner /> : <Download size={14} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SlideOver>

      <RekapMatrixModal
        mapel={rekapTarget}
        semesterId={semesterId}
        onClose={() => setRekapTarget(null)}
      />
    </>
  )
}

function RekapMatrixModal({
  mapel, semesterId, onClose,
}: {
  mapel:      MataPelajaran | null
  semesterId: string
  onClose:    () => void
}) {
  const { data: matrix, isLoading } = useMatrixMapelWali({
    kelasId:         mapel?.kelasId ?? '',
    mataPelajaranId: mapel?.id ?? '',
    semesterId,
  })

  return (
    <Modal
      open={!!mapel}
      onClose={onClose}
      title={mapel?.mataPelajaranTingkat.masterMapel.nama ?? ''}
      description={mapel?.kelas.namaKelas}
      size="xl"
    >
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        ) : matrix ? (
          <MatrixTable matrix={matrix} onOverride={() => undefined} />
        ) : (
          <p className="text-sm text-gray-400 text-center py-10 italic">
            Belum ada data rekap untuk mata pelajaran ini.
          </p>
        )}
      </div>
    </Modal>
  )
}
