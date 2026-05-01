'use client'

import { useState, useMemo } from 'react'
import { Modal, Button, Skeleton, ConfirmModal } from '@/components/ui'
import {
  useCatatanSikapList,
  useDeleteCatatanSikap,
  useExportSiswaPdf,
} from '@/hooks/sikap/useSikap'
import { SikapFormModal } from './SikapFormModal'
import { toast } from 'sonner'
import { formatTanggalLengkap } from '@/lib/helpers/timezone'
import { TrendingUp, TrendingDown, Printer, Pencil, Trash2 } from 'lucide-react'
import type { UserRole } from '@/types/enums'
import type { CatatanSikapItem, JenisSikap } from '@/types/sikap.types'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN']
const READONLY_ROLES: UserRole[] = ['KEPALA_SEKOLAH', 'WAKIL_KEPALA']
const SHOW_GURU_ROLES: UserRole[] = ['GURU', 'WALI_KELAS', 'SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA']

function fmtWaktu(iso: string) {
  try { return new Date(iso).toISOString().slice(11, 16) }
  catch { return '' }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function JenisChip({ jenis }: { jenis: JenisSikap }) {
  const isPos = jenis === 'POSITIF'
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
      isPos
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    )}>
      {isPos ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {isPos ? `+${0}` : `-${0}`}
    </span>
  )
}

interface CatatanItemCardProps {
  item:          CatatanSikapItem
  showGuru:      boolean
  canEdit:       boolean
  onEdit:        (item: CatatanSikapItem) => void
  onDelete:      (id: string) => void
  isDeleting:    boolean
}

