
'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useTugasDetail, useTugasRekap, usePublishTugas } from '@/hooks/tugas/useTugas'
import { Button, Modal } from '@/components/ui'
import { Badge } from '@/components/ui/Badge'
import { 
  ArrowLeft, Edit, Clock, FileText, Download, Users, 
  CheckCircle, XCircle, AlertCircle, Calendar, Eye, 
  Settings, Award
} from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function TugasDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuthStore()

  const tugasId = params.id as string

  // Fetch data
  const { data: tugas, isLoading, isError } = useTugasDetail(tugasId)
  const { data: rekapData, isLoading: isLoadingRekap } = useTugasRekap(tugasId)
  const publishMutation = usePublishTugas()

  // States
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'pengumpulan'>('ringkasan')
  const [showGradingModal, setShowGradingModal] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  const isGuruOrAdmin = ['SUPER_ADMIN', 'ADMIN', 'GURU', 'WALI_KELAS'].includes(user?.role ?? '')

  if (isLoading) {
    return <div className="flex justify-center p-12"><span className="text-gray-400">Memuat detail tugas...</span></div>
  }

  if (isError || !tugas) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-gray-500">Tugas tidak ditemukan atau Anda tidak memiliki akses.</p>
        <Button variant="secondary" onClick={() => router.push('/dashboard/tugas')}>Kembali ke Daftar Tugas</Button>
      </div>
    )
  }

  // Derived Data
  const formatDateTime = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMM yyyy, HH:mm', { locale: localeId })
  }

  const isLate = new Date() > new Date(tugas.tanggalSelesai)
  const totalSiswa = rekapData?.length ?? 0
  const totalSubmitted = rekapData?.filter((r: any) => r.sudahSubmit)?.length ?? 0
  const submissionRate = totalSiswa ? Math.round((totalSubmitted / totalSiswa) * 100) : 0

  const handlePublish = async () => {
    try {
      await publishMutation.mutateAsync(tugasId)
      toast.success(`Tugas berhasil di-${tugas.isPublished ? 'draft' : 'publikasi'}`)
    } catch {
      toast.error('Gagal memperbarui status publikasi')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* ── Header Top ── */}
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
              <Badge variant={tugas.isPublished ? 'success' : 'warning'} className="text-[10px] px-2 py-0.5">
                {tugas.isPublished ? 'Dipublikasikan' : 'Draft'}
              </Badge>
              <Badge variant="default" className="text-[10px] px-2 py-0.5 bg-gray-50 dark:bg-gray-800">
                {tugas.tujuan.replace('_', ' ')}
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
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Tenggat Waktu</p>
            <p className={cn("text-sm font-medium", isLate ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100")}>
              {formatDateTime(tugas.tanggalSelesai)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Bobot Maksimal</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{tugas.bobot} Poin</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
            <Settings size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Format Kumpul</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
              {tugas.bentuk.replace('_', ' ').toLowerCase()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Pengumpulan</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {totalSubmitted} / {totalSiswa} ({submissionRate}%)
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('ringkasan')}
          className={cn(
            "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'ringkasan' 
              ? "border-blue-600 text-blue-600 dark:text-blue-400" 
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          Ringkasan Tugas
        </button>
        {isGuruOrAdmin && (
          <button
            onClick={() => setActiveTab('pengumpulan')}
            className={cn(
              "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'pengumpulan' 
                ? "border-blue-600 text-blue-600 dark:text-blue-400" 
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            Pengumpulan Siswa ({totalSubmitted})
          </button>
        )}
      </div>

      {/* ── Tab Content: Ringkasan ── */}
      {activeTab === 'ringkasan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                dangerouslySetInnerHTML={{ __html: tugas.instruksi || '<p className="text-gray-400 italic">Tidak ada instruksi tertulis.</p>' }}
              />
            </div>

            {tugas.fileUrls && tugas.fileUrls.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-blue-500" />
                  Lampiran File
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tugas.fileUrls.map((url: string, idx: number) => (
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

          <div className="space-y-6">
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
                    {tugas.allowLateSubmission ? (
                      <Badge variant="success" className="text-[10px]">Ya (-{tugas.lateSubmissionPenalty}% Poin)</Badge>
                    ) : (
                      <Badge variant="danger" className="text-[10px]">Tidak</Badge>
                    )}
                  </span>
                </li>
                {tugas.maxFileSize && (
                  <li className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800/50">
                    <span>Maks Ukuran File</span>
                    <span className="font-medium">{tugas.maxFileSize / (1024 * 1024)} MB</span>
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

            {tugas.materiPelajarans && tugas.materiPelajarans.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 p-5">
                <h3 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-3">
                  Materi Terkait
                </h3>
                <ul className="space-y-2">
                  {tugas.materiPelajarans.map((m: any) => (
                    <li key={m.id} className="text-sm text-blue-900 dark:text-blue-300 flex items-start gap-2">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span className="leading-snug">{m.judul}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab Content: Pengumpulan (Guru/Admin) ── */}
      {activeTab === 'pengumpulan' && isGuruOrAdmin && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          {isLoadingRekap ? (
            <div className="p-12 text-center text-gray-500 text-sm">Memuat daftar siswa...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Siswa</th>
                    <th className="px-6 py-4 font-medium">Status Pengumpulan</th>
                    <th className="px-6 py-4 font-medium">Waktu Submit</th>
                    <th className="px-6 py-4 font-medium">Terlambat</th>
                    <th className="px-6 py-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {rekapData?.map((siswa: any) => (
                    <tr key={siswa.siswaId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                            {siswa.nomorAbsen || '-'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{siswa.namaLengkap}</p>
                            <p className="text-xs text-gray-400">NISN: {siswa.nisn || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {siswa.statusSubmit === 'DINILAI' ? (
                          <Badge variant="success">Dinilai</Badge>
                        ) : siswa.sudahSubmit ? (
                          <Badge variant="info">Sudah Kumpul</Badge>
                        ) : (
                          <Badge variant="danger">Belum Kumpul</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {siswa.tanggalSubmit ? format(new Date(siswa.tanggalSubmit), 'dd/MM/yyyy HH:mm') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {siswa.isLate ? (
                          <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
                            <AlertCircle size={14} /> Ya
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={!siswa.sudahSubmit}
                          onClick={() => {
                            setSelectedStudentId(siswa.siswaId)
                            setShowGradingModal(true)
                          }}
                        >
                          Beri Nilai
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {rekapData?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
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

      {/* ── Grading Modal (Placeholder for Next Iteration) ── */}
      {showGradingModal && (
        <Modal
          open={showGradingModal}
          onClose={() => setShowGradingModal(false)}
          title="Penilaian Tugas"
          size="xl"
        >
          <div className="p-6 text-center text-gray-500">
            <p>Fitur Split-View Penilaian akan diimplementasikan pada file komponen terpisah (GradingPanel) untuk menangani PDF Viewer / Rich Text Viewer jawaban siswa beserta kolom input nilai.</p>
            <div className="mt-6 flex justify-center">
              <Button onClick={() => setShowGradingModal(false)}>Tutup Sementara</Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}
