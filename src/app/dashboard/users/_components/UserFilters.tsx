'use client'

import { SearchInput } from '@/components/ui'
import { Select } from '@/components/ui'

const ROLE_OPTIONS = [
  { value: '', label: 'Semua Role' },
  { value: 'SUPER_ADMIN',    label: 'Super Admin' },
  { value: 'ADMIN',          label: 'Admin' },
  { value: 'KEPALA_SEKOLAH', label: 'Kepala Sekolah' },
  { value: 'WAKIL_KEPALA',   label: 'Wakil Kepala' },
  { value: 'GURU',           label: 'Guru' },
  { value: 'SISWA',          label: 'Siswa' },
  { value: 'STAFF_TU',       label: 'Staff TU' },
  { value: 'STAFF_KEUANGAN', label: 'Staff Keuangan' },
]

interface UserFiltersProps {
  search: string
  role: string
  tahunMasuk: string
  onSearchChange: (v: string) => void
  onRoleChange: (v: string) => void
  onTahunMasukChange: (v: string) => void
}

export function UserFilters({
  search, role, tahunMasuk,
  onSearchChange, onRoleChange, onTahunMasukChange,
}: UserFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Cari nama atau email..."
        className="sm:w-72"
      />
      <Select
        options={ROLE_OPTIONS}
        value={role}
        onChange={(e) => onRoleChange(e.target.value)}
        className="sm:w-44"
      />
      <div className="relative sm:w-36">
        <input
          type="number"
          value={tahunMasuk}
          onChange={(e) => onTahunMasukChange(e.target.value)}
          placeholder="Angkatan..."
          min={2000}
          max={2100}
          className="
            w-full h-10 px-3 rounded-lg text-sm
            border border-gray-200 dark:border-gray-200
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            outline-none transition
            focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
          "
        />
      </div>
    </div>
  )
}
