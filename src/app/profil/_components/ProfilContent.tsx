'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, Phone, Mail, Globe, Award, GraduationCap, Users, BookOpen } from 'lucide-react'
import { getPublicFileUrl } from '@/lib/constants'
import { PlaceholderImage } from '@/components/public/PlaceholderImage'
import type { ProfilMadrasah } from '@/types/homepage.types'

const BANNER_URL = 'https://storagelms.man2kotamakassar.sch.id/static-assets/static_login_image.webp'

interface Props {
  profil: ProfilMadrasah | null
  stats:  any
}

function ImgWithFallback({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => { if (ref.current?.complete) setLoaded(true) }, [src])
  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      {!loaded && <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />}
      <img ref={ref} src={src} alt={alt} onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}

type Tab = 'profil' | 'visi-misi' | 'sejarah' | 'sambutan'

export function ProfilContent({ profil, stats }: Props) {
  const [tab, setTab] = useState<Tab>('profil')

  if (!profil) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-400">Data profil tidak tersedia.</p>
      </div>
    )
  }

  const fotoKepala = profil.fotoKepala ? getPublicFileUrl(profil.fotoKepala) : null
  const foto1      = profil.foto1Url   ? getPublicFileUrl(profil.foto1Url)   : null
  const foto2      = profil.foto2Url   ? getPublicFileUrl(profil.foto2Url)   : null
  const foto3      = profil.foto3Url   ? getPublicFileUrl(profil.foto3Url)   : null

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profil',    label: 'Profil' },
    { key: 'visi-misi', label: 'Visi & Misi' },
    { key: 'sejarah',   label: 'Sejarah' },
    { key: 'sambutan',  label: 'Sambutan' },
  ]

  return (
    <>
      {/* ── Hero ── */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img src={foto1 ?? BANNER_URL} alt="Madrasah" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          <p className="text-xs text-emerald-300 uppercase tracking-widest mb-1">Profil Madrasah</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{profil.nama}</h1>
          {profil.akreditasi && (
            <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/80 text-white">
              <Award size={12} /> Akreditasi {profil.akreditasi}
            </span>
          )}
        </div>
      </div>

      {/* ── Stat bar ── */}
      <div className="bg-emerald-700 dark:bg-emerald-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: <GraduationCap size={18} />, value: stats?.totalSiswa ?? '—', label: 'Siswa Aktif' },
            { icon: <Users size={18} />,         value: stats?.totalGuru  ?? '—', label: 'Guru & Staff' },
            { icon: <BookOpen size={18} />,      value: stats?.totalMapel ?? '—', label: 'Mata Pelajaran' },
            { icon: <Award size={18} />,         value: stats?.totalKelas ?? '—', label: 'Kelas' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 text-white">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">{s.icon}</div>
              <div>
                <p className="text-xl font-bold leading-none">{typeof s.value === 'number' ? s.value.toLocaleString('id') : s.value}</p>
                <p className="text-[11px] text-white/70 uppercase mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Sidebar kiri */}
          <div className="space-y-6">
            {/* Foto kepala */}
            <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
              <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4 border-4 border-emerald-100 dark:border-emerald-900/40 shadow-lg">
                {fotoKepala
                  ? <ImgWithFallback src={fotoKepala} alt={profil.namaKepala} className="w-full h-full" />
                  : <PlaceholderImage variant="person" className="w-full h-full" />
                }
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-center mb-1">Kepala Madrasah</p>
              <h3 className="text-base font-bold text-gray-900 dark:text-white text-center">{profil.namaKepala}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-0.5">{profil.nama}</p>
            </div>

            {/* Kontak */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5 space-y-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Kontak</h4>
              {profil.alamat && (
                <div className="flex gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                  <MapPin size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{profil.alamat}</span>
                </div>
              )}
              {profil.telepon && (
                <div className="flex gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                  <Phone size={15} className="text-emerald-500 shrink-0" />
                  <span>{profil.telepon}</span>
                </div>
              )}
              {profil.email && (
                <div className="flex gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                  <Mail size={15} className="text-emerald-500 shrink-0" />
                  <a href={`mailto:${profil.email}`} className="hover:text-emerald-600 transition-colors">{profil.email}</a>
                </div>
              )}
              {profil.website && (
                <div className="flex gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                  <Globe size={15} className="text-emerald-500 shrink-0" />
                  <a href={profil.website} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors truncate">{profil.website}</a>
                </div>
              )}
            </div>

            {/* Foto galeri kecil */}
            {(foto2 || foto3) && (
              <div className="grid grid-cols-2 gap-2">
                {foto2 && <ImgWithFallback src={foto2} alt="Foto 2" className="rounded-xl aspect-square" />}
                {foto3 && <ImgWithFallback src={foto3} alt="Foto 3" className="rounded-xl aspect-square" />}
              </div>
            )}
          </div>

          {/* Konten utama */}
          <div className="lg:col-span-2">
            {/* Tab nav */}
            <div className="flex gap-1 mb-6 border-b border-gray-100 dark:border-gray-800">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2 ${
                    tab === t.key
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {tab === 'profil' && (
                <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                  <p>{profil.nama} adalah madrasah aliyah negeri yang berkomitmen memberikan pendidikan berkualitas berbasis nilai-nilai Islam.</p>
                  {profil.akreditasi && <p>Madrasah ini telah mendapatkan akreditasi <strong>{profil.akreditasi}</strong> dari Badan Akreditasi Nasional.</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose mt-6">
                    {[
                      { label: 'Nama Madrasah', value: profil.nama },
                      { label: 'Kepala Madrasah', value: profil.namaKepala },
                      { label: 'Akreditasi', value: profil.akreditasi ?? '—' },
                      { label: 'Email', value: profil.email },
                      { label: 'Telepon', value: profil.telepon },
                      { label: 'Website', value: profil.website ?? '—' },
                    ].map((item) => (
                      <div key={item.label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                        <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">{item.label}</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'visi-misi' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <span className="w-1 h-5 bg-emerald-500 rounded-full inline-block" />
                      Visi
                    </h3>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl p-5">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">"{profil.visi}"</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <span className="w-1 h-5 bg-emerald-500 rounded-full inline-block" />
                      Misi
                    </h3>
                    <div
                      className="text-gray-600 dark:text-gray-300 leading-relaxed space-y-2"
                      dangerouslySetInnerHTML={{ __html: profil.misi ?? '' }}
                    />
                  </div>
                </div>
              )}

              {tab === 'sejarah' && (
                <div
                  className="text-gray-600 dark:text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: profil.sejarah ?? '<p>Sejarah belum tersedia.</p>' }}
                />
              )}

              {tab === 'sambutan' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-100 dark:border-emerald-900/40 shrink-0">
                      {fotoKepala
                        ? <ImgWithFallback src={fotoKepala} alt={profil.namaKepala} className="w-full h-full" />
                        : <PlaceholderImage variant="person" className="w-full h-full" />
                      }
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{profil.namaKepala}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Kepala Madrasah</p>
                    </div>
                  </div>
                  <div className="relative pl-6 border-l-2 border-emerald-200 dark:border-emerald-800">
                    <div className="text-4xl text-emerald-200 dark:text-emerald-800 font-serif absolute -top-2 -left-3 select-none">"</div>
                    <div
                      className="text-gray-600 dark:text-gray-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: profil.sambutan ?? '<p>Sambutan belum tersedia.</p>' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
