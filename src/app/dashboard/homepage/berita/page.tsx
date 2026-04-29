'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Eye, Pencil, Trash2, Newspaper, Tag, X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import {
  useBeritaList,
  useDeleteBerita,
  useKategoriBerita,
  useCreateKategoriBerita,
  useDeleteKategoriBerita,
} from '@/hooks/homepage/useBerita'
import { Button, Badge, ConfirmModal, Modal } from '@/components/ui'
import { getPublicFileUrl } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Berita, StatusBerita } from '@/types/homepage.types'

const WRITE_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'STAFF_TU'])
const DELETE_ROLES = new Set(['SUPER_ADMIN', 'ADMIN'])

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function BeritaListPage() {
  const router   = useRouter()
  const user     = useAuthStore((s) => s.user)
  const canWrite = user ? WRITE_ROLES.has(user.role) : false
  const canDelete = user ? DELETE_ROLES.has(user.role) : false

  const [search,     setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusBerita | ''>('')
  const [kategoriFilter, setKategoriFilter] = useState('')

  const { data: listData, isLoading } = useBeritaList(
    {
      limit: 20,
      ...(search         ? { search }              : {}),
      ...(statusFilter   ? { status: statusFilter } : {}),
      ...(kategoriFilter ? { kategoriId: kategoriFilter } : {}),
    },
    true, // isAdmin — tampilkan semua status
  )
  const beritaList = listData?.data ?? []

  const { data: kategoriList = [] } = useKategoriBerita()

  const deleteBerita = useDeleteBerita()
  const [deleteTarget, setDeleteTarget] = useState<Berita | null>(null)

  // Kategori management modal
  const [kategoriModalOpen, setKategoriModalOpen] = useState(false)
  const [newKategoriNama,   setNewKategoriNama]   = useState('')
  const [kategoriError,     setKategoriError]     = useState<string | null>(null)
  const createKategori = useCreateKategoriBerita()
  const deleteKategori = useDeleteKategoriBerita()

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteBerita.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      console.error(getErrorMessage(err))
    }
  }

  const handleCreateKategori = async () => {
    if (!newKategoriNama.trim()) { setKategoriError('Nama wajib diisi'); return }
    setKategoriError(null)
    try {
      await createKategori.mutateAsync({
        nama: newKategoriNama.trim(),
        slug: slugify(newKategoriNama.trim()),
      })
      setNewKategoriNama('')
    } catch (err) {
      setKategoriError(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari berita..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Filter status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusBerita | '')}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
        >
          <option value="">Semua Status</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>

        {/* Filter kategori */}
        <select
          value={kategoriFilter}
          onChange={(e) => setKategoriFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
        >
          <option value="">Semua Kategori</option>
          {kategoriList.map((k) => (
            <option key={k.id} value={k.id}>{k.nama}</option>
          ))}
        </select>

        {/* Actions */}
        <div className="flex gap-2 shrink-0">
          {canWrite && (
            <button
              type="button"
              onClick={() => setKategoriModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <Tag size={13} />
              Kategori
            </button>
          )}
          {canWrite && (
            <Button
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => router.push('/dashboard/homepage/berita/baru')}
            >
              Tulis Berita
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : beritaList.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
            <Newspaper size={20} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {search || statusFilter || kategoriFilter ? 'Tidak ada berita yang cocok' : 'Belum ada berita'}
          </p>
          {canWrite && !search && !statusFilter && !kategoriFilter && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => router.push('/dashboard/homepage/berita/baru')}
            >
              Tulis Berita Pertama
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {beritaList.map((item) => (
            <BeritaRow
              key={item.id}
              item={item}
              canWrite={canWrite}
              canDelete={canDelete}
              onEdit={() => router.push(`/dashboard/homepage/berita/${item.id}`)}
              onDelete={() => setDeleteTarget(item)}
            />
          ))}
        </div>
      )}

      {/* Confirm delete */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Berita"
        description={`Hapus berita "${deleteTarget?.judul}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        variant="danger"
        isLoading={deleteBerita.isPending}
      />

      {/* Kategori modal */}
      <Modal
        open={kategoriModalOpen}
        onClose={() => setKategoriModalOpen(false)}
        title="Kelola Kategori Berita"
        size="sm"
      >
        <div className="px-6 py-5 space-y-4">
          {canWrite && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newKategoriNama}
                onChange={(e) => setNewKategoriNama(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateKategori() }}
                placeholder="Nama kategori baru..."
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
              <Button
                size="sm"
                onClick={handleCreateKategori}
                loading={createKategori.isPending}
              >
                Tambah
              </Button>
            </div>
          )}
          {kategoriError && (
            <p className="text-xs text-red-500">{kategoriError}</p>
          )}

          <div className="space-y-1.5">
            {kategoriList.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Belum ada kategori</p>
            ) : (
              kategoriList.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{k.nama}</p>
                    <p className="text-xs text-gray-400">{k.slug}</p>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => deleteKategori.mutate(k.id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Berita Row ────────────────────────────────────────────────────────────────
function BeritaRow({
  item,
  canWrite,
  canDelete,
  onEdit,
  onDelete,
}: {
  item:      Berita
  canWrite:  boolean
  canDelete: boolean
  onEdit:    () => void
  onDelete:  () => void
}) {
  const imgUrl = item.fotoUrl ? getPublicFileUrl(item.fotoUrl) : null

  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
      {/* Thumbnail */}
      <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
        {imgUrl ? (
          <img src={imgUrl} alt={item.judul} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Newspaper size={16} className="text-gray-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {item.judul}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {item.kategori && (
            <span className="text-[11px] text-gray-400">{item.kategori.nama}</span>
          )}
          <span className="text-[11px] text-gray-400">
            {item.author?.profile?.namaLengkap ?? '—'}
          </span>
          <span className="text-[11px] text-gray-400">
            {formatDate(item.publishedAt ?? item.createdAt)}
          </span>
        </div>
      </div>

      {/* Stats + status */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Eye size={12} />
          {item.viewCount}
        </div>
        <Badge
          variant={item.status === 'PUBLISHED' ? 'success' : 'warning'}
          size="sm"
        >
          {item.status === 'PUBLISHED' ? 'Published' : 'Draft'}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {canWrite && (
          <button
            type="button"
            onClick={onEdit}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
          >
            <Pencil size={13} />
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}
