'use client'

import { useState, useMemo }              from 'react'
import { useRouter }                      from 'next/navigation'
import { CalendarDays, ChevronRight, Download, BookOpen, BarChart2 } from 'lucide-react'
import { SlideOver }                      from '@/components/ui/SlideOver'
import { Spinner }                        from '@/components/ui/Spinner'
import { Modal }                          from '@/components/ui/Modal'
import { SemesterPillFilter }             from '@/components/absensi/SemesterPillFilter'
import { Combobox }                       from '@/components/ui/Combobox'
import type { ComboboxOption }            from '@/components/ui/Combobox'
import { useTahunAjaranList }             from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran }       from '@/hooks/semester/useSemester'
import { useExportMyJadwal }              from '@/hooks/jadwal/useJadwalView'
import { useMataPelajaranList }           from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useMatrixMapelWali }             from '@/hooks/absensi/useWaliKelas'
import { exportMatrixBlob }               from '@/lib/api/absensi.api'
import { MatrixTable }                    from '@/app/dashboard/absensi/manajemen/_components/MatrixTable'
import { toast }                          from 'sonner'
import type { MataPelajaran }             from '@/types/akademik.types'

interface Props {
  open:    boolean
  onClose: () => void
  guruId:  string
}

// ── Tab switcher kecil ────────────────────────────────────────────────
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
        active
          ? 'bg-emerald-600 text-white'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ── Hook: load semua semester dari semua TA (max 6) ───────────────────
interface SemRow { taId: string; taNama: string; taAktif: boolean; semId: string; semNama: string; semAktif: boolean }

function useSemRows(taList: { id: string; nama: string; isActive?: boolean }[]) {
  const ids = useMemo(() => taList.map((t) => t.id), [taList])
  const { data: sem0 } = useSemesterByTahunAjaran(ids[0] ?? null)
  const { data: sem1 } = useSemesterByTahunAjaran(ids[1] ?? null)
  const { data: sem2 } = useSemesterByTahunAjaran(ids[2] ?? null)
  const { data: sem3 } = useSemesterByTahunAjaran(ids[3] ?? null)
  const { data: sem4 } = useSemesterByTahunAjaran(ids[4] ?? null)
  const { data: sem5 } = useSemesterByTahunAjaran(ids[5] ?? null)

  const semDataMap = useMemo(() => {
    const map: Record<string, { id: string; nama: string; isActive?: boolean }[]> = {}
    const allSems = [sem0, sem1, sem2, sem3, sem4, sem5]
    ids.slice(0, 6).forEach((id, i) => {
      const raw = allSems[i]
      if (raw) map[id] = raw as { id: string; nama: string; isActive?: boolean }[]
    })
    return map
  }, [ids, sem0, sem1, sem2, sem3, sem4, sem5])

  return useMemo((): SemRow[] => {
    const rows: SemRow[] = []
    taList.forEach((ta) => {
      const sems = semDataMap[ta.id] ?? []
      sems.forEach((sem) => rows.push({
        taId: ta.id, taNama: ta.nama, taAktif: !!ta.isActive,
        semId: sem.id, semNama: sem.nama, semAktif: !!sem.isActive,
      }))
    })
    return rows
  }, [taList, semDataMap])
}

