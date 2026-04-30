'use client'

import { useEffect, useState } from 'react'
import { 
  Server, Globe, Shield, Smartphone, Download, 
  Monitor, Share2, BookOpen, QrCode, CalendarDays,
  Award, Users, CreditCard, Bell, GraduationCap,
  FileText, ClipboardCheck, BarChart3, Settings
} from 'lucide-react'

const sections = [
  { id: 'stack', title: 'Stack Teknologi', icon: Server },
  { id: 'publik', title: 'Halaman Publik', icon: Globe },
  { id: 'super-admin', title: 'Super Admin & Admin', icon: Shield },
  { id: 'kepala-sekolah', title: 'Kepala Sekolah & Wakil', icon: Users },
  { id: 'staff-tu', title: 'Staff TU', icon: FileText },
  { id: 'staff-keuangan', title: 'Staff Keuangan', icon: CreditCard },
  { id: 'guru', title: 'Guru & Wali Kelas', icon: GraduationCap },
  { id: 'siswa', title: 'Siswa', icon: BookOpen },
  { id: 'orang-tua', title: 'Orang Tua', icon: Users },
  { id: 'notifikasi', title: 'Sistem Notifikasi', icon: Bell },
  { id: 'laporan', title: 'Laporan & Export', icon: BarChart3 },
  { id: 'keamanan', title: 'Keamanan & Akses', icon: Shield },
  { id: 'integrasi', title: 'Integrasi & Teknologi', icon: Settings },
]

