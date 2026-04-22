'use client'

import { useState, useMemo }                                      from 'react'
import { CheckCircle2, XCircle, FileText, RotateCcw, Bell }      from 'lucide-react'
import { Modal }                                                   from '@/components/ui/Modal'
import { Button }                                                  from '@/components/ui/Button'
import { Spinner }                                                 from '@/components/ui/Spinner'
import { EmptyState }                                              from '@/components/ui/EmptyState'
import { useIzinPendingWali }                                      from '@/hooks/absensi/useWaliKelas'
import { FilePreview }                                             from '@/components/ui/FilePreview'
import { useApprovalPerizinan }                                    from '@/hooks/perizinan/usePerizinan'
import { PerizinanStatusBadge, PerizinanJenisBadge }              from '@/app/dashboard/perizinan/_components/PerizinanStatusBadge'
import type { PerizinanItem }                                      from '@/types/perizinan.types'

export function IzinPendingTab({ kelasId }: { kelasId: string }) {
  const { data, isLoading, refetch } = useIzinPendingWali(kelasId)
  const approval = useApprovalPerizinan()

  const [detail,     setDetail]     = useState<PerizinanItem | null>(null)
  const [catatan,    setCatatan]    = useState('')
  const [previewKey, setPreviewKey] = useState<string | null>(null)

  // Filter hanya PENDING dan REVISION_REQUESTED
  const list = (data?.data ?? []).filter(
    (p: PerizinanItem) => p.status === 'PENDING' || p.status === 'REVISION_REQUESTED',
  )

  // Pisahkan: baru hari ini vs lebih lama
  const today = useMemo(() => new Date().toLocaleDateString('en-CA'), [])
  const isToday = (iso: string) => new Date(iso).toLocaleDateString('en-CA') === today

  const baruHariIni = list.filter((p: PerizinanItem) => isToday(p.createdAt))
  const lainnya     = list.filter((p: PerizinanItem) => !isToday(p.createdAt))

  const handleAction = (item: PerizinanItem, status: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED') => {
    if (status === 'REVISION_REQUESTED' && !catatan.trim()) return
    approval.mutate(
      { id: item.id, payload: { status, catatanApproval: catatan.trim() || undefined } },
      {
        onSuccess: () => {
          setDetail(null)
          setCatatan('')
          void refetch()
        },
      },
    )
  }

  const fmtTgl = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    })

  const fmtJam = (iso: string) =>
    new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  if (isLoading) return (
    <div className="flex items-center justify-center py-16"><Spinner /></div>
  )

  if (list.length === 0) return (
    <EmptyState
      icon={<FileText size={20} />}
      title="Tidak ada izin yang perlu ditindak"
      description="Semua pengajuan izin siswa sudah diproses."
    />
  )

  return (
    <div className="space-y-4">

      {/* ── Baru Hari Ini ─────────────────────────────────────────── */}
      {baruHariIni.length > 0 && (
        <div className="space-y-2">
          {/* Section header */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              <Bell size={11} className="animate-pulse" />
              Baru hari ini · {baruHariIni.length}
            </span>
          </div>

          {/* Cards — highlighted */}
          {baruHariIni.map((item: PerizinanItem) => (
            <div
              key={item.id}
              className="bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-200 dark:border-rose-800 p-4 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    {item.user?.profile?.namaLengkap ?? 'Siswa'}
                  </p>
                  <span className="text-[10px] text-rose-400 font-medium">
                    {fmtJam(item.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {fmtTgl(item.tanggalMulai)}
                  {item.tanggalSelesai !== item.tanggalMulai && ' s/d ' + fmtTgl(item.tanggalSelesai)}
                </p>
                <p className="text-xs text-gray-400 line-clamp-1">{item.alasan}</p>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <PerizinanStatusBadge status={item.status} />
                  <PerizinanJenisBadge  jenis={item.jenis}  />
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => { setDetail(item); setCatatan('') }}
              >
                Tinjau
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* ── Menunggu tindakan (lainnya) ───────────────────────────── */}
      {lainnya.length > 0 && (
        <div className="space-y-2">
          {baruHariIni.length > 0 && (
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-1">
              Sebelumnya · {lainnya.length}
            </p>
          )}
          {lainnya.map((item: PerizinanItem) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-medium text-sm text-gray-900 dark:text-white">
                  {item.user?.profile?.namaLengkap ?? 'Siswa'}
                </p>
                <p className="text-xs text-gray-500">
                  {fmtTgl(item.tanggalMulai)}
                  {item.tanggalSelesai !== item.tanggalMulai && ' s/d ' + fmtTgl(item.tanggalSelesai)}
                </p>
                <p className="text-xs text-gray-400 line-clamp-1">{item.alasan}</p>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <PerizinanStatusBadge status={item.status} />
                  <PerizinanJenisBadge  jenis={item.jenis}  />
                </div>
                {item.status === 'REVISION_REQUESTED' && item.catatanApproval && (
                  <p className="text-xs text-purple-500 italic line-clamp-1">
                    Catatan: {item.catatanApproval}
                  </p>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={() => { setDetail(item); setCatatan('') }}>
                Tinjau
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail Modal ──────────────────────────────────────────── */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Tinjau Izin Siswa"
        description={detail?.user?.profile?.namaLengkap}
        size="sm"
        footer={
          <div className="flex items-center gap-2 w-full justify-end flex-wrap">
            <Button
              variant="danger" size="sm"
              loading={approval.isPending}
              onClick={() => detail && handleAction(detail, 'REJECTED')}
            >
              <XCircle size={14} className="mr-1" />Tolak
            </Button>
            <Button
              variant="warning" size="sm"
              loading={approval.isPending}
              disabled={!catatan.trim()}
              title={!catatan.trim() ? 'Isi catatan untuk menjelaskan revisi yang diperlukan' : undefined}
              onClick={() => detail && handleAction(detail, 'REVISION_REQUESTED')}
            >
              <RotateCcw size={14} className="mr-1" />Minta Revisi
            </Button>
            <Button
              variant="primary" size="sm"
              loading={approval.isPending}
              onClick={() => detail && handleAction(detail, 'APPROVED')}
            >
              <CheckCircle2 size={14} className="mr-1" />Setujui
            </Button>
          </div>
        }
      >
        {detail && (
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <PerizinanStatusBadge status={detail.status} />
              <PerizinanJenisBadge  jenis={detail.jenis}  />
              <span className="text-[10px] text-gray-400 ml-auto">
                Diajukan {fmtJam(detail.createdAt)}, {fmtTgl(detail.createdAt)}
              </span>
            </div>

            <InfoRow label="Periode" value={
              fmtTgl(detail.tanggalMulai) +
              (detail.tanggalSelesai !== detail.tanggalMulai
                ? ' – ' + fmtTgl(detail.tanggalSelesai)
                : '')
            } />
            <InfoRow label="Alasan" value={detail.alasan} />

            {detail.fileBuktiUrl && (
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500">Bukti</p>
                <button
                  type="button"
                  onClick={() => setPreviewKey(detail.fileBuktiUrl ?? null)}
                  className="relative h-20 w-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-emerald-400 transition-colors"
                >
                  <div className="h-full w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-emerald-600 dark:text-emerald-400">
                    Lihat Bukti
                  </div>
                </button>
              </div>
            )}

            {detail.status === 'REVISION_REQUESTED' && detail.catatanApproval && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-3 py-2">
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-0.5">
                  Catatan revisi sebelumnya:
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300 italic">
                  {detail.catatanApproval}
                </p>
              </div>
            )}

            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                Catatan
                <span className="text-gray-400 font-normal ml-1">
                  (wajib diisi untuk Minta Revisi)
                </span>
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={2}
                placeholder="Contoh: Mohon sertakan surat keterangan dokter"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>
        )}
      </Modal>

      <FilePreview
        open={!!previewKey}
        onClose={() => setPreviewKey(null)}
        docKey={previewKey}
        label="Bukti Perizinan"
      />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-sm text-gray-800 dark:text-gray-200">{value}</p>
    </div>
  )
}
