#!/usr/bin/env python3
"""
BATCH A — MasterJam CRUD + UI Store
Files:
  1. src/types/master-jam.types.ts
  2. src/lib/api/master-jam.api.ts
  3. src/hooks/master-jam/useMasterJam.ts
  4. src/stores/ui.store.ts
  5. src/app/dashboard/master-jam/page.tsx
  6. src/app/dashboard/master-jam/_components/MasterJamTable.tsx
  7. src/app/dashboard/master-jam/_components/MasterJamFormModal.tsx
  8. src/app/dashboard/master-jam/_components/MasterJamSkeleton.tsx
"""
import os
BASE = "src"
FILES = {}

# ─────────────────────────────────────────────────────────────────
# 1. TYPES
# ─────────────────────────────────────────────────────────────────
FILES["types/master-jam.types.ts"] = '''\
export type TipeHari = \'REGULER\' | \'JUMAT\' | \'SENIN\' | \'KHUSUS\'

export const TIPE_HARI_LIST: TipeHari[] = [\'REGULER\', \'JUMAT\', \'SENIN\', \'KHUSUS\']

export const TIPE_HARI_LABEL: Record<TipeHari, string> = {
  REGULER: \'Reguler\',
  JUMAT:   \'Jumat\',
  SENIN:   \'Senin\',
  KHUSUS:  \'Khusus\',
}

export const TIPE_HARI_VARIANT: Record<TipeHari, \'default\' | \'success\' | \'info\' | \'warning\'> = {
  REGULER: \'default\',
  JUMAT:   \'success\',
  SENIN:   \'info\',
  KHUSUS:  \'warning\',
}

export interface MasterJam {
  id:             string
  namaSesi:       string
  jamMulai:       string   // "HH:mm"
  jamSelesai:     string   // "HH:mm"
  jumlahMenit:    number
  bobotJp:        number
  tipeHari:       TipeHari
  isIstirahat:    boolean
  urutan:         number
  tingkatKelasId: string
  createdAt:      string
  updatedAt:      string
  // Relations (optional)
  tingkatKelas?: { id: string; nama: string; jenjang: string }
}

export interface CreateMasterJamPayload {
  namaSesi:       string
  jamMulai:       string   // "HH:mm"
  jamSelesai:     string   // "HH:mm"
  bobotJp:        number
  tipeHari:       TipeHari
  isIstirahat:    boolean
  urutan:         number
  tingkatKelasId: string
}

export type UpdateMasterJamPayload = Partial<CreateMasterJamPayload>

export interface FilterMasterJamParams {
  tingkatKelasId?: string
  tipeHari?:       TipeHari
  isIstirahat?:    boolean
}
'''

# ─────────────────────────────────────────────────────────────────
# 2. API
# ─────────────────────────────────────────────────────────────────
FILES["lib/api/master-jam.api.ts"] = '''\
import api from \'@/lib/axios\'
import type {
  MasterJam,
  CreateMasterJamPayload,
  UpdateMasterJamPayload,
  FilterMasterJamParams,
} from \'@/types/master-jam.types\'

async function getAll(params?: FilterMasterJamParams): Promise<MasterJam[]> {
  const { data } = await api.get(\'/master-jam\', { params })
  return data
}

async function getById(id: string): Promise<MasterJam> {
  const { data } = await api.get(\'/master-jam/\' + id)
  return data
}

async function create(payload: CreateMasterJamPayload): Promise<MasterJam> {
  const { data } = await api.post(\'/master-jam\', payload)
  return data
}

async function update(id: string, payload: UpdateMasterJamPayload): Promise<MasterJam> {
  const { data } = await api.patch(\'/master-jam/\' + id, payload)
  return data
}

async function remove(id: string): Promise<void> {
  await api.delete(\'/master-jam/\' + id)
}

export const masterJamApi = { getAll, getById, create, update, remove }
'''

