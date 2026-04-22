'use client'

import { useState } from 'react'
import { toast }    from 'sonner'
import { SlideOver, Button, Spinner, Modal } from '@/components/ui'
import { FilePreview }                from '@/components/ui/FilePreview'
import { CheckCircle, RotateCcw, Trash2, Eye, Pencil, AlertTriangle } from 'lucide-react'
import { useReviewDokumenPengajaran, useHapusDokumenPengajaran } from '@/hooks/dokumen-pengajaran/useDokumenPengajaran'
import { DokumenStatusBadge, DokumenJenisBadge } from './DokumenStatusBadge'
import type { DokumenPengajaranItem } from '@/types/dokumen-pengajaran.types'

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function getNamaMapel(item: DokumenPengajaranItem) {
  return item.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama ?? '—'
}

interface Props {
  open:       boolean
  onClose:    () => void
  item:       DokumenPengajaranItem | null
  canReview:  boolean
  canDelete:  boolean
  onEdit?:    () => void
}

export function DokumenPengajaranDetailModal({ open, onClose, item, canReview, canDelete, onEdit }: Props) {
  const [catatan,      setCatatan]      = useState('')
  const [confirmHapus, setConfirmHapus] = useState(false)
  const [previewOpen,  setPreviewOpen]  = useState(false)

  const reviewMutation = useReviewDokumenPengajaran()
  const hapusMutation  = useHapusDokumenPengajaran()

  const handleClose = () => {
    setConfirmHapus(false)
    setCatatan('')
    onClose()
  }

  if (!item) return null

  const isPending  = item.status === 'SUBMITTED'
  const isApproved = item.status === 'APPROVED'
  const isRevision = item.status === 'REVISION_REQUESTED'

  const handleReview = async (status: 'APPROVED' | 'REVISION_REQUESTED') => {
    if (status === 'REVISION_REQUESTED' && !catatan.trim()) {
      toast.error('Catatan wajib diisi saat meminta revisi')
      return
    }
    try {
      await reviewMutation.mutateAsync({
        id: item.id,
        payload: { status, catatanReviewer: catatan.trim() || undefined },
      })
      toast.success(status === 'APPROVED' ? 'Dokumen disetujui' : 'Permintaan revisi dikirim ke guru')
      setCatatan('')
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Gagal memproses dokumen'
      toast.error(msg)
    }
  }

  const handleHapus = async () => {
    try {
      await hapusMutation.mutateAsync(item.id)
      toast.success('Dokumen berhasil dihapus')
      setConfirmHapus(false)
      onClose()
    } catch {
      toast.error('Gagal menghapus dokumen')
    }
  }

  const namaKelas = item.mataPelajaran?.kelas?.namaKelas
  const description = [getNamaMapel(item), namaKelas].filter(Boolean).join(' · ')

  return (
    <>
      <SlideOver
        open={open}
        onClose={handleClose}
        title="Detail Dokumen Pengajaran"
        description={description || undefined}
        width="md"
      >
        <div className="space-y-5">

          {/* Guru info */}
          {item.guru?.profile && (
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3">
              <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                {item.guru.profile.namaLengkap[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {item.guru.profile.namaLengkap}
                </p>
                <p className="text-xs text-gray-400">Pengajar</p>
              </div>
            </div>
          )}

          {/* Status & Jenis */}
          <div className="flex items-center gap-2 flex-wrap">
            <DokumenStatusBadge status={item.status} />
            <DokumenJenisBadge  jenis={item.jenisDokumen} />
          </div>

          {/* Banner revision */}
          {isRevision && item.catatanReviewer && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">
                Reviewer meminta revisi
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400 italic">
                &ldquo;{item.catatanReviewer}&rdquo;
              </p>
            </div>
          )}

          {/* Judul */}
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Judul</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.judul}</p>
          </div>

          {/* Mata Pelajaran & Kelas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Mata Pelajaran</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{getNamaMapel(item)}</p>
            </div>
            {item.mataPelajaran?.kelas && (
              <div className="space-y-1">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Kelas</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {item.mataPelajaran.kelas.namaKelas}
                </p>
              </div>
            )}
          </div>

          {/* TA & Semester */}
          <div className="grid grid-cols-2 gap-4">
            {item.tahunAjaran && (
              <div className="space-y-1">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Tahun Ajaran</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{item.tahunAjaran.nama}</p>
              </div>
            )}
            {item.semester && (
              <div className="space-y-1">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Semester</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{item.semester.nama}</p>
              </div>
            )}
          </div>

          {/* Tanggal upload */}
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Diunggah</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{formatTanggal(item.createdAt)}</p>
          </div>

          {/* File dokumen */}
          {item.fileUrl && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">File Dokumen</p>
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors"
              >
                <Eye size={16} />
                Lihat Dokumen
              </button>
              <FilePreview
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                docKey={item.fileUrl}
                label={item.judul}
              />
            </div>
          )}

          {/* Info approval */}
          {isApproved && item.reviewer && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-3">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-0.5">
                Disetujui oleh
              </p>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {item.reviewer.profile?.namaLengkap ?? '—'}
              </p>
              {item.reviewedAt && (
                <p className="text-xs text-emerald-500 mt-0.5">{formatTanggal(item.reviewedAt)}</p>
              )}
            </div>
          )}

          {/* ── Form review (admin) ── */}
          {(isPending || isRevision) && canReview && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5 space-y-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Tinjau Dokumen
              </p>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={3}
                placeholder="Catatan untuk guru (wajib jika meminta revisi)..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="primary" size="sm"
                  onClick={() => { void handleReview('APPROVED') }}
                  disabled={reviewMutation.isPending}
                  className="justify-center"
                >
                  {reviewMutation.isPending
                    ? <Spinner />
                    : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  }
                  Setujui
                </Button>
                <Button
                  variant="warning" size="sm"
                  onClick={() => { void handleReview('REVISION_REQUESTED') }}
                  disabled={reviewMutation.isPending || !catatan.trim()}
                  title={!catatan.trim() ? 'Isi catatan terlebih dahulu' : undefined}
                  className="justify-center"
                >
                  {reviewMutation.isPending
                    ? <Spinner />
                    : <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  }
                  Minta Revisi
                </Button>
              </div>
              {!catatan.trim() && (
                <p className="text-[10px] text-gray-400 text-center">
                  Isi catatan untuk mengaktifkan tombol &ldquo;Minta Revisi&rdquo;
                </p>
              )}
            </div>
          )}

          {/* ── Aksi guru (edit & hapus) ── */}
          {canDelete && !isApproved && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Kelola Dokumen
              </p>
              <div className="grid grid-cols-2 gap-2">
                {onEdit && (
                  <Button
                    variant="secondary" size="sm"
                    className="justify-center"
                    onClick={() => { handleClose(); onEdit() }}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                )}
                <Button
                  variant="danger" size="sm"
                  className={`justify-center ${!onEdit ? 'col-span-2' : ''}`}
                  onClick={() => setConfirmHapus(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Hapus
                </Button>
              </div>
            </div>
          )}

        </div>
      </SlideOver>

      {/* Modal konfirmasi hapus */}
      <Modal
        open={confirmHapus}
        onClose={() => setConfirmHapus(false)}
        title="Hapus Dokumen"
        size="sm"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setConfirmHapus(false)} disabled={hapusMutation.isPending}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleHapus} disabled={hapusMutation.isPending}>
              {hapusMutation.isPending ? <><Spinner />&nbsp;Menghapus...</> : <><Trash2 className="h-3.5 w-3.5 mr-1.5" />Ya, Hapus</>}
            </Button>
          </div>
        }
      >
        <div className="px-6 py-5 flex gap-4">
          <div className="shrink-0 h-10 w-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
              Yakin ingin menghapus dokumen ini?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">&ldquo;{item.judul}&rdquo;</span> akan dihapus permanen dan tidak dapat dikembalikan.
            </p>
          </div>
        </div>
      </Modal>
    </>
  )
}
