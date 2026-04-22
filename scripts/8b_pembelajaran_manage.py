import os
import sys

def write_file(base: str, rel: str, content: str, check: str):
    path = os.path.join(base, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    with open(path, "r", encoding="utf-8") as f:
        v = f.read()
    print(f"  {'OK' if check in v else 'GAGAL'}: {rel}")

def main():
    base = sys.argv[1] if len(sys.argv) > 1 else "../"
    base = os.path.abspath(base)
    print(f"Base dir: {base}\n")

    # ─────────────────────────────────────────────────────────────
    # STEP 1 — Fix akademik.types.ts (sesuaikan shape response asli)
    # ─────────────────────────────────────────────────────────────
    print("=== STEP 1: Fix akademik.types.ts (shape response) ===")

    akademik_types = '''\
// ============================================================
// akademik.types.ts — shape sesuai response API aktual
// ============================================================

export type Jenjang       = 'SMA' | 'MA'
export type KategoriMapel = 'WAJIB' | 'PEMINATAN' | 'LINTAS_MINAT' | 'MULOK' | 'PENGEMBANGAN_DIRI'
export type KelompokMapel = 'A' | 'B' | 'C'
export type HariEnum      = 'SENIN' | 'SELASA' | 'RABU' | 'KAMIS' | 'JUMAT' | 'SABTU' | 'MINGGU'
export type NamaSemester  = 'GANJIL' | 'GENAP'

// ── TingkatKelas ──────────────────────────────────────────────
export interface TingkatKelas {
  id:        string
  nama:      string
  jenjang:   Jenjang
  urutan:    number
  createdAt: string
}

export interface CreateTingkatKelasPayload {
  nama:    string
  jenjang: Jenjang
  urutan:  number
}
export interface UpdateTingkatKelasPayload extends Partial<CreateTingkatKelasPayload> {}

// ── MasterMapel ───────────────────────────────────────────────
export interface MasterMapel {
  id:        string
  kode:      string
  nama:      string
  kategori:  KategoriMapel
  kelompok:  KelompokMapel
  createdAt: string
  updatedAt: string
}

export interface CreateMasterMapelPayload {
  kode:     string
  nama:     string
  kategori: KategoriMapel
  kelompok: KelompokMapel
}
export interface UpdateMasterMapelPayload extends Partial<CreateMasterMapelPayload> {}
export interface FilterMasterMapelParams {
  search?:   string
  kategori?: KategoriMapel
  kelompok?: KelompokMapel
}

// ── Guru ──────────────────────────────────────────────────────
export interface GuruItem {
  id:      string
  profile: {
    namaLengkap: string
    nip?:        string | null
    fotoUrl?:    string | null
  }
}

// GuruMapel — dari response /mata-pelajaran-tingkat
export interface GuruMapel {
  id:                     string
  mataPelajaranTingkatId: string
  guruId:                 string
  guru:                   GuruItem
}

// ── MataPelajaranTingkat ──────────────────────────────────────
// Shape sesuai response GET /mata-pelajaran-tingkat/:id
export interface MataPelajaranTingkat {
  id:             string
  masterMapelId:  string
  tingkatKelasId: string
  createdAt:      string
  updatedAt:      string
  masterMapel:    Pick<MasterMapel, 'id' | 'kode' | 'nama' | 'kategori' | 'kelompok'>
  tingkatKelas:   Pick<TingkatKelas, 'id' | 'nama' | 'jenjang'>
  guruMapel:      GuruMapel[]
}

export interface CreateMapelTingkatPayload {
  masterMapelId:  string
  tingkatKelasId: string
}
export interface SetGuruPoolPayload { guruIds: string[] }

// ── Pengajar (team teaching) — shape dari response /mata-pelajaran
// CATATAN: tidak ada mataPelajaranId/createdAt di response aktual
export interface PengajarMapel {
  isKoordinator: boolean
  guru: {
    id:      string
    profile: { namaLengkap: string; fotoUrl: string | null }
  }
}

// ── Jadwal — shape dari response /mata-pelajaran
export interface JadwalSingkat {
  id:         string
  hari:       HariEnum
  jamMulai:   string
  jamSelesai: string
  ruangan:    string | null
  guru?: {
    id:      string
    profile: { namaLengkap: string }
  }
}

// ── Semester — shape dari response /mata-pelajaran
export interface SemesterSingkat {
  id:      string
  nama:    NamaSemester
  urutan:  number
  isActive: boolean
}

// ── Kelas — shape dari response /mata-pelajaran
export interface KelasSingkat {
  id:           string
  namaKelas:    string
  tahunAjaranId: string
}

// ── _count — shape dari response /mata-pelajaran
export interface MataPelajaranCount {
  materiPelajaran: number
  tugas:           number
  absensi:         number
  penilaian:       number
}

// ── MataPelajaran ─────────────────────────────────────────────
// Shape sesuai response GET /mata-pelajaran (wrapped { data, meta })
export interface MataPelajaran {
  id:                     string
  mataPelajaranTingkatId: string
  semesterId:             string
  kelasId:                string
  kkm:                    number
  bobot:                  number
  isActive:               boolean
  createdAt:              string
  updatedAt:              string
  mataPelajaranTingkat: {
    id:           string
    masterMapelId: string
    tingkatKelasId: string
    masterMapel:  Pick<MasterMapel, 'id' | 'kode' | 'nama' | 'kategori' | 'kelompok'>
    tingkatKelas: Pick<TingkatKelas, 'id' | 'nama' | 'jenjang'>
  }
  semester:        SemesterSingkat
  kelas:           KelasSingkat
  pengajar:        PengajarMapel[]
  jadwalPelajaran: JadwalSingkat[]
  _count:          MataPelajaranCount
}

// ── Pagination wrapper ────────────────────────────────────────
export interface PaginatedResponse<T> {
  data:  T[]
  meta: {
    total:      number
    page:       number
    limit:      number
    totalPages: number
  }
}

// ── DTO ───────────────────────────────────────────────────────
export interface CreateMataPelajaranPayload {
  mataPelajaranTingkatId: string
  semesterId:             string
  kelasId:                string
  kkm?:                   number
  bobot?:                 number
  guruIds?:               string[]
}

export interface UpdateMataPelajaranPayload {
  kkm?:     number
  bobot?:   number
  guruIds?: string[]
}

export interface FilterMataPelajaranParams {
  semesterId?:             string
  kelasId?:                string
  guruId?:                 string
  mataPelajaranTingkatId?: string
  kategori?:               KategoriMapel
  kelompok?:               KelompokMapel
  search?:                 string
  isActive?:               boolean
  page?:                   number
  limit?:                  number
}

// ── Stat Ringkasan ────────────────────────────────────────────
export interface StatAbsensiMapel {
  hadir:           number
  sakit:           number
  izin:            number
  alpa:            number
  total:           number
  persentaseHadir: number
}

export interface StatTugasMapel {
  totalTugas:           number
  sudahDikumpulkan:     number
  belumDikumpulkan:     number
  persentaseKetuntasan: number
}

export interface StatPenilaianMapel {
  totalNilai: number
  rataRata:   number | null
}

export interface StatMateriMapel {
  totalMateri: number
  published:   number
}

// ── Todo ──────────────────────────────────────────────────────
export type TodoJenis = 'TUGAS_BELUM_KUMPUL' | 'ABSENSI_BELUM_ISI' | 'ABSENSI_KOSONG'
export interface TodoItem {
  jenis:           TodoJenis
  label:           string
  mataPelajaranId: string
}
'''
    write_file(base, "src/types/akademik.types.ts", akademik_types, "PaginatedResponse")

    # ─────────────────────────────────────────────────────────────
    # STEP 2 — Fix mata-pelajaran.api.ts (pagination)
    # ─────────────────────────────────────────────────────────────
    print("\n=== STEP 2: Fix mata-pelajaran.api.ts ===")

    mapel_api = '''\
import api from \'@/lib/axios\'
import type {
  MataPelajaran,
  PaginatedResponse,
  CreateMataPelajaranPayload,
  UpdateMataPelajaranPayload,
  FilterMataPelajaranParams,
} from \'@/types/akademik.types\'

const BASE = \'/mata-pelajaran\'

export const mataPelajaranApi = {
  // GET /mata-pelajaran — return wrapped { data, meta }
  getAll: async (params?: FilterMataPelajaranParams): Promise<PaginatedResponse<MataPelajaran>> => {
    const res = await api.get<PaginatedResponse<MataPelajaran>>(BASE, { params })
    return res.data
  },

  getOne: async (id: string): Promise<MataPelajaran> => {
    const res = await api.get<MataPelajaran>(`${BASE}/${id}`)
    return res.data
  },

  create: async (payload: CreateMataPelajaranPayload): Promise<MataPelajaran> => {
    const res = await api.post<MataPelajaran>(BASE, payload)
    return res.data
  },

  // PUT bukan PATCH
  update: async (id: string, payload: UpdateMataPelajaranPayload): Promise<MataPelajaran> => {
    const res = await api.put<MataPelajaran>(`${BASE}/${id}`, payload)
    return res.data
  },

  toggleActive: async (id: string): Promise<MataPelajaran> => {
    const res = await api.patch<MataPelajaran>(`${BASE}/${id}/toggle-active`, {})
    return res.data
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`)
  },

  bulkCopy: async (
    sourceSemesterId: string,
    targetSemesterId: string,
    kelasId?: string,
  ): Promise<{ message: string; count: number }> => {
    const res = await api.post(
      `${BASE}/bulk-copy`,
      {},
      { params: { sourceSemesterId, targetSemesterId, kelasId } },
    )
    return res.data
  },

  // Export nilai per mapel
  exportNilai: async (params: {
    kelasId:       string
    mataPelajaranId: string
    tahunAjaranId: string
  }): Promise<Blob> => {
    const res = await api.get(\'/report/export/nilai\', {
      params,
      responseType: \'blob\',
    })
    return res.data
  },
}
'''
    write_file(base, "src/lib/api/mata-pelajaran.api.ts", mapel_api, "PaginatedResponse")

    # ─────────────────────────────────────────────────────────────
    # STEP 3 — Fix useMataPelajaran.ts (pagination)
    # ─────────────────────────────────────────────────────────────
    print("\n=== STEP 3: Fix useMataPelajaran.ts ===")

    use_mapel = '''\
import { useMutation, useQuery, useQueryClient } from \'@tanstack/react-query\'
import { toast } from \'sonner\'
import { masterMapelApi }   from \'@/lib/api/master-mapel.api\'
import { mataPelajaranApi } from \'@/lib/api/mata-pelajaran.api\'
import { mapelTingkatApi }  from \'@/lib/api/mapel-tingkat.api\'
import { usersApi }         from \'@/lib/api/users.api\'
import type {
  CreateMasterMapelPayload,
  UpdateMasterMapelPayload,
  FilterMasterMapelParams,
  CreateMataPelajaranPayload,
  UpdateMataPelajaranPayload,
  FilterMataPelajaranParams,
  CreateMapelTingkatPayload,
  SetGuruPoolPayload,
} from \'@/types/akademik.types\'

// ── Query Keys ────────────────────────────────────────────────
export const masterMapelKeys = {
  all:    (f?: FilterMasterMapelParams) => [\'master-mapel\', f ?? {}] as const,
  detail: (id: string) => [\'master-mapel\', id] as const,
}

export const mapelTingkatKeys = {
  byTingkat:     (id: string) => [\'mapel-tingkat\', \'by-tingkat\', id] as const,
  byMasterMapel: (id: string) => [\'mapel-tingkat\', \'by-master\', id] as const,
  detail:        (id: string) => [\'mapel-tingkat\', id] as const,
}

export const mataPelajaranKeys = {
  all:    (f?: FilterMataPelajaranParams) => [\'mata-pelajaran\', f ?? {}] as const,
  detail: (id: string) => [\'mata-pelajaran\', id] as const,
}

export const guruKeys = {
  all: [\'guru-list\'] as const,
}

// ── Master Mapel ──────────────────────────────────────────────
export function useMasterMapelList(filter?: FilterMasterMapelParams) {
  return useQuery({
    queryKey: masterMapelKeys.all(filter),
    queryFn:  () => masterMapelApi.getAll(filter),
    staleTime: 1000 * 60 * 10,
  })
}

export function useCreateMasterMapel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMasterMapelPayload) => masterMapelApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [\'master-mapel\'] })
      toast.success(\'Master mapel berhasil ditambahkan\')
    },
    onError: (err: Error) => toast.error(err.message ?? \'Gagal menambahkan master mapel\'),
  })
}

export function useUpdateMasterMapel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMasterMapelPayload }) =>
      masterMapelApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [\'master-mapel\'] })
      toast.success(\'Master mapel berhasil diperbarui\')
    },
    onError: (err: Error) => toast.error(err.message ?? \'Gagal memperbarui master mapel\'),
  })
}

export function useDeleteMasterMapel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => masterMapelApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [\'master-mapel\'] })
      toast.success(\'Master mapel berhasil dihapus\')
    },
    onError: (err: Error) => toast.error(err.message ?? \'Gagal menghapus master mapel\'),
  })
}

// ── MapelTingkat ──────────────────────────────────────────────
export function useMapelTingkatByTingkat(tingkatKelasId: string | null) {
  return useQuery({
    queryKey: mapelTingkatKeys.byTingkat(tingkatKelasId ?? \'\'),
    queryFn:  () => mapelTingkatApi.getByTingkat(tingkatKelasId!),
    enabled:  !!tingkatKelasId,
    staleTime: 1000 * 60 * 5,
  })
}

// Fetch 1 mapelTingkat by id — untuk dapatkan guruMapel pool
export function useMapelTingkatById(id: string | null) {
  return useQuery({
    queryKey: mapelTingkatKeys.detail(id ?? \'\'),
    queryFn:  () => mapelTingkatApi.getOne(id!),
    enabled:  !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateMapelTingkat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMapelTingkatPayload) => mapelTingkatApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [\'mapel-tingkat\'] })
      toast.success(\'Mapel tingkat berhasil ditambahkan\')
    },
    onError: (err: Error) => toast.error(err.message ?? \'Gagal menambahkan mapel tingkat\'),
  })
}

export function useDeleteMapelTingkat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mapelTingkatApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [\'mapel-tingkat\'] })
      toast.success(\'Mapel tingkat berhasil dihapus\')
    },
    onError: (err: Error) => toast.error(err.message ?? \'Gagal menghapus mapel tingkat\'),
  })
}

export function useSetGuruPool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SetGuruPoolPayload }) =>
      mapelTingkatApi.setGuruPool(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [\'mapel-tingkat\'] })
      toast.success(\'Pool guru berhasil diperbarui\')
    },
    onError: (err: Error) => toast.error(err.message ?? \'Gagal memperbarui pool guru\'),
  })
}

export function useAddGuru() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, guruId }: { id: string; guruId: string }) =>
      mapelTingkatApi.addGuru(id, guruId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [\'mapel-tingkat\'] })
      toast.success(\'Guru berhasil ditambahkan\')
    },
    onError: (err: Error) => toast.error(err.message ?? \'Gagal menambahkan guru\'),
  })
}

export function useRemoveGuru() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, guruId }: { id: string; guruId: string }) =>
      mapelTingkatApi.removeGuru(id, guruId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [\'mapel-tingkat\'] })
      toast.success(\'Guru berhasil dihapus\')
    },
    onError: (err: Error) => toast.error(err.message ?? \'Gagal menghapus guru\'),
  })
}

export function useGuruList() {
  return useQuery({
    queryKey: guruKeys.all,
    queryFn:  () => usersApi.getByRole(\'GURU\'),
    staleTime: 1000 * 60 * 10,
  })
}

// ── MataPelajaran ─────────────────────────────────────────────
export function useMataPelajaranList(filter?: FilterMataPelajaranParams) {
  return useQuery({
    queryKey: mataPelajaranKeys.all(filter),
    queryFn:  () => mataPelajaranApi.getAll(filter),
    staleTime: 1000 * 60 * 5,
  })
}

export function useMataPelajaranById(id: string | null) {
  return useQuery({
    queryKey: mataPelajaranKeys.detail(id ?? \'\'),
    queryFn:  () => mataPelajaranApi.getOne(id!),
    enabled:  !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateMataPelajaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMataPelajaranPayload) => mataPelajaranApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [\'mata-pelajaran\'] })
      toast.success(\'Mata pelajaran berhasil ditambahkan\')
    },
    onError: (err: Error) => toast.error(err.message ?? \'Gagal menambahkan mata pelajaran\'),
  })
}

export function useUpdateMataPelajaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMataPelajaranPayload }) =>
      mataPelajaranApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: [\'mata-pelajaran\'] })
      qc.invalidateQueries({ queryKey: mataPelajaranKeys.detail(id) })
      toast.success(\'Mata pelajaran berhasil diperbarui\')
    },
    onError: (err: Error) => toast.error(err.message ?? \'Gagal memperbarui mata pelajaran\'),
  })
}

export function useToggleMataPelajaranActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mataPelajaranApi.toggleActive(id),
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: [\'mata-pelajaran\'] })
      qc.invalidateQueries({ queryKey: mataPelajaranKeys.detail(id) })
      toast.success(`Mata pelajaran berhasil ${data.isActive ? \'diaktifkan\' : \'dinonaktifkan\'}`)
    },
    onError: (err: Error) => toast.error(err.message ?? \'Gagal mengubah status\'),
  })
}

export function useDeleteMataPelajaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mataPelajaranApi.remove(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: [\'mata-pelajaran\'] })
      qc.removeQueries({ queryKey: mataPelajaranKeys.detail(id) })
      toast.success(\'Mata pelajaran berhasil dihapus\')
    },
    onError: (err: Error) => toast.error(err.message ?? \'Gagal menghapus mata pelajaran\'),
  })
}

export function useBulkCopyMataPelajaran() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      sourceSemesterId,
      targetSemesterId,
      kelasId,
    }: {
      sourceSemesterId: string
      targetSemesterId: string
      kelasId?:         string
    }) => mataPelajaranApi.bulkCopy(sourceSemesterId, targetSemesterId, kelasId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [\'mata-pelajaran\'] })
      toast.success(`${data.count} mata pelajaran berhasil disalin`)
    },
    onError: (err: Error) => toast.error(err.message ?? \'Gagal menyalin mata pelajaran\'),
  })
}
'''
    write_file(base, "src/hooks/useMataPelajaran.ts", use_mapel, "useMapelTingkatById")

    # ─────────────────────────────────────────────────────────────
    # STEP 4 — GuruPoolSelect component
    # ─────────────────────────────────────────────────────────────
    print("\n=== STEP 4: GuruPoolSelect component ===")

    guru_pool_select = '''\
\'use client\'

import { useState, useMemo, useRef, useEffect } from \'react\'
import { Search, X, Star } from \'lucide-react\'
import type { GuruMapel } from \'@/types/akademik.types\'

interface Props {
  // Pool guru dari mataPelajaranTingkat.guruMapel
  guruPool:  GuruMapel[]
  // Nilai saat ini: array guruId yang dipilih
  value:     string[]
  onChange:  (guruIds: string[]) => void
  disabled?: boolean
}

export function GuruPoolSelect({ guruPool, value, onChange, disabled }: Props) {
  const [search, setSearch]   = useState(\'\'  )
  const [open,   setOpen]     = useState(false)
  const containerRef          = useRef<HTMLDivElement>(null)

  // Close dropdown saat klik luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener(\'mousedown\', handler)
    return () => document.removeEventListener(\'mousedown\', handler)
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return guruPool
    const q = search.toLowerCase()
    return guruPool.filter((gm) =>
      gm.guru.profile.namaLengkap.toLowerCase().includes(q) ||
      (gm.guru.profile.nip ?? \'\').includes(q),
    )
  }, [guruPool, search])

  const selectedGuru = useMemo(
    () => guruPool.filter((gm) => value.includes(gm.guruId)),
    [guruPool, value],
  )

  function toggle(guruId: string) {
    if (value.includes(guruId)) {
      onChange(value.filter((id) => id !== guruId))
    } else {
      onChange([...value, guruId])
    }
  }

  function remove(guruId: string) {
    onChange(value.filter((id) => id !== guruId))
  }

  if (guruPool.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm text-amber-700">
          Belum ada guru di pool mata pelajaran ini.
          Tambahkan guru terlebih dahulu di menu <span className="font-semibold">Master Mapel</span>.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2" ref={containerRef}>
      {/* Chips guru terpilih */}
      {selectedGuru.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedGuru.map((gm) => (
            <div
              key={gm.guruId}
              className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs"
            >
              <Star className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="font-medium text-emerald-800 truncate max-w-[140px]">
                {gm.guru.profile.namaLengkap}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(gm.guruId)}
                  className="text-emerald-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      {!disabled && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Cari guru dari pool..."
            value={search}
            style={{ fontSize: \'16px\' }}
            onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
          />

          {/* Dropdown */}
          {open && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">Tidak ada guru ditemukan</p>
              ) : (
                filtered.map((gm) => {
                  const isSelected = value.includes(gm.guruId)
                  return (
                    <button
                      key={gm.guruId}
                      type="button"
                      onClick={() => { toggle(gm.guruId); setSearch(\'\') }}
                      className={[
                        \'w-full text-left px-4 py-2.5 text-sm transition-colors\',
                        \'border-b border-gray-50 last:border-0\',
                        isSelected
                          ? \'bg-emerald-50 text-emerald-700\'
                          : \'hover:bg-gray-50 text-gray-800\',
                      ].join(\' \')}
                    >
                      <p className="font-medium">{gm.guru.profile.namaLengkap}</p>
                      {gm.guru.profile.nip && (
                        <p className="text-xs text-gray-400">{gm.guru.profile.nip}</p>
                      )}
                      {isSelected && (
                        <p className="text-xs text-emerald-500 mt-0.5">✓ Dipilih</p>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400">
        {selectedGuru.length} dari {guruPool.length} guru dipilih
      </p>
    </div>
  )
}
'''
    write_file(
        base,
        "src/app/dashboard/pembelajaran/manajemen/_components/guru-pool-select.tsx",
        guru_pool_select,
        "GuruPoolSelect",
    )

    # ─────────────────────────────────────────────────────────────
    # STEP 5 — MapelFormModal
    # ─────────────────────────────────────────────────────────────
    print("\n=== STEP 5: MapelFormModal ===")

    mapel_form_modal = '''\
\'use client\'

import { useState, useEffect, useRef } from \'react\'
import { useForm, Controller } from \'react-hook-form\'
import { zodResolver } from \'@hookform/resolvers/zod\'
import { z } from \'zod\'
import { Modal, Button, Input, Select } from \'@/components/ui\'
import { useMapelTingkatByTingkat, useMapelTingkatById, useCreateMataPelajaran, useUpdateMataPelajaran } from \'@/hooks/useMataPelajaran\'
import { useSemesterByTahunAjaran } from \'@/hooks/useSemester\'
import { useKelasList } from \'@/hooks/useKelas\'
import { useTahunAjaranList } from \'@/hooks/useTahunAjaran\'
import { GuruPoolSelect } from \'./guru-pool-select\'
import { getErrorMessage } from \'@/lib/utils\'
import type { MataPelajaran } from \'@/types/akademik.types\'

const FORM_ID = \'mapel-form\'

const schema = z.object({
  mataPelajaranTingkatId: z.string().min(1, \'Pilih mata pelajaran\'),
  semesterId:             z.string().min(1, \'Pilih semester\'),
  kelasId:                z.string().min(1, \'Pilih kelas\'),
  kkm:                    z.coerce.number().min(0).max(100),
  bobot:                  z.coerce.number().min(1).max(10),
  guruIds:                z.array(z.string()).min(1, \'Pilih minimal 1 guru\'),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open:      boolean
  onClose:   () => void
  editData?: MataPelajaran | null
  // Konteks dari URL — jika ada, field ini di-lock
  kelasId?:        string
  tahunAjaranId?:  string
  tingkatKelasId?: string
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-red-50 border border-red-200/70 px-4 py-3">
      <p className="text-sm text-red-600">{message}</p>
    </div>
  )
}

export function MapelFormModal({
  open, onClose, editData,
  kelasId: kelasIdCtx,
  tahunAjaranId: tahunAjaranIdCtx,
  tingkatKelasId: tingkatKelasIdCtx,
}: Props) {
  const [submitError, setSubmitError]             = useState<string | null>(null)
  const [selectedTingkatId, setSelectedTingkatId] = useState<string>(tingkatKelasIdCtx ?? \'\')
  const [selectedTAId, setSelectedTAId]           = useState<string>(tahunAjaranIdCtx ?? \'\')
  const formTopRef                                = useRef<HTMLDivElement>(null)

  const hasKelasCtx = !!kelasIdCtx

  const { data: tahunAjaranList = [] }  = useTahunAjaranList()
  const { data: semesterList = [] }     = useSemesterByTahunAjaran(selectedTAId || null)
  const { data: kelasList = [] }        = useKelasList(
    selectedTAId ? { tahunAjaranId: selectedTAId } : undefined,
  )
  const { data: mapelTingkatList = [] } = useMapelTingkatByTingkat(selectedTingkatId || null)

  const createMutation = useCreateMataPelajaran()
  const updateMutation = useUpdateMataPelajaran()

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        mataPelajaranTingkatId: \'\',
        semesterId:             \'\',
        kelasId:                kelasIdCtx ?? \'\',
        kkm:                    75,
        bobot:                  2,
        guruIds:                [],
      },
    })

  const watchedMapelTingkatId = watch(\'mataPelajaranTingkatId\')
  const watchedGuruIds        = watch(\'guruIds\')

  // Fetch guruMapel pool saat mapelTingkat dipilih
  const { data: selectedMapelTingkat } = useMapelTingkatById(watchedMapelTingkatId || null)
  const guruPool = selectedMapelTingkat?.guruMapel ?? []

  // Reset form saat buka/tutup
  useEffect(() => {
    if (!open) return
    setSubmitError(null)
    if (editData) {
      reset({
        mataPelajaranTingkatId: editData.mataPelajaranTingkatId,
        semesterId:             editData.semesterId,
        kelasId:                editData.kelasId,
        kkm:                    editData.kkm,
        bobot:                  editData.bobot,
        guruIds:                editData.pengajar.map((p) => p.guru.id),
      })
      setSelectedTingkatId(editData.mataPelajaranTingkat.tingkatKelasId)
      setSelectedTAId(editData.kelas.tahunAjaranId)
    } else {
      reset({
        mataPelajaranTingkatId: \'\',
        semesterId:             \'\',
        kelasId:                kelasIdCtx ?? \'\',
        kkm:                    75,
        bobot:                  2,
        guruIds:                [],
      })
      setSelectedTingkatId(tingkatKelasIdCtx ?? \'\')
      setSelectedTAId(tahunAjaranIdCtx ?? \'\')
    }
  }, [open, editData?.id])

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      if (editData) {
        await updateMutation.mutateAsync({ id: editData.id, payload: values })
      } else {
        await createMutation.mutateAsync(values)
      }
      onClose()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: \'smooth\' }), 50)
    }
  })

  // Options
  const taOptions = [
    { label: \'Pilih Tahun Ajaran\', value: \'\' },
    ...tahunAjaranList.map((ta) => ({ label: ta.nama, value: ta.id })),
  ]
  const semesterOptions = [
    { label: \'Pilih Semester\', value: \'\' },
    ...semesterList.map((s) => ({ label: `Semester ${s.nama}`, value: s.id })),
  ]
  const kelasOptions = [
    { label: \'Pilih Kelas\', value: \'\' },
    ...kelasList.map((k) => ({ label: k.namaKelas, value: k.id })),
  ]
  const mapelOptions = [
    { label: \'Pilih Mata Pelajaran\', value: \'\' },
    ...mapelTingkatList.map((mt) => ({
      label: `${mt.masterMapel.kode} — ${mt.masterMapel.nama}`,
      value: mt.id,
    })),
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editData ? \'Edit Mata Pelajaran\' : \'Tambah Mata Pelajaran\'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" form={FORM_ID} loading={isPending}>
            {editData ? \'Simpan Perubahan\' : \'Tambah\'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit}>
        <div className="p-6 space-y-5">
          <div ref={formTopRef} />
          {submitError && <ErrorBox message={submitError} />}

          {/* Tahun Ajaran — hanya jika tidak ada konteks */}
          {!hasKelasCtx && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Tahun Ajaran <span className="text-red-500">*</span>
              </label>
              <Select
                options={taOptions}
                value={selectedTAId}
                onChange={(e) => {
                  setSelectedTAId(e.target.value)
                  setValue(\'kelasId\', \'\')
                  setValue(\'semesterId\', \'\')
                }}
              />
            </div>
          )}

          {/* Semester */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Semester <span className="text-red-500">*</span>
            </label>
            <Controller
              name="semesterId"
              control={control}
              render={({ field }) => (
                <Select
                  options={semesterOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            {errors.semesterId && (
              <p className="text-xs text-red-500">{errors.semesterId.message}</p>
            )}
          </div>

          {/* Kelas — lock jika ada konteks */}
          {!hasKelasCtx && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Kelas <span className="text-red-500">*</span>
              </label>
              <Controller
                name="kelasId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={kelasOptions}
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.value)
                      // Resolve tingkatKelasId dari kelas yang dipilih
                      const kelas = kelasList.find((k) => k.id === e.target.value)
                      if (kelas) setSelectedTingkatId(kelas.tingkatKelasId)
                    }}
                  />
                )}
              />
              {errors.kelasId && (
                <p className="text-xs text-red-500">{errors.kelasId.message}</p>
              )}
            </div>
          )}

          {/* Mata Pelajaran (dari pool mapelTingkat) */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Mata Pelajaran <span className="text-red-500">*</span>
            </label>
            <Controller
              name="mataPelajaranTingkatId"
              control={control}
              render={({ field }) => (
                <Select
                  options={mapelOptions}
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e.target.value)
                    setValue(\'guruIds\', []) // reset guru saat mapel berubah
                  }}
                />
              )}
            />
            {errors.mataPelajaranTingkatId && (
              <p className="text-xs text-red-500">{errors.mataPelajaranTingkatId.message}</p>
            )}
            {!selectedTingkatId && !hasKelasCtx && (
              <p className="text-xs text-gray-400">Pilih kelas terlebih dahulu</p>
            )}
          </div>

          {/* KKM & Bobot */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">KKM</label>
              <Input
                {...register(\'kkm\')}
                type="number"
                min={0}
                max={100}
                error={errors.kkm?.message}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Bobot (SKS)</label>
              <Input
                {...register(\'bobot\')}
                type="number"
                min={1}
                max={10}
                error={errors.bobot?.message}
              />
            </div>
          </div>

          {/* Guru (dari pool mapelTingkat) */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Pengajar <span className="text-red-500">*</span>
            </label>
            <Controller
              name="guruIds"
              control={control}
              render={({ field }) => (
                <GuruPoolSelect
                  guruPool={guruPool}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={!watchedMapelTingkatId}
                />
              )}
            />
            {errors.guruIds && (
              <p className="text-xs text-red-500">{errors.guruIds.message}</p>
            )}
            {watchedMapelTingkatId && guruPool.length === 0 && (
              <p className="text-xs text-amber-600">
                Pool guru kosong. Tambahkan guru di Master Mapel terlebih dahulu.
              </p>
            )}
          </div>
        </div>
      </form>
    </Modal>
  )
}
'''
    write_file(
        base,
        "src/app/dashboard/pembelajaran/manajemen/_components/mapel-form-modal.tsx",
        mapel_form_modal,
        "MapelFormModal",
    )

    # ─────────────────────────────────────────────────────────────
    # STEP 6 — MapelBulkCopyModal
    # ─────────────────────────────────────────────────────────────
    print("\n=== STEP 6: MapelBulkCopyModal ===")

    bulk_copy_modal = '''\
\'use client\'

import { useState, useEffect } from \'react\'
import { ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle } from \'lucide-react\'
import { Modal, Button, Select } from \'@/components/ui\'
import { useBulkCopyMataPelajaran } from \'@/hooks/useMataPelajaran\'
import { useSemesterByTahunAjaran } from \'@/hooks/useSemester\'
import { useTahunAjaranList } from \'@/hooks/useTahunAjaran\'
import { useKelasList } from \'@/hooks/useKelas\'
import { getErrorMessage } from \'@/lib/utils\'

type Step = \'form\' | \'confirm\' | \'done\'

interface Props {
  open:    boolean
  onClose: () => void
  // Konteks opsional — jika dari halaman dengan kelasId
  kelasId?:       string
  tahunAjaranId?: string
}

export function MapelBulkCopyModal({ open, onClose, kelasId: kelasIdCtx, tahunAjaranId: taIdCtx }: Props) {
  const [step,              setStep]              = useState<Step>(\'form\')
  const [sourceTAId,        setSourceTAId]        = useState(\'\')
  const [sourceSemesterId,  setSourceSemesterId]  = useState(\'\')
  const [targetTAId,        setTargetTAId]        = useState(\'\')
  const [targetSemesterId,  setTargetSemesterId]  = useState(\'\')
  const [kelasId,           setKelasId]           = useState(kelasIdCtx ?? \'\')
  const [error,             setError]             = useState<string | null>(null)
  const [result,            setResult]            = useState<{ count: number } | null>(null)

  const { data: taList = [] }             = useTahunAjaranList()
  const { data: sourceSemList = [] }      = useSemesterByTahunAjaran(sourceTAId || null)
  const { data: targetSemList = [] }      = useSemesterByTahunAjaran(targetTAId || null)
  const { data: kelasList = [] }          = useKelasList(
    targetTAId ? { tahunAjaranId: targetTAId } : undefined,
  )
  const bulkCopy = useBulkCopyMataPelajaran()

  useEffect(() => {
    if (!open) {
      setStep(\'form\'); setSourceTAId(\'\'); setSourceSemesterId(\'\')
      setTargetTAId(taIdCtx ?? \'\'); setTargetSemesterId(\'\')
      setKelasId(kelasIdCtx ?? \'\'); setError(null); setResult(null)
    }
  }, [open])

  const taOptions = [
    { label: \'Pilih Tahun Ajaran\', value: \'\' },
    ...taList.map((ta) => ({ label: ta.nama, value: ta.id })),
  ]
  const sourceSemOptions = [
    { label: \'Pilih Semester Sumber\', value: \'\' },
    ...sourceSemList.map((s) => ({ label: `${s.nama} — ${taList.find(t=>t.id===sourceTAId)?.nama ?? \'\'}`, value: s.id })),
  ]
  const targetSemOptions = [
    { label: \'Pilih Semester Tujuan\', value: \'\' },
    ...targetSemList.map((s) => ({ label: `${s.nama} — ${taList.find(t=>t.id===targetTAId)?.nama ?? \'\'}`, value: s.id })),
  ]
  const kelasOptions = [
    { label: \'Semua Kelas (copy semua)\', value: \'\' },
    ...kelasList.map((k) => ({ label: k.namaKelas, value: k.id })),
  ]

  const canProceed = !!sourceSemesterId && !!targetSemesterId && sourceSemesterId !== targetSemesterId

  async function handleConfirm() {
    setError(null)
    try {
      const res = await bulkCopy.mutateAsync({
        sourceSemesterId,
        targetSemesterId,
        kelasId: kelasId || undefined,
      })
      setResult(res)
      setStep(\'done\')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const sourceSemNama  = sourceSemList.find((s) => s.id === sourceSemesterId)?.nama ?? \'-\'
  const targetSemNama  = targetSemList.find((s) => s.id === targetSemesterId)?.nama ?? \'-\'
  const sourceTANama   = taList.find((t) => t.id === sourceTAId)?.nama ?? \'-\'
  const targetTANama   = taList.find((t) => t.id === targetTAId)?.nama ?? \'-\'
  const kelasNama      = kelasList.find((k) => k.id === kelasId)?.namaKelas ?? \'Semua Kelas\'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Salin Mata Pelajaran (Bulk Copy)"
      size="md"
      footer={
        step === \'form\' ? (
          <>
            <Button variant="secondary" onClick={onClose}>Batal</Button>
            <Button
              disabled={!canProceed}
              rightIcon={<ChevronRight className="w-4 h-4" />}
              onClick={() => setStep(\'confirm\')}
            >
              Lanjut
            </Button>
          </>
        ) : step === \'confirm\' ? (
          <>
            <Button variant="secondary" leftIcon={<ChevronLeft className="w-4 h-4" />} onClick={() => setStep(\'form\')}>
              Kembali
            </Button>
            <Button loading={bulkCopy.isPending} onClick={handleConfirm}>
              Konfirmasi & Salin
            </Button>
          </>
        ) : (
          <Button className="w-full" onClick={onClose}>Tutup</Button>
        )
      }
    >
      <div className="p-6">

        {/* STEP 1 — Form */}
        {step === \'form\' && (
          <div className="space-y-5">
            <p className="text-sm text-gray-500">
              Salin seluruh mata pelajaran dari satu semester ke semester lain.
            </p>

            {/* Sumber */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">📤 Sumber</p>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Tahun Ajaran Sumber</label>
                <Select options={taOptions} value={sourceTAId}
                  onChange={(e) => { setSourceTAId(e.target.value); setSourceSemesterId(\'\') }} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Semester Sumber</label>
                <Select options={sourceSemOptions} value={sourceSemesterId}
                  onChange={(e) => setSourceSemesterId(e.target.value)}
                />
              </div>
            </div>

            {/* Target */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">📥 Tujuan</p>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Tahun Ajaran Tujuan</label>
                <Select options={taOptions} value={targetTAId}
                  onChange={(e) => { setTargetTAId(e.target.value); setTargetSemesterId(\'\'); setKelasId(\'\') }} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Semester Tujuan</label>
                <Select options={targetSemOptions} value={targetSemesterId}
                  onChange={(e) => setTargetSemesterId(e.target.value)} />
              </div>
            </div>

            {/* Filter kelas opsional */}
            {!kelasIdCtx && (
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Filter Kelas (opsional)</label>
                <Select options={kelasOptions} value={kelasId}
                  onChange={(e) => setKelasId(e.target.value)} />
                <p className="text-xs text-gray-400">Kosongkan untuk salin ke semua kelas</p>
              </div>
            )}

            {sourceSemesterId === targetSemesterId && sourceSemesterId && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600">Semester sumber dan tujuan tidak boleh sama</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — Konfirmasi */}
        {step === \'confirm\' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-2 text-sm">
              <p><span className="font-medium text-gray-600">Dari:</span> {sourceSemNama} — {sourceTANama}</p>
              <p><span className="font-medium text-gray-600">Ke:</span> {targetSemNama} — {targetTANama}</p>
              <p><span className="font-medium text-gray-600">Kelas:</span> {kelasNama}</p>
            </div>
            <p className="text-sm text-gray-500">
              Seluruh mata pelajaran dari semester sumber akan disalin ke semester tujuan.
              Mata pelajaran yang sudah ada tidak akan diduplikasi.
            </p>
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 3 — Done */}
        {step === \'done\' && result && (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">Berhasil!</p>
              <p className="text-sm text-gray-500 mt-1">
                <span className="text-emerald-600 font-semibold">{result.count} mata pelajaran</span> berhasil disalin.
              </p>
            </div>
          </div>
        )}

      </div>
    </Modal>
  )
}
'''
    write_file(
        base,
        "src/app/dashboard/pembelajaran/manajemen/_components/mapel-bulk-copy-modal.tsx",
        bulk_copy_modal,
        "MapelBulkCopyModal",
    )

    # ─────────────────────────────────────────────────────────────
    # STEP 7 — MapelFilters
    # ─────────────────────────────────────────────────────────────
    print("\n=== STEP 7: MapelFilters ===")

    mapel_filters = '''\
\'use client\'

import { useMemo } from \'react\'
import { Select, SearchInput } from \'@/components/ui\'
import type { SemesterSingkat } from \'@/types/akademik.types\'

interface KelasOption { id: string; namaKelas: string }
interface TingkatOption { id: string; nama: string }

interface Props {
  semesterList:   SemesterSingkat[]
  kelasList:      KelasOption[]
  tingkatList:    TingkatOption[]

  semesterId:     string
  kelasId:        string
  tingkatId:      string
  search:         string

  onSemesterChange: (id: string) => void
  onKelasChange:    (id: string) => void
  onTingkatChange:  (id: string) => void
  onSearchChange:   (v: string) => void

  // Lock kelasId jika dari konteks URL
  kelasLocked?: boolean
}

export function MapelFilters({
  semesterList, kelasList, tingkatList,
  semesterId, kelasId, tingkatId, search,
  onSemesterChange, onKelasChange, onTingkatChange, onSearchChange,
  kelasLocked,
}: Props) {
  const semesterOptions = useMemo(() => [
    { label: \'Semua Semester\', value: \'\' },
    ...semesterList.map((s) => ({ label: `Semester ${s.nama}`, value: s.id })),
  ], [semesterList])

  const kelasOptions = useMemo(() => [
    { label: \'Semua Kelas\', value: \'\' },
    ...kelasList.map((k) => ({ label: k.namaKelas, value: k.id })),
  ], [kelasList])

  const tingkatOptions = useMemo(() => [
    { label: \'Semua Tingkat\', value: \'\' },
    ...tingkatList.map((t) => ({ label: `Kelas ${t.nama}`, value: t.id })),
  ], [tingkatList])

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="w-full sm:w-64">
        <SearchInput
          placeholder="Cari mata pelajaran..."
          value={search}
          onChange={onSearchChange}
        />
      </div>
      <div className="w-full sm:w-44">
        <Select options={tingkatOptions} value={tingkatId}
          onChange={(e) => onTingkatChange(e.target.value)} />
      </div>
      <div className="w-full sm:w-44">
        <Select options={semesterOptions} value={semesterId}
          onChange={(e) => onSemesterChange(e.target.value)} />
      </div>
      {!kelasLocked && (
        <div className="w-full sm:w-44">
          <Select options={kelasOptions} value={kelasId}
            onChange={(e) => onKelasChange(e.target.value)} />
        </div>
      )}
    </div>
  )
}
'''
    write_file(
        base,
        "src/app/dashboard/pembelajaran/manajemen/_components/mapel-filters.tsx",
        mapel_filters,
        "MapelFilters",
    )

    # ─────────────────────────────────────────────────────────────
    # STEP 8 — MapelSlideover
    # ─────────────────────────────────────────────────────────────
    print("\n=== STEP 8: MapelSlideover ===")

    mapel_slideover = '''\
\'use client\'

import { useRouter } from \'next/navigation\'
import {
  BookOpen, ClipboardList, BarChart2, Users,
  CalendarDays, Edit, Trash2, ToggleLeft, Download,
} from \'lucide-react\'
import { SlideOver, Button, Badge } from \'@/components/ui\'
import { getPublicFileUrl } from \'@/lib/constants\'
import type { MataPelajaran } from \'@/types/akademik.types\'

interface Props {
  mapel:          MataPelajaran | null
  onClose:        () => void
  onEdit:         (mapel: MataPelajaran) => void
  onDelete:       (mapel: MataPelajaran) => void
  onToggleActive: (mapel: MataPelajaran) => void
  onExport:       (mapel: MataPelajaran) => void
  canCrud:        boolean
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-800 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export function MapelSlideover({ mapel, onClose, onEdit, onDelete, onToggleActive, onExport, canCrud }: Props) {
  const router = useRouter()

  if (!mapel) return null

  const namaMapel   = mapel.mataPelajaranTingkat.masterMapel.nama
  const kodeMapel   = mapel.mataPelajaranTingkat.masterMapel.kode
  const kategori    = mapel.mataPelajaranTingkat.masterMapel.kategori
  const koordinator = mapel.pengajar.find((p) => p.isKoordinator)
  const coTeacher   = mapel.pengajar.filter((p) => !p.isKoordinator)

  const jadwalText = mapel.jadwalPelajaran.length > 0
    ? mapel.jadwalPelajaran.map((j) => `${j.hari} ${j.jamMulai}–${j.jamSelesai}`).join(\', \')
    : \'Belum ada jadwal\'

  return (
    <SlideOver
      open={!!mapel}
      onClose={onClose}
      title={namaMapel}
      width="lg"
    >
      {mapel && (
        <div className="space-y-6">

          {/* Badge info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={mapel.isActive ? \'success\' : \'danger\'}>
              {mapel.isActive ? \'Aktif\' : \'Nonaktif\'}
            </Badge>
            <Badge variant="info">{kategori}</Badge>
            <Badge variant="default">{kodeMapel}</Badge>
          </div>

          {/* Info dasar */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Kelas</span>
              <span className="font-medium">{mapel.kelas.namaKelas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Semester</span>
              <span className="font-medium">{mapel.semester.nama}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">KKM / Bobot</span>
              <span className="font-medium">{mapel.kkm} / {mapel.bobot} SKS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Jadwal</span>
              <span className="font-medium text-right max-w-[60%]">{jadwalText}</span>
            </div>
          </div>

          {/* Pengajar */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pengajar</p>
            {mapel.pengajar.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada pengajar</p>
            ) : (
              <div className="space-y-2">
                {koordinator && (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-700">
                      {koordinator.guru.profile.namaLengkap.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {koordinator.guru.profile.namaLengkap}
                      </p>
                      <p className="text-xs text-emerald-600">Koordinator</p>
                    </div>
                  </div>
                )}
                {coTeacher.map((p) => (
                  <div key={p.guru.id} className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                      {p.guru.profile.namaLengkap.charAt(0)}
                    </div>
                    <p className="text-sm text-gray-700 truncate">{p.guru.profile.namaLengkap}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stat mini cards */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Statistik</p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Materi" value={mapel._count.materiPelajaran} sub="konten diunggah" />
              <StatCard label="Tugas" value={mapel._count.tugas} sub="tugas dibuat" />
              <StatCard label="Absensi" value={mapel._count.absensi} sub="sesi absen" />
              <StatCard label="Penilaian" value={mapel._count.penilaian} sub="entri nilai" />
            </div>
          </div>

          {/* Navigasi */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Navigasi</p>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" leftIcon={<CalendarDays className="w-3.5 h-3.5" />}
                onClick={() => router.push(`/dashboard/absensi?mataPelajaranId=${mapel.id}`)}>
                Absensi
              </Button>
              <Button size="sm" variant="secondary" leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                onClick={() => router.push(`/dashboard/materi?mataPelajaranId=${mapel.id}`)}>
                Materi
              </Button>
              <Button size="sm" variant="secondary" leftIcon={<ClipboardList className="w-3.5 h-3.5" />}
                onClick={() => router.push(`/dashboard/tugas?mataPelajaranId=${mapel.id}`)}>
                Tugas
              </Button>
              <Button size="sm" variant="secondary" leftIcon={<BarChart2 className="w-3.5 h-3.5" />}
                onClick={() => router.push(`/dashboard/penilaian?mataPelajaranId=${mapel.id}`)}>
                Penilaian
              </Button>
              <Button size="sm" variant="secondary" leftIcon={<Users className="w-3.5 h-3.5" />}
                onClick={() => router.push(`/dashboard/kelas/${mapel.kelasId}`)}>
                Siswa Kelas
              </Button>
              <Button size="sm" variant="secondary" leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() => onExport(mapel)}>
                Export Nilai
              </Button>
            </div>
          </div>

          {/* Aksi CRUD */}
          {canCrud && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <Button size="sm" variant="secondary" className="w-full justify-start"
                leftIcon={<Edit className="w-3.5 h-3.5" />}
                onClick={() => onEdit(mapel)}>
                Edit Mata Pelajaran
              </Button>
              <Button size="sm" variant="secondary" className="w-full justify-start"
                leftIcon={<ToggleLeft className="w-3.5 h-3.5" />}
                onClick={() => onToggleActive(mapel)}>
                {mapel.isActive ? \'Nonaktifkan\' : \'Aktifkan\'} Mata Pelajaran
              </Button>
              <Button size="sm" variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => onDelete(mapel)}>
                Hapus Mata Pelajaran
              </Button>
            </div>
          )}

        </div>
      )}
    </SlideOver>
  )
}
'''
    write_file(
        base,
        "src/app/dashboard/pembelajaran/manajemen/_components/mapel-slideover.tsx",
        mapel_slideover,
        "MapelSlideover",
    )

    # ─────────────────────────────────────────────────────────────
    # STEP 9 — MapelTable
    # ─────────────────────────────────────────────────────────────
    print("\n=== STEP 9: MapelTable ===")

    mapel_table = '''\
\'use client\'

import { BookOpen, Edit, Trash2, Download, CalendarDays, ClipboardList, BarChart2 } from \'lucide-react\'
import { Button, Badge, Skeleton } from \'@/components/ui\'
import { useRouter } from \'next/navigation\'
import type { MataPelajaran } from \'@/types/akademik.types\'

interface Props {
  data:           MataPelajaran[]
  isLoading:      boolean
  onRowClick:     (mapel: MataPelajaran) => void
  onEdit:         (mapel: MataPelajaran) => void
  onDelete:       (mapel: MataPelajaran) => void
  onExport:       (mapel: MataPelajaran) => void
  canCrud:        boolean
}

function formatJadwal(mapel: MataPelajaran): string {
  if (!mapel.jadwalPelajaran || mapel.jadwalPelajaran.length === 0) return \'-\'
  return mapel.jadwalPelajaran
    .map((j) => `${j.hari.slice(0, 3)} ${j.jamMulai.slice(0, 5)}`)
    .join(\', \')
}

function formatPengajar(mapel: MataPelajaran): string {
  if (!mapel.pengajar || mapel.pengajar.length === 0) return \'Belum ada pengajar\'
  const koordinator = mapel.pengajar.find((p) => p.isKoordinator)
  const nama = koordinator?.guru.profile.namaLengkap ?? mapel.pengajar[0].guru.profile.namaLengkap
  const extra = mapel.pengajar.length > 1 ? ` +${mapel.pengajar.length - 1}` : \'\'
  return nama + extra
}

export function MapelTable({ data, isLoading, onRowClick, onEdit, onDelete, onExport, canCrud }: Props) {
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[\'Mata Pelajaran\', \'Pengajar\', \'Jadwal\', \'Ruangan\', \'KKM\', \'Status\', \'\'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 7 }).map((__, j) => (
                  <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-24 rounded" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <BookOpen className="w-10 h-10 opacity-40" />
          <p className="text-sm font-medium">Tidak ada mata pelajaran</p>
          <p className="text-xs">Coba ubah filter atau tambah mata pelajaran baru</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[\'Mata Pelajaran\', \'Pengajar\', \'Jadwal\', \'Ruangan\', \'KKM\', \'Status\', \'Aksi\'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.map((mapel) => (
              <tr
                key={mapel.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onRowClick(mapel)}
              >
                <td className="px-4 py-3">
                  <p className="font-semibold text-gray-800">{mapel.mataPelajaranTingkat.masterMapel.nama}</p>
                  <p className="text-xs text-gray-400">{mapel.mataPelajaranTingkat.masterMapel.kode}</p>
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-[180px]">
                  <p className="truncate">{formatPengajar(mapel)}</p>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{formatJadwal(mapel)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {mapel.jadwalPelajaran?.[0]?.ruangan ?? \'-\'}
                </td>
                <td className="px-4 py-3 text-gray-600">{mapel.kkm}</td>
                <td className="px-4 py-3">
                  <Badge variant={mapel.isActive ? \'success\' : \'danger\'}>
                    {mapel.isActive ? \'Aktif\' : \'Nonaktif\'}
                  </Badge>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost"
                      leftIcon={<CalendarDays className="w-3.5 h-3.5" />}
                      onClick={() => router.push(`/dashboard/absensi?mataPelajaranId=${mapel.id}`)}>
                      Absen
                    </Button>
                    <Button size="sm" variant="ghost"
                      leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                      onClick={() => router.push(`/dashboard/materi?mataPelajaranId=${mapel.id}`)}>
                      Materi
                    </Button>
                    <Button size="sm" variant="ghost"
                      leftIcon={<ClipboardList className="w-3.5 h-3.5" />}
                      onClick={() => router.push(`/dashboard/tugas?mataPelajaranId=${mapel.id}`)}>
                      Tugas
                    </Button>
                    <Button size="sm" variant="ghost"
                      leftIcon={<BarChart2 className="w-3.5 h-3.5" />}
                      onClick={() => router.push(`/dashboard/penilaian?mataPelajaranId=${mapel.id}`)}>
                      Nilai
                    </Button>
                    {canCrud && (
                      <>
                        <Button size="sm" variant="ghost"
                          leftIcon={<Edit className="w-3.5 h-3.5" />}
                          onClick={() => onEdit(mapel)} />
                        <Button size="sm" variant="ghost"
                          leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
                          onClick={() => onDelete(mapel)} />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col gap-3">
        {data.map((mapel) => (
          <div key={mapel.id} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3"
            onClick={() => onRowClick(mapel)}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-800">{mapel.mataPelajaranTingkat.masterMapel.nama}</p>
                <p className="text-xs text-gray-400 mt-0.5">{mapel.mataPelajaranTingkat.masterMapel.kode}</p>
              </div>
              <Badge variant={mapel.isActive ? \'success\' : \'danger\'}>
                {mapel.isActive ? \'Aktif\' : \'Nonaktif\'}
              </Badge>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <p><span className="font-medium">Pengajar:</span> {formatPengajar(mapel)}</p>
              <p><span className="font-medium">Jadwal:</span> {formatJadwal(mapel)}</p>
              <p><span className="font-medium">KKM:</span> {mapel.kkm}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
'''
    write_file(
        base,
        "src/app/dashboard/pembelajaran/manajemen/_components/mapel-table.tsx",
        mapel_table,
        "MapelTable",
    )

    # ─────────────────────────────────────────────────────────────
    # STEP 10 — Page Manajemen
    # ─────────────────────────────────────────────────────────────
    print("\n=== STEP 10: Manajemen Page ===")

    manajemen_page = '''\
\'use client\'

import { useState, useMemo, useEffect, useCallback } from \'react\'
import { useSearchParams } from \'next/navigation\'
import { Plus, Copy, Download } from \'lucide-react\'
import { PageHeader, Button } from \'@/components/ui\'
import { toast } from \'sonner\'
import { useMataPelajaranList, useDeleteMataPelajaran, useToggleMataPelajaranActive } from \'@/hooks/useMataPelajaran\'
import { useTahunAjaranActive } from \'@/hooks/useTahunAjaran\'
import { useSemesterByTahunAjaran } from \'@/hooks/useSemester\'
import { useKelasList } from \'@/hooks/useKelas\'
import { useAuthStore } from \'@/stores/auth.store\'
import { canCrudMapel, isManajemen } from \'@/lib/helpers/role\'
import { mataPelajaranApi } from \'@/lib/api/mata-pelajaran.api\'
import { MapelFilters }         from \'./_components/mapel-filters\'
import { MapelTable }           from \'./_components/mapel-table\'
import { MapelSlideover }       from \'./_components/mapel-slideover\'
import { MapelFormModal }       from \'./_components/mapel-form-modal\'
import { MapelBulkCopyModal }   from \'./_components/mapel-bulk-copy-modal\'
import type { MataPelajaran }   from \'@/types/akademik.types\'
import { useQuery } from \'@tanstack/react-query\'
import api from \'@/lib/axios\'
import type { TingkatKelas } from \'@/types/akademik.types\'

function useTingkatKelasList() {
  return useQuery({
    queryKey: [\'tingkat-kelas\'],
    queryFn: async (): Promise<TingkatKelas[]> => {
      const res = await api.get<TingkatKelas[]>(\'/tingkat-kelas\')
      return res.data ?? []
    },
    staleTime: 1000 * 60 * 10,
  })
}

export default function PembelajaranManajemenPage() {
  const { user }        = useAuthStore()
  const searchParams    = useSearchParams()
  const kelasIdCtx      = searchParams.get(\'kelasId\') ?? \'\'

  const boleAkses  = isManajemen(user?.role)
  const bolesCrud  = canCrudMapel(user?.role)

  // ── Filter state ──────────────────────────────────────────────
  const [semesterId,  setSemesterId]  = useState(\'\')
  const [kelasId,     setKelasId]     = useState(kelasIdCtx)
  const [tingkatId,   setTingkatId]   = useState(\'\')
  const [search,      setSearch]      = useState(\'\')
  const [page,        setPage]        = useState(1)

  // ── Modal/Slideover state ─────────────────────────────────────
  const [slideTarget,    setSlideTarget]    = useState<MataPelajaran | null>(null)
  const [formOpen,       setFormOpen]       = useState(false)
  const [editTarget,     setEditTarget]     = useState<MataPelajaran | null>(null)
  const [bulkCopyOpen,   setBulkCopyOpen]   = useState(false)

  // ── Resolve konteks kelas → tahunAjaranId & tingkatKelasId ────
  const { data: tahunAjaranList = [] } = useTahunAjaranActive()
  const { data: tingkatList = [] }     = useTingkatKelasList()
  const { data: kelasList = [] }       = useKelasList(
    tahunAjaranList[0]?.id ? { tahunAjaranId: tahunAjaranList[0].id } : undefined,
  )

  const kelasCtxObj     = kelasList.find((k) => k.id === kelasIdCtx)
  const tahunAjaranIdCtx = kelasCtxObj?.tahunAjaranId ?? tahunAjaranList[0]?.id ?? \'\'
  const tingkatKelasIdCtx = kelasCtxObj?.tingkatKelasId ?? \'\'

  const { data: semesterList = [] } = useSemesterByTahunAjaran(tahunAjaranIdCtx || null)

  // Default semester aktif
  useEffect(() => {
    if (semesterList.length > 0 && !semesterId) {
      const aktif = semesterList.find((s) => s.isActive)
      if (aktif) setSemesterId(aktif.id)
    }
  }, [semesterList, semesterId])

  // ── Fetch mata pelajaran ──────────────────────────────────────
  const filter = useMemo(() => ({
    semesterId:  semesterId  || undefined,
    kelasId:     kelasId     || undefined,
    search:      search      || undefined,
    page,
    limit: 20,
  }), [semesterId, kelasId, search, page])

  const { data: mapelResponse, isLoading } = useMataPelajaranList(filter)
  const mapelList = mapelResponse?.data ?? []
  const meta      = mapelResponse?.meta

  // Filter tingkat di client (tidak ada param tingkat di API)
  const filtered = useMemo(() => {
    if (!tingkatId) return mapelList
    return mapelList.filter(
      (m) => m.mataPelajaranTingkat.tingkatKelasId === tingkatId,
    )
  }, [mapelList, tingkatId])

  // ── Mutations ─────────────────────────────────────────────────
  const deleteMutation       = useDeleteMataPelajaran()
  const toggleActiveMutation = useToggleMataPelajaranActive()

  const handleDelete = useCallback(async (mapel: MataPelajaran) => {
    if (!confirm(`Hapus mata pelajaran "${mapel.mataPelajaranTingkat.masterMapel.nama}"?`)) return
    await deleteMutation.mutateAsync(mapel.id)
    setSlideTarget(null)
  }, [deleteMutation])

  const handleToggleActive = useCallback(async (mapel: MataPelajaran) => {
    await toggleActiveMutation.mutateAsync(mapel.id)
    setSlideTarget(null)
  }, [toggleActiveMutation])

  const handleExport = useCallback(async (mapel: MataPelajaran) => {
    try {
      const blob = await mataPelajaranApi.exportNilai({
        kelasId:         mapel.kelasId,
        mataPelajaranId: mapel.id,
        tahunAjaranId:   tahunAjaranIdCtx,
      })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement(\'a\')
      a.href     = url
      a.download = `nilai-${mapel.mataPelajaranTingkat.masterMapel.kode}-${mapel.kelas.namaKelas}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error(\'Gagal mengunduh file ekspor\')
    }
  }, [tahunAjaranIdCtx])

  if (!boleAkses) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p className="text-sm">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mata Pelajaran"
        description={kelasIdCtx && kelasCtxObj ? `Kelas ${kelasCtxObj.namaKelas}` : \'Semua Kelas\'}
        actions={
          <div className="flex gap-2">
            {bolesCrud && (
              <>
                <Button
                  variant="secondary"
                  leftIcon={<Copy className="w-4 h-4" />}
                  onClick={() => setBulkCopyOpen(true)}
                >
                  Salin Bulk
                </Button>
                <Button
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => { setEditTarget(null); setFormOpen(true) }}
                >
                  Tambah
                </Button>
              </>
            )}
          </div>
        }
      />

      <MapelFilters
        semesterList={semesterList}
        kelasList={kelasList}
        tingkatList={tingkatList}
        semesterId={semesterId}
        kelasId={kelasId}
        tingkatId={tingkatId}
        search={search}
        onSemesterChange={setSemesterId}
        onKelasChange={setKelasId}
        onTingkatChange={setTingkatId}
        onSearchChange={setSearch}
        kelasLocked={!!kelasIdCtx}
      />

      <MapelTable
        data={filtered}
        isLoading={isLoading}
        onRowClick={setSlideTarget}
        onEdit={(m) => { setEditTarget(m); setFormOpen(true) }}
        onDelete={handleDelete}
        onExport={handleExport}
        canCrud={bolesCrud}
      />

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <p>Total {meta.total} mata pelajaran</p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Prev
            </Button>
            <span className="px-3 py-1 rounded-lg border border-gray-200 text-xs">
              {page} / {meta.totalPages}
            </span>
            <Button size="sm" variant="secondary" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* SlideOver */}
      <MapelSlideover
        mapel={slideTarget}
        onClose={() => setSlideTarget(null)}
        onEdit={(m) => { setEditTarget(m); setFormOpen(true); setSlideTarget(null) }}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        onExport={handleExport}
        canCrud={bolesCrud}
      />

      {/* Form Modal */}
      <MapelFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        editData={editTarget}
        kelasId={kelasIdCtx || undefined}
        tahunAjaranId={tahunAjaranIdCtx || undefined}
        tingkatKelasId={tingkatKelasIdCtx || undefined}
      />

      {/* Bulk Copy Modal */}
      <MapelBulkCopyModal
        open={bulkCopyOpen}
        onClose={() => setBulkCopyOpen(false)}
        kelasId={kelasIdCtx || undefined}
        tahunAjaranId={tahunAjaranIdCtx || undefined}
      />
    </div>
  )
}
'''
    write_file(
        base,
        "src/app/dashboard/pembelajaran/manajemen/page.tsx",
        manajemen_page,
        "PembelajaranManajemenPage",
    )

    print("\n=== Batch 3 selesai. ===")
    print("""
File yang di-generate:
  src/types/akademik.types.ts                                           (update shape)
  src/lib/api/mata-pelajaran.api.ts                                     (pagination + export)
  src/hooks/useMataPelajaran.ts                                         (useMapelTingkatById)
  src/app/dashboard/pembelajaran/manajemen/_components/
    guru-pool-select.tsx
    mapel-form-modal.tsx
    mapel-bulk-copy-modal.tsx
    mapel-filters.tsx
    mapel-slideover.tsx
    mapel-table.tsx
  src/app/dashboard/pembelajaran/manajemen/page.tsx

CATATAN:
  1. useTingkatKelasList() inline di page.tsx — hapus jika sudah ada di hooks/
  2. Route navigasi (absensi, materi, tugas, penilaian) di slideover & tabel
     disesuaikan nanti setelah route-route tersebut dibuat
  3. Export nilai butuh tahunAjaranId — diambil dari konteks kelas
  4. Filter tingkat dilakukan di client karena API tidak support param tingkatId
""")

if __name__ == "__main__":
    main()