// ============================================================
// lib/helpers/role.ts
// Konstanta grup role dan helper akses untuk seluruh modul
// ============================================================

import type { UserRole } from '@/types/enums'

// ── Grup Role ─────────────────────────────────────────────────

/** Role grup manajemen sekolah */
export const ROLE_MANAJEMEN = [
  'SUPER_ADMIN',
  'ADMIN',
  'KEPALA_SEKOLAH',
  'WAKIL_KEPALA',
  'STAFF_TU',
] as const satisfies readonly UserRole[]

/** Role yang bisa CRUD (subset manajemen) */
export const ROLE_CRUD_MAPEL = [
  'SUPER_ADMIN',
  'ADMIN',
  'WAKIL_KEPALA',
  'STAFF_TU',
] as const satisfies readonly UserRole[]

/**
 * Role guru — WALI_KELAS masuk di sini karena tampilan
 * halaman pembelajaran-nya sama dengan guru (grid card)
 */
export const ROLE_GURU = [
  'GURU',
  'WALI_KELAS',
] as const satisfies readonly UserRole[]

/** Role siswa dan orang tua */
export const ROLE_SISWA_ORTU = [
  'SISWA',
  'ORANG_TUA',
] as const satisfies readonly UserRole[]

/**
 * Role yang boleh akses halaman kelas-belajar (view only).
 * WALI_KELAS termasuk karena perlu lihat kelas yang dia ampu.
 */
export const ROLE_AKSES_KELAS_BELAJAR = [
  ...ROLE_MANAJEMEN,
  'WALI_KELAS',
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
  if (!role) return '/login'
  if (isManajemen(role)) return '/dashboard/pembelajaran/manajemen'
  if (isGuru(role))      return '/dashboard/pembelajaran/guru'
  if (isSiswaOrtu(role)) return '/dashboard/pembelajaran/siswa'
  return '/dashboard'
}
