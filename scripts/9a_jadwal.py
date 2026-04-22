#!/usr/bin/env python3
"""
BATCH 1 — JADWAL FOUNDATION
Generates:
  1. src/types/jadwal.types.ts
  2. src/lib/api/jadwal.api.ts
  3. src/hooks/jadwal/useJadwal.ts

Run from project root:
  python batch1_jadwal_foundation.py
"""

import os

BASE = os.path.join("src")

FILES = {}

# ─────────────────────────────────────────────────────────────────
# 1. TYPES
# ─────────────────────────────────────────────────────────────────
FILES["types/jadwal.types.ts"] = '''\
// ─────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────
export type HariEnum =
  | "SENIN"
  | "SELASA"
  | "RABU"
  | "KAMIS"
  | "JUMAT"
  | "SABTU"

export const HARI_LIST: HariEnum[] = [
  "SENIN",
  "SELASA",
  "RABU",
  "KAMIS",
  "JUMAT",
  "SABTU",
]

// ─────────────────────────────────────────────────
// Core Entities
// ─────────────────────────────────────────────────
export interface JadwalPelajaran {
  id: string
  kelasId: string
  semesterId: string
  mataPelajaranId: string
  guruId: string
  hari: HariEnum
  jamMulai: string        // ISO string — "1970-01-01T07:30:00.000Z"
  jamSelesai: string
  ruanganId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  // Relations
  kelas?: {
    namaKelas: string
    tingkatKelas?: { nama: string }
  }
  semester?: {
    nama: string
    tahunAjaran?: { nama: string }
  }
  mataPelajaran?: {
    id: string
    mataPelajaranTingkatId: string
    kelasId: string
    kkm: number
    bobot: number
    isActive: boolean
    mataPelajaranTingkat?: {
      id: string
      masterMapel: {
        id: string
        nama: string
        kode: string
        kategori: string
      }
    }
  }
  guru?: {
    id: string
    email: string
    role: string
    profile: { namaLengkap: string }
  }
  ruangan?: RuanganRef | null
}

export interface RuanganRef {
  id: string
  kode: string
  nama: string
}

// ─────────────────────────────────────────────────
// Roster
// ─────────────────────────────────────────────────
export interface RosterItem {
  jadwalId: string
  jamMulai: string
  jamSelesai: string
  mataPelajaran: {
    id: string
    nama: string
    kode: string
  }
  guru: {
    id: string
    namaLengkap: string
  }
  ruangan: RuanganRef | null
}

export interface RosterKelasResponse {
  kelas: {
    id: string
    namaKelas: string
    tingkatKelas: { nama: string }
  }
  semester: string
  roster: Record<HariEnum, RosterItem[]>
  totalJam: number
}

export interface RosterGuruRosterItem extends Omit<RosterItem, "guru"> {
  kelas: { id: string; namaKelas: string }
}

export interface RosterGuruResponse {
  guruId: string
  semester: string
  roster: Record<HariEnum, RosterGuruRosterItem[]>
  totalJam: number
}

// ─────────────────────────────────────────────────
// Ringkasan Semua Kelas
// ─────────────────────────────────────────────────
export interface RingkasanMapelItem {
  mapelId: string
  namaMapel: string
  guru: string
  totalJam: number
}

export interface RingkasanKelasItem {
  kelasId: string
  namaKelas: string
  totalSemuaJam: number
  rincianPerMapel: RingkasanMapelItem[]
}

// ─────────────────────────────────────────────────
// Beban Mengajar
// ─────────────────────────────────────────────────
export interface BebanMengajarDetail {
  mapelId: string
  kelas: string
  hari: HariEnum
  jam: string
}

export interface BebanMengajarMapel {
  mapelTingkatId: string
  namaMapel: string
  totalJam: number
  detailJadwal: BebanMengajarDetail[]
}

export interface BebanMengajarResponse {
  guruId: string
  semesterId: string
  totalSemuaJam: number
  rincianPerMapel: BebanMengajarMapel[]
}

// ─────────────────────────────────────────────────
// Ketersediaan
// ─────────────────────────────────────────────────
export interface KetersediaanRequest {
  semesterId: string
  hari: HariEnum
  jamMulai: string   // "HH:mm"
  jamSelesai: string // "HH:mm"
}

export interface GuruAvailable {
  id: string
  namaLengkap: string
}

export interface RuanganAvailable {
  id: string
  kode: string
  nama: string
}

export interface KetersediaanResponse {
  guru: GuruAvailable[]
  ruangan: RuanganAvailable[]
}

// ─────────────────────────────────────────────────
// Rekap Guru Mapel Tingkat
// ─────────────────────────────────────────────────
export interface RekapGuruMapelItem {
  mataPelajaranTingkatId: string
  namaMapel: string
  kodeMapel: string
  tingkat: string
  jenjang: string
}

export interface RekapGuruItem {
  guruId: string
  namaLengkap: string
  nip: string
  totalMapelDiajarkan: number
  daftarMapel: RekapGuruMapelItem[]
}

// ─────────────────────────────────────────────────
// Payloads / DTOs
// ─────────────────────────────────────────────────
export interface CreateJadwalPayload {
  hari: HariEnum
  jamMulai: string    // "HH:mm"
  jamSelesai: string  // "HH:mm"
  kelasId: string
  semesterId: string
  guruId: string
  mataPelajaranId: string
  ruanganId?: string
}

export interface BulkJadwalItem {
  mataPelajaranId: string
  guruId: string
  ruanganId?: string
  hari: HariEnum
  jamMulai: string
  jamSelesai: string
}

export interface BulkJadwalPayload {
  kelasId: string
  semesterId: string
  jadwal: BulkJadwalItem[]
}

export interface BulkMapelJadwalItem {
  kelasId: string
  ruanganId?: string
  hari: HariEnum
  jamMulai: string
  jamSelesai: string
}

export interface BulkMapelJadwalPayload {
  semesterId: string
  mataPelajaranId: string
  guruId: string
  jadwal: BulkMapelJadwalItem[]
}

export interface CopySemesterPayload {
  sourceSemesterId: string
  targetSemesterId: string
}

// ─────────────────────────────────────────────────
// Filter / Query Params
// ─────────────────────────────────────────────────
export interface FilterJadwalParams {
  semesterId?: string
  kelasId?: string
  guruId?: string
  hari?: HariEnum
  isActive?: boolean
}

export interface FilterRingkasanParams {
  semesterId: string
  tingkatKelasId?: string
}

// ─────────────────────────────────────────────────
// Export Report Params
// ─────────────────────────────────────────────────
export interface ExportJadwalSekolahParams {
  semesterId: string
}

export interface ExportJadwalKelasParams {
  semesterId: string
  kelasId: string
}

export interface ExportJadwalGuruParams {
  semesterId: string
  guruId?: string   // Opsional — jika kosong, backend pakai userId login
}
'''

