'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LayoutDashboard, LogIn } from 'lucide-react'
import { ThemeToggle } from '@/components/dashboard/ThemeToggle'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'

const LOGO_URL = 'https://storagelms.man2kotamakassar.sch.id/static-assets/static_logoman-150h.png'

interface NavItem { label: string; href: string }

const DEFAULT_NAV: NavItem[] = [
  { label: 'Beranda',            href: '/' },
  { label: 'Profil',             href: '/profil' },
  { label: 'Informasi',          href: '/informasi' },
  { label: 'Pengumuman',         href: '/pengumuman' },
  { label: 'Kalender Akademik',  href: '/kalender-akademik' },
  { label: 'Galeri',             href: '/galeri' },
]

// Map href → anchor id di halaman home
const HOME_ANCHORS: Record<string, string> = {
  '/':           'beranda',
  '/profil':     'profil',
  '/informasi':  'fitur',
  '/fitur':      'fitur',
  '/berita':     'berita',
  '/galeri':     'galeri',
}

// Normalisasi href — redirect /fitur ke /informasi
const HREF_NORMALIZE: Record<string, string> = {
  '/fitur': '/informasi',
}

// Map label (lowercase) → anchor id — fallback jika href tidak cocok
const HOME_ANCHORS_BY_LABEL: Record<string, string> = {
  'beranda':          'beranda',
  'home':             'beranda',
  'profil':           'profil',
  'profil madrasah':  'profil',
  'fitur':            'fitur',
  'fitur aplikasi':   'fitur',
  'informasi':        'fitur',
  'berita':           'berita',
  'blog':             'berita',
  'kabar':            'berita',
  'galeri':           'galeri',
  'galeri kegiatan':  'galeri',
}

export function PublicNavbar({ menuItems }: { menuItems?: NavItem[] }) {
  const pathname        = usePathname()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [open,      setOpen]      = useState(false)
  const [scrolled,  setScrolled]  = useState(false)
  const [logoError, setLogoError] = useState(false)
  // Mencegah hydration mismatch: tunda render bagian yang bergantung pada
  // client state (isAuthenticated dari localStorage, scrolled dari window)
  const [mounted, setMounted] = useState(false)

  const isHeroPage = pathname === '/'

  const navItems = menuItems?.length ? menuItems : DEFAULT_NAV

  // Setelah mount, baru gunakan isAuthenticated yang sebenarnya
  const authReady      = mounted ? isAuthenticated : false
  const filteredNavItems = navItems.filter((item) => {
    if (authReady && (item.href === '/login' || item.label.toLowerCase() === 'login')) {
      return false
    }
    return true
  })

  useEffect(() => {
    setMounted(true)
    const handler = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Saat belum mounted, gunakan nilai default yang sama dengan SSR
  const isTransparent = isHeroPage && (mounted ? !scrolled : true)

  // Smooth scroll ke anchor saat di halaman home
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, label: string) => {
    const normalizedHref = HREF_NORMALIZE[href] ?? href
    if (!isHeroPage) return
    const anchorId = HOME_ANCHORS[normalizedHref] ?? HOME_ANCHORS_BY_LABEL[label.toLowerCase()]
    if (!anchorId) return
    e.preventDefault()
    const el = document.getElementById(anchorId)
    if (el) {
      const offset = 64
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
    setOpen(false)
  }

  // Resolve href untuk render link
  const resolveHref = (href: string, label: string): string => {
    const normalizedHref = HREF_NORMALIZE[href] ?? href
    if (isHeroPage) {
      const anchorId = HOME_ANCHORS[normalizedHref] ?? HOME_ANCHORS_BY_LABEL[label.toLowerCase()]
      if (anchorId) return `#${anchorId}`
    }
    return normalizedHref
  }

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      isTransparent
        ? 'bg-transparent'
        : 'bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl shadow-sm',
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">

        {/* Logo + nama */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          {!logoError ? (
            <img
              src={LOGO_URL}
              alt="Logo MAN 2"
              className="h-9 w-auto object-contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">M2</span>
            </div>
          )}
          <div className="hidden sm:block">
            <p className={cn(
              'text-[10px] uppercase leading-none',
              isTransparent ? 'text-white/70' : 'text-gray-500 dark:text-gray-400',
            )}>
              Sistem Manajemen Pembelajaran
            </p>
            <p className={cn(
              'text-sm font-semibold leading-tight',
              isTransparent ? 'text-white' : 'text-gray-800 dark:text-white',
            )}>
              MAN 2 Kota Makassar
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center" aria-label="Menu navigasi utama">
          {filteredNavItems.map((item) => {
            const resolved = resolveHref(item.href, item.label)
            const active   = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
            return (
              <a
                key={item.href}
                href={resolved}
                onClick={(e) => handleNavClick(e, item.href, item.label)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer',
                  isTransparent
                    ? active
                      ? 'text-white font-semibold underline underline-offset-4 decoration-emerald-400'
                      : 'text-white/85 hover:text-white'
                    : active
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-400',
                )}
              >
                {item.label}
              </a>
            )
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          <ThemeToggle />
          <Link
            href={authReady ? '/dashboard' : '/login'}
            className={cn(
              'hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              authReady
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                : isTransparent
                  ? 'border border-white/60 text-white hover:bg-white/15 backdrop-blur-sm'
                  : 'border border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
            )}
          >
            {authReady
              ? <><LayoutDashboard size={14} /> Dashboard</>
              : <><LogIn size={14} /> Masuk</>
            }
          </Link>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label="Menu navigasi"
            aria-expanded={mounted ? open : false}
            aria-controls="mobile-menu"
            className={cn(
              'lg:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors',
              isTransparent
                ? 'text-white hover:bg-white/15'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
            )}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          role="navigation"
          aria-label="Menu navigasi mobile"
          className="lg:hidden bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 px-4 py-4 space-y-1"
        >
          {filteredNavItems.map((item) => {
            const resolved = resolveHref(item.href, item.label)
            return (
              <a
                key={item.href}
                href={resolved}
                onClick={(e) => handleNavClick(e, item.href, item.label)}
                className={cn(
                  'block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer',
                  pathname === item.href
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
                )}
              >
                {item.label}
              </a>
            )
          })}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <Link
              href={authReady ? '/dashboard' : '/login'}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            >
              {authReady ? <><LayoutDashboard size={14} /> Dashboard</> : <><LogIn size={14} /> Masuk</>}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
