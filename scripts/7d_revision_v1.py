import os, sys, textwrap

base = sys.argv[1] if len(sys.argv) > 1 else "."

files = {}

# ============================================================
# BATCH 3 REWRITE
# ============================================================

# 1. page.tsx
files["src/app/dashboard/kelas/page.tsx"] = textwrap.dedent("""\
    'use client'

    import { useState, useCallback } from 'react'
    import { useRouter } from 'next/navigation'
    import { Plus, LayoutGrid } from 'lucide-react'
    import { PageHeader, Button, ConfirmModal } from '@/components/ui'
    import { KelasFilters } from './_components/KelasFilters'
    import { KelasTable } from './_components/KelasTable'
    import { KelasFormModal } from './_components/KelasFormModal'
    import { KelasFormBulkModal } from './_components/KelasFormBulkModal'
    import { KelasDetailPanel } from './_components/KelasDetailPanel'
    import { useKelasList, useDeleteKelas } from '@/hooks/kelas/useKelas'
    import type { Kelas, KelasFilterParams } from '@/types/kelas.types'

    export default function KelasPage() {
      const router = useRouter()

      const [filters, setFilters]         = useState<KelasFilterParams>({})
      const [formOpen, setFormOpen]       = useState(false)
      const [bulkOpen, setBulkOpen]       = useState(false)
      const [editTarget, setEditTarget]   = useState<Kelas | null>(null)
      const [detailTarget, setDetailTarget] = useState<Kelas | null>(null)
      const [deleteTarget, setDeleteTarget] = useState<Kelas | null>(null)

      const { data, isLoading, isError } = useKelasList(filters)
      const kelasList = data?.data ?? []

      const deleteMutation = useDeleteKelas(deleteTarget?.id ?? '')

      const handleOpenCreate = useCallback(() => {
        setEditTarget(null)
        setFormOpen(true)
      }, [])

      const handleOpenEdit = useCallback((kelas: Kelas) => {
        setEditTarget(kelas)
        setFormOpen(true)
        setDetailTarget(null)
      }, [])

      const handleNavigateSiswa = useCallback((kelasId: string) => {
        router.push(`/dashboard/kelas/${kelasId}/siswa`)
      }, [router])

      const handleConfirmDelete = useCallback(() => {
        if (!deleteTarget) return
        deleteMutation.mutate(undefined, {
          onSuccess: () => {
            setDeleteTarget(null)
            if (detailTarget?.id === deleteTarget.id) setDetailTarget(null)
          },
        })
      }, [deleteTarget, deleteMutation, detailTarget])

      return (
        <div className="space-y-6">
          <PageHeader
            title="Master Kelas"
            description="Kelola data kelas seluruh tahun ajaran"
            actions={
              <>
                <Button
                  variant="secondary"
                  leftIcon={<LayoutGrid size={16} />}
                  onClick={() => setBulkOpen(true)}
                >
                  Tambah Bulk
                </Button>
                <Button
                  leftIcon={<Plus size={16} />}
                  onClick={handleOpenCreate}
                >
                  Tambah Kelas
                </Button>
              </>
            }
          />

          <KelasFilters filters={filters} onChange={setFilters} />

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-200 p-4 md:p-6">
            <KelasTable
              data={kelasList}
              isLoading={isLoading}
              isError={isError}
              onRowClick={(kelas) => setDetailTarget(kelas)}
              onEdit={handleOpenEdit}
              onDelete={(kelas) => setDeleteTarget(kelas)}
              onNavigateSiswa={handleNavigateSiswa}
              activeId={detailTarget?.id}
            />
          </div>

          <KelasFormModal
            open={formOpen}
            onClose={() => setFormOpen(false)}
            editData={editTarget}
          />

          <KelasFormBulkModal
            open={bulkOpen}
            onClose={() => setBulkOpen(false)}
          />

          <KelasDetailPanel
            kelas={detailTarget}
            onClose={() => setDetailTarget(null)}
            onEdit={handleOpenEdit}
            onDelete={(kelas) => setDeleteTarget(kelas)}
            onNavigateSiswa={handleNavigateSiswa}
          />

          <ConfirmModal
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            title="Hapus Kelas"
            onConfirm={handleConfirmDelete}
            isisLoading={deleteMutation.isPending}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Yakin ingin menghapus kelas{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {deleteTarget?.namaKelas}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </p>
          </ConfirmModal>
        </div>
      )
    }
""")

# 2. KelasFilters.tsx
files["src/app/dashboard/kelas/_components/KelasFilters.tsx"] = textwrap.dedent("""\
    'use client'

    import { useCallback } from 'react'
    import { SearchInput, Select } from '@/components/ui'
    import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
    import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
    import type { KelasFilterParams } from '@/types/kelas.types'

    interface Props {
      filters: KelasFilterParams
      onChange: (filters: KelasFilterParams) => void
    }

    export function KelasFilters({ filters, onChange }: Props) {
      const { data: tahunAjaranData } = useTahunAjaranList()
      const { data: tingkatKelasData } = useTingkatKelasList()

      const tahunAjaranOptions = [
        { label: 'Semua Tahun Ajaran', value: '' },
        ...(tahunAjaranData?.data ?? []).map((t) => ({ label: t.nama, value: t.id })),
      ]

      const tingkatKelasOptions = [
        { label: 'Semua Tingkat', value: '' },
        ...(tingkatKelasData?.data ?? []).map((t) => ({ label: t.nama, value: t.id })),
      ]

      const handleSearch = useCallback((v: string) => {
        onChange({ ...filters, namaKelas: v || undefined })
      }, [filters, onChange])

      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              placeholder="Cari nama kelas..."
              value={filters.namaKelas ?? ''}
              onValueChange={handleSearch}
            />
          </div>
          <div className="w-full sm:w-52">
            <Select
              options={tahunAjaranOptions}
              value={filters.tahunAjaranId ?? ''}
              onChange={(v) => onChange({ ...filters, tahunAjaranId: v || undefined })}
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              options={tingkatKelasOptions}
              value={filters.tingkatKelasId ?? ''}
              onChange={(v) => onChange({ ...filters, tingkatKelasId: v || undefined })}
            />
          </div>
        </div>
      )
    }
""")

# 3. KelasTable.tsx
files["src/app/dashboard/kelas/_components/KelasTable.tsx"] = textwrap.dedent("""\
    'use client'

    import { Users, Pencil, Trash2, ExternalLink } from 'lucide-react'
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
    }

    export function KelasTable({ data, isLoading, isError, activeId, onRowClick, onEdit, onDelete, onNavigateSiswa }: Props) {
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
                      <Badge variant="secondary">{kelas.tingkatKelas.nama}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">
                      {kelas.waliKelas?.profile.namaLengkap ?? (
                        <span className="text-gray-400 italic text-xs">Belum ditentukan</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">
                      {kelas.ruangan ?? <span className="text-gray-400 italic text-xs">—</span>}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); onNavigateSiswa(kelas.id) }}
                        className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline text-xs font-medium"
                      >
                        <Users className="h-3.5 w-3.5" />
                        Daftar Siswa
                      </button>
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
                  'rounded-xl border p-4 cursor-pointer transition-colors bg-white dark:bg-gray-900',
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
                  <Badge variant="secondary">{kelas.tingkatKelas.nama}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <span><span className="font-medium text-gray-700 dark:text-gray-300">Wali: </span>{kelas.waliKelas?.profile.namaLengkap ?? '—'}</span>
                  <span><span className="font-medium text-gray-700 dark:text-gray-300">Ruangan: </span>{kelas.ruangan ?? '—'}</span>
                </div>
                <div className="mt-3 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onNavigateSiswa(kelas.id)}
                    className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium"
                  >
                    <Users className="h-3.5 w-3.5" />
                    Daftar Siswa
                    <ExternalLink className="h-3 w-3" />
                  </button>
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
""")

