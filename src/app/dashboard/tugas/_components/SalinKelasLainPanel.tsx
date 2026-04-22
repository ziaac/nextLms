'use client'

/**
 * SalinKelasLainPanel
 * Panel yang muncul di sidebar buat/edit tugas.
 * Memungkinkan guru menyalin tugas yang baru dibuat ke kelas lain
 * dengan mataPelajaranTingkatId yang sama, semester yang sama.
 */
import { useState, useMemo }         from 'react'
import { useMataPelajaranList }      from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useBulkCopyTugas, useTugasList } from '@/hooks/tugas/useTugas'
import { Skeleton }                  from '@/components/ui'
import { Button }                    from '@/components/ui'
import { Check, Copy, Users, Info }  from 'lucide-react'
import { cn }                        from '@/lib/utils'
import { toast }                     from 'sonner'

interface Props {
  /** ID tugas yang sudah disimpan (harus ada sebelum bisa menyalin) */
  tugasId:               string | null
  /** ID mataPelajaran sumber (untuk filter mataPelajaranTingkatId) */
  srcMataPelajaranId:    string
  /** ID semester sumber (hanya tampilkan mapel semester yang sama) */
  semesterId:            string
  /** ID guru yang login */
  guruId:                string
  /** Opsional: override tanggal (jika diisi, pakai dari form) */
  tanggalMulai?:         string
  tanggalSelesai?:       string
  /** Judul tugas sumber — untuk deteksi duplikasi di target */
  judulTugas?:           string
}

function mapelLabel(m: any): string {
  const nama    = m.mataPelajaranTingkat?.masterMapel?.nama ?? '—'
  const kelas   = m.kelas?.namaKelas ?? '—'
  const semNama = m.semester?.nama ?? ''
  return `${nama} — ${kelas}${semNama ? ` (${semNama})` : ''}`
}

export function SalinKelasLainPanel({
  tugasId,
  srcMataPelajaranId,
  semesterId,
  guruId,
  tanggalMulai,
  tanggalSelesai,
  judulTugas,
}: Props) {
  const bulkCopy = useBulkCopyTugas()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [done,     setDone]     = useState(false)

  // Load semua mapel guru di semester ini
  const { data: mapelData, isLoading } = useMataPelajaranList(
    semesterId && guruId ? { guruId, semesterId, limit: 100 } : undefined,
    { enabled: !!semesterId && !!guruId }
  )

  // Filter: hanya mapel dengan mataPelajaranTingkatId yang sama, bukan sumber
  const srcTingkatId = (mapelData?.data ?? []).find(m => m.id === srcMataPelajaranId)?.mataPelajaranTingkatId
  const targetList = useMemo(() =>
    (mapelData?.data ?? []).filter(m =>
      m.id !== srcMataPelajaranId &&
      srcTingkatId &&
      m.mataPelajaranTingkatId === srcTingkatId
    ), [mapelData, srcMataPelajaranId, srcTingkatId]
  )

  // Deteksi duplikasi: cari tugas dengan judul sama di semester yang sama
  const { data: dupData } = useTugasList(
    judulTugas && semesterId ? { semesterId, search: judulTugas, limit: 50 } : undefined,
    { enabled: !!judulTugas && !!semesterId },
  )
  const targetMapelIds = useMemo(() => new Set(targetList.map(m => m.id)), [targetList])
  const duplicateMapelIds = useMemo(() => {
    const ids = new Set<string>()
    ;(dupData?.data ?? [])
      .filter(t => t.judul === judulTugas && targetMapelIds.has(t.mataPelajaranId))
      .forEach(t => ids.add(t.mataPelajaranId))
    return ids
  }, [dupData, judulTugas, targetMapelIds])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleCopy = async () => {
    if (!tugasId || selected.size === 0) return
    try {
      const res = await bulkCopy.mutateAsync({
        tugasIds:               [tugasId],
        targetMataPelajaranIds: Array.from(selected),
        ...(tanggalMulai   ? { tanggalMulai }   : {}),
        ...(tanggalSelesai ? { tanggalSelesai } : {}),
      })
      toast.success(res.message)
      setSelected(new Set())
      setDone(true)
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Gagal menyalin')
    }
  }

  // Tidak ada kelas lain yang sejenis
  if (!isLoading && targetList.length === 0) {
    return (
      <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 border-b border-gray-100 dark:border-gray-800 pb-2">
          Salin ke Kelas Lain
        </p>
        <div className="flex items-start gap-2 text-xs text-gray-400">
          <Info size={13} className="shrink-0 mt-0.5" />
          <span>Tidak ada kelas lain dengan mata pelajaran sejenis di semester ini.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-2">
        Salin ke Kelas Lain
      </p>

      {/* Catatan materiPelajaran */}
      <div className="flex items-start gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 rounded-lg px-3 py-2">
        <Info size={11} className="shrink-0 mt-0.5" />
        <span>
          Pengaitan ke <strong>materi pelajaran</strong> (jika ada) tidak akan disalin —
          setiap kelas memiliki materi sendiri. Anda dapat menautkannya manual setelah penyalinan.
        </span>
      </div>

      {!tugasId && (
        <p className="text-[11px] text-amber-600 flex items-center gap-1.5">
          <Info size={12} className="shrink-0" />
          Tugas harus tersimpan dulu sebelum dapat disalin
        </p>
      )}

      {done && (
        <p className="text-[11px] text-emerald-600 flex items-center gap-1.5">
          <Check size={12} className="shrink-0" />
          Berhasil disalin! Anda dapat menyalin ke kelas lain lagi.
        </p>
      )}

      {isLoading && <Skeleton className="h-20 rounded-lg" />}

      {!isLoading && (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
          {targetList.map(m => {
            const checked = selected.has(m.id)
            return (
              <div
                key={m.id}
                onClick={() => toggle(m.id)}
                className={cn(
                  'flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all text-sm',
                  checked
                    ? 'border-emerald-400 bg-emerald-30/50 dark:bg-emerald-900/10'
                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 bg-gray-50/50 dark:bg-gray-800/30'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                  checked ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                )}>
                  {checked && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-200 truncate text-xs">
                    {mapelLabel(m)}
                    {duplicateMapelIds.has(m.id) && (
                      <span className="ml-1.5 font-normal text-amber-500">(sudah ada)</span>
                    )}
                  </p>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <Users size={10} /> {m.kelas?.namaKelas ?? '—'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!isLoading && targetList.length > 0 && (
        <Button
          size="sm"
          className="w-full"
          leftIcon={<Copy size={14} />}
          disabled={selected.size === 0 || !tugasId || bulkCopy.isPending}
          loading={bulkCopy.isPending}
          onClick={handleCopy}
        >
          Salin ke {selected.size > 0 ? `${selected.size} ` : ''}Kelas{selected.size > 1 ? '' : ' Lain'}
        </Button>
      )}
    </div>
  )
}