# ─────────────────────────────────────────────────────────────────
# 3. HOOKS
# ─────────────────────────────────────────────────────────────────
FILES["hooks/master-jam/useMasterJam.ts"] = '''\
import { useMutation, useQuery, useQueryClient } from \'@tanstack/react-query\'
import { masterJamApi } from \'@/lib/api/master-jam.api\'
import type {
  CreateMasterJamPayload,
  UpdateMasterJamPayload,
  FilterMasterJamParams,
  TipeHari,
} from \'@/types/master-jam.types\'

// ── Query Keys ────────────────────────────────────────────────
export const masterJamKeys = {
  all:       (f?: FilterMasterJamParams) => [\'master-jam\', f ?? {}] as const,
  detail:    (id: string)                => [\'master-jam\', id] as const,
  byTingkat: (tingkatKelasId: string, tipeHari?: TipeHari) =>
    [\'master-jam\', \'by-tingkat\', tingkatKelasId, tipeHari ?? \'all\'] as const,
}

/** Semua master jam dengan filter opsional */
export function useMasterJamList(filter?: FilterMasterJamParams) {
  return useQuery({
    queryKey: masterJamKeys.all(filter),
    queryFn:  () => masterJamApi.getAll(filter),
    staleTime: 1000 * 60 * 10,
  })
}

/**
 * Master jam per tingkat + tipeHari.
 * Dipakai di form buat-jadwal untuk dropdown sesi.
 * tipeHari ditentukan otomatis dari hari yang dipilih:
 *   JUMAT -> tipeHari: JUMAT | REGULER (backend return yang sesuai)
 *   lainnya -> tipeHari: REGULER
 */
export function useMasterJamByTingkat(
  tingkatKelasId: string | null,
  tipeHari: TipeHari | null,
) {
  return useQuery({
    queryKey: masterJamKeys.byTingkat(tingkatKelasId ?? \'\', tipeHari ?? undefined),
    queryFn:  () => masterJamApi.getAll({
      tingkatKelasId: tingkatKelasId!,
      tipeHari:       tipeHari!,
    }),
    enabled:   !!tingkatKelasId && !!tipeHari,
    staleTime: 1000 * 60 * 10,
  })
}

/** Detail satu master jam */
export function useMasterJamById(id: string | null) {
  return useQuery({
    queryKey: masterJamKeys.detail(id ?? \'\'),
    queryFn:  () => masterJamApi.getById(id!),
    enabled:  !!id,
    staleTime: 1000 * 60 * 10,
  })
}

/** Buat master jam */
export function useCreateMasterJam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMasterJamPayload) => masterJamApi.create(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [\'master-jam\'] }),
  })
}

/** Update master jam */
export function useUpdateMasterJam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMasterJamPayload }) =>
      masterJamApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [\'master-jam\'] }),
  })
}

/** Hapus master jam */
export function useDeleteMasterJam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => masterJamApi.remove(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [\'master-jam\'] }),
  })
}
'''

# ─────────────────────────────────────────────────────────────────
# 4. UI STORE (fullscreen + sidebar collapse)
# ─────────────────────────────────────────────────────────────────
FILES["stores/ui.store.ts"] = '''\
import { create } from \'zustand\'
import { persist } from \'zustand/middleware\'

interface UIState {
  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar:    () => void
  setSidebarCollapsed: (v: boolean) => void

  // Fullscreen mode (untuk halaman form kompleks)
  fullscreen:    boolean
  setFullscreen: (v: boolean) => void
  toggleFullscreen: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed:    false,
      toggleSidebar:       () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      fullscreen:       false,
      setFullscreen:    (v) => set({ fullscreen: v }),
      toggleFullscreen: () => set((s) => ({ fullscreen: !s.fullscreen })),
    }),
    {
      name:    \'lms-ui\',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
      // fullscreen tidak di-persist — reset setiap kali load
    },
  ),
)
'''

