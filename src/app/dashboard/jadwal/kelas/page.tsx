'use client'

import { useState, useMemo }           from 'react'
import { Archive, Download, GraduationCap } from 'lucide-react'
import { useAuthStore }                from '@/stores/auth.store'
import { useTahunAjaranActive }        from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran }    from '@/hooks/semester/useSemester'
import { useMyJadwalMingguan, useExportMyJadwal } from '@/hooks/jadwal/useJadwalView'
import { Button }                      from '@/components/ui'
import { JadwalMingguanSiswaView }     from './_components/JadwalMingguanSiswa'
import { JadwalHariIniWidget }         from '@/components/jadwal/JadwalHariIniWidget'
import { HariFilter }                  from '@/components/jadwal/HariFilter'
import { JadwalArsipSlideover }        from '@/components/jadwal/JadwalArsipSlideover'
import { toast }                       from 'sonner'
import type { JadwalMingguanResponse } from '@/types/jadwal-view.types'
import type { HariEnum }               from '@/types/jadwal.types'

const HARI_LIST: HariEnum[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']

export default function JadwalKelasPage() {
  const user = useAuthStore((s) => s.user)
  const [selectedHari, setSelectedHari] = useState<HariEnum | 'ALL'>('ALL')
  const [arsipOpen,    setArsipOpen]    = useState(false)

  // ── Resolve TA & Semester aktif ─────────────────────────────
  const { data: taListRaw = [] }      = useTahunAjaranActive()
  const taList  = taListRaw as { id: string; nama: string }[]
  const taAktif = taList[0]

  const { data: semListRaw = [] } = useSemesterByTahunAjaran(taAktif?.id ?? null)
  const semList = semListRaw as { id: string; nama: string; isActive?: boolean; urutan?: number }[]

  // Semester aktif urutan tertinggi
  const semAktif = semList
    .filter((s) => s.isActive)
    .sort((a, b) => (b.urutan ?? 0) - (a.urutan ?? 0))[0] ?? null

  const resolvedSemId = semAktif?.id ?? ''

  const { data: jadwalRaw, isLoading } = useMyJadwalMingguan(resolvedSemId || null)
  const jadwal = jadwalRaw as JadwalMingguanResponse | undefined

  const availableHari = useMemo((): HariEnum[] =>
    HARI_LIST.filter((h) => (jadwal?.data ?? []).some((i) => i.hari === h)),
    [jadwal],
  )

  const exportMutation = useExportMyJadwal()
  const handleExport = async () => {
    if (!resolvedSemId) return
    try {
      await exportMutation.mutateAsync(resolvedSemId)
      toast.success('Export berhasil')
    } catch {
      toast.error('Gagal export')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-5 w-5 text-blue-500" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Jadwal Pelajaran</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {semAktif
              ? `Semester ${semAktif.nama}${taAktif ? ' — ' + taAktif.nama : ''}`
              : `Halo, ${user?.namaLengkap ?? 'Siswa'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            leftIcon={<Archive size={16} />}
            onClick={() => setArsipOpen(true)}
          >
            Arsip
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Download size={16} />}
            loading={exportMutation.isPending}
            disabled={!resolvedSemId}
            onClick={() => { void handleExport() }}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Tidak ada semester aktif */}
      {!semAktif && !isLoading && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-700">
            Tidak ada semester aktif. Hubungi admin untuk mengaktifkan semester.
          </p>
        </div>
      )}

      {/* Hari filter */}
      {resolvedSemId && (
        <div className="flex justify-end">
          <HariFilter
            available={availableHari}
            selected={selectedHari}
            onChange={setSelectedHari}
          />
        </div>
      )}

      {resolvedSemId && <JadwalHariIniWidget semesterId={resolvedSemId} label="Pelajaran" />}

      <JadwalMingguanSiswaView data={jadwal} isLoading={isLoading} selectedHari={selectedHari} />

      <JadwalArsipSlideover open={arsipOpen} onClose={() => setArsipOpen(false)} />
    </div>
  )
}
