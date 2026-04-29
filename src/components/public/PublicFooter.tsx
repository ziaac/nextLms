'use client'

import Link from 'next/link'
import { MapPin, Phone, Mail, Globe, BookOpen } from 'lucide-react'

const LOGO_URL = 'https://storagelms.man2kotamakassar.sch.id/static-assets/static_logoman-150h.png'

interface FooterProps {
  profil?: {
    nama?: string; alamat?: string; telepon?: string
    email?: string; website?: string
  } | null
}

export function PublicFooter({ profil }: FooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gray-950 dark:bg-gray-950 text-gray-300">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Kolom 1 — Identitas */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={LOGO_URL}
                alt="Logo MAN 2"
                className="h-12 w-auto object-contain brightness-90"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Sistem Manajemen Pembelajaran</p>
                <p className="text-base font-semibold text-white leading-tight">
                  {profil?.nama ?? 'MAN 2 Kota Makassar'}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Platform digital terintegrasi untuk mendukung proses pembelajaran, administrasi, dan komunikasi di lingkungan madrasah.
            </p>
          </div>

          {/* Kolom 2 — Navigasi */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Navigasi</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Beranda',          href: '/' },
                { label: 'Profil Madrasah',  href: '/profil' },
                { label: 'Berita & Informasi', href: '/berita' },
                { label: 'Galeri Kegiatan',  href: '/galeri' },
                { label: 'Jadwal Pelajaran', href: '/jadwal-publik' },
                { label: 'Masuk / Login',    href: '/login' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 3 — Kontak */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Kontak</h3>
            <ul className="space-y-3">
              {profil?.alamat && (
                <li className="flex items-start gap-2.5 text-sm text-gray-400">
                  <MapPin size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{profil.alamat}</span>
                </li>
              )}
              {profil?.telepon && (
                <li className="flex items-center gap-2.5 text-sm text-gray-400">
                  <Phone size={14} className="text-emerald-500 shrink-0" />
                  <span>{profil.telepon}</span>
                </li>
              )}
              {profil?.email && (
                <li className="flex items-center gap-2.5 text-sm text-gray-400">
                  <Mail size={14} className="text-emerald-500 shrink-0" />
                  <a href={`mailto:${profil.email}`} className="hover:text-emerald-400 transition-colors">
                    {profil.email}
                  </a>
                </li>
              )}
              {profil?.website && (
                <li className="flex items-center gap-2.5 text-sm text-gray-400">
                  <Globe size={14} className="text-emerald-500 shrink-0" />
                  <a href={profil.website} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                    {profil.website.replace(/^https?:\/\//, '')}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <span>© {year} {profil?.nama ?? 'MAN 2 Kota Makassar'}. Hak cipta dilindungi.</span>
          <span className="flex items-center gap-1.5">
            <BookOpen size={11} className="text-emerald-700" />
            Developed by <span className="text-emerald-600 font-medium">EZI Edutech Dev</span> · {year}
          </span>
        </div>
      </div>
    </footer>
  )
}