# ─────────────────────────────────────────────────────────────────
# 5. PAGE
# ─────────────────────────────────────────────────────────────────
FILES["app/dashboard/master-jam/page.tsx"] = '''\
\'use client\'

import { useState, useMemo, useEffect } from \'react\'
import { useAuthStore } from \'@/stores/auth.store\'
import { isManajemen } from \'@/lib/helpers/role\'
import { useMasterJamList } from \'@/hooks/master-jam/useMasterJam\'
import { useTingkatKelasList } from \'@/hooks/tingkat-kelas/useTingkatKelas\'
import { PageHeader, Button, Select } from \'@/components/ui\'
import { Plus } from \'lucide-react\'
import { MasterJamTable } from \'./_components/MasterJamTable\'
import { MasterJamFormModal } from \'./_components/MasterJamFormModal\'
import { MasterJamSkeleton } from \'./_components/MasterJamSkeleton\'
import type { MasterJam } from \'@/types/master-jam.types\'
import type { TipeHari } from \'@/types/master-jam.types\'
import { TIPE_HARI_LIST, TIPE_HARI_LABEL } from \'@/types/master-jam.types\'

export default function MasterJamPage() {
  const { user } = useAuthStore()
  const bolehAkses = isManajemen(user?.role)

  const [tingkatId, setTingkatId]   = useState(\'\')
  const [tipeHari, setTipeHari]     = useState<TipeHari | \'\'>(\'\')
  const [editTarget, setEditTarget] = useState<MasterJam | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const { data: tingkatListRaw } = useTingkatKelasList()
  const tingkatList = (tingkatListRaw as unknown as { id: string; nama: string }[] | undefined) ?? []

  // Auto-select tingkat pertama
  useEffect(() => {
    if (tingkatId || !tingkatList.length) return
    setTingkatId(tingkatList[0]?.id ?? \'\')
  }, [tingkatList, tingkatId])

  const { data: masterJamRaw, isLoading } = useMasterJamList(
    tingkatId
      ? { tingkatKelasId: tingkatId, tipeHari: tipeHari || undefined }
      : undefined,
  )
  const masterJamList = (masterJamRaw as MasterJam[] | undefined) ?? []

  // Sort by urutan
  const sorted = useMemo(
    () => [...masterJamList].sort((a, b) => a.urutan - b.urutan),
    [masterJamList],
  )

  if (!user || (!bolehAkses && user)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }

  const tingkatOpts = [
    { label: \'— Pilih Tingkat —\', value: \'\' },
    ...tingkatList.map((t) => ({ label: \'Kelas \' + t.nama, value: t.id })),
  ]
  const tipeOpts = [
    { label: \'Semua Tipe\', value: \'\' },
    ...TIPE_HARI_LIST.map((t) => ({ label: TIPE_HARI_LABEL[t], value: t })),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Jam Pelajaran"
        description="Kelola template sesi jam pelajaran per tingkat kelas"
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Tambah Sesi
          </Button>
        }
      />

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select
          options={tingkatOpts}
          value={tingkatId}
          onChange={(e) => setTingkatId(e.target.value)}
          className="w-44"
        />
        <Select
          options={tipeOpts}
          value={tipeHari}
          onChange={(e) => setTipeHari(e.target.value as TipeHari | \'\')}
          className="w-40"
        />
      </div>

      {isLoading ? (
        <MasterJamSkeleton />
      ) : (
        <MasterJamTable
          data={sorted}
          onEdit={setEditTarget}
        />
      )}

      {/* Create Modal */}
      <MasterJamFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultTingkatId={tingkatId}
      />

      {/* Edit Modal */}
      <MasterJamFormModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        editData={editTarget}
        defaultTingkatId={tingkatId}
      />
    </div>
  )
}
'''