# ─────────────────────────────────────────────────────────────────
# 2. API
# ─────────────────────────────────────────────────────────────────
FILES["lib/api/jadwal.api.ts"] = '''\
import api from \'@/lib/axios\'
import type {
  JadwalPelajaran,
  RosterKelasResponse,
  RosterGuruResponse,
  RingkasanKelasItem,
  BebanMengajarResponse,
  KetersediaanRequest,
  KetersediaanResponse,
  RekapGuruItem,
  CreateJadwalPayload,
  BulkJadwalPayload,
  BulkMapelJadwalPayload,
  FilterJadwalParams,
  FilterRingkasanParams,
  ExportJadwalSekolahParams,
  ExportJadwalKelasParams,
  ExportJadwalGuruParams,
  HariEnum,
} from \'@/types/jadwal.types\'

// ─────────────────────────────────────────────────
// JADWAL PELAJARAN
// ─────────────────────────────────────────────────

/**
 * GET /jadwal-pelajaran/kelas/:kelasId/mingguan?semesterId=
 * Jadwal mingguan per kelas — grouped by hari
 */
async function getMingguan(
  kelasId: string,
  semesterId: string,
): Promise<Record<HariEnum, JadwalPelajaran[]>> {
  const { data } = await api.get(
    `/jadwal-pelajaran/kelas/${kelasId}/mingguan`,
    { params: { semesterId } },
  )
  return data
}

/**
 * GET /jadwal-pelajaran/guru/:guruId?semesterId=
 * Jadwal seorang guru di satu semester
 */
async function getByGuru(
  guruId: string,
  semesterId: string,
): Promise<JadwalPelajaran[]> {
  const { data } = await api.get(`/jadwal-pelajaran/guru/${guruId}`, {
    params: { semesterId },
  })
  return data
}

/**
 * GET /jadwal-pelajaran/:id
 */
async function getById(id: string): Promise<JadwalPelajaran> {
  const { data } = await api.get(`/jadwal-pelajaran/${id}`)
  return data
}

/**
 * POST /jadwal-pelajaran
 */
async function create(payload: CreateJadwalPayload): Promise<JadwalPelajaran> {
  const { data } = await api.post(\'/jadwal-pelajaran\', payload)
  return data
}

/**
 * POST /jadwal-pelajaran/bulk
 * Bulk insert per-kelas — all-or-nothing
 */
async function bulkByKelas(
  payload: BulkJadwalPayload,
): Promise<{ message: string; count: number }> {
  const { data } = await api.post(\'/jadwal-pelajaran/bulk\', payload)
  return data
}

/**
 * POST /jadwal-pelajaran/bulk-mapel
 * Bulk insert per-mata-pelajaran — smart replace
 */
async function bulkByMapel(
  payload: BulkMapelJadwalPayload,
): Promise<{ message: string; count: number }> {
  const { data } = await api.post(\'/jadwal-pelajaran/bulk-mapel\', payload)
  return data
}

/**
 * DELETE /jadwal-pelajaran/:id
 */
async function remove(id: string): Promise<void> {
  await api.delete(`/jadwal-pelajaran/${id}`)
}

/**
 * POST /jadwal-pelajaran/copy-semester?sourceSemesterId=&targetSemesterId=
 */
async function copySemester(
  sourceSemesterId: string,
  targetSemesterId: string,
): Promise<{ message: string; count: number }> {
  const { data } = await api.post(\'/jadwal-pelajaran/copy-semester\', null, {
    params: { sourceSemesterId, targetSemesterId },
  })
  return data
}

// ─────────────────────────────────────────────────
// KETERSEDIAAN (Availability Check)
// ─────────────────────────────────────────────────

/**
 * POST /jadwal-pelajaran/ketersediaan
 * Cek guru & ruangan yang tersedia di slot waktu tertentu
 */
async function checkKetersediaan(
  payload: KetersediaanRequest,
): Promise<KetersediaanResponse> {
  const { data } = await api.post(\'/jadwal-pelajaran/ketersediaan\', payload)
  return data
}

// ─────────────────────────────────────────────────
// BEBAN MENGAJAR
// ─────────────────────────────────────────────────

/**
 * GET /jadwal-pelajaran/beban-mengajar?semesterId=&guruId=
 */
async function getBebanMengajar(
  semesterId: string,
  guruId: string,
): Promise<BebanMengajarResponse> {
  const { data } = await api.get(\'/jadwal-pelajaran/beban-mengajar\', {
    params: { semesterId, guruId },
  })
  return data
}

// ─────────────────────────────────────────────────
// RINGKASAN SEMUA KELAS
// ─────────────────────────────────────────────────

/**
 * GET /jadwal-pelajaran/ringkasan-semua-kelas?semesterId=&tingkatKelasId=
 */
async function getRingkasanSemuaKelas(
  params: FilterRingkasanParams,
): Promise<RingkasanKelasItem[]> {
  const { data } = await api.get(\'/jadwal-pelajaran/ringkasan-semua-kelas\', {
    params,
  })
  return data
}

// ─────────────────────────────────────────────────
// ROSTER
// ─────────────────────────────────────────────────

/**
 * GET /roster/kelas?kelasId=&semesterId=
 */
async function getRosterKelas(
  kelasId: string,
  semesterId: string,
): Promise<RosterKelasResponse> {
  const { data } = await api.get(\'/roster/kelas\', {
    params: { kelasId, semesterId },
  })
  return data
}

/**
 * GET /roster/guru?guruId=&semesterId=
 */
async function getRosterGuru(
  guruId: string,
  semesterId: string,
): Promise<RosterGuruResponse> {
  const { data } = await api.get(\'/roster/guru\', {
    params: { guruId, semesterId },
  })
  return data
}

// ─────────────────────────────────────────────────
// REKAP GURU MAPEL TINGKAT
// ─────────────────────────────────────────────────

/**
 * GET /mata-pelajaran-tingkat/rekap-guru
 * List guru beserta mapel yang diajarkan (cross-tingkat)
 */
async function getRekapGuru(): Promise<RekapGuruItem[]> {
  const { data } = await api.get(\'/mata-pelajaran-tingkat/rekap-guru\')
  return data
}

// ─────────────────────────────────────────────────
// EXPORT (Blob)
// ─────────────────────────────────────────────────

/**
 * GET /report/export/jadwal-sekolah?semesterId=
 */
async function exportJadwalSekolah(
  params: ExportJadwalSekolahParams,
): Promise<Blob> {
  const { data } = await api.get(\'/report/export/jadwal-sekolah\', {
    params,
    responseType: \'blob\',
  })
  return data
}

/**
 * GET /report/export/jadwal-kelas?semesterId=&kelasId=
 */
async function exportJadwalKelas(
  params: ExportJadwalKelasParams,
): Promise<Blob> {
  const { data } = await api.get(\'/report/export/jadwal-kelas\', {
    params,
    responseType: \'blob\',
  })
  return data
}

/**
 * GET /report/export/jadwal-guru?semesterId=&guruId=
 * guruId opsional — jika kosong backend pakai userId dari token
 */
async function exportJadwalGuru(params: ExportJadwalGuruParams): Promise<Blob> {
  const { data } = await api.get(\'/report/export/jadwal-guru\', {
    params,
    responseType: \'blob\',
  })
  return data
}

// ─────────────────────────────────────────────────
// Named export
// ─────────────────────────────────────────────────
export const jadwalApi = {
  getMingguan,
  getByGuru,
  getById,
  create,
  bulkByKelas,
  bulkByMapel,
  remove,
  copySemester,
  checkKetersediaan,
  getBebanMengajar,
  getRingkasanSemuaKelas,
  getRosterKelas,
  getRosterGuru,
  getRekapGuru,
  exportJadwalSekolah,
  exportJadwalKelas,
  exportJadwalGuru,
}
'''

