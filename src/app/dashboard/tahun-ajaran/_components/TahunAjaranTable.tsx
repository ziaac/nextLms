'use client'

import { useState } from 'react'
import { Badge, Skeleton, EmptyState, ConfirmModal } from '@/components/ui'
import {
  useToggleTahunAjaranActive,
  useSetActiveSingleTahunAjaran,
  useDeleteTahunAjaran,
} from '@/hooks/tahun-ajaran/useTahunAjaran'
import {
  useSemesterByTahunAjaran,
  useToggleSemesterActive,
  useDeleteSemester,
} from '@/hooks/semester/useSemester'
import SemesterFormModal from './SemesterFormModal'
import { formatDate } from '@/lib/utils'
import type { TahunAjaran, Semester } from '@/types/tahun-ajaran.types'

// ── Icons ─────────────────────────────────────────────────────
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-90 !text-emerald-500' : ''}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)
const PencilIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.213l-4 1 1-4L16.862 3.487z" />
  </svg>
)
const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h8a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
  </svg>
)
const StarIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.499z" />
  </svg>
)
const PlusIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

// ── Semester Card (inline) ────────────────────────────────────
interface SemesterCardProps {
  semester:      Semester
  tahunAjaranId: string
  onEdit:        (s: Semester) => void
}

function SemesterCard({ semester, tahunAjaranId, onEdit }: SemesterCardProps) {
  const toggleMutation = useToggleSemesterActive()
  const deleteMutation = useDeleteSemester()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError,   setDeleteError]   = useState<string | null>(null)

  const hasJadwal    = (semester._count?.jadwalPelajaran ?? 0) > 0
  const jadwalCount  = semester._count?.jadwalPelajaran ?? 0

  const handleDelete = () => {
    setDeleteError(null)
    deleteMutation.mutate(
      { id: semester.id, tahunAjaranId },
      {
        onSuccess: () => setConfirmDelete(false),
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? 'Gagal menghapus semester'
          setDeleteError(typeof msg === 'string' ? msg : msg.join(', '))
        },
      },
    )
  }

  return (
    <>
      <div className="rounded-lg border border-gray-400/40 dark:border-gray-400/40  bg-gray-50 dark:bg-gray-900/40 p-3.5 space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Semester {semester.nama === 'GANJIL' ? 'Ganjil' : 'Genap'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {formatDate(semester.tanggalMulai)} – {formatDate(semester.tanggalSelesai)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge variant={semester.isActive ? 'success' : 'default'} size="sm">
              {semester.isActive ? 'Aktif' : 'Nonaktif'}
            </Badge>
          </div>
        </div>

        {/* Jadwal count info */}
        {hasJadwal && (
          <p className="text-xs text-blue-500 dark:text-blue-400">
            {jadwalCount} jadwal pelajaran terkait
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center pt-2 border-t border-gray-200/60 dark:border-gray-600/40">
          {/* Toggle aktif */}
          <button
            onClick={() => toggleMutation.mutate({ id: semester.id, tahunAjaranId })}
            disabled={toggleMutation.isPending}
            className={`mr-auto w-28 text-xs py-1.5 rounded-lg border transition-colors disabled:opacity-50 
              ${semester.isActive 
                ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20' 
                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800/50 dark:text-emerald-400 dark:hover:bg-emerald-900/20' 
              }`}
          >
            {toggleMutation.isPending
              ? 'Memproses...'
              : semester.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          </button>

          <div className="flex items-center gap-1.5">
            {/* Edit */}
            <button
              onClick={() => onEdit(semester)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50
                dark:hover:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors"
              title="Edit semester"
            >
              <PencilIcon />
            </button>

            {/* Hapus — disabled jika ada jadwal */}
            <button
              onClick={() => { setDeleteError(null); setConfirmDelete(true) }}
              disabled={hasJadwal}
              title={hasJadwal ? `Tidak dapat dihapus — ada ${jadwalCount} jadwal terkait` : 'Hapus semester'}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50
                dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors
                disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent
                disabled:hover:text-gray-400"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => { setConfirmDelete(false); setDeleteError(null) }}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title="Hapus Semester"
        description={
          deleteError
            ? deleteError
            : `Yakin ingin menghapus Semester ${semester.nama === 'GANJIL' ? 'Ganjil' : 'Genap'}? Tindakan ini tidak dapat dibatalkan.`
        }
        confirmLabel="Hapus"
        variant="danger"
      />
    </>
  )
}

// ── Semester Section (inline di bawah row) ────────────────────
interface SemesterSectionProps {
  tahunAjaran: TahunAjaran
}

function SemesterSection({ tahunAjaran }: SemesterSectionProps) {
  const [formOpen,     setFormOpen]     = useState(false)
  const [editSemester, setEditSemester] = useState<Semester | null>(null)

  const { data: semesters, isLoading } = useSemesterByTahunAjaran(tahunAjaran.id)

  const sudahLengkap = (semesters?.length ?? 0) >= 2

  const handleAdd = () => {
    setEditSemester(null)
    setFormOpen(true)
  }

  const handleEdit = (s: Semester) => {
    setEditSemester(s)
    setFormOpen(true)
  }

  return (
    <>
      <div className="px-4 pb-4 border-t border-gray-100/10 dark:border-gray-100/10 pt-3 space-y-3">
        {/* Header semester section */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Semester
          </p>
          <button
            onClick={handleAdd}
            disabled={sudahLengkap}
            title={sudahLengkap ? 'Kedua semester sudah ditambahkan' : 'Tambah semester'}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg
              border border-emerald-200 dark:border-emerald-700/60
              text-emerald-600 dark:text-emerald-400
              hover:bg-emerald-50 dark:hover:bg-emerald-900/20
              disabled:opacity-40 disabled:cursor-not-allowed
              disabled:hover:bg-transparent
              transition-colors"
          >
            <PlusIcon />
            Tambah Semester
          </button>
        </div>

        {/* Semester list */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="h-28 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <div className="h-28 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
          </div>
        ) : !semesters || semesters.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
            Belum ada semester — tambahkan Semester Ganjil & Genap
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...semesters]
              .sort((a, b) => a.urutan - b.urutan)
              .map((s) => (
                <SemesterCard
                  key={s.id}
                  semester={s}
                  tahunAjaranId={tahunAjaran.id}
                  onEdit={handleEdit}
                />
              ))}
          </div>
        )}
      </div>

      <SemesterFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        tahunAjaranId={tahunAjaran.id}
        data={editSemester}
      />
    </>
  )
}

