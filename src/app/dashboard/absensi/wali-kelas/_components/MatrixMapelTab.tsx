'use client'

import { useState, useMemo }        from 'react'
import { Combobox }                 from '@/components/ui/Combobox'
import type { ComboboxOption }      from '@/components/ui/Combobox'
import { Spinner }                  from '@/components/ui/Spinner'
import { useMataPelajaranList }     from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useMatrixMapelWali }       from '@/hooks/absensi/useWaliKelas'
import { MatrixTable }              from '../../manajemen/_components/MatrixTable'

interface Props {
  kelasId:    string
  semesterId: string
}

export function MatrixMapelTab({ kelasId, semesterId }: Props) {
  const [mapelId, setMapelId] = useState('')

  const { data: mapelData } = useMataPelajaranList(
    kelasId && semesterId ? { kelasId, semesterId } : undefined,
  )

  const mapelOptions: ComboboxOption[] = useMemo(() => {
    const list = Array.isArray(mapelData)
      ? mapelData
      : (mapelData as { data?: unknown[] } | undefined)?.data ?? []
    return (list as { id: string; mataPelajaranTingkat?: { masterMapel?: { nama?: string } } }[])
      .map((m) => ({
        label: m.mataPelajaranTingkat?.masterMapel?.nama ?? m.id,
        value: m.id,
      }))
  }, [mapelData])

  const { data: matrix, isLoading } = useMatrixMapelWali({
    kelasId,
    mataPelajaranId: mapelId,
    semesterId,
  })

  return (
    <div className="space-y-4">
      {/* Filter Mapel */}
      <div className="max-w-xs">
        <Combobox
          options={mapelOptions}
          value={mapelId}
          onChange={setMapelId}
          placeholder="Pilih mata pelajaran..."
          disabled={!semesterId}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      ) : matrix ? (
        // Read-only — onOverride no-op (wali kelas tidak bisa koreksi)
        <MatrixTable
          matrix={matrix}
          onOverride={() => undefined}
        />
      ) : (
        <p className="text-sm text-gray-400 text-center py-10 italic">
          {!mapelId ? 'Pilih mata pelajaran untuk melihat rekap.' : 'Tidak ada data.'}
        </p>
      )}
    </div>
  )
}
