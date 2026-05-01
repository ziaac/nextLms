'use client'

import { Skeleton, EmptyState, Badge } from '@/components/ui'
import { useSiswaKelas } from '@/hooks/sikap/useSikap'
import { Plus, Eye, Pencil } from 'lucide-react'
import type { UserRole } from '@/types/enums'

interface SikapSiswaTableProps {
  kelasId:         string
  semesterId?:     string
  currentUserRole: UserRole
  canEdit:         boolean   // GURU, WALI_KELAS, SUPER_ADMIN, ADMIN
  onTambah:        (siswaId: string, siswaName: string) => void
  onDetail:        (siswaId: string, readonly: boolean) => void
  onEdit:          (siswaId: string) => void
}

const ROLES_CAN_EDIT = ['GURU', 'WALI_KELAS', 'SUPER_ADMIN', 'ADMIN'] as const
const ROLES_READONLY = ['KEPALA_SEKOLAH', 'WAKIL_KEPALA'] as const

export function SikapSiswaTable({
  kelasId,
  semesterId,
  currentUserRole,
  canEdit,
  onTambah,
  onDetail,
  onEdit,
}: SikapSiswaTableProps) {
  const { data: siswaList = [], isLoading } = useSiswaKelas(kelasId || null, semesterId)

  const isReadonlyRole = (ROLES_READONLY as readonly string[]).includes(currentUserRole)
  const showTambahEdit = canEdit && !isReadonlyRole

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-5 w-10 rounded-full ml-auto" />
              <Skeleton className="h-5 w-10 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (siswaList.length === 0) {
    return (
      <EmptyState
        title="Belum ada siswa"
        description="Belum ada siswa terdaftar di kelas ini."
      />
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1fr_auto_auto_auto] gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nama Siswa</p>
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">NISN</p>
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">Positif</p>
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">Negatif</p>
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-right">Aksi</p>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {siswaList.map((siswa) => (
          <div
            key={siswa.siswaId}
            className="grid grid-cols-[2fr_1fr_auto_auto_auto] gap-3 items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
          >
            {/* Nama */}
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
              {siswa.namaLengkap}
            </p>

            {/* NISN */}
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono text-xs">
              {siswa.nisn ?? '—'}
            </p>

            {/* Positif */}
            <div className="flex justify-center">
              {siswa.jumlahPositif > 0 ? (
                <Badge variant="success">{siswa.jumlahPositif}</Badge>
              ) : (
                <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
              )}
            </div>

            {/* Negatif */}
            <div className="flex justify-center">
              {siswa.jumlahNegatif > 0 ? (
                <Badge variant="danger">{siswa.jumlahNegatif}</Badge>
              ) : (
                <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
              )}
            </div>

            {/* Aksi */}
            <div className="flex items-center gap-1 justify-end">
              {showTambahEdit && (
                <button
                  type="button"
                  onClick={() => onTambah(siswa.siswaId, siswa.namaLengkap)}
                  title="Tambah Catatan"
                  className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onDetail(siswa.siswaId, isReadonlyRole)}
                title="Detail"
                className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              {showTambahEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(siswa.siswaId)}
                  title="Edit Catatan"
                  className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
