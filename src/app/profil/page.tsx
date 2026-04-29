import { publicApi } from '@/lib/api/public.api'
import { getPublicFileUrl } from '@/lib/constants'
import { PublicNavbar } from '@/components/public/PublicNavbar'
import { PublicFooter } from '@/components/public/PublicFooter'
import { ProfilContent } from './_components/ProfilContent'

export const revalidate = 300

export default async function ProfilPage() {
  const [profilRes, menuRes, statsRes] = await Promise.allSettled([
    publicApi.profil(),
    publicApi.menu(),
    publicApi.stats(),
  ])

  const profil   = profilRes.status   === 'fulfilled' ? profilRes.value   : null
  const menuData = menuRes.status     === 'fulfilled' ? menuRes.value     : []
  const stats    = statsRes.status    === 'fulfilled' ? statsRes.value    : null

  const navItems = (menuData as any[])
    .filter((m) => m.isActive)
    .sort((a, b) => a.urutan - b.urutan)
    .map((m) => ({ label: m.label, href: m.target }))

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <PublicNavbar menuItems={navItems} />
      <ProfilContent profil={profil} stats={stats} />
      <PublicFooter profil={profil} />
    </div>
  )
}