# ─────────────────────────────────────────────────────────────────
# 6. TABLE
# ─────────────────────────────────────────────────────────────────
FILES["app/dashboard/master-jam/_components/MasterJamTable.tsx"] = '''\
\'use client\'

import { useState } from \'react\'
import { toast } from \'sonner\'
import { Badge, Button } from \'@/components/ui\'
import { Pencil, Trash2, Coffee } from \'lucide-react\'
import { useDeleteMasterJam } from \'@/hooks/master-jam/useMasterJam\'
import { TIPE_HARI_LABEL, TIPE_HARI_VARIANT } from \'@/types/master-jam.types\'
import type { MasterJam } from \'@/types/master-jam.types\'

interface Props {
  data:   MasterJam[]
  onEdit: (item: MasterJam) => void
}

export function MasterJamTable({ data, onEdit }: Props) {
  const deleteMutation = useDeleteMasterJam()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (item: MasterJam) => {
    if (!confirm(\'Hapus sesi "\' + item.namaSesi + \'"?\')) return
    setDeletingId(item.id)
    try {
      await deleteMutation.mutateAsync(item.id)
      toast.success(\'Sesi berhasil dihapus\')
    } catch {
      toast.error(\'Gagal menghapus sesi\')
    } finally {
      setDeletingId(null)
    }
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
        <p className="text-sm">Belum ada data sesi jam pelajaran.</p>
        <p className="text-xs">Pilih tingkat kelas untuk melihat data.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="grid grid-cols-[48px_1fr_100px_100px_80px_80px_100px_120px] gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        <span className="text-center">No</span>
        <span>Nama Sesi</span>
        <span className="text-center">Jam Mulai</span>
        <span className="text-center">Jam Selesai</span>
        <span className="text-center">Menit</span>
        <span className="text-center">Bobot JP</span>
        <span className="text-center">Tipe Hari</span>
        <span className="text-right">Aksi</span>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {data.map((item) => (
          <div
            key={item.id}
            className={
              \'grid grid-cols-[48px_1fr_100px_100px_80px_80px_100px_120px] gap-3 px-5 py-3 items-center \' +
              (item.isIstirahat
                ? \'bg-amber-50/50 dark:bg-amber-900/10\'
                : \'hover:bg-gray-50 dark:hover:bg-gray-800/50\')
            }
          >
            {/* Urutan */}
            <div className="flex items-center justify-center">
              {item.isIstirahat ? (
                <Coffee className="h-4 w-4 text-amber-500" />
              ) : (
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {item.urutan}
                </span>
              )}
            </div>

            {/* Nama Sesi */}
            <div>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {item.namaSesi}
              </span>
              {item.isIstirahat && (
                <span className="ml-2 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                  ISTIRAHAT
                </span>
              )}
            </div>

            {/* Jam Mulai */}
            <div className="text-center font-mono text-sm font-semibold text-gray-700 dark:text-gray-300">
              {item.jamMulai}
            </div>

            {/* Jam Selesai */}
            <div className="text-center font-mono text-sm font-semibold text-gray-700 dark:text-gray-300">
              {item.jamSelesai}
            </div>

            {/* Jumlah Menit */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              {item.jumlahMenit}\'
            </div>

            {/* Bobot JP */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              {item.bobotJp}
            </div>

            {/* Tipe Hari */}
            <div className="flex justify-center">
              <Badge variant={TIPE_HARI_VARIANT[item.tipeHari]} size="sm">
                {TIPE_HARI_LABEL[item.tipeHari]}
              </Badge>
            </div>

            {/* Aksi */}
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(item)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => { void handleDelete(item) }}
                disabled={deletingId === item.id}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
'''

