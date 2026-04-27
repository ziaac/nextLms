'use client'

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, FileUpload } from '@/components/ui'
import { DateInput }   from '@/components/ui/DateInput'
import { TimePicker }  from '@/components/ui/TimePicker'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { QuizBuilder } from '../../_components/QuizBuilder'
import { useTugasDetail, useUpdateTugas } from '@/hooks/tugas/useTugas'
import { useAuthStore } from '@/stores/auth.store'
import { SalinKelasLainPanel } from '../../_components/SalinKelasLainPanel'
import type { TugasPayload, SoalKuisPayload, QuizSettings } from '@/types/tugas.types'
import { ModePengerjaan } from '@/types/tugas.types'
import { uploadApi } from '@/lib/api/upload.api'
import { ArrowLeft, ArrowRight, Save, RefreshCw, Check, X, LayoutTemplate } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ── Local UI ──────────────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
}

// ── Utilities ─────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">{children}</p>
}

function toDateStr(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(0, 10)
}
function toTimeStr(iso?: string) {
  if (!iso) return '07:00'
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
function toISO(date: string, time: string) {
  if (!date) return ''
  return new Date(`${date}T${time}:00`).toISOString()
}

// ── Inner Edit Form ────────────────────────────────────────────────
function TugasEditInner() {
  const router = useRouter()
  const params = useParams()
  const tugasId = params.id as string
  const { user } = useAuthStore()

  const { data: tugas, isLoading } = useTugasDetail(tugasId)
  const updateMutation = useUpdateTugas()

  // ── Form state ────────────────────────────────────────────────
  const [judul,             setJudul]           = useState('')
  const [deskripsi,         setDeskripsi]       = useState('')
  const [instruksi,         setInstruksi]       = useState('')
  const [fileUrls,          setFileUrls]        = useState<string[]>([])
  const [bobot,             setBobot]           = useState('100')
  const [mulaiDate,         setMulaiDate]       = useState('')
  const [mulaiTime,         setMulaiTime]       = useState('07:00')
  const [selesaiDate,       setSelesaiDate]     = useState('')
  const [selesaiTime,       setSelesaiTime]     = useState('23:59')
  const [maxFileSize,       setMaxFileSize]     = useState('10')
  const [allowedFileTypes,  setAllowedFileTypes] = useState('.pdf,.doc,.docx,.jpg,.png')
  const [allowLate,         setAllowLate]       = useState(false)
  const [latePenalty,       setLatePenalty]     = useState('0')
  const [isPublished,       setIsPublished]     = useState(false)
  const [quizSettings,      setQuizSettings]    = useState<QuizSettings>({})
  const [soalKuis,          setSoalKuis]        = useState<SoalKuisPayload[]>([])
  const [initialized,       setInitialized]     = useState(false)

  // Autosave
  const [isSaving,   setIsSaving]   = useState(false)
  const [isDirty,    setIsDirty]    = useState(false)
  const [lastSaved,  setLastSaved]  = useState<Date | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveRef     = useRef<((showToast?: boolean) => Promise<void>) | null>(null)

  // ── Initialize form from loaded data ─────────────────────────
  useEffect(() => {
    if (!tugas || initialized) return
    setJudul(tugas.judul)
    setDeskripsi(tugas.deskripsi ?? '')
    setInstruksi(tugas.instruksi ?? '')
    setFileUrls(Array.isArray(tugas.fileUrls) ? tugas.fileUrls : [])
    setBobot(String(tugas.bobot))
    setMulaiDate(toDateStr(tugas.tanggalMulai))
    setMulaiTime(toTimeStr(tugas.tanggalMulai))
    setSelesaiDate(toDateStr(tugas.tanggalSelesai))
    setSelesaiTime(toTimeStr(tugas.tanggalSelesai))
    setAllowLate(tugas.allowLateSubmission)
    setLatePenalty(String(tugas.lateSubmissionPenalty ?? 0))
    setMaxFileSize(String(Math.round((tugas.maxFileSize ?? 10485760) / 1048576)))
    setAllowedFileTypes((tugas.allowedFileTypes ?? []).join(','))
    setIsPublished(tugas.isPublished)
    if (tugas.quizSettings) setQuizSettings(tugas.quizSettings as QuizSettings)
    if (tugas.soalKuis && tugas.soalKuis.length > 0) {
      setSoalKuis(tugas.soalKuis.map(s => ({
        pertanyaan: s.pertanyaan,
        gambarUrl: s.gambarUrl,
        tipe: s.tipe,
        bobot: s.bobot,
        urutan: s.urutan,
        opsi: s.opsi?.map(o => ({
          teks: o.teks,
          gambarUrl: o.gambarUrl,
          isCorrect: o.isCorrect,
          urutan: o.urutan,
        }))
      })))
    }
    setInitialized(true)
  }, [tugas, initialized])

  const isUjian   = tugas?.tujuan === 'UTS' || tugas?.tujuan === 'UAS'
  const isRemedial = tugas?.tujuan === 'REMEDIAL'
  const isQuiz    = tugas?.bentuk?.includes('QUIZ') ?? false
  const showFileSettings = tugas?.bentuk === 'FILE_SUBMISSION' || tugas?.bentuk === 'HYBRID'

  // ── Build payload ─────────────────────────────────────────────
  const buildPayload = useCallback((): Partial<TugasPayload> => ({
    judul:               judul.trim(),
    deskripsi:           deskripsi.trim() || undefined,
    instruksi:           instruksi.trim() || undefined,
    fileUrls:            fileUrls.length > 0 ? fileUrls : undefined,
    modePengerjaan:      ModePengerjaan.INDIVIDU,
    bobot:               parseInt(bobot, 10) || 100,
    tanggalMulai:        toISO(mulaiDate, mulaiTime),
    tanggalSelesai:      toISO(selesaiDate, selesaiTime),
    allowLateSubmission: isUjian ? false : allowLate,
    lateSubmissionPenalty: (isUjian ? false : allowLate) ? (parseInt(latePenalty, 10) || 0) : null,
    maxFileSize:         showFileSettings ? (parseInt(maxFileSize, 10) || 10) * 1024 * 1024 : null,
    allowedFileTypes:    showFileSettings ? allowedFileTypes.split(',').map(s => s.trim()).filter(Boolean) : [],
    isPublished,
    quizSettings:        isQuiz ? quizSettings : undefined,
    soalKuis:            isQuiz && soalKuis.length > 0 ? soalKuis : undefined,
  }), [judul, deskripsi, instruksi, fileUrls, bobot, mulaiDate, mulaiTime,
       selesaiDate, selesaiTime, allowLate, latePenalty, maxFileSize,
       allowedFileTypes, isPublished, isUjian, showFileSettings, isQuiz,
       quizSettings, soalKuis])

  // ── Save function ─────────────────────────────────────────────
  const save = useCallback(async (showToast = false) => {
    if (!judul.trim() || !selesaiDate) {
      if (showToast) toast.error('Judul dan Deadline harus diisi')
      return
    }
    setIsSaving(true)
    try {
      await updateMutation.mutateAsync({ id: tugasId, payload: buildPayload() as TugasPayload })
      setIsDirty(false)
      setLastSaved(new Date())
      if (showToast) toast.success('Tugas berhasil diperbarui')
    } catch {
      if (showToast) toast.error('Gagal menyimpan perubahan')
    } finally {
      setIsSaving(false)
    }
  }, [judul, selesaiDate, tugasId, buildPayload, updateMutation])

  useEffect(() => { saveRef.current = save }, [save])

  const triggerAutosave = useCallback(() => {
    setIsDirty(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveRef.current?.(false), 30_000)
  }, [])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const setField = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (v: T) => { setter(v); triggerAutosave() }

  // ── Loading state ─────────────────────────────────────────────
  if (isLoading || !initialized) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw size={24} className="animate-spin text-gray-400" />
      </div>
    )
  }

  if (!tugas) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-gray-400">Tugas tidak ditemukan.</p>
        <Button variant="secondary" onClick={() => router.push('/dashboard/tugas')}>Kembali</Button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          onClick={() => router.push(`/dashboard/tugas/${tugasId}`)}
          className="w-10 h-10 !p-0 flex items-center justify-center rounded-lg shrink-0 shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </Button>
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Tugas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
            {tugas.tujuan?.replace('_', ' ').toLowerCase()} • {tugas.bentuk?.replace('_', ' ').toLowerCase()}
          </p>
        </div>
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Judul + Deskripsi */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4">
            <div>
              <Label required>Judul Tugas</Label>
              <input
                type="text"
                value={judul}
                onChange={(e) => setField(setJudul)(e.target.value)}
                className="w-full h-10 px-3 text-base font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label>Deskripsi Singkat</Label>
              <textarea
                value={deskripsi}
                onChange={(e) => setField(setDeskripsi)(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Instruksi / Quiz */}
          {isQuiz ? (
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

          {/* Lampiran */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <SectionTitle>Lampiran</SectionTitle>
            <FileUpload
              label="Unggah File"
              hint="Maks 50 MB"
              onUpload={uploadApi.tugas}
              compact
              onSuccess={(key) => { setFileUrls(prev => [...prev, key]); triggerAutosave() }}
            />
            {fileUrls.length > 0 && (
              <div className="mt-3 space-y-2">
                {fileUrls.map((url, i) => (
                  <div key={i} className="flex items-center justify-between p-2 text-sm border rounded bg-gray-50 dark:bg-gray-800/50">
                    <span className="truncate max-w-[80%]">{url.split('/').pop()}</span>
                    <button onClick={() => { setFileUrls(prev => prev.filter((_, idx) => idx !== i)); triggerAutosave() }}
                      className="text-red-500 p-1 hover:bg-red-50 rounded">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="space-y-4">

          {/* Action Card */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs">
              {isSaving ? (
                <><RefreshCw size={12} className="animate-spin text-gray-400" /><span className="text-gray-400">Menyimpan...</span></>
              ) : lastSaved ? (
                <><Check size={12} className="text-emerald-500" /><span className="text-emerald-600 dark:text-emerald-400">Tersimpan {lastSaved.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  {isDirty && <span className="text-amber-500 ml-1">(ada perubahan)</span>}
                </>
              ) : (
                <span className="text-gray-400">Belum ada perubahan</span>
              )}
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              leftIcon={<Save size={16} />}
              loading={isSaving}
              disabled={!judul.trim() || !selesaiDate}
              onClick={() => save(true)}
            >
              Simpan Perubahan
            </Button>

            {tugas?.bentuk === 'INTERACTIVE_WORKSHEET' ? (
              <Button
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                rightIcon={<ArrowRight size={15} />}
                onClick={() => router.push(`/dashboard/tugas/${tugasId}?tab=worksheet`)}
              >
                Buka Builder Worksheet
              </Button>
            ) : (
              <Button variant="secondary" className="w-full"
                onClick={() => router.push(`/dashboard/tugas/${tugasId}`)}>
                Batal & Kembali
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
          {tugas.mataPelajaranId && tugas.semesterId && (
            <SalinKelasLainPanel
              tugasId={tugasId}
              srcMataPelajaranId={tugas.mataPelajaranId}
              semesterId={tugas.semesterId ?? ''}
              guruId={user?.id ?? ''}
              judulTugas={tugas.judul || undefined}
              tanggalMulai={toISO(mulaiDate, mulaiTime) || undefined}
              tanggalSelesai={toISO(selesaiDate, selesaiTime) || undefined}
            />
          )}


          {/* Jadwal */}
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

          {/* Penilaian */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
            <SectionTitle>Penilaian</SectionTitle>
            <div>
              <Label>Bobot Nilai Maksimal</Label>
              <input type="number" min="0" max="100" value={bobot}
                onChange={(e) => setField(setBobot)(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
              {isRemedial && (
                <p className="text-[10px] text-amber-600 mt-1">Remedial: disarankan disamakan dengan nilai KKM.</p>
              )}
            </div>
          </div>

          {/* Pengaturan Pengumpulan */}
          {showFileSettings && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">
              <SectionTitle>Pengaturan Pengumpulan</SectionTitle>
              <div>
                <Label>Ekstensi File yang Diizinkan</Label>
                <input type="text" value={allowedFileTypes}
                  onChange={(e) => setField(setAllowedFileTypes)(e.target.value)}
                  className="w-full h-9 px-3 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>
              <div>
                <Label>Maksimal Ukuran File (MB)</Label>
                <input type="number" min="1" max="50" value={maxFileSize}
                  onChange={(e) => setField(setMaxFileSize)(e.target.value)}
                  className="w-full h-9 px-3 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>
            </div>
          )}

          {/* Keterlambatan */}
          {!isUjian && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">
              <SectionTitle>Keterlambatan</SectionTitle>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={allowLate}
                  onChange={(e) => setField(setAllowLate)(e.target.checked)} className="mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Izinkan pengumpulan terlambat</span>
              </label>
              {allowLate && (
                <div className="pl-6 border-l-2 border-blue-100 dark:border-blue-900">
                  <Label>Penalti Keterlambatan (%)</Label>
                  <input type="number" min="0" max="100" value={latePenalty}
                    onChange={(e) => setField(setLatePenalty)(e.target.value)}
                    className="w-24 h-9 px-3 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function TugasEditPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-400">Memuat form edit tugas...</div>}>
      <TugasEditInner />
    </Suspense>
  )
}
