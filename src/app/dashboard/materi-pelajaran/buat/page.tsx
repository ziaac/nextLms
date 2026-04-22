'use client'

import {
  useState, useEffect, useRef, useCallback, useMemo, Suspense,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button }            from '@/components/ui'
import { RichTextEditor }    from '@/components/ui/RichTextEditor'
import { DateInput }         from '@/components/ui/DateInput'
import { TimePicker }        from '@/components/ui/TimePicker'
import { FileUpload }            from '@/components/ui'
import { PdfSlideshowViewer }   from '@/components/ui/PdfSlideshowViewer'
import { uploadApi, getPresignedUrl } from '@/lib/api/upload.api'
import { useCreateMateri, useUpdateMateri, useMateriList } from '@/hooks/materi-pelajaran/useMateriPelajaran'
import { useMataPelajaranList }             from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useTugasList }                      from '@/hooks/tugas/useTugas'
import { useDokumenPengajaranList }         from '@/hooks/dokumen-pengajaran/useDokumenPengajaran'
import type { MateriPayload, TipeMateri, HybridFileUrls, BulkCreateTargetRow } from '@/types/materi-pelajaran.types'
import {
  ArrowLeft, Save, Check, RefreshCw, Loader2, X, Info,
  FileText, FileImage, Volume2, Video, Presentation, Link2, BookOpen, Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { InfoTooltip } from '@/components/ui/InfoTooltip'

// ── Jenis dokumen labels ──────────────────────────────────────
const JENIS_DOKUMEN_LABEL: Record<string, string> = {
  CP:                      'Capaian Pembelajaran',
  ATP:                     'Alur Tujuan Pembelajaran',
  MODUL_AJAR_RPP:          'Modul Ajar / RPP',
  MODUL_PROJEK_P5:         'Modul Projek P5',
  KKTP:                    'KKTP',
  RINCIAN_MINGGU_EFEKTIF:  'Rincian Minggu Efektif',
  BUKU_PEGANGAN:           'Buku Pegangan',
  LAINNYA:                 'Lainnya',
}

// ── Tipe selector ────────────────────────────────────────────
const TIPE_TABS: { value: TipeMateri; label: string; icon: React.ElementType }[] = [
  { value: 'TEXT',          label: 'Teks',       icon: FileText },
  { value: 'PDF',           label: 'PDF',        icon: FileImage },
  { value: 'SLIDESHOW',     label: 'Slideshow',  icon: Presentation },
  { value: 'AUDIO',         label: 'Audio',      icon: Volume2 },
  { value: 'VIDEO_YOUTUBE', label: 'YouTube',    icon: Video },
  { value: 'HYBRID',        label: 'Hybrid',     icon: Layers },
]

// ── Today as YYYY-MM-DD ──────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

// ── Combine date + time → ISO string ────────────────────────
function toISO(date: string, time: string) {
  if (!date || !time) return null
  return new Date(`${date}T${time}:00`).toISOString()
}

// ── Form label helper ────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  )
}

function SectionTitle({ children, tooltip }: { children: React.ReactNode; tooltip?: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {children}
      </p>
      {tooltip && <InfoTooltip content={tooltip} align="left" />}
    </div>
  )
}

// ── Extract YouTube video ID from various URL formats ─────────
function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0] || null
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || null
      return u.searchParams.get('v')
    }
  } catch { /* invalid URL */ }
  return null
}

// ── Inline PDF/Slideshow preview after upload ─────────────────
// Inline preview: audio player atau PDF slideshow
function FileInlinePreview({ fileKey }: { fileKey: string }) {
  const [url,     setUrl]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    setUrl(null); setLoading(true); setError(false)
    getPresignedUrl(fileKey, 3600)
      .then(setUrl)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [fileKey])

  const ext     = fileKey.toLowerCase().split('.').pop() ?? ''
  const isAudio = ['mp3', 'wav', 'm4a', 'ogg', 'aac'].includes(ext)

  if (loading) return (
    <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 py-3">
      <Loader2 size={12} className="animate-spin" />
      <span>Memuat preview...</span>
    </div>
  )
  if (error || !url) return null

  if (isAudio) return (
    <div className="mt-3 flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
      <Volume2 size={18} className="text-purple-500 shrink-0" />
      <audio controls src={url} className="flex-1 h-9" />
    </div>
  )

  // PDF (termasuk hasil konversi dari PPTX/DOCX/XLSX via backend)
  return <PdfSlideshowViewer url={url} slideHeight={460} className="mt-3" />
}