# ─────────────────────────────────────────────────────────────────
# 7. FORM MODAL
# ─────────────────────────────────────────────────────────────────
FILES["app/dashboard/master-jam/_components/MasterJamFormModal.tsx"] = '''\
\'use client\'

import { useEffect } from \'react\'
import { useForm } from \'react-hook-form\'
import { zodResolver } from \'@hookform/resolvers/zod\'
import { z } from \'zod\'
import { toast } from \'sonner\'
import { Modal, Button, Select } from \'@/components/ui\'
import { useTingkatKelasList } from \'@/hooks/tingkat-kelas/useTingkatKelas\'
import { useCreateMasterJam, useUpdateMasterJam } from \'@/hooks/master-jam/useMasterJam\'
import { TIPE_HARI_LIST, TIPE_HARI_LABEL } from \'@/types/master-jam.types\'
import type { MasterJam } from \'@/types/master-jam.types\'

const schema = z.object({
  namaSesi:       z.string().min(1, \'Nama sesi wajib diisi\'),
  jamMulai:       z.string().regex(/^\d{2}:\d{2}$/, \'Format HH:mm\'),
  jamSelesai:     z.string().regex(/^\d{2}:\d{2}$/, \'Format HH:mm\'),
  bobotJp:        z.coerce.number().min(1).max(10),
  tipeHari:       z.enum([\'REGULER\', \'JUMAT\', \'SENIN\', \'KHUSUS\']),
  isIstirahat:    z.boolean(),
  urutan:         z.coerce.number().min(1),
  tingkatKelasId: z.string().min(1, \'Tingkat wajib dipilih\'),
})

type FormValues = z.infer<typeof schema>

const FORM_ID = \'master-jam-form\'

interface Props {
  open:             boolean
  onClose:          () => void
  editData?:        MasterJam | null
  defaultTingkatId: string
}

export function MasterJamFormModal({ open, onClose, editData, defaultTingkatId }: Props) {
  const isEdit = !!editData

  const { data: tingkatListRaw } = useTingkatKelasList()
  const tingkatList = (tingkatListRaw as unknown as { id: string; nama: string }[] | undefined) ?? []

  const createMutation = useCreateMasterJam()
  const updateMutation = useUpdateMasterJam()
  const isPending      = createMutation.isPending || updateMutation.isPending

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      namaSesi:       \'\',
      jamMulai:       \'\',
      jamSelesai:     \'\',
      bobotJp:        1,
      tipeHari:       \'REGULER\',
      isIstirahat:    false,
      urutan:         1,
      tingkatKelasId: defaultTingkatId,
    },
  })

  useEffect(() => {
    if (!open) return
    if (editData) {
      reset({
        namaSesi:       editData.namaSesi,
        jamMulai:       editData.jamMulai,
        jamSelesai:     editData.jamSelesai,
        bobotJp:        editData.bobotJp,
        tipeHari:       editData.tipeHari,
        isIstirahat:    editData.isIstirahat,
        urutan:         editData.urutan,
        tingkatKelasId: editData.tingkatKelasId,
      })
    } else {
      reset({
        namaSesi: \'\', jamMulai: \'\', jamSelesai: \'\',
        bobotJp: 1, tipeHari: \'REGULER\', isIstirahat: false,
        urutan: 1, tingkatKelasId: defaultTingkatId,
      })
    }
  }, [open, editData, defaultTingkatId, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && editData) {
        await updateMutation.mutateAsync({ id: editData.id, payload: values })
        toast.success(\'Sesi berhasil diperbarui\')
      } else {
        await createMutation.mutateAsync(values)
        toast.success(\'Sesi berhasil ditambahkan\')
      }
      onClose()
    } catch {
      toast.error(isEdit ? \'Gagal memperbarui sesi\' : \'Gagal menambahkan sesi\')
    }
  }

  const tingkatOpts = tingkatList.map((t) => ({ label: \'Kelas \' + t.nama, value: t.id }))
  const tipeOpts    = TIPE_HARI_LIST.map((t) => ({ label: TIPE_HARI_LABEL[t], value: t }))

  const inputClass = (hasError?: boolean) =>
    \'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors bg-white dark:bg-gray-900 \' +
    (hasError
      ? \'border-red-400 focus:ring-1 focus:ring-red-400\'
      : \'border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500\')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? \'Edit Sesi Jam\' : \'Tambah Sesi Jam\'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button variant="primary" type="submit" form={FORM_ID} disabled={isPending}>
            {isPending ? \'Menyimpan...\' : isEdit ? \'Simpan Perubahan\' : \'Tambah Sesi\'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 space-y-4">
          {/* Tingkat */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tingkat Kelas <span className="text-red-500">*</span>
            </label>
            <Select
              options={tingkatOpts}
              {...register(\'tingkatKelasId\')}
            />
            {errors.tingkatKelasId && (
              <p className="text-xs text-red-500">{errors.tingkatKelasId.message}</p>
            )}
          </div>

          {/* Nama Sesi + Urutan */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nama Sesi <span className="text-red-500">*</span>
              </label>
              <input
                {...register(\'namaSesi\')}
                placeholder="Sesi 1, Istirahat, ..."
                className={inputClass(!!errors.namaSesi)}
              />
              {errors.namaSesi && (
                <p className="text-xs text-red-500">{errors.namaSesi.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Urutan</label>
              <input
                type="number"
                min={1}
                {...register(\'urutan\')}
                className={inputClass(!!errors.urutan)}
              />
            </div>
          </div>

          {/* Jam Mulai - Jam Selesai */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Jam Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                {...register(\'jamMulai\')}
                className={inputClass(!!errors.jamMulai)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Jam Selesai <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                {...register(\'jamSelesai\')}
                className={inputClass(!!errors.jamSelesai)}
              />
            </div>
          </div>

          {/* Tipe Hari + Bobot JP */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipe Hari <span className="text-red-500">*</span>
              </label>
              <Select options={tipeOpts} {...register(\'tipeHari\')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bobot JP</label>
              <input
                type="number"
                min={1}
                max={10}
                {...register(\'bobotJp\')}
                className={inputClass(!!errors.bobotJp)}
              />
            </div>
          </div>

          {/* Istirahat toggle */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <input
              type="checkbox"
              id="isIstirahat"
              {...register(\'isIstirahat\')}
              className="h-4 w-4 rounded border-gray-300 text-amber-500"
            />
            <label htmlFor="isIstirahat" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              Sesi ini adalah <span className="font-semibold text-amber-600">istirahat</span>
              <span className="text-xs text-gray-400 ml-1">(tidak dipakai untuk input jadwal pelajaran)</span>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  )
}
'''

