'use client'

import { useState, useMemo, useEffect } from 'react'
import { Modal }                         from '@/components/ui'
import { Button, Select, Skeleton }      from '@/components/ui'
import { useTugasList, useBulkCopyTugas } from '@/hooks/tugas/useTugas'
import { useTahunAjaranList, useTahunAjaranOneActive } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran, useSemesterActive } from '@/hooks/semester/useSemester'
import { useMataPelajaranList }          from '@/hooks/mata-pelajaran/useMataPelajaran'
import { TujuanBadge, BentukBadge }     from './TugasBadge'
import { DateInput }                     from '@/components/ui/DateInput'
import { TimePicker }                    from '@/components/ui/TimePicker'
import type { TugasItem }                from '@/types/tugas.types'
import {
  Copy, AlertTriangle,
  BookOpen, ArrowRight, ArrowLeft, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn }    from '@/lib/utils'

// ── Types ───────────────────────────────────────────────────────
interface Props {
  open:    boolean
  onClose: () => void
  guruId:  string
  /** Jika diisi: sumber sudah diketahui (dari arsip), step sumber jadi readonly */
  prefillSource?: {
    tahunAjaranId: string
    semesterId:    string
    mapelId:       string
    mapelNama:     string
    semesterNama:  string
    tugas:         TugasItem[]
  }
}

// ── Helper: Label mapel lengkap ──────────────────────────────────
function mapelLabel(m: any) {
  const nama  = m.mataPelajaranTingkat?.masterMapel?.nama ?? '—'
  const kelas = m.kelas?.namaKelas ?? '—'
  const sem   = m.semester?.nama ?? ''
  return `${nama} — ${kelas}${sem ? ` (${sem})` : ''}`
}