# 4. KelasFormModal.tsx
files["src/app/dashboard/kelas/_components/KelasFormModal.tsx"] = textwrap.dedent("""\
    'use client'

    import { useEffect } from 'react'
    import { useForm, Controller } from 'react-hook-form'
    import { zodResolver } from '@hookform/resolvers/zod'
    import { z } from 'zod'
    import { Modal, Button, Input, Select } from '@/components/ui'
    import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
    import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
    import { useCreateKelas, useUpdateKelas, useWaliKelasList } from '@/hooks/kelas/useKelas'
    import type { Kelas } from '@/types/kelas.types'

    const schema = z.object({
      tahunAjaranId:  z.string().min(1, 'Tahun ajaran wajib dipilih'),
      tingkatKelasId: z.string().min(1, 'Tingkat kelas wajib dipilih'),
      namaKelas:      z.string().min(1, 'Nama kelas wajib diisi').max(50),
      kodeKelas:      z.string().max(20).optional().or(z.literal('')),
      waliKelasId:    z.string().optional().or(z.literal('')),
      kuotaMaksimal:  z.coerce.number().int().min(1).max(100).optional(),
      ruangan:        z.string().max(50).optional().or(z.literal('')),
    })

    type FormValues = z.infer<typeof schema>

    const FORM_ID = 'kelas-form'

    interface Props {
      open: boolean
      onClose: () => void
      editData: Kelas | null
    }

    export function KelasFormModal({ open, onClose, editData }: Props) {
      const isEdit = !!editData

      const { data: tahunAjaranData }  = useTahunAjaranList()
      const { data: tingkatKelasData } = useTingkatKelasList()
      const { data: waliKelasList }    = useWaliKelasList()

      const createMutation = useCreateKelas()
      const updateMutation = useUpdateKelas(editData?.id ?? '')
      const isPending = createMutation.isPending || updateMutation.isPending

      const tahunAjaranOptions = [
        { label: 'Pilih Tahun Ajaran', value: '' },
        ...(tahunAjaranData?.data ?? []).map((t) => ({ label: t.nama, value: t.id })),
      ]
      const tingkatKelasOptions = [
        { label: 'Pilih Tingkat Kelas', value: '' },
        ...(tingkatKelasData?.data ?? []).map((t) => ({ label: t.nama, value: t.id })),
      ]
      const waliKelasOptions = [
        { label: '— Belum ditentukan —', value: '' },
        ...(waliKelasList ?? []).map((u) => ({
          label: u.profile.nip ? `${u.profile.namaLengkap} (${u.profile.nip})` : u.profile.namaLengkap,
          value: u.id,
        })),
      ]

      const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { tahunAjaranId: '', tingkatKelasId: '', namaKelas: '', kodeKelas: '', waliKelasId: '', kuotaMaksimal: 36, ruangan: '' },
      })

      useEffect(() => {
        if (!open) return
        reset(editData ? {
          tahunAjaranId:  editData.tahunAjaranId,
          tingkatKelasId: editData.tingkatKelasId,
          namaKelas:      editData.namaKelas,
          kodeKelas:      editData.kodeKelas ?? '',
          waliKelasId:    editData.waliKelasId ?? '',
          kuotaMaksimal:  editData.kuotaMaksimal,
          ruangan:        editData.ruangan ?? '',
        } : { tahunAjaranId: '', tingkatKelasId: '', namaKelas: '', kodeKelas: '', waliKelasId: '', kuotaMaksimal: 36, ruangan: '' })
      }, [open, editData?.id])

      const onSubmit = handleSubmit((values) => {
        const dto = {
          tahunAjaranId:  values.tahunAjaranId,
          tingkatKelasId: values.tingkatKelasId,
          namaKelas:      values.namaKelas,
          kodeKelas:      values.kodeKelas || undefined,
          waliKelasId:    values.waliKelasId || undefined,
          kuotaMaksimal:  values.kuotaMaksimal,
          ruangan:        values.ruangan || undefined,
        }
        if (isEdit) updateMutation.mutate(dto, { onSuccess: onClose })
        else        createMutation.mutate(dto, { onSuccess: onClose })
      })

      return (
        <Modal
          open={open}
          onClose={onClose}
          title={isEdit ? 'Edit Kelas' : 'Tambah Kelas Baru'}
          size="lg"
          footer={
            <>
              <Button variant="secondary" type="button" onClick={onClose} disabled={isPending}>Batal</Button>
              <Button type="submit" form={FORM_ID} loading={isPending}>
                {isEdit ? 'Simpan Perubahan' : 'Tambah Kelas'}
              </Button>
            </>
          }
        >
          <form id={FORM_ID} onSubmit={onSubmit}>
            <div className="p-6 space-y-4">

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tahun Ajaran <span className="text-red-500">*</span></label>
                <Controller name="tahunAjaranId" control={control} render={({ field }) => (
                  <Select options={tahunAjaranOptions} value={field.value} onChange={field.onChange} />
                )} />
                {errors.tahunAjaranId && <p className="text-xs text-red-500">{errors.tahunAjaranId.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tingkat Kelas <span className="text-red-500">*</span></label>
                <Controller name="tingkatKelasId" control={control} render={({ field }) => (
                  <Select options={tingkatKelasOptions} value={field.value} onChange={field.onChange} />
                )} />
                {errors.tingkatKelasId && <p className="text-xs text-red-500">{errors.tingkatKelasId.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Kelas <span className="text-red-500">*</span></label>
                <Input {...register('namaKelas')} placeholder="Contoh: XII IPA 1" error={errors.namaKelas?.message} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kode Kelas</label>
                  <Input {...register('kodeKelas')} placeholder="XII-IPA-1" error={errors.kodeKelas?.message} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ruangan</label>
                  <Input {...register('ruangan')} placeholder="Lab. IPA" error={errors.ruangan?.message} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Wali Kelas</label>
                <Controller name="waliKelasId" control={control} render={({ field }) => (
                  <Select options={waliKelasOptions} value={field.value ?? ''} onChange={field.onChange} />
                )} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kuota Maksimal Siswa</label>
                <Input {...register('kuotaMaksimal')} type="number" min={1} max={100} placeholder="36" error={errors.kuotaMaksimal?.message} />
              </div>

            </div>
          </form>
        </Modal>
      )
    }
""")

# 5. KelasDetailPanel.tsx
files["src/app/dashboard/kelas/_components/KelasDetailPanel.tsx"] = textwrap.dedent("""\
    'use client'

    import { Users, Pencil, Trash2, BookOpen, MapPin, User, Hash, ExternalLink, BarChart3 } from 'lucide-react'
    import { SlideOver, Button, Badge, Skeleton } from '@/components/ui'
    import { useKelasStatistik } from '@/hooks/kelas/useKelas'
    import type { Kelas } from '@/types/kelas.types'

    interface Props {
      kelas: Kelas | null
      onClose: () => void
      onEdit: (kelas: Kelas) => void
      onDelete: (kelas: Kelas) => void
      onNavigateSiswa: (kelasId: string) => void
    }

    export function KelasDetailPanel({ kelas, onClose, onEdit, onDelete, onNavigateSiswa }: Props) {
      const { data: statistik, isLoading: loadingStatistik } = useKelasStatistik(kelas?.id ?? null)

      return (
        <SlideOver
          open={!!kelas}
          onClose={onClose}
          title={kelas?.namaKelas ?? 'Detail Kelas'}
        >
          {kelas && (
            <div className="space-y-6 pb-6">

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{kelas.tahunAjaran.nama}</Badge>
                <Badge variant="primary">{kelas.tingkatKelas.nama}</Badge>
                {kelas.kodeKelas && <Badge variant="outline">{kelas.kodeKelas}</Badge>}
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/60 overflow-hidden">
                <InfoRow icon={<User className="h-4 w-4 text-gray-400" />} label="Wali Kelas" value={kelas.waliKelas?.profile.namaLengkap ?? 'Belum ditentukan'} />
                <InfoRow icon={<MapPin className="h-4 w-4 text-gray-400" />} label="Ruangan" value={kelas.ruangan ?? '—'} />
                <InfoRow icon={<Hash className="h-4 w-4 text-gray-400" />} label="Kuota Maksimal" value={`${kelas.kuotaMaksimal} siswa`} />
                <InfoRow icon={<BookOpen className="h-4 w-4 text-gray-400" />} label="Tahun Ajaran" value={kelas.tahunAjaran.nama} />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Statistik Siswa</h3>
                </div>

                {loadingStatistik ? (
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
                  </div>
                ) : statistik ? (
                  <>
                    <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 space-y-1.5">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Terisi: <span className="font-semibold text-gray-900 dark:text-white">{statistik.berdasarkanStatus.AKTIF}</span></span>
                        <span>Kuota: <span className="font-semibold text-gray-900 dark:text-white">{statistik.kuotaMaksimal}</span></span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${Math.min((statistik.berdasarkanStatus.AKTIF / statistik.kuotaMaksimal) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 text-right">
                        Sisa: <span className={statistik.sisaKuota <= 0 ? 'text-red-500 font-semibold' : 'text-emerald-600 font-semibold'}>{statistik.sisaKuota}</span>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <StatCard label="Laki-laki" value={statistik.berdasarkanGender.L} color="blue" />
                      <StatCard label="Perempuan" value={statistik.berdasarkanGender.P} color="pink" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(['AKTIF', 'PINDAH', 'KELUAR', 'LULUS', 'DO'] as const).map((s) => (
                        <div key={s} className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700/60 px-3 py-2">
                          <span className="text-xs text-gray-500">{s}</span>
                          <span className="text-xs font-bold">{statistik.berdasarkanStatus[s] ?? 0}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <p className="text-sm text-gray-400 italic">Data statistik tidak tersedia</p>}
              </div>

              <Button className="w-full" leftIcon={<Users className="h-4 w-4" />} onClick={() => onNavigateSiswa(kelas.id)}>
                Lihat Daftar Siswa
              </Button>

              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => onEdit(kelas)}>
                  Edit Kelas
                </Button>
                <Button variant="ghost" onClick={() => onDelete(kelas)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

            </div>
          )}
        </SlideOver>
      )
    }

    function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
      return (
        <div className="flex items-center gap-3 px-4 py-3">
          {icon}
          <span className="text-xs text-gray-500 dark:text-gray-400 w-28 shrink-0">{label}</span>
          <span className="text-sm text-gray-900 dark:text-white font-medium">{value}</span>
        </div>
      )
    }

    function StatCard({ label, value, color }: { label: string; value: number; color: 'blue' | 'pink' }) {
      const cls = color === 'blue'
        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
        : 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300'
      return (
        <div className={`rounded-xl p-3 flex flex-col items-center gap-1 ${cls}`}>
          <span className="text-2xl font-bold">{value}</span>
          <span className="text-xs font-medium">{label}</span>
        </div>
      )
    }
""")

