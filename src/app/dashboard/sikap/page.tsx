'use client'

import { Suspense } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { Spinner } from '@/components/ui/Spinner'
import { SikapSiswaView } from './_components/SikapSiswaView'
import { SikapGuruView }  from './_components/SikapGuruView'

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA']
const GURU_ROLES  = ['GURU', 'WALI_KELAS']

export default function SikapPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner /></div>}>
      <SikapContent />
    </Suspense>
  )
}

function SikapContent() {
  const { user } = useAuthStore()

  if (!user) return <div className="flex justify-center py-12"><Spinner /></div>

  const isAdmin = ADMIN_ROLES.includes(user.role)
  const isGuru  = GURU_ROLES.includes(user.role)
  const isSiswa = user.role === 'SISWA'

  if (isSiswa) {
    return <SikapSiswaView userId={user.id} />
  }

  if (isGuru || isAdmin) {
    return (
      <SikapGuruView
        currentUserId={user.id}
        canDeleteAny={isAdmin}
      />
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-sm text-gray-500">Anda tidak memiliki akses ke halaman ini.</p>
    </div>
  )
}
