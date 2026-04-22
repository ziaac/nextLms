'use client'

import { useState, useMemo, useEffect } from 'react'
import { toast }                        from 'sonner'
import { Modal, Button, Spinner }       from '@/components/ui'
import { CheckCircle, XCircle, ExternalLink, Trash2, RotateCcw, Send, LogIn } from 'lucide-react'
import { useApprovalPerizinan, useHapusPerizinan, useRevisiPerizinan, useAkhiriPerizinan } from '@/hooks/perizinan/usePerizinan'
import { BuktiFotoUpload }              from '@/components/ui/BuktiFotoUpload'
import { PerizinanStatusBadge, PerizinanJenisBadge } from './PerizinanStatusBadge'

import { FilePreview }                  from '@/components/ui/FilePreview'
import type { PerizinanItem }           from '@/types/perizinan.types'
import type { StatusPerizinan, JenisPerizinan } from '@/types/enums'

const JENIS_OPTIONS: { label: string; value: JenisPerizinan }[] = [
  { label: 'Sakit',              value: 'SAKIT' },
  { label: 'Izin',               value: 'IZIN'  },
  { label: 'Cuti',               value: 'CUTI'  },
  { label: 'Dinas',              value: 'DINAS' },
  { label: 'Keperluan Keluarga', value: 'KEPERLUAN_KELUARGA' },
]

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatTanggalShort(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

interface Props {
  open:       boolean
  onClose:    () => void
  item:       PerizinanItem | null
  canApprove: boolean
  canDelete:  boolean
  isSiswa:    boolean
}

export function PerizinanDetailModal({
  open, onClose, item, canApprove, canDelete, isSiswa,
}: Props) {
  const [catatan,       setCatatan]       = useState('')
  const [confirmHapus,  setConfirmHapus]  = useState(false)
  const [confirmAkhiri, setConfirmAkhiri] = useState(false)
  const [showEditForm,  setShowEditForm]  = useState(false)
  const [editAlasan,    setEditAlasan]    = useState('')
  const [editJenis,     setEditJenis]     = useState<JenisPerizinan | ''>('')
  const [editTglMulai,  setEditTglMulai]  = useState('')
  const [editTglAkhir,  setEditTglAkhir]  = useState('')
  const [editBukti,     setEditBukti]     = useState<string | null>(null)
  const [previewOpen,   setPreviewOpen]   = useState(false)

  const approvalMutation = useApprovalPerizinan()
  const hapusMutation    = useHapusPerizinan()
  const revisiMutation   = useRevisiPerizinan()
  const akhiriMutation   = useAkhiriPerizinan()

  // Hitung sisa hari izin — harus sebelum early return (Rules of Hooks)
  const isApprovedFlag = item?.status === 'APPROVED'
  const sisaHari = useMemo(() => {
    if (!isApprovedFlag || !item) return 0
    const hariIni = new Date()
    hariIni.setHours(0, 0, 0, 0)
    const selesai = new Date(item.tanggalSelesai)
    selesai.setHours(0, 0, 0, 0)
    return Math.round((selesai.getTime() - hariIni.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }, [isApprovedFlag, item?.tanggalSelesai])

  if (!item) return null

  const isPending           = item.status === 'PENDING'
  const isRevisionRequested = item.status === 'REVISION_REQUESTED'
  const isApproved          = item.status === 'APPROVED'
  const isFinal             = item.status === 'APPROVED' || item.status === 'REJECTED'
  const bisaAkhiri = isSiswa && isApproved && sisaHari > 1

  const handleApproval = async (status: StatusPerizinan) => {
    try {
      await approvalMutation.mutateAsync({
        id:      item.id,
        payload: { status, catatanApproval: catatan.trim() || undefined },
      })
      const msg = status === 'APPROVED'
        ? 'Perizinan disetujui — absensi otomatis diisi'
        : status === 'REVISION_REQUESTED'
        ? 'Permintaan revisi dikirim ke siswa'
        : 'Perizinan ditolak'
      toast.success(msg)
      setCatatan('')
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Gagal memproses perizinan'
      toast.error(msg)
    }
  }

  const handleHapus = async () => {
    try {
      await hapusMutation.mutateAsync(item.id)
      toast.success('Perizinan berhasil dibatalkan')
      onClose()
    } catch {
      toast.error('Gagal membatalkan perizinan')
    }
  }

  const handleAkhiri = async () => {
    try {
      const result = await akhiriMutation.mutateAsync(item.id)
      toast.success(result.message)
      setConfirmAkhiri(false)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Gagal mengakhiri perizinan'
      toast.error(msg)
    }
  }

  const handleResubmit = async () => {
    if (!editAlasan.trim()) { toast.error('Alasan wajib diisi'); return }
    try {
      await revisiMutation.mutateAsync({
        id: item.id,
        payload: {
          alasan:         editAlasan.trim() || undefined,
          jenis:          editJenis || undefined,
          tanggalMulai:   editTglMulai || undefined,
          tanggalSelesai: editTglAkhir || undefined,
          fileBuktiUrl:   editBukti ?? undefined,        },
      })
      toast.success('Perizinan diperbarui — menunggu persetujuan ulang')
      setShowEditForm(false)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Gagal memperbarui perizinan'
      toast.error(msg)
    }
  }

  const openEditForm = () => {
    setEditAlasan(item.alasan)
    setEditJenis(item.jenis)
    setEditTglMulai(item.tanggalMulai.slice(0, 10))
    setEditTglAkhir(item.tanggalSelesai.slice(0, 10))
    setEditBukti(item.fileBuktiUrl ?? null)
    setShowEditForm(true)
  }

  const footer = (
    <div className="flex items-center justify-between w-full flex-wrap gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Batalkan — hanya PENDING atau REVISION_REQUESTED */}
        {canDelete && (isPending || isRevisionRequested) && (
          confirmHapus ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-500">Yakin batalkan?</span>
              <Button variant="danger" size="sm" onClick={handleHapus} disabled={hapusMutation.isPending}>
                {hapusMutation.isPending ? <Spinner /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                Ya
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirmHapus(false)}>Tidak</Button>
            </div>
          ) : (
            <Button variant="danger" size="sm" onClick={() => setConfirmHapus(true)}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />Batalkan Izin
            </Button>
          )
        )}

        {/* Akhiri Lebih Awal — hanya APPROVED dan sisa > 1 hari */}
        {bisaAkhiri && (
          confirmAkhiri ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-600">
                Izin berakhir hari ini. Absensi besok–{formatTanggalShort(item.tanggalSelesai)} dihapus.
              </span>
              <Button
                variant="warning" size="sm"
                onClick={handleAkhiri}
                disabled={akhiriMutation.isPending}
              >
                {akhiriMutation.isPending ? <Spinner /> : <LogIn className="h-3.5 w-3.5 mr-1" />}
                Ya, Masuk Besok
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirmAkhiri(false)}>Batal</Button>
            </div>
          ) : (
            <Button variant="warning" size="sm" onClick={() => setConfirmAkhiri(true)}>
              <LogIn className="h-3.5 w-3.5 mr-1" />Masuk Mulai Besok
            </Button>
          )
        )}

        {/* Info jika sisa 1 hari — tidak bisa diakhiri */}
        {isSiswa && isApproved && sisaHari === 1 && (
          <p className="text-xs text-gray-400">
            Izin berakhir hari ini — hubungi guru jika hadir
          </p>
        )}
      </div>
      <Button variant="secondary" onClick={onClose}>Tutup</Button>
    </div>
  )

  return (
    <Modal
      open={open}
      onClose={() => {
        setConfirmHapus(false)
        setConfirmAkhiri(false)
        setShowEditForm(false)
        onClose()
      }}
      title="Detail Perizinan"
      size="md"
      footer={footer}
    >
      <div className="p-6 space-y-5">

        {/* Info siswa */}
        {!isSiswa && (
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3">
            <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
              {(item.user?.profile?.namaLengkap ?? '?')[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {item.user?.profile?.namaLengkap ?? '—'}
              </p>
              <p className="text-xs text-gray-400">NISN: {item.user?.profile?.nisn ?? '—'}</p>
            </div>
          </div>
        )}

        {/* Status & Jenis */}
        <div className="flex items-center gap-2 flex-wrap">
          <PerizinanStatusBadge status={item.status} />
          <PerizinanJenisBadge  jenis={item.jenis}  />
          {isApproved && sisaHari > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              Sisa {sisaHari} hari
            </span>
          )}
        </div>

        {/* Banner REVISION_REQUESTED untuk siswa */}
        {isRevisionRequested && isSiswa && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">
              Wali Kelas meminta informasi tambahan
            </p>
            {item.catatanApproval && (
              <p className="text-sm text-purple-600 dark:text-purple-400 italic">
                {'"'}{item.catatanApproval}{'"'}
              </p>
            )}
            {!showEditForm && (
              <Button variant="primary" size="sm" className="mt-2" onClick={openEditForm}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Perbarui & Kirim Ulang
              </Button>
            )}
          </div>
        )}

        {/* Tanggal */}
        <div className="space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Periode</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {formatTanggal(item.tanggalMulai)}
            {item.tanggalMulai !== item.tanggalSelesai
              ? ' → ' + formatTanggal(item.tanggalSelesai)
              : ''}
          </p>
        </div>

        {/* Alasan */}
        <div className="space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Alasan</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.alasan}</p>
        </div>

        {/* Bukti */}
        {item.fileBuktiUrl ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Bukti</p>
            <BuktiFotoThumb
              docKey={item.fileBuktiUrl}
              onPreview={() => setPreviewOpen(true)}
            />
            <FilePreview
              open={previewOpen}
              onClose={() => setPreviewOpen(false)}
              docKey={item.fileBuktiUrl}
              label="Bukti Perizinan"
            />
          </div>
        ) : null}

        {/* Info approval FINAL */}
        {isFinal && item.approver ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 space-y-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
              {item.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'} oleh
            </p>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {item.approver.profile?.namaLengkap ?? '—'}
            </p>
            {item.catatanApproval ? (
              <p className="text-xs text-gray-500 italic">
                {'"'}{item.catatanApproval}{'"'}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Form edit resubmit */}
        {showEditForm && isRevisionRequested && isSiswa && (
          <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-3 bg-purple-50/50 dark:bg-purple-900/10">
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
              Perbarui Data Perizinan
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Jenis</label>
              <select
                value={editJenis}
                onChange={(e) => setEditJenis(e.target.value as JenisPerizinan)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {JENIS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Tgl Mulai</label>
                <input type="date" value={editTglMulai}
                  onChange={(e) => setEditTglMulai(e.target.value)}
                  className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Tgl Selesai</label>
              <input type="date" value={editTglAkhir} min={editTglMulai}
                onChange={(e) => setEditTglAkhir(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Alasan <span className="text-red-500">*</span>
              </label>
              <textarea value={editAlasan} onChange={(e) => setEditAlasan(e.target.value)} rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>
            <BuktiFotoUpload
              value={editBukti}
              onChange={setEditBukti}
              label="Foto Bukti Tambahan"
            />

            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowEditForm(false)}>Batal</Button>
              <Button variant="primary" size="sm" className="flex-1"
                onClick={handleResubmit} disabled={revisiMutation.isPending}
              >
                {revisiMutation.isPending ? <Spinner /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                Kirim Ulang
              </Button>
            </div>
          </div>
        )}

        {/* Form approval */}
        {(isPending || isRevisionRequested) && canApprove && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Proses Perizinan
            </p>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={2}
              placeholder={isRevisionRequested ? 'Catatan (opsional)' : 'Catatan (opsional)...'}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            <div className="flex gap-2">
              <Button variant="primary" size="sm" className="flex-1"
                onClick={() => { void handleApproval('APPROVED') }}
                disabled={approvalMutation.isPending}
              >
                {approvalMutation.isPending ? <Spinner /> : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                Setujui
              </Button>
              {isPending && (
                <Button variant="warning" size="sm" className="flex-1"
                  onClick={() => { void handleApproval('REVISION_REQUESTED') }}
                  disabled={approvalMutation.isPending || !catatan.trim()}
                  title={!catatan.trim() ? 'Isi catatan untuk menjelaskan revisi' : undefined}
                >
                  {approvalMutation.isPending ? <Spinner /> : <RotateCcw className="h-3.5 w-3.5 mr-1.5" />}
                  Minta Revisi
                </Button>
              )}
              <Button variant="danger" size="sm" className="flex-1"
                onClick={() => { void handleApproval('REJECTED') }}
                disabled={approvalMutation.isPending}
              >
                {approvalMutation.isPending ? <Spinner /> : <XCircle className="h-3.5 w-3.5 mr-1.5" />}
                Tolak
              </Button>
            </div>
            {isPending && (
              <p className="text-[10px] text-gray-400 text-center">
                Tombol &ldquo;Minta Revisi&rdquo; aktif setelah catatan diisi
              </p>
            )}
          </div>
        )}

      </div>
    </Modal>
    
  )
}

// Tambahkan di akhir file sebelum EOF:

interface ThumbProps {
  docKey:    string
  onPreview: () => void
}

function BuktiFotoThumb({ docKey, onPreview }: ThumbProps) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)

  useEffect(() => {
    // Buat presigned URL untuk thumbnail
    import('@/lib/api/upload.api').then(({ getPresignedUrl }) => {
      getPresignedUrl(docKey)
        .then(setThumbUrl)
        .catch(() => {/* silent */})
    })
  }, [docKey])

  return (
    <button
      type="button"
      onClick={onPreview}
      className="relative h-20 w-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-emerald-400 transition-colors group"
    >
      {thumbUrl ? (
        <img
          src={thumbUrl}
          alt="Bukti"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <ExternalLink className="h-4 w-4 text-gray-400" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
        <ExternalLink className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  )
}