// ── Tahun Ajaran Row ──────────────────────────────────────────
interface RowProps {
  ta:       TahunAjaran
  onEdit:   () => void
}

function TahunAjaranRow({ ta, onEdit }: RowProps) {
  const [expanded,      setExpanded]      = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const toggleMutation    = useToggleTahunAjaranActive()
  const setActiveMutation = useSetActiveSingleTahunAjaran()
  const deleteMutation    = useDeleteTahunAjaran()

  return (
    <>
      <div
        className={`rounded-lg border transition-all duration-200
          ${expanded
            ? 'border-emerald-400 dark:border-emerald-500 shadow-sm'
            : 'border-gray-400/40 dark:border-gray-400/40  hover:border-gray-300 dark:hover:border-gray-500'}
          bg-white dark:bg-gray-800`}
      >
        {/* Row header — klik expand semester */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        >
          <ChevronIcon open={expanded} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                {ta.nama}
              </span>
              <Badge variant={ta.isActive ? 'success' : 'default'} size="sm">
                {ta.isActive ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {formatDate(ta.tanggalMulai)} – {formatDate(ta.tanggalSelesai)}
            </p>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
            {expanded ? 'Tutup ↑' : 'Semester ↓'}
          </span>
        </button>

        {/* Action bar */}
        <div className="flex items-center gap-1.5 px-4 pb-3 border-t border-gray-100 dark:border-gray-400/40 pt-2">
          <button
            onClick={() => toggleMutation.mutate(ta.id)}
            disabled={toggleMutation.isPending}
            className={`w-28 text-xs py-1.5 rounded-lg border transition-colors disabled:opacity-50
              ${ta.isActive
                ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20'
                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800/50 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
              }`}
          >
            {toggleMutation.isPending ? 'Memproses...' : ta.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          </button>

          {!ta.isActive && (
            <button
              onClick={() => setActiveMutation.mutate(ta.id)}
              disabled={setActiveMutation.isPending}
              title="Nonaktifkan semua, aktifkan hanya ini"
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg
                border border-amber-200 dark:border-amber-700/50
                text-amber-600 dark:text-amber-400
                hover:bg-amber-50 dark:hover:bg-amber-900/20
                disabled:opacity-50 transition-colors"
            >
              <StarIcon />
              Aktif Tunggal
            </button>
          )}

          <div className="flex-1" />

          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50
              dark:hover:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors"
            title="Edit tahun ajaran"
          >
            <PencilIcon />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50
              dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            title="Hapus tahun ajaran"
          >
            <TrashIcon />
          </button>
        </div>

        {/* Semester inline expand */}
        {expanded && <SemesterSection tahunAjaran={ta} />}
      </div>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteMutation.mutate(ta.id, { onSuccess: () => setConfirmDelete(false) })
        }
        isLoading={deleteMutation.isPending}
        title="Hapus Tahun Ajaran"
        description={`Yakin ingin menghapus Tahun Ajaran ${ta.nama}? Semua semester yang terkait akan ikut terhapus.`}
        confirmLabel="Hapus"
        variant="danger"
      />
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────
interface Props {
  data:      TahunAjaran[]
  isLoading: boolean
  onEdit:    (ta: TahunAjaran) => void
}

export default function TahunAjaranTable({ data, isLoading, onEdit }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Belum ada tahun ajaran"
        description="Klik 'Tambah Tahun Ajaran' untuk menambahkan tahun ajaran pertama."
      />
    )
  }

  return (
    <div className="space-y-3">
      {data.map((ta) => (
        <TahunAjaranRow
          key={ta.id}
          ta={ta}
          onEdit={() => onEdit(ta)}
        />
      ))}
    </div>
  )
}