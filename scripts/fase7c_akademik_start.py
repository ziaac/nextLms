"""
FASE 7C (REVISED) — Mata Pelajaran & Mata Pelajaran per Tingkat

Arsitektur yang benar:
  - MataPelajaran = master induk (kode, nama, kategori, dll)
  - MataPelajaranTingkat = entitas utama yang dipakai sistem
    (MataPelajaran + Tingkat + pool Guru pengajar)

Halaman:
  /dashboard/mata-pelajaran        → CRUD master mapel (simpel)
  /dashboard/mata-pelajaran-tingkat → entitas utama + guru pool (SlideOver)

Jalankan dari ROOT project:
    python scripts/fase7c_revised.py
"""

import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def p(rel: str) -> str:
    return os.path.join(BASE, rel.replace("/", os.sep))


def write(label: str, path: str, content: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    mode = "diupdate" if os.path.exists(path) else "dibuat"
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    icon = "🔄" if mode == "diupdate" else "✅"
    print(f"  {icon} [{mode}]  {label}")


files: dict[str, str] = {}

# ============================================================
# src/types/akademik.types.ts  — update dengan GuruMapel
# ============================================================
files["src/types/akademik.types.ts"] = """\
// ============================================================
// FASE 7C — Tingkat Kelas, Mata Pelajaran & MapelTingkat Types
// ============================================================

export type Jenjang       = 'SMA' | 'MA'
export type KategoriMapel = 'WAJIB' | 'PEMINATAN' | 'LINTAS_MINAT' | 'MULOK' | 'PENGEMBANGAN_DIRI'
export type KelompokMapel = 'A' | 'B' | 'C'

// ── Tingkat Kelas ─────────────────────────────────────────────
export interface TingkatKelas {
  id:      string
  nama:    string
  jenjang: Jenjang
  urutan:  number
  createdAt: string
  updatedAt: string
}

export interface CreateTingkatKelasPayload {
  nama:    string
  jenjang: Jenjang
  urutan:  number
}

export interface UpdateTingkatKelasPayload extends Partial<CreateTingkatKelasPayload> {}

// ── Mata Pelajaran (master induk) ─────────────────────────────
export interface MataPelajaran {
  id:        string
  kode:      string
  nama:      string
  kategori:  KategoriMapel
  kelompok:  KelompokMapel
  kkm:       number
  bobot:     number
  deskripsi?: string
  isActive:  boolean
  createdAt: string
  updatedAt: string
}

export interface CreateMataPelajaranPayload {
  kode:       string
  nama:       string
  kategori:   KategoriMapel
  kelompok:   KelompokMapel
  kkm:        number
  bobot?:     number
  deskripsi?: string
  isActive?:  boolean
}

export interface UpdateMataPelajaranPayload extends Partial<CreateMataPelajaranPayload> {}

export interface FilterMataPelajaranParams {
  kategori?: KategoriMapel
  kelompok?: KelompokMapel
  search?:   string
  isActive?: boolean
}

// ── Guru (minimal — dari response guruMapel) ──────────────────
export interface GuruItem {
  id: string
  profile: {
    namaLengkap: string
    fotoUrl?: string | null
  }
}

// ── GuruMapel (relasi guru ke mapel-tingkat) ──────────────────
export interface GuruMapel {
  id:                    string
  mataPelajaranTingkatId: string
  guruId:                string
  guru:                  GuruItem
}

// ── MataPelajaranTingkat (entitas utama yang dipakai sistem) ──
export interface MataPelajaranTingkat {
  id:              string
  mataPelajaranId: string
  tingkatKelasId:  string
  mataPelajaran:   Pick<MataPelajaran, 'id' | 'kode' | 'nama' | 'kategori'>
  tingkatKelas:    Pick<TingkatKelas, 'id' | 'nama' | 'jenjang'>
  guruMapel:       GuruMapel[]
  createdAt:       string
}

export interface CreateMapelTingkatPayload {
  mataPelajaranId: string
  tingkatKelasId:  string
}

export interface SetGuruPoolPayload {
  guruIds: string[]
}
"""

# ============================================================
# src/types/index.ts
# ============================================================
files["src/types/index.ts"] = """\
export * from './api.types'
export * from './auth.types'
export * from './enums'
export * from './users.types'
export * from './tahun-ajaran.types'
export * from './akademik.types'
"""

# ============================================================
# src/lib/api/users.api.ts  — tambah getByRole
# ============================================================
files["src/lib/api/users.api.ts"] = """\
import api from '@/lib/axios'
import type { PaginatedResponse, PaginationParams } from '@/types'
import type { UserItem, UserDetail, CreateUserDto, UpdateUserDto } from '@/types/users.types'

export interface UsersParams extends PaginationParams {
  role?: string
  tahunMasuk?: number
}

export const usersApi = {
  getAll: async (params?: UsersParams): Promise<PaginatedResponse<UserItem>> => {
    const { data } = await api.get('/users', { params })
    return data
  },

  getById: async (id: string): Promise<UserDetail> => {
    const { data } = await api.get(`/users/${id}`)
    return data
  },

  /** GET /users/by-role/:role — list user tanpa pagination by role */
  getByRole: async (role: string): Promise<UserDetail[]> => {
    const { data } = await api.get(`/users/by-role/${role}`)
    return data
  },

  create: async (dto: CreateUserDto): Promise<UserDetail> => {
    const { data } = await api.post('/users', dto)
    return data
  },

  update: async (id: string, dto: UpdateUserDto): Promise<UserDetail> => {
    const { data } = await api.put(`/users/${id}`, dto)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`)
  },

  toggleActive: async (id: string): Promise<UserDetail> => {
    const { data } = await api.patch(`/users/${id}/toggle-active`, {})
    return data
  },

  resetPassword: async (id: string, newPassword: string): Promise<void> => {
    await api.patch(`/users/${id}/reset-password`, { newPassword })
  },
}
"""

# ============================================================
# src/lib/api/mapel-tingkat.api.ts  — update dengan guru ops
# ============================================================
files["src/lib/api/mapel-tingkat.api.ts"] = """\
import api from '@/lib/axios'
import type {
  MataPelajaranTingkat,
  CreateMapelTingkatPayload,
  SetGuruPoolPayload,
} from '@/types/akademik.types'

const BASE = '/mata-pelajaran-tingkat'

export const mapelTingkatApi = {
  /** GET ?tingkatKelasId=xxx */
  getByTingkat: async (tingkatKelasId: string): Promise<MataPelajaranTingkat[]> => {
    const res = await api.get<MataPelajaranTingkat[]>(BASE, { params: { tingkatKelasId } })
    return res.data
  },

  /** GET ?mataPelajaranId=xxx */
  getByMapel: async (mataPelajaranId: string): Promise<MataPelajaranTingkat[]> => {
    const res = await api.get<MataPelajaranTingkat[]>(BASE, { params: { mataPelajaranId } })
    return res.data
  },

  /** GET /:id */
  getOne: async (id: string): Promise<MataPelajaranTingkat> => {
    const res = await api.get<MataPelajaranTingkat>(`${BASE}/${id}`)
    return res.data
  },

  /** POST — create relasi mapel + tingkat */
  create: async (payload: CreateMapelTingkatPayload): Promise<MataPelajaranTingkat> => {
    const res = await api.post<MataPelajaranTingkat>(BASE, payload)
    return res.data
  },

  /** PUT /:id/guru — replace seluruh pool guru */
  setGuruPool: async (id: string, payload: SetGuruPoolPayload): Promise<MataPelajaranTingkat> => {
    const res = await api.put<MataPelajaranTingkat>(`${BASE}/${id}/guru`, payload)
    return res.data
  },

  /** POST /:id/guru/:guruId — tambah satu guru */
  addGuru: async (id: string, guruId: string): Promise<void> => {
    await api.post(`${BASE}/${id}/guru/${guruId}`)
  },

  /** DELETE /:id/guru/:guruId — hapus satu guru */
  removeGuru: async (id: string, guruId: string): Promise<void> => {
    await api.delete(`${BASE}/${id}/guru/${guruId}`)
  },

  /** DELETE /:id — hapus relasi mapel-tingkat */
  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`)
  },
}
"""

# ============================================================
# src/hooks/mata-pelajaran/useMataPelajaran.ts  — update
# ============================================================
files["src/hooks/mata-pelajaran/useMataPelajaran.ts"] = """\
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mataPelajaranApi }  from '@/lib/api/mata-pelajaran.api'
import { mapelTingkatApi }   from '@/lib/api/mapel-tingkat.api'
import { usersApi }          from '@/lib/api/users.api'
import type {
  CreateMataPelajaranPayload,
  UpdateMataPelajaranPayload,
  FilterMataPelajaranParams,
  CreateMapelTingkatPayload,
  SetGuruPoolPayload,
} from '@/types/akademik.types'

// ── Keys ──────────────────────────────────────────────────────
export const mataPelajaranKeys = {
  all:       (f?: FilterMataPelajaranParams) => ['mata-pelajaran', f ?? {}] as const,
  detail:    (id: string) => ['mata-pelajaran', id] as const,
}

export const mapelTingkatKeys = {
  byTingkat:  (id: string) => ['mapel-tingkat', 'by-tingkat', id] as const,
  byMapel:    (id: string) => ['mapel-tingkat', 'by-mapel', id] as const,
}

export const guruKeys = {
  all: ['guru-list'] as const,
}

// ── Mata Pelajaran (master) ───────────────────────────────────
export function useMataPelajaranList(filter?: FilterMataPelajaranParams) {
  return useQuery({
    queryKey: mataPelajaranKeys.all(filter),
    queryFn:  () => mataPelajaranApi.getAll(filter),
  })
}

export function useCreateMataPelajaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMataPelajaranPayload) => mataPelajaranApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mata-pelajaran'] }),
  })
}

export function useUpdateMataPelajaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMataPelajaranPayload }) =>
      mataPelajaranApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mata-pelajaran'] }),
  })
}

export function useToggleMataPelajaranActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mataPelajaranApi.toggleActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mata-pelajaran'] }),
  })
}

export function useDeleteMataPelajaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mataPelajaranApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mata-pelajaran'] }),
  })
}

// ── MapelTingkat ──────────────────────────────────────────────
export function useMapelTingkatByTingkat(tingkatKelasId: string | null) {
  return useQuery({
    queryKey: mapelTingkatKeys.byTingkat(tingkatKelasId ?? ''),
    queryFn:  () => mapelTingkatApi.getByTingkat(tingkatKelasId!),
    enabled:  !!tingkatKelasId,
    staleTime: 1000 * 60 * 3,
  })
}

export function useCreateMapelTingkat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMapelTingkatPayload) => mapelTingkatApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mapel-tingkat'] }),
  })
}

export function useDeleteMapelTingkat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mapelTingkatApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mapel-tingkat'] }),
  })
}

// ── Guru Pool ─────────────────────────────────────────────────
export function useGuruList() {
  return useQuery({
    queryKey: guruKeys.all,
    queryFn:  () => usersApi.getByRole('GURU'),
    staleTime: 1000 * 60 * 10,
  })
}

export function useSetGuruPool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SetGuruPoolPayload }) =>
      mapelTingkatApi.setGuruPool(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mapel-tingkat'] }),
  })
}

export function useAddGuru() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, guruId }: { id: string; guruId: string }) =>
      mapelTingkatApi.addGuru(id, guruId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mapel-tingkat'] }),
  })
}

export function useRemoveGuru() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, guruId }: { id: string; guruId: string }) =>
      mapelTingkatApi.removeGuru(id, guruId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mapel-tingkat'] }),
  })
}
"""

# ============================================================
# src/app/dashboard/mata-pelajaran/_components/MapelMasterTable.tsx
# CRUD master mapel — simpel
# ============================================================
files["src/app/dashboard/mata-pelajaran/_components/MapelMasterTable.tsx"] = """\
'use client'

import { useState } from 'react'
import { Badge, EmptyState, ConfirmModal } from '@/components/ui'
import {
  useToggleMataPelajaranActive,
  useDeleteMataPelajaran,
} from '@/hooks/mata-pelajaran/useMataPelajaran'
import type { MataPelajaran } from '@/types/akademik.types'

const KATEGORI_LABEL: Record<string, string> = {
  WAJIB: 'Wajib', PEMINATAN: 'Peminatan', LINTAS_MINAT: 'Lintas Minat',
  MULOK: 'Mulok', PENGEMBANGAN_DIRI: 'Pengembangan Diri',
}
const KATEGORI_VARIANT: Record<string, 'info'|'success'|'warning'|'purple'|'default'> = {
  WAJIB: 'info', PEMINATAN: 'success', LINTAS_MINAT: 'warning',
  MULOK: 'purple', PENGEMBANGAN_DIRI: 'default',
}

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

function MapelMasterRow({ mapel, onEdit }: { mapel: MataPelajaran; onEdit: () => void }) {
  const toggleMutation = useToggleMataPelajaranActive()
  const deleteMutation = useDeleteMataPelajaran()
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <>
      <tr className="border-b border-gray-100 dark:border-gray-700/50
        hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <td className="px-4 py-3">
          <span className="font-mono text-sm font-semibold text-gray-700 dark:text-gray-300">
            {mapel.kode}
          </span>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{mapel.nama}</p>
          {mapel.deskripsi && (
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{mapel.deskripsi}</p>
          )}
        </td>
        <td className="px-4 py-3">
          <Badge variant={KATEGORI_VARIANT[mapel.kategori] ?? 'default'} size="sm">
            {KATEGORI_LABEL[mapel.kategori] ?? mapel.kategori}
          </Badge>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{mapel.kelompok}</td>
        <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">{mapel.kkm}</td>
        <td className="px-4 py-3">
          <Badge variant={mapel.isActive ? 'success' : 'default'} size="sm">
            {mapel.isActive ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={() => toggleMutation.mutate(mapel.id)}
              disabled={toggleMutation.isPending}
              className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600/60
                text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700
                disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {mapel.isActive ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
            <button onClick={onEdit}
              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50
                dark:hover:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors">
              <PencilIcon />
            </button>
            <button onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50
                dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors">
              <TrashIcon />
            </button>
          </div>
        </td>
      </tr>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate(mapel.id, { onSuccess: () => setConfirmDelete(false) })}
        isLoading={deleteMutation.isPending}
        title="Hapus Mata Pelajaran"
        description={`Yakin hapus "${mapel.nama}"? Semua relasi ke tingkat kelas akan ikut terhapus.`}
        confirmLabel="Hapus"
        variant="danger"
      />
    </>
  )
}

export default function MapelMasterTable({ data, isLoading, onEdit }: {
  data: MataPelajaran[]; isLoading: boolean; onEdit: (m: MataPelajaran) => void
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1,2,3,4,5].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Belum ada mata pelajaran"
        description="Tambahkan mata pelajaran master terlebih dahulu."
      />
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-600/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-600/60">
            <tr>
              {['Kode','Nama','Kategori','Kelompok','KKM','Status','Aksi'].map((h, i) => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500
                  dark:text-gray-400 uppercase tracking-wider
                  ${i === 4 ? 'text-center' : i === 6 ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-700/50">
            {data.map((m) => (
              <MapelMasterRow key={m.id} mapel={m} onEdit={() => onEdit(m)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
"""

# ============================================================
# src/app/dashboard/mata-pelajaran/page.tsx — CRUD master mapel
# ============================================================
files["src/app/dashboard/mata-pelajaran/page.tsx"] = """\
'use client'

import { useState } from 'react'
import { PageHeader, Button } from '@/components/ui'
import { useMataPelajaranList } from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useDebounce } from '@/hooks/useDebounce'
import MapelMasterTable from './_components/MapelMasterTable'
import MapelFormModal   from './_components/MapelFormModal'
import MapelFilters     from './_components/MapelFilters'
import type { MataPelajaran, FilterMataPelajaranParams } from '@/types/akademik.types'

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

export default function MataPelajaranPage() {
  const [filter,   setFilter]   = useState<FilterMataPelajaranParams>({})
  const [formOpen, setFormOpen] = useState(false)
  const [editData, setEditData] = useState<MataPelajaran | null>(null)

  const debouncedSearch = useDebounce(filter.search, 300)
  const activeFilter    = { ...filter, search: debouncedSearch || undefined }
  const { data, isLoading } = useMataPelajaranList(activeFilter)

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title="Master Mata Pelajaran"
          description="Kelola daftar induk mata pelajaran. Untuk assign ke tingkat kelas, buka menu Mata Pelajaran per Tingkat."
          actions={
            <Button onClick={() => { setEditData(null); setFormOpen(true) }}>
              <span className="flex items-center gap-1.5">
                <PlusIcon />
                Tambah Mapel
              </span>
            </Button>
          }
        />

        {data && (
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span>{data.length} mata pelajaran</span>
            <span>·</span>
            <span>{data.filter((m) => m.isActive).length} aktif</span>
          </div>
        )}

        <MapelFilters filter={filter} onChange={setFilter} />

        <MapelMasterTable
          data={data ?? []}
          isLoading={isLoading}
          onEdit={(m) => { setEditData(m); setFormOpen(true) }}
        />
      </div>

      <MapelFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        data={editData}
      />
    </>
  )
}
"""

# ============================================================
# src/app/dashboard/mata-pelajaran-tingkat/_components/GuruSearchInput.tsx
# Search guru by nama — ketik → muncul pilihan → tambah ke pool
# ============================================================
files["src/app/dashboard/mata-pelajaran-tingkat/_components/GuruSearchInput.tsx"] = """\
'use client'

import { useState, useRef, useEffect } from 'react'
import { useGuruList } from '@/hooks/mata-pelajaran/useMataPelajaran'
import type { GuruItem } from '@/types/akademik.types'

interface Props {
  excludeIds: string[]         // guru yang sudah ada di pool
  onSelect:   (guru: GuruItem) => void
  disabled?:  boolean
}

export default function GuruSearchInput({ excludeIds, onSelect, disabled }: Props) {
  const [query,  setQuery]  = useState('')
  const [open,   setOpen]   = useState(false)
  const containerRef        = useRef<HTMLDivElement>(null)

  const { data: allGuru } = useGuruList()

  // Filter by query dan exclude yang sudah ada
  const filtered = (allGuru ?? []).filter((g) => {
    if (excludeIds.includes(g.id)) return false
    if (!query) return true
    return g.profile.namaLengkap.toLowerCase().includes(query.toLowerCase())
  })

  // Tutup dropdown saat klik luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (guru: GuruItem) => {
    onSelect(guru)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          placeholder="Ketik nama guru..."
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700/60
            bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            px-4 py-2.5 outline-none transition
            focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {/* Icon search */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Dropdown hasil pencarian */}
      {open && query.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50
          max-h-52 overflow-y-auto rounded-xl
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700/60
          shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 text-center">
              Tidak ada guru ditemukan
            </div>
          ) : (
            filtered.map((guru) => (
              <button
                key={guru.id}
                type="button"
                onClick={() => handleSelect(guru)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left
                  hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                  border-b border-gray-100 dark:border-gray-700/40 last:border-0
                  transition-colors"
              >
                {/* Avatar initials */}
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30
                  flex items-center justify-center flex-shrink-0
                  text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {guru.profile.namaLengkap.split(' ').slice(0,2).map(n => n[0]).join('')}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {guru.profile.namaLengkap}
                </span>
                {/* Plus icon */}
                <div className="ml-auto text-emerald-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
"""

# ============================================================
# src/app/dashboard/mata-pelajaran-tingkat/_components/MapelTingkatPanel.tsx
# SlideOver — detail MapelTingkat + manage guru pool
# ============================================================
files["src/app/dashboard/mata-pelajaran-tingkat/_components/MapelTingkatPanel.tsx"] = """\
'use client'

import { SlideOver, Badge } from '@/components/ui'
import {
  useAddGuru,
  useRemoveGuru,
} from '@/hooks/mata-pelajaran/useMataPelajaran'
import GuruSearchInput from './GuruSearchInput'
import type { MataPelajaranTingkat, GuruItem } from '@/types/akademik.types'

const KATEGORI_LABEL: Record<string, string> = {
  WAJIB: 'Wajib', PEMINATAN: 'Peminatan', LINTAS_MINAT: 'Lintas Minat',
  MULOK: 'Muatan Lokal', PENGEMBANGAN_DIRI: 'Pengembangan Diri',
}
const KATEGORI_VARIANT: Record<string, 'info'|'success'|'warning'|'purple'|'default'> = {
  WAJIB: 'info', PEMINATAN: 'success', LINTAS_MINAT: 'warning',
  MULOK: 'purple', PENGEMBANGAN_DIRI: 'default',
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2.5 space-y-0.5">
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{label}</p>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{value}</div>
    </div>
  )
}

interface Props {
  open:    boolean
  onClose: () => void
  item:    MataPelajaranTingkat | null
}

export default function MapelTingkatPanel({ open, onClose, item }: Props) {
  const addMutation    = useAddGuru()
  const removeMutation = useRemoveGuru()

  if (!item) return null

  const guruIds    = item.guruMapel.map((g) => g.guruId)
  const isPending  = addMutation.isPending || removeMutation.isPending

  const handleAddGuru = (guru: GuruItem) => {
    addMutation.mutate({ id: item.id, guruId: guru.id })
  }

  const handleRemoveGuru = (guruId: string) => {
    removeMutation.mutate({ id: item.id, guruId })
  }

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={`${item.mataPelajaran.nama} — Tingkat ${item.tingkatKelas.nama}`}
    >
      <div className="space-y-6">
        {/* Info */}
        <div className="grid grid-cols-2 gap-3">
          <InfoField label="Kode" value={item.mataPelajaran.kode} />
          <InfoField label="Tingkat" value={
            <Badge variant="info" size="sm">Tingkat {item.tingkatKelas.nama}</Badge>
          } />
          <InfoField label="Kategori" value={
            <Badge variant={KATEGORI_VARIANT[item.mataPelajaran.kategori] ?? 'default'} size="sm">
              {KATEGORI_LABEL[item.mataPelajaran.kategori] ?? item.mataPelajaran.kategori}
            </Badge>
          } />
          <InfoField label="Jenjang" value={item.tingkatKelas.jenjang} />
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700/50" />

        {/* Guru Pool */}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Pool Guru Pengajar
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Guru yang terdaftar dapat dipilih saat pembuatan jadwal
            </p>
          </div>

          {/* Search tambah guru */}
          <GuruSearchInput
            excludeIds={guruIds}
            onSelect={handleAddGuru}
            disabled={isPending}
          />

          {/* List guru yang sudah ada */}
          {item.guruMapel.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700/50
              px-4 py-6 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Belum ada guru — cari dan tambahkan di atas
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {item.guruMapel.map((gm) => (
                <div
                  key={gm.id}
                  className="flex items-center gap-3 px-3 py-2.5
                    rounded-xl border border-gray-200 dark:border-gray-600/60
                    bg-white dark:bg-gray-800"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30
                    flex items-center justify-center flex-shrink-0
                    text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {gm.guru.profile.namaLengkap.split(' ').slice(0,2).map(n => n[0]).join('')}
                  </div>

                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                    {gm.guru.profile.namaLengkap}
                  </span>

                  {/* Hapus */}
                  <button
                    onClick={() => handleRemoveGuru(gm.guruId)}
                    disabled={removeMutation.isPending}
                    title="Hapus dari pool"
                    className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600
                      hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                      disabled:opacity-40 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Count summary */}
          {item.guruMapel.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              {item.guruMapel.length} guru terdaftar
            </p>
          )}
        </div>
      </div>
    </SlideOver>
  )
}
"""

# ============================================================
# src/app/dashboard/mata-pelajaran-tingkat/_components/MapelTingkatFormModal.tsx
# Form tambah: pilih mapel master + pilih tingkat
# ============================================================
files["src/app/dashboard/mata-pelajaran-tingkat/_components/MapelTingkatFormModal.tsx"] = """\
'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, Button, Select } from '@/components/ui'
import {
  useCreateMapelTingkat,
} from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useMataPelajaranList } from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
import { getErrorMessage } from '@/lib/utils'

const schema = z.object({
  mataPelajaranId: z.string().min(1, 'Mata pelajaran wajib dipilih'),
  tingkatKelasId:  z.string().min(1, 'Tingkat kelas wajib dipilih'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open:    boolean
  onClose: () => void
}

export default function MapelTingkatFormModal({ open, onClose }: Props) {
  const createMutation = useCreateMapelTingkat()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const formTopRef                    = useRef<HTMLDivElement>(null)

  const { data: allMapel   } = useMataPelajaranList({ isActive: true })
  const { data: allTingkat } = useTingkatKelasList()

  const mapelOptions = (allMapel ?? []).map((m) => ({
    value: m.id,
    label: `[${m.kode}] ${m.nama}`,
  }))

  const tingkatOptions = (allTingkat ?? [])
    .sort((a, b) => a.urutan - b.urutan)
    .map((t) => ({ value: t.id, label: `Tingkat ${t.nama}` }))

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { mataPelajaranId: '', tingkatKelasId: '' },
  })

  const { handleSubmit, formState: { errors }, watch, reset } = form

  const prevOpen = useRef(false)
  useEffect(() => {
    if (open && !prevOpen.current) {
      createMutation.reset()
      setSubmitError(null)
      reset()
    }
    prevOpen.current = open
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null)
    try {
      await createMutation.mutateAsync(values)
      onClose()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Mata Pelajaran per Tingkat"
      size="md"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}
            disabled={createMutation.isPending}>
            Batal
          </Button>
          <Button type="submit" form="mpt-form" loading={createMutation.isPending}>
            Tambah
          </Button>
        </>
      }
    >
      <form id="mpt-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 space-y-5">
          <div ref={formTopRef} />
          {submitError && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/70
              dark:border-red-800/50 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
            </div>
          )}

          <Select
            label="Mata Pelajaran"
            options={mapelOptions}
            value={watch('mataPelajaranId')}
            placeholder="Pilih mata pelajaran..."
            onChange={(e) =>
              form.setValue('mataPelajaranId', e.target.value, { shouldValidate: true })
            }
            error={errors.mataPelajaranId?.message}
          />

          <Select
            label="Tingkat Kelas"
            options={tingkatOptions}
            value={watch('tingkatKelasId')}
            placeholder="Pilih tingkat..."
            onChange={(e) =>
              form.setValue('tingkatKelasId', e.target.value, { shouldValidate: true })
            }
            error={errors.tingkatKelasId?.message}
          />

          {watch('mataPelajaranId') && watch('tingkatKelasId') && (() => {
            const mapel   = allMapel?.find((m) => m.id === watch('mataPelajaranId'))
            const tingkat = allTingkat?.find((t) => t.id === watch('tingkatKelasId'))
            return mapel && tingkat ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/10
                border border-emerald-200 dark:border-emerald-700/50 px-4 py-3">
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  Akan dibuat: <strong>{mapel.nama}</strong> untuk{' '}
                  <strong>Tingkat {tingkat.nama}</strong>
                </p>
              </div>
            ) : null
          })()}
        </div>
      </form>
    </Modal>
  )
}
"""

# ============================================================
# src/app/dashboard/mata-pelajaran-tingkat/page.tsx
# Halaman utama MapelTingkat — filter by tingkat, tabel, SlideOver guru
# ============================================================
files["src/app/dashboard/mata-pelajaran-tingkat/page.tsx"] = """\
'use client'

import { useState } from 'react'
import { PageHeader, Button, Badge, EmptyState, ConfirmModal } from '@/components/ui'
import {
  useMapelTingkatByTingkat,
  useDeleteMapelTingkat,
} from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
import MapelTingkatFormModal from './_components/MapelTingkatFormModal'
import MapelTingkatPanel    from './_components/MapelTingkatPanel'
import type { MataPelajaranTingkat, TingkatKelas } from '@/types/akademik.types'

const KATEGORI_LABEL: Record<string, string> = {
  WAJIB: 'Wajib', PEMINATAN: 'Peminatan', LINTAS_MINAT: 'Lintas Minat',
  MULOK: 'Mulok', PENGEMBANGAN_DIRI: 'Pengembangan Diri',
}
const KATEGORI_VARIANT: Record<string, 'info'|'success'|'warning'|'purple'|'default'> = {
  WAJIB: 'info', PEMINATAN: 'success', LINTAS_MINAT: 'warning',
  MULOK: 'purple', PENGEMBANGAN_DIRI: 'default',
}

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h8a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
  </svg>
)
const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

// ── Row ───────────────────────────────────────────────────────
function MapelTingkatRow({ item, onDetail }: {
  item: MataPelajaranTingkat; onDetail: () => void
}) {
  const deleteMutation  = useDeleteMapelTingkat()
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <>
      <tr className="border-b border-gray-100 dark:border-gray-700/50
        hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <td className="px-4 py-3">
          <span className="font-mono text-sm font-semibold text-gray-700 dark:text-gray-300">
            {item.mataPelajaran.kode}
          </span>
        </td>
        <td className="px-4 py-3">
          <button
            onClick={onDetail}
            className="text-left group flex items-center gap-1.5"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-white
              group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {item.mataPelajaran.nama}
            </span>
          </button>
        </td>
        <td className="px-4 py-3">
          <Badge variant={KATEGORI_VARIANT[item.mataPelajaran.kategori] ?? 'default'} size="sm">
            {KATEGORI_LABEL[item.mataPelajaran.kategori] ?? item.mataPelajaran.kategori}
          </Badge>
        </td>
        {/* Guru pool */}
        <td className="px-4 py-3">
          {item.guruMapel.length === 0 ? (
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">
              Belum ada guru
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {item.guruMapel.slice(0, 3).map((gm) => (
                  <div
                    key={gm.id}
                    title={gm.guru.profile.namaLengkap}
                    className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30
                      border-2 border-white dark:border-gray-900
                      flex items-center justify-center
                      text-[10px] font-semibold text-emerald-700 dark:text-emerald-400"
                  >
                    {gm.guru.profile.namaLengkap.split(' ').slice(0,2).map(n => n[0]).join('')}
                  </div>
                ))}
                {item.guruMapel.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700
                    border-2 border-white dark:border-gray-900
                    flex items-center justify-center
                    text-[10px] font-medium text-gray-500 dark:text-gray-400">
                    +{item.guruMapel.length - 3}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {item.guruMapel.length} guru
              </span>
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 justify-end">
            {/* Kelola guru */}
            <button
              onClick={onDetail}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg
                border border-emerald-200 dark:border-emerald-700/50
                text-emerald-600 dark:text-emerald-400
                hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            >
              <UsersIcon />
              Kelola Guru
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50
                dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            >
              <TrashIcon />
            </button>
          </div>
        </td>
      </tr>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteMutation.mutate(item.id, { onSuccess: () => setConfirmDelete(false) })
        }
        isLoading={deleteMutation.isPending}
        title="Hapus Mata Pelajaran Tingkat"
        description={`Yakin hapus "${item.mataPelajaran.nama} — Tingkat ${item.tingkatKelas.nama}"? Pool guru akan ikut terhapus.`}
        confirmLabel="Hapus"
        variant="danger"
      />
    </>
  )
}

// ── Tabel per tingkat ─────────────────────────────────────────
function TingkatSection({
  tingkat,
  onDetail,
}: {
  tingkat: TingkatKelas
  onDetail: (item: MataPelajaranTingkat) => void
}) {
  const { data, isLoading } = useMapelTingkatByTingkat(tingkat.id)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg
          bg-emerald-100 dark:bg-emerald-900/20
          text-emerald-700 dark:text-emerald-400 font-bold text-sm">
          {tingkat.nama}
        </div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Tingkat {tingkat.nama}
        </p>
        {data && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            · {data.length} mata pelajaran
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-1.5">
          {[1,2,3].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700/50 px-4 py-4">
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
            Belum ada mata pelajaran untuk Tingkat {tingkat.nama}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-600/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-600/60">
              <tr>
                {['Kode','Nama','Kategori','Guru Pengajar','Aksi'].map((h, i) => (
                  <th key={h} className={`px-4 py-2.5 text-xs font-semibold text-gray-500
                    dark:text-gray-400 uppercase tracking-wider
                    ${i === 4 ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-700/50">
              {data.map((item) => (
                <MapelTingkatRow key={item.id} item={item} onDetail={() => onDetail(item)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function MataPelajaranTingkatPage() {
  const { data: allTingkat, isLoading: loadingTingkat } = useTingkatKelasList()

  const [formOpen,  setFormOpen]  = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelItem, setPanelItem] = useState<MataPelajaranTingkat | null>(null)

  const handleDetail = (item: MataPelajaranTingkat) => {
    setPanelItem(item)
    setPanelOpen(true)
  }

  const handleClosePanel = () => {
    setPanelOpen(false)
    setTimeout(() => setPanelItem(null), 300)
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Mata Pelajaran per Tingkat"
          description="Kelola mata pelajaran yang diajarkan di setiap tingkat beserta pool guru pengajarnya."
          actions={
            <Button onClick={() => setFormOpen(true)}>
              <span className="flex items-center gap-1.5">
                <PlusIcon />
                Tambah
              </span>
            </Button>
          }
        />

        {loadingTingkat ? (
          <div className="space-y-6">
            {[1,2,3].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : !allTingkat || allTingkat.length === 0 ? (
          <EmptyState
            title="Belum ada tingkat kelas"
            description="Tambahkan Tingkat X, XI, XII terlebih dahulu di menu Tingkat Kelas."
          />
        ) : (
          <div className="space-y-8">
            {[...allTingkat]
              .sort((a, b) => a.urutan - b.urutan)
              .map((tingkat) => (
                <TingkatSection
                  key={tingkat.id}
                  tingkat={tingkat}
                  onDetail={handleDetail}
                />
              ))}
          </div>
        )}
      </div>

      <MapelTingkatFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />

      <MapelTingkatPanel
        open={panelOpen}
        onClose={handleClosePanel}
        item={panelItem}
      />
    </>
  )
}
"""

# ============================================================
# WRITE
# ============================================================
def main():
    print("\n" + "=" * 62)
    print("  FASE 7C (REVISED) — Mata Pelajaran & MapelTingkat")
    print("=" * 62)
    for rel, content in files.items():
        write(rel.split("/")[-1], p(rel), content)
    print("=" * 62)
    print(f"\n  Total: {len(files)} file\n")
    print("  Update nav.config.ts — tambah entry baru:")
    print("  {")
    print("    label: 'Mapel per Tingkat',")
    print("    href:  '/dashboard/mata-pelajaran-tingkat',")
    print("    icon:  BookOpen,")
    print("    roles: ['ADMIN', 'SUPER_ADMIN'],")
    print("  }")
    print("  Letakkan setelah entry 'Mata Pelajaran'")
    print("=" * 62)
    print()


if __name__ == "__main__":
    main()