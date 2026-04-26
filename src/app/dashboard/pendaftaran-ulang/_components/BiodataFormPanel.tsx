'use client'

import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { SlideOver } from '@/components/ui'
import { useBiodataById } from '@/hooks/pendaftaran/usePendaftaran'
import { PENDAFTARAN_KEYS } from '@/hooks/pendaftaran/usePendaftaran'
import type { SiswaLulus, VerifikasiIdentitasResult } from '@/types/pendaftaran.types'
import { FormBiodata } from '@/app/siswa-baru/_components/FormBiodata'

interface Props {
  item: SiswaLulus | null
  onClose: () => void
}

export function BiodataFormPanel({ item, onClose }: Props) {
  const qc = useQueryClient()
  const biodataId = item?.biodata?.id ?? null

  const { data: existingBiodata, isLoading } = useBiodataById(biodataId)

  const handleDone = () => {
    qc.invalidateQueries({ queryKey: PENDAFTARAN_KEYS.all })
    onClose()
  }

  // Construct a session-compatible object from SiswaLulus
  const session: VerifikasiIdentitasResult | null = item
    ? {
        id:                item.id,
        nama:              item.nama,
        noPendaftaran:     item.noPendaftaran,
        jalurPendaftaran:  item.jalurPendaftaran,
        tahunAjaran:       item.tahunAjaran,
        status:            item.status,
        sudahIsiBiodata:   !!item.biodata,
        biodataId:         item.biodata?.id ?? null,
        biodataStatus:     item.biodata?.status ?? null,
      }
    : null

  return (
    <SlideOver
      open={!!item}
      onClose={onClose}
      title={item?.biodata ? 'Edit Biodata Siswa' : 'Isi Biodata Siswa'}
      description={item ? `${item.nama} · ${item.noPendaftaran}` : undefined}
      width="xl"
    >
      {!session ? null : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-emerald-500" />
        </div>
      ) : (
        <FormBiodata
          session={session}
          existingBiodata={existingBiodata ?? null}
          onDone={handleDone}
        />
      )}
    </SlideOver>
  )
}
