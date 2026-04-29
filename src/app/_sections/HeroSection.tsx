'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, AlertCircle,
  CalendarDays, UserCheck, BookOpenCheck, ClipboardList,
} from 'lucide-react'
import { getPublicFileUrl } from '@/lib/constants'

const BANNER_URL = 'https://storagelms.man2kotamakassar.sch.id/static-assets/static_login_image.webp'

interface Slider {
  id: string; judul: string; deskripsi?: string | null
  imageUrl: string; linkUrl?: string | null; urutan: number; isActive: boolean
}

interface AktivitasData {
  semesterNama: string | null
  tahunAjaran:  string | null
  jadwal:    { totalJP: number; totalSesiDibuka: number }
  kehadiran: { persentase: number; totalAbsensi: number }
  materi:    { totalDibuat: number; totalSiswaSelesai: number; totalSiswa: number }
  tugas:     { totalDibuat: number; totalSiswaKumpul: number; totalPengumpulan: number }
  profil:    { totalSiswa: number; totalGuru: number; totalMapel: number }
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function InfoCardSkeleton() {
  return (
    <div className="relative flex flex-col rounded-3xl overflow-hidden border border-white/20 h-full p-6 gap-4">
      <div className="absolute inset-0 bg-white/[0.04]" style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }} />
      <div className="relative z-10 space-y-4">
        <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
        <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
        <div className="space-y-2 mt-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-14 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
        <div className="space-y-2 mt-2">
          {[1,2,3].map(i => (
            <div key={i} className="h-10 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Stat row: nilai kiri / nilai kanan ────────────────────────────────────────
function StatRow({
  icon, label, left, right, leftLabel, rightLabel, accent = false,
}: {
  icon: React.ReactNode
  label: string
  left: string | number
  right: string | number
  leftLabel: string
  rightLabel: string
  accent?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${
      accent
        ? 'bg-emerald-500/10 border-emerald-400/20'
        : 'bg-white/5 border-white/10'
    }`}>
      <div className="w-7 h-7 rounded-full border border-white/15 bg-white/8 flex items-center justify-center text-white/70 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-white/75 uppercase tracking-wide truncate font-medium">{label}</p>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-sm text-white font-medium">{left}</span>
          <span className="text-[10px] text-white/40">{leftLabel}</span>
          <span className="text-white/20 mx-0.5">/</span>
          <span className="text-sm text-emerald-300 font-medium">{right}</span>
          <span className="text-[10px] text-white/40">{rightLabel}</span>
        </div>
      </div>
    </div>
  )
}

// ── Info card — menerima data aktivitas dari SSR ──────────────────────────────
function InfoCard({ aktivitas }: { aktivitas: AktivitasData | null }) {
  const a = aktivitas

  return (
    <div className="relative flex flex-col rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
      <div
        className="absolute inset-0 z-0 bg-white/[0.04]"
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          maskImage: 'radial-gradient(ellipse at center, transparent 0%, black 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 0%, black 85%)',
        }}
      />
      <div className="relative z-10 px-5 py-4 flex flex-col gap-3">

        {/* Header */}
        <div>
          <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">
            {a?.semesterNama && a?.tahunAjaran ? `${a.semesterNama} · ${a.tahunAjaran}` : 'Aktivitas Akademik'}
          </p>
          <h3 className="text-lg text-white leading-none font-light">Semester Ini</h3>
        </div>

        {!a && (
          <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
            <AlertCircle size={14} />
            <span>Data tidak tersedia</span>
          </div>
        )}

        {/* 4 stat rows — selalu tampil, nilai '—' jika data null */}
        <div className="space-y-1.5">
          <StatRow
            icon={<CalendarDays size={13} strokeWidth={1.5} />}
            label="Jadwal / Sesi Absen Dibuka"
            left={a?.jadwal.totalJP ?? '—'}
            leftLabel="JP"
            right={a?.jadwal.totalSesiDibuka ?? '—'}
            rightLabel="sesi"
          />
          <StatRow
            icon={<UserCheck size={13} strokeWidth={1.5} />}
            label="Kehadiran Siswa"
            left={`${a?.kehadiran.persentase ?? 0}%`}
            leftLabel="hadir"
            right={a?.kehadiran.totalAbsensi ?? '—'}
            rightLabel="total absen"
            accent={!!a && a.kehadiran.persentase >= 80}
          />
          <StatRow
            icon={<BookOpenCheck size={13} strokeWidth={1.5} />}
            label="Materi Dibuat / Siswa Selesai Baca"
            left={a?.materi.totalDibuat ?? '—'}
            leftLabel="materi"
            right={a?.materi.totalSiswaSelesai ?? '—'}
            rightLabel="siswa"
          />
          <StatRow
            icon={<ClipboardList size={13} strokeWidth={1.5} />}
            label="Tugas Dibuat / Pengumpulan"
            left={a?.tugas.totalDibuat ?? '—'}
            leftLabel="tugas"
            right={a?.tugas.totalSiswaKumpul ?? '—'}
            rightLabel="kumpul"
          />
        </div>
      </div>
    </div>
  )
}

// ── Slide image dengan loading state ─────────────────────────────────────────
function SlideImage({ src, alt, onError }: { src: string; alt: string; onError: () => void }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
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
export function HeroSection({ sliders, aktivitas }: { sliders: Slider[]; aktivitas: AktivitasData | null }) {
  const [current,  setCurrent]  = useState(0)
  const [imgError, setImgError] = useState(false)

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
          <div className="w-full lg:w-80 xl:w-96">
            <InfoCard aktivitas={aktivitas} />
          </div>
        </div>
      </div>

      {/* Bottom diagonal */}
      <div className="absolute bottom-0 left-0 right-0 z-10 overflow-hidden leading-none">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ display: 'block', width: '100%' }}>
          <polygon points="0,80 0,80 1440,20 1440,80" fill="rgb(236 253 245)" className="dark:hidden" />
          <polygon points="0,80 0,80 1440,20 1440,80" fill="rgb(3 7 18)" className="hidden dark:block" />
        </svg>
      </div>
    </section>
  )
}