function CatatanItemCard({ item, showGuru, canEdit, onEdit, onDelete, isDeleting }: CatatanItemCardProps) {
  const isPos = item.masterSikap.jenis === 'POSITIF'
  return (
    <div className={cn(
      'rounded-xl border p-3 space-y-2',
      isPos
        ? 'border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10'
        : 'border-red-100 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10',
    )}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {item.masterSikap.nama}
            </span>
            <span className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              isPos
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
            )}>
              {isPos ? `+${item.masterSikap.point}` : `-${Math.abs(item.masterSikap.point)}`}
            </span>
            {item.masterSikap.kategori && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                {item.masterSikap.kategori}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
            <span>{formatTanggalLengkap(item.tanggal)}</span>
            {item.waktu && <><span>·</span><span>{fmtWaktu(item.waktu)}</span></>}
            {item.lokasi && <><span>·</span><span className="truncate">{item.lokasi}</span></>}
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Hapus"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Detail */}
      {(item.kronologi || item.tindakLanjut) && (
        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          {item.kronologi && (
            <p><span className="font-medium">Kronologi:</span> {item.kronologi}</p>
          )}
          {item.tindakLanjut && (
            <p><span className="font-medium">Tindak Lanjut:</span> {item.tindakLanjut}</p>
          )}
        </div>
      )}

      {/* Guru pencatat */}
      {showGuru && item.guru?.profile?.namaLengkap && (
        <p className="text-[10px] text-gray-400">
          Dicatat oleh: <span className="font-medium">{item.guru.profile.namaLengkap}</span>
        </p>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface SikapDetailModalProps {
  open:            boolean
  onClose:         () => void
  siswaId:         string
  siswaName?:      string
  semesterId?:     string
  semesterLabel?:  string
  currentUserId:   string
  currentUserRole: UserRole
  readonly?:       boolean
}

export function SikapDetailModal({
  open,
  onClose,
  siswaId,
  siswaName,
  semesterId,
  semesterLabel,
  currentUserId,
  currentUserRole,
  readonly = false,
}: SikapDetailModalProps) {
  const [editItem, setEditItem]     = useState<CatatanSikapItem | null>(null)
  const [deleteId, setDeleteId]     = useState<string | null>(null)
  const [formOpen, setFormOpen]     = useState(false)

  // ── Data ──────────────────────────────────────────────────────
  const { data: listData, isLoading } = useCatatanSikapList(
    { siswaId, semesterId, limit: 200 },
    { enabled: open && !!siswaId },
  )
  const allCatatan = listData?.data ?? []

  const positif = useMemo(
    () => allCatatan.filter((c) => c.masterSikap.jenis === 'POSITIF'),
    [allCatatan],
  )
  const negatif = useMemo(
    () => allCatatan.filter((c) => c.masterSikap.jenis === 'NEGATIF'),
    [allCatatan],
  )

  const totalPointPositif = positif.reduce((s, c) => s + c.masterSikap.point, 0)
  const totalPointNegatif = negatif.reduce((s, c) => s + c.masterSikap.point, 0)
  const netPoint = totalPointPositif - totalPointNegatif

  // ── Permissions ───────────────────────────────────────────────
  const isAdmin    = ADMIN_ROLES.includes(currentUserRole)
  const isReadonly = readonly || READONLY_ROLES.includes(currentUserRole)
  const showGuru   = SHOW_GURU_ROLES.includes(currentUserRole)

  const canEditItem = (item: CatatanSikapItem) => {
    if (isReadonly) return false
    if (isAdmin) return true
    return item.guruId === currentUserId
  }

  // ── Mutations ─────────────────────────────────────────────────
  const deleteMut = useDeleteCatatanSikap()
  const exportMut = useExportSiswaPdf()

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMut.mutateAsync(deleteId)
      toast.success('Catatan berhasil dihapus')
      setDeleteId(null)
    } catch {
      toast.error('Gagal menghapus catatan')
      setDeleteId(null)
    }
  }

  const handleExport = async () => {
    try {
      const blob = await exportMut.mutateAsync({ siswaId, semesterId })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `catatan-sikap-${siswaName ?? siswaId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // error handled by mutation onError
    }
  }

  const handleEdit = (item: CatatanSikapItem) => {
    setEditItem(item)
    setFormOpen(true)
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={siswaName ? `Catatan Sikap — ${siswaName}` : 'Catatan Sikap'}
        size="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exportMut.isPending}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              {exportMut.isPending ? 'Mengunduh...' : 'Export PDF'}
            </Button>
            <Button variant="secondary" onClick={onClose} type="button">
              Tutup
            </Button>
          </div>
        }
      >
        <div className="p-4 space-y-5">
          {/* Stat header */}
          <div className="flex items-center gap-3 flex-wrap">
            {semesterLabel && (
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                {semesterLabel}
              </span>
            )}
            <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
              +{positif.length} Positif
            </span>
            <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400">
              -{negatif.length} Negatif
            </span>
            <span className={cn(
              'text-xs font-semibold px-2 py-1 rounded-lg',
              netPoint >= 0
                ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
                : 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400',
            )}>
              Net: {netPoint >= 0 ? `+${netPoint}` : netPoint}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Section Positif */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 pb-1 border-b border-emerald-100 dark:border-emerald-900/40">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Catatan Positif ({positif.length})
                  </h3>
                </div>
                {positif.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">Tidak ada catatan positif.</p>
                ) : (
                  <div className="space-y-2">
                    {positif.map((item) => (
                      <CatatanItemCard
                        key={item.id}
                        item={item}
                        showGuru={showGuru}
                        canEdit={canEditItem(item)}
                        onEdit={handleEdit}
                        onDelete={(id) => setDeleteId(id)}
                        isDeleting={deleteMut.isPending}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Section Negatif */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 pb-1 border-b border-red-100 dark:border-red-900/40">
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">
                    Catatan Negatif ({negatif.length})
                  </h3>
                </div>
                {negatif.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">Tidak ada catatan negatif.</p>
                ) : (
                  <div className="space-y-2">
                    {negatif.map((item) => (
                      <CatatanItemCard
                        key={item.id}
                        item={item}
                        showGuru={showGuru}
                        canEdit={canEditItem(item)}
                        onEdit={handleEdit}
                        onDelete={(id) => setDeleteId(id)}
                        isDeleting={deleteMut.isPending}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </Modal>

      {/* Edit form modal */}
      <SikapFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null) }}
        editItem={editItem}
      />

      {/* Konfirmasi hapus */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Catatan Sikap"
        description="Apakah Anda yakin ingin menghapus catatan ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        isLoading={deleteMut.isPending}
        variant="danger"
      />
    </>
  )
}
