'use client'

import Link from 'next/link'
import { Sparkles, BookOpen, QrCode, CalendarDays, Award, Users, CreditCard, Bell, GraduationCap } from 'lucide-react'
import { getPublicFileUrl } from '@/lib/constants'

const BANNER_URL = 'https://storagelms.man2kotamakassar.sch.id/static-assets/static_login_image.webp'

const FALLBACK_ICONS = [
  BookOpen, QrCode, CalendarDays,
  Award, Users, CreditCard,
]

interface FiturItem {
  id: string; judul: string; deskripsi: string
  fotoUrl?: string | null; urutan: number; isActive: boolean
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function FiturSkeleton() {
  return (
    <section className="relative w-full overflow-hidden bg-white dark:bg-gray-950">
      <div className="relative min-h-[560px] flex flex-col lg:flex-row">
        <div className="lg:w-1/2 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-8 lg:p-12 space-y-4">
          <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
          <div className="h-8 w-40 bg-white/10 rounded animate-pulse" />
          <div className="space-y-3 mt-6">
            {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />)}
          </div>
        </div>
        <div className="lg:w-1/2 bg-gray-100 dark:bg-gray-800 p-8 lg:p-12 space-y-4">
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="space-y-3 mt-6">
            {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />)}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
function FiturCard({ item, index, variant }: {
  item: FiturItem; index: number; variant: 'dark' | 'light'
}) {
  const Icon   = FALLBACK_ICONS[index % FALLBACK_ICONS.length]
  const imgUrl = item.fotoUrl ? getPublicFileUrl(item.fotoUrl) : null

  return (
    <div className={`
      group flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300
      hover:-translate-y-0.5 hover:shadow-lg
      ${variant === 'dark'
        ? 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:shadow-black/20'
        : 'border-white/15 bg-white/10 hover:bg-white/20 hover:border-white/25 hover:shadow-black/20'
      }
    `}>
      <div className={`
        w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110
        ${variant === 'dark'
          ? 'bg-emerald-500/20 border border-emerald-400/20'
          : 'bg-white/15 border border-white/20'
        }
      `}>
        {imgUrl ? (
          <img src={imgUrl} alt={item.judul} className="w-6 h-6 object-contain" />
        ) : (
          <Icon size={20} strokeWidth={1.5} className="text-white/80" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold mb-1.5 leading-tight text-white">
          {item.judul}
        </h3>
        <p className="text-sm leading-relaxed line-clamp-2 text-white/55">
          {item.deskripsi}
        </p>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function FiturSection({ fitur }: { fitur: FiturItem[] }) {
  const activeItems = fitur.filter((f) => f.isActive).slice(0, 6)

  const defaultFitur: FiturItem[] = [
    { id: 'd1', judul: 'Pembelajaran Digital',    deskripsi: 'Akses materi, tugas, dan nilai secara online kapan saja dan di mana saja.',          fotoUrl: null, urutan: 1, isActive: true },
    { id: 'd2', judul: 'Absensi QR Code',          deskripsi: 'Sistem absensi digital berbasis QR Code yang akurat dan transparan.',                  fotoUrl: null, urutan: 2, isActive: true },
    { id: 'd3', judul: 'Jadwal Pelajaran',          deskripsi: 'Lihat jadwal harian lengkap dengan informasi guru dan ruangan kelas.',                 fotoUrl: null, urutan: 3, isActive: true },
    { id: 'd4', judul: 'Penilaian Terintegrasi',   deskripsi: 'Sistem penilaian komprehensif dari nilai harian, UTS, hingga UAS.',                    fotoUrl: null, urutan: 4, isActive: true },
    { id: 'd5', judul: 'Ekstrakurikuler',           deskripsi: 'Informasi lengkap dan pendaftaran kegiatan ekstrakurikuler secara online.',            fotoUrl: null, urutan: 5, isActive: true },
    { id: 'd6', judul: 'Notifikasi Real-time',      deskripsi: 'Informasi penting langsung ke orang tua dan siswa melalui notifikasi instan.',         fotoUrl: null, urutan: 6, isActive: true },
  ]

  const items      = activeItems.length >= 3 ? activeItems : defaultFitur
  const leftItems  = items.slice(0, 3)
  const rightItems = items.slice(3, 6)

  return (
    <section className="relative w-full overflow-hidden bg-white dark:bg-gray-950">

      <div className="relative flex flex-col lg:flex-row items-stretch">

        {/* Kolom Kiri — Emerald gelap */}
        <div className="relative lg:w-1/2 min-h-[400px] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)' }}
          />
          <div className="relative z-10 p-8 lg:p-12 flex flex-col justify-center h-full">
            <div className="mb-8">
              <p className="text-[11px] text-emerald-400/70 uppercase tracking-widest mb-1.5">Platform LMS</p>
              <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight">Fitur Unggulan</h2>
              <p className="text-sm text-white/50 mt-2">Solusi digital terintegrasi untuk madrasah modern</p>
            </div>
            <div className="space-y-3 pr-8">
              {leftItems.map((item, i) => (
                <FiturCard key={item.id} item={item} index={i} variant="dark" />
              ))}
            </div>
          </div>
        </div>

        {/* Kolom Kanan — Background image */}
        <div className="relative lg:w-1/2 min-h-[400px] overflow-hidden">
          <div className="absolute inset-0">
            <img src={BANNER_URL} alt="Fitur" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-teal-950/85 via-emerald-900/75 to-emerald-800/80" />
          </div>
          <div className="relative z-10 p-8 lg:p-12 flex flex-col justify-center h-full">
            <div className="mb-8 lg:pl-8">
              <p className="text-[11px] text-white/50 uppercase tracking-widest mb-1.5">Lebih Banyak</p>
              <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight">Kemampuan Sistem</h2>
            </div>
            <div className="space-y-3 lg:pl-8">
              {rightItems.map((item, i) => (
                <FiturCard key={item.id} item={item} index={i + 3} variant="light" />
              ))}
            </div>
          </div>
        </div>

        {/* Diagonal divider — garis tipis emerald soft */}
        <div className="absolute inset-0 hidden lg:block pointer-events-none z-20">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <polygon
              points="49,0 51,0 50,100 48,100"
              fill="rgb(236 253 245)"
            />
          </svg>
        </div>
      </div>

      {/* CTA — tanpa background terpisah, menyatu dengan section */}
      <div className="py-8 text-center">
        <Link
          href="/informasi"
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group"
        >
          <Sparkles size={14} />
          Lihat Info Aplikasi Selengkapnya
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </section>
  )
}
