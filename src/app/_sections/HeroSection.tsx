'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Clock, Users, GraduationCap, BookOpen, AlertCircle } from 'lucide-react'
import { getPublicFileUrl } from '@/lib/constants'
import { API_URL } from '@/lib/constants'

const HARI_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BANNER_URL = 'https://storagelms.man2kotamakassar.sch.id/static-assets/static_login_image.webp'

interface Slider {
  id: string; judul: string; deskripsi?: string | null
  imageUrl: string; linkUrl?: string | null; urutan: number; isActive: boolean
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function InfoCardSkeleton() {
  return (
    <div className="relative flex flex-col rounded-3xl overflow-hidden border border-white/20 h-full p-6 gap-4">
      <div className="absolute inset-0 bg-white/[0.04]" style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }} />
      <div className="relative z-10 space-y-4">
        <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
        <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-2 mt-2">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
              <div className="h-4 w-10 bg-white/10 rounded animate-pulse" />
              <div className="h-2 w-8 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="space-y-2 mt-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-12 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Info card ─────────────────────────────────────────────────────────────────
function InfoCard() {
  const [stats,   setStats]   = useState<any>(null)
  const [jadwal,  setJadwal]  = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)
  const [hariIni, setHariIni] = useState('')

  useEffect(() => {
    setHariIni(HARI_ID[new Date().getDay()])
    const load = async () => {
      try {
        const [sRes, jRes] = await Promise.all([
          fetch(`${API_URL}/report/public/stats`),
          fetch(`${API_URL}/jadwal-pelajaran/publik/hari-ini`),
        ])
        setStats(await sRes.json())
        const jData = await jRes.json()
        setJadwal(jData.data ?? [])
      } catch { setError(true) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <InfoCardSkeleton />

  const allSesi = jadwal
    .flatMap((k: any) => k.jadwal.map((j: any) => ({ ...j, namaKelas: k.namaKelas })))
    .slice(0, 8)

  return (
    <div className="relative flex flex-col rounded-3xl overflow-hidden border border-white/20 shadow-2xl h-full">
      <div
        className="absolute inset-0 z-0 bg-white/[0.04]"
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          maskImage: 'radial-gradient(ellipse at center, transparent 0%, black 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 0%, black 85%)',
        }}
      />
      <div className="relative z-10 px-6 py-5 flex flex-col h-full">
        <div className="mb-4">
          <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Live Report</p>
          <h3 className="text-xl text-white leading-none font-light">Informasi Akademik</h3>
        </div>

        {error ? (
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <AlertCircle size={14} />
            <span>Gagal memuat data</span>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden gap-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Siswa',  value: stats?.totalSiswa ?? 0, icon: <GraduationCap size={16} strokeWidth={1.5} /> },
                { label: 'Guru',   value: stats?.totalGuru  ?? 0, icon: <Users size={16} strokeWidth={1.5} /> },
                { label: 'Kelas',  value: stats?.totalKelas ?? 0, icon: <BookOpen size={16} strokeWidth={1.5} /> },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-2.5 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/70 mb-1.5">
                    {s.icon}
                  </div>
                  <p className="text-lg text-white leading-none">{s.value.toLocaleString('id')}</p>
                  <p className="text-[10px] text-white/40 uppercase mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex justify-between items-end mb-2 border-b border-white/10 pb-1.5">
                <p className="text-[10px] text-white/50 uppercase">Jadwal Hari Ini</p>
                <p className="text-[10px] text-white/70 uppercase">{hariIni || '...'}</p>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto pr-1" style={{ scrollbarWidth: 'none' }}>
                {allSesi.length > 0 ? allSesi.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2.5">
                    <div className="flex flex-col items-center shrink-0 min-w-[44px]">
                      <Clock size={12} strokeWidth={1.5} className="text-white/50 mb-1" />
                      <span className="text-[11px] text-white">{s.jamMulai}</span>
                    </div>
                    <div className="min-w-0 border-l border-white/10 pl-3">
                      <p className="text-[12px] text-white truncate uppercase">{s.namaMapel}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{s.namaKelas}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-[11px] text-white/30 uppercase text-center py-4">
                    Tidak ada jadwal hari ini
                  </p>
                )}
              </div>
              <div className="mt-3 pt-2 border-t border-white/5">
                <Link href="/jadwal-publik" className="text-[11px] text-white/50 hover:text-white transition-colors uppercase">
                  Jadwal Selengkapnya →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Slide image dengan loading state ─────────────────────────────────────────
function SlideImage({ src, alt, onError }: { src: string; alt: string; onError: () => void }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      {/* Skeleton saat loading */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-gray-900 to-teal-950 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={onError}
        className={`w-full h-full object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  )
}

// ── Main Hero ─────────────────────────────────────────────────────────────────
export function HeroSection({ sliders }: { sliders: Slider[] }) {
  const [current,      setCurrent]      = useState(0)
  const [imgError,     setImgError]     = useState(false)

  const activeSliders = sliders.filter((s) => s.isActive)
  const hasSliders    = activeSliders.length > 0

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + activeSliders.length) % activeSliders.length)
    setImgError(false)
  }, [activeSliders.length])

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % activeSliders.length)
    setImgError(false)
  }, [activeSliders.length])

  useEffect(() => {
    if (activeSliders.length <= 1) return
    const t = setInterval(next, 5500)
    return () => clearInterval(t)
  }, [next, activeSliders.length])

  const currentSlide = activeSliders[current]
  const slideImgUrl  = currentSlide?.imageUrl ? getPublicFileUrl(currentSlide.imageUrl) : null

  return (
    <section className="relative w-full min-h-screen flex items-stretch overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 z-0">
        {hasSliders && slideImgUrl && !imgError ? (
          <SlideImage
            key={currentSlide.id}
            src={slideImgUrl}
            alt={currentSlide.judul}
            onError={() => setImgError(true)}
          />
        ) : (
          <img src={BANNER_URL} alt="Banner" className="w-full h-full object-cover" />
        )}
        {/* Overlay — vignette di pinggir, tengah lebih terang */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.55)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center pt-20 pb-12">
        <div className="w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-12">

          {/* Left */}
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-300 uppercase tracking-wider font-medium">
                Sistem Manajemen Pembelajaran
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white drop-shadow-lg">
                {hasSliders && currentSlide ? currentSlide.judul : 'MAN 2 Kota Makassar'}
              </h1>
              {hasSliders && currentSlide?.deskripsi && (
                <p className="text-base sm:text-lg text-white/85 leading-relaxed max-w-xl drop-shadow">
                  {currentSlide.deskripsi}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-900/40 hover:-translate-y-0.5"
              >
                Masuk ke LMS
              </Link>
              <Link
                href="/profil"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-medium text-sm transition-all backdrop-blur-sm"
              >
                Profil Madrasah
              </Link>
            </div>

            {activeSliders.length > 1 && (
              <div className="flex items-center gap-3">
                <button type="button" onClick={prev}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-1.5">
                  {activeSliders.map((_, i) => (
                    <button key={i} type="button" onClick={() => { setCurrent(i); setImgError(false) }}
                      className={`rounded-full transition-all ${i === current ? 'w-6 h-2 bg-emerald-400' : 'w-2 h-2 bg-white/30 hover:bg-white/60'}`}
                    />
                  ))}
                </div>
                <button type="button" onClick={next}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Right — Info card */}
          <div className="w-full lg:w-80 xl:w-96 lg:h-[480px]">
            <InfoCard />
          </div>
        </div>
      </div>

      {/* Bottom — diagonal cut tegas, full width */}
      <div className="absolute bottom-0 left-0 right-0 z-10 overflow-hidden leading-none">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ display: 'block', width: '100%' }}>
          <polygon points="0,80 0,80 1440,20 1440,80" fill="rgb(236 253 245)" className="dark:hidden" />
          <polygon points="0,80 0,80 1440,20 1440,80" fill="rgb(3 7 18)" className="hidden dark:block" />
        </svg>
      </div>
    </section>
  )
}
