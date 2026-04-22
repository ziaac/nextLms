'use client'

import { useState }              from 'react'
import { Download }              from 'lucide-react'
import { PageHeader }            from '@/components/ui/PageHeader'
import { Button }                from '@/components/ui/Button'
import { Spinner }               from '@/components/ui/Spinner'
import { useTahunAjaranList }    from '@/hooks/tahun-ajaran/useTahunAjaran'
import {
  useMatrixRekap,
  useOverrideAbsensi,
  useSimpanManualSingle,
  useExportMatrix,
} from '@/hooks/absensi/useAbsensiManajemen'
import { MatrixFilterBar }   from './_components/MatrixFilterBar'
import { MatrixTable }       from './_components/MatrixTable'
import { OverrideModal }     from './_components/OverrideModal'
import { SiswaKritisWidget } from './_components/SiswaKritisWidget'
import type { StatusAbsensi } from '@/types'

interface OverrideTarget {
  absensiId:         string | null
  userId:            string
  namaSiswa:         string
  tanggal:           string
  jadwalPelajaranId: string
}

export default function AbsensiManajemenPage() {
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const [kelasId,       setKelasId]       = useState('')
  const [semesterId,    setSemesterId]    = useState('')
  const [mapelId,       setMapelId]       = useState('')

  const [overrideTarget, setOverrideTarget] = useState<OverrideTarget | null>(null)

  const { data: taList } = useTahunAjaranList()
  const activeTa = (taList as { id: string; isActive?: boolean }[] | undefined)
    ?.find((t) => t.isActive)

  const { data: matrix, isLoading, isFetching } = useMatrixRekap({
    kelasId,
    mataPelajaranId: mapelId,
    semesterId,
  })

  const override     = useOverrideAbsensi()
  const manualSingle = useSimpanManualSingle()
  const exportMatrix = useExportMatrix()

  const isPending  = override.isPending || manualSingle.isPending
  const canExport  = !!kelasId && !!semesterId && !!mapelId

  const handleTaChange = (v: string) => {
    setTahunAjaranId(v); setKelasId(''); setSemesterId(''); setMapelId('')
  }
  const handleKelasChange    = (v: string) => { setKelasId(v);    setMapelId('') }
  const handleSemesterChange = (v: string) => { setSemesterId(v); setMapelId('') }

  const handleSubmitOverride = (status: StatusAbsensi, keterangan?: string) => {
    if (!overrideTarget) return
    if (overrideTarget.absensiId) {
      override.mutate(
        { id: overrideTarget.absensiId, payload: { status, keterangan } },
        { onSuccess: () => setOverrideTarget(null) },
      )
    } else {
      manualSingle.mutate(
        {
          userId:            overrideTarget.userId,
          jadwalPelajaranId: overrideTarget.jadwalPelajaranId,
          tanggal:           overrideTarget.tanggal,
          status,
          keterangan,
        },
        { onSuccess: () => setOverrideTarget(null) },
      )
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Rekap Absensi" />

      {activeTa && semesterId && (
        <SiswaKritisWidget semesterId={semesterId} />
      )}

      {/* Filter */}
      <MatrixFilterBar
        tahunAjaranId={tahunAjaranId}
        kelasId={kelasId}
        semesterId={semesterId}
        mataPelajaranId={mapelId}
        onTahunAjaranChange={handleTaChange}
        onKelasChange={handleKelasChange}
        onSemesterChange={handleSemesterChange}
        onMapelChange={setMapelId}
      />

      {/* Tombol Export — muncul hanya saat filter lengkap */}
      {canExport && (
        <div className="flex justify-end">
          <Button
            variant="secondary" size="sm"
            leftIcon={<Download size={14} />}
            loading={exportMatrix.isPending}
            onClick={() => exportMatrix.mutate({
              kelasId,
              mataPelajaranId: mapelId,
              semesterId,
            })}
          >
            Export PDF
          </Button>
        </div>
      )}

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
          <p className="text-sm text-gray-400 text-center">
            {!tahunAjaranId ? 'Pilih tahun ajaran untuk memulai.' :
             !kelasId       ? 'Pilih kelas.' :
             !semesterId    ? 'Pilih semester.' :
             !mapelId       ? 'Pilih mata pelajaran untuk menampilkan rekap.' :
             'Tidak ada data rekap.'}
          </p>
        </div>
      )}

      <OverrideModal
        open={!!overrideTarget}
        target={overrideTarget}
        onClose={() => setOverrideTarget(null)}
        onSubmit={handleSubmitOverride}
        isPending={isPending}
      />
    </div>
  )
}
