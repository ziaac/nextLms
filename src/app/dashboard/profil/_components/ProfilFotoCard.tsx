'use client'

import type { ReactNode } from 'react'
import { User } from 'lucide-react'
import { getPublicFileUrl } from '@/lib/constants'

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin',
  KEPALA_SEKOLAH: 'Kepala Sekolah', WAKIL_KEPALA: 'Wakil Kepala',
  GURU: 'Guru', WALI_KELAS: 'Wali Kelas',
  SISWA: 'Siswa', STAFF_TU: 'Staff TU', STAFF_KEUANGAN: 'Staff Keuangan',
}

interface Props {
  namaLengkap: string
  fotoUrl?: string | null
  role?: string | null
  email?: string | null
  username?: string | null
  extra?: { label: string; value?: string | null }[]
  children?: ReactNode
}

export function ProfilFotoCard({ namaLengkap, fotoUrl, role, email, username, extra, children }: Props) {
  const fotoSrc = fotoUrl ? getPublicFileUrl(fotoUrl) : null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center text-center gap-4">
      {/* Avatar */}
      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 ring-4 ring-emerald-100 dark:ring-emerald-900/40">
        {fotoSrc ? (
          <img src={fotoSrc} alt={namaLengkap} className="w-full h-full object-cover" />
        ) : (
          <User className="w-10 h-10 text-gray-300 dark:text-gray-600" />
        )}
      </div>

      <div className="space-y-1">
        <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{namaLengkap}</p>
        {role && (
          <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            {ROLE_LABEL[role] ?? role}
          </span>
        )}
      </div>

      {/* Email & username */}
      <div className="w-full space-y-2 text-sm">
        {email && (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 px-3 py-2">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">Email</p>
            <p className="text-gray-700 dark:text-gray-200 truncate">{email}</p>
          </div>
        )}
        {username && (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 px-3 py-2">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">Username</p>
            <p className="text-gray-700 dark:text-gray-200">{username}</p>
          </div>
        )}
      </div>

      {/* Extra fields (NIP, NISN, dll) */}
      {extra && extra.length > 0 && (
        <div className="w-full space-y-2">
          {extra.filter(e => e.value).map(e => (
            <div key={e.label} className="rounded-lg bg-gray-50 dark:bg-gray-800/60 px-3 py-2">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">{e.label}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{e.value}</p>
            </div>
          ))}
        </div>
      )}

      {children}
    </div>
  )
}