# 6. KelasFormBulkModal.tsx
files["src/app/dashboard/kelas/_components/KelasFormBulkModal.tsx"] = textwrap.dedent("""\
    'use client'

    import { useState, useMemo } from 'react'
    import { useForm, Controller } from 'react-hook-form'
    import { zodResolver } from '@hookform/resolvers/zod'
    import { z } from 'zod'
    import { CheckCircle2, Loader2 } from 'lucide-react'
    import { Modal, Button, Input, Select } from '@/components/ui'
    import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
    import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
    import { useWaliKelasList, kelasKeys } from '@/hooks/kelas/useKelas'
    import { useQueryClient } from '@tanstack/react-query'
    import { toast } from 'sonner'
    import api from '@/lib/axios'
    import type { CreateKelasDto } from '@/types/kelas.types'

    const FORM_ID = 'kelas-bulk-step1'

    const stepOneSchema = z.object({
      jumlahKelas:    z.coerce.number().int().min(1, 'Minimal 1').max(100, 'Maksimal 100'),
      tahunAjaranId:  z.string().min(1, 'Pilih tahun ajaran'),
      tingkatKelasId: z.string().min(1, 'Pilih tingkat kelas'),
    })
    type StepOneValues = z.infer<typeof stepOneSchema>

    interface KelasRow { namaKelas: string; kodeKelas: string; waliKelasId: string; ruangan: string; kuotaMaksimal: string }

    type Step = 'config' | 'form' | 'done'

    interface Props { open: boolean; onClose: () => void }

    export function KelasFormBulkModal({ open, onClose }: Props) {
      const [step, setStep]         = useState<Step>('config')
      const [config, setConfig]     = useState<StepOneValues | null>(null)
      const [rows, setRows]         = useState<KelasRow[]>([])
      const [submitting, setSubmitting] = useState(false)
      const [results, setResults]   = useState({ ok: 0, fail: 0 })

      const { data: tahunAjaranData }  = useTahunAjaranList()
      const { data: tingkatKelasData } = useTingkatKelasList()
      const { data: waliKelasList }    = useWaliKelasList()
      const qc = useQueryClient()

      const tahunAjaranOptions = [
        { label: 'Pilih Tahun Ajaran', value: '' },
        ...(tahunAjaranData?.data ?? []).map((t) => ({ label: t.nama, value: t.id })),
      ]
      const tingkatKelasOptions = [
        { label: 'Pilih Tingkat Kelas', value: '' },
        ...(tingkatKelasData?.data ?? []).map((t) => ({ label: t.nama, value: t.id })),
      ]
      const waliKelasOptions = [
        { label: '— Belum ditentukan —', value: '' },
        ...(waliKelasList ?? []).map((u) => ({
          label: u.profile.nip ? `${u.profile.namaLengkap} (${u.profile.nip})` : u.profile.namaLengkap,
          value: u.id,
        })),
      ]

      const { register, handleSubmit, control, reset: resetStep1, formState: { errors } } = useForm<StepOneValues>({
        resolver: zodResolver(stepOneSchema),
        defaultValues: { jumlahKelas: 6, tahunAjaranId: '', tingkatKelasId: '' },
      })

      const handleStep1 = handleSubmit((values) => {
        setConfig(values)
        setRows(Array.from({ length: values.jumlahKelas }, () => ({ namaKelas: '', kodeKelas: '', waliKelasId: '', ruangan: '', kuotaMaksimal: '36' })))
        setStep('form')
      })

      const updateRow = (i: number, field: keyof KelasRow, value: string) =>
        setRows((prev) => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row))

      const validRows = useMemo(() => rows.filter((r) => r.namaKelas.trim() !== ''), [rows])

      const tahunAjaranNama = tahunAjaranData?.data?.find((t) => t.id === config?.tahunAjaranId)?.nama ?? ''
      const tingkatNama     = tingkatKelasData?.data?.find((t) => t.id === config?.tingkatKelasId)?.nama ?? ''

      const handleSubmitBulk = async () => {
        if (!config || validRows.length === 0) return
        setSubmitting(true)
        let ok = 0, fail = 0
        for (const row of validRows) {
          const dto: CreateKelasDto = {
            tahunAjaranId:  config.tahunAjaranId,
            tingkatKelasId: config.tingkatKelasId,
            namaKelas:      row.namaKelas.trim(),
            kodeKelas:      row.kodeKelas.trim() || undefined,
            waliKelasId:    row.waliKelasId || undefined,
            ruangan:        row.ruangan.trim() || undefined,
            kuotaMaksimal:  row.kuotaMaksimal ? parseInt(row.kuotaMaksimal) : undefined,
          }
          try {
            await api.post('/kelas', dto)
            ok++
          } catch { fail++ }
        }
        await qc.invalidateQueries({ queryKey: kelasKeys.all })
        setResults({ ok, fail })
        setSubmitting(false)
        setStep('done')
        if (fail === 0) toast.success(`${ok} kelas berhasil dibuat`)
        else            toast.warning(`${ok} berhasil, ${fail} gagal`)
      }

      const handleClose = () => {
        setStep('config')
        setConfig(null)
        setRows([])
        setResults({ ok: 0, fail: 0 })
        resetStep1()
        onClose()
      }

      return (
        <Modal open={open} onClose={handleClose} title="Tambah Kelas Bulk" size="xl"
          footer={
            step === 'config' ? (
              <>
                <Button variant="secondary" onClick={handleClose}>Batal</Button>
                <Button type="submit" form={FORM_ID}>Lanjut →</Button>
              </>
            ) : step === 'form' ? (
              <>
                <Button variant="secondary" onClick={() => setStep('config')}>← Kembali</Button>
                <Button variant="ghost" onClick={handleClose}>Batal</Button>
                <Button onClick={handleSubmitBulk} disabled={submitting || validRows.length === 0}
                  leftIcon={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}>
                  {submitting ? 'Menyimpan...' : `Simpan ${validRows.length} Kelas`}
                </Button>
              </>
            ) : (
              <Button className="w-full" onClick={handleClose}>Tutup</Button>
            )
          }
        >
          <div className="p-6">

            {/* STEP 1: Config */}
            {step === 'config' && (
              <form id={FORM_ID} onSubmit={handleStep1} className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tentukan jumlah kelas dan parameter globalnya. Setelah itu Anda akan mengisi detail tiap kelas.
                </p>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Berapa kelas yang akan dibuat? <span className="text-red-500">*</span></label>
                  <Input {...register('jumlahKelas')} type="number" min={1} max={100} placeholder="6" error={errors.jumlahKelas?.message} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tahun Ajaran <span className="text-red-500">*</span></label>
                  <Controller name="tahunAjaranId" control={control} render={({ field }) => (
                    <Select options={tahunAjaranOptions} value={field.value} onChange={field.onChange} />
                  )} />
                  {errors.tahunAjaranId && <p className="text-xs text-red-500">{errors.tahunAjaranId.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tingkat Kelas <span className="text-red-500">*</span></label>
                  <Controller name="tingkatKelasId" control={control} render={({ field }) => (
                    <Select options={tingkatKelasOptions} value={field.value} onChange={field.onChange} />
                  )} />
                  {errors.tingkatKelasId && <p className="text-xs text-red-500">{errors.tingkatKelasId.message}</p>}
                </div>
              </form>
            )}

            {/* STEP 2: Form tabel */}
            {step === 'form' && config && (
              <div className="space-y-4">
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300 flex flex-wrap gap-x-6 gap-y-1">
                  <span><span className="font-medium">Tahun Ajaran:</span> {tahunAjaranNama}</span>
                  <span><span className="font-medium">Tingkat:</span> {tingkatNama}</span>
                  <span><span className="font-medium">Jumlah baris:</span> {config.jumlahKelas}</span>
                </div>
                <p className="text-xs text-gray-400">
                  Isi kolom <span className="font-semibold text-gray-600 dark:text-gray-300">Nama Kelas</span> untuk menyimpan baris tersebut. Baris kosong akan dilewati.
                </p>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2 text-center w-8">#</th>
                        <th className="px-3 py-2 text-left min-w-[140px]">Nama Kelas <span className="text-red-400">*</span></th>
                        <th className="px-3 py-2 text-left min-w-[120px]">Kode Kelas</th>
                        <th className="px-3 py-2 text-left min-w-[180px]">Wali Kelas</th>
                        <th className="px-3 py-2 text-left min-w-[120px]">Ruangan</th>
                        <th className="px-3 py-2 text-left min-w-[80px]">Kuota</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-900">
                      {rows.map((row, i) => (
                        <tr key={i} className={row.namaKelas.trim() ? 'bg-emerald-50/40 dark:bg-emerald-900/10' : ''}>
                          <td className="px-3 py-2 text-center text-gray-400 font-mono">{i + 1}</td>
                          <td className="px-2 py-1.5">
                            <input value={row.namaKelas} onChange={(e) => updateRow(i, 'namaKelas', e.target.value)}
                              placeholder="XII IPA 1" style={{ fontSize: '16px' }}
                              className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input value={row.kodeKelas} onChange={(e) => updateRow(i, 'kodeKelas', e.target.value)}
                              placeholder="XII-IPA-1" style={{ fontSize: '16px' }}
                              className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          </td>
                          <td className="px-2 py-1.5">
                            <select value={row.waliKelasId} onChange={(e) => updateRow(i, 'waliKelasId', e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                              {waliKelasOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <input value={row.ruangan} onChange={(e) => updateRow(i, 'ruangan', e.target.value)}
                              placeholder="Lab. IPA" style={{ fontSize: '16px' }}
                              className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input value={row.kuotaMaksimal} onChange={(e) => updateRow(i, 'kuotaMaksimal', e.target.value)}
                              type="number" min={1} max={100} placeholder="36"
                              className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 text-right">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{validRows.length}</span> dari {config.jumlahKelas} kelas siap disimpan
                </p>
              </div>
            )}

            {/* STEP 3: Done */}
            {step === 'done' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <CheckCircle2 className="h-14 w-14 text-emerald-500" />
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">Selesai!</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span className="text-emerald-600 font-semibold">{results.ok} kelas</span> berhasil dibuat
                    {results.fail > 0 && <>, <span className="text-red-500 font-semibold">{results.fail} kelas</span> gagal</>}.
                  </p>
                </div>
              </div>
            )}

          </div>
        </Modal>
      )
    }
""")

