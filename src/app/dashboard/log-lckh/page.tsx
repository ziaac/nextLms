'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader, Button } from '@/components/ui'
import { useHarianLog } from '@/hooks/guru-log/useGuruLog'
import { useUser } from '@/hooks/users/useUsers'
import { useAuthStore } from '@/stores/auth.store'
import { isManajemen } from '@/lib/helpers/role'
import { LogHarianFilterBar } from './_components/LogHarianFilterBar'
import { LogHarianTable }     from './_components/LogHarianTable'
import { ArsipSlideOver }     from './_components/ArsipSlideOver'
import { toast } from 'sonner'
import { Archive, Plus, ArrowLeft } from 'lucide-react'

export default function LogLckhPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { user }     = useAuthStore()

  // Mode manajemen: ada ?guruId di URL dan user adalah manajemen
  const guruIdParam   = searchParams.get('guruId') ?? undefined
  const bulanParam    = searchParams.get('bulan')
  const tahunParam    = searchParams.get('tahun')
  const isManajemenMode = !!guruIdParam && isManajemen(user?.role)

  const now = new Date()
  const [bulan, setBulan] = useState(
    bulanParam ? Number(bulanParam) : now.getMonth() + 1,
  )
  const [tahun, setTahun] = useState(
    tahunParam ? Number(tahunParam) : now.getFullYear(),
  )
  const [arsipOpen, setArsipOpen] = useState(false)

  // Ambil nama guru jika mode manajemen
  const { data: guruData } = useUser(guruIdParam ?? '')

  const { data = [], isLoading, error } = useHarianLog({
    bulan,
    tahun,
    guruId: isManajemenMode ? guruIdParam : undefined,
  })

  useEffect(() => {
    if (error) toast.error('Gagal memuat data log harian')
  }, [error])

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const namaGuru = (guruData as { profile?: { namaLengkap?: string } } | undefined)
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
        tahun={tahun}
        onChange={(b, t) => {
          setBulan(b)
          setTahun(t)
        }}
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