// ── Main Component ───────────────────────────────────────────────
export function SalinTugasModal({ open, onClose, guruId, prefillSource }: Props) {
  const bulkCopy = useBulkCopyTugas()
  const labelClass = "text-[10px] font-medium text-gray-400 uppercase tracking-widest"

  // ── Source state ─────────────────────────────────────────
  const [srcTA,               setSrcTA]               = useState(prefillSource?.tahunAjaranId ?? '')
  const [srcSem,              setSrcSem]              = useState(prefillSource?.semesterId    ?? '')
  const [srcMapelTingkatFilter, setSrcMapelTingkatFilter] = useState('')
  const [srcMapelId,          setSrcMapelId]          = useState(prefillSource?.mapelId       ?? '')
  const [srcTugasIds,         setSrcTugasIds]         = useState<Set<string>>(
    new Set(prefillSource?.tugas.map(t => t.id) ?? [])
  )

  // ── Target state ─────────────────────────────────────────
  const [dstTA,       setDstTA]       = useState('')
  const [dstSem,      setDstSem]      = useState('')
  const [dstMapelIds, setDstMapelIds] = useState<Set<string>>(new Set())

  // ── Date override ─────────────────────────────────────────
  const [overrideDate, setOverrideDate] = useState(false)
  const [mulaiDate,    setMulaiDate]    = useState('')
  const [mulaiTime,    setMulaiTime]    = useState('07:00')
  const [selesaiDate,  setSelesaiDate]  = useState('')
  const [selesaiTime,  setSelesaiTime]  = useState('23:59')

  // Step tracking: source | target | confirm
  const [step, setStep] = useState<'source' | 'target' | 'confirm'>(
    prefillSource ? 'target' : 'source'
  )

  // Sync prefill jika berubah
  useEffect(() => {
    if (prefillSource) {
      setSrcTA(prefillSource.tahunAjaranId)
      setSrcSem(prefillSource.semesterId)
      setSrcMapelId(prefillSource.mapelId)
      setSrcTugasIds(new Set(prefillSource.tugas.map(t => t.id)))
      setStep('target')
    }
  }, [prefillSource])

  // ── Data fetch ────────────────────────────────────────────
  const { data: taRaw } = useTahunAjaranList()
  const taList = (taRaw as { id: string; nama: string }[] | undefined) ?? []

  // TA & Semester aktif — untuk default tujuan
  const { data: taAktif } = useTahunAjaranOneActive()
  const { data: semAktifRaw } = useSemesterActive()

  // Auto-set tujuan ke TA + Semester aktif tertinggi saat modal dibuka
  useEffect(() => {
    if (!open) return
    const taId = (taAktif as any)?.id
    if (taId && !dstTA) {
      setDstTA(taId)
      const semList = (semAktifRaw as any[]) ?? []
      const highest = semList
        .filter((s: any) => s.tahunAjaranId === taId && s.isActive)
        .sort((a: any, b: any) => b.urutan - a.urutan)[0]
      if (highest) setDstSem(highest.id)
    }
  }, [open, taAktif, semAktifRaw])

  // Source semester (semua — aktif maupun tidak)
  const { data: srcSemRaw } = useSemesterByTahunAjaran(srcTA || null)
  const srcSemList = (srcSemRaw as any[]) ?? []

  // Source mapel
  const { data: srcMapelData } = useMataPelajaranList(
    srcTA && srcSem && guruId ? { guruId, semesterId: srcSem, limit: 100 } : undefined,
    { enabled: open && !!srcSem && !!guruId && !prefillSource }
  )
  const srcMapelList = srcMapelData?.data ?? []

  // Source mapelTingkatId dari mapel yang dipilih
  const srcMapelTingkatId = useMemo(() => {
    const m = srcMapelList.find(m => m.id === srcMapelId)
    return m?.mataPelajaranTingkatId ?? ''
  }, [srcMapelList, srcMapelId])

  // Opsi filter "Mata Pelajaran" sumber — label "Fisika X", "Fisika XI"
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

  // Filtered kelas sumber berdasarkan mataPelajaranTingkat
  const srcFilteredMapel = srcMapelTingkatFilter
    ? srcMapelList.filter((m: any) => m.mataPelajaranTingkat?.id === srcMapelTingkatFilter)
    : srcMapelList

  // Source tugas
  const { data: srcTugasData, isLoading: loadingSrcTugas } = useTugasList(
    { guruId, semesterId: srcSem, mataPelajaranId: srcMapelId, limit: 100 },
    { enabled: open && !!srcSem && !!srcMapelId && !prefillSource }
  )
  const srcTugasList: TugasItem[] = prefillSource?.tugas ?? srcTugasData?.data ?? []

  // Destination semester
  const { data: dstSemRaw } = useSemesterByTahunAjaran(dstTA || null)
  const dstSemList = (dstSemRaw as any[]) ?? []

  // Destination mapel — filter: mataPelajaranTingkatId sama, bukan mapel sumber
  const { data: dstMapelData, isLoading: loadingDstMapel } = useMataPelajaranList(
    dstTA && dstSem && guruId ? { guruId, semesterId: dstSem, limit: 100 } : undefined,
    { enabled: open && !!dstSem && !!guruId }
  )
  // Tujuan: hanya mataPelajaranTingkat yang sama dengan sumber, kecuali mapel sumber sendiri
  const dstMapelList = useMemo(() => {
    if (!srcMapelTingkatId) return []
    return (dstMapelData?.data ?? []).filter(
      (m: any) => m.mataPelajaranTingkat?.id === srcMapelTingkatId && m.id !== srcMapelId
    )
  }, [dstMapelData, srcMapelTingkatId, srcMapelId])

  // Deteksi duplikasi: tugas dengan judul sama sudah ada di kelas tujuan
  const selectedJuduls = useMemo(
    () => new Set(srcTugasList.filter(t => srcTugasIds.has(t.id)).map(t => t.judul)),
    [srcTugasList, srcTugasIds],
  )
  const { data: dupTugasData } = useTugasList(
    step === 'target' && dstSem && srcMapelTingkatId ? { semesterId: dstSem, limit: 300 } : undefined,
    { enabled: step === 'target' && !!dstSem && !!srcMapelTingkatId },
  )
  const dupDstMapelIds = useMemo(() => {
    const ids = new Set<string>()
    ;(dupTugasData?.data ?? [])
      .filter(t => selectedJuduls.has(t.judul) && t.mataPelajaranId !== srcMapelId)
      .forEach(t => ids.add(t.mataPelajaranId))
    return ids
  }, [dupTugasData, selectedJuduls, srcMapelId])

  // ── Toggle helpers ────────────────────────────────────────
  const toggleTugas = (id: string) => setSrcTugasIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const toggleDstMapel = (id: string) => setDstMapelIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const isSourceReady = prefillSource
    ? srcTugasIds.size > 0
    : !!(srcSem && srcMapelId && srcTugasIds.size > 0)

  const isTargetReady = dstSem && dstMapelIds.size > 0

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    const payload = {
      tugasIds:               Array.from(srcTugasIds),
      targetMataPelajaranIds: Array.from(dstMapelIds),
      ...(overrideDate && mulaiDate   ? { tanggalMulai:   new Date(`${mulaiDate}T${mulaiTime}:00`).toISOString() } : {}),
      ...(overrideDate && selesaiDate ? { tanggalSelesai: new Date(`${selesaiDate}T${selesaiTime}:00`).toISOString() } : {}),
    }
    try {
      const res = await bulkCopy.mutateAsync(payload)
      toast.success(res.message)
      handleClose()
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Gagal menyalin tugas')
    }
  }

  const handleClose = () => {
    if (!prefillSource) {
      setSrcTA(''); setSrcSem(''); setSrcMapelTingkatFilter(''); setSrcMapelId('')
    }
    setSrcTugasIds(new Set(prefillSource?.tugas.map(t => t.id) ?? []))
    setDstTA(''); setDstSem(''); setDstMapelIds(new Set())
    setOverrideDate(false); setMulaiDate(''); setSelesaiDate('')
    setStep(prefillSource ? 'target' : 'source')
    onClose()
  }

  const totalNew = srcTugasIds.size * dstMapelIds.size

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Salin Tugas"
      description={
        step === 'source'  ? 'Pilih tugas yang akan disalin' :
        step === 'target'  ? 'Pilih mata pelajaran tujuan' :
        'Konfirmasi penyalinan tugas'
      }
      size="xl"
      footer={
        <div className="flex justify-between w-full">
          <div>
            {step !== 'source' && !prefillSource && (
              <Button
                variant="secondary"
                leftIcon={<ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={2.5} />}
                onClick={() => setStep(step === 'confirm' ? 'target' : 'source')}
              >
                {step === 'confirm' ? 'Kembali' : 'Kembali ke Sumber'}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose}>Batal</Button>
            {step === 'source' && (
              <Button
                disabled={!isSourceReady}
                onClick={() => setStep('target')}
                rightIcon={<ArrowRight className="w-4 h-4 shrink-0" strokeWidth={2.5} />}
              >
                Pilih Tujuan ({srcTugasIds.size} tugas)
              </Button>
            )}
            {step === 'target' && (
              <Button
                disabled={!isTargetReady}
                onClick={() => setStep('confirm')}
                rightIcon={<ArrowRight className="w-4 h-4 shrink-0" strokeWidth={2.5} />}
              >
                Tinjau Hasil
              </Button>
            )}
            {step === 'confirm' && (
              <Button
                leftIcon={<Copy size={16} />}
                loading={bulkCopy.isPending}
                disabled={bulkCopy.isPending}
                onClick={handleSubmit}
              >
                Salin Sekarang
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="custom-scrollbar max-h-[70vh] overflow-y-auto">
        <div className="p-6 space-y-6 min-h-[420px]">

          {/* ── STEP 1: SUMBER ── */}
          {step === 'source' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 flex flex-col">
                  <label className={labelClass}>Tahun Ajaran Sumber</label>
                  <Select
                    options={[{ label: 'Pilih Tahun', value: '' }, ...taList.map((t: any) => ({ label: t.isActive ? `${t.nama} (Aktif)` : t.nama, value: t.id }))]}
                    value={srcTA}
                    onChange={e => { setSrcTA(e.target.value); setSrcSem(''); setSrcMapelId(''); setSrcTugasIds(new Set()) }}
                  />
                </div>
                <div className="space-y-1 flex flex-col">
                  <label className={labelClass}>Semester Sumber</label>
                  <Select
                    options={[{ label: srcTA ? 'Pilih Semester' : 'Pilih TA dulu...', value: '' }, ...srcSemList.map((s: any) => ({ label: s.isActive ? `${s.nama} (Aktif)` : s.nama, value: s.id }))]}
                    value={srcSem}
                    onChange={e => { setSrcSem(e.target.value); setSrcMapelId(''); setSrcTugasIds(new Set()) }}
                    disabled={!srcTA}
                  />
                </div>
              </div>

              {srcSem && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 flex flex-col">
                    <label className={labelClass}>Mata Pelajaran</label>
                    <Select
                      options={[
                        { label: 'Pilih Mata Pelajaran', value: '' },
                        ...srcMapelTingkatOptions,
                      ]}
                      value={srcMapelTingkatFilter}
                      onChange={e => { setSrcMapelTingkatFilter(e.target.value); setSrcMapelId(''); setSrcTugasIds(new Set()) }}
                    />
                  </div>
                  <div className="space-y-1 flex flex-col">
                    <label className={labelClass}>Kelas</label>
                    <Select
                      options={[{ label: srcMapelTingkatFilter ? 'Pilih Kelas' : 'Pilih mapel dulu...', value: '' }, ...srcFilteredMapel.map((m: any) => ({ label: m.kelas?.namaKelas ?? '—', value: m.id }))]}
                      value={srcMapelId}
                      onChange={e => { setSrcMapelId(e.target.value); setSrcTugasIds(new Set()) }}
                      disabled={!srcMapelTingkatFilter}
                    />
                  </div>
                </div>
              )}

              {srcMapelId && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <p className={labelClass}>Daftar Tugas ({srcTugasList.length})</p>
                    {srcTugasList.length > 0 && (
                      <button
                        type="button"
                        className="text-[10px] font-medium text-emerald-600 hover:text-emerald-700"
                        onClick={() => setSrcTugasIds(
                          srcTugasIds.size === srcTugasList.length
                            ? new Set()
                            : new Set(srcTugasList.map(t => t.id))
                        )}
                      >
                        {srcTugasIds.size === srcTugasList.length ? 'Batal Semua' : 'Pilih Semua'}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                    {loadingSrcTugas ? (
                      Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
                    ) : srcTugasList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-400 bg-white dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                        <BookOpen size={24} className="mb-2 opacity-20" />
                        <p className="text-xs text-gray-500 font-medium">Tidak ada tugas di mata pelajaran ini</p>
                      </div>
                    ) : (
                      srcTugasList.map(t => {
                        const checked = srcTugasIds.has(t.id)
                        return (
                          <div
                            key={t.id}
                            onClick={() => toggleTugas(t.id)}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                              checked
                                ? 'border-emerald-500 bg-emerald-30/50 dark:bg-emerald-900/10'
                                : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 bg-white dark:bg-gray-800'
                            )}
                          >
                            <div className={cn(
                              'w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors',
                              checked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                            )}>
                              {checked && <X size={12} className="text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                <TujuanBadge tujuan={t.tujuan} />
                                <BentukBadge bentuk={t.bentuk} />
                              </div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.judul}</p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: TUJUAN ── */}
          {step === 'target' && (
            <div className="space-y-5">
              {/* Info sumber jika dari arsip */}
              {prefillSource && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-300">Sumber: {prefillSource.mapelNama}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">{prefillSource.semesterNama} • {srcTugasIds.size} tugas dipilih</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 flex flex-col">
                  <label className={labelClass}>Tahun Ajaran Tujuan</label>
                  <div className="relative">
                    <Select
                      options={[{ label: 'Pilih...', value: '' }, ...taList.map(t => ({ label: t.nama, value: t.id }))]}
                      value={dstTA}
                      onChange={e => { setDstTA(e.target.value); setDstSem(''); setDstMapelIds(new Set()) }}
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
                    options={[{ label: dstTA ? 'Pilih Semester' : 'Pilih TA dulu...', value: '' }, ...dstSemList.map(s => ({ label: `${s.nama}${s.isActive ? ' (Aktif)' : ''}`, value: s.id }))]}
                    value={dstSem}
                    onChange={e => { setDstSem(e.target.value); setDstMapelIds(new Set()) }}
                    disabled={!dstTA}
                  />
                </div>
              </div>

              {dstSem && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-0.5">
                    <p className={labelClass}>Kelas Tujuan</p>
                    {dstMapelList.length > 0 && (
                      <button
                        type="button"
                        className="text-[10px] font-medium text-emerald-600 hover:text-emerald-700"
                        onClick={() => setDstMapelIds(
                          dstMapelIds.size === dstMapelList.length
                            ? new Set()
                            : new Set(dstMapelList.map(m => m.id))
                        )}
                      >
                        {dstMapelIds.size === dstMapelList.length ? 'Batal Semua' : 'Pilih Semua'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {loadingDstMapel ? (
                      Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
                    ) : dstMapelList.length === 0 ? (
                      <div className="col-span-full py-8 text-center rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                        <p className="text-xs text-gray-400 italic">Tidak ada mata pelajaran sejenis di semester ini</p>
                      </div>
                    ) : (
                      dstMapelList.map(m => {
                        const checked = dstMapelIds.has(m.id)
                        const mapelNama = m.mataPelajaranTingkat?.masterMapel?.nama ?? '—'
                        return (
                          <label
                            key={m.id}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                              checked
                                ? 'border-emerald-500 bg-emerald-30/50 dark:bg-emerald-900/10'
                                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-gray-200'
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleDstMapel(m.id)}
                              className="w-4 h-4 accent-emerald-500 rounded border-gray-300"
                            />
                            <div className="min-w-0">
                              <p className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate">
                                {m.kelas?.namaKelas ?? '—'}
                                {dupDstMapelIds.has(m.id) && (
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

          {/* ── STEP 3: KONFIRMASI ── */}
          {step === 'confirm' && (
            <div className="space-y-5">

              {/* Dua kolom: tugas & kelas */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                <div>
                  <p className={cn(labelClass, "mb-2")}>{srcTugasIds.size} Tugas</p>
                  <div className="space-y-1 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                    {srcTugasList.filter(t => srcTugasIds.has(t.id)).map(t => (
                      <p key={t.id} className="text-xs text-gray-600 dark:text-gray-300 truncate flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                        {t.judul}
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <p className={cn(labelClass, "mb-2")}>{dstMapelIds.size} Kelas Tujuan</p>
                  <div className="space-y-1 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                    {dstMapelList.filter(m => dstMapelIds.has(m.id)).map(m => (
                      <p key={m.id} className="text-xs text-emerald-600 dark:text-emerald-400 truncate flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                        {m.kelas?.namaKelas ?? '—'}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Warning soal kuis & nilai — tugas-specific */}
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900 text-xs text-amber-700 dark:text-amber-400 flex gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>
                  Soal kuis, opsi jawaban, dan lampiran akan ikut disalin. Nilai siswa <strong>tidak</strong> ikut disalin.{' '}
                  <strong>Pengaitan ke materi pelajaran juga tidak disalin</strong> — setiap kelas memiliki materi sendiri,
                  tautkan manual setelah penyalinan selesai.
                </span>
              </div>

              {/* Override tanggal — tugas-specific */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setOverrideDate(!overrideDate)}
                    className={cn(
                      'relative w-10 h-5 rounded-full transition-colors',
                      overrideDate ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                      overrideDate && 'translate-x-5'
                    )} />
                  </button>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ubah jadwal pelaksanaan</span>
                </label>

                {overrideDate && (
                  <div className="pl-5 border-l-2 border-blue-100 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tanggal Mulai</p>
                      <div className="flex gap-2">
                        <DateInput value={mulaiDate} onChange={setMulaiDate} />
                        <TimePicker value={mulaiTime} onChange={setMulaiTime} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tanggal Selesai</p>
                      <div className="flex gap-2">
                        <DateInput value={selesaiDate} onChange={setSelesaiDate} min={mulaiDate} />
                        <TimePicker value={selesaiTime} onChange={setSelesaiTime} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Ringkasan + catatan draft */}
              <p className="text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-4">
                Total <span className="font-medium text-gray-600 dark:text-gray-300">{totalNew} tugas baru</span> akan dibuat dan masuk sebagai <span className="font-medium text-gray-600 dark:text-gray-300">Draft</span> (belum dipublikasikan).
              </p>

            </div>
          )}

        </div>
      </div>
    </Modal>
  )
}
