'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore }    from '@/stores/auth.store'
import {
  useTugasDetail, useTugasRekap, usePublishTugas, useMySubmission,
} from '@/hooks/tugas/useTugas'
import DiskusiPanel from '@/components/diskusi/DiskusiPanel'
import {
  useDiskusiTugas,
  useCreateDiskusiTugas,
  useDeleteDiskusiTugas,
  usePinDiskusiTugas,
  useCreateBalasanTugas,
  useDeleteBalasanTugas,
  useToggleDiskusiTugas,
} from '@/hooks/diskusi/useDiskusi'
import { Button }          from '@/components/ui'
import { Badge }           from '@/components/ui/Badge'
import { Spinner }         from '@/components/ui/Spinner'
import { SiswaSubmitPanel } from './_components/SiswaSubmitPanel'
import { GradingModal }    from './_components/GradingModal'
import { BentukTugas }     from '@/types/tugas.types'
import { WorksheetPlayer } from '@/components/worksheet/WorksheetPlayer'
import { WorksheetBuilder } from '@/components/worksheet/WorksheetBuilder'
import { WorksheetGradingView } from '@/components/worksheet/WorksheetGradingView'
import type { StudentNavItem } from './_components/GradingModal'
import {
  ArrowLeft, ArrowRight, Edit, Clock, FileText, Download,
  AlertCircle, Calendar, Settings, Award, CheckCircle2, Users, LayoutTemplate,
  Eye, Star,
} from 'lucide-react'
import { format }          from 'date-fns'
import { id as localeId }  from 'date-fns/locale'
import { toast }           from 'sonner'
import { cn }              from '@/lib/utils'
import type { RekapPengumpulanItem } from '@/types/tugas.types'
import { StatusPengumpulan } from '@/types/tugas.types'

// ── Status badge siswa (untuk info card ke-4) ─────────────────────
const SISWA_STATUS_CFG = {
  none:                    { label: 'Belum Dikumpul',    color: 'text-gray-500',   icon: <Clock size={16} /> },
  [StatusPengumpulan.SUBMITTED]: { label: 'Menunggu Nilai',    color: 'text-blue-600',   icon: <Clock size={16} /> },
  [StatusPengumpulan.REVISI]:    { label: 'Perlu Revisi',      color: 'text-amber-600',  icon: <AlertCircle size={16} /> },
  [StatusPengumpulan.DINILAI]:   { label: 'Sudah Dinilai',     color: 'text-emerald-600',icon: <CheckCircle2 size={16} /> },
  [StatusPengumpulan.DRAFT]:     { label: 'Draft',             color: 'text-gray-400',   icon: <Clock size={16} /> },
} as const