# ============================================================
# BATCH 4 REWRITE
# ============================================================

# 7. page.tsx kelas siswa
files["src/app/dashboard/kelas/[id]/siswa/page.tsx"] = textwrap.dedent("""\
    'use client'

    import { useState, useCallback } from 'react'
    import { useParams, useRouter } from 'next/navigation'
    import { ArrowLeft, Plus, Upload, Copy } from 'lucide-react'
    import { PageHeader, Button, SearchInput, Select } from '@/components/ui'
    import { useKelasById } from '@/hooks/kelas/useKelas'
    import { useSiswaByKelas } from '@/hooks/kelas/useKelasSiswa'
    import { KelasInfoCards } from './_components/KelasInfoCards'
    import { KelasSiswaTable } from './_components/KelasSiswaTable'
    import { TambahSiswaModal } from './_components/TambahSiswaModal'
    import { TambahSiswaBulkModal } from './_components/TambahSiswaBulkModal'
    import { MutasiSiswaModal } from './_components/MutasiSiswaModal'
    import { SiswaDetailPanel } from './_components/SiswaDetailPanel'
    import { CopySiswaModal } from './_components/CopySiswaModal'
    import { StatusSiswa } from '@/types/kelas.types'
    import type { KelasSiswa } from '@/types/kelas.types'

    const STATUS_OPTIONS = [
      { label: 'Semua Status', value: '' },
      { label: 'Aktif', value: StatusSiswa.AKTIF },
      { label: 'Pindah', value: StatusSiswa.PINDAH },
      { label: 'Keluar', value: StatusSiswa.KELUAR },
      { label: 'Lulus', value: StatusSiswa.LULUS },
      { label: 'DO', value: StatusSiswa.DO },
      { label: 'Mengundurkan Diri', value: StatusSiswa.MENGUNDURKAN_DIRI },
    ]

    export default function KelasSiswaPage() {
      const params  = useParams<{ id: string }>()
      const router  = useRouter()
      const kelasId = params.id

      const [search, setSearch]           = useState('')
      const [statusFilter, setStatusFilter] = useState('')
      const [tambahOpen, setTambahOpen]   = useState(false)
      const [bulkOpen, setBulkOpen]       = useState(false)
      const [copyOpen, setCopyOpen]       = useState(false)
      const [mutasiTarget, setMutasiTarget] = useState<KelasSiswa | null>(null)
      const [detailTarget, setDetailTarget] = useState<KelasSiswa | null>(null)

      const { data: kelasData, isLoading: loadingKelas } = useKelasById(kelasId)
      const { data: siswaData, isLoading: loadingSiswa } = useSiswaByKelas(kelasId)
      const allSiswa = siswaData?.data ?? []

      const filteredSiswa = allSiswa.filter((ks) => {
        const matchSearch = search === '' ||
          ks.siswa.profile.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
          (ks.siswa.profile.nisn ?? '').includes(search)
        const matchStatus = statusFilter === '' || ks.status === statusFilter
        return matchSearch && matchStatus
      })

      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
            <PageHeader
              title={loadingKelas ? 'Memuat...' : `Daftar Siswa — ${kelasData?.namaKelas ?? ''}`}
              description={kelasData ? `${kelasData.tahunAjaran.nama} · ${kelasData.tingkatKelas.nama}` : undefined}
              actions={
                <>
                  <Button size="sm" variant="secondary" leftIcon={<Copy size={14} />} onClick={() => setCopyOpen(true)}>
                    <span className="hidden sm:inline">Salin dari TA Lalu</span>
                  </Button>
                  <Button size="sm" variant="secondary" leftIcon={<Upload size={14} />} onClick={() => setBulkOpen(true)}>
                    <span className="hidden sm:inline">Tambah Bulk</span>
                  </Button>
                  <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setTambahOpen(true)}>
                    Tambah Siswa
                  </Button>
                </>
              }
            />
          </div>

          <KelasInfoCards kelas={kelasData ?? null} siswaList={allSiswa} />

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex-1 min-w-[200px]">
              <SearchInput placeholder="Cari nama / NISN siswa..." value={search} onValueChange={setSearch} />
            </div>
            <div className="w-full sm:w-52">
              <Select options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-200 p-4 md:p-6">
            <KelasSiswaTable
              data={filteredSiswa}
              isLoading={loadingSiswa}
              activeId={detailTarget?.id}
              onRowClick={(ks) => setDetailTarget(ks)}
              onMutasi={(ks) => setMutasiTarget(ks)}
            />
          </div>

          <TambahSiswaModal open={tambahOpen} onClose={() => setTambahOpen(false)} kelasId={kelasId} />
          <TambahSiswaBulkModal open={bulkOpen} onClose={() => setBulkOpen(false)} kelasId={kelasId} tahunAjaranId={kelasData?.tahunAjaranId ?? ''} />
          <CopySiswaModal open={copyOpen} onClose={() => setCopyOpen(false)} kelasId={kelasId} namaKelas={kelasData?.namaKelas ?? ''} />
          <MutasiSiswaModal open={!!mutasiTarget} onClose={() => setMutasiTarget(null)} kelasSiswa={mutasiTarget} kelasId={kelasId} />
          <SiswaDetailPanel kelasSiswa={detailTarget} onClose={() => setDetailTarget(null)} onMutasi={(ks) => { setDetailTarget(null); setMutasiTarget(ks) }} />
        </div>
      )
    }
""")