# ─────────────────────────────────────────────────────────────────
# 3. HOOKS
# ─────────────────────────────────────────────────────────────────
FILES["hooks/jadwal/useJadwal.ts"] = '''\
import { useMutation, useQuery, useQueryClient } from \'@tanstack/react-query\'
import { jadwalApi } from \'@/lib/api/jadwal.api\'
import type {
  CreateJadwalPayload,
  BulkJadwalPayload,
  BulkMapelJadwalPayload,
  KetersediaanRequest,
  FilterRingkasanParams,
  HariEnum,
} from \'@/types/jadwal.types\'

// ─────────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────────
export const jadwalKeys = {
  mingguan:         (kelasId: string, semesterId: string) =>
    [\'jadwal\', \'mingguan\', kelasId, semesterId] as const,
  byGuru:           (guruId: string, semesterId: string) =>
    [\'jadwal\', \'guru\', guruId, semesterId] as const,
  detail:           (id: string) =>
    [\'jadwal\', \'detail\', id] as const,
  ringkasan:        (params: FilterRingkasanParams) =>
    [\'jadwal\', \'ringkasan\', params] as const,
  rosterKelas:      (kelasId: string, semesterId: string) =>
    [\'jadwal\', \'roster-kelas\', kelasId, semesterId] as const,
  rosterGuru:       (guruId: string, semesterId: string) =>
    [\'jadwal\', \'roster-guru\', guruId, semesterId] as const,
  bebanMengajar:    (guruId: string, semesterId: string) =>
    [\'jadwal\', \'beban\', guruId, semesterId] as const,
  rekapGuru:        () =>
    [\'jadwal\', \'rekap-guru\'] as const,
  ketersediaan:     (payload: KetersediaanRequest) =>
    [\'jadwal\', \'ketersediaan\', payload] as const,
}

// ─────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────

/** Jadwal mingguan per kelas, grouped by hari */
export function useJadwalMingguan(
  kelasId: string | null,
  semesterId: string | null,
) {
  return useQuery({
    queryKey: jadwalKeys.mingguan(kelasId ?? \'\', semesterId ?? \'\'),
    queryFn:  () => jadwalApi.getMingguan(kelasId!, semesterId!),
    enabled:  !!kelasId && !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}

/** Jadwal seorang guru di satu semester */
export function useJadwalGuru(
  guruId: string | null,
  semesterId: string | null,
) {
  return useQuery({
    queryKey: jadwalKeys.byGuru(guruId ?? \'\', semesterId ?? \'\'),
    queryFn:  () => jadwalApi.getByGuru(guruId!, semesterId!),
    enabled:  !!guruId && !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}

/** Detail satu jadwal */
export function useJadwalDetail(id: string | null) {
  return useQuery({
    queryKey: jadwalKeys.detail(id ?? \'\'),
    queryFn:  () => jadwalApi.getById(id!),
    enabled:  !!id,
    staleTime: 1000 * 60 * 5,
  })
}

/** Ringkasan semua kelas (tabel manajemen) */
export function useRingkasanSemuaKelas(params: FilterRingkasanParams | null) {
  return useQuery({
    queryKey: jadwalKeys.ringkasan(params ?? { semesterId: \'\' }),
    queryFn:  () => jadwalApi.getRingkasanSemuaKelas(params!),
    enabled:  !!params?.semesterId,
    staleTime: 1000 * 60 * 3,
  })
}

/** Roster kelas (tampilan jadwal per kelas) */
export function useRosterKelas(
  kelasId: string | null,
  semesterId: string | null,
) {
  return useQuery({
    queryKey: jadwalKeys.rosterKelas(kelasId ?? \'\', semesterId ?? \'\'),
    queryFn:  () => jadwalApi.getRosterKelas(kelasId!, semesterId!),
    enabled:  !!kelasId && !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}

/** Roster guru (tampilan jadwal per guru) */
export function useRosterGuru(
  guruId: string | null,
  semesterId: string | null,
) {
  return useQuery({
    queryKey: jadwalKeys.rosterGuru(guruId ?? \'\', semesterId ?? \'\'),
    queryFn:  () => jadwalApi.getRosterGuru(guruId!, semesterId!),
    enabled:  !!guruId && !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}

/** Beban mengajar guru */
export function useBebanMengajar(
  guruId: string | null,
  semesterId: string | null,
) {
  return useQuery({
    queryKey: jadwalKeys.bebanMengajar(guruId ?? \'\', semesterId ?? \'\'),
    queryFn:  () => jadwalApi.getBebanMengajar(semesterId!, guruId!),
    enabled:  !!guruId && !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}

/** Rekap guru beserta mapel tingkat yang diajarkan */
export function useRekapGuruMapel() {
  return useQuery({
    queryKey: jadwalKeys.rekapGuru(),
    queryFn:  jadwalApi.getRekapGuru,
    staleTime: 1000 * 60 * 10,
  })
}

/** Cek ketersediaan guru & ruangan pada slot waktu tertentu */
export function useKetersediaan(payload: KetersediaanRequest | null) {
  return useQuery({
    queryKey: jadwalKeys.ketersediaan(
      payload ?? { semesterId: \'\', hari: \'SENIN\', jamMulai: \'\', jamSelesai: \'\' },
    ),
    queryFn:  () => jadwalApi.checkKetersediaan(payload!),
    enabled:
      !!payload?.semesterId &&
      !!payload?.hari &&
      !!payload?.jamMulai &&
      !!payload?.jamSelesai,
    staleTime: 0, // always fresh — real-time conflict check
  })
}

// ─────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────

/** Buat satu jadwal */
export function useCreateJadwal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateJadwalPayload) => jadwalApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [\'jadwal\'] }),
  })
}

/** Bulk insert per kelas */
export function useBulkJadwalByKelas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: BulkJadwalPayload) => jadwalApi.bulkByKelas(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [\'jadwal\'] }),
  })
}

/** Bulk insert per mata pelajaran */
export function useBulkJadwalByMapel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: BulkMapelJadwalPayload) =>
      jadwalApi.bulkByMapel(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [\'jadwal\'] }),
  })
}

/** Hapus satu jadwal */
export function useDeleteJadwal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => jadwalApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [\'jadwal\'] }),
  })
}

/** Copy jadwal dari semester lain */
export function useCopySemesterJadwal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      sourceSemesterId,
      targetSemesterId,
    }: {
      sourceSemesterId: string
      targetSemesterId: string
    }) => jadwalApi.copySemester(sourceSemesterId, targetSemesterId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [\'jadwal\'] }),
  })
}

// ─────────────────────────────────────────────────
// Export helpers (trigger download)
// ─────────────────────────────────────────────────

/** Trigger download Excel jadwal sekolah */
export function useExportJadwalSekolah() {
  return useMutation({
    mutationFn: async (semesterId: string) => {
      const blob = await jadwalApi.exportJadwalSekolah({ semesterId })
      triggerDownload(blob, \'jadwal-sekolah.xlsx\')
    },
  })
}

/** Trigger download Excel jadwal kelas */
export function useExportJadwalKelas() {
  return useMutation({
    mutationFn: async ({
      semesterId,
      kelasId,
    }: {
      semesterId: string
      kelasId: string
    }) => {
      const blob = await jadwalApi.exportJadwalKelas({ semesterId, kelasId })
      triggerDownload(blob, \'jadwal-kelas.xlsx\')
    },
  })
}

/** Trigger download Excel jadwal guru */
export function useExportJadwalGuru() {
  return useMutation({
    mutationFn: async ({
      semesterId,
      guruId,
    }: {
      semesterId: string
      guruId?: string
    }) => {
      const blob = await jadwalApi.exportJadwalGuru({ semesterId, guruId })
      const filename = guruId ? \'jadwal-guru.xlsx\' : \'jadwal-guru-saya.xlsx\'
      triggerDownload(blob, filename)
    },
  })
}

// ─────────────────────────────────────────────────
// Internal helper
// ─────────────────────────────────────────────────
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement(\'a\')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
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
    print("\n🚀 BATCH 1 — Jadwal Foundation\n")
    write_files()
    print("\n✅ Batch 1 selesai. Siap lanjut Batch 2.\n")