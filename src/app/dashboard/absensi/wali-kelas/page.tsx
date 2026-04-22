'use client'

import { useState, useMemo, useEffect }  from 'react'
import { useRouter }                      from 'next/navigation'
import { ArrowLeft, Users }               from 'lucide-react'
import { useMyStatusHariIni }            from '@/hooks/absensi/useMyStatusHariIni'
import { useIzinPendingWali }            from '@/hooks/absensi/useWaliKelas'
import { useTahunAjaranActive }          from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran }      from '@/hooks/semester/useSemester'
import { Spinner }                       from '@/components/ui/Spinner'
import { EmptyState }                    from '@/components/ui/EmptyState'
import { SemesterPillFilter }            from '@/components/absensi/SemesterPillFilter'
import { RekapHarianTab }                from './_components/RekapHarianTab'
import { RekapSemesterTab }              from './_components/RekapSemesterTab'
import { MatrixMapelTab }                from './_components/MatrixMapelTab'
import { IzinPendingTab }                from './_components/IzinPendingTab'
import type { PerizinanItem }            from '@/types/perizinan.types'

type SubTab = 'harian' | 'semester' | 'matrix' | 'izin'

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: 'harian',   label: 'Rekap Hari Ini' },
  { key: 'semester', label: 'Rekap Semester' },
  { key: 'matrix',   label: 'Matrix Mapel'   },
  { key: 'izin',     label: 'Izin Masuk'     },
]

export default function AbsensiWaliKelasPage() {
  const router = useRouter()

  // ── TA aktif (auto-resolve) ───────────────────────────────────────────
  const { data: taListRaw = [] } = useTahunAjaranActive()
  const taList  = taListRaw as { id: string; nama: string }[]
  const taAktif = taList[0]

  // ── Semester Pills ────────────────────────────────────────────────────
  const { data: semListRaw } = useSemesterByTahunAjaran(taAktif?.id ?? null)
  const semList = (semListRaw as { id: string; nama: string; isActive?: boolean; urutan?: number }[] | undefined) ?? []

  const [semesterId, setSemesterId] = useState('')
  useEffect(() => {
    if (semList.length === 0) return
    const found = semList.find((s) => s.id === semesterId)
    if (!found) {
      const aktif = semList.find((s) => s.isActive) ?? semList[0]
      if (aktif) setSemesterId(aktif.id)
    }
  }, [semList, semesterId])

  const semAktif = useMemo(
    () => semList.filter((s) => s.isActive).sort((a, b) => (b.urutan ?? 0) - (a.urutan ?? 0))[0] ?? null,
    [semList],
  )
  const resolvedSemId = semesterId || semAktif?.id || semList[0]?.id || ''

  // Pill semesters — tampilkan semua semester TA aktif
  const pillSemesters = useMemo(() =>
    semList.map((s) => ({ id: s.id, nama: s.nama, isActive: s.isActive ?? false })),
    [semList],
  )

  // ── Data wali kelas ───────────────────────────────────────────────────
  const { isLoading, isWaliKelas, kelasWali } = useMyStatusHariIni(resolvedSemId || undefined)

  const [activeKelasId, setActiveKelasId] = useState<string>('')
  const [subTab, setSubTab]               = useState<SubTab>('harian')

  const resolvedKelasId = activeKelasId || kelasWali[0]?.id || ''
  const namaKelas = kelasWali.find((k) => k.id === resolvedKelasId)?.namaKelas ?? ''

  // ── Izin hari ini — untuk badge tab ──────────────────────────────────
  const { data: izinData } = useIzinPendingWali(resolvedKelasId || null)
  const todayIzinCount = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD lokal
    return (izinData?.data ?? []).filter((p: PerizinanItem) =>
      (p.status === 'PENDING' || p.status === 'REVISION_REQUESTED') &&
      new Date(p.createdAt).toLocaleDateString('en-CA') === today,
    ).length
  }, [izinData])

  // ── Render ────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex items-center justify-center py-24"><Spinner /></div>
  )

  if (!isWaliKelas || kelasWali.length === 0) return (
    <div className="max-w-lg mx-auto">
      <EmptyState
        icon={<Users size={22} />}
        title="Bukan Wali Kelas"
        description="Kamu belum ditugaskan sebagai wali kelas semester ini."
      />
    </div>
  )

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => router.push('/dashboard/pembelajaran/guru')}
          className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center shrink-0 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Users className="h-4 w-4 text-emerald-500 shrink-0" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
              Wali Kelas
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {namaKelas
              ? namaKelas
              : semAktif
                ? `${semAktif.nama}${taAktif ? ' — ' + taAktif.nama : ''}`
                : 'Tidak ada semester aktif'}
          </p>
        </div>
      </div>

      {/* ── Semester Pills ──────────────────────────────────────────── */}
      {pillSemesters.length > 0 && (
        <SemesterPillFilter
          semesters={pillSemesters}
          value={resolvedSemId}
          onChange={setSemesterId}
        />
      )}

      {/* Tab Kelas — jika > 1 */}
      {kelasWali.length > 1 && (
        <div className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-gray-200 dark:border-gray-800">
          {kelasWali.map((k) => (
            <TabBtn
              key={k.id}
              active={resolvedKelasId === k.id}
              onClick={() => { setActiveKelasId(k.id); setSubTab('harian') }}
            >
              {k.namaKelas}
            </TabBtn>
          ))}
        </div>
      )}

      {/* Sub-tab */}
      <div className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-gray-200 dark:border-gray-800">
        {SUB_TABS.map(({ key, label }) => (
          <TabBtn
            key={key}
            active={subTab === key}
            onClick={() => setSubTab(key)}
            badge={key === 'izin' ? todayIzinCount : 0}
          >
            {label}
          </TabBtn>
        ))}
      </div>

      {/* Content */}
      {subTab === 'harian'   && <RekapHarianTab   kelasId={resolvedKelasId} semesterId={resolvedSemId} />}
      {subTab === 'semester' && <RekapSemesterTab  kelasId={resolvedKelasId} semesterId={resolvedSemId} />}
      {subTab === 'matrix'   && <MatrixMapelTab    kelasId={resolvedKelasId} semesterId={resolvedSemId} />}
      {subTab === 'izin'     && <IzinPendingTab    kelasId={resolvedKelasId} />}
    </div>
  )
}

function TabBtn({ active, onClick, badge = 0, children }: {
  active:    boolean
  onClick:   () => void
  badge?:    number
  children:  React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
        active
          ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
      ].join(' ')}
    >
      {children}
      {badge > 0 && (
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-rose-500 text-white leading-none">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
}
