'use client'

import { useState }               from 'react'
import { PageHeader, Button, ConfirmModal } from '@/components/ui'
import { Spinner }                 from '@/components/ui/Spinner'
import { toast }                   from 'sonner'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, X, Save } from 'lucide-react'
import { cn }                      from '@/lib/utils'
import {
  useMasterDimensi,
  useCreateDimensi,  useUpdateDimensi,  useDeleteDimensi,
  useCreateSubDimensi, useUpdateSubDimensi, useDeleteSubDimensi,
} from '@/hooks/dimensi-profil/useDimensiProfil'
import type {
  DimensiProfil, SubDimensiProfil,
  CreateDimensiPayload, UpdateDimensiPayload,
  CreateSubDimensiPayload, UpdateSubDimensiPayload,
} from '@/types/dimensi-profil.types'

// ── Inline form helpers ──────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">{label}</label>
      {children}
    </div>
  )
}
const inputCls = 'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition'
const textareaCls = inputCls + ' resize-none min-h-[72px]'

// ── DimensiForm ───────────────────────────────────────────────────────
function DimensiForm({
  initial,
  maxUrutan,
  onSave,
  onCancel,
  isPending,
}: {
  initial?:   Partial<CreateDimensiPayload>
  maxUrutan:  number
  onSave:     (data: CreateDimensiPayload) => void
  onCancel:   () => void
  isPending:  boolean
}) {
  const [kode,   setKode]   = useState(initial?.kode   ?? '')
  const [nama,   setNama]   = useState(initial?.nama   ?? '')
  const [urutan, setUrutan] = useState(initial?.urutan ?? maxUrutan + 1)

  const valid = kode.trim() && nama.trim() && urutan > 0

  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-700/50 bg-emerald-50/40 dark:bg-emerald-900/10 p-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Kode (maks 10 karakter)">
          <input className={inputCls} value={kode} maxLength={10} onChange={(e) => setKode(e.target.value.toUpperCase())} placeholder="cth. D1" />
        </Field>
        <div className="col-span-2">
          <Field label="Nama Dimensi">
            <input className={inputCls} value={nama} maxLength={250} onChange={(e) => setNama(e.target.value)} placeholder="cth. Beriman, Bertakwa kepada Tuhan YME..." />
          </Field>
        </div>
        <Field label="Urutan">
          <input className={inputCls} type="number" min={1} value={urutan} onChange={(e) => setUrutan(Number(e.target.value))} />
        </Field>
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="secondary" leftIcon={<X size={13} />} onClick={onCancel}>Batal</Button>
        <Button size="sm" leftIcon={<Save size={13} />} disabled={!valid} loading={isPending}
          onClick={() => onSave({ kode: kode.trim(), nama: nama.trim(), urutan })}>
          Simpan
        </Button>
      </div>
    </div>
  )
}

// ── SubDimensiForm ────────────────────────────────────────────────────
function SubDimensiForm({
  initial,
  maxUrutan,
  onSave,
  onCancel,
  isPending,
}: {
  initial?:   Partial<CreateSubDimensiPayload>
  maxUrutan:  number
  onSave:     (data: CreateSubDimensiPayload) => void
  onCancel:   () => void
  isPending:  boolean
}) {
  const [kode,        setKode]        = useState(initial?.kode        ?? '')
  const [nama,        setNama]        = useState(initial?.nama        ?? '')
  const [urutan,      setUrutan]      = useState(initial?.urutan      ?? maxUrutan + 1)
  const [keteranganB, setKeteranganB] = useState(initial?.keteranganB ?? '')
  const [keteranganC, setKeteranganC] = useState(initial?.keteranganC ?? '')
  const [keteranganM, setKeteranganM] = useState(initial?.keteranganM ?? '')

  const valid = kode.trim() && nama.trim() && urutan > 0 && keteranganB.trim() && keteranganC.trim() && keteranganM.trim()

  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-700/50 bg-blue-50/40 dark:bg-blue-900/10 p-4 space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <Field label="Kode (maks 15)">
          <input className={inputCls} value={kode} maxLength={15} onChange={(e) => setKode(e.target.value.toUpperCase())} placeholder="cth. D1.1" />
        </Field>
        <div className="col-span-2">
          <Field label="Nama Sub-Dimensi">
            <input className={inputCls} value={nama} maxLength={250} onChange={(e) => setNama(e.target.value)} />
          </Field>
        </div>
        <Field label="Urutan">
          <input className={inputCls} type="number" min={1} value={urutan} onChange={(e) => setUrutan(Number(e.target.value))} />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Keterangan B — Berkembang">
          <textarea className={textareaCls} value={keteranganB} onChange={(e) => setKeteranganB(e.target.value)} placeholder="Deskripsi tingkat Berkembang..." />
        </Field>
        <Field label="Keterangan C — Cakap">
          <textarea className={textareaCls} value={keteranganC} onChange={(e) => setKeteranganC(e.target.value)} placeholder="Deskripsi tingkat Cakap..." />
        </Field>
        <Field label="Keterangan M — Mahir">
          <textarea className={textareaCls} value={keteranganM} onChange={(e) => setKeteranganM(e.target.value)} placeholder="Deskripsi tingkat Mahir..." />
        </Field>
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="secondary" leftIcon={<X size={13} />} onClick={onCancel}>Batal</Button>
        <Button size="sm" leftIcon={<Save size={13} />} disabled={!valid} loading={isPending}
          onClick={() => onSave({
            kode: kode.trim(), nama: nama.trim(), urutan,
            keteranganB: keteranganB.trim(),
            keteranganC: keteranganC.trim(),
            keteranganM: keteranganM.trim(),
          })}>
          Simpan
        </Button>
      </div>
    </div>
  )
}

