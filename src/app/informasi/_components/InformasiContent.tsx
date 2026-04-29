'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  BookOpen, QrCode, CalendarDays, Award, Users, CreditCard,
  Bell, GraduationCap, ChevronRight, Menu, X, ExternalLink,
} from 'lucide-react'
import { getPublicFileUrl } from '@/lib/constants'

// ── Konten statis docs per fitur ──────────────────────────────────────────────
const DOCS: Record<string, { spek: string[]; tutorial: { step: string; desc: string }[] }> = {
  default: {
    spek: [
      'Tersedia untuk semua pengguna terdaftar',
      'Dapat diakses melalui browser dan perangkat mobile',
      'Data diperbarui secara real-time',
    ],
    tutorial: [
      { step: 'Login ke sistem', desc: 'Masuk menggunakan akun yang telah diberikan oleh admin madrasah.' },
      { step: 'Navigasi ke fitur', desc: 'Pilih menu yang sesuai dari sidebar dashboard.' },
      { step: 'Gunakan fitur', desc: 'Ikuti petunjuk yang tersedia di setiap halaman.' },
    ],
  },
  pembelajaran: {
    spek: [
      'Upload materi dalam format PDF, Word, Video, dan gambar',
      'Sistem komentar dan diskusi per materi',
      'Tracking progress baca siswa secara otomatis',
      'Notifikasi ke siswa saat materi baru diterbitkan',
      'Pengelompokan materi per mata pelajaran dan semester',
    ],
    tutorial: [
      { step: 'Buka menu Pembelajaran', desc: 'Dari dashboard guru, pilih menu Pembelajaran > Materi.' },
      { step: 'Buat materi baru', desc: 'Klik tombol "+ Tambah Materi", isi judul, deskripsi, dan upload file.' },
      { step: 'Atur visibilitas', desc: 'Pilih status "Published" agar siswa dapat mengakses materi.' },
      { step: 'Pantau progress', desc: 'Lihat berapa siswa yang sudah membaca di halaman detail materi.' },
    ],
  },
  absensi: {
    spek: [
      'Absensi berbasis QR Code yang di-generate per sesi',
      'QR Code berlaku selama sesi kelas berlangsung',
      'Rekap kehadiran otomatis per bulan dan semester',
      'Status: Hadir, Terlambat, Izin, Sakit, Alpha',
      'Export rekap ke Excel',
    ],
    tutorial: [
      { step: 'Buka sesi absensi', desc: 'Guru membuka sesi dari menu Absensi > Buka Sesi, lalu tampilkan QR Code.' },
      { step: 'Siswa scan QR', desc: 'Siswa membuka aplikasi, pilih Absensi, dan scan QR Code yang ditampilkan guru.' },
      { step: 'Konfirmasi kehadiran', desc: 'Sistem otomatis mencatat waktu dan status kehadiran siswa.' },
      { step: 'Lihat rekap', desc: 'Admin dan guru dapat melihat rekap di menu Laporan > Kehadiran.' },
    ],
  },
  jadwal: {
    spek: [
      'Jadwal pelajaran per kelas dan per guru',
      'Tampilan mingguan dan harian',
      'Informasi ruangan dan jam pelajaran',
      'Jadwal publik dapat diakses tanpa login',
      'Notifikasi perubahan jadwal',
    ],
    tutorial: [
      { step: 'Lihat jadwal kelas', desc: 'Buka menu Jadwal dari dashboard, pilih kelas dan semester.' },
      { step: 'Filter per guru', desc: 'Gunakan filter "Guru" untuk melihat jadwal mengajar spesifik.' },
      { step: 'Jadwal publik', desc: 'Akses halaman /jadwal-publik tanpa perlu login untuk melihat jadwal umum.' },
    ],
  },
  tugas: {
    spek: [
      'Pembuatan tugas dengan deadline dan bobot nilai',
      'Tipe tugas: Essay, File Upload, dan Quiz interaktif',
      'Sistem penilaian dan feedback langsung',
      'Notifikasi deadline ke siswa',
      'Rekap pengumpulan dan nilai per kelas',
    ],
    tutorial: [
      { step: 'Buat tugas baru', desc: 'Guru membuka menu Tugas > Buat Tugas, isi detail dan pilih tipe tugas.' },
      { step: 'Atur deadline', desc: 'Tentukan tanggal mulai dan batas pengumpulan.' },
      { step: 'Siswa mengumpulkan', desc: 'Siswa membuka tugas dari dashboard, kerjakan dan submit sebelum deadline.' },
      { step: 'Nilai tugas', desc: 'Guru membuka daftar pengumpulan, beri nilai dan feedback per siswa.' },
    ],
  },
  penilaian: {
    spek: [
      'Input nilai harian, UTS, dan UAS',
      'Perhitungan nilai akhir otomatis berdasarkan bobot',
      'Rekap nilai per kelas dan per mata pelajaran',
      'Export rapor ke PDF dan Excel',
      'Notifikasi nilai ke siswa dan orang tua',
    ],
    tutorial: [
      { step: 'Buka menu Penilaian', desc: 'Dari dashboard guru, pilih Penilaian > Input Nilai.' },
      { step: 'Pilih kelas dan mapel', desc: 'Tentukan kelas, mata pelajaran, dan jenis penilaian.' },
      { step: 'Input nilai', desc: 'Masukkan nilai untuk setiap siswa, sistem otomatis hitung rata-rata.' },
      { step: 'Publikasikan', desc: 'Klik "Simpan & Publikasikan" agar siswa dapat melihat nilainya.' },
    ],
  },
  notifikasi: {
    spek: [
      'Notifikasi real-time via browser push notification',
      'Kategori: Tugas baru, Nilai, Absensi, Pengumuman',
      'Riwayat notifikasi tersimpan 30 hari',
      'Pengaturan preferensi notifikasi per pengguna',
    ],
    tutorial: [
      { step: 'Aktifkan notifikasi', desc: 'Saat pertama login, izinkan browser untuk mengirim notifikasi.' },
      { step: 'Kelola preferensi', desc: 'Buka Pengaturan > Notifikasi untuk mengatur jenis notifikasi yang diterima.' },
      { step: 'Lihat riwayat', desc: 'Klik ikon lonceng di navbar untuk melihat semua notifikasi.' },
    ],
  },
}

