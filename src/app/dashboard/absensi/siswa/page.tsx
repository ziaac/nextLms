'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner }   from '@/components/ui/Spinner'

/**
 * Halaman ini sudah dipindah ke /dashboard/jadwal/kelas
 * yang menggabungkan jadwal, absensi, dan perizinan.
 */
export default function AbsensiSiswaRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/jadwal/kelas')
  }, [router])

  return (
    <div className="flex items-center justify-center py-24">
      <Spinner />
    </div>
  )
}
