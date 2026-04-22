'use client'

import { Users, Pencil, Trash2, ExternalLink, BookOpen } from 'lucide-react'
import { Button, Badge, Skeleton, EmptyState } from '@/components/ui'
import type { Kelas } from '@/types/kelas.types'

interface Props {
  data: Kelas[]
  isLoading: boolean
  isError: boolean
  activeId?: string
  onRowClick: (kelas: Kelas) => void
  onEdit: (kelas: Kelas) => void
  onDelete: (kelas: Kelas) => void
  onNavigateSiswa: (kelasId: string) => void
  onNavigateMapel: (kelasId: string) => void
}

export function KelasTable({ data, isLoading, isError, activeId, onRowClick, onEdit, onDelete, onNavigateSiswa, onNavigateMapel }: Props) {
  if (isLoading) return <KelasTableSkeleton />

  if (isError) return (
    <EmptyState title="Gagal memuat data" description="Terjadi kesalahan saat mengambil data kelas." />
  )

  if (data.length === 0) return (
    <EmptyState title="Belum ada kelas" description="Klik tombol Tambah Kelas untuk memulai." />
  )

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="pb-3 text-left font-medium">Kelas</th>
              <th className="pb-3 text-left font-medium">Tahun Ajaran</th>
              <th className="pb-3 text-left font-medium">Tingkat</th>
              <th className="pb-3 text-left font-medium">Wali Kelas</th>
              <th className="pb-3 text-left font-medium">Ruangan</th>
              <th className="pb-3 text-center font-medium">Siswa</th>
              <th className="pb-3 text-center font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {data.map((kelas) => (
              <tr
                key={kelas.id}
                onClick={() => onRowClick(kelas)}
                className={[
                  'cursor-pointer transition-colors hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10',
                  activeId === kelas.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : '',
                ].join(' ')}
              >
                <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">
                  {kelas.namaKelas}
                  {kelas.kodeKelas && (
                    <span className="ml-2 text-xs text-gray-400">({kelas.kodeKelas})</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{kelas.tahunAjaran.nama}</td>
                <td className="py-3 pr-4">
                  <Badge variant="default">{kelas.tingkatKelas.nama}</Badge>
                </td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">
                  {kelas.waliKelas?.profile.namaLengkap ?? (
                    <span className="text-gray-400 italic text-xs">Belum ditentukan</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">
                  {kelas.ruangan?.nama ?? <span className="text-gray-400 italic text-xs">—</span>}
                </td>
                <td className="py-3 pr-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col gap-1.5 items-start">
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Users className="h-3.5 w-3.5" />}
                      onClick={() => onNavigateSiswa(kelas.id)}
                    >
                      Daftar Siswa
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<BookOpen className="h-3.5 w-3.5" />}
                      onClick={() => onNavigateMapel(kelas.id)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                    >
                      Mata Pelajaran
                    </Button>
                  </div>
                </td>
                <td className="py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(kelas)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => onDelete(kelas)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {data.map((kelas) => (
          <div
            key={kelas.id}
            onClick={() => onRowClick(kelas)}
            className={[
              'rounded-lg border p-4 cursor-pointer transition-colors bg-white dark:bg-gray-900',
              activeId === kelas.id
                ? 'border-emerald-500'
                : 'border-gray-200 dark:border-gray-700',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{kelas.namaKelas}</p>
                <p className="text-xs text-gray-500 mt-0.5">{kelas.tahunAjaran.nama} · {kelas.tingkatKelas.nama}</p>
              </div>
              <Badge variant="default">{kelas.tingkatKelas.nama}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span><span className="font-medium text-gray-700 dark:text-gray-300">Wali: </span>{kelas.waliKelas?.profile.namaLengkap ?? '—'}</span>
              <span><span className="font-medium text-gray-700 dark:text-gray-300">Ruangan: </span>{kelas.ruangan?.nama ?? '—'}</span>
            </div>
            <div className="mt-3 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Users className="h-3.5 w-3.5" />}
                  onClick={() => onNavigateSiswa(kelas.id)}
                >
                  Daftar Siswa
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<BookOpen className="h-3.5 w-3.5" />}
                  onClick={() => onNavigateMapel(kelas.id)}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400"
                >
                  Mata Pelajaran
                </Button>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => onEdit(kelas)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(kelas)} className="text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function KelasTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center py-2 border-b border-gray-50 dark:border-gray-800/60">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
      ))}
    </div>
  )
}
