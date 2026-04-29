import { publicApi } from '@/lib/api/public.api'
import { PublicNavbar } from '@/components/public/PublicNavbar'
import { PublicFooter } from '@/components/public/PublicFooter'
import { GaleriListContent } from './_components/GaleriListContent'

export const revalidate = 300

export default async function GaleriPage() {
  const [albumsRes, menuRes, profilRes] = await Promise.allSettled([
    publicApi.galeriAlbum(),
    publicApi.menu(),
    publicApi.profil(),
  ])

  const albums   = albumsRes.status === 'fulfilled' ? albumsRes.value : []
  const menuData = menuRes.status   === 'fulfilled' ? menuRes.value   : []
  const profil   = profilRes.status === 'fulfilled' ? profilRes.value : null

  const navItems = (menuData as any[])
    .filter((m) => m.isActive)
    .sort((a, b) => a.urutan - b.urutan)
    .map((m) => ({ label: m.label, href: m.target }))

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <PublicNavbar menuItems={navItems} />
      <GaleriListContent albums={albums} />
      <PublicFooter profil={profil} />
    </div>
  )
}
