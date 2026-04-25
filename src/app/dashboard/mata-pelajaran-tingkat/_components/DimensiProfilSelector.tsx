'use client'

import { useEffect, useState }     from 'react'
import { Check, ChevronDown, Info } from 'lucide-react'
import { cn }                       from '@/lib/utils'
import { useMasterDimensi, useDimensiByMapelTingkat, useSetDimensiMapelTingkat } from '@/hooks/dimensi-profil/useDimensiProfil'
import { Button }                   from '@/components/ui'
import { toast }                    from 'sonner'

interface Props {
  mataPelajaranTingkatId: string
}

export default function DimensiProfilSelector({ mataPelajaranTingkatId }: Props) {
  const { data: master,   isLoading: loadingMaster }  = useMasterDimensi()
  const { data: assigned, isLoading: loadingAssigned } = useDimensiByMapelTingkat(mataPelajaranTingkatId)
  const setMutation = useSetDimensiMapelTingkat(mataPelajaranTingkatId)

  // Set ID sub-dimensi yang sedang dipilih
  const [selected, setSelected] = useState<Set<string>>(new Set())
  // Accordion: dimensi yang terbuka
  const [openDims, setOpenDims] = useState<Set<string>>(new Set())

  // Isi dari data assigned
  useEffect(() => {
    if (!assigned) return
    const ids = assigned.flatMap((g) => g.subDimensi.map((s) => s.id))
    setSelected(new Set(ids))
    // Buka semua dimensi yang sudah punya sub-dimensi terpilih
    const openSet = new Set<string>()
    assigned.forEach((g) => { if (g.subDimensi.length > 0) openSet.add(g.dimensi.id) })
    setOpenDims(openSet)
  }, [assigned])

  const toggleSub = (subId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(subId)) next.delete(subId)
      else next.add(subId)
      return next
    })
  }

  const toggleDim = (dimId: string) => {
    setOpenDims((prev) => {
      const next = new Set(prev)
      if (next.has(dimId)) next.delete(dimId)
      else next.add(dimId)
      return next
    })
  }

  const handleSave = async () => {
    try {
      await setMutation.mutateAsync([...selected])
      toast.success('Dimensi Profil berhasil disimpan')
    } catch {
      toast.error('Gagal menyimpan dimensi profil')
    }
  }

  const isLoading = loadingMaster || loadingAssigned

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    )
  }

  if (!master || master.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        Data dimensi profil belum tersedia. Jalankan seed terlebih dahulu.
      </div>
    )
  }

  const totalSelected = selected.size

  return (
    <div className="space-y-3">
      {/* Info */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          Pilih sub-dimensi yang akan dinilai oleh guru pada mata pelajaran ini.
          Guru dapat mengisi penilaian (B/C/M) untuk setiap siswa.
        </p>
      </div>

      {/* Accordion per dimensi */}
      <div className="space-y-1.5">
        {master.map((dim) => {
          const isOpen       = openDims.has(dim.id)
          const selectedCount = dim.subDimensi.filter((s) => selected.has(s.id)).length

          return (
            <div
              key={dim.id}
              className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Header dimensi */}
              <button
                type="button"
                onClick={() => toggleDim(dim.id)}
                className="w-full flex items-center gap-3 px-3.5 py-3 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    {dim.kode}
                  </span>
                </span>
                <span className="flex-1 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 leading-snug">
                  {dim.nama}
                </span>
                {selectedCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {selectedCount}/{dim.subDimensi.length}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>

              {/* Sub-dimensi list */}
              {isOpen && (
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50 bg-white dark:bg-gray-900">
                  {dim.subDimensi.map((sub) => {
                    const isChecked = selected.has(sub.id)
                    return (
                      <label
                        key={sub.id}
                        className="flex items-start gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        {/* Checkbox custom */}
                        <div
                          onClick={() => toggleSub(sub.id)}
                          className={cn(
                            'mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                            isChecked
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'border-gray-300 dark:border-gray-600',
                          )}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                            {sub.kode} — {sub.nama}
                          </p>
                          {/* Preview rubrik */}
                          {isChecked && (
                            <div className="mt-1.5 grid grid-cols-3 gap-1">
                              {[
                                { label: 'B', text: sub.keteranganB, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50' },
                                { label: 'C', text: sub.keteranganC, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50' },
                                { label: 'M', text: sub.keteranganM, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50' },
                              ].map((r) => (
                                <div key={r.label} className={cn('rounded p-1.5 border text-[9px] leading-snug', r.color)}>
                                  <span className="font-bold block mb-0.5">{r.label}</span>
                                  {r.text.length > 60 ? r.text.slice(0, 60) + '…' : r.text}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer save */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/50">
        <p className="text-xs text-gray-400">
          {totalSelected} sub-dimensi dipilih
        </p>
        <Button
          size="sm"
          onClick={() => { void handleSave() }}
          loading={setMutation.isPending}
        >
          Simpan Dimensi
        </Button>
      </div>
    </div>
  )
}