export default function TugasDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuthStore()

  const tugasId = params.id as string

  // ── Role checks — dihitung sebelum hook agar bisa dipakai sebagai `enabled` ──
  const isGuruOrAdmin = ['SUPER_ADMIN', 'ADMIN', 'GURU', 'WALI_KELAS'].includes(user?.role ?? '')
  const isSiswa       = user?.role === 'SISWA'

  // ── Data fetching ─────────────────────────────────────────────────
  const { data: tugas, isLoading, isError }           = useTugasDetail(tugasId)
  const { data: rekapData, isLoading: isLoadingRekap } = useTugasRekap(tugasId, { enabled: isGuruOrAdmin })
  const { data: mySubmission }                         = useMySubmission(isSiswa ? tugasId : null)
  const publishMutation                                = usePublishTugas()

  // ── Modal state ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'pengumpulan' | 'worksheet'>('ringkasan')

  // Auto-select tab dari URL ?tab= (misal redirect dari halaman buat)
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab')
    if (tab === 'worksheet') setActiveTab('worksheet')
    else if (tab === 'pengumpulan') setActiveTab('pengumpulan')
  }, [])

  const [showGradingModal,  setShowGradingModal]  = useState(false)
  const [selectedPengumpulanId, setSelectedPengumpulanId] = useState<string | null>(null)
  const [selectedSiswaId,   setSelectedSiswaId]   = useState<string | null>(null)
  const [selectedNamaSiswa, setSelectedNamaSiswa] = useState<string>('')

  // ── Diskusi hooks — must be before early returns ──────────────────
  const diskusiQuery     = useDiskusiTugas(tugas?.id ?? null)
  const createDiskusi    = useCreateDiskusiTugas(tugasId)
  const deleteDiskusiMut = useDeleteDiskusiTugas(tugasId)
  const pinDiskusiMut    = usePinDiskusiTugas(tugasId)
  const createBalasan    = useCreateBalasanTugas(tugasId)
  const deleteBalasanMut = useDeleteBalasanTugas(tugasId)
  const toggleDiskusiMut = useToggleDiskusiTugas(tugasId)
  const [deletingDiskusiId, setDeletingDiskusiId] = useState<string | null>(null)
  const [pinningDiskusiId,  setPinningDiskusiId]  = useState<string | null>(null)
  const [replyingDiskusiId, setReplyingDiskusiId] = useState<string | null>(null)
  const [deletingReplyId,   setDeletingReplyId]   = useState<string | null>(null)
  const [diskusiAktif,      setDiskusiAktif]       = useState<boolean | undefined>(undefined)

  // ── Loading / Error ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Spinner />
      </div>
    )
  }

  if (isError || !tugas) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-gray-500">Tugas tidak ditemukan atau Anda tidak memiliki akses.</p>
        <Button variant="secondary" onClick={() => router.push('/dashboard/tugas')}>Kembali ke Daftar Tugas</Button>
      </div>
    )
  }

  // ── Derived data ──────────────────────────────────────────────────
  const formatDateTime = (dateStr: string) =>
    format(new Date(dateStr), 'dd MMM yyyy, HH:mm', { locale: localeId })

  const isDeadlinePast = new Date() > new Date(tugas.tanggalSelesai)

  // Rekap (guru/admin) — typed
  const rekapList = (rekapData ?? []) as RekapPengumpulanItem[]
  const totalSiswa     = rekapList.length
  const totalSubmitted = rekapList.filter((r) => r.sudahSubmit).length
  const submissionRate = totalSiswa ? Math.round((totalSubmitted / totalSiswa) * 100) : 0

  // Semua siswa — termasuk belum submit — untuk navigasi di GradingModal
  const allStudentsNav: StudentNavItem[] = rekapList.map((r) => ({
    pengumpulanId: r.pengumpulanId,
    siswaId:       r.siswaId,
    namaLengkap:   r.namaLengkap,
  }))

  const handlePublish = async () => {
    try {
      await publishMutation.mutateAsync(tugasId)
      toast.success(`Tugas berhasil di-${tugas.isPublished ? 'draft' : 'publikasi'}`)
    } catch {
      toast.error('Gagal memperbarui status publikasi')
    }
  }

  const handleOpenGrading = (siswa: RekapPengumpulanItem) => {
    setSelectedPengumpulanId(siswa.pengumpulanId ?? null)
    setSelectedSiswaId(siswa.siswaId)
    setSelectedNamaSiswa(siswa.namaLengkap)
    setShowGradingModal(true)
  }

  // ── Info card ke-4: beda antara guru dan siswa ────────────────────
  const FourthCard = () => {
    if (isSiswa) {
      const status = mySubmission?.status ?? 'none'
      const cfg    = SISWA_STATUS_CFG[status as keyof typeof SISWA_STATUS_CFG] ?? SISWA_STATUS_CFG.none
      return (
        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center gap-2 sm:gap-3">
          <div className={cn('w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0',
            status === StatusPengumpulan.DINILAI   ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
            status === StatusPengumpulan.REVISI    ? 'bg-amber-50  dark:bg-amber-900/20  text-amber-600'  :
            status === StatusPengumpulan.SUBMITTED ? 'bg-blue-50   dark:bg-blue-900/20   text-blue-600'   :
                                                     'bg-gray-50   dark:bg-gray-800      text-gray-400',
          )}>
            {cfg.icon}
          </div>
          <div>
            <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-semibold">Status Kamu</p>
            <p className={cn('text-xs sm:text-sm font-medium', cfg.color)}>{cfg.label}</p>
          </div>
        </div>
      )
    }
    return (
      <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 shrink-0">
          <Users size={16} className="sm:hidden" />
          <Users size={20} className="hidden sm:block" />
        </div>
        <div>
          <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-semibold">Kumpul</p>
          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
            {isLoadingRekap ? '...' : `${totalSubmitted} / ${totalSiswa} (${submissionRate}%)`}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 min-w-0">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="secondary"
            onClick={() => router.push('/dashboard/tugas')}
            className="w-9 h-9 sm:w-10 sm:h-10 !p-0 flex items-center justify-center rounded-lg shrink-0"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {!isSiswa && (
                <Badge variant={tugas.isPublished ? 'success' : 'warning'} className="text-[10px] px-2 py-0.5 shrink-0">
                  {tugas.isPublished ? 'Dipublikasikan' : 'Draft'}
                </Badge>
              )}
              <Badge variant="default" className="text-[10px] px-2 py-0.5 bg-gray-50 dark:bg-gray-800 shrink-0">
                {tugas.tujuan.replace(/_/g, ' ')}
              </Badge>
            </div>
            <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white leading-tight break-words">
              {tugas.judul}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {tugas.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama ?? 'Mapel'} • Kelas {tugas.kelas?.namaKelas ?? tugas.kelasId}
            </p>
          </div>
        </div>

        {isGuruOrAdmin && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button
              variant={tugas.isPublished ? 'secondary' : 'primary'}
              size="sm"
              loading={publishMutation.isPending}
              onClick={handlePublish}
              className="text-xs sm:text-sm"
            >
              {tugas.isPublished ? 'Batalkan Publikasi' : 'Publikasikan'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit size={14} />}
              onClick={() => router.push(`/dashboard/tugas/${tugas.id}/edit`)}
              className="text-xs sm:text-sm"
            >
              Edit
            </Button>
          </div>
        )}
      </div>

      {/* ── Info Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Tenggat */}
        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 shrink-0">
            <Calendar size={16} className="sm:hidden" />
            <Calendar size={20} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-semibold">Tenggat</p>
            <p className={cn('text-xs sm:text-sm font-medium leading-tight', isDeadlinePast ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100')}>
              {format(new Date(tugas.tanggalSelesai), 'dd MMM yy')}
            </p>
            <p className={cn('text-[10px]', isDeadlinePast ? 'text-red-500' : 'text-gray-400')}>
              {format(new Date(tugas.tanggalSelesai), 'HH:mm')}
            </p>
          </div>
        </div>

        {/* Card 2: Bobot */}
        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 shrink-0">
            <Award size={16} className="sm:hidden" />
            <Award size={20} className="hidden sm:block" />
          </div>
          <div>
            <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-semibold">Bobot</p>
            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{tugas.bobot} Poin</p>
          </div>
        </div>

        {/* Card 3: Format */}
        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 shrink-0">
            <Settings size={16} className="sm:hidden" />
            <Settings size={20} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-semibold">Format</p>
            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 capitalize truncate">
              {tugas.bentuk.replace(/_/g, ' ').toLowerCase()}
            </p>
          </div>
        </div>

        {/* Card 4: beda untuk guru vs siswa */}
        <FourthCard />
      </div>

      {/* ── Tabs — hanya tampil untuk guru/admin ── */}
      {isGuruOrAdmin && (
        <div className="grid grid-cols-1">
          <div className="overflow-x-auto border-b border-gray-200 dark:border-gray-800 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex">
              <button
                onClick={() => setActiveTab('ringkasan')}
                className={cn(
                  'px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0',
                  activeTab === 'ringkasan'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
                )}
              >
                Ringkasan Tugas
              </button>
              <button
                onClick={() => setActiveTab('pengumpulan')}
                className={cn(
                  'px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0',
                  activeTab === 'pengumpulan'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
                )}
              >
                Pengumpulan ({isLoadingRekap ? '…' : totalSubmitted})
              </button>
              {tugas.bentuk === BentukTugas.INTERACTIVE_WORKSHEET && (
                <button
                  onClick={() => setActiveTab('worksheet')}
                  className={cn(
                    'px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0',
                    activeTab === 'worksheet'
                      ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
                  )}
                >
                  <LayoutTemplate size={14} /> Builder Worksheet
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Ringkasan — guru/admin + siswa langsung tanpa tab ── */}
      {(activeTab === 'ringkasan' || isSiswa) && (
        <>
        {/* WorksheetPlayer untuk siswa — full width di atas instruksi */}
        {isSiswa && tugas.bentuk === BentukTugas.INTERACTIVE_WORKSHEET && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm grid grid-cols-1">
            <WorksheetPlayer
                  tugasId={tugasId}
                  tujuanTugas={tugas.tujuan}
                  tanggalSelesai={tugas.tanggalSelesai}
                />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">

          {/* Mobile: submit panel di atas konten (non-worksheet) */}
          {isSiswa && tugas.bentuk !== BentukTugas.INTERACTIVE_WORKSHEET && (
            <div className="lg:hidden order-first">
              <SiswaSubmitPanel tugas={tugas} tugasId={tugasId} />
            </div>
          )}

          {/* Kolom kiri: instruksi + lampiran */}
          <div className={cn('space-y-6 min-w-0', isSiswa && tugas.bentuk === BentukTugas.INTERACTIVE_WORKSHEET ? 'lg:col-span-3' : 'lg:col-span-2')}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 grid grid-cols-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Instruksi Tugas</h2>

              {tugas.deskripsi && (
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed border-l-4 border-blue-500 pl-4 bg-blue-50/50 dark:bg-blue-900/10 py-2">
                  {tugas.deskripsi}
                </p>
              )}

              <div
                className="prose dark:prose-invert max-w-none text-sm break-words [overflow-wrap:anywhere]"
                dangerouslySetInnerHTML={{ __html: tugas.instruksi || '<p class="text-gray-400 italic">Tidak ada instruksi tertulis.</p>' }}
              />
            </div>

            {tugas.fileUrls && tugas.fileUrls.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 grid grid-cols-1">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-blue-500" />
                  Lampiran File
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tugas.fileUrls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center shrink-0">
                        <FileText size={14} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate flex-1">
                        {url.split('/').pop() || `Lampiran ${idx + 1}`}
                      </span>
                      <Download size={14} className="text-gray-400 group-hover:text-blue-500" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Kolom kanan — disembunyikan saat INTERACTIVE_WORKSHEET siswa (player sudah full-width di atas) */}
          {!(isSiswa && tugas.bentuk === BentukTugas.INTERACTIVE_WORKSHEET) && (
          <div className="space-y-6 min-w-0">
            {/* Desktop: submit panel (non-worksheet only) */}
            {isSiswa && (
              <div className="hidden lg:block">
                <SiswaSubmitPanel tugas={tugas} tugasId={tugasId} />
              </div>
            )}

            {/* Guru/admin: pengaturan + materi */}
            {!isSiswa && (
              <>
                {/* Shortcut ke builder worksheet */}
                {tugas.bentuk === BentukTugas.INTERACTIVE_WORKSHEET && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('worksheet')}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/10 hover:border-violet-400 dark:hover:border-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-colors group text-left min-w-0"
                  >
                    <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                      <LayoutTemplate size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-violet-800 dark:text-violet-300 truncate">Builder Worksheet</p>
                      <p className="text-xs text-violet-500 dark:text-violet-500 mt-0.5 truncate">Upload halaman & tambah widget interaktif</p>
                    </div>
                    <ArrowRight size={16} className="text-violet-400 group-hover:text-violet-600 shrink-0 transition-colors" />
                  </button>
                )}

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 grid grid-cols-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Pengaturan Pengumpulan</h3>
                  <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex justify-between items-center gap-2 py-2 border-b border-gray-50 dark:border-gray-800/50 min-w-0">
                      <span className="shrink-0">Mulai Dibuka</span>
                      <span className="font-medium text-right text-xs sm:text-sm break-words">{formatDateTime(tugas.tanggalMulai)}</span>
                    </li>
                    <li className="flex justify-between items-center gap-2 py-2 border-b border-gray-50 dark:border-gray-800/50 min-w-0">
                      <span className="shrink-0">Terlambat Diizinkan?</span>
                      <span className="font-medium shrink-0">
                        {tugas.allowLateSubmission
                          ? <Badge variant="success" className="text-[10px]">Ya (-{tugas.lateSubmissionPenalty}% Poin)</Badge>
                          : <Badge variant="danger" className="text-[10px]">Tidak</Badge>}
                      </span>
                    </li>
                    {tugas.maxFileSize && (
                      <li className="flex justify-between items-center gap-2 py-2 border-b border-gray-50 dark:border-gray-800/50 min-w-0">
                        <span className="shrink-0">Maks Ukuran File</span>
                        <span className="font-medium shrink-0">{(tugas.maxFileSize / (1024 * 1024)).toFixed(0)} MB</span>
                      </li>
                    )}
                    {tugas.allowedFileTypes && tugas.allowedFileTypes.length > 0 && (
                      <li className="flex justify-between items-center gap-2 py-2 min-w-0">
                        <span className="shrink-0">Format File</span>
                        <span className="font-medium text-xs text-right break-words">{tugas.allowedFileTypes.join(', ')}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </>
            )}

            {/* Materi terkait — tampil untuk semua role */}
            {tugas.materiPelajarans && tugas.materiPelajarans.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 p-5 grid grid-cols-1">
                <h3 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-3">
                  Materi Terkait
                </h3>
                <ul className="space-y-2">
                  {tugas.materiPelajarans.map((m: any) => (
                    <li key={m.id} className="text-sm text-blue-900 dark:text-blue-300 flex items-start gap-2">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span className="leading-snug">{m.judul}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          )}
        </div>
        </>
      )}

      {/* ── Tab Pengumpulan (Guru/Admin) ── */}
      {activeTab === 'pengumpulan' && isGuruOrAdmin && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm grid grid-cols-1">
          {isLoadingRekap ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            /* overflow-x-auto — horizontal scroll tabel di mobile */
            <div className="overflow-x-auto touch-pan-x">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[640px]">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 text-xs">
                  <tr>
                    <th className="px-3 sm:px-5 py-3 font-semibold">Siswa</th>
                    <th className="px-3 sm:px-5 py-3 font-semibold">Status</th>
                    <th className="px-3 sm:px-5 py-3 font-semibold">Nilai</th>
                    <th className="px-3 sm:px-5 py-3 font-semibold">Waktu Submit</th>
                    <th className="px-3 sm:px-5 py-3 font-semibold w-px">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {rekapList.map((siswa) => (
                    <tr key={siswa.siswaId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                      {/* Siswa */}
                      <td className="px-3 sm:px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[11px] font-bold text-gray-500 shrink-0">
                            {siswa.nomorAbsen ?? '-'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">{siswa.namaLengkap}</p>
                            <p className="text-[10px] text-gray-400">{siswa.nisn ?? '-'}</p>
                          </div>
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-3 sm:px-5 py-3">
                        {siswa.statusSubmit === StatusPengumpulan.DINILAI ? (
                          <Badge variant="success">Dinilai</Badge>
                        ) : siswa.statusSubmit === StatusPengumpulan.REVISI ? (
                          <Badge variant="warning">Revisi</Badge>
                        ) : siswa.sudahSubmit ? (
                          <Badge variant="info">Kumpul</Badge>
                        ) : (
                          <Badge variant="danger">Belum</Badge>
                        )}
                      </td>
                      {/* Nilai */}
                      <td className="px-3 sm:px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                        {siswa.nilai != null ? (
                          <span className="text-emerald-600 dark:text-emerald-400">{siswa.nilai}</span>
                        ) : '—'}
                      </td>
                      {/* Waktu Submit */}
                      <td className="px-3 sm:px-5 py-3 text-gray-500 text-xs">
                        {siswa.tanggalSubmit ? (
                          <span className={siswa.isLate ? 'text-amber-600' : ''}>
                            {format(new Date(siswa.tanggalSubmit), 'dd/MM/yy HH:mm')}
                            {siswa.isLate && <span className="ml-1 text-[10px]">⚠</span>}
                          </span>
                        ) : '—'}
                      </td>
                      {/* Aksi */}
                      <td className="px-3 sm:px-5 py-3 w-px">
                        <div className="flex items-center gap-1.5">
                          {/* Tombol Lihat Pekerjaan — hanya jika sudah submit */}
                          {siswa.sudahSubmit && (
                            <button
                              type="button"
                              onClick={() => handleOpenGrading(siswa)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
                              title="Lihat pekerjaan siswa"
                            >
                              <Eye size={11} />
                              {tugas.bentuk === BentukTugas.INTERACTIVE_WORKSHEET ? 'Lihat Worksheet' : 'Lihat Jawaban'}
                            </button>
                          )}
                          {/* Tombol aksi utama: Nilai / Nilai Manual / Sudah Dinilai */}
                          <button
                            type="button"
                            onClick={() => handleOpenGrading(siswa)}
                            className={cn(
                              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                              siswa.statusSubmit === StatusPengumpulan.DINILAI
                                ? 'border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                : siswa.sudahSubmit
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                                  : 'border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                            )}
                          >
                            {siswa.statusSubmit === StatusPengumpulan.DINILAI
                              ? <><Star size={11} /> Sudah Dinilai</>
                              : siswa.sudahSubmit
                                ? <><Award size={11} /> Beri Nilai</>
                                : <><Star size={11} /> Nilai Manual</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rekapList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">
                        Belum ada siswa di kelas ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Worksheet Builder (Guru/Admin + INTERACTIVE_WORKSHEET worksheet tab) ── */}
      {isGuruOrAdmin && tugas.bentuk === BentukTugas.INTERACTIVE_WORKSHEET && activeTab === 'worksheet' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm grid grid-cols-1">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 grid grid-cols-1">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
            <Settings size={16} className="text-blue-500 shrink-0" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Builder Worksheet Interaktif</h2>
            <span className="text-xs text-gray-400 hidden sm:inline">Upload halaman worksheet lalu tambahkan widget interaktif di atasnya</span>
            </div>
          </div>
          <div className="p-5" style={{ minHeight: '75vh' }}>
            <WorksheetBuilder tugasId={tugasId} />
          </div>
        </div>
      )}

      {/* ── Diskusi ── */}
      {tugas && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 grid grid-cols-1">
          <DiskusiPanel
            items={diskusiQuery.data ?? []}
            loading={diskusiQuery.isLoading}
            isDiskusiAktif={diskusiAktif ?? tugas.isDiskusiAktif ?? true}
            onToggleAktif={isGuruOrAdmin ? () => toggleDiskusiMut.mutateAsync().then(r => setDiskusiAktif((r as any).isDiskusiAktif)) : undefined}
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
            contextLabel="tugas"
          />
        </div>
      )}

      {/* ── Grading Modal ── */}
      <GradingModal
        open={showGradingModal}
        pengumpulanId={selectedPengumpulanId}
        siswaId={selectedPengumpulanId ? undefined : (selectedSiswaId ?? undefined)}
        namaSiswa={selectedNamaSiswa}
        tugas={tugas}
        students={allStudentsNav}
        onNavigate={(item) => {
          setSelectedPengumpulanId(item.pengumpulanId ?? null)
          setSelectedSiswaId(item.siswaId)
          setSelectedNamaSiswa(item.namaLengkap)
        }}
        onClose={() => {
          setShowGradingModal(false)
          setSelectedPengumpulanId(null)
          setSelectedSiswaId(null)
        }}
      />
    </div>
  )
}