const FALLBACK_ICONS: Record<string, React.ReactNode> = {
  pembelajaran: <BookOpen size={20} strokeWidth={1.5} />,
  absensi:      <QrCode size={20} strokeWidth={1.5} />,
  jadwal:       <CalendarDays size={20} strokeWidth={1.5} />,
  penilaian:    <Award size={20} strokeWidth={1.5} />,
  tugas:        <Users size={20} strokeWidth={1.5} />,
  keuangan:     <CreditCard size={20} strokeWidth={1.5} />,
  notifikasi:   <Bell size={20} strokeWidth={1.5} />,
  ekskul:       <GraduationCap size={20} strokeWidth={1.5} />,
}

function getDocsKey(judul: string): string {
  const lower = judul.toLowerCase()
  if (lower.includes('pembelajaran') || lower.includes('materi')) return 'pembelajaran'
  if (lower.includes('absensi') || lower.includes('qr'))           return 'absensi'
  if (lower.includes('jadwal'))                                     return 'jadwal'
  if (lower.includes('tugas') || lower.includes('quiz'))           return 'tugas'
  if (lower.includes('nilai') || lower.includes('penilaian'))      return 'penilaian'
  if (lower.includes('notifikasi'))                                 return 'notifikasi'
  return 'default'
}

function getIcon(judul: string, fotoUrl: string | null) {
  if (fotoUrl) {
    return <img src={getPublicFileUrl(fotoUrl)} alt={judul} className="w-5 h-5 object-contain" />
  }
  const key = getDocsKey(judul)
  return FALLBACK_ICONS[key] ?? <BookOpen size={20} strokeWidth={1.5} />
}

interface Props { fitur: any[] }

export function InformasiContent({ fitur }: Props) {
  const [activeId,    setActiveId]    = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const items = fitur.filter((f) => f.isActive)

  // Set default active
  useEffect(() => {
    if (items.length > 0 && !activeId) setActiveId(items[0].id)
  }, [items, activeId])

  const active = items.find((f) => f.id === activeId) ?? items[0]
  const docs   = active ? DOCS[getDocsKey(active.judul)] ?? DOCS.default : null

  const handleSelect = (id: string) => {
    setActiveId(id)
    setSidebarOpen(false)
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 pt-24 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs text-emerald-300 uppercase tracking-widest mb-2">Dokumentasi</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Informasi & Panduan Aplikasi</h1>
          <p className="text-white/60 mt-2 text-sm max-w-xl">
            Referensi lengkap fitur, spesifikasi, dan tutorial penggunaan sistem LMS.
          </p>
        </div>
      </div>

      {/* Mobile sidebar toggle */}
      <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {active?.judul ?? 'Pilih Fitur'}
        </span>
        <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex gap-8 relative">

        {/* Sidebar */}
        <aside className={`
          lg:w-64 lg:shrink-0 lg:block
          ${sidebarOpen ? 'block absolute left-0 right-0 top-0 z-20 bg-white dark:bg-gray-950 px-4 pt-4 pb-6 shadow-xl' : 'hidden'}
        `}>
          <div className="lg:sticky lg:top-24 space-y-1">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium px-3 mb-3">Fitur Aplikasi</p>
            {items.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleSelect(f.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  activeId === f.id
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <span className={`shrink-0 ${activeId === f.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                  {getIcon(f.judul, f.fotoUrl)}
                </span>
                <span className="text-sm font-medium truncate">{f.judul}</span>
                {activeId === f.id && <ChevronRight size={14} className="ml-auto shrink-0 text-emerald-500" />}
              </button>
            ))}

            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium px-3 mb-3">Tautan</p>
              <Link href="/jadwal-publik"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <CalendarDays size={16} className="text-gray-400" />
                Jadwal Publik
                <ExternalLink size={12} className="ml-auto text-gray-300" />
              </Link>
              <Link href="/login"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <GraduationCap size={16} className="text-gray-400" />
                Masuk ke LMS
                <ExternalLink size={12} className="ml-auto text-gray-300" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Konten */}
        <main ref={contentRef} className="flex-1 min-w-0">
          {active && docs ? (
            <div className="space-y-8">
              {/* Header fitur */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  {getIcon(active.judul, active.fotoUrl)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{active.judul}</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{active.deskripsi}</p>
                </div>
              </div>

              {/* Spesifikasi */}
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-emerald-500 rounded-full inline-block" />
                  Spesifikasi & Kemampuan
                </h3>
                <ul className="space-y-2">
                  {docs.spek.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tutorial */}
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-emerald-500 rounded-full inline-block" />
                  Cara Penggunaan
                </h3>
                <div className="space-y-3">
                  {docs.tutorial.map((t, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.step}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 p-6 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Siap menggunakan {active.judul}?</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Login ke sistem untuk mulai menggunakan fitur ini.</p>
                </div>
                <Link href="/login"
                  className="shrink-0 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">
                  Masuk ke LMS
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">Pilih fitur dari menu di sebelah kiri.</div>
          )}
        </main>
      </div>
    </>
  )
}
