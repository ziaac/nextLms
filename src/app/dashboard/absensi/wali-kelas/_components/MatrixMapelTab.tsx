'use client'

import { useState, useMemo }        from 'react'
import { Download }                 from 'lucide-react'
import { Combobox }                 from '@/components/ui/Combobox'
import type { ComboboxOption }      from '@/components/ui/Combobox'
import { Spinner }                  from '@/components/ui/Spinner'
import { useMataPelajaranList }     from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useMatrixMapelWali }       from '@/hooks/absensi/useWaliKelas'
import { exportMatrixBlob }         from '@/lib/api/absensi.api'
import { MatrixTable }              from '../../manajemen/_components/MatrixTable'
import { toast }                    from 'sonner'

interface Props {
  kelasId:    string
  semesterId: string
}

export function MatrixMapelTab({ kelasId, semesterId }: Props) {
  const [mapelId,    setMapelId]    = useState('')
  const [exporting,  setExporting]  = useState(false)

  const handleExport = async () => {
    if (!mapelId || !kelasId || !semesterId) return
    setExporting(true)
    try {
      await exportMatrixBlob({ kelasId, mataPelajaranId: mapelId, semesterId })
      toast.success('PDF berhasil diunduh')
    } catch {
      toast.error('Gagal mengunduh PDF')
    } finally {
      setExporting(false)
    }
  }

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
      {/* Filter + Export */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-xs">
          <Combobox
            options={mapelOptions}
            value={mapelId}
            onChange={setMapelId}
            placeholder="Pilih mata pelajaran..."
            disabled={!semesterId}
          />
        </div>
        {mapelId && (
          <button
            type="button"
            disabled={exporting}
            onClick={() => { void handleExport() }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
          >
            {exporting ? <Spinner /> : <Download size={13} />}
            Export PDF
          </button>
        )}
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
