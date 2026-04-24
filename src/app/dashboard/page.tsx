'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'

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

const SISWA_ROLES = new Set(['SISWA', 'ORANG_TUA'])

export default function DashboardPage() {
  const user   = useAuthStore((s) => s.user)
  const router = useRouter()

  // Redirect siswa & orang tua langsung ke halaman pembelajaran mereka
  useEffect(() => {
    if (user && SISWA_ROLES.has(user.role)) {
      router.replace('/dashboard/pembelajaran/siswa')
    }
  }, [user, router])

  if (!user) return null

  // Untuk siswa/ortu tampilkan spinner sementara redirect berjalan
  if (SISWA_ROLES.has(user.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const firstName = user.namaLengkap.split(' ')[0]

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Selamat datang, {firstName}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {ROLE_LABEL[user.role]} · LMS MAN 2 Kota Makassar
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Status',     value: '✅ Login',             desc: 'Autentikasi berhasil' },
          { label: 'Role',       value: ROLE_LABEL[user.role] ?? user.role, desc: 'Akses sesuai role' },
          { label: 'Tema',       value: 'Dark / Light',         desc: 'Toggle di kanan atas' },
          { label: 'Notifikasi', value: 'Realtime',             desc: 'Socket.IO siap' },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 space-y-2"
          >
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {card.label}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {card.value}
            </p>
            <p className="text-xs text-gray-400">{card.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-400 text-center pt-4">
        Konten dashboard per role — Fase 4 🚧
      </p>
    </div>
  )
}
