'use client'

import { use, useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter }                           from 'next/navigation'
import { useMateriDetail, useMateriList, useBulkCopyMateri } from '@/hooks/materi-pelajaran/useMateriPelajaran'
import { useAuth }                             from '@/hooks/useAuth'
import { Spinner }                             from '@/components/ui/Spinner'
import { MateriProgressTracker }               from '../_components/MateriProgressTracker'
import { MateriTipeBadge }                     from '../_components/MateriTipeBadge'
import { MateriStatusBadge }                   from '../_components/MateriStatusBadge'
import { getStatusMateri }                     from '@/types/materi-pelajaran.types'
import {
  ArrowLeft, BookOpen, Download, Archive, Copy, Check, X, Loader2,
  Pencil, Clock, Eye, FileText, ChevronRight, ClipboardList,
} from 'lucide-react'
import DiskusiPanel from '@/components/diskusi/DiskusiPanel'
import {
  useDiskusiMateri,
  useCreateDiskusiMateri,
  useDeleteDiskusiMateri,
  usePinDiskusiMateri,
  useCreateBalasanMateri,
  useDeleteBalasanMateri,
  useToggleDiskusiMateri,
} from '@/hooks/diskusi/useDiskusi'
import { Button }                              from '@/components/ui/Button'
import { Select }                              from '@/components/ui'
import { Skeleton }                            from '@/components/ui'
import dynamic                                 from 'next/dynamic'
import { getPresignedUrl }                     from '@/lib/api/upload.api'
import { useSearchParams }                     from 'next/navigation'
import { useTahunAjaranActive }                from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran }            from '@/hooks/semester/useSemester'
import { toast }                               from 'sonner'
import { cn }                                  from '@/lib/utils'
import { format }                              from 'date-fns'
import { id as localeId }                      from 'date-fns/locale'
import Link                                    from 'next/link'

const PdfSlideshowViewer = dynamic(
  () => import('@/components/ui/PdfSlideshowViewer').then(m => m.PdfSlideshowViewer),
  { ssr: false },
)

const ALL_TABS   = ['Deskripsi', 'Kompetensi Dasar', 'Tujuan Pembelajaran', 'Dokumen Pengajaran'] as const
const SISWA_TABS = ['Deskripsi', 'Kompetensi Dasar', 'Tujuan Pembelajaran']                     as const
type Tab = typeof ALL_TABS[number]