// ── Inner page (needs useSearchParams) ──────────────────────
function MateriCreateInner() {
  const router      = useRouter()
  const params      = useSearchParams()

  // ── Predefined data (from URL params) ────────────────────
  const predefined = useMemo(() => ({
    guruId:                params.get('guruId')               ?? '',
    guruNama:              params.get('guruNama')             ?? '',
    tahunAjaranId:         params.get('tahunAjaranId')        ?? '',
    tahunAjaranNama:       params.get('tahunAjaranNama')      ?? '',
    semesterId:            params.get('semesterId')           ?? '',
    semesterNama:          params.get('semesterNama')         ?? '',
    mataPelajaranTingkatId: params.get('mataPelajaranTingkatId') ?? '',
    mapelNama:             params.get('mapelNama')            ?? '',
    tingkatNama:           params.get('tingkatNama')          ?? '',
    mataPelajaranId:       params.get('mataPelajaranId')      ?? '',
    kelasId:               params.get('kelasId')              ?? '',
    kelasNama:             params.get('kelasNama')            ?? '',
  }), [params])

  // ── Form state ────────────────────────────────────────────
  const [judul,               setJudul]               = useState('')
  const [tipeMateri,          setTipeMateri]          = useState<TipeMateri>('TEXT')
  const [konten,              setKonten]              = useState('')
  const [fileUrl,             setFileUrl]             = useState<string>('')     // single file key
  const [youtubeUrl,          setYoutubeUrl]          = useState('')
  const [pertemuanKe,         setPertemuanKe]         = useState<string>('')
  const [deskripsi,           setDeskripsi]           = useState('')
  const [kompetensiDasar,     setKompetensiDasar]     = useState('')
  const [tujuanPembelajaran,  setTujuanPembelajaran]  = useState('')
  const [minScreenTimeMin,    setMinScreenTimeMin]    = useState<string>('0')

  // ── Dokumen pengajaran selection ─────────────────────────
  const [selectedDokumenIds, setSelectedDokumenIds] = useState<string[]>([])
  const [selectedTugasIds,   setSelectedTugasIds]   = useState<string[]>([])

  // ── Publication state ─────────────────────────────────────
  const [isPublished,    setIsPublished]    = useState(false)
  const [pubDate,        setPubDate]        = useState('')
  const [pubTime,        setPubTime]        = useState('07:00')
  const [useSchedule,    setUseSchedule]    = useState(false)  // true = jadwalkan publikasi

  // ── Autosave state ────────────────────────────────────────
  const [savedId,    setSavedId]    = useState<string | null>(null)
  const [isSaving,   setIsSaving]   = useState(false)
  const [isDirty,    setIsDirty]    = useState(false)
  const [lastSaved,  setLastSaved]  = useState<Date | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // saveRef always points to latest save — fixes stale-closure in autosave debounce
  const saveRef = useRef<((showToast?: boolean) => Promise<void>) | null>(null)

  // Derived: valid YouTube ID for inline preview
  const youtubeId = useMemo(() => extractYoutubeId(youtubeUrl), [youtubeUrl])

  const createMutation = useCreateMateri()
  const updateMutation = useUpdateMateri()

  // ── Fetch dokumen pengajaran terkait guru & semester ─────
  const { data: dokumenData, isLoading: isDokumenLoading } = useDokumenPengajaranList(
    {
      guruId:     predefined.guruId,
      semesterId: predefined.semesterId,
      status:     'APPROVED',
      limit:      100,
    },
    { enabled: !!(predefined.guruId && predefined.semesterId) }
  )
  const dokumenList = dokumenData?.data ?? []

  // ── Fetch tugas terkait mapel & kelas ────────────────────
  const { data: tugasData, isLoading: isTugasLoading } = useTugasList(
    {
      mataPelajaranId: predefined.mataPelajaranId,
      kelasId:         predefined.kelasId,
      limit:           100,
    },
    { enabled: !!(predefined.mataPelajaranId && predefined.kelasId) }
  )
  const tugasList = tugasData?.data ?? []

  // ── Bulk create: other classes in same mapelTingkat ───────
  const { data: mapelData } = useMataPelajaranList(
    predefined.semesterId ? {
      semesterId:            predefined.semesterId,
      mataPelajaranTingkatId: predefined.mataPelajaranTingkatId,
      ...(predefined.guruId ? { guruId: predefined.guruId } : {}),
      limit: 50,
    } : undefined,
    { enabled: !!predefined.semesterId && !!predefined.mataPelajaranTingkatId },
  )

  const otherMapels = useMemo(() =>
    (mapelData?.data ?? []).filter((m) => m.id !== predefined.mataPelajaranId),
  [mapelData, predefined.mataPelajaranId])

  // Map: mataPelajaranId → kelasId (needed for bulk create payload)
  const mapelKelasMap = useMemo(() => {
    const m = new Map<string, string>()
    otherMapels.forEach((mp) => m.set(mp.id, mp.kelasId))
    return m
  }, [otherMapels])

  // Deteksi duplikasi judul di kelas lain yang sejenis
  const judulTrimmed = judul.trim()
  const { data: dupMateriData } = useMateriList(
    judulTrimmed && predefined.mataPelajaranTingkatId && predefined.semesterId ? {
      mataPelajaranTingkatId: predefined.mataPelajaranTingkatId,
      semesterId: predefined.semesterId,
      search: judulTrimmed,
      limit: 50,
    } : undefined,
    { enabled: !!judulTrimmed && !!predefined.mataPelajaranTingkatId && !!predefined.semesterId },
  )
  const dupMateriMapelIds = useMemo(() => {
    const ids = new Set<string>()
    ;(dupMateriData?.data ?? [])
      .filter(m => m.judul === judulTrimmed && m.mataPelajaranId !== predefined.mataPelajaranId)
      .forEach(m => ids.add(m.mataPelajaranId))
    return ids
  }, [dupMateriData, judulTrimmed, predefined.mataPelajaranId])

  const [bulkRows, setBulkRows] = useState<BulkCreateTargetRow[]>([])

  // Sync bulk rows when otherMapels load
  useEffect(() => {
    setBulkRows(
      otherMapels.map((m) => ({
        mataPelajaranId: m.id,
        kelasNama:  m.kelas?.namaKelas ?? m.kelasId,
        mapelNama:  m.mataPelajaranTingkat?.masterMapel?.nama ?? '—',
        isChecked:  false,
        date:       '',
        time:       '07:00',
      })),
    )
  }, [otherMapels])

  // ── Build payload ─────────────────────────────────────────
  const buildPayload = useCallback((): MateriPayload => {
    let fileUrls: string[] | HybridFileUrls | undefined
    if (tipeMateri === 'HYBRID') {
      const hybrid: HybridFileUrls = {}
      if (youtubeUrl) hybrid.youtube   = youtubeUrl
      if (fileUrl)   hybrid.slideshow  = fileUrl
      if (Object.keys(hybrid).length) fileUrls = hybrid
    } else if (tipeMateri === 'VIDEO_YOUTUBE') {
      if (youtubeUrl) fileUrls = [youtubeUrl]
    } else {
      if (fileUrl) fileUrls = [fileUrl]
    }

    const tanggalPublikasi = isPublished && useSchedule && pubDate
      ? toISO(pubDate, pubTime)
      : (isPublished ? new Date().toISOString() : null)

    return {
      mataPelajaranId: predefined.mataPelajaranId,
      kelasId:         predefined.kelasId,
      dokumenPengajaranIds: selectedDokumenIds.length ? selectedDokumenIds : undefined,
      tugasIds:             selectedTugasIds.length   ? selectedTugasIds   : undefined,
      tipeMateri,
      judul:           judul.trim(),
      deskripsi:       deskripsi.trim() || undefined,
      konten:          (tipeMateri === 'TEXT' || tipeMateri === 'HYBRID') ? (konten || undefined) : undefined,
      fileUrls,
      pertemuanKe:     pertemuanKe ? parseInt(pertemuanKe, 10) : null,
      kompetensiDasar:    kompetensiDasar.trim() || undefined,
      tujuanPembelajaran: tujuanPembelajaran.trim() || undefined,
      tanggalPublikasi,
      isPublished,
      minScreenTime:   (parseInt(minScreenTimeMin, 10) || 0) * 60,
    }
  }, [
    judul, tipeMateri, konten, fileUrl, youtubeUrl, pertemuanKe,
    deskripsi, kompetensiDasar, tujuanPembelajaran, isPublished,
    useSchedule, pubDate, pubTime, minScreenTimeMin, predefined, selectedDokumenIds, selectedTugasIds,
  ])

  // ── Save function ─────────────────────────────────────────
  const save = useCallback(async (showToast = false) => {
    if (!judul.trim()) return
    // Skip if type requires file/URL but none provided (prevents 400 on premature autosave)
    const requiresFile = tipeMateri === 'PDF' || tipeMateri === 'SLIDESHOW' || tipeMateri === 'AUDIO'
    const requiresUrl  = tipeMateri === 'VIDEO_YOUTUBE'
    if (requiresFile && !fileUrl) {
      if (showToast) toast.error('Upload file terlebih dahulu')
      return
    }
    if (requiresUrl && !youtubeUrl.trim()) {
      if (showToast) toast.error('Isi URL YouTube terlebih dahulu')
      return
    }
    setIsSaving(true)
    try {
      const payload = buildPayload()

      if (!savedId) {
        const created = await createMutation.mutateAsync(payload)
        const newId = (created as any).data?.id || created.id
        setSavedId(newId)
      } else {
        await updateMutation.mutateAsync({ id: savedId, payload })
      }

      setIsDirty(false)
      setLastSaved(new Date())
      if (showToast) toast.success('Materi tersimpan')
    } catch {
      if (showToast) toast.error('Gagal menyimpan materi')
    } finally {
      setIsSaving(false)
    }
  }, [judul, tipeMateri, fileUrl, youtubeUrl, savedId, buildPayload, createMutation, updateMutation])

  // Keep saveRef current so debounce always calls the latest save (fixes stale closure)
  useEffect(() => { saveRef.current = save }, [save])

  // ── Autosave debounce (30s after last change) ─────────────
  const triggerAutosave = useCallback(() => {
    setIsDirty(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    // Use saveRef so the fired callback always uses up-to-date state
    debounceRef.current = setTimeout(() => saveRef.current?.(false), 30_000)
  }, []) // stable — reads refs at call time

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  // ── Switch tipe: clear irrelevant content ────────────────
  const handleTipeChange = useCallback((newTipe: TipeMateri) => {
    if (newTipe === tipeMateri) return
    if (newTipe !== 'TEXT' && newTipe !== 'HYBRID') setKonten('')
    setFileUrl('')
    if (newTipe !== 'VIDEO_YOUTUBE' && newTipe !== 'HYBRID') setYoutubeUrl('')
    setTipeMateri(newTipe)
    setIsDirty(true)
  }, [tipeMateri])

  // Wrapped setters that also trigger autosave
  const setField = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (v: T) => { setter(v); triggerAutosave() }

  // ── Bulk create submit ────────────────────────────────────
  const handleBulkCreate = async () => {
    const checkedRows = bulkRows.filter((r) => r.isChecked)
    if (!savedId || checkedRows.length === 0) return

    let successCount = 0
    const payloadTemplate = buildPayload()

    for (const row of checkedRows) {
      try {
        // Jika row punya tanggal override → publish terjadwal; tanpa override → selalu draft
        const dateOverride = row.date
          ? { isPublished: true,  tanggalPublikasi: toISO(row.date, row.time) }
          : { isPublished: false, tanggalPublikasi: undefined }

        await createMutation.mutateAsync({
          ...payloadTemplate,
          mataPelajaranId: row.mataPelajaranId,
          kelasId:         mapelKelasMap.get(row.mataPelajaranId) ?? predefined.kelasId,
          // Tugas & dokumen bersifat per-kelas — tidak disertakan agar tidak cross-link
          tugasIds:             undefined,
          dokumenPengajaranIds: undefined,
          ...dateOverride,
        })
        successCount++
      } catch {
        // continue
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} materi berhasil dibuat untuk kelas lain`)
    }
  }

  const updateBulkRow = (idx: number, patch: Partial<BulkCreateTargetRow>) => {
    setBulkRows((prev) => prev.map((r, i) => i === idx ? { ...r, ...patch } : r))
  }

  // ── Invalid state ─────────────────────────────────────────
  const isInvalid = !predefined.mataPelajaranId || !predefined.kelasId

  if (isInvalid) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-gray-400">Data materi tidak lengkap. Silakan mulai dari awal.</p>
        <Button variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => router.back()}>
          Kembali
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard/materi-pelajaran')}
          className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center shrink-0 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Buat Materi Baru</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {predefined.mapelNama} · {predefined.kelasNama}
          </p>
        </div>
      </div>

      {/* ── Main layout: 2 columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ═══ LEFT: Main form ═══ */}
        <div className="lg:col-span-2 space-y-6">

          {/* Judul + Deskripsi */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4">
            <div>
              <Label required>Judul Materi</Label>
              <input
                type="text"
                value={judul}
                onChange={(e) => setField(setJudul)(e.target.value)}
                placeholder="Judul materi pelajaran..."
                className="w-full h-10 px-3 text-base font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Pertemuan Ke-</Label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={pertemuanKe}
                  onChange={(e) => setField(setPertemuanKe)(e.target.value)}
                  placeholder="1"
                  className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <Label>Min. Waktu Baca (menit)</Label>
                <input
                  type="number"
                  min={0}
                  value={minScreenTimeMin}
                  onChange={(e) => setField(setMinScreenTimeMin)(e.target.value)}
                  placeholder="0"
                  className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <Label>Deskripsi / Instruksi</Label>
              <textarea
                value={deskripsi}
                onChange={(e) => setField(setDeskripsi)(e.target.value)}
                rows={3}
                placeholder="Deskripsi atau instruksi untuk siswa..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* Tipe materi */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <Label>Tipe Materi</Label>
            <div className="flex flex-wrap gap-2 mb-5">
              {TIPE_TABS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleTipeChange(value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                    tipeMateri === value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600',
                  )}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Content area by type */}
            {tipeMateri === 'TEXT' && (
              <div>
                <Label>Konten Teks</Label>
                <RichTextEditor
                  value={konten}
                  onChange={setField(setKonten)}
                  placeholder="Tulis materi di sini..."
                  minHeight="300px"
                />
              </div>
            )}

            {(tipeMateri === 'PDF' || tipeMateri === 'SLIDESHOW') && (
              <>
                <FileUpload
                  label={tipeMateri === 'PDF' ? 'File PDF' : 'File Presentasi (PPT/PPTX/PDF)'}
                  hint={tipeMateri === 'PDF' ? 'Format: .pdf (maks 50 MB)' : 'Format: .pptx, .pdf (maks 50 MB)'}
                  accept={tipeMateri === 'PDF' ? '.pdf' : '.pdf,.ppt,.pptx'}
                  onUpload={uploadApi.materiPelajaran}
                  compact
                  onSuccess={(key) => { setFileUrl(key); triggerAutosave() }}
                  currentKey={fileUrl || undefined}
                />
                {fileUrl && <FileInlinePreview fileKey={fileUrl} />}
              </>
            )}

            {tipeMateri === 'AUDIO' && (
              <>
                <FileUpload
                  label="File Audio"
                  hint="Format: .mp3, .wav, .m4a (maks 50 MB)"
                  accept=".mp3,.wav,.m4a,.ogg"
                  onUpload={uploadApi.materiPelajaran}
                  compact
                  onSuccess={(key) => { setFileUrl(key); triggerAutosave() }}
                  currentKey={fileUrl || undefined}
                />
                {fileUrl && <FileInlinePreview fileKey={fileUrl} />}
              </>
            )}

            {tipeMateri === 'VIDEO_YOUTUBE' && (
              <div>
                <Label>URL YouTube</Label>
                <div className={cn(
                  'flex items-center gap-2 h-10 px-3 rounded-lg border bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-emerald-500',
                  youtubeId
                    ? 'border-emerald-400 dark:border-emerald-600'
                    : 'border-gray-200 dark:border-gray-700',
                )}>
                  <Link2 size={14} className="text-gray-400 shrink-0" />
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setField(setYoutubeUrl)(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 text-sm bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
                  />
                  {youtubeId && (
                    <button
                      type="button"
                      onClick={() => { setYoutubeUrl(''); triggerAutosave() }}
                      className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                      title="Hapus URL"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {youtubeUrl && (
                  youtubeId ? (
                    <div className="relative mt-3 rounded-lg overflow-hidden aspect-video bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}`}
                        className="w-full h-full"
                        allowFullScreen
                        title="YouTube Preview"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-amber-500 mt-2">URL YouTube tidak valid atau tidak dikenali</p>
                  )
                )}
              </div>
            )}

            {/* ── HYBRID ─────────────────────────────────────── */}
            {tipeMateri === 'HYBRID' && (
              <div className="space-y-5">
                <div>
                  <Label>Instruksi / Teks Pendamping</Label>
                  <RichTextEditor
                    value={konten}
                    onChange={setField(setKonten)}
                    placeholder="Tulis instruksi atau penjelasan pendamping..."
                    minHeight="180px"
                  />
                </div>

                {/* YouTube (opsional) */}
                <div>
                  <Label>URL YouTube <span className="text-[10px] font-normal text-gray-400">(opsional)</span></Label>
                  <div className={cn(
                    'flex items-center gap-2 h-10 px-3 rounded-lg border bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-emerald-500',
                    youtubeId ? 'border-emerald-400 dark:border-emerald-600' : 'border-gray-200 dark:border-gray-700',
                  )}>
                    <Link2 size={14} className="text-gray-400 shrink-0" />
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={(e) => setField(setYoutubeUrl)(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="flex-1 text-sm bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
                    />
                    {youtubeId && (
                      <button
                        type="button"
                        onClick={() => { setYoutubeUrl(''); triggerAutosave() }}
                        className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                        title="Hapus URL"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {youtubeUrl && (
                    youtubeId ? (
                      <div className="relative mt-3 rounded-lg overflow-hidden aspect-video bg-black">
                        <iframe
                          src={`https://www.youtube.com/embed/${youtubeId}`}
                          className="w-full h-full"
                          allowFullScreen
                          title="YouTube Preview"
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-amber-500 mt-2">URL YouTube tidak valid atau tidak dikenali</p>
                    )
                  )}
                </div>

                {/* Slideshow / PDF (opsional) */}
                <FileUpload
                  label="File Presentasi / PDF (opsional)"
                  hint="Format: .pptx, .pdf (maks 50 MB)"
                  accept=".pdf,.ppt,.pptx"
                  onUpload={uploadApi.materiPelajaran}
                  compact
                  onSuccess={(key) => { setFileUrl(key); triggerAutosave() }}
                  currentKey={fileUrl || undefined}
                />
                {fileUrl && <FileInlinePreview fileKey={fileUrl} />}
              </div>
            )}
          </div>

          {/* Optional fields */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-5">
            <SectionTitle tooltip="Kompetensi Dasar dan Tujuan Pembelajaran akan ditampilkan di halaman detail materi milik siswa.">Detail Tambahan</SectionTitle>

            {/* Kompetensi Dasar */}
            <div>
              <Label>Kompetensi Dasar</Label>
              <RichTextEditor
                value={kompetensiDasar}
                onChange={setField(setKompetensiDasar)}
                placeholder="Tuliskan kompetensi dasar..."
                minHeight="120px"
              />
            </div>

            {/* Tujuan Pembelajaran */}
            <div>
              <Label>Tujuan Pembelajaran</Label>
              <RichTextEditor
                value={tujuanPembelajaran}
                onChange={setField(setTujuanPembelajaran)}
                placeholder="Tuliskan tujuan pembelajaran..."
                minHeight="120px"
              />
            </div>
          </div>

        </div>

        {/* ═══ RIGHT: Sidebar ═══ */}
        <div className="space-y-4">

          {/* Autosave status + Save button */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
            {/* Status */}
            <div className="flex items-center gap-2 text-xs">
              {isSaving ? (
                <>
                  <RefreshCw size={12} className="animate-spin text-gray-400" />
                  <span className="text-gray-400">Menyimpan...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Check size={12} className="text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Tersimpan {lastSaved.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isDirty && (
                    <span className="text-amber-500 ml-1">(ada perubahan)</span>
                  )}
                </>
              ) : (
                <span className="text-gray-400">Belum tersimpan</span>
              )}
            </div>

            {(() => {
              const scheduleReady = isPublished && useSchedule && !!pubDate
              const scheduleWaiting = isPublished && useSchedule && !pubDate
              const label = scheduleReady
                ? 'Simpan & Jadwalkan'
                : isPublished
                  ? 'Simpan & Publis Sekarang'
                  : (savedId ? 'Simpan Perubahan' : 'Simpan sebagai Draft')
              return (
                <Button
                  className="w-full"
                  leftIcon={<Save size={16} />}
                  loading={isSaving}
                  disabled={!judul.trim() || scheduleWaiting}
                  onClick={() => save(true)}
                  title={scheduleWaiting ? 'Pilih tanggal publikasi terlebih dahulu' : undefined}
                >
                  {label}
                </Button>
              )
            })()}

            {savedId && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => router.push('/dashboard/materi-pelajaran')}
              >
                Selesai & Kembali
              </Button>
            )}
          </div>

          {/* Publication */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">
            <SectionTitle tooltip="Draft = tersimpan tapi tidak terlihat siswa. Publikasikan sekarang = langsung terlihat. Jadwalkan = publis otomatis di tanggal & jam yang ditentukan.">Publikasi</SectionTitle>

            {/* Toggle published */}
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Publikasikan</span>
              <button
                type="button"
                onClick={() => { setIsPublished(!isPublished); triggerAutosave() }}
                className={cn(
                  'relative w-10 h-5 rounded-full transition-colors focus:outline-none',
                  isPublished ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700',
                )}
              >
                <span className={cn(
                  'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  isPublished && 'translate-x-5',
                )} />
              </button>
            </label>

            {/* Schedule toggle */}
            {isPublished && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSchedule}
                  onChange={() => setUseSchedule(!useSchedule)}
                  className="accent-emerald-600"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Jadwalkan tanggal publikasi</span>
              </label>
            )}

            {/* Date + time */}
            {isPublished && useSchedule && (
              <div className="space-y-2">
                <div>
                  <Label>Tanggal Publikasi</Label>
                  <DateInput
                    value={pubDate}
                    onChange={(v) => { setPubDate(v); triggerAutosave() }}
                    min={todayStr()}
                  />
                </div>
                <div>
                  <Label>Jam Publikasi</Label>
                  <TimePicker
                    value={pubTime}
                    onChange={(v) => { setPubTime(v); triggerAutosave() }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Buat untuk Kelas Lain */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Buat untuk Kelas Lain
                </p>
                <InfoTooltip
                  content="Membuat salinan materi ini di kelas lain dengan mata pelajaran sejenis. Pengaturan tanggal publikasi dapat berbeda per kelas. Koneksi ke tugas tidak disalin. Konten dan pengaturan akan disalin ke kelas yang dipilih — atur tanggal publikasi per kelas, atau kosongkan untuk mengikuti pengaturan materi utama."
                  align="left"
                />
              </div>
              {bulkRows.length > 0 && (
                <span className="text-[10px] text-gray-400">{bulkRows.length} kelas tersedia</span>
              )}
            </div>

            {bulkRows.length === 0 ? (
              <div className="flex items-start gap-2 text-xs text-gray-400">
                <Info size={13} className="shrink-0 mt-0.5" />
                <span>Tidak ada kelas lain dengan mata pelajaran sejenis di semester ini.</span>
              </div>
            ) : (
              <>
                {!savedId && (
                  <div className="flex items-start gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 rounded-lg px-2.5 py-2 mb-3">
                    <Info size={11} className="shrink-0 mt-0.5" />
                    <span>Simpan materi utama terlebih dahulu sebelum membuat untuk kelas lain.</span>
                  </div>
                )}
                <div className="flex items-start gap-1.5 text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800/60 rounded-lg px-2.5 py-2 mb-3">
                  <Info size={11} className="shrink-0 mt-0.5" />
                  <span>Konten, tipe, dan pengaturan disalin. <strong className="text-gray-500 dark:text-gray-400">Tugas dan dokumen pengajaran tidak disertakan</strong> — masing-masing kelas memiliki tugas tersendiri.</span>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
                  {bulkRows.map((row, idx) => (
                    <div
                      key={row.mataPelajaranId}
                      className={cn(
                        'rounded-lg border transition-colors',
                        row.isChecked
                          ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-30/50 dark:bg-emerald-900/10'
                          : 'border-gray-200 dark:border-gray-700',
                      )}
                    >
                      <label className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.isChecked}
                          onChange={() => updateBulkRow(idx, { isChecked: !row.isChecked })}
                          className="accent-emerald-600 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                            {row.kelasNama}
                            {dupMateriMapelIds.has(row.mataPelajaranId) && (
                              <span className="ml-1.5 font-normal text-amber-500">(sudah ada)</span>
                            )}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">{row.mapelNama}</p>
                        </div>
                      </label>
                      {row.isChecked && (
                        <div className="px-3 pb-2.5 space-y-1.5">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                            Tanggal Publikasi <span className="normal-case font-normal">(opsional)</span>
                          </p>
                          <div className="flex gap-1.5 flex-wrap">
                            <DateInput
                              value={row.date}
                              onChange={(v) => updateBulkRow(idx, { date: v })}
                              min={todayStr()}
                            />
                            <TimePicker
                              value={row.time}
                              onChange={(v) => updateBulkRow(idx, { time: v })}
                            />
                          </div>
                          <p className="text-[10px] text-gray-400">
                            {row.date
                              ? 'Akan dipublikasikan terjadwal pada tanggal ini'
                              : isPublished
                                ? 'Kosong = ikuti pengaturan publikasi materi utama'
                                : 'Kosong = dibuat sebagai Draft'}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {bulkRows.some((r) => r.isChecked) && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      disabled={!savedId}
                      loading={createMutation.isPending}
                      onClick={handleBulkCreate}
                    >
                      Buat untuk {bulkRows.filter((r) => r.isChecked).length} kelas lain
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Dokumen Pengajaran */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} className="text-gray-400" />
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Dokumen Pengajaran
              </p>
              <InfoTooltip
                content="Lampirkan dokumen perencanaan (RPP, ATP, dll.) yang berkaitan dengan materi ini. Hanya terlihat oleh Anda sebagai guru, tidak ditampilkan ke siswa. Pilih dokumen yang berkaitan dengan materi ini (opsional)."
                align="left"
              />
            </div>

            {isDokumenLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                <RefreshCw size={12} className="animate-spin" />
                <span>Memuat dokumen...</span>
              </div>
            ) : dokumenList.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-1">
                Tidak ada dokumen (status Disetujui) untuk semester ini.
              </p>
            ) : (
              <div className="space-y-1.5">
                {dokumenList.map((dok) => {
                  const checked = selectedDokumenIds.includes(dok.id)
                  return (
                    <label
                      key={dok.id}
                      className={cn(
                        'flex items-start gap-2.5 px-2.5 py-2 rounded-lg border cursor-pointer transition-colors',
                        checked
                          ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-30/50 dark:bg-emerald-900/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedDokumenIds((prev) =>
                            checked ? prev.filter((id) => id !== dok.id) : [...prev, dok.id],
                          )
                          triggerAutosave()
                        }}
                        className="mt-0.5 accent-emerald-600 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-800 dark:text-gray-200 truncate">{dok.judul}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {JENIS_DOKUMEN_LABEL[dok.jenisDokumen] ?? dok.jenisDokumen}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}

            {selectedDokumenIds.length > 0 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                {selectedDokumenIds.length} dokumen dipilih
              </p>
            )}
          </div>

          {/* Hubungkan Tugas */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Hubungkan Tugas
              </p>
              <InfoTooltip
                content="Tugas yang dipilih akan muncul di halaman detail materi milik siswa, membantu mereka memahami keterkaitan antara materi dan tugas."
                align="left"
              />
            </div>

            {isTugasLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Loader2 size={12} className="animate-spin" />
                <span>Memuat tugas...</span>
              </div>
            ) : tugasList.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Belum ada tugas untuk mata pelajaran dan kelas ini.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                {tugasList.map((t) => (
                  <label
                    key={t.id}
                    className={cn(
                      'flex items-start gap-2.5 px-2.5 py-2 rounded-lg border cursor-pointer transition-colors',
                      selectedTugasIds.includes(t.id)
                        ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTugasIds.includes(t.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedTugasIds(prev => [...prev, t.id])
                        else setSelectedTugasIds(prev => prev.filter(id => id !== t.id))
                        triggerAutosave()
                      }}
                      className="mt-0.5 accent-blue-600 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{t.judul}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {t.tujuan.replace('_', ' ')} · {t.bentuk.replace('_', ' ')}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {selectedTugasIds.length > 0 && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                {selectedTugasIds.length} tugas dipilih
              </p>
            )}
          </div>

          {/* Predefined info */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <SectionTitle>Info Materi</SectionTitle>
            <div className="space-y-2.5">
              {[
                { label: 'Mata Pelajaran', value: predefined.mapelNama },
                { label: 'Kelas', value: `${predefined.kelasNama}${predefined.tingkatNama ? ` · ${predefined.tingkatNama}` : ''}` },
                { label: 'Semester', value: predefined.semesterNama },
                { label: 'Tahun Ajaran', value: predefined.tahunAjaranNama },
                ...(predefined.guruNama ? [{ label: 'Guru', value: predefined.guruNama }] : []),
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}

// ── Page export with Suspense (useSearchParams requirement) ──
export default function MateriCreatePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <RefreshCw size={20} className="animate-spin text-gray-400" />
      </div>
    }>
      <MateriCreateInner />
    </Suspense>
  )
}
