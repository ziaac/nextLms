import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bukaSesi,
  getSesiDetail,
  tutupSesi,
  perpanjangSesi,
  ubahModeSesi,
  overrideSiswaSesi,
  batalkanScanSiswa,
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
    refetchInterval: (query) => {
      // Stop polling jika error (404 = sesi tidak ada) atau tidak ada token
      if (!token) return false
      if (query.state.error) return false
      return 3_000
    },
    retry: 0,  // Jangan retry saat 404
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

// ── Mutation: Ubah Mode Sesi ──────────────────────────────────────────────────
export function useUbahModeSesi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      token,
      payload,
    }: {
      token:   string
      payload: import('@/types').UbahModeSesiPayload
    }) => ubahModeSesi(token, payload),
    onSuccess: (_data, { token }) => {
      qc.invalidateQueries({ queryKey: sesiKeys.detail(token) })
      qc.invalidateQueries({ queryKey: ['absensi', 'my-status-hari-ini'] })
    },
  })
}

// ── Mutation: Override Status Siswa dari Panel Sesi ───────────────────────────
export function useOverrideSiswaSesi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      token,
      payload,
    }: {
      token:   string
      payload: import('@/types').OverrideSiswaPayload
    }) => overrideSiswaSesi(token, payload),
    onSuccess: (_data, { token }) => {
      qc.invalidateQueries({ queryKey: sesiKeys.detail(token) })
    },
  })
}

// ── Mutation: Batalkan Scan Siswa ────────────────────────────────────────────
export function useBatalkanScan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ token, userId }: { token: string; userId: string }) =>
      batalkanScanSiswa(token, userId),
    onSuccess: (_data, { token }) => {
      qc.invalidateQueries({ queryKey: sesiKeys.detail(token) })
    },
  })
}
