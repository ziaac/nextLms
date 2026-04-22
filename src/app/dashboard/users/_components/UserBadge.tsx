import { Badge } from '@/components/ui'
import type { UserRole } from '@/types'

const ROLE_CONFIG: Record<UserRole, { label: string; variant: 'success' | 'info' | 'warning' | 'purple' | 'default' | 'danger' }> = {
  SUPER_ADMIN:    { label: 'Super Admin',    variant: 'danger' },
  ADMIN:          { label: 'Admin',          variant: 'warning' },
  KEPALA_SEKOLAH: { label: 'Kepala Sekolah', variant: 'purple' },
  WAKIL_KEPALA:   { label: 'Wakil Kepala',   variant: 'purple' },
  GURU:           { label: 'Guru',           variant: 'info' },
  WALI_KELAS:     { label: 'Wali Kelas',     variant: 'info' },
  SISWA:          { label: 'Siswa',          variant: 'success' },
  ORANG_TUA:      { label: 'Orang Tua',      variant: 'default' },
  STAFF_TU:       { label: 'Staff TU',       variant: 'default' },
  STAFF_KEUANGAN: { label: 'Staff Keuangan', variant: 'default' },
}

export function RoleBadge({ role }: { role: UserRole }) {
  const config = ROLE_CONFIG[role] ?? { label: role, variant: 'default' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