export function FeaturesContent() {
  const [activeSection, setActiveSection] = useState('stack')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )

    sections.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="relative">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Spesifikasi dan Dokumentasi Aplikasi LMS
            </h1>
            <p className="text-emerald-100 text-lg">
              MAN 2 Kota Makassar
            </p>
          </div>
        </div>
      </div>

      {/* Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex gap-8">
          {/* Sidebar Navigation - Moved to Left */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20">
              <nav className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
                  Daftar Isi
                </p>
                {sections.map(({ id, title, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                      activeSection === id
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <article className="prose prose-emerald dark:prose-invert max-w-none">
              
              {/* Stack Teknologi */}
              <section id="stack" className="scroll-mt-20 mb-16">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <Server className="w-7 h-7 text-emerald-600" />
                  Stack Teknologi
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Backend</h3>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li><strong>Framework:</strong> NestJS (Node.js)</li>
                      <li><strong>Runtime:</strong> Fastify (High-performance HTTP server)</li>
                      <li><strong>Database:</strong> PostgreSQL dengan Prisma ORM</li>
                      <li><strong>Cache:</strong> Redis dengan IORedis client</li>
                      <li><strong>Queue:</strong> BullMQ untuk background jobs</li>
                      <li><strong>Storage:</strong> MinIO (S3-compatible object storage)</li>
                      <li><strong>Real-time:</strong> Socket.IO dengan Redis Adapter</li>
                      <li><strong>Authentication:</strong> Passport JWT + Local Strategy</li>
                      <li><strong>File Processing:</strong> Sharp (image), ExcelJS (spreadsheet), Puppeteer (PDF)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Frontend</h3>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li><strong>Framework:</strong> Next.js (App Router)</li>
                      <li><strong>UI Library:</strong> React + HeroUI</li>
                      <li><strong>Styling:</strong> Tailwind CSS + PostCSS</li>
                      <li><strong>State Management:</strong> Zustand</li>
                      <li><strong>Data Fetching:</strong> TanStack Query + Axios</li>
                      <li><strong>Forms:</strong> React Hook Form + Zod</li>
                      <li><strong>Real-time:</strong> Socket.IO Client</li>
                      <li><strong>Theme:</strong> next-themes (Dark mode support)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">DevOps & Infrastructure</h3>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li><strong>Containerization:</strong> Docker + Multi-stage builds</li>
                      <li><strong>Deployment:</strong> Coolify (Self-hosted PaaS)</li>
                      <li><strong>Server Location:</strong> Singapore</li>
                      <li><strong>Timezone:</strong> WITA (UTC+8) / Asia/Makassar</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Halaman Publik */}
              <section id="publik" className="scroll-mt-20 mb-16">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <Globe className="w-7 h-7 text-emerald-600" />
                  Halaman Publik (Tanpa Login)
                </h2>
                
                <div className="grid gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Website Informasi Sekolah</h4>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>• Beranda — Hero slider, profil singkat, berita terkini, galeri foto</li>
                      <li>• Profil Sekolah — Visi, misi, sejarah, struktur organisasi</li>
                      <li>• Berita & Artikel — Publikasi berita dan kegiatan sekolah</li>
                      <li>• Galeri Foto — Album foto kegiatan dan dokumentasi</li>
                      <li>• Jadwal Pelajaran Publik — Akses jadwal per kelas tanpa login</li>
                      <li>• Formulir Pendaftaran Ulang — Form online untuk siswa baru</li>
                      <li>• Verifikasi LCKH Guru — QR Code verification tanpa auth</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Super Admin & Admin */}
              <section id="super-admin" className="scroll-mt-20 mb-16">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <Shield className="w-7 h-7 text-emerald-600" />
                  Super Admin & Admin
                </h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Manajemen Pengguna</h4>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>• Kelola Pengguna — CRUD semua user (guru, siswa, staff, orang tua)</li>
                      <li>• Manajemen Role — Assign dan update role pengguna</li>
                      <li>• Broadcast Notifikasi — Kirim notifikasi massal ke role/kelas tertentu</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Manajemen Akademik</h4>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>• Tahun Ajaran & Semester — Kelola periode akademik</li>
                      <li>• Master Data — Tingkat kelas, mata pelajaran, guru mapel</li>
                      <li>• Kelas & Siswa — Kelola kelas dan enrollment siswa</li>
                      <li>• Jadwal Pelajaran — Buat jadwal mengajar (master jam, ruangan)</li>
                      <li>• Pendaftaran Ulang — Monitor dan verifikasi pendaftaran siswa baru</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Keuangan</h4>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>• Kategori Pembayaran — Kelola jenis tagihan (SPP, seragam, dll)</li>
                      <li>• Tagihan & Pembayaran — Generate dan kelola pembayaran siswa</li>
                      <li>• Laporan Keuangan — Dashboard dan export laporan</li>
                      <li>• Pengaturan Payment Gateway — Konfigurasi Midtrans</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Laporan & CMS</h4>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>• Report & EIS — Executive Information System dengan analytics</li>
                      <li>• Homepage CMS — Kelola konten website (slider, berita, galeri)</li>
                      <li>• Pengumuman — Buat dan kelola pengumuman dashboard</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Guru & Wali Kelas */}
              <section id="guru" className="scroll-mt-20 mb-16">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <GraduationCap className="w-7 h-7 text-emerald-600" />
                  Guru & Wali Kelas
                </h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Pembelajaran</h4>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>• <strong>Materi Pelajaran</strong> — Upload materi (TEXT, FILE, VIDEO, LINK)</li>
                      <li>• <strong>Tugas</strong> — 6 bentuk tugas termasuk Interactive Worksheet dengan 8 tipe widget</li>
                      <li>• <strong>Diskusi</strong> — Forum diskusi per mata pelajaran</li>
                      <li>• <strong>Penilaian</strong> — Input nilai (pengetahuan, keterampilan, dimensi profil)</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Administrasi</h4>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>• <strong>LCKH</strong> — Log Capaian Kinerja Harian dengan QR Code verification</li>
                      <li>• <strong>Dokumen Pengajaran</strong> — Upload RPP, silabus, modul ajar</li>
                      <li>• <strong>Absensi</strong> — 3 mode: QR Luring (GPS), QR WFH, Manual</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Wali Kelas (Tambahan)</h4>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>• Kelola siswa di kelas wali</li>
                      <li>• Approve/reject izin siswa</li>
                      <li>• Input catatan sikap dan prestasi</li>
                      <li>• Rekap absensi kelas</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Siswa */}
              <section id="siswa" className="scroll-mt-20 mb-16">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <BookOpen className="w-7 h-7 text-emerald-600" />
                  Siswa
                </h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Pembelajaran</h4>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>• Akses materi pembelajaran (TEXT, FILE, VIDEO, LINK)</li>
                      <li>• Kerjakan tugas dengan berbagai bentuk (worksheet interaktif, kuis, upload file)</li>
                      <li>• Draft auto-save untuk semua jenis tugas</li>
                      <li>• Ikut diskusi per mata pelajaran</li>
                      <li>• Lihat nilai dan feedback dari guru</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Operasional</h4>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>• <strong>Absensi</strong> — Scan QR Code (luring/WFH), lihat rekap kehadiran</li>
                      <li>• <strong>Catatan Sikap</strong> — Lihat catatan sikap pribadi</li>
                      <li>• <strong>Prestasi</strong> — Lihat dan input prestasi</li>
                      <li>• <strong>Ekstrakurikuler</strong> — Daftar dan lihat ekskul</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Keuangan</h4>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>• Lihat tagihan dan status pembayaran</li>
                      <li>• Bayar via Midtrans (VA, E-wallet, Kartu Kredit, Retail)</li>
                      <li>• Webhook auto-update status pembayaran</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Sistem Notifikasi */}
              <section id="notifikasi" className="scroll-mt-20 mb-16">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <Bell className="w-7 h-7 text-emerald-600" />
                  Sistem Notifikasi Otomatis
                </h2>
                
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm text-emerald-900 dark:text-emerald-300 mb-3">
                    Notifikasi real-time dikirim otomatis untuk event berikut:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-emerald-900 dark:text-emerald-300 mb-2 text-sm">Untuk Siswa & Orang Tua</h4>
                      <ul className="space-y-1 text-sm text-emerald-800 dark:text-emerald-400">
                        <li>• Tugas baru dari guru</li>
                        <li>• Tugas sudah dinilai</li>
                        <li>• Tagihan baru</li>
                        <li>• Pembayaran berhasil</li>
                        <li>• Status perizinan</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-900 dark:text-emerald-300 mb-2 text-sm">Untuk Guru & Manajemen</h4>
                      <ul className="space-y-1 text-sm text-emerald-800 dark:text-emerald-400">
                        <li>• Tugas dikumpulkan siswa</li>
                        <li>• Perizinan baru</li>
                        <li>• Dokumen pengajaran baru</li>
                        <li>• LCKH menunggu approval</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Keamanan */}
              <section id="keamanan" className="scroll-mt-20 mb-16">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <Shield className="w-7 h-7 text-emerald-600" />
                  Keamanan & Akses
                </h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Autentikasi</h4>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>• Login dengan email/username + password</li>
                      <li>• Token-based authentication (JWT)</li>
                      <li>• Role-Based Access Control (RBAC) — 10 role</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">File Storage</h4>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>• <strong>Public Bucket</strong> — Foto profil, logo (akses langsung)</li>
                      <li>• <strong>Private Bucket</strong> — Dokumen, materi, tugas (presigned URL)</li>
                      <li>• Upload validation — Tipe file dan ukuran maksimal</li>
                    </ul>
                  </div>
                </div>
              </section>

            </article>
          </div>
        </div>
      </div>
    </div>
  )
}