// ── Tab Jadwal ────────────────────────────────────────────────────────
function JadwalArsipTab({ onClose }: { onClose: () => void }) {
  const router     = useRouter()
  const [exportingId, setExportingId] = useState<string | null>(null)
  const exportMutation = useExportMyJadwal()

  const { data: taListRaw, isLoading: loadingTA } = useTahunAjaranList()
  const taList = useMemo(
    () => (taListRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? [],
    [taListRaw],
  )
  const semRows = useSemRows(taList)

  const grouped = useMemo(() => {
    const map = new Map<string, { taNama: string; taAktif: boolean; sems: SemRow[] }>()
    semRows.filter((r) => !r.semAktif).forEach((r) => {
      if (!map.has(r.taId)) map.set(r.taId, { taNama: r.taNama, taAktif: r.taAktif, sems: [] })
      map.get(r.taId)!.sems.push(r)
    })
    return [...map.entries()].filter(([, v]) => v.sems.length > 0)
  }, [semRows])

  const handleExport = async (semId: string) => {
    setExportingId(semId)
    try {
      await exportMutation.mutateAsync(semId)
      toast.success('Berhasil mengunduh PDF')
    } catch {
      toast.error('Gagal mengunduh PDF')
    } finally {
      setExportingId(null)
    }
  }

  const handleLihat = (row: SemRow) => {
    const params = new URLSearchParams({ semesterId: row.semId, semNama: row.semNama, taNama: row.taNama })
    router.push(`/dashboard/jadwal/arsip?${params.toString()}`)
    onClose()
  }

  if (loadingTA) return <div className="flex justify-center py-14"><Spinner /></div>
  if (grouped.length === 0) return (
    <div className="flex flex-col items-center justify-center py-14 gap-2">
      <CalendarDays size={36} className="text-gray-300" />
      <p className="text-sm text-gray-400">Belum ada data arsip jadwal</p>
    </div>
  )

  return (
    <div className="space-y-5">
      {grouped.map(([taId, { taNama, taAktif, sems }]) => (
        <div key={taId}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{taNama}</span>
            {taAktif && (
              <span className="text-[10px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 px-1.5 py-0.5 rounded-full">
                Aktif
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {sems.map((row) => (
              <div key={row.semId} className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-2 min-w-0">
                  <CalendarDays className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{row.semNama}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    title="Download PDF Jadwal"
                    disabled={exportingId === row.semId}
                    onClick={() => { void handleExport(row.semId) }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {exportingId === row.semId ? <Spinner className="h-3.5 w-3.5 mr-0" /> : <Download className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLihat(row)}
                    className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 px-2 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                  >
                    Lihat <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tab Absensi ───────────────────────────────────────────────────────
function AbsensiArsipTab({ guruId }: { guruId: string }) {
  const [taId,        setTaId]        = useState('')
  const [semesterId,  setSemesterId]  = useState('')
  const [exporting,   setExporting]   = useState<string | null>(null)
  const [rekapTarget, setRekapTarget] = useState<MataPelajaran | null>(null)

  const { data: taListRaw } = useTahunAjaranList()
  const taList = (taListRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? []

  const { data: semListRaw } = useSemesterByTahunAjaran(taId || null)
  const semList = (semListRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? []

  const taOptions: ComboboxOption[] = useMemo(() =>
    taList.filter((t) => !t.isActive).map((t) => ({ label: t.nama, value: t.id })),
    [taList],
  )
  const pillSemesters = useMemo(() =>
    semList.filter((s) => !s.isActive).map((s) => ({ id: s.id, nama: s.nama, isActive: false })),
    [semList],
  )

  const { data: mapelResp, isLoading: loadingMapel } = useMataPelajaranList(
    { guruId, semesterId },
    { enabled: !!guruId && !!semesterId },
  )
  const mapelList = ((mapelResp as { data?: MataPelajaran[] } | undefined)?.data ?? []) as MataPelajaran[]

  const handleExport = async (m: MataPelajaran) => {
    setExporting(m.id)
    try {
      await exportMatrixBlob({ kelasId: m.kelasId, mataPelajaranId: m.id, semesterId })
    } finally {
      setExporting(null)
    }
  }

  return (
    <>
      <div className="space-y-5">
        <p className="text-sm text-gray-500">Pilih tahun ajaran dan semester lampau untuk melihat matriks absensi.</p>

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
              <SemesterPillFilter semesters={pillSemesters} value={semesterId} onChange={setSemesterId} />
            </div>
          )}
          {taId && pillSemesters.length === 0 && (
            <p className="text-xs text-gray-400 italic">Tidak ada semester lampau untuk tahun ajaran ini.</p>
          )}
        </div>

        {!taId || !semesterId ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <BarChart2 size={32} className="text-gray-300" />
            <p className="text-sm text-gray-400">Pilih tahun ajaran dan semester lampau</p>
          </div>
        ) : loadingMapel ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : mapelList.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10 italic">Tidak ada data mengajar pada semester ini.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{mapelList.length} mata pelajaran</p>
            {mapelList.map((m) => (
              <div key={m.id} className="w-full flex items-center gap-3 p-3.5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-emerald-200 hover:shadow-sm transition-all">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={16} className="text-emerald-600" />
                </div>
                <button type="button" onClick={() => setRekapTarget(m)} className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {m.mataPelajaranTingkat.masterMapel.nama}
                  </p>
                  <p className="text-xs text-gray-400">{m.kelas.namaKelas} · {m.mataPelajaranTingkat.masterMapel.kode}</p>
                </button>
                <button
                  type="button"
                  onClick={() => { void handleExport(m) }}
                  disabled={exporting === m.id}
                  title="Download PDF matriks absensi"
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
                >
                  {exporting === m.id ? <Spinner /> : <Download size={14} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal matriks */}
      <RekapMatrixModal mapel={rekapTarget} semesterId={semesterId} onClose={() => setRekapTarget(null)} />
    </>
  )
}

function RekapMatrixModal({ mapel, semesterId, onClose }: { mapel: MataPelajaran | null; semesterId: string; onClose: () => void }) {
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
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : matrix ? (
          <MatrixTable matrix={matrix} onOverride={() => undefined} />
        ) : (
          <p className="text-sm text-gray-400 text-center py-10 italic">Belum ada data rekap.</p>
        )}
      </div>
    </Modal>
  )
}

// ── Main export ───────────────────────────────────────────────────────
export function ArsipGabunganSlideover({ open, onClose, guruId }: Props) {
  const [activeTab, setActiveTab] = useState<'jadwal' | 'absensi'>('jadwal')

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Arsip"
      description="Riwayat jadwal mengajar dan rekap absensi"
      width="md"
    >
      <div className="space-y-5">
        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <TabBtn active={activeTab === 'jadwal'}  onClick={() => setActiveTab('jadwal')}>Jadwal</TabBtn>
          <TabBtn active={activeTab === 'absensi'} onClick={() => setActiveTab('absensi')}>Matriks Absensi</TabBtn>
        </div>

        {activeTab === 'jadwal'  && <JadwalArsipTab onClose={onClose} />}
        {activeTab === 'absensi' && <AbsensiArsipTab guruId={guruId} />}
      </div>
    </SlideOver>
  )
}
