'use client'

import { Suspense } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { Spinner } from '@/components/ui/Spinner'
import { SikapSiswaView } from './_components/SikapSiswaView'
import { SikapKelasView }  from './_components/SikapKelasView'

const ADMIN_ROLES  = ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA'] as const
const GURU_ROLES   = ['GURU', 'WALI_KELAS'] as const
const CAN_EDIT_ALL = ['SUPER_ADMIN', 'ADMIN'] as const

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

  const isAdmin  = (ADMIN_ROLES as readonly string[]).includes(user.role)
  const isGuru   = (GURU_ROLES as readonly string[]).includes(user.role)
  const isSiswa  = user.role === 'SISWA'
  const canEdit  = isGuru || (CAN_EDIT_ALL as readonly string[]).includes(user.role)
  const canEditAll = (CAN_EDIT_ALL as readonly string[]).includes(user.role)

  if (isSiswa) {
    return <SikapSiswaView userId={user.id} />
  }

  if (isGuru || isAdmin) {
    return (
      <SikapKelasView
        currentUserId={user.id}
        currentUserRole={user.role}
        canEdit={canEdit}
        canEditAll={canEditAll}
      />
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-sm text-gray-500">Anda tidak memiliki akses ke halaman ini.</p>
    </div>
  )
}
