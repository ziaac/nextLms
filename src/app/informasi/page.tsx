import { publicApi } from '@/lib/api/public.api'
import { PublicNavbar } from '@/components/public/PublicNavbar'
import { PublicFooter } from '@/components/public/PublicFooter'
import { InformasiContent } from './_components/InformasiContent'

export const revalidate = 600

export default async function InformasiPage() {
  const [fiturRes, menuRes, profilRes] = await Promise.allSettled([
    publicApi.fitur(),
    publicApi.menu(),
    publicApi.profil(),
  ])

  const fitur    = fiturRes.status  === 'fulfilled' ? fiturRes.value  : []
  const menuData = menuRes.status   === 'fulfilled' ? menuRes.value   : []
  const profil   = profilRes.status === 'fulfilled' ? profilRes.value : null

  const navItems = (menuData as any[])
    .filter((m) => m.isActive)
    .sort((a, b) => a.urutan - b.urutan)
    .map((m) => ({ label: m.label, href: m.target }))

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <PublicNavbar menuItems={navItems} />
      <InformasiContent fitur={fitur} />
      <PublicFooter profil={profil} />
    </div>
  )
}
