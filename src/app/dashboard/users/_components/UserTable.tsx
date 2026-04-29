'use client'

import { useState } from 'react'
import { Pencil, Trash2, Users } from 'lucide-react'
import { Button, Badge, Pagination, EmptyState, TableSkeleton, ConfirmModal } from '@/components/ui'
import { RoleBadge } from './UserBadge'
import { useDeleteUser } from '@/hooks/users/useUsers'
import { getInitials } from '@/lib/utils'
import { getPublicFileUrl } from '@/lib/constants'
import { formatTanggalPendek } from '@/lib/helpers/timezone'
import type { UserItem } from '@/types/users.types'
import type { PaginatedResponse } from '@/types'

interface UserTableProps {
  data: PaginatedResponse<UserItem> | undefined
  isLoading: boolean
  page: number
  onPageChange: (page: number) => void
  onRowClick: (user: UserItem) => void
  onEdit: (user: UserItem) => void
}

export function UserTable({
  data, isLoading, page, onPageChange, onRowClick, onEdit,
}: UserTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const deleteMutation = useDeleteUser()

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      setDeleteId(null)
    } catch { /* ignore */ }
  }

  if (isLoading) return <TableSkeleton rows={8} cols={5} />

  if (!data?.data?.length) {
    return (
      <EmptyState
        icon={<Users size={24} />}
        title="Belum ada pengguna"
        description="Tambahkan pengguna baru dengan tombol di atas"
      />
    )
  }

  return (
    <>
      {/* Table — desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              {['Pengguna', 'Role', 'Angkatan', 'Status', 'Dibuat', 'Aksi'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/40">
            {data.data.map((user) => {
              const nama    = user.profile?.namaLengkap ?? user.email
              const fotoUrl = user.profile?.fotoUrl ? getPublicFileUrl(user.profile.fotoUrl) : null
              return (
                <tr
                  key={user.id}
                  onClick={() => onRowClick(user)}
                  className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center flex-shrink-0">
                        {fotoUrl
                          ? <img src={fotoUrl} alt={nama} className="w-full h-full object-cover" />
                          : <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{getInitials(nama)}</span>
                        }
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{nama}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {user.role === 'SISWA' && user.profile?.tahunMasuk
                      ? user.profile.tahunMasuk
                      : '—'
                    }
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isActive ? 'success' : 'default'}>
                      {user.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">
                    {formatTanggalPendek(user.createdAt)}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" leftIcon={<Pencil size={14} />}
                        onClick={() => onEdit(user)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" leftIcon={<Trash2 size={14} />}
                        onClick={() => setDeleteId(user.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                        Hapus
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {data.data.map((user) => {
          const nama    = user.profile?.namaLengkap ?? user.email
          const fotoUrl = user.profile?.fotoUrl ? getPublicFileUrl(user.profile.fotoUrl) : null
          return (
            <div key={user.id}
              onClick={() => onRowClick(user)}
              className="rounded-2xl bg-gray-50/80 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-800 p-4 space-y-3 cursor-pointer active:bg-gray-100 dark:active:bg-gray-800/60"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center flex-shrink-0">
                  {fotoUrl
                    ? <img src={fotoUrl} alt={nama} className="w-full h-full object-cover" />
                    : <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{getInitials(nama)}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{nama}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                </div>
                <RoleBadge role={user.role} />
              </div>
              <div className="flex items-center justify-between">
                <Badge variant={user.isActive ? 'success' : 'default'}>
                  {user.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" leftIcon={<Pencil size={13} />}
                    onClick={() => onEdit(user)}>Edit</Button>
                  <Button variant="ghost" size="sm" leftIcon={<Trash2 size={13} />}
                    onClick={() => setDeleteId(user.id)}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">Hapus</Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Pagination
        page={page}
        totalPages={data.meta.totalPages}
        total={data.meta.total}
        limit={data.meta.limit}
        onPageChange={onPageChange}
      />

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title="Hapus Pengguna"
        description="Pengguna yang dihapus tidak dapat dikembalikan. Lanjutkan?"
        confirmLabel="Hapus"
      />
    </>
  )
}
