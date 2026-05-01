import { publicApi } from '@/lib/api/public.api'
import { PublicNavbar } from '@/components/public/PublicNavbar'
import { PublicFooter } from '@/components/public/PublicFooter'
import { PengumumanPublikContent } from './_components/PengumumanPublikContent'
import type { Metadata } from 'next'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Pengumuman Sekolah | MAN 2 Kota Makassar',
  description: 'Informasi dan pengumuman resmi dari MAN 2 Kota Makassar',
}

export default async function PengumumanPage() {
  const [announcementRes, menuRes, profilRes] = await Promise.allSettled([
    publicApi.announcementPublik({ limit: 50 }),
    publicApi.menu(),
    publicApi.profil(),
  ])

  const announcementData = announcementRes.status === 'fulfilled' 
    ? announcementRes.value 
    : { data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }
  
  const menuData = menuRes.status === 'fulfilled' ? menuRes.value : []
  const profil = profilRes.status === 'fulfilled' ? profilRes.value : null

  const navItems = (menuData as any[])
    .filter((m) => m.isActive)
    .sort((a, b) => a.urutan - b.urutan)
    .map((m) => ({ label: m.label, href: m.target }))

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <PublicNavbar menuItems={navItems} />
      
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs text-emerald-300 uppercase tracking-widest mb-2">
            Informasi Resmi
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Pengumuman Sekolah
          </h1>
          <p className="text-emerald-100 text-sm max-w-2xl">
            Informasi dan pengumuman resmi dari MAN 2 Kota Makassar
          </p>
        </div>
      </div>

      <PengumumanPublikContent announcements={announcementData.data} />
      
      <PublicFooter profil={profil} />
    </div>
  )
}
