'use client'

import { useMemo, useState }            from 'react'
import { useRouter }                    from 'next/navigation'
import { CalendarDays, ChevronRight, Download } from 'lucide-react'
import { SlideOver }                    from '@/components/ui/SlideOver'
import { Spinner }                      from '@/components/ui/Spinner'
import { useTahunAjaranList }           from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran }     from '@/hooks/semester/useSemester'
import { useExportMyJadwal }            from '@/hooks/jadwal/useJadwalView'
import { toast }                        from 'sonner'

interface Props {
  open:      boolean
  onClose:   () => void
  /** Path prefix untuk halaman arsip, default /dashboard/jadwal/arsip */
  arsipPath?: string
}

interface SemRow {
  taId:      string
  taNama:    string
  taAktif:   boolean
  semId:     string
  semNama:   string
  semAktif:  boolean
}

/** Hook: kumpulkan semua TA + semesternya menjadi flat list */
function useSemRows(taList: { id: string; nama: string; isActive?: boolean }[]) {
  // Query semester per TA — kita load semua sekaligus secara statis
  // Karena hooks tidak bisa dipanggil dalam loop, kita batasi ke 6 TA terakhir
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
      sems.forEach((sem) => {
        rows.push({
          taId:    ta.id,
          taNama:  ta.nama,
          taAktif: !!ta.isActive,
          semId:   sem.id,
          semNama: sem.nama,
          semAktif: !!sem.isActive,
        })
      })
    })
    return rows
  }, [taList, semDataMap])
}

export function JadwalArsipSlideover({ open, onClose, arsipPath = '/dashboard/jadwal/arsip' }: Props) {
  const router = useRouter()
  const [exportingId, setExportingId] = useState<string | null>(null)

  const { data: taListRaw, isLoading: loadingTA } = useTahunAjaranList()
  const taList = useMemo(
    () => (taListRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? [],
    [taListRaw],
  )

  const exportMutation = useExportMyJadwal()

  const semRows = useSemRows(taList)

  // Group by TA — semester aktif dikecualikan (sudah tersedia di halaman utama)
  const grouped = useMemo(() => {
    const map = new Map<string, { taNama: string; taAktif: boolean; sems: SemRow[] }>()
    semRows
      .filter((r) => !r.semAktif)
      .forEach((r) => {
        if (!map.has(r.taId)) map.set(r.taId, { taNama: r.taNama, taAktif: r.taAktif, sems: [] })
        map.get(r.taId)!.sems.push(r)
      })
    // Buang TA yang tidak punya semester arsip sama sekali
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
    const params = new URLSearchParams({
      semesterId: row.semId,
      semNama:    row.semNama,
      taNama:     row.taNama,
    })
    router.push(`${arsipPath}?${params.toString()}`)
    onClose()
  }

  const isEmpty = !loadingTA && grouped.length === 0

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Arsip Jadwal"
      description="Riwayat jadwal mengajar per tahun ajaran"
      width="md"
    >
      <div className="space-y-5">
        {loadingTA && (
          <div className="flex items-center justify-center py-14">
            <Spinner />
          </div>
        )}

        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-14 text-gray-300 gap-2">
            <CalendarDays size={36} className="opacity-30" />
            <p className="text-sm text-gray-400">Belum ada data tahun ajaran</p>
          </div>
        )}

        {grouped.map(([taId, { taNama, taAktif, sems }]) => (
          <div key={taId}>
            {/* TA header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{taNama}</span>
              {taAktif && (
                <span className="text-[10px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 px-1.5 py-0.5 rounded-full">
                  Aktif
                </span>
              )}
            </div>

            {/* Semester rows */}
            <div className="space-y-1.5">
              {sems.map((row) => (
                <div
                  key={row.semId}
                  className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CalendarDays className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                      {row.semNama}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      title="Download PDF"
                      disabled={exportingId === row.semId}
                      onClick={() => { void handleExport(row.semId) }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {exportingId === row.semId
                        ? <Spinner className="h-3.5 w-3.5 mr-0" />
                        : <Download className="h-3.5 w-3.5" />
                      }
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLihat(row)}
                      className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors px-2 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
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
    </SlideOver>
  )
}
