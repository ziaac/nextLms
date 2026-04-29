import { publicApi } from '@/lib/api/public.api'
import { PublicNavbar } from '@/components/public/PublicNavbar'
import { PublicFooter } from '@/components/public/PublicFooter'
import { BeritaListContent } from './_components/BeritaListContent'

export const revalidate = 120

export default async function BeritaPage() {
  const [beritaRes, menuRes, profilRes, kategoriRes] = await Promise.allSettled([
    publicApi.berita(12),
    publicApi.menu(),
    publicApi.profil(),
    publicApi.beritaKategori(),
  ])

  const beritaData = beritaRes.status   === 'fulfilled' ? beritaRes.value   : { data: [], total: 0 }
  const menuData   = menuRes.status     === 'fulfilled' ? menuRes.value     : []
  const profil     = profilRes.status   === 'fulfilled' ? profilRes.value   : null
  const kategori   = kategoriRes.status === 'fulfilled' ? kategoriRes.value : []

  const navItems = (menuData as any[])
    .filter((m) => m.isActive)
    .sort((a, b) => a.urutan - b.urutan)
    .map((m) => ({ label: m.label, href: m.target }))

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <PublicNavbar menuItems={navItems} />
      <BeritaListContent beritaData={beritaData} kategori={kategori} />
      <PublicFooter profil={profil} />
    </div>
  )
}