# ─────────────────────────────────────────────────────────────────
# 8. SKELETON
# ─────────────────────────────────────────────────────────────────
FILES["app/dashboard/master-jam/_components/MasterJamSkeleton.tsx"] = '''\
export function MasterJamSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
      <div className="h-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0"
        >
          <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
          <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded" style={{"maxWidth": f"{50 + (i % 4) * 12}%"}} />
          <div className="w-14 h-4 bg-gray-100 dark:bg-gray-700 rounded mx-auto font-mono" />
          <div className="w-14 h-4 bg-gray-100 dark:bg-gray-700 rounded mx-auto font-mono" />
          <div className="w-10 h-4 bg-gray-100 dark:bg-gray-700 rounded mx-auto" />
          <div className="w-10 h-4 bg-gray-100 dark:bg-gray-700 rounded mx-auto" />
          <div className="w-16 h-6 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto" />
          <div className="flex gap-2 ml-auto">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
'''

# ─────────────────────────────────────────────────────────────────
# WRITER
# ─────────────────────────────────────────────────────────────────
def write_files():
    for rel_path, content in FILES.items():
        full_path = os.path.join(BASE, rel_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  ✅ {full_path}")

if __name__ == "__main__":
    print("\n🚀 BATCH A — MasterJam CRUD + UI Store\n")
    write_files()
    print("\n✅ Batch A selesai.")
    print("Jalankan: npx tsc --noEmit 2>&1 | Select-String 'master-jam'\n")
    print("Setelah clean → konfirmasi untuk lanjut Batch B (revisi buat-jadwal)\n")