# 8. KelasInfoCards.tsx — tidak berubah strukturnya, hanya import
files["src/app/dashboard/kelas/[id]/siswa/_components/KelasInfoCards.tsx"] = textwrap.dedent("""\
    'use client'

    import { BookOpen, UserCheck, DoorOpen, GraduationCap } from 'lucide-react'
    import { Skeleton } from '@/components/ui'
    import { StatusSiswa } from '@/types/kelas.types'
    import type { Kelas, KelasSiswa } from '@/types/kelas.types'

    interface Props { kelas: Kelas | null; siswaList: KelasSiswa[] }

    export function KelasInfoCards({ kelas, siswaList }: Props) {
      const aktif  = siswaList.filter((s) => s.status === StatusSiswa.AKTIF).length
      const pindah = siswaList.filter((s) => s.status === StatusSiswa.PINDAH).length
      const keluar = siswaList.filter((s) => [StatusSiswa.KELUAR, StatusSiswa.DO, StatusSiswa.MENGUNDURKAN_DIRI].includes(s.status)).length
      const lulus  = siswaList.filter((s) => s.status === StatusSiswa.LULUS).length

      if (!kelas) return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      )

      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InfoCard icon={<BookOpen className="h-4 w-4" />} label="Kelas" value={kelas.namaKelas} sub={kelas.waliKelas?.profile.namaLengkap ?? 'Belum ada wali kelas'} color="emerald" />
          <InfoCard icon={<UserCheck className="h-4 w-4" />} label="Siswa Aktif" value={String(aktif)} sub={`dari ${kelas.kuotaMaksimal} kuota`} color="blue" />
          <InfoCard icon={<DoorOpen className="h-4 w-4" />} label="Pindah / Keluar" value={String(pindah + keluar)} sub={`${pindah} pindah · ${keluar} keluar`} color="yellow" />
          <InfoCard icon={<GraduationCap className="h-4 w-4" />} label="Lulus" value={String(lulus)} sub="Seluruh masa aktif" color="purple" />
        </div>
      )
    }

    type Color = 'emerald' | 'blue' | 'yellow' | 'purple'
    const colorCls: Record<Color, { bg: string; icon: string; value: string }> = {
      emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400', value: 'text-emerald-700 dark:text-emerald-300' },
      blue:    { bg: 'bg-blue-50 dark:bg-blue-900/20',       icon: 'text-blue-600 dark:text-blue-400',       value: 'text-blue-700 dark:text-blue-300' },
      yellow:  { bg: 'bg-yellow-50 dark:bg-yellow-900/20',   icon: 'text-yellow-600 dark:text-yellow-400',   value: 'text-yellow-700 dark:text-yellow-300' },
      purple:  { bg: 'bg-purple-50 dark:bg-purple-900/20',   icon: 'text-purple-600 dark:text-purple-400',   value: 'text-purple-700 dark:text-purple-300' },
    }

    function InfoCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: Color }) {
      const cls = colorCls[color]
      return (
        <div className={`rounded-xl p-4 flex flex-col gap-1 ${cls.bg}`}>
          <div className={`flex items-center gap-1.5 text-xs font-medium ${cls.icon}`}>{icon}{label}</div>
          <p className={`text-xl font-bold ${cls.value}`}>{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{sub}</p>
        </div>
      )
    }
""")

# 9. KelasSiswaTable.tsx
files["src/app/dashboard/kelas/[id]/siswa/_components/KelasSiswaTable.tsx"] = textwrap.dedent("""\
    'use client'

    import { ArrowRightLeft } from 'lucide-react'
    import { Button, Badge, Skeleton, EmptyState } from '@/components/ui'
    import { StatusSiswa } from '@/types/kelas.types'
    import type { KelasSiswa } from '@/types/kelas.types'

    interface Props {
      data: KelasSiswa[]
      isLoading: boolean
      activeId?: string
      onRowClick: (ks: KelasSiswa) => void
      onMutasi: (ks: KelasSiswa) => void
    }

    const statusConfig: Record<StatusSiswa, { label: string; variant: 'success' | 'warning' | 'danger' | 'secondary' | 'outline' }> = {
      [StatusSiswa.AKTIF]:             { label: 'Aktif',       variant: 'success' },
      [StatusSiswa.PINDAH]:            { label: 'Pindah',      variant: 'warning' },
      [StatusSiswa.KELUAR]:            { label: 'Keluar',      variant: 'danger' },
      [StatusSiswa.LULUS]:             { label: 'Lulus',       variant: 'secondary' },
      [StatusSiswa.DO]:                { label: 'DO',          variant: 'danger' },
      [StatusSiswa.MENGUNDURKAN_DIRI]: { label: 'Undur Diri',  variant: 'outline' },
    }

    export function KelasSiswaTable({ data, isLoading, activeId, onRowClick, onMutasi }: Props) {
      if (isLoading) return <KelasSiswaTableSkeleton />
      if (data.length === 0) return <EmptyState title="Tidak ada siswa" description="Belum ada siswa atau tidak cocok dengan filter." />

      return (
        <>
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="pb-3 text-center w-14 font-medium">No. Absen</th>
                  <th className="pb-3 text-left font-medium">Nama Lengkap</th>
                  <th className="pb-3 text-left font-medium">NISN</th>
                  <th className="pb-3 text-center font-medium">L/P</th>
                  <th className="pb-3 text-center font-medium">Status</th>
                  <th className="pb-3 text-center font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {data.map((ks) => {
                  const cfg = statusConfig[ks.status]
                  return (
                    <tr key={ks.id} onClick={() => onRowClick(ks)}
                      className={['cursor-pointer transition-colors hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10', activeId === ks.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''].join(' ')}
                    >
                      <td className="py-3 text-center font-mono text-gray-500">{ks.nomorAbsen ?? '—'}</td>
                      <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{ks.siswa.profile.namaLengkap}</td>
                      <td className="py-3 pr-4 font-mono text-gray-500 dark:text-gray-400 text-xs">{ks.siswa.profile.nisn ?? '—'}</td>
                      <td className="py-3 text-center text-gray-500">{ks.siswa.profile.jenisKelamin}</td>
                      <td className="py-3 text-center"><Badge variant={cfg.variant}>{cfg.label}</Badge></td>
                      <td className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" onClick={() => onMutasi(ks)} className="flex items-center gap-1 text-xs">
                          <ArrowRightLeft className="h-3.5 w-3.5" />Mutasi
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-2 md:hidden">
            {data.map((ks) => {
              const cfg = statusConfig[ks.status]
              return (
                <div key={ks.id} onClick={() => onRowClick(ks)}
                  className={['rounded-xl border p-4 cursor-pointer transition-colors bg-white dark:bg-gray-900', activeId === ks.id ? 'border-emerald-500' : 'border-gray-200 dark:border-gray-700'].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-400 w-6 shrink-0">{ks.nomorAbsen ?? '—'}</span>
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{ks.siswa.profile.namaLengkap}</p>
                      </div>
                      <p className="text-xs text-gray-400 font-mono mt-0.5 ml-8">{ks.siswa.profile.nisn ? `NISN: ${ks.siswa.profile.nisn}` : '—'} · {ks.siswa.profile.jenisKelamin}</p>
                    </div>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                  <div className="mt-3 flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => onMutasi(ks)} className="flex items-center gap-1 text-xs">
                      <ArrowRightLeft className="h-3.5 w-3.5" />Mutasi
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )
    }

    function KelasSiswaTableSkeleton() {
      return (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center py-2 border-b border-gray-50 dark:border-gray-800/60">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-7 w-16 ml-auto" />
            </div>
          ))}
        </div>
      )
    }
""")

