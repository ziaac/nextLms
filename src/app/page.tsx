import { Suspense } from 'react'
import { publicApi } from '@/lib/api/public.api'
import { getPublicFileUrl } from '@/lib/constants'
import { PublicNavbar } from '@/components/public/PublicNavbar'
import { PublicFooter } from '@/components/public/PublicFooter'
import { HeroSection } from './_sections/HeroSection'
import { ProfilSection } from './_sections/ProfilSection'
import { FiturSection } from './_sections/FiturSection'
import { BeritaSection } from './_sections/BeritaSection'
import { GaleriSection } from './_sections/GaleriSection'
import { DownloadSection } from './_sections/DownloadSection'

export const revalidate = 300 // ISR 5 menit

export default async function HomePage() {
  const [profil, slider, fitur, beritaData, galeriAlbums, stats, menu, aktivitas] = await Promise.allSettled([
    publicApi.profil(),
    publicApi.slider(),
    publicApi.fitur(),
    publicApi.berita(4),
    publicApi.galeriAlbum(),
    publicApi.stats(),
    publicApi.menu(),
    publicApi.aktivitasSemester(),
  ])

  const profilData   = profil.status     === 'fulfilled' ? profil.value         : null
  const sliderData   = slider.status     === 'fulfilled' ? slider.value         : []
  const fiturData    = fitur.status      === 'fulfilled' ? fitur.value          : []
  const berita       = beritaData.status === 'fulfilled' ? beritaData.value?.data ?? [] : []
  const albums       = galeriAlbums.status === 'fulfilled' ? galeriAlbums.value : []
  const statsData    = stats.status      === 'fulfilled' ? stats.value          : null
  const menuData     = menu.status       === 'fulfilled' ? menu.value           : []
  const aktivitasData = aktivitas.status === 'fulfilled' ? aktivitas.value      : null

  const firstAlbum   = albums.find((a: any) => a.isActive) ?? null
  const galeriDetail = firstAlbum
    ? await publicApi.galeriDetail(firstAlbum.id).catch(() => null)
    : null

  const navItems = menuData
    .filter((m: any) => m.isActive)
    .sort((a: any, b: any) => a.urutan - b.urutan)
    .map((m: any) => ({ label: m.label, href: m.target }))

  // ── Preload gambar LCP (slider pertama yang aktif) ──────────────────────────
  // fetchpriority=high + preload memberitahu browser untuk fetch gambar ini
  // sebelum CSS selesai diparse — mengurangi LCP secara signifikan.
  const firstSlider = (sliderData as any[]).find((s) => s.isActive)
  const lcpImageUrl = firstSlider?.imageUrl ? getPublicFileUrl(firstSlider.imageUrl) : null

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/*
        Preconnect ke MinIO storage — browser akan membuka koneksi TCP+TLS lebih awal
        sehingga request gambar pertama tidak perlu menunggu handshake.
        Ini mengurangi latency ~100-300ms untuk semua gambar dari domain ini.
      */}
      <link rel="preconnect" href="https://storagelms.man2kotamakassar.sch.id" />
      <link rel="dns-prefetch" href="https://storagelms.man2kotamakassar.sch.id" />

      {/* Preload gambar LCP (slider pertama) — harus di-fetch sebelum JS dieksekusi */}
      {lcpImageUrl && (
        <link
          rel="preload"
          as="image"
          href={lcpImageUrl}
          fetchPriority="high"
        />
      )}

      <PublicNavbar menuItems={navItems} />

      <main>
        <div id="beranda"><HeroSection sliders={sliderData} aktivitas={aktivitasData} /></div>
        <div id="profil"><ProfilSection profil={profilData} stats={aktivitasData?.profil ?? statsData} /></div>
        <div id="fitur"><FiturSection fitur={fiturData} foto2Url={profilData?.foto2Url ?? null} /></div>
        <div id="download"><DownloadSection /></div>
        <div id="berita"><BeritaSection berita={berita} /></div>
        <div id="galeri"><GaleriSection album={galeriDetail} albumList={albums} /></div>
      </main>

      <PublicFooter profil={profilData} />
    </div>
  )
}
