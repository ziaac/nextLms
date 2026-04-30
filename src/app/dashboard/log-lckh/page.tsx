'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader, Button, Skeleton } from '@/components/ui'
import { useHarianLog } from '@/hooks/guru-log/useGuruLog'
import { useUser } from '@/hooks/users/useUsers'
import { useAuthStore } from '@/stores/auth.store'
import { useTahunAjaranActive } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { isManajemen } from '@/lib/helpers/role'
import { LogHarianFilterBar } from './_components/LogHarianFilterBar'
import { LogHarianTable }     from './_components/LogHarianTable'
import { ArsipSlideOver }     from './_components/ArsipSlideOver'
import { toast } from 'sonner'
import { Archive, Plus, ArrowLeft } from 'lucide-react'

// ── Inner component — pakai useSearchParams di sini ──────────────────────────
function LogLckhContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { user }     = useAuthStore()

  // Mode manajemen: ada ?guruId di URL dan user adalah manajemen
  const guruIdParam     = searchParams.get('guruId') ?? undefined
  const isManajemenMode = !!guruIdParam && isManajemen(user?.role)

  const now = new Date()

  // ── Ambil tahun dari semester/tahun ajaran aktif ──────────────
  const { data: taListRaw = [] } = useTahunAjaranActive()
  const taList  = taListRaw as { id: string; nama: string }[]
  const taAktif = taList[0] ?? null

  const { data: semListRaw = [] } = useSemesterByTahunAjaran(taAktif?.id ?? null)
  const semAktif = (semListRaw as { id: string; nama: string; isActive?: boolean; urutan?: number; tanggalMulai?: string }[])
    .filter((s) => s.isActive)
    .sort((a, b) => (b.urutan ?? 0) - (a.urutan ?? 0))[0] ?? null

  // Tahun dari semester aktif — fallback ke tahun berjalan
  const tahunAktif = semAktif?.tanggalMulai
    ? new Date(semAktif.tanggalMulai).getFullYear()
    : taAktif?.nama
      ? parseInt(taAktif.nama.split('/')[0], 10) || now.getFullYear()
      : now.getFullYear()

  const [bulan, setBulan] = useState(now.getMonth() + 1)
  const [arsipOpen, setArsipOpen] = useState(false)

  const { data = [], isLoading, error } = useHarianLog({
    bulan,
    tahun: tahunAktif,
    guruId: isManajemenMode ? guruIdParam : undefined,
  })

  useEffect(() => {
    if (error) toast.error('Gagal memuat data log harian')
  }, [error])

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const namaGuru = (useUser(guruIdParam ?? '').data as { profile?: { namaLengkap?: string } } | undefined)
    ?.profile?.namaLengkap

  return (
    <div className="space-y-5">
      {/* Tombol kembali ke daftar guru (mode manajemen) */}
      {isManajemenMode && (
        <button
          type="button"
          onClick={() => router.push('/dashboard/log-lckh/manajemen')}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <span className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" />
          </span>
          Kembali ke Daftar Guru
        </button>
      )}

      <PageHeader
        title={isManajemenMode && namaGuru ? `Log LCKH — ${namaGuru}` : 'Log LCKH'}
        description={
          isManajemenMode
            ? 'Laporan Capaian Kinerja Harian guru (mode lihat).'
            : 'Laporan Capaian Kinerja Harian — aktivitas mengajar dan kegiatan harian.'
        }
        actions={
          !isManajemenMode ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setArsipOpen(true)}
              >
                <Archive className="w-4 h-4 mr-1.5" />
                Arsip
              </Button>
              <Button
                size="sm"
                onClick={() => router.push(`/dashboard/log-lckh/${todayStr}`)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Tambah
              </Button>
            </div>
          ) : undefined
        }
      />

      <LogHarianFilterBar
        bulan={bulan}
        tahun={tahunAktif}
        onChange={setBulan}
      />

      <LogHarianTable
        data={data}
        isLoading={isLoading}
        guruId={isManajemenMode ? guruIdParam : undefined}
      />

      {!isManajemenMode && (
        <ArsipSlideOver open={arsipOpen} onClose={() => setArsipOpen(false)} />
      )}
    </div>
  )
}

// ── Page export — bungkus dengan Suspense ─────────────────────────────────────
export default function LogLckhPage() {
  return (
    <Suspense fallback={<Skeleton className="h-80 w-full rounded-2xl" />}>
      <LogLckhContent />
    </Suspense>
  )
}