export default function DetailMateriPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  return <Suspense><DetailMateriContent params={paramsPromise} /></Suspense>
}
function DetailMateriContent({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params       = use(paramsPromise)
  const router       = useRouter()
  const { data: materi, isLoading, error } = useMateriDetail(params.id)
  const { user }     = useAuth()
  const [pdfUrl, setPdfUrl]       = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('Deskripsi')
  const searchParams  = useSearchParams()
  const isReadOnly    = searchParams.get('readOnly') === 'true'
  const isGuru        = user?.role === 'GURU' || user?.role === 'WALI_KELAS'
  const isSiswa       = user?.role === 'SISWA'

  // ── Copy state ───────────────────────────────────────────────
  const [copyOpen,      setCopyOpen]      = useState(false)
  const [copySemId,     setCopySemId]     = useState('')
  const [copyTargetIds, setCopyTargetIds] = useState<Set<string>>(new Set())
  const [copySuccess,   setCopySuccess]   = useState(false)

  const { data: taActiveRaw = [] } = useTahunAjaranActive()
  const activeTA = (taActiveRaw as { id: string; nama: string }[])[0] ?? null
  const { data: semRaw } = useSemesterByTahunAjaran(activeTA?.id ?? null)
  const activeSemList = useMemo(() =>
    ((semRaw as { id: string; nama: string; isActive?: boolean; urutan?: number }[] | undefined) ?? [])
      .filter(s => s.isActive).sort((a, b) => (b.urutan ?? 0) - (a.urutan ?? 0)),
    [semRaw])

  useEffect(() => {
    if (activeSemList.length === 1 && !copySemId) setCopySemId(activeSemList[0].id)
  }, [activeSemList, copySemId])

  const tingkatId = materi?.mataPelajaran?.mataPelajaranTingkatId
  const guruId    = materi?.guruId

  const { data: targetMapelRaw, isLoading: isLoadingTargets } = useMateriList(
    copySemId && tingkatId
      ? { semesterId: copySemId, mataPelajaranTingkatId: tingkatId, ...(guruId ? { guruId } : {}), limit: 100 }
      : undefined,
    { enabled: copyOpen && !!copySemId && !!tingkatId },
  )
  const targetMapels = useMemo(() =>
    (targetMapelRaw?.data ?? []).filter(m => m.id !== materi?.mataPelajaranId),
    [targetMapelRaw, materi?.mataPelajaranId])

  // ── Related materi ───────────────────────────────────────────
  const mataPelajaranId = materi?.mataPelajaranId
  const { data: relatedRaw } = useMateriList(
    mataPelajaranId ? { mataPelajaranId, limit: 50 } : undefined,
    { enabled: !!mataPelajaranId },
  )
  const relatedMateri = useMemo(() =>
    (relatedRaw?.data ?? []).sort((a, b) => (a.pertemuanKe ?? 0) - (b.pertemuanKe ?? 0)),
    [relatedRaw])

  const bulkCopy = useBulkCopyMateri()

  // ── Diskusi hooks — HARUS dipanggil sebelum early return ────────────────
  // Gunakan materi?.id ?? null agar aman saat masih loading
  const diskusiQuery      = useDiskusiMateri(materi?.id ?? null)
  const createDiskusi     = useCreateDiskusiMateri(materi?.id ?? null)
  const deleteDiskusiMut  = useDeleteDiskusiMateri(materi?.id ?? null)
  const pinDiskusiMut     = usePinDiskusiMateri(materi?.id ?? null)
  const createBalasan     = useCreateBalasanMateri(materi?.id ?? null)
  const deleteBalasanMut  = useDeleteBalasanMateri(materi?.id ?? null)
  const toggleDiskusiMut  = useToggleDiskusiMateri(materi?.id ?? null)
  const [deletingDiskusiId, setDeletingDiskusiId] = useState<string | null>(null)
  const [pinningDiskusiId,  setPinningDiskusiId]  = useState<string | null>(null)
  const [replyingDiskusiId, setReplyingDiskusiId] = useState<string | null>(null)
  const [deletingReplyId,   setDeletingReplyId]   = useState<string | null>(null)
  const [diskusiAktif,      setDiskusiAktif]       = useState<boolean | undefined>(undefined)

  const handleCopy = async () => {
    if (!materi || copyTargetIds.size === 0) return
    try {
      const res = await bulkCopy.mutateAsync({
        sourceMateriIds:        [materi.id],
        targetMataPelajaranIds: Array.from(copyTargetIds),
      })
      toast.success(`${(res as any).totalCopied ?? copyTargetIds.size} materi berhasil disalin`)
      setCopySuccess(true); setCopyOpen(false); setCopyTargetIds(new Set())
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyalin materi')
    }
  }

  const toggleTarget = (id: string) =>
    setCopyTargetIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  // ── PDF presign ──────────────────────────────────────────────
  const fileUrls  = materi?.fileUrls as any
  const firstFile = Array.isArray(fileUrls) ? fileUrls[0] : null
  useEffect(() => {
    if (materi?.tipeMateri === 'PDF' && firstFile)
      getPresignedUrl(firstFile, 3600).then(setPdfUrl).catch(() => setPdfUrl(null))
  }, [materi?.tipeMateri, firstFile])

  if (isLoading) return <div className="flex items-center justify-center py-24"><Spinner /></div>
  if (error || !materi) return <div className="py-24 text-center text-sm text-red-500">Materi tidak ditemukan.</div>

  const tugasCount  = materi._count?.tugas ?? materi.tugas?.length ?? 0
  const durasiMenit = materi.minScreenTime ? Math.ceil(materi.minScreenTime / 60) : null
  const namaMapel   = materi.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama
  const namaKelas   = materi.mataPelajaran?.kelas?.namaKelas ?? materi.kelas?.namaKelas
  const status      = getStatusMateri(materi)

  // sync diskusiAktif from server once loaded
  const diskusiAktifValue = diskusiAktif ?? (materi as any).isDiskusiAktif ?? true

  return (
    <div className="pb-24">

      {/* ── Back button (di luar card, konsisten circle) ── */}
      <div className="mb-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <span className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center shrink-0 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </span>
          Kembali
        </button>
      </div>

      {/* ── Title card ── */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900 px-6 py-5 mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {/* Breadcrumb */}
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
            <span>Materi Pelajaran</span>
            <ChevronRight className="w-3 h-3" />
            {namaMapel && <span>{namaMapel}</span>}
            {namaKelas && <><ChevronRight className="w-3 h-3" /><span>{namaKelas}</span></>}
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white leading-snug">
            {materi.judul}
          </h1>
          {/* Meta chips */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <MateriTipeBadge tipe={materi.tipeMateri} />
            <MateriStatusBadge status={status} />
            {materi.pertemuanKe && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Pertemuan ke-{materi.pertemuanKe}
              </span>
            )}
            {durasiMenit && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {durasiMenit} mnt baca
              </span>
            )}
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> {materi.viewCount}× dilihat
            </span>
          </div>
        </div>

        {isGuru && (
          <Link
            href={`/dashboard/materi-pelajaran/${materi.id}/edit`}
            className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
          >
            <Pencil className="w-4 h-4" /> Edit
          </Link>
        )}
      </div>

      {/* ── Arsip banner ── */}
      {isReadOnly && (
        <div className="mb-4 flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-800/50">
          <Archive className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="flex-1 text-sm text-amber-700 dark:text-amber-400">
            <span className="font-semibold">Tampilan Arsip</span>
            {materi.mataPelajaran?.semester?.tahunAjaran?.nama ? ` · ${materi.mataPelajaran.semester.tahunAjaran.nama}` : ''}
            {materi.mataPelajaran?.semester?.nama ? ` Sem. ${materi.mataPelajaran.semester.nama}` : ''}
          </p>
          {!isSiswa && (copySuccess ? (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Tersalin
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setCopyOpen(v => !v)}
              className={cn(
                'inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold border transition-colors',
                copyOpen
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30',
              )}
            >
              <Copy className="w-3 h-3" /> Salin ke Semester Aktif
            </button>
          ))}
        </div>
      )}

      {/* ── Inline copy panel ── */}
      {isReadOnly && copyOpen && !isSiswa && (
        <div className="mb-4 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-900/10 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Copy className="w-4 h-4" /> Salin ke Semester Aktif
            </p>
            <button type="button" onClick={() => { setCopyOpen(false); setCopyTargetIds(new Set()) }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Tahun Ajaran', content: activeTA?.nama ?? 'Memuat...' },
            ].map(({ label, content }) => (
              <div key={label} className="space-y-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
                <div className="h-9 px-3 flex items-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400">
                  {content}
                  <span className="ml-auto text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded font-semibold">Aktif</span>
                </div>
              </div>
            ))}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Semester</p>
              {activeSemList.length <= 1 ? (
                <div className="h-9 px-3 flex items-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400">
                  {activeSemList[0]?.nama ?? 'Memuat...'}
                  <span className="ml-auto text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded font-semibold">Aktif</span>
                </div>
              ) : (
                <Select options={[{ label: 'Pilih Semester', value: '' }, ...activeSemList.map(s => ({ label: s.nama + ' (Aktif)', value: s.id }))]} value={copySemId} onChange={e => { setCopySemId(e.target.value); setCopyTargetIds(new Set()) }} />
              )}
            </div>
          </div>
          {copySemId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Kelas Tujuan</p>
                {targetMapels.length > 0 && (
                  <button type="button" className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                    onClick={() => copyTargetIds.size === targetMapels.length ? setCopyTargetIds(new Set()) : setCopyTargetIds(new Set(targetMapels.map(m => m.id)))}>
                    {copyTargetIds.size === targetMapels.length ? 'Batal Semua' : 'Pilih Semua'}
                  </button>
                )}
              </div>
              {isLoadingTargets ? (
                <div className="grid grid-cols-2 gap-2">{[0,1].map(i => <Skeleton key={i} className="h-11 rounded-md" />)}</div>
              ) : targetMapels.length === 0 ? (
                <p className="py-5 text-center text-xs text-gray-400 italic border border-dashed border-gray-200 dark:border-gray-700 rounded-md">Tidak ada kelas lain di semester ini</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {targetMapels.map(m => {
                    const sel = copyTargetIds.has(m.id)
                    return (
                      <label key={m.id} className={cn('flex items-center gap-2.5 px-3 py-2.5 rounded-md border cursor-pointer transition-all', sel ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300')}>
                        <input type="checkbox" checked={sel} onChange={() => toggleTarget(m.id)} className="w-4 h-4 accent-emerald-600 rounded" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{m.kelas?.namaKelas ?? '—'}</p>
                          <p className="text-xs text-gray-400 truncate">{m.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama ?? '—'}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">{copyTargetIds.size > 0 ? `${copyTargetIds.size} kelas dipilih` : 'Belum ada dipilih'}</p>
            <Button leftIcon={bulkCopy.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />} loading={bulkCopy.isPending} disabled={copyTargetIds.size === 0} onClick={handleCopy}>
              Salin
            </Button>
          </div>
        </div>
      )}

      {/* ── 2-col layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left ── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Content viewer */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700/60 overflow-hidden bg-white dark:bg-gray-900">
            {materi.tipeMateri === 'PDF' && firstFile && (
              <div className="max-h-[520px] overflow-hidden">
                {pdfUrl ? <PdfSlideshowViewer url={pdfUrl} /> : <div className="flex items-center justify-center h-52"><Spinner /></div>}
              </div>
            )}
            {materi.tipeMateri === 'VIDEO_YOUTUBE' && firstFile && (
              <div className="aspect-video">
                <iframe src={`https://www.youtube.com/embed/${extractYoutubeId(firstFile)}`} className="w-full h-full" allowFullScreen />
              </div>
            )}
            {materi.tipeMateri === 'TEXT' && (
              <div className="max-h-[520px] overflow-y-auto px-7 py-6 prose dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: materi.konten || '' }} />
              </div>
            )}
            {materi.tipeMateri === 'HYBRID' && (
              <div className="max-h-[520px] overflow-y-auto px-7 py-6 space-y-6">
                {materi.konten && (
                  <div className="prose dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: materi.konten }} />
                  </div>
                )}
                {fileUrls && typeof fileUrls === 'object' && !Array.isArray(fileUrls) && (
                  <div className="pt-5 border-t border-gray-100 dark:border-gray-800 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lampiran</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(fileUrls).map(([label, key]) => (
                        <div key={label as string} className="flex items-center justify-between p-2.5 rounded-md border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
                          <Button variant="ghost" size="sm" onClick={() => window.open(`/api/files/${key}`, '_blank')}>
                            <Download size={12} className="mr-1" /> Unduh
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {isSiswa && (
            <MateriProgressTracker
              materiId={materi.id}
              siswaId={user?.id ?? ''}
              readOnly={isReadOnly}
              staticProgress={(materi as any).progressSiswa?.[0]}
              minScreenTime={materi.minScreenTime}
            />
          )}

          {/* Tugas terkait */}
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/tugas?materiId=${materi.id}`}
              className={cn(
                'inline-flex items-center gap-2 h-9 px-4 rounded-md text-sm font-medium border transition-colors',
                tugasCount > 0
                  ? 'border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 text-gray-400 pointer-events-none',
              )}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Tugas Terkait
              {tugasCount > 0 && (
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded bg-blue-600 text-white text-[9px] font-bold">
                  {tugasCount}
                </span>
              )}
            </Link>
          </div>

          {/* Diskusi */}
          {!isReadOnly && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-6 grid grid-cols-1">
              <DiskusiPanel
                items={diskusiQuery.data ?? []}
                loading={diskusiQuery.isLoading}
                isDiskusiAktif={diskusiAktifValue}
                onToggleAktif={isGuru ? () => toggleDiskusiMut.mutateAsync().then(r => setDiskusiAktif((r as any).isDiskusiAktif)) : undefined}
                onCreate={p => createDiskusi.mutateAsync(p)}
                onDelete={id => {
                  setDeletingDiskusiId(id)
                  return deleteDiskusiMut.mutateAsync(id).finally(() => setDeletingDiskusiId(null))
                }}
                onPin={id => {
                  setPinningDiskusiId(id)
                  return pinDiskusiMut.mutateAsync(id).finally(() => setPinningDiskusiId(null))
                }}
                onReply={(diskusiId, isi) => {
                  setReplyingDiskusiId(diskusiId)
                  return createBalasan.mutateAsync({ diskusiId, payload: { isi } }).finally(() => setReplyingDiskusiId(null))
                }}
                onDeleteReply={id => {
                  setDeletingReplyId(id)
                  return deleteBalasanMut.mutateAsync(id).finally(() => setDeletingReplyId(null))
                }}
                creatingDiskusi={createDiskusi.isPending}
                deletingId={deletingDiskusiId}
                pinningId={pinningDiskusiId}
                replyingId={replyingDiskusiId}
                deletingReplyId={deletingReplyId}
                contextLabel="materi"
              />
            </div>
          )}

          {/* Tabs */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700/60 overflow-x-auto overflow-y-hidden">
              {(isSiswa ? SISWA_TABS : ALL_TABS).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                    activeTab === tab
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="px-6 py-5 min-h-[100px]">
              {activeTab === 'Deskripsi' && (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {materi.deskripsi || <em className="text-gray-400">Tidak ada deskripsi.</em>}
                </p>
              )}
              {activeTab === 'Kompetensi Dasar' && (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {materi.kompetensiDasar || <em className="text-gray-400">Belum diisi.</em>}
                </p>
              )}
              {activeTab === 'Tujuan Pembelajaran' && (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {materi.tujuanPembelajaran || <em className="text-gray-400">Belum diisi.</em>}
                </p>
              )}
              {activeTab === 'Dokumen Pengajaran' && (
                <div className="space-y-1.5">
                  {!materi.dokumenPengajarans?.length ? (
                    <p className="text-sm italic text-gray-400">Tidak ada dokumen terlampir.</p>
                  ) : materi.dokumenPengajarans.map(dok => (
                    <a key={dok.id} href={dok.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-800/50 transition-colors group">
                      <FileText className="w-4 h-4 text-gray-400 group-hover:text-blue-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{dok.judul}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mt-0.5">{dok.jenisDokumen}</p>
                      </div>
                      <Download className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Related materi ── */}
        <div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900 overflow-hidden sticky top-4">
            <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Daftar Materi</p>
              {namaMapel && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{namaMapel}{namaKelas ? ` · ${namaKelas}` : ''}</p>
              )}
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[calc(100vh-12rem)] overflow-y-auto">
              {relatedMateri.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-xs text-gray-400">Belum ada materi lain</p>
                </div>
              ) : relatedMateri.map(item => {
                const isCurrent = item.id === params.id
                const pubDate   = item.tanggalPublikasi ? format(new Date(item.tanggalPublikasi), 'd MMM yyyy', { locale: localeId }) : null
                const dur       = item.minScreenTime ? Math.ceil(item.minScreenTime / 60) : null

                if (isCurrent) return (
                  <div key={item.id} className="relative px-4 py-3.5 bg-emerald-50/70 dark:bg-emerald-900/15">
                    <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500 rounded-r" />
                    {item.pertemuanKe && <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest mb-0.5">Pertemuan {item.pertemuanKe}</p>}
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 leading-snug line-clamp-2">{item.judul}</p>
                    <div className="flex items-center gap-2.5 mt-1.5 text-[11px] text-emerald-500/60">
                      {pubDate && <span>{pubDate}</span>}
                      {dur && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{dur} mnt</span>}
                      <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{item.viewCount}×</span>
                    </div>
                  </div>
                )

                return (
                  <Link key={item.id} href={`/dashboard/materi-pelajaran/${item.id}`}
                    className="block px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                    {item.pertemuanKe && <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-0.5">Pertemuan {item.pertemuanKe}</p>}
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.judul}</p>
                    <div className="flex items-center gap-2.5 mt-1.5 text-[11px] text-gray-400">
                      {pubDate && <span>{pubDate}</span>}
                      {dur && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{dur} mnt</span>}
                      <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{item.viewCount}×</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function extractYoutubeId(url: string) {
  const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)
  return m && m[2].length === 11 ? m[2] : url
}