// ── SubDimensiRow ──────────────────────────────────────────────────────
function SubDimensiRow({
  sub,
  onEdit,
  onDelete,
}: {
  sub:      SubDimensiProfil
  onEdit:   (sub: SubDimensiProfil) => void
  onDelete: (sub: SubDimensiProfil) => void
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button type="button" onClick={() => setExpanded((v) => !v)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
          <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', expanded && 'rotate-90')} />
        </button>
        <span className="text-[10px] font-bold text-gray-400 w-14 flex-shrink-0 font-mono">{sub.kode}</span>
        <span className="flex-1 text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{sub.nama}</span>
        <span className="text-[10px] text-gray-400 w-6 text-center flex-shrink-0">{sub.urutan}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(sub)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(sub)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="grid grid-cols-3 gap-3 px-4 pb-3 border-t border-gray-100 dark:border-gray-700/50 pt-2.5">
          {[
            { label: 'B — Berkembang', text: sub.keteranganB, cls: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30' },
            { label: 'C — Cakap',      text: sub.keteranganC, cls: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30'     },
            { label: 'M — Mahir',      text: sub.keteranganM, cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30' },
          ].map((r) => (
            <div key={r.label} className={cn('rounded-lg border p-2.5', r.cls)}>
              <p className="text-[10px] font-bold mb-1">{r.label}</p>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── DimensiCard ────────────────────────────────────────────────────────
function DimensiCard({ dimensi }: { dimensi: DimensiProfil }) {
  const [open,           setOpen]           = useState(true)
  const [editingDimensi, setEditingDimensi] = useState(false)
  const [addingSub,      setAddingSub]      = useState(false)
  const [editingSub,     setEditingSub]     = useState<SubDimensiProfil | null>(null)
  const [deleteSub,      setDeleteSub]      = useState<SubDimensiProfil | null>(null)
  const [deleteDim,      setDeleteDim]      = useState(false)

  const updateDimensiMut  = useUpdateDimensi()
  const deleteDimensiMut  = useDeleteDimensi()
  const createSubMut      = useCreateSubDimensi()
  const updateSubMut      = useUpdateSubDimensi()
  const deleteSubMut      = useDeleteSubDimensi()

  const handleUpdateDimensi = async (data: CreateDimensiPayload) => {
    try {
      await updateDimensiMut.mutateAsync({ id: dimensi.id, payload: data as UpdateDimensiPayload })
      setEditingDimensi(false)
      toast.success('Dimensi diperbarui')
    } catch { toast.error('Gagal memperbarui dimensi') }
  }

  const handleDeleteDimensi = async () => {
    try {
      await deleteDimensiMut.mutateAsync(dimensi.id)
      toast.success('Dimensi dihapus')
    } catch { toast.error('Gagal menghapus dimensi') }
  }

  const handleCreateSub = async (data: CreateSubDimensiPayload) => {
    try {
      await createSubMut.mutateAsync({ dimensiId: dimensi.id, payload: data })
      setAddingSub(false)
      toast.success('Sub-dimensi ditambahkan')
    } catch { toast.error('Gagal menambahkan sub-dimensi') }
  }

  const handleUpdateSub = async (data: CreateSubDimensiPayload) => {
    if (!editingSub) return
    try {
      await updateSubMut.mutateAsync({ id: editingSub.id, payload: data as UpdateSubDimensiPayload })
      setEditingSub(null)
      toast.success('Sub-dimensi diperbarui')
    } catch { toast.error('Gagal memperbarui sub-dimensi') }
  }

  const handleDeleteSub = async () => {
    if (!deleteSub) return
    try {
      await deleteSubMut.mutateAsync(deleteSub.id)
      setDeleteSub(null)
      toast.success('Sub-dimensi dihapus')
    } catch { toast.error('Gagal menghapus sub-dimensi') }
  }

  return (
    <>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Dimensi header */}
        {editingDimensi ? (
          <div className="p-4">
            <DimensiForm
              initial={{ kode: dimensi.kode, nama: dimensi.nama, urutan: dimensi.urutan }}
              maxUrutan={dimensi.urutan}
              onSave={handleUpdateDimensi}
              onCancel={() => setEditingDimensi(false)}
              isPending={updateDimensiMut.isPending}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900">
            <button type="button" onClick={() => setOpen((v) => !v)} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
              <ChevronDown className={cn('w-4 h-4 transition-transform', !open && '-rotate-90')} />
            </button>
            <span className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {dimensi.kode}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{dimensi.nama}</p>
              <p className="text-[10px] text-gray-400">Urutan {dimensi.urutan} · {dimensi.subDimensi.length} sub-dimensi</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => { setAddingSub(true); setOpen(true) }}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-700/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Sub-Dimensi
              </button>
              <button
                type="button"
                onClick={() => setEditingDimensi(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteDim(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Sub-dimensi list */}
        {open && (
          <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/20 space-y-2">
            {/* Add sub form */}
            {addingSub && (
              <SubDimensiForm
                maxUrutan={dimensi.subDimensi.length}
                onSave={handleCreateSub}
                onCancel={() => setAddingSub(false)}
                isPending={createSubMut.isPending}
              />
            )}

            {dimensi.subDimensi.length === 0 && !addingSub && (
              <p className="text-xs text-gray-400 italic text-center py-4">
                Belum ada sub-dimensi — klik "+ Sub-Dimensi" untuk menambah
              </p>
            )}

            {dimensi.subDimensi.map((sub) =>
              editingSub?.id === sub.id ? (
                <SubDimensiForm
                  key={sub.id}
                  initial={sub}
                  maxUrutan={sub.urutan}
                  onSave={handleUpdateSub}
                  onCancel={() => setEditingSub(null)}
                  isPending={updateSubMut.isPending}
                />
              ) : (
                <SubDimensiRow
                  key={sub.id}
                  sub={sub}
                  onEdit={setEditingSub}
                  onDelete={setDeleteSub}
                />
              ),
            )}
          </div>
        )}
      </div>

      {/* Delete sub confirm */}
      <ConfirmModal
        open={!!deleteSub}
        onClose={() => setDeleteSub(null)}
        onConfirm={handleDeleteSub}
        isLoading={deleteSubMut.isPending}
        title="Hapus Sub-Dimensi"
        confirmLabel="Hapus"
        variant="danger"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Yakin hapus sub-dimensi{' '}
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            &ldquo;{deleteSub?.nama}&rdquo;
          </span>
          ? Semua penilaian terkait akan ikut terhapus.
        </p>
      </ConfirmModal>

      {/* Delete dimensi confirm */}
      <ConfirmModal
        open={deleteDim}
        onClose={() => setDeleteDim(false)}
        onConfirm={handleDeleteDimensi}
        isLoading={deleteDimensiMut.isPending}
        title="Hapus Dimensi"
        confirmLabel="Hapus"
        variant="danger"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Yakin hapus dimensi{' '}
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            &ldquo;{dimensi.nama}&rdquo;
          </span>
          ? Seluruh sub-dimensi dan penilaian terkait akan ikut terhapus.
        </p>
      </ConfirmModal>
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────
export default function MasterDimensiProfilPage() {
  const { data, isLoading, isError } = useMasterDimensi()
  const createMut = useCreateDimensi()

  const [addingDimensi, setAddingDimensi] = useState(false)

  const handleCreateDimensi = async (payload: CreateDimensiPayload) => {
    try {
      await createMut.mutateAsync(payload)
      setAddingDimensi(false)
      toast.success('Dimensi baru ditambahkan')
    } catch {
      toast.error('Gagal menambahkan dimensi')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Dimensi Profil"
        description="Kelola dimensi dan sub-dimensi Profil Pelajar Pancasila Rahmatan Lil Alamin (BSKAP 058/H/KR/2025)"
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={() => setAddingDimensi(true)}>
            Tambah Dimensi
          </Button>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      )}

      {isError && (
        <p className="text-sm text-red-500 text-center py-10 italic">Gagal memuat data dimensi profil.</p>
      )}

      {data && (
        <div className="space-y-4">
          {/* Add dimensi form */}
          {addingDimensi && (
            <DimensiForm
              maxUrutan={data.length}
              onSave={handleCreateDimensi}
              onCancel={() => setAddingDimensi(false)}
              isPending={createMut.isPending}
            />
          )}

          {data.length === 0 && !addingDimensi && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-400">Belum ada dimensi profil. Klik &ldquo;Tambah Dimensi&rdquo; untuk memulai.</p>
            </div>
          )}

          {data.map((dimensi) => (
            <DimensiCard key={dimensi.id} dimensi={dimensi} />
          ))}
        </div>
      )}
    </div>
  )
}
