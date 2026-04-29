'use client'

import { useState, useEffect } from 'react'
import { Plus, GripVertical, Pencil, Trash2, Sparkles } from 'lucide-react'
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
import { useFiturList, useCreateFitur, useUpdateFitur, useReorderFitur, useDeleteFitur } from '@/hooks/homepage/useFitur'
import { Button, Modal, ConfirmModal, Badge } from '@/components/ui'
import { FileUpload } from '@/components/ui/FileUpload'
import { uploadApi } from '@/lib/api/upload.api'
import { getPublicFileUrl } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { getErrorMessage } from '@/lib/utils'
import type { FiturAplikasi, CreateFiturDto } from '@/types/homepage.types'

const WRITE_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'STAFF_TU'])

interface FormState {
  judul:    string
  deskripsi: string
  fotoUrl:  string
  urutan:   number
  isActive: boolean
}

const DEFAULT_FORM: FormState = {
  judul:    '',
  deskripsi: '',
  fotoUrl:  '',
  urutan:   0,
  isActive: true,
}

// ── Sortable Card ─────────────────────────────────────────────────────────────
function SortableCard({
  item,
  canWrite,
  onEdit,
  onDelete,
}: {
  item:     FiturAplikasi
  canWrite: boolean
  onEdit:   (item: FiturAplikasi) => void
  onDelete: (item: FiturAplikasi) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const imgUrl = item.fotoUrl ? getPublicFileUrl(item.fotoUrl) : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-start gap-3 p-4 bg-white dark:bg-gray-900',
        'border border-gray-100 dark:border-gray-800 rounded-xl',
        'hover:border-gray-200 dark:hover:border-gray-700 transition-colors',
        isDragging && 'shadow-lg',
      )}
    >
      {/* Drag handle */}
      {canWrite && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-500 mt-1 touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>
      )}

      {/* Foto/icon */}
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
        {imgUrl ? (
          <img src={imgUrl} alt={item.judul} className="w-full h-full object-cover" />
        ) : (
          <Sparkles size={20} className="text-emerald-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.judul}</p>
          <Badge variant={item.isActive ? 'success' : 'default'} size="sm">
            {item.isActive ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
          {item.deskripsi}
        </p>
      </div>

      {/* Actions */}
      {canWrite && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FiturPage() {
  const user     = useAuthStore((s) => s.user)
  const canWrite = user ? WRITE_ROLES.has(user.role) : false

  const { data: fiturList, isLoading } = useFiturList(false)
  const [ordered, setOrdered] = useState<FiturAplikasi[]>([])
  useEffect(() => { setOrdered(fiturList ?? []) }, [fiturList])

  const [modalOpen,    setModalOpen]    = useState(false)
  const [editTarget,   setEditTarget]   = useState<FiturAplikasi | null>(null)
  const [form,         setForm]         = useState<FormState>(DEFAULT_FORM)
  const [formError,    setFormError]    = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FiturAplikasi | null>(null)

  const createFitur  = useCreateFitur()
  const updateFitur  = useUpdateFitur()
  const reorderFitur = useReorderFitur()
  const deleteFitur  = useDeleteFitur()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const openCreate = () => {
    setEditTarget(null)
    setForm({ ...DEFAULT_FORM, urutan: ordered.length + 1 })
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (item: FiturAplikasi) => {
    setEditTarget(item)
    setForm({
      judul:    item.judul,
      deskripsi: item.deskripsi,
      fotoUrl:  item.fotoUrl ?? '',
      urutan:   item.urutan,
      isActive: item.isActive,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.judul.trim())    { setFormError('Judul wajib diisi'); return }
    if (!form.deskripsi.trim()) { setFormError('Deskripsi wajib diisi'); return }
    setFormError(null)

    try {
      const dto: CreateFiturDto = {
        judul:    form.judul.trim(),
        deskripsi: form.deskripsi.trim(),
        fotoUrl:  form.fotoUrl || null,
        urutan:   form.urutan,
        isActive: form.isActive,
      }
      if (editTarget) {
        await updateFitur.mutateAsync({ id: editTarget.id, dto })
      } else {
        await createFitur.mutateAsync(dto)
      }
      setModalOpen(false)
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteFitur.mutateAsync(deleteTarget.id)
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
    const newOrder = arrayMove(ordered, oldIndex, newIndex).map((m, i) => ({ ...m, urutan: i + 1 }))
    setOrdered(newOrder)
    await reorderFitur.mutateAsync(newOrder.map((m) => ({ id: m.id, urutan: m.urutan })))
  }

  const isSaving = createFitur.isPending || updateFitur.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {ordered.length} fitur unggulan
        </p>
        {canWrite && (
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
            Tambah Fitur
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : ordered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
            <Sparkles size={20} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada fitur unggulan</p>
          {canWrite && (
            <Button size="sm" variant="outline" className="mt-3" onClick={openCreate}>
              Tambah Fitur Pertama
            </Button>
          )}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ordered.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {ordered.map((item) => (
                <SortableCard
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

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Fitur' : 'Tambah Fitur'}
        size="md"
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

          {/* Judul */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Judul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.judul}
              onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))}
              placeholder="Contoh: Absensi Digital"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={form.deskripsi}
              onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
              placeholder="Deskripsi singkat fitur ini..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Foto */}
          <FileUpload
            label="Ikon / Foto Fitur"
            hint="JPG, PNG, WebP — maks 2MB"
            accept=".jpg,.jpeg,.png,.webp"
            onUpload={(file) => uploadApi.homepageFoto(file).then((r) => r.url)}
            onSuccess={(url) => setForm((f) => ({ ...f, fotoUrl: url }))}
            currentKey={form.fotoUrl || null}
            compact
          />
          {/* Inline preview */}
          {form.fotoUrl && (
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <img
                src={getPublicFileUrl(form.fotoUrl)}
                alt="preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Urutan + isActive */}
          <div className="grid grid-cols-2 gap-4">
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
            <div className="flex flex-col justify-end pb-1">
              <div className="flex items-center justify-between py-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Aktif</p>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={cn(
                    'relative rounded-full transition-colors',
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
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Fitur"
        description={`Hapus fitur "${deleteTarget?.judul}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        variant="danger"
        isLoading={deleteFitur.isPending}
      />
    </div>
  )
}
