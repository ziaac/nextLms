'use client'

import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { PageHeader, Button, Badge, Skeleton, SearchInput, ConfirmModal } from '@/components/ui'
import { useRuanganList, useDeleteRuangan } from '@/hooks/ruangan/useRuangan'
import { RuanganFormModal } from './_components/RuanganFormModal'
import { useAuthStore } from '@/stores/auth.store'
import type { Ruangan } from '@/types/ruangan.types'

const JENIS_LABEL: Record<string, string> = {
  KELAS:  'Kelas',
  LAB:    'Lab',
  AULA:   'Aula',
  KANTOR: 'Kantor',
  LAINNYA: 'Lainnya',
}

const JENIS_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'purple' | 'default'> = {
  KELAS:   'info',
  LAB:     'success',
  AULA:    'warning',
  KANTOR:  'purple',
  LAINNYA: 'default',
}

export default function RuanganPage() {
  const { user }          = useAuthStore()
  const [search, setSearch]           = useState('')
  const [formOpen, setFormOpen]       = useState(false)
  const [editTarget, setEditTarget]   = useState<Ruangan | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Ruangan | null>(null)

  const canCrud = ['SUPER_ADMIN', 'ADMIN', 'STAFF_TU'].includes(user?.role ?? '')

  const { data: ruanganList = [], isLoading } = useRuanganList()
  const deleteMutation = useDeleteRuangan(deleteTarget?.id ?? '')

  const filtered = useMemo(() => {
    if (!search.trim()) return ruanganList
    const q = search.toLowerCase()
    return ruanganList.filter((r) =>
      r.nama.toLowerCase().includes(q) ||
      r.kode.toLowerCase().includes(q)
    )
  }, [ruanganList, search])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Ruangan"
        description="Kelola data ruangan sekolah"
        actions={canCrud ? (
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setEditTarget(null); setFormOpen(true) }}>
            Tambah Ruangan
          </Button>
        ) : undefined}
      />

      <div className="w-full sm:w-72">
        <SearchInput
          placeholder="Cari kode / nama ruangan..."
          value={search}
          onChange={setSearch}
        />
      </div>

      {/* Stat mini */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {['KELAS', 'LAB', 'AULA', 'KANTOR', 'LAINNYA'].map((jenis) => {
          const count = ruanganList.filter((r) => r.jenis === jenis).length
          return (
            <div key={jenis} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs text-gray-500">{JENIS_LABEL[jenis]}</p>
              {isLoading ? (
                <Skeleton className="h-6 w-10 rounded mt-0.5" />
              ) : (
                <p className="text-xl font-bold text-gray-800">{count}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Tabel */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Building2 className="w-10 h-10 opacity-40" />
            <p className="text-sm">
              {search ? 'Tidak ada ruangan ditemukan' : 'Belum ada ruangan'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Kode', 'Nama', 'Jenis', 'Kapasitas', 'Status', ...(canCrud ? ['Aksi'] : [])].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.kode}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.nama}</td>
                    <td className="px-4 py-3">
                      <Badge variant={JENIS_VARIANT[r.jenis] ?? 'default'}>
                        {JENIS_LABEL[r.jenis] ?? r.jenis}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.kapasitas} orang</td>
                    <td className="px-4 py-3">
                      <Badge variant={r.isActive ? 'success' : 'danger'}>
                        {r.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    {canCrud && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm" variant="ghost"
                            leftIcon={<Pencil className="w-3.5 h-3.5" />}
                            onClick={() => { setEditTarget(r); setFormOpen(true) }}
                          />
                          <Button
                            size="sm" variant="ghost"
                            leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
                            onClick={() => setDeleteTarget(r)}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RuanganFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        editData={editTarget}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Ruangan"
        onConfirm={() => {
          deleteMutation.mutate(undefined, {
            onSuccess: () => setDeleteTarget(null),
          })
        }}
        isLoading={deleteMutation.isPending}
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Yakin ingin menghapus ruangan{' '}
          <span className="font-semibold text-gray-900 dark:text-white">
            {deleteTarget?.nama}
          </span>?
        </p>
      </ConfirmModal>
    </div>
  )
}