# 10. TambahSiswaModal.tsx
files["src/app/dashboard/kelas/[id]/siswa/_components/TambahSiswaModal.tsx"] = textwrap.dedent("""\
    'use client'

    import { useState, useMemo } from 'react'
    import { useForm } from 'react-hook-form'
    import { zodResolver } from '@hookform/resolvers/zod'
    import { z } from 'zod'
    import { Search } from 'lucide-react'
    import { Modal, Button, Input } from '@/components/ui'
    import { useQuery } from '@tanstack/react-query'
    import api from '@/lib/axios'
    import { useTambahSiswa } from '@/hooks/kelas/useKelasSiswa'
    import type { UserByRole } from '@/types/kelas.types'

    const FORM_ID = 'tambah-siswa-form'

    const schema = z.object({
      siswaId:      z.string().min(1, 'Pilih siswa terlebih dahulu'),
      tanggalMasuk: z.string().min(1, 'Tanggal masuk wajib diisi'),
    })
    type FormValues = z.infer<typeof schema>

    interface Props { open: boolean; onClose: () => void; kelasId: string }

    export function TambahSiswaModal({ open, onClose, kelasId }: Props) {
      const [searchQuery, setSearchQuery]     = useState('')
      const [selectedSiswa, setSelectedSiswa] = useState<UserByRole | null>(null)

      const { data: siswaList = [], isLoading } = useQuery({
        queryKey: ['users', 'by-role', 'SISWA'],
        queryFn: () => api.get('/users/by-role/SISWA').then((r) => r.data as UserByRole[]),
        enabled: open,
        staleTime: 1000 * 60 * 5,
      })

      const filteredSiswa = useMemo(() => {
        if (!searchQuery.trim()) return siswaList.slice(0, 20)
        const q = searchQuery.toLowerCase()
        return siswaList.filter((s) =>
          s.profile.namaLengkap.toLowerCase().includes(q) || (s.profile.nisn ?? '').includes(q)
        ).slice(0, 20)
      }, [siswaList, searchQuery])

      const mutation = useTambahSiswa(kelasId)

      const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { siswaId: '', tanggalMasuk: '' },
      })

      const handleSelect = (siswa: UserByRole) => {
        setSelectedSiswa(siswa)
        setValue('siswaId', siswa.id, { shouldValidate: true })
        setSearchQuery('')
      }

      const handleClose = () => {
        reset()
        setSelectedSiswa(null)
        setSearchQuery('')
        onClose()
      }

      const onSubmit = handleSubmit((values) => {
        mutation.mutate({ siswaId: values.siswaId, tanggalMasuk: values.tanggalMasuk }, { onSuccess: handleClose })
      })

      return (
        <Modal open={open} onClose={handleClose} title="Tambah Siswa ke Kelas"
          footer={
            <>
              <Button variant="secondary" onClick={handleClose}>Batal</Button>
              <Button type="submit" form={FORM_ID} loading={mutation.isPending}>Tambah Siswa</Button>
            </>
          }
        >
          <form id={FORM_ID} onSubmit={onSubmit}>
            <div className="p-6 space-y-4">

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cari Siswa <span className="text-red-500">*</span></label>
                {selectedSiswa ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedSiswa.profile.namaLengkap}</p>
                      <p className="text-xs text-gray-500">{selectedSiswa.profile.nisn ? `NISN: ${selectedSiswa.profile.nisn}` : 'Tanpa NISN'}</p>
                    </div>
                    <button type="button" onClick={() => { setSelectedSiswa(null); setValue('siswaId', '') }} className="text-xs text-red-500 hover:text-red-700">Ganti</button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ketik nama atau NISN..." value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)} style={{ fontSize: '16px' }}
                    />
                    {searchQuery.length >= 1 && (
                      <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
                        {isLoading ? <p className="px-4 py-3 text-sm text-gray-400">Memuat...</p>
                          : filteredSiswa.length === 0 ? <p className="px-4 py-3 text-sm text-gray-400">Siswa tidak ditemukan</p>
                          : filteredSiswa.map((s) => (
                            <button key={s.id} type="button" onClick={() => handleSelect(s)}
                              className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{s.profile.namaLengkap}</p>
                              <p className="text-xs text-gray-400">{s.profile.nisn ? `NISN: ${s.profile.nisn}` : 'Tanpa NISN'}</p>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
                <input type="hidden" {...register('siswaId')} />
                {errors.siswaId && <p className="text-xs text-red-500">{errors.siswaId.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Masuk <span className="text-red-500">*</span></label>
                <Input {...register('tanggalMasuk')} type="date" error={errors.tanggalMasuk?.message} />
              </div>

            </div>
          </form>
        </Modal>
      )
    }
""")

# 11. TambahSiswaBulkModal.tsx
files["src/app/dashboard/kelas/[id]/siswa/_components/TambahSiswaBulkModal.tsx"] = textwrap.dedent("""\
    'use client'

    import { useState, useMemo } from 'react'
    import { useForm } from 'react-hook-form'
    import { zodResolver } from '@hookform/resolvers/zod'
    import { z } from 'zod'
    import { Search } from 'lucide-react'
    import { Modal, Button, Input, Skeleton } from '@/components/ui'
    import { useQuery } from '@tanstack/react-query'
    import api from '@/lib/axios'
    import { useTambahSiswaBulk } from '@/hooks/kelas/useKelasSiswa'
    import type { UserByRole } from '@/types/kelas.types'

    const FORM_ID = 'tambah-siswa-bulk-form'

    const schema = z.object({ tanggalMasuk: z.string().min(1, 'Tanggal masuk wajib diisi') })
    type FormValues = z.infer<typeof schema>

    interface Props { open: boolean; onClose: () => void; kelasId: string; tahunAjaranId: string }

    export function TambahSiswaBulkModal({ open, onClose, kelasId, tahunAjaranId }: Props) {
      const [searchQuery, setSearchQuery] = useState('')
      const [selected, setSelected]       = useState<Set<string>>(new Set())

      const { data: siswaList = [], isLoading } = useQuery({
        queryKey: ['users', 'by-role', 'SISWA'],
        queryFn: () => api.get('/users/by-role/SISWA').then((r) => r.data as UserByRole[]),
        enabled: open,
        staleTime: 1000 * 60 * 5,
      })

      const filteredSiswa = useMemo(() => {
        if (!searchQuery.trim()) return siswaList
        const q = searchQuery.toLowerCase()
        return siswaList.filter((s) => s.profile.namaLengkap.toLowerCase().includes(q) || (s.profile.nisn ?? '').includes(q))
      }, [siswaList, searchQuery])

      const mutation = useTambahSiswaBulk(kelasId)

      const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { tanggalMasuk: '' },
      })

      const toggleSelect = (id: string) => setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id); else next.add(id)
        return next
      })

      const allFilteredSelected = filteredSiswa.length > 0 && filteredSiswa.every((s) => selected.has(s.id))
      const toggleAll = () => setSelected(allFilteredSelected ? new Set() : new Set(filteredSiswa.map((s) => s.id)))

      const handleClose = () => { reset(); setSelected(new Set()); setSearchQuery(''); onClose() }

      const onSubmit = handleSubmit((values) => {
        const payload = Array.from(selected).map((siswaId) => ({ siswaId, tanggalMasuk: values.tanggalMasuk }))
        mutation.mutate({ siswa: payload }, { onSuccess: handleClose })
      })

      return (
        <Modal open={open} onClose={handleClose} title="Tambah Siswa Bulk" size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={handleClose}>Batal</Button>
              <Button type="submit" form={FORM_ID} loading={mutation.isPending} disabled={selected.size === 0}>
                Tambah {selected.size} Siswa
              </Button>
            </>
          }
        >
          <form id={FORM_ID} onSubmit={onSubmit}>
            <div className="p-6 space-y-4">

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Masuk (untuk semua) <span className="text-red-500">*</span></label>
                <Input {...register('tanggalMasuk')} type="date" error={errors.tanggalMasuk?.message} />
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Cari nama atau NISN..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} style={{ fontSize: '16px' }} />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{selected.size} siswa dipilih</span>
                {filteredSiswa.length > 0 && (
                  <button type="button" onClick={toggleAll} className="text-emerald-600 dark:text-emerald-400 hover:underline">
                    {allFilteredSelected ? 'Batal pilih semua' : 'Pilih semua'}
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/60">
                {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded" />
                    <div className="flex-1"><Skeleton className="h-4 w-40 mb-1" /><Skeleton className="h-3 w-24" /></div>
                  </div>
                )) : filteredSiswa.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-gray-400">Tidak ada siswa ditemukan</p>
                ) : filteredSiswa.map((s) => (
                  <label key={s.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-emerald-600 accent-emerald-600"
                      checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.profile.namaLengkap}</p>
                      <p className="text-xs text-gray-400 font-mono">{s.profile.nisn ? `NISN: ${s.profile.nisn}` : 'Tanpa NISN'}</p>
                    </div>
                  </label>
                ))}
              </div>

            </div>
          </form>
        </Modal>
      )
    }
""")

