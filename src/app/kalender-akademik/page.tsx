import { publicApi } from '@/lib/api/public.api'
import { PublicNavbar } from '@/components/public/PublicNavbar'
import { PublicFooter } from '@/components/public/PublicFooter'
import { KalenderPublikContent } from './_components/KalenderPublikContent'
import type { Metadata } from 'next'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Kalender Akademik | MAN 2 Kota Makassar',
  description: 'Kalender akademik dan jadwal kegiatan sekolah MAN 2 Kota Makassar',
}

export default async function KalenderAkademikPage() {
  // Get current month and year
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const [kalenderRes, menuRes, profilRes] = await Promise.allSettled([
    publicApi.kalenderPublik({ bulan: currentMonth, tahun: currentYear }),
    publicApi.menu(),
    publicApi.profil(),
  ])

  const kalenderData = kalenderRes.status === 'fulfilled' ? kalenderRes.value : []
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
            Jadwal Kegiatan
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Kalender Akademik
          </h1>
          <p className="text-emerald-100 text-sm max-w-2xl">
            Jadwal kegiatan, ujian, dan hari libur sekolah MAN 2 Kota Makassar
          </p>
        </div>
      </div>

      <KalenderPublikContent 
        initialData={kalenderData}
        initialBulan={currentMonth}
        initialTahun={currentYear}
      />
      
      <PublicFooter profil={profil} />
    </div>
  )
}
