import { notFound } from 'next/navigation'
import { publicApi } from '@/lib/api/public.api'
import { PublicNavbar } from '@/components/public/PublicNavbar'
import { PublicFooter } from '@/components/public/PublicFooter'
import { GaleriDetailContent } from './_components/GaleriDetailContent'

export const revalidate = 300

interface Props { params: Promise<{ id: string }> }

export default async function GaleriDetailPage({ params }: Props) {
  const { id } = await params

  const [albumRes, allAlbumsRes, menuRes, profilRes] = await Promise.allSettled([
    publicApi.galeriDetail(id),
    publicApi.galeriAlbum(),
    publicApi.menu(),
    publicApi.profil(),
  ])

  if (albumRes.status === 'rejected') notFound()

  const album    = albumRes.status     === 'fulfilled' ? albumRes.value     : null
  const albums   = allAlbumsRes.status === 'fulfilled' ? allAlbumsRes.value : []
  const menuData = menuRes.status      === 'fulfilled' ? menuRes.value      : []
  const profil   = profilRes.status    === 'fulfilled' ? profilRes.value    : null

  if (!album) notFound()

  const navItems = (menuData as any[])
    .filter((m) => m.isActive)
    .sort((a, b) => a.urutan - b.urutan)
    .map((m) => ({ label: m.label, href: m.target }))

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <PublicNavbar menuItems={navItems} />
      <GaleriDetailContent album={album} albums={albums} />
      <PublicFooter profil={profil} />
    </div>
  )
}
