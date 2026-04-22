'use client'

import { useState, useMemo, useEffect } from 'react'
import { Modal }                       from '@/components/ui'
import { Button }                      from '@/components/ui'
import { Select, Skeleton }            from '@/components/ui'
import { MateriTipeBadge }             from './MateriTipeBadge'
import { useBulkCopyMateri, useMateriList } from '@/hooks/materi-pelajaran/useMateriPelajaran'
import { useMataPelajaranList }        from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useTahunAjaranList, useTahunAjaranActive } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran, useSemesterActive } from '@/hooks/semester/useSemester'
import type { MateriItem }             from '@/types/materi-pelajaran.types'
import { Copy, BookOpen, X, ArrowRight, ArrowLeft } from 'lucide-react'
import { toast }                       from 'sonner'
import { cn }                          from '@/lib/utils'

interface Props {
  open:          boolean
  onClose:       () => void
  sourceItems:   MateriItem[]
  guruId?:       string
}

type Step = 'source' | 'target' | 'confirm'

export function BulkCopyModal({ open, onClose, sourceItems: initialSources, guruId }: Props) {
  const [step, setStep] = useState<Step>('source')
  
  // --- Source Selection State ---
  const [selectedSources, setSelectedSources] = useState<MateriItem[]>([])
  const [srcTA,                setSrcTA]               = useState('')
  const [srcSem,               setSrcSem]              = useState('')
  const [srcMapelTingkatFilter, setSrcMapelTingkatFilter] = useState('')
  const [srcMapelId,           setSrcMapelId]          = useState('')

  // --- Target Selection State ---
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const [semesterId,    setSemesterId]    = useState('')
  const [targetIds,     setTargetIds]     = useState<Set<string>>(new Set())

  const bulkCopy = useBulkCopyMateri()

  // Reset state when opened
  useEffect(() => {
    if (open) {
      if (initialSources.length > 0) {
        setSelectedSources(initialSources)
        setStep('target')
      } else {
        setSelectedSources([])
        setStep('source')
        setSrcTA('')
        setSrcSem('')
        setSrcMapelId('')
      }
    }
  }, [open, initialSources])

  // --- Data hooks ---
  const { data: taRaw } = useTahunAjaranList()
  const taList = (taRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? []

  // Source filters
  const { data: srcSemRaw } = useSemesterByTahunAjaran(srcTA || null)
  const srcSemList = (srcSemRaw as any[]) ?? []

  const { data: srcMapelRaw } = useMataPelajaranList(
    srcSem ? { guruId, semesterId: srcSem, limit: 100 } : undefined,
    { enabled: !!srcSem }
  )
  const srcMapelList = srcMapelRaw?.data ?? []

  const srcMapelTingkatOptions = useMemo(() => {
    const map = new Map<string, string>()
    srcMapelList.forEach((m: any) => {
      const mpt  = m.mataPelajaranTingkat
      const id   = mpt?.id
      const nama = mpt?.masterMapel?.nama
      const tk   = mpt?.tingkatKelas?.nama
      if (id && nama) map.set(id, tk ? `${nama} ${tk}` : nama)
    })
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [srcMapelList])

  const srcFilteredMapel = srcMapelTingkatFilter
    ? srcMapelList.filter((m: any) => m.mataPelajaranTingkat?.id === srcMapelTingkatFilter)
    : srcMapelList

  const { data: srcMateriData, isLoading: isLoadingSrc } = useMateriList(
    { 
      guruId, 
      semesterId: srcSem, 
      mataPelajaranId: srcMapelId || undefined,   // per-kelas, bukan per-tingkat
      limit: 100 
    },
    { enabled: step === 'source' && !!srcSem && !!srcMapelId }
  )
  const availableMateris = (srcMapelId && srcMateriData?.data) ? srcMateriData.data : []

  // --- Target Logic ---
  const sourceContext = useMemo(() => {
    if (selectedSources.length === 0) return null
    const first = selectedSources[0]
    const mt = first.mataPelajaran?.mataPelajaranTingkat
    return {
      tingkatId: mt?.id,
      tingkatNama: mt?.masterMapel?.nama ?? '—',
      tingkatSub: mt?.tingkatKelas?.nama ?? '—',
      kelasNama: first.kelas?.namaKelas ?? first.mataPelajaran?.kelas?.namaKelas ?? '—',
      taNama: first.mataPelajaran?.semester?.tahunAjaran?.nama ?? '—',
      semNama: first.mataPelajaran?.semester?.nama ?? '—',
      mapelIds: new Set(selectedSources.map(s => s.mataPelajaranId))
    }
  }, [selectedSources])

  // ── Target: TA aktif (dikunci) + Semester aktif ──────────────────
  const { data: taActiveRaw = [] } = useTahunAjaranActive()
  const activeTA = (taActiveRaw as { id: string; nama: string }[])[0] ?? null

  // Auto-set tahunAjaranId ke TA aktif
  useEffect(() => {
    if (activeTA?.id && !tahunAjaranId) setTahunAjaranId(activeTA.id)
  }, [activeTA, tahunAjaranId])

  const { data: semRaw } = useSemesterByTahunAjaran(activeTA?.id || null)
  const allSemList = (semRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? []
  const activeSemList = allSemList.filter((s) => s.isActive)

  // Auto-set semesterId jika hanya 1 semester di TA aktif
  useEffect(() => {
    if (allSemList.length === 1 && !semesterId) setSemesterId(allSemList[0].id)
  }, [allSemList, semesterId])

  const { data: mapelData, isLoading: isLoadingTarget } = useMataPelajaranList(
    semesterId ? {
      semesterId,
      ...(guruId ? { guruId } : {}),
      ...(sourceContext?.tingkatId ? { mataPelajaranTingkatId: sourceContext.tingkatId } : {}),
      limit: 200,
    } : undefined,
    { enabled: !!semesterId },
  )
  
  // Tujuan: dikunci ke mataPelajaranTingkat sumber, kecuali mapel sumber sendiri
  const mapelList = useMemo(() =>
    (mapelData?.data ?? []).filter((m: any) =>
      !sourceContext?.mapelIds.has(m.id) &&
      (sourceContext?.tingkatId ? m.mataPelajaranTingkat?.id === sourceContext.tingkatId : true)
    ),
  [mapelData, sourceContext])

  // Deteksi duplikasi: materi dengan judul sama sudah ada di kelas tujuan
  const sourceJuduls = useMemo(() => new Set(selectedSources.map(s => s.judul)), [selectedSources])
  const { data: dupMateriData } = useMateriList(
    step === 'target' && semesterId && sourceContext?.tingkatId ? {
      semesterId,
      mataPelajaranTingkatId: sourceContext.tingkatId,
      limit: 300,
    } : undefined,
    { enabled: step === 'target' && !!semesterId && !!sourceContext?.tingkatId },
  )
  const dupMapelIds = useMemo(() => {
    const ids = new Set<string>()
    ;(dupMateriData?.data ?? [])
      .filter(m => sourceJuduls.has(m.judul))
      .forEach(m => ids.add(m.mataPelajaranId))
    return ids
  }, [dupMateriData, sourceJuduls])

  const toggleSource = (item: MateriItem) => {
    setSelectedSources(prev => {
      const exists = prev.find(i => i.id === item.id)
      if (exists) return prev.filter(i => i.id !== item.id)
      
      if (prev.length > 0) {
        const firstTingkatId = prev[0].mataPelajaran?.mataPelajaranTingkatId
        const newTingkatId = item.mataPelajaran?.mataPelajaranTingkatId
        if (firstTingkatId !== newTingkatId) {
          toast.error('Gunakan mata pelajaran tingkat yang sama.')
          return prev
        }
      }
      return [...prev, item]
    })
  }

  const toggleTarget = (id: string) => {
    setTargetIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirm = async () => {
    if (selectedSources.length === 0 || targetIds.size === 0) return
    try {
      const res = await bulkCopy.mutateAsync({
        sourceMateriIds:        selectedSources.map((i) => i.id),
        targetMataPelajaranIds: Array.from(targetIds),
      })
      toast.success(`${res.totalCopied} materi berhasil disalin`)
      handleClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyalin materi')
    }
  }

  const handleClose = () => {
    setStep('source')
    setSrcTA(''); setSrcSem(''); setSrcMapelTingkatFilter(''); setSrcMapelId('')
    setTahunAjaranId(''); setSemesterId(''); setTargetIds(new Set())
    setSelectedSources([])
    onClose()
  }

  const labelClass = "text-[10px] font-medium text-gray-400 uppercase tracking-widest pl-1"

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Salin Materi Pelajaran"
      size="xl"
      footer={
        <div className="flex justify-between w-full">
          <div>
            {step !== 'source' && initialSources.length === 0 && (
              <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={2.5} />} onClick={() => setStep('source')}>Kembali ke Sumber</Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose}>Batal</Button>
            {step === 'source' && (
              <Button
                disabled={selectedSources.length === 0 || !sourceContext?.tingkatId}
                onClick={() => setStep('target')}
                rightIcon={<ArrowRight className="w-4 h-4 shrink-0" strokeWidth={2.5} />}
                title={!sourceContext?.tingkatId ? 'Data mata pelajaran tidak lengkap, coba pilih ulang' : undefined}
              >
                Lanjutkan ke Tujuan
              </Button>
            )}
            {step === 'target' && (
              <Button disabled={targetIds.size === 0} onClick={() => setStep('confirm')} rightIcon={<ArrowRight className="w-4 h-4 shrink-0" strokeWidth={2.5} />}>Tinjau Hasil</Button>
            )}
            {step === 'confirm' && (
              <Button leftIcon={<Copy size={16} />} loading={bulkCopy.isPending} onClick={handleConfirm}>Salin Sekarang</Button>
            )}
          </div>
        </div>
      }
    >
      <div className="custom-scrollbar max-h-[70vh] overflow-y-auto">
        <div className="p-6 space-y-6 min-h-[420px]">

          {/* STEP 1: SOURCE SELECTION */}
          {step === 'source' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 flex flex-col">
                  <label className={labelClass}>Tahun Ajaran</label>
                  <Select
                    options={[{ label: 'Pilih Tahun', value: '' }, ...taList.map((t: any) => ({ label: t.isActive ? `${t.nama} (Aktif)` : t.nama, value: t.id }))]}
                    value={srcTA}
                    onChange={(e) => { setSrcTA(e.target.value); setSrcSem(''); setSrcMapelTingkatFilter(''); setSrcMapelId('') }}
                  />
                </div>
                <div className="space-y-1 flex flex-col">
                  <label className={labelClass}>Semester</label>
                  <Select
                    options={[{ label: 'Pilih Semester', value: '' }, ...srcSemList.map((s: any) => ({ label: s.isActive ? `${s.nama} (Aktif)` : s.nama, value: s.id }))]}
                    value={srcSem}
                    onChange={(e) => { setSrcSem(e.target.value); setSrcMapelTingkatFilter(''); setSrcMapelId(''); setSelectedSources([]) }}
                    disabled={!srcTA}
                  />
                </div>
              </div>

              {srcSem && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 flex flex-col">
                    <label className={labelClass}>Mata Pelajaran</label>
                    <Select
                      options={[{ label: 'Pilih Mata Pelajaran', value: '' }, ...srcMapelTingkatOptions]}
                      value={srcMapelTingkatFilter}
                      onChange={(e) => { setSrcMapelTingkatFilter(e.target.value); setSrcMapelId(''); setSelectedSources([]) }}
                    />
                  </div>
                  <div className="space-y-1 flex flex-col">
                    <label className={labelClass}>Kelas</label>
                    <Select
                      options={[{ label: srcMapelTingkatFilter ? 'Pilih Kelas' : 'Pilih mapel dulu...', value: '' }, ...srcFilteredMapel.map((m: any) => ({ label: m.kelas?.namaKelas ?? '—', value: m.id }))]}
                      value={srcMapelId}
                      onChange={(e) => { setSrcMapelId(e.target.value); setSelectedSources([]) }}
                      disabled={!srcMapelTingkatFilter}
                    />
                  </div>
                </div>
              )}

              {srcMapelId && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Daftar Materi ({availableMateris.length})</p>
                  {availableMateris.length > 0 && (
                    <button
                      type="button"
                      className="text-[10px] font-medium text-emerald-600 hover:text-emerald-700"
                      onClick={() => {
                        if (selectedSources.length === availableMateris.length)
                          setSelectedSources([])
                        else
                          setSelectedSources(availableMateris)
                      }}
                    >
                      {selectedSources.length === availableMateris.length ? 'Batal Semua' : 'Pilih Semua'}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                  {isLoadingSrc ? (
                    Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
                  ) : availableMateris.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-10 text-gray-400 bg-white dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                      <BookOpen size={24} className="mb-2 opacity-20" />
                      <p className="text-xs text-gray-500 font-medium">Materi tidak ditemukan</p>
                    </div>
                  ) : (
                    availableMateris.map(item => {
                      const isSelected = selectedSources.some(s => s.id === item.id)
                      return (
                        <div 
                          key={item.id}
                          onClick={() => toggleSource(item)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                            isSelected 
                              ? "border-emerald-500 bg-emerald-30/50 dark:bg-emerald-900/10" 
                              : "border-gray-100 dark:border-gray-800 hover:border-gray-200 bg-white dark:bg-gray-800"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                            isSelected ? "bg-emerald-500 border-emerald-500" : "border-gray-300"
                          )}>
                            {isSelected && <X size={12} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 dark:text-gray-200 font-medium truncate">{item.judul}</p>
                            <p className="text-[10px] text-gray-400 font-medium">Pertemuan ke {item.pertemuanKe ?? '-'} · {item.kelas?.namaKelas ?? '—'}</p>
                          </div>
                          <MateriTipeBadge tipe={item.tipeMateri} />
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
              )}
            </div>
          )}

          {/* STEP 2: TARGET SELECTION */}
          {step === 'target' && sourceContext && (
            <div className="space-y-5">

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 flex flex-col">
                  <label className={labelClass}>Tahun Ajaran Tujuan</label>
                  <div className="relative">
                    <Select
                      options={[{ label: activeTA?.nama ?? '—', value: activeTA?.id ?? '' }]}
                      value={activeTA?.id ?? ''}
                      disabled
                    />
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
                      Aktif
                    </span>
                  </div>
                </div>
                <div className="space-y-1 flex flex-col">
                  <label className={labelClass}>Semester Tujuan</label>
                  <Select
                    options={[
                      { label: 'Pilih Semester', value: '' },
                      ...allSemList.map((s) => ({ label: s.isActive ? `${s.nama} (Aktif)` : s.nama, value: s.id })),
                    ]}
                    value={semesterId}
                    onChange={(e) => { setSemesterId(e.target.value); setTargetIds(new Set()) }}
                  />
                </div>
              </div>

              {/* Daftar kelas tujuan */}
              {semesterId && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-0.5">
                    <p className={labelClass}>Kelas Tujuan</p>
                    {mapelList.length > 0 && (
                      <button
                        type="button"
                        className="text-[10px] font-medium text-emerald-600 hover:text-emerald-700"
                        onClick={() => {
                          if (targetIds.size === mapelList.length) setTargetIds(new Set())
                          else setTargetIds(new Set(mapelList.map(m => m.id)))
                        }}
                      >
                        {targetIds.size === mapelList.length ? 'Batal Semua' : 'Pilih Semua'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {isLoadingTarget ? (
                      Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
                    ) : mapelList.length === 0 ? (
                      <div className="col-span-full py-8 text-center rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                        <p className="text-xs text-gray-400 italic">Tidak ada kelas yang sesuai untuk periode ini</p>
                      </div>
                    ) : (
                      mapelList.map((m) => {
                        const isSelected = targetIds.has(m.id)
                        const mapelNama = m.mataPelajaranTingkat?.masterMapel?.nama ?? '—'
                        return (
                          <label
                            key={m.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                              isSelected
                                ? "border-emerald-500 bg-emerald-30/50 dark:bg-emerald-900/10"
                                : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-gray-200"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleTarget(m.id)}
                              className="w-4 h-4 accent-emerald-500 rounded border-gray-300"
                            />
                            <div className="min-w-0">
                              <p className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate">
                                {m.kelas?.namaKelas ?? '—'}
                                {dupMapelIds.has(m.id) && (
                                  <span className="ml-1.5 text-xs font-normal text-amber-500">(sudah ada)</span>
                                )}
                              </p>
                              <p className="text-[10px] text-gray-400 font-normal truncate uppercase tracking-tight">{mapelNama}</p>
                            </div>
                          </label>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}


          {/* STEP 3: CONFIRMATION */}
          {step === 'confirm' && (
            <div className="space-y-5">

              {/* Dua kolom: materi & kelas */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                {/* Kolom kiri: daftar materi */}
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-2">
                    {selectedSources.length} Materi
                  </p>
                  <div className="space-y-1 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                    {selectedSources.map((s) => (
                      <p key={s.id} className="text-xs text-gray-600 dark:text-gray-300 truncate flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                        {s.judul}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Kolom kanan: daftar kelas tujuan */}
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-2">
                    {targetIds.size} Kelas Tujuan
                  </p>
                  <div className="space-y-1 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                    {mapelList.filter((m) => targetIds.has(m.id)).map((m) => (
                      <p key={m.id} className="text-xs text-emerald-600 dark:text-emerald-400 truncate flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                        {m.kelas?.namaKelas ?? '—'}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ringkasan + catatan draft + tugas */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-2">
                <p className="text-xs text-gray-400">
                  Total <span className="font-medium text-gray-600 dark:text-gray-300">{selectedSources.length * targetIds.size} salinan materi</span> akan dibuat dan masuk sebagai <span className="font-medium text-gray-600 dark:text-gray-300">draft</span>.
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                  <BookOpen size={12} className="shrink-0 mt-0.5" />
                  <span>
                    <strong>Koneksi tugas tidak disalin.</strong> Tugas bersifat per-kelas — setelah menyalin, hubungkan tugas secara manual melalui halaman edit masing-masing materi.
                  </span>
                </p>
              </div>

            </div>
          )}


        </div>
      </div>
    </Modal>
  )
}
