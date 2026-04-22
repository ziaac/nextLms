'use client'

import { useState }              from 'react'
import { Calendar, BarChart3, Archive } from 'lucide-react'
import { PageHeader, Button }    from '@/components/ui'
import { EmptyState }            from '@/components/ui/EmptyState'
import { Spinner }               from '@/components/ui/Spinner'
import { useMyStatusHariIni }    from '@/hooks/absensi/useMyStatusHariIni'
import { JadwalSiswaCard }       from './_components/JadwalSiswaCard'
import { PengajuanIzinModal }    from './_components/PengajuanIzinModal'
import { RekapAbsensiSection }   from './_components/RekapAbsensiSection'
import { AbsensiArsipSiswaSlideover } from './_components/AbsensiArsipSiswaSlideover'
import { usePerizinanList }      from '@/hooks/perizinan/usePerizinan'
import { useAuthStore }          from '@/stores/auth.store'
import type { AbsensiStatusItem } from '@/types'
import type { PerizinanItem }    from '@/types/perizinan.types'

type Tab = 'jadwal' | 'rekap'

export default function AbsensiSiswaPage() {
  const { jadwalList, isLoading, aktiveSemesterNama } = useMyStatusHariIni()
  const [izinTarget, setIzinTarget] = useState<AbsensiStatusItem | null>(null)
  const [tab,        setTab]        = useState<Tab>('jadwal')
  const [arsipOpen,  setArsipOpen]  = useState(false)

  const { user } = useAuthStore()

  // Fetch perizinan aktif hari ini (1 request untuk semua card)
  const todayStr = new Date().toISOString().slice(0, 10)
  const { data: perizinanHariIni } = usePerizinanList({
    userId:         user?.id,
    tanggalMulai:   todayStr,
    tanggalSelesai: todayStr,
    limit:          1,
  })
  const perizinanAktif = (perizinanHariIni?.data ?? []).find(
    (p: PerizinanItem) => ['PENDING', 'REVISION_REQUESTED', 'APPROVED'].includes(p.status),
  ) ?? null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Absensi"
        description={aktiveSemesterNama ? 'Semester ' + aktiveSemesterNama : undefined}
        actions={
          <Button
            variant="secondary"
            leftIcon={<Archive className="w-4 h-4" />}
            onClick={() => setArsipOpen(true)}
          >
            Arsip
          </Button>
        }
      />

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 overflow-x-auto overflow-y-hidden no-scrollbar">
        <TabBtn active={tab === 'jadwal'} onClick={() => setTab('jadwal')}>
          <Calendar size={13} /> Jadwal Hari Ini
        </TabBtn>
        <TabBtn active={tab === 'rekap'} onClick={() => setTab('rekap')}>
          <BarChart3 size={13} /> Rekap Kehadiran
        </TabBtn>
      </div>

      {/* Tab: Jadwal Hari Ini */}
      {tab === 'jadwal' && (
        jadwalList.length === 0 ? (
          <EmptyState
            icon={<Calendar size={22} />}
            title="Tidak ada jadwal hari ini"
            description="Kamu tidak memiliki jadwal pelajaran untuk hari ini."
          />
        ) : (
          <div className="grid gap-3">
            {jadwalList.map((item) => (
              <JadwalSiswaCard
                key={item.jadwalId}
                item={item}
                onIzin={() => setIzinTarget(item)}
                perizinanAktif={perizinanAktif}
              />
            ))}
          </div>
        )
      )}

      {/* Tab: Rekap Kehadiran */}
      {tab === 'rekap' && <RekapAbsensiSection />}

      <PengajuanIzinModal
        open={!!izinTarget}
        onClose={() => setIzinTarget(null)}
        jadwal={izinTarget}
      />

      <AbsensiArsipSiswaSlideover
        open={arsipOpen}
        onClose={() => setArsipOpen(false)}
      />
    </div>
  )
}

function TabBtn({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
        active
          ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
