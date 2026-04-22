"""
PATCH — Fix FASE 7B (3 perbaikan sekaligus):
  1. Fix 415 toggle-active (semester & tahun ajaran) — tambah empty body {}
  2. Semester inline expand di bawah row (hapus SlideOver, 2 kolom tablet+)
  3. Type update _count dari backend + disable hapus jika ada jadwal

Jalankan dari ROOT project:
    python scripts/patch_fase7b_fixes.py
"""

import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def p(rel: str) -> str:
    return os.path.join(BASE, rel.replace("/", os.sep))


def patch_file(label: str, path: str, old: str, new: str) -> bool:
    if not os.path.exists(path):
        print(f"  ❌ [{label}] File tidak ditemukan")
        return False
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    if old not in content:
        print(f"  ⚠️  [{label}] Anchor tidak ditemukan — skip")
        return False
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.replace(old, new, 1))
    print(f"  ✅ [{label}]")
    return True


def write_file(label: str, path: str, content: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  ✅ [{label}]")


# ============================================================
# FIX 1 — semester.api.ts: toggle-active 415
# Axios kirim Content-Type: application/json otomatis saat ada body.
# PATCH tanpa body perlu explicit { headers: {} } agar tidak 415.
# ============================================================

SEM_API_PATH = p("src/lib/api/semester.api.ts")

SEM_API_OLD = """\
  /** PATCH /semester/:id/toggle-active */
  toggleActive: async (id: string): Promise<Semester> => {
    const res = await api.patch<Semester>(`${BASE}/${id}/toggle-active`)
    return res.data
  },"""

SEM_API_NEW = """\
  /** PATCH /semester/:id/toggle-active */
  toggleActive: async (id: string): Promise<Semester> => {
    // Kirim empty body {} agar Fastify tidak return 415 Unsupported Media Type
    const res = await api.patch<Semester>(`${BASE}/${id}/toggle-active`, {})
    return res.data
  },"""

# ============================================================
# FIX 1b — tahun-ajaran.api.ts: toggle-active & set-active-single 415
# ============================================================

TA_API_PATH = p("src/lib/api/tahun-ajaran.api.ts")

TA_API_OLD_TOGGLE = """\
  /** PATCH /tahun-ajaran/:id/toggle-active */
  toggleActive: async (id: string): Promise<TahunAjaran> => {
    const res = await api.patch<TahunAjaran>(`${BASE}/${id}/toggle-active`)
    return res.data
  },"""

TA_API_NEW_TOGGLE = """\
  /** PATCH /tahun-ajaran/:id/toggle-active */
  toggleActive: async (id: string): Promise<TahunAjaran> => {
    // Kirim empty body {} agar Fastify tidak return 415 Unsupported Media Type
    const res = await api.patch<TahunAjaran>(`${BASE}/${id}/toggle-active`, {})
    return res.data
  },"""

TA_API_OLD_SET = """\
  /** PATCH /tahun-ajaran/:id/set-active-single */
  setActiveSingle: async (id: string): Promise<TahunAjaran> => {
    const res = await api.patch<TahunAjaran>(`${BASE}/${id}/set-active-single`)
    return res.data
  },"""

TA_API_NEW_SET = """\
  /** PATCH /tahun-ajaran/:id/set-active-single */
  setActiveSingle: async (id: string): Promise<TahunAjaran> => {
    // Kirim empty body {} agar Fastify tidak return 415 Unsupported Media Type
    const res = await api.patch<TahunAjaran>(`${BASE}/${id}/set-active-single`, {})
    return res.data
  },"""

# ============================================================
# FIX 2 & 3 — types: tambah _count ke Semester
# ============================================================

TYPES_CONTENT = """\
// ============================================================
// FASE 7B — Tahun Ajaran & Semester Types
// ============================================================

export type NamaSemester = 'GANJIL' | 'GENAP'

// ── Tahun Ajaran ─────────────────────────────────────────────
export interface TahunAjaran {
  id: string
  nama: string
  tanggalMulai: string
  tanggalSelesai: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTahunAjaranPayload {
  nama: string
  tanggalMulai: string
  tanggalSelesai: string
  isActive?: boolean
}

export interface UpdateTahunAjaranPayload extends Partial<CreateTahunAjaranPayload> {}

// ── Semester ──────────────────────────────────────────────────
export interface Semester {
  id: string
  tahunAjaranId: string
  nama: NamaSemester
  urutan: number
  tanggalMulai: string
  tanggalSelesai: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  /** Disertakan oleh findByTahunAjaran — jumlah relasi terkait */
  _count?: {
    jadwalPelajaran: number
    penilaian: number
  }
}

export interface CreateSemesterPayload {
  tahunAjaranId: string
  nama: NamaSemester
  urutan: number
  tanggalMulai: string
  tanggalSelesai: string
  isActive?: boolean
}

export interface UpdateSemesterPayload extends Partial<Omit<CreateSemesterPayload, 'tahunAjaranId'>> {}
"""

# ============================================================
# FIX 2 — TahunAjaranTable: semester inline expand (bukan SlideOver)
# Semester ditampilkan langsung di bawah row, 2 kolom tablet+
# ============================================================

TA_TABLE_CONTENT = """\
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
      <div className="rounded-xl border border-gray-200 dark:border-gray-600/60 bg-gray-50 dark:bg-gray-900/40 p-3.5 space-y-2.5">
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
        <div className="flex items-center gap-1.5 pt-0.5 border-t border-gray-200 dark:border-gray-500/50">
          {/* Toggle aktif */}
          <button
            onClick={() => toggleMutation.mutate({ id: semester.id, tahunAjaranId })}
            disabled={toggleMutation.isPending}
            className="flex-1 text-xs py-1 rounded-lg border border-gray-200 dark:border-gray-600/60
              text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700
              disabled:opacity-50 transition-colors"
          >
            {toggleMutation.isPending
              ? 'Memproses...'
              : semester.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          </button>

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
      <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-500/50 pt-3 space-y-3">
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
              border border-emerald-300 dark:border-emerald-700/60
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
            <div className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <div className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
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
        className={`rounded-xl border transition-all duration-200
          ${expanded
            ? 'border-emerald-400 dark:border-emerald-500 shadow-sm'
            : 'border-gray-200 dark:border-gray-600/60 hover:border-gray-300 dark:hover:border-gray-500'}
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
        <div className="flex items-center gap-1.5 px-4 pb-3 border-t border-gray-100 dark:border-gray-500/50 pt-2">
          <button
            onClick={() => toggleMutation.mutate(ta.id)}
            disabled={toggleMutation.isPending}
            className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600/60
              text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700
              disabled:opacity-50 transition-colors"
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
          <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
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
"""

# ============================================================
# page.tsx — hapus state selectedId & panelOpen (tidak lagi dipakai)
# ============================================================

PAGE_CONTENT = """\
'use client'

import { useState } from 'react'
import { PageHeader, Button } from '@/components/ui'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import TahunAjaranTable     from './_components/TahunAjaranTable'
import TahunAjaranFormModal from './_components/TahunAjaranFormModal'
import type { TahunAjaran } from '@/types/tahun-ajaran.types'

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

export default function TahunAjaranPage() {
  const { data, isLoading } = useTahunAjaranList()
  const [formOpen, setFormOpen] = useState(false)
  const [editData, setEditData] = useState<TahunAjaran | null>(null)

  const handleAdd = () => {
    setEditData(null)
    setFormOpen(true)
  }

  const handleEdit = (ta: TahunAjaran) => {
    setEditData(ta)
    setFormOpen(true)
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Tahun Ajaran & Semester"
          description="Kelola tahun ajaran dan semester aktif untuk seluruh kegiatan akademik."
          actions={
            <Button onClick={handleAdd}>
              <span className="flex items-center gap-1.5">
                <PlusIcon />
                Tambah Tahun Ajaran
              </span>
            </Button>
          }
        />

        {data && data.length > 0 && (
          <ActiveSummaryBanner data={data} />
        )}

        <TahunAjaranTable
          data={data ?? []}
          isLoading={isLoading}
          onEdit={handleEdit}
        />
      </div>

      <TahunAjaranFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        data={editData}
      />
    </>
  )
}

function ActiveSummaryBanner({ data }: { data: TahunAjaran[] }) {
  const aktif = data.filter((ta) => ta.isActive)
  if (aktif.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-700/50
        bg-amber-50 dark:bg-amber-900/10 px-4 py-3 flex items-center gap-3">
        <span className="text-lg">⚠️</span>
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Tidak ada tahun ajaran aktif. Aktifkan salah satu agar sistem berjalan normal.
        </p>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-700/50
      bg-emerald-50/50 dark:bg-emerald-900/10 px-4 py-3 flex items-center gap-3">
      <span className="text-lg">✓</span>
      <p className="text-sm text-emerald-700 dark:text-emerald-400">
        {aktif.length === 1 ? (
          <>Tahun ajaran aktif: <strong>{aktif[0].nama}</strong></>
        ) : (
          <>{aktif.length} tahun ajaran aktif: <strong>{aktif.map(ta => ta.nama).join(', ')}</strong></>
        )}
      </p>
    </div>
  )
}
"""


# ============================================================
# MAIN
# ============================================================

def main():
    print("\n" + "=" * 58)
    print("  PATCH FASE 7B — 3 fixes")
    print("=" * 58)

    print("\n[1] Fix 415 toggle-active")
    patch_file("semester.api.ts — toggleActive",    SEM_API_PATH, SEM_API_OLD,        SEM_API_NEW)
    patch_file("tahun-ajaran.api.ts — toggleActive", TA_API_PATH, TA_API_OLD_TOGGLE,  TA_API_NEW_TOGGLE)
    patch_file("tahun-ajaran.api.ts — setActive",    TA_API_PATH, TA_API_OLD_SET,     TA_API_NEW_SET)

    print("\n[2] Types — tambah _count ke Semester")
    write_file("tahun-ajaran.types.ts", p("src/types/tahun-ajaran.types.ts"), TYPES_CONTENT)

    print("\n[3] TahunAjaranTable — semester inline expand")
    write_file("TahunAjaranTable.tsx", p("src/app/dashboard/tahun-ajaran/_components/TahunAjaranTable.tsx"), TA_TABLE_CONTENT)

    print("\n[4] page.tsx — hapus state panel yang tidak dipakai")
    write_file("page.tsx", p("src/app/dashboard/tahun-ajaran/page.tsx"), PAGE_CONTENT)

    print("\n" + "=" * 58)
    print("  Ringkasan perubahan:")
    print("  • 415 fix: toggleActive & setActiveSingle kirim body {}")
    print("  • Semester._count ditambah ke type")
    print("  • Semester tampil inline (2 kolom sm+), bukan SlideOver")
    print("  • Tombol hapus semester disabled jika ada jadwal terkait")
    print("  • SemesterPanel.tsx sudah tidak dipakai — bisa dihapus manual")
    print("=" * 58)
    print()


if __name__ == "__main__":
    main()