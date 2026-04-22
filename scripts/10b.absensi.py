import os

ROOT = r"D:\projects\LMS-MAN\Code\nextjslms\src"

FILES = {}

# ─────────────────────────────────────────────────────────────────────────────
# 1. hooks/absensi/useMyStatusHariIni.ts
# ─────────────────────────────────────────────────────────────────────────────
FILES["hooks/absensi/useMyStatusHariIni.ts"] = """import { useQuery } from '@tanstack/react-query'
import { getMyStatusHariIni } from '@/lib/api/absensi.api'
import { useSemesterActive } from '@/hooks/semester/useSemester'

export const myStatusKeys = {
  hariIni: (semesterId: string) =>
    ['absensi', 'my-status-hari-ini', semesterId] as const,
}

export function useMyStatusHariIni() {
  const { data: semesters } = useSemesterActive()

  // Prioritaskan yang isActive, fallback ke index-0
  const activeSemester = semesters?.find((s) => s.isActive) ?? semesters?.[0]
  const semesterId = activeSemester?.id ?? ''

  const query = useQuery({
    queryKey: myStatusKeys.hariIni(semesterId),
    queryFn:  () => getMyStatusHariIni(semesterId),
    enabled:  !!semesterId,
    staleTime: 1000 * 30,        // 30 detik
    refetchInterval: 1000 * 60,  // polling tiap 1 menit
  })

  return {
    ...query,
    semesterId,
    aktiveSemesterNama: activeSemester?.nama ?? '',
    isWaliKelas: query.data?.isWaliKelas ?? false,
    kelasWali:   query.data?.kelasWali ?? [],
    jadwalList:  query.data?.data ?? [],
  }
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# 2. hooks/absensi/useSesiAbsensi.ts
# ─────────────────────────────────────────────────────────────────────────────
FILES["hooks/absensi/useSesiAbsensi.ts"] = """import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bukaSesi,
  getSesiDetail,
  tutupSesi,
  perpanjangSesi,
} from '@/lib/api/absensi.api'
import type { BukaSesiPayload, PerpanjangPayload } from '@/types'

export const sesiKeys = {
  detail: (token: string) => ['absensi', 'sesi', token] as const,
}

// ── Query: Live Sesi — polling 3 detik selama token aktif ────────────────────
export function useSesiLive(token: string | null) {
  return useQuery({
    queryKey: sesiKeys.detail(token ?? ''),
    queryFn:  () => getSesiDetail(token!),
    enabled:  !!token,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: !!token ? 3_000 : false,
    retry: 1,
  })
}

// ── Mutation: Buka Sesi ───────────────────────────────────────────────────────
export function useBukaSesi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: BukaSesiPayload) => bukaSesi(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absensi', 'my-status-hari-ini'] })
    },
  })
}

// ── Mutation: Tutup Sesi ──────────────────────────────────────────────────────
export function useTutupSesi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (token: string) => tutupSesi(token),
    onSuccess: (_data, token) => {
      qc.removeQueries({ queryKey: sesiKeys.detail(token) })
      qc.invalidateQueries({ queryKey: ['absensi', 'my-status-hari-ini'] })
    },
  })
}

