import os
import sys

def remove_file(base: str, rel: str):
    path = os.path.join(base, rel)
    if os.path.exists(path):
        os.remove(path)
        print(f"  OK (hapus): {rel}")
    else:
        print(f"  SKIP (tidak ada): {rel}")

def write_file(base: str, rel: str, content: str, check: str):
    path = os.path.join(base, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    with open(path, "r", encoding="utf-8") as f:
        v = f.read()
    print(f"  {'OK' if check in v else 'GAGAL'}: {rel}")

def patch_file(base: str, rel: str, needle: str, append: str, label: str):
    path = os.path.join(base, rel)
    if not os.path.exists(path):
        print(f"  GAGAL (file tidak ada): {rel}")
        return
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    if append.strip()[:40] in content:
        print(f"  SKIP (sudah ada): {label}")
        return
    if needle not in content:
        print(f"  GAGAL (needle tidak ditemukan): {label}")
        return
    new_content = content.replace(needle, needle + append)
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    with open(path, "r", encoding="utf-8") as f:
        v = f.read()
    print(f"  {'OK' if append.strip()[:40] in v else 'GAGAL'}: {label}")

def main():
    base = sys.argv[1] if len(sys.argv) > 1 else "../"
    base = os.path.abspath(base)
    print(f"Base dir: {base}\n")

    # ─────────────────────────────────────────────────────────────
    # STEP 1 — Hapus file Batch 1 yang redundan
    # ─────────────────────────────────────────────────────────────
    print("=== STEP 1: Hapus file Batch 1 redundan ===")
    remove_file(base, "src/types/pembelajaran.types.ts")
    remove_file(base, "src/lib/api/pembelajaran.api.ts")
    remove_file(base, "src/hooks/use-pembelajaran.ts")

    # ─────────────────────────────────────────────────────────────
    # STEP 2 — Overwrite akademik.types.ts (lengkap)
    # ─────────────────────────────────────────────────────────────
    print("\n=== STEP 2: Update akademik.types.ts ===")

    akademik_types = '''\
// ============================================================
// akademik.types.ts
// Types untuk modul Akademik:
//   TingkatKelas, MasterMapel, MataPelajaranTingkat,
//   MataPelajaran (team teaching), Jadwal, Stat, Todo
// ============================================================

export type Jenjang       = 'SMA' | 'MA'
export type KategoriMapel = 'WAJIB' | 'PEMINATAN' | 'LINTAS_MINAT' | 'MULOK' | 'PENGEMBANGAN_DIRI'
export type KelompokMapel = 'A' | 'B' | 'C'
// TODO: tambah nilai enum baru di sini sesuai backend

export type HariEnum =
  | 'SENIN' | 'SELASA' | 'RABU' | 'KAMIS'
  | 'JUMAT' | 'SABTU' | 'MINGGU'

export type NamaSemester = 'GANJIL' | 'GENAP'

// ── Tingkat Kelas ─────────────────────────────────────────────
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

export interface UpdateTingkatKelasPayload
  extends Partial<CreateTingkatKelasPayload> {}

// ── Master Mapel ──────────────────────────────────────────────
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

export interface UpdateMasterMapelPayload
  extends Partial<CreateMasterMapelPayload> {}

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

export interface GuruMapel {
  id:                     string
  mataPelajaranTingkatId: string
  guruId:                 string
  guru:                   GuruItem
}

// ── MataPelajaranTingkat ──────────────────────────────────────
export interface MataPelajaranTingkat {
  id:             string
  masterMapelId:  string
  tingkatKelasId: string
  masterMapel:    Pick<MasterMapel, 'id' | 'kode' | 'nama' | 'kategori' | 'kelompok'>
  tingkatKelas:   Pick<TingkatKelas, 'id' | 'nama' | 'jenjang'>
  guruMapel:      GuruMapel[]
  createdAt:      string
  updatedAt:      string
}

export interface CreateMapelTingkatPayload {
  masterMapelId:  string
  tingkatKelasId: string
}

export interface SetGuruPoolPayload {
  guruIds: string[]
}

// ── Pengajar MataPelajaran (team teaching) ────────────────────
// CATATAN: Backend sudah diupdate dari single guruId ke array pengajar
export interface PengajarMapel {
  mataPelajaranId: string
  guruId:          string
  isKoordinator:   boolean
  createdAt:       string
  guru?:           GuruItem
}

// ── Jadwal Singkat (relasi dalam MataPelajaran) ───────────────
export interface JadwalSingkat {
  id:        string
  hari:      HariEnum
  jamMulai:  string
  jamSelesai: string
  ruangan:   string | null
  guruId:    string
  guru?:     GuruItem
}

// ── Semester Singkat ──────────────────────────────────────────
export interface SemesterSingkat {
  id:           string
  nama:         NamaSemester
  urutan:       number
  isActive:     boolean
  tahunAjaranId: string
}

// ── Kelas Singkat ─────────────────────────────────────────────
export interface KelasSingkat {
  id:       string
  namaKelas: string
  kodeKelas: string | null
  ruangan:  string | null
}

// ── Count Agregat ─────────────────────────────────────────────
// CATATAN: Sesuaikan setelah konfirmasi backend menyertakan _count
export interface MataPelajaranCount {
  materiPelajaran: number
  tugas:           number
  absensi:         number
  penilaian:       number
}

// ── MataPelajaran (sesi aktif per kelas+semester) ─────────────
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

  // Relasi wajib (diasumsikan selalu di-include backend)
  mataPelajaranTingkat: {
    id:          string
    masterMapel: Pick<MasterMapel, 'id' | 'kode' | 'nama' | 'kategori' | 'kelompok'>
    tingkatKelas: Pick<TingkatKelas, 'id' | 'nama' | 'jenjang'>
  }
  semester: SemesterSingkat
  kelas:    KelasSingkat

  // Team teaching — CATATAN: sesuaikan jika backend belum eager-load
  pengajar?: PengajarMapel[]

  // Jadwal — CATATAN: mungkin tidak di-include di list, hanya detail
  jadwalPelajaran?: JadwalSingkat[]

  // Agregat — CATATAN: sesuaikan setelah cek Network tab
  _count?: MataPelajaranCount
}

export interface CreateMataPelajaranPayload {
  mataPelajaranTingkatId: string
  semesterId:             string
  kelasId:                string
  kkm?:                   number
  bobot?:                 number
  guruIds?:               string[]  // team teaching
}

export interface UpdateMataPelajaranPayload {
  kkm?:      number
  bobot?:    number
  isActive?: boolean
  guruIds?:  string[]  // team teaching
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
}

// ── Stat Ringkasan (untuk SlideOver & Card) ───────────────────
// CATATAN: field ini dari _count atau endpoint report
// Sesuaikan setelah endpoint tersedia datanya

export interface StatAbsensiMapel {
  hadir:            number
  sakit:            number
  izin:             number
  alpa:             number
  total:            number
  persentaseHadir:  number
}

export interface StatTugasMapel {
  totalTugas:            number
  sudahDikumpulkan:      number
  belumDikumpulkan:      number
  persentaseKetuntasan:  number
}

export interface StatPenilaianMapel {
  totalNilai: number
  rataRata:   number | null
}

export interface StatMateriMapel {
  totalMateri: number
  published:   number
}

export interface MapelStatRingkasan {
  absensi:   StatAbsensiMapel
  tugas:     StatTugasMapel
  penilaian: StatPenilaianMapel
  materi:    StatMateriMapel
}

// ── Todo Item (untuk card siswa & guru) ──────────────────────
export type TodoJenis =
  | 'TUGAS_BELUM_KUMPUL'
  | 'ABSENSI_BELUM_ISI'
  | 'ABSENSI_KOSONG'

export interface TodoItem {
  jenis:           TodoJenis
  label:           string
  mataPelajaranId: string
}
'''

    write_file(base, "src/types/akademik.types.ts", akademik_types,
               "PengajarMapel")

    # ─────────────────────────────────────────────────────────────
    # STEP 3 — Overwrite useMataPelajaran.ts (lengkap)
    # ─────────────────────────────────────────────────────────────
    print("\n=== STEP 3: Update useMataPelajaran.ts ===")

    use_mata_pelajaran = '''\
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
    onError: (err: Error) => {
      toast.error(err.message ?? \'Gagal menambahkan master mapel\')
    },
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
    onError: (err: Error) => {
      toast.error(err.message ?? \'Gagal memperbarui master mapel\')
    },
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
    onError: (err: Error) => {
      toast.error(err.message ?? \'Gagal menghapus master mapel\')
    },
  })
}

// ── MapelTingkat ──────────────────────────────────────────────
export function useMapelTingkatByTingkat(tingkatKelasId: string | null) {
  return useQuery({
    queryKey: mapelTingkatKeys.byTingkat(tingkatKelasId ?? \'\'),
    queryFn:  () => mapelTingkatApi.getByTingkat(tingkatKelasId!),
    enabled:  !!tingkatKelasId,
    staleTime: 1000 * 60 * 3,
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
    onError: (err: Error) => {
      toast.error(err.message ?? \'Gagal menambahkan mapel tingkat\')
    },
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
    onError: (err: Error) => {
      toast.error(err.message ?? \'Gagal menghapus mapel tingkat\')
    },
  })
}

// ── Guru Pool ─────────────────────────────────────────────────
export function useGuruList() {
  return useQuery({
    queryKey: guruKeys.all,
    queryFn:  () => usersApi.getByRole(\'GURU\'),
    staleTime: 1000 * 60 * 10,
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
    onError: (err: Error) => {
      toast.error(err.message ?? \'Gagal menambahkan guru\')
    },
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
    onError: (err: Error) => {
      toast.error(err.message ?? \'Gagal menghapus guru\')
    },
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
    onError: (err: Error) => {
      toast.error(err.message ?? \'Gagal memperbarui pool guru\')
    },
  })
}

// ── MataPelajaran (sesi aktif) ────────────────────────────────
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
    onError: (err: Error) => {
      toast.error(err.message ?? \'Gagal menambahkan mata pelajaran\')
    },
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
    onError: (err: Error) => {
      toast.error(err.message ?? \'Gagal memperbarui mata pelajaran\')
    },
  })
}

export function useToggleMataPelajaranActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mataPelajaranApi.toggleActive(id),
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: [\'mata-pelajaran\'] })
      qc.invalidateQueries({ queryKey: mataPelajaranKeys.detail(id) })
      const status = data.isActive ? \'diaktifkan\' : \'dinonaktifkan\'
      toast.success(`Mata pelajaran berhasil ${status}`)
    },
    onError: (err: Error) => {
      toast.error(err.message ?? \'Gagal mengubah status mata pelajaran\')
    },
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
    onError: (err: Error) => {
      toast.error(err.message ?? \'Gagal menghapus mata pelajaran\')
    },
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
    onError: (err: Error) => {
      toast.error(err.message ?? \'Gagal menyalin mata pelajaran\')
    },
  })
}
'''

    write_file(base, "src/hooks/useMataPelajaran.ts", use_mata_pelajaran,
               "useBulkCopyMataPelajaran")

    # ─────────────────────────────────────────────────────────────
    # STEP 4 — Tambah helper role ke lib/helpers/role.ts
    # ─────────────────────────────────────────────────────────────
    print("\n=== STEP 4: Buat lib/helpers/role.ts ===")

    role_helper = '''\
// ============================================================
// lib/helpers/role.ts
// Konstanta grup role dan helper akses untuk seluruh modul
// ============================================================

import type { UserRole } from \'@/types/enums\'

// ── Grup Role ─────────────────────────────────────────────────

/** Role grup manajemen sekolah */
export const ROLE_MANAJEMEN = [
  \'SUPER_ADMIN\',
  \'ADMIN\',
  \'KEPALA_SEKOLAH\',
  \'WAKIL_KEPALA\',
  \'STAFF_TU\',
] as const satisfies readonly UserRole[]

/** Role yang bisa CRUD (subset manajemen) */
export const ROLE_CRUD_MAPEL = [
  \'SUPER_ADMIN\',
  \'ADMIN\',
  \'WAKIL_KEPALA\',
  \'STAFF_TU\',
] as const satisfies readonly UserRole[]

/**
 * Role guru — WALI_KELAS masuk di sini karena tampilan
 * halaman pembelajaran-nya sama dengan guru (grid card)
 */
export const ROLE_GURU = [
  \'GURU\',
  \'WALI_KELAS\',
] as const satisfies readonly UserRole[]

/** Role siswa dan orang tua */
export const ROLE_SISWA_ORTU = [
  \'SISWA\',
  \'ORANG_TUA\',
] as const satisfies readonly UserRole[]

/**
 * Role yang boleh akses halaman kelas-belajar (view only).
 * WALI_KELAS termasuk karena perlu lihat kelas yang dia ampu.
 */
export const ROLE_AKSES_KELAS_BELAJAR = [
  ...ROLE_MANAJEMEN,
  \'WALI_KELAS\',
] as const satisfies readonly UserRole[]

// ── Helper ────────────────────────────────────────────────────

/** Cek apakah role termasuk dalam daftar yang diizinkan */
export function canAccess(
  userRole: UserRole | undefined | null,
  allowedRoles: readonly UserRole[],
): boolean {
  if (!userRole) return false
  return (allowedRoles as readonly string[]).includes(userRole)
}

export function isManajemen(role: UserRole | undefined | null): boolean {
  return canAccess(role, ROLE_MANAJEMEN)
}

export function isGuru(role: UserRole | undefined | null): boolean {
  return canAccess(role, ROLE_GURU)
}

export function isSiswaOrtu(role: UserRole | undefined | null): boolean {
  return canAccess(role, ROLE_SISWA_ORTU)
}

export function canCrudMapel(role: UserRole | undefined | null): boolean {
  return canAccess(role, ROLE_CRUD_MAPEL)
}

/**
 * Tentukan sub-route pembelajaran berdasarkan role.
 * Dipakai di dashboard/pembelajaran/page.tsx untuk redirect.
 */
export function getPembelajaranRoute(role: UserRole | undefined | null): string {
  if (!role) return \'/login\'
  if (isManajemen(role)) return \'/dashboard/pembelajaran/manajemen\'
  if (isGuru(role))      return \'/dashboard/pembelajaran/guru\'
  if (isSiswaOrtu(role)) return \'/dashboard/pembelajaran/siswa\'
  return \'/dashboard\'
}
'''

    write_file(base, "src/lib/helpers/role.ts", role_helper,
               "getPembelajaranRoute")

    print("\n=== Batch 1 Revisi selesai. ===")
    print("""
Ringkasan:
  - HAPUS  : src/types/pembelajaran.types.ts
  - HAPUS  : src/lib/api/pembelajaran.api.ts
  - HAPUS  : src/hooks/use-pembelajaran.ts
  - UPDATE : src/types/akademik.types.ts  (team teaching, jadwal, stat, todo)
  - UPDATE : src/hooks/useMataPelajaran.ts (hooks lengkap + toast)
  - BARU   : src/lib/helpers/role.ts      (grup role + helper)

CATATAN:
  - MataPelajaran.pengajar[] → optional, sesuaikan setelah cek Network tab
  - MataPelajaran._count     → optional, sesuaikan setelah cek Network tab
  - Jika UserRole type belum ada di @/types/enums, pindahkan UserRole
    dari definisi yang ada ke sana atau sesuaikan import di role.ts
""")

if __name__ == "__main__":
    main()