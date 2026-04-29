'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, GraduationCap, Users, BookOpen, ClipboardCheck, FileText, ClipboardList } from 'lucide-react'
import { getPublicFileUrl } from '@/lib/constants'
import { PlaceholderImage } from '@/components/public/PlaceholderImage'

const BANNER_URL = 'https://storagelms.man2kotamakassar.sch.id/static-assets/static_login_image.webp'

interface ProfilSectionProps {
  profil: any
  stats:  any
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function ProfilSectionSkeleton() {
  return (
    <section className="relative py-20 bg-white dark:bg-gray-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          <div className="space-y-5">
            <div className="flex gap-5">
              <div className="w-28 h-28 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2 pt-2">
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => <div key={i} className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />)}
            </div>
          </div>
          <div className="h-[420px] rounded-3xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      </div>
    </section>
  )
}

// ── Stat components ───────────────────────────────────────────────────────────
function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="bg-white/8 border border-white/15 rounded-2xl p-3 flex flex-col items-center text-center hover:bg-white/15 transition-colors">
      <div className="w-9 h-9 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-white mb-2">
        {icon}
      </div>
      <p className="text-xl text-white leading-none my-0.5 font-light">
        {typeof value === 'number' ? value.toLocaleString('id') : value}
      </p>
      <p className="text-[10px] text-white/65 uppercase mt-1 leading-tight">{label}</p>
    </div>
  )
}

function StatRow({ icon, value, label, sub }: {
  icon: React.ReactNode; value: string | number; label: string; sub?: string
}) {
  return (
    <div className="flex items-center gap-3 bg-white/8 border border-white/15 rounded-xl px-3.5 py-2.5 hover:bg-white/15 transition-colors">
      <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-white shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-white/80 uppercase truncate font-medium">{label}</p>
        {sub && <p className="text-[10px] text-emerald-300/80 truncate">{sub}</p>}
      </div>
      <p className="text-base text-white font-light shrink-0">
        {typeof value === 'number' ? value.toLocaleString('id') : value}
      </p>
    </div>
  )
}

