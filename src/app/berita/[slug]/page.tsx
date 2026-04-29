import { notFound } from 'next/navigation'
import { publicApi } from '@/lib/api/public.api'
import { PublicNavbar } from '@/components/public/PublicNavbar'
import { PublicFooter } from '@/components/public/PublicFooter'
import { BeritaDetailContent } from './_components/BeritaDetailContent'

export const revalidate = 120

interface Props { params: Promise<{ slug: string }> }

export default async function BeritaDetailPage({ params }: Props) {
  const { slug } = await params

  const [beritaRes, menuRes, profilRes] = await Promise.allSettled([
    publicApi.beritaBySlug(slug),
    publicApi.menu(),
    publicApi.profil(),
  ])

  if (beritaRes.status === 'rejected') notFound()

  const berita   = beritaRes.status === 'fulfilled' ? beritaRes.value   : null
  const menuData = menuRes.status   === 'fulfilled' ? menuRes.value     : []
  const profil   = profilRes.status === 'fulfilled' ? profilRes.value   : null

  if (!berita) notFound()

  const navItems = (menuData as any[])
    .filter((m) => m.isActive)
    .sort((a, b) => a.urutan - b.urutan)
    .map((m) => ({ label: m.label, href: m.target }))

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <PublicNavbar menuItems={navItems} />
      <BeritaDetailContent berita={berita} />
      <PublicFooter profil={profil} />
    </div>
  )
}
