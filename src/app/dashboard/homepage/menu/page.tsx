'use client'

import { useState, useEffect } from 'react'
import { Plus, GripVertical, Pencil, Trash2, ExternalLink, Link2 } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuthStore } from '@/stores/auth.store'
import { useMenuList, useCreateMenu, useUpdateMenu, useReorderMenu, useDeleteMenu } from '@/hooks/homepage/useMenu'
import { Button, Modal, ConfirmModal, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { getErrorMessage } from '@/lib/utils'
import type { Menu, CreateMenuDto, TipeMenu } from '@/types/homepage.types'

const WRITE_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'STAFF_TU'])

// ── Form state ────────────────────────────────────────────────────────────────
interface FormState {
  label:    string
  tipe:     TipeMenu
  target:   string
  urutan:   number
  isActive: boolean
}

const DEFAULT_FORM: FormState = {
  label:    '',
  tipe:     'ONEPAGE',
  target:   '',
  urutan:   0,
  isActive: true,
}

// ── Sortable row ──────────────────────────────────────────────────────────────
function SortableRow({
  item,
  canWrite,
  onEdit,
  onDelete,
}: {
  item:     Menu
  canWrite: boolean
  onEdit:   (item: Menu) => void
  onDelete: (item: Menu) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900',
        'border border-gray-100 dark:border-gray-800 rounded-xl',
        'hover:border-gray-200 dark:hover:border-gray-700 transition-colors',
        isDragging && 'shadow-lg z-10',
      )}
    >
      {/* Drag handle */}
      {canWrite && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>
      )}

      {/* Urutan */}
      <span className="w-6 text-center text-xs font-mono text-gray-400 shrink-0">
        {item.urutan}
      </span>

      {/* Label + target */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {item.label}
        </p>
        <p className="text-xs text-gray-400 truncate mt-0.5 flex items-center gap-1">
          {item.tipe === 'LINK'
            ? <ExternalLink size={10} className="shrink-0" />
            : <Link2 size={10} className="shrink-0" />
          }
          {item.target}
        </p>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={item.tipe === 'LINK' ? 'info' : 'default'} size="sm">
          {item.tipe === 'LINK' ? 'Link' : 'Onepage'}
        </Badge>
        <Badge variant={item.isActive ? 'success' : 'default'} size="sm">
          {item.isActive ? 'Aktif' : 'Nonaktif'}
        </Badge>
      </div>

      {/* Actions */}
      {canWrite && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Hapus"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MenuNavPage() {
  const user     = useAuthStore((s) => s.user)
  const canWrite = user ? WRITE_ROLES.has(user.role) : false

  const { data: menuList, isLoading } = useMenuList(false)

  // Local ordered list untuk optimistic reorder
  const [ordered, setOrdered] = useState<Menu[]>([])
  useEffect(() => { setOrdered(menuList ?? []) }, [menuList])

  // Modal state
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editTarget, setEditTarget] = useState<Menu | null>(null)
  const [form,       setForm]       = useState<FormState>(DEFAULT_FORM)
  const [formError,  setFormError]  = useState<string | null>(null)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Menu | null>(null)

  const createMenu  = useCreateMenu()
  const updateMenu  = useUpdateMenu()
  const reorderMenu = useReorderMenu()
  const deleteMenu  = useDeleteMenu()

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  // ── Handlers ────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null)
    setForm({ ...DEFAULT_FORM, urutan: (ordered.length + 1) })
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (item: Menu) => {
    setEditTarget(item)
    setForm({
      label:    item.label,
      tipe:     item.tipe,
      target:   item.target,
      urutan:   item.urutan,
      isActive: item.isActive,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.label.trim()) { setFormError('Label wajib diisi'); return }
    if (!form.target.trim()) { setFormError('Target URL wajib diisi'); return }
    setFormError(null)

    try {
      const dto: CreateMenuDto = {
        label:    form.label.trim(),
        tipe:     form.tipe,
        target:   form.target.trim(),
        urutan:   form.urutan,
        isActive: form.isActive,
      }
      if (editTarget) {
        await updateMenu.mutateAsync({ id: editTarget.id, dto })
      } else {
        await createMenu.mutateAsync(dto)
      }
      setModalOpen(false)
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMenu.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = ordered.findIndex((m) => m.id === active.id)
    const newIndex = ordered.findIndex((m) => m.id === over.id)
    const newOrder = arrayMove(ordered, oldIndex, newIndex).map((m, i) => ({
      ...m,
      urutan: i + 1,
    }))
    setOrdered(newOrder)
    await reorderMenu.mutateAsync(newOrder.map((m) => ({ id: m.id, urutan: m.urutan })))
  }

  const isSaving = createMenu.isPending || updateMenu.isPending

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {ordered.length} item menu navigasi
          </p>
        </div>
        {canWrite && (
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
            Tambah Menu
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : ordered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
            <Link2 size={20} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada menu navigasi</p>
          {canWrite && (
            <Button size="sm" variant="outline" className="mt-3" onClick={openCreate}>
              Tambah Menu Pertama
            </Button>
          )}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ordered.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {ordered.map((item) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  canWrite={canWrite}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Modal Create/Edit */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Menu' : 'Tambah Menu'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} loading={isSaving}>
              {editTarget ? 'Simpan' : 'Tambah'}
            </Button>
          </>
        }
      >
        <div className="px-6 py-5 space-y-4">
          {formError && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {formError}
            </p>
          )}

          {/* Label */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Contoh: Beranda, Tentang Kami"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Tipe */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipe
            </label>
            <div className="flex gap-2">
              {(['ONEPAGE', 'LINK'] as TipeMenu[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, tipe: t }))}
                  className={cn(
                    'flex-1 py-2 text-sm rounded-lg border transition-colors',
                    form.tipe === t
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300',
                  )}
                >
                  {t === 'ONEPAGE' ? 'Onepage' : 'Link Eksternal'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              {form.tipe === 'ONEPAGE'
                ? 'Link ke halaman dalam aplikasi, contoh: /berita'
                : 'Link ke URL eksternal, contoh: https://...'}
            </p>
          </div>

          {/* Target */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Target URL <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.target}
              onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
              placeholder={form.tipe === 'ONEPAGE' ? '/berita' : 'https://...'}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Urutan */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Urutan
            </label>
            <input
              type="number"
              min={1}
              value={form.urutan}
              onChange={(e) => setForm((f) => ({ ...f, urutan: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* isActive toggle */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Aktif</p>
              <p className="text-xs text-gray-400">Tampilkan di navigasi publik</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
              className={cn(
                'relative w-10 h-5.5 rounded-full transition-colors',
                form.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600',
              )}
              style={{ height: '22px', width: '40px' }}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  form.isActive ? 'translate-x-5' : 'translate-x-0.5',
                )}
              />
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Menu"
        description={`Hapus menu "${deleteTarget?.label}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        variant="danger"
        isLoading={deleteMenu.isPending}
      />
    </div>
  )
}
