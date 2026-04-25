'use client'

import { useState }        from 'react'
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
import type { StudentNavItem } from './_components/GradingModal'
import {
  ArrowLeft, Edit, Clock, FileText, Download,
  AlertCircle, Calendar, Settings, Award, CheckCircle2, Users,
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
  const [activeTab,         setActiveTab]         = useState<'ringkasan' | 'pengumpulan'>('ringkasan')
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
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center',
            status === StatusPengumpulan.DINILAI   ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
            status === StatusPengumpulan.REVISI    ? 'bg-amber-50  dark:bg-amber-900/20  text-amber-600'  :
            status === StatusPengumpulan.SUBMITTED ? 'bg-blue-50   dark:bg-blue-900/20   text-blue-600'   :
                                                     'bg-gray-50   dark:bg-gray-800      text-gray-400',
          )}>
            {cfg.icon}
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Status Kamu</p>
            <p className={cn('text-sm font-medium', cfg.color)}>{cfg.label}</p>
          </div>
        </div>
      )
    }
    return (
      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
          <Users size={20} />
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase font-semibold">Pengumpulan</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {isLoadingRekap ? '...' : `${totalSubmitted} / ${totalSiswa} (${submissionRate}%)`}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => router.push('/dashboard/tugas')}
            className="w-10 h-10 !p-0 flex items-center justify-center rounded-lg shrink-0"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {!isSiswa && (
                <Badge variant={tugas.isPublished ? 'success' : 'warning'} className="text-[10px] px-2 py-0.5">
                  {tugas.isPublished ? 'Dipublikasikan' : 'Draft'}
                </Badge>
              )}
              <Badge variant="default" className="text-[10px] px-2 py-0.5 bg-gray-50 dark:bg-gray-800">
                {tugas.tujuan.replace(/_/g, ' ')}
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {tugas.judul}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {tugas.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama ?? 'Mapel'} • Kelas {tugas.kelas?.namaKelas ?? tugas.kelasId}
            </p>
          </div>
        </div>

        {isGuruOrAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant={tugas.isPublished ? 'secondary' : 'primary'}
              size="sm"
              loading={publishMutation.isPending}
              onClick={handlePublish}
            >
              {tugas.isPublished ? 'Batalkan Publikasi' : 'Publikasikan'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit size={14} />}
              onClick={() => router.push(`/dashboard/tugas/${tugas.id}/edit`)}
            >
              Edit Tugas
            </Button>
          </div>
        )}
      </div>

      {/* ── Info Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Tenggat */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Tenggat Waktu</p>
            <p className={cn('text-sm font-medium', isDeadlinePast ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100')}>
              {formatDateTime(tugas.tanggalSelesai)}
            </p>
          </div>
        </div>

        {/* Card 2: Bobot */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Bobot Maksimal</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{tugas.bobot} Poin</p>
          </div>
        </div>

        {/* Card 3: Format */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
            <Settings size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Format Kumpul</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
              {tugas.bentuk.replace(/_/g, ' ').toLowerCase()}
            </p>
          </div>
        </div>

        {/* Card 4: beda untuk guru vs siswa */}
        <FourthCard />
      </div>

      {/* ── Tabs — hanya tampil untuk guru/admin ── */}
      {isGuruOrAdmin && (
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('ringkasan')}
            className={cn(
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
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
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'pengumpulan'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            )}
          >
            Pengumpulan Siswa ({isLoadingRekap ? '…' : totalSubmitted})
          </button>
        </div>
      )}

      {/* ── Tab Ringkasan — guru/admin + siswa langsung tanpa tab ── */}
      {(activeTab === 'ringkasan' || isSiswa) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Mobile: submit panel di atas konten */}
          {isSiswa && (
            <div className="lg:hidden order-first">
              <SiswaSubmitPanel tugas={tugas} tugasId={tugasId} />
            </div>
          )}

          {/* Kolom kiri: instruksi + lampiran */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Instruksi Tugas</h2>

              {tugas.deskripsi && (
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed border-l-4 border-blue-500 pl-4 bg-blue-50/50 dark:bg-blue-900/10 py-2">
                  {tugas.deskripsi}
                </p>
              )}

              <div
                className="prose dark:prose-invert max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: tugas.instruksi || '<p class="text-gray-400 italic">Tidak ada instruksi tertulis.</p>' }}
              />
            </div>

            {tugas.fileUrls && tugas.fileUrls.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
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

          {/* Kolom kanan */}
          <div className="space-y-6">
            {/* Desktop: submit panel */}
            {isSiswa && (
              <div className="hidden lg:block">
                <SiswaSubmitPanel tugas={tugas} tugasId={tugasId} />
              </div>
            )}

            {/* Guru/admin: pengaturan + materi */}
            {!isSiswa && (
              <>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Pengaturan Pengumpulan</h3>
                  <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800/50">
                      <span>Mulai Dibuka</span>
                      <span className="font-medium">{formatDateTime(tugas.tanggalMulai)}</span>
                    </li>
                    <li className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800/50">
                      <span>Terlambat Diizinkan?</span>
                      <span className="font-medium">
                        {tugas.allowLateSubmission
                          ? <Badge variant="success" className="text-[10px]">Ya (-{tugas.lateSubmissionPenalty}% Poin)</Badge>
                          : <Badge variant="danger" className="text-[10px]">Tidak</Badge>}
                      </span>
                    </li>
                    {tugas.maxFileSize && (
                      <li className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800/50">
                        <span>Maks Ukuran File</span>
                        <span className="font-medium">{(tugas.maxFileSize / (1024 * 1024)).toFixed(0)} MB</span>
                      </li>
                    )}
                    {tugas.allowedFileTypes && tugas.allowedFileTypes.length > 0 && (
                      <li className="flex justify-between items-center py-2">
                        <span>Format File</span>
                        <span className="font-medium text-xs">{tugas.allowedFileTypes.join(', ')}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </>
            )}

            {/* Materi terkait — tampil untuk semua role */}
            {tugas.materiPelajarans && tugas.materiPelajarans.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 p-5">
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
        </div>
      )}

      {/* ── Tab Pengumpulan (Guru/Admin) ── */}
      {activeTab === 'pengumpulan' && isGuruOrAdmin && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          {isLoadingRekap ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Siswa</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Nilai</th>
                    <th className="px-6 py-4 font-medium">Waktu Submit</th>
                    <th className="px-6 py-4 font-medium">Terlambat</th>
                    <th className="px-6 py-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {rekapList.map((siswa) => (
                    <tr key={siswa.siswaId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                            {siswa.nomorAbsen ?? '-'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{siswa.namaLengkap}</p>
                            <p className="text-xs text-gray-400">NISN: {siswa.nisn ?? '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {siswa.statusSubmit === StatusPengumpulan.DINILAI ? (
                          <Badge variant="success">Dinilai</Badge>
                        ) : siswa.statusSubmit === StatusPengumpulan.REVISI ? (
                          <Badge variant="warning">Revisi</Badge>
                        ) : siswa.sudahSubmit ? (
                          <Badge variant="info">Sudah Kumpul</Badge>
                        ) : (
                          <Badge variant="danger">Belum Kumpul</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium">
                        {siswa.nilai != null ? `${siswa.nilai} / ${tugas.bobot}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {siswa.tanggalSubmit
                          ? format(new Date(siswa.tanggalSubmit), 'dd/MM/yyyy HH:mm')
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {siswa.isLate ? (
                          <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
                            <AlertCircle size={14} /> Ya
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenGrading(siswa)}
                        >
                          {siswa.statusSubmit === StatusPengumpulan.DINILAI
                            ? 'Lihat Nilai'
                            : siswa.sudahSubmit
                              ? 'Beri Nilai'
                              : 'Nilai Manual'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {rekapList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
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

      {/* ── Diskusi ── */}
      {tugas && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
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