// ── Mutation: Perpanjang Sesi ─────────────────────────────────────────────────
export function usePerpanjangSesi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      token,
      payload,
    }: {
      token: string
      payload: PerpanjangPayload
    }) => perpanjangSesi(token, payload),
    onSuccess: (_data, { token }) => {
      qc.invalidateQueries({ queryKey: sesiKeys.detail(token) })
    },
  })
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# 3. hooks/absensi/useAbsensiManajemen.ts
# ─────────────────────────────────────────────────────────────────────────────
FILES["hooks/absensi/useAbsensiManajemen.ts"] = """import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getMatrixRekap,
  getSiswaKritis,
  getGuruDetail,
  overrideAbsensi,
  simpanManualBulk,
  exportMatrix,
  type MatrixQueryParams,
} from '@/lib/api/absensi.api'
import type { OverridePayload, ManualBulkPayload } from '@/types'

export const manajemenKeys = {
  matrix: (p: MatrixQueryParams) =>
    ['absensi', 'matrix', p.kelasId, p.mataPelajaranId, p.semesterId] as const,
  siswaKritis: (semesterId: string) =>
    ['absensi', 'siswa-kritis', semesterId] as const,
  guruDetail: (guruId: string, semesterId: string) =>
    ['absensi', 'guru-detail', guruId, semesterId] as const,
}

// ── Query: Matrix Rekap ───────────────────────────────────────────────────────
export function useMatrixRekap(params: Partial<MatrixQueryParams>) {
  const isReady =
    !!params.kelasId && !!params.mataPelajaranId && !!params.semesterId

  return useQuery({
    queryKey: manajemenKeys.matrix(params as MatrixQueryParams),
    queryFn:  () => getMatrixRekap(params as MatrixQueryParams),
    enabled:  isReady,
    staleTime: 1000 * 60 * 2,
  })
}

// ── Query: Siswa Kritis ───────────────────────────────────────────────────────
export function useSiswaKritis(semesterId: string) {
  return useQuery({
    queryKey: manajemenKeys.siswaKritis(semesterId),
    queryFn:  () => getSiswaKritis(semesterId),
    enabled:  !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}

// ── Query: Guru Detail Report ─────────────────────────────────────────────────
export function useGuruDetailReport(guruId: string, semesterId: string) {
  return useQuery({
    queryKey: manajemenKeys.guruDetail(guruId, semesterId),
    queryFn:  () => getGuruDetail(guruId, semesterId),
    enabled:  !!guruId && !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}

// ── Mutation: Override Satu Sel ───────────────────────────────────────────────
export function useOverrideAbsensi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: OverridePayload }) =>
      overrideAbsensi(id, payload),
    onSuccess: () => {
      // Invalidate semua matrix (filter-nya beda-beda, invalidate by prefix)
      qc.invalidateQueries({ queryKey: ['absensi', 'matrix'] })
    },
  })
}

// ── Mutation: Manual Bulk (mode Manual) ──────────────────────────────────────
export function useSimpanManualBulk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ManualBulkPayload) => simpanManualBulk(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absensi', 'matrix'] })
      qc.invalidateQueries({ queryKey: ['absensi', 'my-status-hari-ini'] })
    },
  })
}

// ── Action: Export Matrix ke PDF ──────────────────────────────────────────────
export function useExportMatrix() {
  return useMutation({
    mutationFn: async (params: MatrixQueryParams) => {
      const res = await exportMatrix(params)
      const url = URL.createObjectURL(res.data)
      const a   = document.createElement('a')
      a.href    = url
      a.download = `rekap-${params.mataPelajaranId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
  })
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# 4. hooks/absensi/usePerizinan.ts
# ─────────────────────────────────────────────────────────────────────────────
FILES["hooks/absensi/usePerizinan.ts"] = """import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ajukanPerizinan,
  getListPerizinan,
  getDetailPerizinan,
  revisiPerizinan,
  approvalPerizinan,
  hapusPerizinan,
} from '@/lib/api/perizinan.api'
import type {
  PerizinanPayload,
  PerizinanQueryParams,
  PerizinanRevisiPayload,
  PerizinanApprovalPayload,
} from '@/types'

export const perizinanKeys = {
  list:   (params: PerizinanQueryParams) =>
    ['perizinan', 'list', params] as const,
  detail: (id: string) =>
    ['perizinan', 'detail', id] as const,
}

// ── Query: List Perizinan ─────────────────────────────────────────────────────
export function useListPerizinan(params: PerizinanQueryParams) {
  return useQuery({
    queryKey: perizinanKeys.list(params),
    queryFn:  () => getListPerizinan(params),
    staleTime: 1000 * 60,
    placeholderData: (prev) => prev,
  })
}

// ── Query: Detail Perizinan ───────────────────────────────────────────────────
export function useDetailPerizinan(id: string | null) {
  return useQuery({
    queryKey: perizinanKeys.detail(id ?? ''),
    queryFn:  () => getDetailPerizinan(id!),
    enabled:  !!id,
    staleTime: 1000 * 60,
  })
}

// ── Mutation: Ajukan Perizinan ────────────────────────────────────────────────
export function useAjukanPerizinan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PerizinanPayload) => ajukanPerizinan(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['perizinan', 'list'] })
    },
  })
}

// ── Mutation: Revisi Perizinan (siswa edit saat PENDING) ─────────────────────
export function useRevisiPerizinan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: PerizinanRevisiPayload
    }) => revisiPerizinan(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['perizinan', 'list'] })
      qc.invalidateQueries({ queryKey: perizinanKeys.detail(id) })
    },
  })
}

// ── Mutation: Approval Perizinan (wali kelas / admin) ────────────────────────
export function useApprovalPerizinan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: PerizinanApprovalPayload
    }) => approvalPerizinan(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['perizinan', 'list'] })
      qc.invalidateQueries({ queryKey: perizinanKeys.detail(id) })
    },
  })
}

// ── Mutation: Hapus / Batalkan Perizinan ─────────────────────────────────────
export function useHapusPerizinan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => hapusPerizinan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['perizinan', 'list'] })
    },
  })
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# WRITER
# ─────────────────────────────────────────────────────────────────────────────
def write_files():
    for relative_path, content in FILES.items():
        full_path = os.path.join(ROOT, relative_path.replace('/', os.sep))
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[OK] {relative_path}")

if __name__ == '__main__':
    write_files()
    print("\n✅ Batch 2 selesai — 4 file digenerate.")
    print("   Verifikasi: npx tsc --noEmit 2>&1 | Select-String 'useSesi|usePerizinan|useMatrix|useMyStatus'")