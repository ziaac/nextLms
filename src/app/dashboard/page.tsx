'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { isManajemen } from '@/lib/helpers/role'

const SISWA_ROLES = new Set(['SISWA', 'ORANG_TUA'])

export default function DashboardPage() {
  const user   = useAuthStore((s) => s.user)
  const router = useRouter()

  useEffect(() => {
    if (!user) return
    if (SISWA_ROLES.has(user.role)) {
      router.replace('/dashboard/pembelajaran/siswa')
    } else if (isManajemen(user.role)) {
      router.replace('/dashboard/report')
    }
    // Guru & wali kelas tetap di /dashboard (tidak di-redirect)
  }, [user, router])

  if (!user) return null

  // Tampilkan spinner untuk semua role yang akan di-redirect
  if (SISWA_ROLES.has(user.role) || isManajemen(user.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Fallback untuk GURU / WALI_KELAS
  const firstName = user.namaLengkap.split(' ')[0]
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Selamat datang, {firstName}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          LMS MAN 2 Kota Makassar
        </p>
      </div>
    </div>
  )
}