// ── BgImage ───────────────────────────────────────────────────────────────────
function BgImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    // Jika gambar sudah di-cache, complete=true tapi onLoad tidak fired
    if (imgRef.current?.complete) setLoaded(true)
  }, [src])

  return (
    <>
      {!loaded && <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 to-teal-900 animate-pulse" />}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function ProfilSection({ profil, stats }: ProfilSectionProps) {
  const [kepalaLoaded, setKepalaLoaded] = useState(false)
  const kepalaRef = useRef<HTMLImageElement>(null)

  const foto1Url      = profil?.foto1Url   ? getPublicFileUrl(profil.foto1Url)   : null
  const fotoKepalaUrl = profil?.fotoKepala ? getPublicFileUrl(profil.fotoKepala) : null

  useEffect(() => {
    if (kepalaRef.current?.complete) setKepalaLoaded(true)
  }, [fotoKepalaUrl])

  if (!profil || !profil.nama) return null

  const sambutanText = profil.sambutan
    ? profil.sambutan.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : ''
  const sambutanExcerpt = sambutanText.length > 400
    ? sambutanText.slice(0, 400) + '...'
    : sambutanText

  return (
    <section className="relative pt-12 pb-20 bg-white dark:bg-gray-950 overflow-hidden">

      {/* ── Ornamen diagonal ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          viewBox="0 0 1440 600"
          preserveAspectRatio="none"
          className="absolute top-0 left-0 w-full h-full"
        >
          {/* Layer 3 — terlebar, paling soft, menutupi seluruh tinggi section */}
          <polygon points="0,0 1440,0 1440,380 0,600" fill="rgb(236 253 245)" className="dark:hidden" />
          <polygon points="0,0 1440,0 1440,380 0,600" fill="rgba(6,78,59,0.08)" className="hidden dark:block" />
          {/* Layer 2 — medium */}
          <polygon points="0,0 1440,0 1440,220 0,440" fill="rgb(209 250 229)" className="dark:hidden" />
          <polygon points="0,0 1440,0 1440,220 0,440" fill="rgba(6,78,59,0.15)" className="hidden dark:block" />
          {/* Layer 1 — tersempit, warna sama dengan layer 3 */}
          <polygon points="0,0 1440,0 1440,60 0,240" fill="rgb(236 253 245)" className="dark:hidden" />
          <polygon points="0,0 1440,0 1440,60 0,240" fill="rgba(6,78,59,0.08)" className="hidden dark:block" />
        </svg>

        {/* Dot pattern di kanan */}
        <div
          className="absolute top-8 right-0 w-80 h-72 opacity-20 dark:opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            maskImage: 'radial-gradient(ellipse at right center, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at right center, black 20%, transparent 70%)',
          }}
        />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Kolom Kiri */}
          <div className="space-y-6">
            <div className="flex items-start gap-5">
              <div className="shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-emerald-100 dark:border-emerald-900/40 shadow-xl shadow-emerald-100/50 dark:shadow-emerald-900/20">
                  {fotoKepalaUrl ? (
                    <>
                      {!kepalaLoaded && <div className="w-full h-full bg-emerald-100 dark:bg-emerald-900/30 animate-pulse" />}
                      <img
                        ref={kepalaRef}
                        src={fotoKepalaUrl}
                        alt={profil.namaKepala}
                        onLoad={() => setKepalaLoaded(true)}
                        fetchPriority="high"
                        className={`w-full h-full object-cover transition-opacity duration-500 ${kepalaLoaded ? 'opacity-100' : 'opacity-0'}`}
                      />
                    </>
                  ) : (
                    <PlaceholderImage variant="person" className="w-full h-full" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <p className="text-xs text-emerald-600 dark:text-emerald-500 uppercase tracking-wider font-medium mb-1">
                  Kepala Madrasah
                </p>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  {profil.namaKepala}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{profil.nama}</p>
                {profil.akreditasi && (
                  <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    Akreditasi {profil.akreditasi}
                  </span>
                )}
              </div>
            </div>

            {sambutanExcerpt && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Sambutan Kepala Madrasah</p>
                <div className="relative">
                  <div className="absolute -top-2 -left-1 text-5xl text-emerald-200 dark:text-emerald-900/60 font-serif leading-none select-none">"</div>
                  <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed pl-4 line-clamp-10">
                    {sambutanExcerpt}
                  </p>
                </div>
              </div>
            )}

            <Link
              href="/profil"
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group"
            >
              Profil Lengkap
              <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Kolom Kanan — Card statistik */}
          <div className="relative rounded-3xl overflow-hidden min-h-[420px]">
            {/* Background image */}
            <div className="absolute inset-0">
              {foto1Url ? (
                <BgImage src={foto1Url} alt="Foto Madrasah" />
              ) : (
                <img src={BANNER_URL} alt="Banner" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/25" />
            </div>

            {/* Card transparan */}
            <div className="relative z-10 p-6 h-full flex flex-col">
              <div className="relative flex-1 flex flex-col rounded-2xl overflow-hidden border border-white/20 shadow-xl">
                {/* Blur ringan */}
                <div
                  className="absolute inset-0 z-0 bg-white/[0.06]"
                  style={{
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    maskImage: 'radial-gradient(ellipse at center, transparent 0%, black 85%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 0%, black 85%)',
                  }}
                />
                <div className="relative z-10 p-5 flex flex-col gap-4 h-full">

                  {/* Header card — tanpa sub-heading, langsung label */}
                  <div>
                    <p className="text-[11px] text-white/70 uppercase tracking-widest mb-0.5">Statistik Akademik</p>
                    <p className="text-xl text-white font-light leading-tight">Data Madrasah</p>
                  </div>

                  {/* Stat utama */}
                  <div className="grid grid-cols-3 gap-2">
                    <StatCard icon={<Users size={16} strokeWidth={1.5} />}        value={stats?.totalGuru  ?? '—'} label="Guru" />
                    <StatCard icon={<GraduationCap size={16} strokeWidth={1.5} />} value={stats?.totalSiswa ?? '—'} label="Siswa Aktif" />
                    <StatCard icon={<BookOpen size={16} strokeWidth={1.5} />}      value={stats?.totalMapel ?? '—'} label="Mata Pelajaran" />
                  </div>

                  {/* Stat rows */}
                  <div className="space-y-2 flex-1">
                    <StatRow icon={<ClipboardCheck size={14} strokeWidth={1.5} />} value={stats?.totalKelas  ?? '—'} label="Kelas Aktif"      sub="Semester berjalan" />
                    <StatRow icon={<FileText size={14} strokeWidth={1.5} />}       value={stats?.totalEkskul ?? '—'} label="Ekstrakurikuler" sub="Kegiatan tersedia" />
                    <StatRow icon={<ClipboardList size={14} strokeWidth={1.5} />}  value={stats?.totalMapel  ?? '—'} label="Total Mapel"      sub="Semua tingkat" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
