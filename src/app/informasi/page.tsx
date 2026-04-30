import { publicApi } from '@/lib/api/public.api'
import { PublicNavbar } from '@/components/public/PublicNavbar'
import { PublicFooter } from '@/components/public/PublicFooter'
import { FeaturesContent } from './_components/FeaturesContent'

export const revalidate = 600

export default async function InformasiPage() {
  const [menuRes, profilRes] = await Promise.allSettled([
    publicApi.menu(),
    publicApi.profil(),
  ])

  const menuData = menuRes.status   === 'fulfilled' ? menuRes.value   : []
  const profil   = profilRes.status === 'fulfilled' ? profilRes.value : null

  const navItems = (menuData as any[])
    .filter((m: any) => m.isActive)
    .sort((a: any, b: any) => a.urutan - b.urutan)
    .map((m: any) => ({ label: m.label, href: m.target }))

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <PublicNavbar menuItems={navItems} />
      <FeaturesContent />
      <PublicFooter profil={profil} />
    </div>
  )
}