# 12. CopySiswaModal.tsx
files["src/app/dashboard/kelas/[id]/siswa/_components/CopySiswaModal.tsx"] = textwrap.dedent("""\
    'use client'

    import { Copy } from 'lucide-react'
    import { Modal, Button } from '@/components/ui'
    import { useCopySiswaKelas } from '@/hooks/kelas/useKelas'

    interface Props { open: boolean; onClose: () => void; kelasId: string; namaKelas: string }

    export function CopySiswaModal({ open, onClose, kelasId, namaKelas }: Props) {
      const mutation = useCopySiswaKelas(kelasId)
      return (
        <Modal open={open} onClose={onClose} title="Salin Siswa dari Tahun Ajaran Lalu"
          footer={
            <>
              <Button variant="secondary" onClick={onClose}>Batal</Button>
              <Button leftIcon={<Copy className="h-4 w-4" />} loading={mutation.isPending}
                onClick={() => mutation.mutate(undefined, { onSuccess: onClose })}>
                Ya, Salin Siswa
              </Button>
            </>
          }
        >
          <div className="p-6">
            <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 p-4 text-sm text-yellow-800 dark:text-yellow-300 space-y-2">
              <p>Fitur ini akan menyalin seluruh siswa <strong>aktif</strong> dari kelas yang sama di tahun ajaran sebelumnya ke kelas <strong>{namaKelas}</strong>.</p>
              <p>Siswa yang sudah ada di kelas ini tidak akan diduplikat.</p>
            </div>
          </div>
        </Modal>
      )
    }
""")

# 13. MutasiSiswaModal.tsx
files["src/app/dashboard/kelas/[id]/siswa/_components/MutasiSiswaModal.tsx"] = textwrap.dedent("""\
    'use client'

    import { useEffect, useState } from 'react'
    import { useForm, Controller } from 'react-hook-form'
    import { zodResolver } from '@hookform/resolvers/zod'
    import { z } from 'zod'
    import { Modal, Button, Input, Select } from '@/components/ui'
    import { useKelasList } from '@/hooks/kelas/useKelas'
    import { usePindahSiswa, useKeluarkanSiswa } from '@/hooks/kelas/useKelasSiswa'
    import { StatusSiswa } from '@/types/kelas.types'
    import type { KelasSiswa } from '@/types/kelas.types'

    type TipeMutasi = 'PINDAH' | 'KELUAR'

    const schemaPindah = z.object({
      kelasBaruId:   z.string().min(1, 'Pilih kelas tujuan'),
      tanggalPindah: z.string().min(1, 'Tanggal pindah wajib diisi'),
      alasan:        z.string().optional(),
    })
    const schemaKeluar = z.object({
      status:        z.enum([StatusSiswa.KELUAR, StatusSiswa.DO, StatusSiswa.MENGUNDURKAN_DIRI, StatusSiswa.LULUS], { required_error: 'Pilih status' }),
      tanggalKeluar: z.string().min(1, 'Tanggal keluar wajib diisi'),
      alasan:        z.string().optional(),
    })

    type PindahValues = z.infer<typeof schemaPindah>
    type KeluarValues = z.infer<typeof schemaKeluar>

    const STATUS_KELUAR_OPTIONS = [
      { label: 'Pilih status keluar', value: '' },
      { label: 'Keluar', value: StatusSiswa.KELUAR },
      { label: 'Lulus', value: StatusSiswa.LULUS },
      { label: 'Drop Out (DO)', value: StatusSiswa.DO },
      { label: 'Mengundurkan Diri', value: StatusSiswa.MENGUNDURKAN_DIRI },
    ]

    interface Props { open: boolean; onClose: () => void; kelasSiswa: KelasSiswa | null; kelasId: string }

    export function MutasiSiswaModal({ open, onClose, kelasSiswa, kelasId }: Props) {
      const [tipeMutasi, setTipeMutasi] = useState<TipeMutasi>('PINDAH')

      const { data: kelasData }      = useKelasList()
      const pindahMutation           = usePindahSiswa(kelasId)
      const keluarMutation           = useKeluarkanSiswa(kelasId)

      const kelasOptions = [
        { label: 'Pilih kelas tujuan', value: '' },
        ...(kelasData?.data ?? []).filter((k) => k.id !== kelasId).map((k) => ({ label: k.namaKelas, value: k.id })),
      ]

      const pindahForm = useForm<PindahValues>({ resolver: zodResolver(schemaPindah), defaultValues: { kelasBaruId: '', tanggalPindah: '', alasan: '' } })
      const keluarForm = useForm<KeluarValues>({ resolver: zodResolver(schemaKeluar), defaultValues: { tanggalKeluar: '', alasan: '' } })

      useEffect(() => {
        if (!open) return
        setTipeMutasi('PINDAH')
        pindahForm.reset()
        keluarForm.reset()
      }, [open])

      const isPending = pindahMutation.isPending || keluarMutation.isPending

      const handlePindah = pindahForm.handleSubmit((values) => {
        if (!kelasSiswa) return
        pindahMutation.mutate({ siswaId: kelasSiswa.siswaId, dto: { kelasBaruId: values.kelasBaruId, tanggalPindah: values.tanggalPindah, alasan: values.alasan || undefined } }, { onSuccess: onClose })
      })

      const handleKeluar = keluarForm.handleSubmit((values) => {
        if (!kelasSiswa) return
        keluarMutation.mutate({ siswaId: kelasSiswa.siswaId, dto: { tanggalKeluar: values.tanggalKeluar, status: values.status, alasan: values.alasan || undefined } }, { onSuccess: onClose })
      })

      const PINDAH_FORM_ID = 'mutasi-pindah-form'
      const KELUAR_FORM_ID = 'mutasi-keluar-form'

      return (
        <Modal open={open} onClose={onClose} title={`Mutasi — ${kelasSiswa?.siswa.profile.namaLengkap ?? ''}`} size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={onClose}>Batal</Button>
              {tipeMutasi === 'PINDAH'
                ? <Button type="submit" form={PINDAH_FORM_ID} loading={isPending}>Pindahkan Siswa</Button>
                : <Button type="submit" form={KELUAR_FORM_ID} loading={isPending} className="bg-red-600 hover:bg-red-700">Keluarkan Siswa</Button>
              }
            </>
          }
        >
          <div className="p-6 space-y-4">

            {/* Toggle */}
            <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {(['PINDAH', 'KELUAR'] as TipeMutasi[]).map((tipe) => (
                <button key={tipe} type="button" onClick={() => setTipeMutasi(tipe)}
                  className={['flex-1 py-2.5 text-sm font-medium transition-colors',
                    tipeMutasi === tipe ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                  ].join(' ')}>
                  {tipe === 'PINDAH' ? 'Pindah Kelas' : 'Keluar / Lulus / DO'}
                </button>
              ))}
            </div>

            {/* Form Pindah */}
            {tipeMutasi === 'PINDAH' && (
              <form id={PINDAH_FORM_ID} onSubmit={handlePindah} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kelas Tujuan <span className="text-red-500">*</span></label>
                  <Controller name="kelasBaruId" control={pindahForm.control} render={({ field }) => (
                    <Select options={kelasOptions} value={field.value} onChange={field.onChange} />
                  )} />
                  {pindahForm.formState.errors.kelasBaruId && <p className="text-xs text-red-500">{pindahForm.formState.errors.kelasBaruId.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Pindah <span className="text-red-500">*</span></label>
                  <Input {...pindahForm.register('tanggalPindah')} type="date" error={pindahForm.formState.errors.tanggalPindah?.message} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alasan (opsional)</label>
                  <textarea {...pindahForm.register('alasan')} rows={3} placeholder="Alasan kepindahan..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                </div>
              </form>
            )}

            {/* Form Keluar */}
            {tipeMutasi === 'KELUAR' && (
              <form id={KELUAR_FORM_ID} onSubmit={handleKeluar} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status Keluar <span className="text-red-500">*</span></label>
                  <Controller name="status" control={keluarForm.control} render={({ field }) => (
                    <Select options={STATUS_KELUAR_OPTIONS} value={field.value ?? ''} onChange={(val) => field.onChange(val as KeluarValues['status'])} />
                  )} />
                  {keluarForm.formState.errors.status && <p className="text-xs text-red-500">{keluarForm.formState.errors.status.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Keluar <span className="text-red-500">*</span></label>
                  <Input {...keluarForm.register('tanggalKeluar')} type="date" error={keluarForm.formState.errors.tanggalKeluar?.message} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alasan (opsional)</label>
                  <textarea {...keluarForm.register('alasan')} rows={3} placeholder="Alasan keluar..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                </div>
              </form>
            )}

          </div>
        </Modal>
      )
    }
""")

