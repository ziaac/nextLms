
'use client'

import {
  useState, useEffect, useRef, useCallback, useMemo, Suspense,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button }            from '@/components/ui'
import { RichTextEditor }    from '@/components/ui/RichTextEditor'
import { DateInput }         from '@/components/ui/DateInput'
import { TimePicker }        from '@/components/ui/TimePicker'
import { FileUpload }        from '@/components/ui'
import { useCreateTugas, useUpdateTugas } from '@/hooks/tugas/useTugas'
import type { TugasPayload, TujuanTugas, BentukTugas, SoalKuisPayload, QuizSettings } from '@/types/tugas.types'
import { ModePengerjaan } from '@/types/tugas.types'
import { uploadApi } from '@/lib/api/upload.api'
import { QuizBuilder } from '../_components/QuizBuilder'
import { SalinKelasLainPanel } from '../_components/SalinKelasLainPanel'
import { useAuthStore } from '@/stores/auth.store'
import {
  ArrowLeft, Save, Check, RefreshCw, X, ArrowRight, LayoutTemplate,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function toISO(date: string, time: string) {
  if (!date || !time) return null
  return new Date(`${date}T${time}:00`).toISOString()
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
      {children}
    </p>
  )
}

function TugasCreateInner() {
  const router      = useRouter()
  const params      = useSearchParams()
  const { user }    = useAuthStore()

  // ── Predefined data (from URL params) ────────────────────
  const predefined = useMemo(() => {
    const materiParam = params.get('materiPelajaranIds')
    return {
      mataPelajaranId:    params.get('mataPelajaranId')   ?? '',
      kelasId:            params.get('kelasId')           ?? '',
      semesterId:         params.get('semesterId')        ?? '',
      materiPelajaranIds: materiParam ? materiParam.split(',') : [],
      tujuan:             (params.get('tujuan') as TujuanTugas) || 'LAINNYA',
      bentuk:             (params.get('bentuk') as BentukTugas) || 'FILE_SUBMISSION',
    }
  }, [params])

  const isUjian      = predefined.tujuan === 'UTS' || predefined.tujuan === 'UAS'
  const isRemedial   = predefined.tujuan === 'REMEDIAL'
  const isWorksheet  = predefined.bentuk === 'INTERACTIVE_WORKSHEET'

  // ── Form state ────────────────────────────────────────────
  const [judul,               setJudul]               = useState('')
  const [deskripsi,           setDeskripsi]           = useState('')
  const [instruksi,           setInstruksi]           = useState('')
  const [fileUrls,            setFileUrls]            = useState<string[]>([])
  
  // Penilaian
  const [bobot,               setBobot]               = useState<string>('100')
  
  // Jadwal
  const [mulaiDate,           setMulaiDate]           = useState(todayStr())
  const [mulaiTime,           setMulaiTime]           = useState('07:00')
  const [selesaiDate,         setSelesaiDate]         = useState('')
  const [selesaiTime,         setSelesaiTime]         = useState('23:59')

  // Pengaturan Pengumpulan
  const [maxFileSize,         setMaxFileSize]         = useState<string>('10') // MB
  const [allowedFileTypes,    setAllowedFileTypes]    = useState<string>('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png,.zip')
  const [allowLate,           setAllowLate]           = useState(false)
  const [latePenalty,         setLatePenalty]         = useState<string>('0')

  // ── Publication state ─────────────────────────────────────
  const [isPublished,    setIsPublished]    = useState(false)

  // ── Quiz state ────────────────────────────────────────────
  const [quizSettings,   setQuizSettings]   = useState<QuizSettings>({ 
    isAutograde: true, isAcakSoal: true, isAcakOpsi: true, isStrictBrowser: false 
  })
  const [soalKuis,       setSoalKuis]       = useState<SoalKuisPayload[]>([])

  // ── Autosave state ────────────────────────────────────────
  const [savedId,    setSavedId]    = useState<string | null>(null)
  const [isSaving,   setIsSaving]   = useState(false)
  const [isDirty,    setIsDirty]    = useState(false)
  const [lastSaved,  setLastSaved]  = useState<Date | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveRef = useRef<((showToast?: boolean) => Promise<void>) | null>(null)

  const createMutation = useCreateTugas()
  const updateMutation = useUpdateTugas()

  // ── Build payload ─────────────────────────────────────────
  const buildPayload = useCallback((): TugasPayload => {
    return {
      mataPelajaranId:     predefined.mataPelajaranId,
      kelasId:             predefined.kelasId,
      semesterId:          predefined.semesterId,
      materiPelajaranIds:  predefined.materiPelajaranIds.length > 0 ? predefined.materiPelajaranIds : undefined,
      judul:               judul.trim(),
      deskripsi:           deskripsi.trim() || undefined,
      instruksi:           instruksi.trim() || undefined,
      fileUrls:            fileUrls.length > 0 ? fileUrls : undefined,
      tujuan:              predefined.tujuan,
      bentuk:              predefined.bentuk,
      modePengerjaan:      ModePengerjaan.INDIVIDU,
      bobot:               parseInt(bobot, 10) || 100,
      tanggalMulai:        toISO(mulaiDate, mulaiTime) || new Date().toISOString(),
      tanggalSelesai:      toISO(selesaiDate, selesaiTime) || new Date().toISOString(),
      allowLateSubmission: isUjian ? false : allowLate,
      lateSubmissionPenalty: (isUjian ? false : allowLate) ? (parseInt(latePenalty, 10) || 0) : null,
      maxFileSize:         predefined.bentuk === 'FILE_SUBMISSION' || predefined.bentuk === 'HYBRID' 
                             ? (parseInt(maxFileSize, 10) || 10) * 1024 * 1024 // to Bytes
                             : null,
      allowedFileTypes:    predefined.bentuk === 'FILE_SUBMISSION' || predefined.bentuk === 'HYBRID'
                             ? allowedFileTypes.split(',').map(s => s.trim()).filter(Boolean)
                             : [],
      isPublished,
      quizSettings:        predefined.bentuk.includes('QUIZ') ? quizSettings : undefined,
      soalKuis:            predefined.bentuk.includes('QUIZ') && soalKuis.length > 0 ? soalKuis : undefined,
    }
  }, [
    judul, deskripsi, instruksi, fileUrls, bobot, 
    mulaiDate, mulaiTime, selesaiDate, selesaiTime,
    maxFileSize, allowedFileTypes, allowLate, latePenalty,
    isPublished, quizSettings, soalKuis, predefined
  ])

  // ── Save function ─────────────────────────────────────────
  const save = useCallback(async (showToast = false) => {
    if (!judul.trim() || !selesaiDate) {
      if (showToast) toast.error('Judul dan Deadline harus diisi')
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
      if (showToast) toast.success('Tugas tersimpan')
    } catch {
      if (showToast) toast.error('Gagal menyimpan tugas')
    } finally {
      setIsSaving(false)
    }
  }, [judul, selesaiDate, savedId, buildPayload, createMutation, updateMutation])

  useEffect(() => { saveRef.current = save }, [save])

  const triggerAutosave = useCallback(() => {
    setIsDirty(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveRef.current?.(false), 30_000)
  }, [])

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  const setField = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (v: T) => { setter(v); triggerAutosave() }

  // ── Invalid state ─────────────────────────────────────────
  const isInvalid = !predefined.mataPelajaranId || !predefined.kelasId

  if (isInvalid) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-gray-400">Data konteks tugas tidak lengkap. Silakan ulangi pembuatan dari daftar tugas.</p>
        <Button variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => router.push('/dashboard/tugas')}>
          Kembali ke Daftar Tugas
        </Button>
      </div>
    )
  }

  const showFileSettings = predefined.bentuk === 'FILE_SUBMISSION' || predefined.bentuk === 'HYBRID'
  const showLateSettings = !isUjian

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          onClick={() => router.push('/dashboard/tugas')}
          className="w-10 h-10 !p-0 flex items-center justify-center rounded-lg shrink-0 shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </Button>
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Buat Tugas Baru</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
            {predefined.tujuan.replace('_', ' ').toLowerCase()} • {predefined.bentuk.replace('_', ' ').toLowerCase()}
          </p>
        </div>
      </div>

      {/* ── Info banner khusus INTERACTIVE_WORKSHEET ── */}
      {isWorksheet && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
          <LayoutTemplate size={18} className="text-violet-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">Tugas Interactive Worksheet</p>
            <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5 leading-relaxed">
              Langkah 1 dari 2: Isi detail tugas (judul, jadwal, instruksi) lalu klik <strong>Simpan Draft</strong>.{' '}
              Setelah tersimpan, Anda akan diarahkan ke <strong>Builder Worksheet</strong> untuk mengunggah halaman dan menambahkan widget interaktif.
            </p>
          </div>
        </div>
      )}

      {/* ── Main layout: 2 columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ═══ LEFT: Main form ═══ */}
        <div className="lg:col-span-2 space-y-6">

          {/* Judul + Deskripsi */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4">
            <div>
              <Label required>Judul Tugas</Label>
              <input
                type="text"
                value={judul}
                onChange={(e) => setField(setJudul)(e.target.value)}
                placeholder="Misal: Tugas Harian 1 - Aljabar Linier"
                className="w-full h-10 px-3 text-base font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label>Deskripsi Singkat</Label>
              <textarea
                value={deskripsi}
                onChange={(e) => setField(setDeskripsi)(e.target.value)}
                rows={2}
                placeholder="Deskripsi singkat atau pengantar tugas..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Instruksi & Soal */}
          {predefined.bentuk.includes('QUIZ') ? (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
              <QuizBuilder
                soalKuis={soalKuis}
                onChangeSoal={setField(setSoalKuis)}
                settings={quizSettings}
                onChangeSettings={setField(setQuizSettings)}
              />
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
              <Label>Instruksi / Detail Soal</Label>
              <div className="mt-2">
                <RichTextEditor
                  value={instruksi}
                  onChange={setField(setInstruksi)}
                  placeholder="Tuliskan instruksi lengkap atau butir soal di sini..."
                  minHeight="300px"
                />
              </div>
            </div>
          )}

          {/* Lampiran (Optional) */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <SectionTitle>Lampiran (Soal / Templat / Referensi)</SectionTitle>
            <p className="text-xs text-gray-400 mb-3">
              Opsional: Anda dapat mengunggah file panduan atau templat jawaban yang bisa diunduh oleh siswa.
            </p>
            <FileUpload
              label="Unggah File"
              hint="Maks 50 MB"
              onUpload={uploadApi.tugas}
              compact
              onSuccess={(key) => { 
                setFileUrls(prev => [...prev, key])
                triggerAutosave() 
              }}
            />
            {fileUrls.length > 0 && (
              <div className="mt-4 space-y-2">
                {fileUrls.map((url, i) => (
                  <div key={i} className="flex items-center justify-between p-2 text-sm border rounded bg-gray-50 dark:bg-gray-800/50">
                    <span className="truncate max-w-[80%]">{url.split('/').pop()}</span>
                    <button 
                      onClick={() => {
                        setFileUrls(prev => prev.filter((_, idx) => idx !== i))
                        triggerAutosave()
                      }}
                      className="text-red-500 p-1 hover:bg-red-50 rounded"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT: Sidebar ═══ */}
        <div className="space-y-4">

          {/* Action Card */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">
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

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              leftIcon={<Save size={16} />}
              loading={isSaving}
              disabled={!judul.trim() || !selesaiDate}
              onClick={() => save(true)}
            >
              {isPublished ? 'Simpan & Publikasikan' : (savedId ? 'Simpan Perubahan' : 'Simpan Draft')}
            </Button>

            {/* Setelah tersimpan: tombol kontekstual */}
            {savedId && isWorksheet && (
              <Button
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                rightIcon={<ArrowRight size={15} />}
                onClick={() => router.push(`/dashboard/tugas/${savedId}?tab=worksheet`)}
              >
                Lanjut ke Builder Worksheet
              </Button>
            )}

            {savedId && !isWorksheet && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => router.push('/dashboard/tugas')}
              >
                Selesai & Kembali
              </Button>
            )}

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Publikasikan ke Siswa</span>
                <button
                  type="button"
                  onClick={() => { setIsPublished(!isPublished); triggerAutosave() }}
                  className={cn(
                    'relative w-10 h-5 rounded-full transition-colors focus:outline-none',
                    isPublished ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700',
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                    isPublished && 'translate-x-5',
                  )} />
                </button>
              </label>
            </div>
          </div>

          {/* Salin ke Kelas Lain */}
          <SalinKelasLainPanel
            tugasId={savedId}
            srcMataPelajaranId={predefined.mataPelajaranId}
            semesterId={predefined.semesterId}
            guruId={user?.id ?? ''}
            judulTugas={judul.trim() || undefined}
            tanggalMulai={toISO(mulaiDate, mulaiTime) ?? undefined}
            tanggalSelesai={toISO(selesaiDate, selesaiTime) ?? undefined}
          />

          {/* Jadwal Pelaksanaan */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">
            <SectionTitle>Jadwal Pelaksanaan</SectionTitle>
            
            <div className="space-y-3">
              <div>
                <Label required>Tanggal Mulai</Label>
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-2">
                  <DateInput value={mulaiDate} onChange={setField(setMulaiDate)} />
                  <TimePicker value={mulaiTime} onChange={setField(setMulaiTime)} />
                </div>
              </div>
              <div>
                <Label required>Tenggat Waktu (Deadline)</Label>
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-2">
                  <DateInput value={selesaiDate} onChange={setField(setSelesaiDate)} min={mulaiDate} />
                  <TimePicker value={selesaiTime} onChange={setField(setSelesaiTime)} />
                </div>
              </div>
            </div>
          </div>

          {/* Pengaturan Penilaian */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">
            <SectionTitle>Penilaian</SectionTitle>
            <div>
              <Label>Bobot Nilai Maksimal</Label>
              <input
                type="number"
                min="0"
                max="100"
                value={bobot}
                onChange={(e) => setField(setBobot)(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                {isRemedial 
                  ? 'KARENA INI REMEDIAL: Disarankan nilai bobot maksimal disamakan dengan batas KKM (misal 75).'
                  : 'Standar nilai maksimal biasanya 100.'}
              </p>
            </div>
          </div>

          {/* Pengaturan Pengumpulan */}
          {showFileSettings && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">
              <SectionTitle>Pengaturan Pengumpulan</SectionTitle>
              
              <div>
                <Label>Ekstensi File yang Diizinkan</Label>
                <input
                  type="text"
                  value={allowedFileTypes}
                  onChange={(e) => setField(setAllowedFileTypes)(e.target.value)}
                  className="w-full h-9 px-3 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
                <p className="text-[10px] text-gray-500 mt-1">Pisahkan dengan koma. Contoh: .pdf,.docx,.zip</p>
              </div>

              <div>
                <Label>Maksimal Ukuran File (MB)</Label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={maxFileSize}
                  onChange={(e) => setField(setMaxFileSize)(e.target.value)}
                  className="w-full h-9 px-3 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>
            </div>
          )}

          {/* Keterlambatan */}
          {showLateSettings && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">
              <SectionTitle>Keterlambatan</SectionTitle>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowLate}
                  onChange={(e) => setField(setAllowLate)(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Izinkan pengumpulan terlambat</span>
              </label>

              {allowLate && (
                <div className="mt-3 pl-6 border-l-2 border-blue-100 dark:border-blue-900">
                  <Label>Penalti Keterlambatan (%)</Label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={latePenalty}
                    onChange={(e) => setField(setLatePenalty)(e.target.value)}
                    className="w-24 h-9 px-3 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Persentase pengurangan nilai jika terlambat.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function TugasCreatePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-400">Memuat form pembuatan tugas...</div>}>
      <TugasCreateInner />
    </Suspense>
  )
}
