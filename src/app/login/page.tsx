'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'
import { LoginBannerPanel } from '@/components/auth/LoginBannerPanel'
import { ThemeToggle } from '@/components/dashboard/ThemeToggle'

const HOME_URL = 'https://lms.man2kotamakassar.sch.id'
const LOGO_URL = 'https://storagelms.man2kotamakassar.sch.id/static-assets/static_logoman-150h.png'
const BANNER_URL_MOBILE = 'https://storagelms.man2kotamakassar.sch.id/static-assets/static_back_login_mobile.webp'

export default function LoginPage() {
  const [userRole, setUserRole] = useState<'siswa' | 'guru'>('siswa')
  const [logoError, setLogoError] = useState(false)

  const domain = userRole === 'siswa' ? '@m2m.my.id' : '@man2kotamakassar.sch.id'

  return (
    <main className="min-h-screen flex items-center justify-center p-0 lg:p-4 relative bg-gradient-to-br from-emerald-50/60 via-white to-emerald-100/40 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20">
      
      {/* Latar Belakang Banner Khusus Mobile (Tanpa Blur) */}
      <div className="lg:hidden absolute inset-0 z-0">
        <img
          src={BANNER_URL_MOBILE}
          alt="Mobile Background"
          className="w-full h-full object-cover"
        />
        {/* Overlay tipis agar tetap ada kontras untuk teks */}
        <div className="absolute inset-0 bg-black/5 dark:bg-black/40" />
      </div>

      <div className="relative z-10 w-full max-w-5xl lg:rounded-3xl overflow-hidden shadow-2xl flex min-h-screen lg:min-h-[600px] bg-transparent lg:bg-white/60 dark:lg:bg-gray-900/80 lg:backdrop-blur-xl border-none lg:border lg:border-white/50 dark:lg:border-gray-700/40">

        {/* Tombol Close + ThemeToggle (mobile only) */}
        <div className="lg:hidden absolute top-6 right-6 z-50 flex items-center gap-2">
          <div className="p-1 rounded-full bg-white/60 dark:bg-gray-800/70 backdrop-blur-md border border-gray-200/50 dark:border-gray-600/40 shadow-sm">
            <ThemeToggle />
          </div>
          <Link
            href={HOME_URL}
            className="p-2 rounded-full bg-white/60 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-600/40 backdrop-blur-md transition-all shadow-sm"
          >
            <X size={18} strokeWidth={1.5} className="text-gray-600 dark:text-gray-300" />
          </Link>
        </div>

        {/* ── Sisi Kiri: Form Login ── */}
        <div className="w-full lg:w-[45%] flex flex-col justify-center lg:justify-between p-6 sm:p-10 lg:p-12">
          
          <div className="w-full bg-white/40 dark:bg-gray-800/50 lg:bg-transparent dark:lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none p-8 lg:p-0 rounded-[24px] lg:rounded-none shadow-xl lg:shadow-none border border-white/40 dark:border-gray-700/30 lg:border-none">

            {/* Logo & Judul */}
            <div className="flex items-center gap-4 mb-2 lg:mb-2 pb-4 border-b border-gray-100/50 dark:border-gray-700/40 lg:border-gray-50/50 dark:lg:border-gray-700/30">
              <div className="relative shrink-0">
                {!logoError ? (
                  <img
                    src={LOGO_URL}
                    alt="Logo MAN 2"
                    className="w-auto object-contain"
                    style={{ height: '70px' }}
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="h-[70px] w-[70px] bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-gray-400 dark:text-gray-500 text-xl">
                    M2
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <h2 className="text-[12px] text-gray-700 dark:text-gray-300 uppercase leading-none mb-2 font-normal">
                  Sistem Manajemen Pembelajaran
                </h2>
                <h1 className="text-lg lg:text-2xl text-gray-600 dark:text-gray-100 font-normal">
                  MAN 2 KOTA MAKASSAR
                </h1>
              </div>
            </div>

            {/* Role Selector */}
            <div className="flex p-1 bg-gray-200/20 dark:bg-gray-700/40 lg:bg-white/40 dark:lg:bg-gray-700/40 backdrop-blur-sm rounded-xl mb-8 border border-gray-200/10 dark:border-gray-600/20 lg:border-white/50 dark:lg:border-gray-600/30">
              <button
                onClick={() => setUserRole('siswa')}
                className={`flex-1 py-2 text-sm rounded-lg transition-all duration-300 font-normal ${
                  userRole === 'siswa'
                  ? 'bg-white/80 dark:bg-gray-600 text-emerald-700 dark:text-emerald-400 shadow-sm border border-gray-100/50 dark:border-gray-500/40'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Siswa
              </button>
              <button
                onClick={() => setUserRole('guru')}
                className={`flex-1 py-2 text-sm rounded-lg transition-all duration-300 font-normal ${
                  userRole === 'guru'
                  ? 'bg-white/80 dark:bg-gray-600 text-emerald-700 dark:text-emerald-400 shadow-sm border border-gray-100/50 dark:border-gray-500/40'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Guru
              </button>
            </div>

            <LoginForm role={userRole} domain={domain} />
          </div>

          <div className="hidden lg:flex mt-8 pt-6 border-t border-gray-50/50 dark:border-gray-700/40 items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 uppercase font-normal">
            <span>© {new Date().getFullYear()} MAN 2 Kota Makassar</span>
            <ThemeToggle />
            <Link href={HOME_URL} className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Beranda</Link>
          </div>
        </div>

        {/* ── Sisi Kanan: Banner Info ── */}
        <div className="hidden lg:block lg:w-[55%] relative overflow-hidden bg-gray-900">
          <LoginBannerPanel />
        </div>
      </div>
    </main>
  )
}