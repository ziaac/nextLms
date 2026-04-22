'use client'

import { Suspense, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useKelasById } from '@/hooks/kelas/useKelas'
import { Button } from '@/components/ui'
import { ArrowLeft } from 'lucide-react'
import { JadwalFormLayout } from './_components/JadwalFormLayout'
import { BuatJadwalPageSkeleton } from './_components/BuatJadwalPageSkeleton'
import type { HariConfig } from './_components/jadwal-form.types'
import type { HariEnum } from '@/types/jadwal.types'

const DEFAULT_HARI_CONFIG: HariConfig[] = [
  { hari: 'SENIN'  as HariEnum, aktif: true },
  { hari: 'SELASA' as HariEnum, aktif: true },
  { hari: 'RABU'   as HariEnum, aktif: true },
  { hari: 'KAMIS'  as HariEnum, aktif: true },
  { hari: 'JUMAT'  as HariEnum, aktif: true },
]

function BuatJadwalInner() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const kelasId       = searchParams.get('kelasId')    ?? ''
  const semesterId    = searchParams.get('semesterId') ?? ''
  const hariConfigRaw = searchParams.get('hariConfig')

  const hariConfig = useMemo((): HariConfig[] => {
    if (!hariConfigRaw) return DEFAULT_HARI_CONFIG
    try {
      const parsed = JSON.parse(decodeURIComponent(hariConfigRaw)) as HariConfig[]
      return parsed.length ? parsed : DEFAULT_HARI_CONFIG
    } catch { return DEFAULT_HARI_CONFIG }
  }, [hariConfigRaw])

  const { data: kelasRaw, isLoading: loadingKelas } = useKelasById(kelasId || null)

  const kelas = kelasRaw as {
    namaKelas:      string
    tingkatKelasId: string
    ruanganId?:     string | null
    ruangan?:       { id: string; nama: string; kode: string } | null
  } | undefined

  // Nama ruangan default kelas — dari relasi ruangan atau fallback
  const kelasRuanganNama = kelas?.ruangan?.nama ?? ''

  if (!kelasId || !semesterId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-500 text-sm">Parameter tidak lengkap.</p>
        <Button variant="secondary" size="sm" onClick={() => { router.back() }}>Kembali</Button>
      </div>
    )
  }

  if (loadingKelas) return <BuatJadwalPageSkeleton />

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <Button 
          variant="secondary" 
          onClick={() => router.back()}
          className="w-10 h-10 !p-0 flex items-center justify-center rounded-lg shrink-0 shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Buat Jadwal{kelas ? ' — ' + kelas.namaKelas : ''}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Drag mata pelajaran ke slot · Pilih guru pada setiap sesi
          </p>
        </div>
      </div>

      <JadwalFormLayout
        kelasId={kelasId}
        semesterId={semesterId}
        hariConfig={hariConfig}
        tingkatKelasId={kelas?.tingkatKelasId ?? ''}
        namaKelas={kelas?.namaKelas ?? kelasId}
        kelasRuanganId={kelas?.ruanganId ?? ''}
        kelasRuanganNama={kelasRuanganNama}
      />
    </div>
  )
}

export default function BuatJadwalPage() {
  return (
    <Suspense fallback={<BuatJadwalPageSkeleton />}>
      <BuatJadwalInner />
    </Suspense>
  )
}