# 14. SiswaDetailPanel.tsx
files["src/app/dashboard/kelas/[id]/siswa/_components/SiswaDetailPanel.tsx"] = textwrap.dedent("""\
    'use client'

    import { User, Heart, Calendar, BarChart3, BookOpen, Award, CheckCircle2, ArrowRightLeft } from 'lucide-react'
    import { SlideOver, Button, Badge, Skeleton } from '@/components/ui'
    import { useAbsensiRekapSiswa, useCatatanSikapRekap, usePrestasiSiswa, useNilaiRaporSiswa } from '@/hooks/kelas/useKelasSiswa'
    import { formatTanggalSaja } from '@/lib/helpers/timezone'
    import { StatusSiswa } from '@/types/kelas.types'
    import type { KelasSiswa } from '@/types/kelas.types'

    interface Props {
      kelasSiswa: KelasSiswa | null
      onClose: () => void
      onMutasi: (ks: KelasSiswa) => void
    }

    const statusConfig: Record<StatusSiswa, { label: string; variant: 'success' | 'warning' | 'danger' | 'secondary' | 'outline' }> = {
      [StatusSiswa.AKTIF]:             { label: 'Aktif',      variant: 'success' },
      [StatusSiswa.PINDAH]:            { label: 'Pindah',     variant: 'warning' },
      [StatusSiswa.KELUAR]:            { label: 'Keluar',     variant: 'danger' },
      [StatusSiswa.LULUS]:             { label: 'Lulus',      variant: 'secondary' },
      [StatusSiswa.DO]:                { label: 'DO',         variant: 'danger' },
      [StatusSiswa.MENGUNDURKAN_DIRI]: { label: 'Undur Diri', variant: 'outline' },
    }

    export function SiswaDetailPanel({ kelasSiswa, onClose, onMutasi }: Props) {
      const siswaId = kelasSiswa?.siswaId ?? null
      const profil  = kelasSiswa?.siswa.profile

      const { data: absensi,      isLoading: loadAbsensi  } = useAbsensiRekapSiswa(siswaId)
      const { data: sikap,        isLoading: loadSikap    } = useCatatanSikapRekap(siswaId)
      const { data: prestasiResp, isLoading: loadPrestasi } = usePrestasiSiswa(siswaId)
      const { data: nilaiResp,    isLoading: loadNilai    } = useNilaiRaporSiswa(siswaId)

      const prestasi  = prestasiResp?.data ?? []
      const nilaiList = nilaiResp?.data ?? []

      return (
        <SlideOver open={!!kelasSiswa} onClose={onClose} title={profil?.namaLengkap ?? 'Detail Siswa'} width="lg">
          {kelasSiswa && profil && (
            <div className="space-y-6 pb-6">

              {/* Avatar + status */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {profil.fotoUrl
                    ? <img src={profil.fotoUrl} alt={profil.namaLengkap} className="h-full w-full object-cover" />
                    : <User className="h-8 w-8 text-gray-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white truncate">{profil.namaLengkap}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {profil.nisn ? `NISN: ${profil.nisn}` : 'Tanpa NISN'} · {profil.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </p>
                  <div className="mt-1">
                    <Badge variant={statusConfig[kelasSiswa.status].variant}>{statusConfig[kelasSiswa.status].label}</Badge>
                  </div>
                </div>
              </div>

              {/* Info Pribadi */}
              <Section title="Informasi Pribadi" icon={<User className="h-4 w-4" />}>
                <Field label="TTL" value={`${profil.tempatLahir}, ${formatTanggalSaja(profil.tanggalLahir)}`} />
                <Field label="Agama" value={profil.agama} />
                <Field label="Alamat" value={profil.alamat ?? '—'} />
                {profil.noWa && <Field label="WhatsApp" value={profil.noWa} />}
                <Field label="No. Absen" value={kelasSiswa.nomorAbsen ? String(kelasSiswa.nomorAbsen) : '—'} />
                <Field label="Tanggal Masuk" value={formatTanggalSaja(kelasSiswa.tanggalMasuk)} />
              </Section>

              {/* Orang Tua */}
              <Section title="Data Orang Tua" icon={<Heart className="h-4 w-4" />}>
                <Field label="Nama Ayah" value={profil.namaAyah ?? '—'} />
                <Field label="Pekerjaan Ayah" value={profil.pekerjaanAyah ?? '—'} />
                <Field label="Nama Ibu" value={profil.namaIbu ?? '—'} />
                <Field label="Pekerjaan Ibu" value={profil.pekerjaanIbu ?? '—'} />
                {profil.namaWali && <Field label="Nama Wali" value={`${profil.namaWali} (${profil.hubunganWali ?? 'Wali'})`} />}
              </Section>

              {/* Absensi */}
              <Section title="Rekap Absensi" icon={<Calendar className="h-4 w-4" />}>
                {loadAbsensi ? <StatsSkeleton count={4} />
                  : absensi ? (
                    <div className="grid grid-cols-4 gap-2">
                      <StatCard label="Hadir" value={absensi.hadir}  color="emerald" />
                      <StatCard label="Sakit" value={absensi.sakit}  color="blue" />
                      <StatCard label="Izin"  value={absensi.izin}   color="yellow" />
                      <StatCard label="Alpa"  value={absensi.alpa}   color="red" />
                    </div>
                  ) : <Placeholder text="Data absensi belum tersedia" />}
              </Section>

              {/* Poin Sikap */}
              <Section title="Poin Sikap" icon={<BarChart3 className="h-4 w-4" />}>
                {loadSikap ? <StatsSkeleton count={3} />
                  : sikap ? (
                    <div className="grid grid-cols-3 gap-2">
                      <StatCard label="Positif"    value={sikap.totalPositif} color="emerald" />
                      <StatCard label="Negatif"    value={sikap.totalNegatif} color="red" />
                      <StatCard label="Total Poin" value={sikap.totalPoin}    color="blue" />
                    </div>
                  ) : <Placeholder text="Data sikap belum tersedia" />}
              </Section>

              {/* Nilai Rapor */}
              <Section title="Nilai Rapor" icon={<BookOpen className="h-4 w-4" />}>
                {loadNilai ? <StatsSkeleton count={3} />
                  : nilaiList.length > 0 ? (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/60 overflow-hidden">
                      {nilaiList.map((n, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2">
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{n.mataPelajaran}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{n.nilai}</span>
                            <Badge variant="secondary">{n.predikat}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <Placeholder text="Belum ada data nilai rapor" />}
              </Section>

              {/* Prestasi */}
              <Section title="Prestasi" icon={<Award className="h-4 w-4" />}>
                {loadPrestasi ? <StatsSkeleton count={2} />
                  : prestasi.length > 0 ? (
                    <div className="space-y-2">
                      {prestasi.map((p) => (
                        <div key={p.id} className="rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{p.nama}</p>
                            <Badge variant="secondary">{p.peringkat}</Badge>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{p.tingkat} · {formatTanggalSaja(p.tanggal)}</p>
                        </div>
                      ))}
                    </div>
                  ) : <Placeholder text="Belum ada prestasi tercatat" />}
              </Section>

              {/* Ekskul placeholder */}
              <Section title="Ekstrakurikuler" icon={<CheckCircle2 className="h-4 w-4" />}>
                <Placeholder text="Data ekstrakurikuler belum tersedia (endpoint dalam pengembangan)" />
              </Section>

              {kelasSiswa.status === StatusSiswa.AKTIF && (
                <Button className="w-full" variant="secondary" leftIcon={<ArrowRightLeft className="h-4 w-4" />} onClick={() => onMutasi(kelasSiswa)}>
                  Mutasi / Ubah Status
                </Button>
              )}

            </div>
          )}
        </SlideOver>
      )
    }

    function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">
            <span className="text-gray-400">{icon}</span>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{title}</h3>
          </div>
          {children}
        </div>
      )
    }

    function Field({ label, value }: { label: string; value: string }) {
      if (!value || value === '—') return null
      return (
        <div className="space-y-0.5">
          <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-sm text-gray-800 dark:text-gray-200">{value}</p>
        </div>
      )
    }

    type StatColor = 'emerald' | 'blue' | 'yellow' | 'red'
    const statColorMap: Record<StatColor, string> = {
      emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
      blue:    'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
      yellow:  'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
      red:     'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    }

    function StatCard({ label, value, color }: { label: string; value: number; color: StatColor }) {
      return (
        <div className={`rounded-xl p-2.5 flex flex-col items-center gap-0.5 ${statColorMap[color]}`}>
          <span className="text-lg font-bold">{value}</span>
          <span className="text-xs">{label}</span>
        </div>
      )
    }

    function StatsSkeleton({ count }: { count: number }) {
      return (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
          {Array.from({ length: count }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      )
    }

    function Placeholder({ text }: { text: string }) {
      return <p className="text-sm text-gray-400 italic py-1">{text}</p>
    }
""")

# ─── Writer ───────────────────────────────────────────────────────────────────

def write_files(base_dir: str = ".") -> None:
    for rel_path, content in files.items():
        full_path = os.path.join(base_dir, rel_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  {rel_path}")

if __name__ == "__main__":
    import sys
    base = sys.argv[1] if len(sys.argv) > 1 else "."
    write_files(base)
    print(f"\nRewrite selesai — {len(files)} files")