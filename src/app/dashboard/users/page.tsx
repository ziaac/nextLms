'use client'

import { useState, useCallback } from 'react'
import { UserPlus } from 'lucide-react'
import { PageHeader, Button } from '@/components/ui'
import { UserFilters } from './_components/UserFilters'
import { UserTable } from './_components/UserTable'
import { UserFormModal } from './_components/UserFormModal'
import { UserDetailPanel } from './_components/UserDetailPanel'
import { useUsers } from '@/hooks/users/useUsers'
import { useDebounce } from '@/hooks/useDebounce'
import type { UserItem } from '@/types/users.types'

export default function UsersPage() {
  const [page, setPage]             = useState(1)
  const [search, setSearch]         = useState('')
  const [role, setRole]             = useState('')
  const [tahunMasuk, setTahunMasuk] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser]     = useState<UserItem | null>(null)
  const [detailUser, setDetailUser] = useState<UserItem | null>(null)

  const debouncedSearch     = useDebounce(search, 400)
  const debouncedTahunMasuk = useDebounce(tahunMasuk, 600)

  const { data, isLoading } = useUsers({
    page,
    limit: 10,
    search:     debouncedSearch || undefined,
    role:       role || undefined,
    tahunMasuk: debouncedTahunMasuk ? parseInt(debouncedTahunMasuk) : undefined,
  })

  const handleSearchChange     = useCallback((v: string) => { setSearch(v);     setPage(1) }, [])
  const handleRoleChange       = useCallback((v: string) => { setRole(v);       setPage(1) }, [])
  const handleTahunMasukChange = useCallback((v: string) => { setTahunMasuk(v); setPage(1) }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pengguna"
        description={`Total ${data?.meta.total ?? 0} pengguna terdaftar`}
        actions={
          <Button leftIcon={<UserPlus size={16} />} onClick={() => setCreateOpen(true)}>
            Tambah Pengguna
          </Button>
        }
      />

      <UserFilters
        search={search}
        role={role}
        tahunMasuk={tahunMasuk}
        onSearchChange={handleSearchChange}
        onRoleChange={handleRoleChange}
        onTahunMasukChange={handleTahunMasukChange}
      />

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-200 p-4 md:p-6">
        <UserTable
          data={data}
          isLoading={isLoading}
          page={page}
          onPageChange={setPage}
          onRowClick={(user) => setDetailUser(user)}
          onEdit={(user) => setEditUser(user)}
        />
      </div>

      {/* Create Modal */}
      <UserFormModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Edit Modal */}
      <UserFormModal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
      />

      {/* Detail Slide-over */}
      <UserDetailPanel
        user={detailUser}
        onClose={() => setDetailUser(null)}
        onEdit={(user) => {
          setDetailUser(null)
          setEditUser(user)
        }}
      />
    </div>
  )
}
