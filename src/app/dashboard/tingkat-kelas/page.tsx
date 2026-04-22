'use client'

import { useState } from 'react'
import { PageHeader, Button, Badge, ConfirmModal, EmptyState } from '@/components/ui'
import {
  useTingkatKelasList,
  useDeleteTingkatKelas,
} from '@/hooks/tingkat-kelas/useTingkatKelas'
import TingkatKelasFormModal from './_components/TingkatKelasFormModal'
import type { TingkatKelas } from '@/types/akademik.types'

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)
const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.213l-4 1 1-4L16.862 3.487z" />
  </svg>
)
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h8a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
  </svg>
)

function TingkatCard({ tingkat, onEdit }: { tingkat: TingkatKelas; onEdit: () => void }) {
  const deleteMutation  = useDeleteTingkatKelas()
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <>
      <div className="rounded-lg border border-gray-200 dark:border-gray-600/60 bg-white dark:bg-gray-800 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-14 h-14 rounded-lg
              bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400
              text-xl font-bold flex-shrink-0">
              {tingkat.nama}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Tingkat {tingkat.nama}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="info" size="sm">{tingkat.jenjang}</Badge>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Urutan {tingkat.urutan}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50
                dark:hover:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors"
              title="Edit"
            >
              <PencilIcon />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50
                dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              title="Hapus"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteMutation.mutate(tingkat.id, { onSuccess: () => setConfirmDelete(false) })
        }
        isLoading={deleteMutation.isPending}
        title="Hapus Tingkat Kelas"
        description={`Yakin ingin menghapus Tingkat ${tingkat.nama}? Semua kelas yang terkait akan terpengaruh.`}
        confirmLabel="Hapus"
        variant="danger"
      />
    </>
  )
}

export default function TingkatKelasPage() {
  const { data, isLoading } = useTingkatKelasList()
  const [formOpen, setFormOpen] = useState(false)
  const [editData, setEditData] = useState<TingkatKelas | null>(null)

  const sudahLengkap = (data?.length ?? 0) >= 3

  const handleAdd = () => { setEditData(null); setFormOpen(true) }
  const handleEdit = (t: TingkatKelas) => { setEditData(t); setFormOpen(true) }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Tingkat Kelas"
          description="Kelola tingkat kelas (X, XI, XII) untuk Madrasah Aliyah."
          actions={
            <Button onClick={handleAdd} disabled={sudahLengkap}>
              <span className="flex items-center gap-1.5">
                <PlusIcon />
                Tambah Tingkat
              </span>
            </Button>
          }
        />

        {sudahLengkap && (
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-700/50
            bg-emerald-30/50 dark:bg-emerald-900/10 px-4 py-3 flex items-center gap-3">
            <span className="text-lg">✓</span>
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Semua tingkat kelas (X, XI, XII) sudah ditambahkan.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1,2,3].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="Belum ada tingkat kelas"
            description="Tambahkan Tingkat X, XI, dan XII untuk mulai mengatur kelas."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...data].sort((a, b) => a.urutan - b.urutan).map((t) => (
              <TingkatCard key={t.id} tingkat={t} onEdit={() => handleEdit(t)} />
            ))}
          </div>
        )}
      </div>

      <TingkatKelasFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        data={editData}
      />
    </>
  )
}
