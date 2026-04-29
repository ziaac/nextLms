'use client'

import { useAuthStore } from '@/stores/auth.store'
import { ProfilAdmin } from './_components/ProfilAdmin'
import { ProfilGuru } from './_components/ProfilGuru'
import { ProfilSiswa } from './_components/ProfilSiswa'

export default function ProfilPage() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role

  if (role === 'SISWA') return <ProfilSiswa />
  if (role === 'GURU' || role === 'WALI_KELAS') return <ProfilGuru />
  return <ProfilAdmin />
}
