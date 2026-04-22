'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { UserCircle, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/lib/utils'
import { getPublicFileUrl } from '@/lib/constants'

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN:    'Super Admin',
  ADMIN:          'Admin',
  KEPALA_SEKOLAH: 'Kepala Sekolah',
  WAKIL_KEPALA:   'Wakil Kepala',
  GURU:           'Guru',
  WALI_KELAS:     'Wali Kelas',
  SISWA:          'Siswa',
  ORANG_TUA:      'Orang Tua',
  STAFF_TU:       'Staff TU',
  STAFF_KEUANGAN: 'Staff Keuangan',
}

export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  const fotoUrl = user.fotoUrl ? getPublicFileUrl(user.fotoUrl) : null
  const initials = getInitials(user.namaLengkap)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt={user.namaLengkap}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {initials}
            </span>
          )}
        </div>

        {/* Nama — hidden di mobile */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight max-w-[120px] truncate">
            {user.namaLengkap}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {ROLE_LABEL[user.role] ?? user.role}
          </p>
        </div>
        <ChevronDown
          size={14}
          className={`hidden md:block text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="
          absolute right-0 top-full mt-2 w-52
          bg-white dark:bg-gray-900
          border border-gray-200 dark:border-gray-800
          rounded-2xl shadow-lg py-1 z-50
        ">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-200">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user.namaLengkap}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>

          <Link
            href="/dashboard/profil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <UserCircle size={16} />
            Profil Saya
          </Link>

          <div className="border-t border-gray-100 dark:border-gray-200 mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); logout() }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut size={16} />
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
