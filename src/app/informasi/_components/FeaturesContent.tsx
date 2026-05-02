
'use client'

import { useEffect, useState } from 'react'
import {
  Server, Globe, Shield, BookOpen, QrCode,
  Award, Users, CreditCard, Bell, GraduationCap,
  FileText, ClipboardCheck, BarChart3, Settings,
  Brain, Layers, Zap, Database, Lock, Cpu,
  MonitorSmartphone, GitBranch, Calendar, MessageSquare,
  CheckSquare, ScanLine, Wifi, ChevronRight,
} from 'lucide-react'
import { PlaceholderImage } from '@/components/public/PlaceholderImage'
import { cn } from '@/lib/utils'

const sections = [
  { id: 'stack',        title: 'Stack Teknologi',         icon: Server },
  { id: 'unggulan',     title: 'Fitur Unggulan',          icon: Zap },
  { id: 'rag-ai',       title: 'RAG-AI Assistant',        icon: Brain },
  { id: 'absensi',      title: 'Absensi Realtime',        icon: ScanLine },
  { id: 'worksheet',    title: 'Worksheet Interaktif',    icon: CheckSquare },
  { id: 'publik',       title: 'Halaman Publik',          icon: Globe },
  { id: 'super-admin',  title: 'Super Admin & Admin',     icon: Shield },
  { id: 'kepala',       title: 'Kepala Sekolah & Wakil',  icon: Users },
  { id: 'staff-tu',     title: 'Staff TU',                icon: FileText },
  { id: 'keuangan',     title: 'Staff Keuangan',          icon: CreditCard },
  { id: 'guru',         title: 'Guru & Wali Kelas',       icon: GraduationCap },
  { id: 'siswa',        title: 'Siswa',                   icon: BookOpen },
  { id: 'orang-tua',    title: 'Orang Tua',               icon: Users },
  { id: 'notifikasi',   title: 'Sistem Notifikasi',       icon: Bell },
  { id: 'laporan',      title: 'Laporan & Analitik',      icon: BarChart3 },
  { id: 'keamanan',     title: 'Keamanan & Akses',        icon: Lock },
]

function SectionHeading({ id, icon: Icon, title, subtitle }: {
  id?: string
  icon: React.ElementType
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">{title}</h2>
      </div>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400 ml-12 leading-relaxed">{subtitle}</p>
      )}
      <div className="mt-4 h-px bg-gradient-to-r from-emerald-200 via-emerald-100 to-transparent dark:from-emerald-800 dark:via-emerald-900" />
    </div>
  )
}

function InfoCard({ title, items, accent = false }: {
  title: string
  items: string[]
  accent?: boolean
}) {
  return (
    <div className={cn(
      'p-5 rounded-xl border',
      accent
        ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/60'
        : 'bg-gray-50/60 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800/60'
    )}>
      <h4 className={cn(
        'text-sm font-semibold mb-3',
        accent ? 'text-emerald-800 dark:text-emerald-300' : 'text-gray-900 dark:text-white'
      )}>{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className={cn(
            'text-sm flex items-start gap-2',
            accent ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'
          )}>
            <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" />
            <span dangerouslySetInnerHTML={{ __html: item }} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function FeatureBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
      {label}
    </span>
  )
}

function StepFlow({ steps }: { steps: { num: string; title: string; desc: string }[] }) {
  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-4 items-start">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            {step.num}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{step.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function FeaturesContent() {
  const [activeSection, setActiveSection] = useState('stack')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const offset = 80
      window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - offset, behavior: 'smooth' })
    }
  }

  return (
    <div className="relative">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-teal-400 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-700/50 text-emerald-300 text-xs font-medium mb-5">
              <Cpu className="w-3.5 h-3.5" />
              Dokumentasi Sistem LMS
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
              Platform Manajemen Pembelajaran<br />
              <span className="text-emerald-300">MAN 2 Kota Makassar</span>
            </h1>
            <p className="text-emerald-200 text-base leading-relaxed max-w-2xl">
              Sistem informasi akademik terpadu yang mengelola seluruh proses pembelajaran, administrasi, dan komunikasi sekolah dalam satu platform terintegrasi.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {['45+ Modul', '10 Role Pengguna', 'Realtime Socket.IO', 'AI-Powered', 'PWA Ready'].map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex gap-8">

          {/* Sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-20">
              <nav className="space-y-0.5">
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-3">
                  Daftar Isi
                </p>
                {sections.map(({ id, title, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl transition-all text-left',
                      activeSection === id
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-200'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate text-xs">{title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0 space-y-24">

            {/* ── STACK TEKNOLOGI ── */}
            <section id="stack" className="scroll-mt-28">
              <SectionHeading
                icon={Server}
                title="Stack Teknologi"
                subtitle="Infrastruktur modern yang dibangun untuk performa, skalabilitas, dan keandalan tinggi."
              />
              <div className="p-5 rounded-xl border border-gray-100 dark:border-gray-800/60 bg-gray-50/60 dark:bg-gray-900/40">
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1.5">
                  {[
                    ['Backend Framework', 'NestJS (Node.js) + Fastify'],
                    ['Database', 'PostgreSQL + Prisma ORM'],
                    ['Cache & Queue', 'Redis + BullMQ'],
                    ['Object Storage', 'MinIO (S3-compatible)'],
                    ['Realtime', 'Socket.IO + Redis Adapter'],
                    ['Autentikasi', 'Passport JWT + Local Strategy'],
                    ['Frontend Framework', 'Next.js App Router'],
                    ['UI Library', 'React + HeroUI + Tailwind CSS'],
                    ['State Management', 'Zustand + TanStack Query'],
                    ['Form Validation', 'React Hook Form + Zod'],
                    ['File Processing', 'Sharp + ExcelJS + Puppeteer'],
                    ['Payment Gateway', 'Midtrans (VA, E-wallet, Kartu Kredit)'],
                    ['Containerization', 'Docker multi-stage build'],
                    ['Deployment', 'Coolify (Self-hosted PaaS), Singapore'],
                    ['AI Providers', 'Gemini, OpenAI, Anthropic, Cohere, OpenRouter'],
                    ['Timezone', 'WITA (UTC+8) / Asia/Makassar'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-baseline gap-2 py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-36 shrink-0">{label}</span>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── FITUR UNGGULAN ── */}
            <section id="unggulan" className="scroll-mt-28">
              <SectionHeading
                icon={Zap}
                title="Tiga Fitur Unggulan"
                subtitle="Inovasi teknologi yang membedakan platform ini dari sistem manajemen pembelajaran konvensional."
              />
              <div className="grid md:grid-cols-3 gap-5">
                {[
                  {
                    icon: Brain,
                    title: 'RAG-AI Assistant',
                    desc: 'Generate RPP, materi, dan tugas secara otomatis menggunakan AI dengan konteks kurikulum sekolah.',
                    tags: ['Gemini', 'OpenAI', 'Anthropic'],
                    color: 'purple',
                  },
                  {
                    icon: ScanLine,
                    title: 'Absensi Realtime',
                    desc: 'Tiga mode absensi — QR Luring berbasis GPS, QR WFH, dan manual — dengan pembaruan status secara langsung.',
                    tags: ['Socket.IO', 'Redis', 'GPS'],
                    color: 'blue',
                  },
                  {
                    icon: CheckSquare,
                    title: 'Worksheet Interaktif',
                    desc: 'Builder visual untuk membuat lembar kerja digital dengan 8 tipe widget, auto-grading, dan penilaian manual.',
                    tags: ['8 Widget', 'Auto-grade', 'Visual Builder'],
                    color: 'emerald',
                  },
                ].map((f) => (
                  <div key={f.title} className={cn(
                    'p-5 rounded-2xl border',
                    f.color === 'purple' ? 'bg-purple-50/60 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/40' :
                    f.color === 'blue'   ? 'bg-blue-50/60 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/40' :
                                           'bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/40'
                  )}>
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center mb-4',
                      f.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/40' :
                      f.color === 'blue'   ? 'bg-blue-100 dark:bg-blue-900/40' :
                                             'bg-emerald-100 dark:bg-emerald-900/40'
                    )}>
                      <f.icon className={cn(
                        'w-5 h-5',
                        f.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                        f.color === 'blue'   ? 'text-blue-600 dark:text-blue-400' :
                                               'text-emerald-600 dark:text-emerald-400'
                      )} />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">{f.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{f.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {f.tags.map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── RAG-AI ── */}
            <section id="rag-ai" className="scroll-mt-28">
              <SectionHeading
                icon={Brain}
                title="RAG-AI Assistant — RPP, Materi & Tugas"
                subtitle="Sistem generasi konten berbasis AI yang menggunakan konteks kurikulum dan dokumen pengajaran sekolah untuk menghasilkan konten yang relevan dan terstruktur."
              />

              {/* Screenshot placeholder */}
              <div className="mb-8 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800/60">
                <PlaceholderImage
                  variant="ai"
                  label="Screenshot: Antarmuka AI Generator — Pilih jenis konten, provider AI, dan parameter generate"
                  className="w-full h-64"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-5 mb-6">
                <InfoCard
                  title="Konten yang Dapat Digenerate"
                  items={[
                    '<strong>RPP (Rencana Pelaksanaan Pembelajaran)</strong> — Lengkap dengan tujuan, kegiatan, dan penilaian',
                    '<strong>Materi Pelajaran</strong> — Konten teks terstruktur sesuai KD dan indikator',
                    '<strong>Tugas & Soal</strong> — Berbagai bentuk soal (pilihan ganda, esai, isian)',
                  ]}
                />
                <InfoCard
                  title="Provider AI yang Didukung"
                  items={[
                    '<strong>Google Gemini</strong> — Model generasi terbaru dari Google',
                    '<strong>OpenAI GPT</strong> — Model GPT-4 dan variannya',
                    '<strong>Anthropic Claude</strong> — Model Claude dengan konteks panjang',
                    '<strong>Cohere</strong> — Model bahasa untuk konten akademik',
                    '<strong>OpenRouter</strong> — Akses multi-model via satu endpoint',
                  ]}
                />
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Alur Penggunaan RAG-AI</h3>
                <StepFlow steps={[
                  { num: '1', title: 'Pilih Jenis Konten', desc: 'Guru memilih antara RPP, Materi Pelajaran, atau Tugas yang ingin digenerate.' },
                  { num: '2', title: 'Tentukan Konteks', desc: 'Sistem mengambil konteks dari kurikulum, mata pelajaran, tingkat kelas, dan semester yang aktif.' },
                  { num: '3', title: 'Tambahkan Instruksi', desc: 'Guru dapat menambahkan prompt tambahan untuk menyesuaikan output sesuai kebutuhan spesifik.' },
                  { num: '4', title: 'Proses Asinkron', desc: 'Job dikirim ke BullMQ queue. Respons awal diterima dalam kurang dari 2 detik, proses berjalan di background.' },
                  { num: '5', title: 'Review Draft', desc: 'Hasil generate tersimpan sebagai Draft AI dengan status PENDING → PROCESSING → COMPLETED.' },
                  { num: '6', title: 'Simpan atau Edit', desc: 'Guru mereview, mengedit jika perlu, lalu menyimpan langsung ke RPP, Materi, atau Tugas.' },
                ]} />
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <InfoCard
                  title="Konteks RAG yang Digunakan"
                  items={[
                    'Dokumen kurikulum yang diunggah admin',
                    'Silabus dan modul ajar per mata pelajaran',
                    'Capaian Pembelajaran (CP) dan Alur Tujuan Pembelajaran (ATP)',
                    'Riwayat RPP sebelumnya sebagai referensi',
                  ]}
                  accent
                />
                <InfoCard
                  title="Manajemen Draft AI"
                  items={[
                    'Batas maksimal 3 job concurrent per guru (dapat dikonfigurasi)',
                    'State machine: PENDING → PROCESSING → COMPLETED → SAVED',
                    'Draft tersimpan minimal 7 hari sebelum dapat dihapus',
                    'Notifikasi otomatis saat generate selesai',
                  ]}
                  accent
                />
              </div>
            </section>

            {/* ── ABSENSI REALTIME ── */}
            <section id="absensi" className="scroll-mt-28">
              <SectionHeading
                icon={ScanLine}
                title="Absensi Realtime Multimode"
                subtitle="Sistem kehadiran berbasis sesi dengan tiga mode operasi, pembaruan status langsung via Socket.IO, dan validasi GPS untuk memastikan kehadiran fisik."
              />

              {/* Screenshot placeholder */}
              <div className="mb-8 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800/60">
                <PlaceholderImage
                  variant="qr"
                  label="Screenshot: Tampilan QR Code sesi absensi — Guru membuka sesi, siswa scan QR untuk hadir"
                  className="w-full h-64"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {[
                  {
                    icon: QrCode,
                    title: 'QR Luring (GPS)',
                    desc: 'Siswa scan QR Code yang ditampilkan guru. Sistem memvalidasi koordinat GPS siswa dalam radius yang ditentukan.',
                    tags: ['GPS Validation', 'Radius Check'],
                  },
                  {
                    icon: Wifi,
                    title: 'QR WFH',
                    desc: 'Mode pembelajaran jarak jauh. Siswa scan QR tanpa validasi GPS, cocok untuk kelas daring atau hybrid.',
                    tags: ['Remote Learning', 'No GPS'],
                  },
                  {
                    icon: ClipboardCheck,
                    title: 'Manual',
                    desc: 'Guru menginput kehadiran secara manual per siswa atau bulk sekaligus. Tersedia override status untuk koreksi.',
                    tags: ['Bulk Entry', 'Override'],
                  },
                ].map((mode) => (
                  <div key={mode.title} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800/60 bg-gray-50/60 dark:bg-gray-900/40">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                      <mode.icon className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">{mode.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{mode.desc}</p>
                    <div className="flex flex-wrap gap-1">
                      {mode.tags.map(t => (
                        <FeatureBadge key={t} label={t} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Alur Absensi QR Luring</h3>
                <StepFlow steps={[
                  { num: '1', title: 'Guru Membuka Sesi', desc: 'Guru memilih jadwal pelajaran hari ini, menentukan durasi, mode, dan radius GPS.' },
                  { num: '2', title: 'Token Sesi Dibuat', desc: 'Sistem membuat token unik dan menyimpan data sesi di Redis dengan TTL sesuai durasi.' },
                  { num: '3', title: 'QR Code Ditampilkan', desc: 'QR Code berisi token sesi ditampilkan di layar guru. Siswa scan menggunakan aplikasi.' },
                  { num: '4', title: 'Validasi GPS', desc: 'Sistem memverifikasi koordinat GPS siswa terhadap koordinat guru dalam radius yang ditentukan.' },
                  { num: '5', title: 'Update Realtime', desc: 'Status kehadiran diperbarui langsung via Socket.IO. Guru melihat daftar hadir bertambah secara live.' },
                  { num: '6', title: 'Sesi Ditutup & Disimpan', desc: 'Setelah sesi berakhir, data absensi disimpan permanen ke database dan tersedia untuk laporan.' },
                ]} />
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <InfoCard
                  title="Fitur Manajemen Sesi"
                  items={[
                    'Perpanjang durasi sesi yang sedang berjalan',
                    'Override status kehadiran individual',
                    'Bulk override untuk seluruh kelas',
                    'Satu jadwal hanya bisa memiliki satu sesi aktif per hari',
                    'Notifikasi otomatis ke orang tua saat siswa tidak hadir',
                  ]}
                />
                <InfoCard
                  title="Laporan & Export"
                  items={[
                    'Rekap kehadiran per siswa, per mata pelajaran, per periode',
                    'Export PDF format matriks (siswa x tanggal)',
                    'Statistik persentase kehadiran',
                    'Filter berdasarkan kelas, semester, dan rentang tanggal',
                    'Integrasi dengan laporan akademik semester',
                  ]}
                />
              </div>
            </section>

            {/* ── WORKSHEET INTERAKTIF ── */}
            <section id="worksheet" className="scroll-mt-28">
              <SectionHeading
                icon={CheckSquare}
                title="Tugas Worksheet Interaktif"
                subtitle="Builder visual berbasis halaman untuk membuat lembar kerja digital yang kaya interaksi, dengan sistem penilaian otomatis dan manual terintegrasi."
              />

              {/* Screenshot placeholder — builder */}
              <div className="mb-5 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800/60">
                <PlaceholderImage
                  variant="worksheet"
                  label="Screenshot: Worksheet Builder — Guru mendesain halaman worksheet dengan drag-and-drop widget di atas gambar latar"
                  className="w-full h-64"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-5 mb-6">
                {/* Screenshot placeholder — player */}
                <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800/60">
                  <PlaceholderImage
                    variant="worksheet"
                    label="Screenshot: Worksheet Player — Tampilan siswa mengerjakan worksheet interaktif"
                    className="w-full h-48"
                  />
                </div>
                {/* Screenshot placeholder — grading */}
                <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800/60">
                  <PlaceholderImage
                    variant="worksheet"
                    label="Screenshot: Grading View — Guru menilai jawaban esai dan gambar dari siswa"
                    className="w-full h-48"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5 mb-6">
                <InfoCard
                  title="8 Tipe Widget yang Tersedia"
                  items={[
                    '<strong>Multiple Choice</strong> — Pilihan ganda, auto-graded',
                    '<strong>Dropdown</strong> — Pilihan dari daftar, auto-graded',
                    '<strong>Fill in the Blank</strong> — Isian singkat, auto-graded',
                    '<strong>Number Input</strong> — Input angka dengan toleransi, auto-graded',
                    '<strong>Matching</strong> — Pasangkan kolom, auto-graded',
                    '<strong>Text Input</strong> — Jawaban teks panjang, manual-graded',
                    '<strong>Drawing Area</strong> — Area menggambar/sketsa, manual-graded',
                    '<strong>File Upload</strong> — Upload dokumen/gambar',
                  ]}
                />
                <InfoCard
                  title="Fitur Builder & Player"
                  items={[
                    'Worksheet berbasis halaman — setiap halaman memiliki gambar latar',
                    'Widget diposisikan dengan koordinat persentase (responsif)',
                    'Auto-save draft saat siswa mengerjakan',
                    'Navigasi antar halaman dengan progress indicator',
                    'Batas ukuran jawaban 1 MB per widget (mendukung drawing JSON kompleks)',
                    'Validasi tipe dan ukuran sebelum submit',
                  ]}
                />
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Alur Pembuatan dan Pengerjaan Worksheet</h3>
                <StepFlow steps={[
                  { num: '1', title: 'Guru Membuat Tugas', desc: 'Guru membuat tugas dengan bentuk "Interactive Worksheet" dari menu Tugas.' },
                  { num: '2', title: 'Desain Halaman', desc: 'Guru membuka Worksheet Builder, mengunggah gambar latar untuk setiap halaman.' },
                  { num: '3', title: 'Tambah Widget', desc: 'Guru menambahkan widget (soal) di atas gambar, mengatur posisi, ukuran, dan konfigurasi jawaban benar.' },
                  { num: '4', title: 'Siswa Mengerjakan', desc: 'Siswa membuka tugas, mengerjakan worksheet halaman per halaman. Draft tersimpan otomatis.' },
                  { num: '5', title: 'Submit & Auto-grade', desc: 'Setelah submit, sistem langsung menghitung nilai untuk widget objektif (pilihan ganda, isian, dll).' },
                  { num: '6', title: 'Penilaian Manual', desc: 'Guru menilai widget subjektif (esai, gambar) melalui antarmuka grading yang menampilkan jawaban siswa.' },
                ]} />
              </div>

              <InfoCard
                title="Sistem Penilaian Terintegrasi"
                items={[
                  'Auto-grading untuk: Multiple Choice, Dropdown, Fill in Blank, Number Input, Matching',
                  'Manual grading untuk: Text Input, Drawing Area',
                  'Nilai akhir dihitung dari kombinasi auto dan manual grade',
                  'Hasil penilaian tersinkron ke modul Penilaian (nilai pengetahuan/keterampilan)',
                  'Guru dapat melihat distribusi jawaban seluruh kelas per widget',
                ]}
                accent
              />
            </section>

            {/* ── HALAMAN PUBLIK ── */}
            <section id="publik" className="scroll-mt-28">
              <SectionHeading
                icon={Globe}
                title="Halaman Publik"
                subtitle="Akses tanpa login untuk informasi sekolah, jadwal, dan pendaftaran."
              />
              <div className="grid md:grid-cols-2 gap-5">
                <InfoCard
                  title="Konten Website Sekolah"
                  items={[
                    'Beranda — Hero slider, profil singkat, berita terkini, galeri foto',
                    'Profil Sekolah — Visi, misi, sejarah, struktur organisasi',
                    'Berita & Artikel — Publikasi kegiatan dan pengumuman sekolah',
                    'Galeri Foto — Album dokumentasi kegiatan',
                    'Kalender Akademik — Jadwal kegiatan dan libur sekolah',
                  ]}
                />
                <InfoCard
                  title="Layanan Publik"
                  items={[
                    'Jadwal Pelajaran Publik — Akses jadwal per kelas tanpa login',
                    'Formulir Pendaftaran Ulang — Form online untuk siswa baru',
                    'Verifikasi LCKH Guru — Scan QR untuk verifikasi log kinerja',
                    'Pengumuman — Informasi penting dari sekolah',
                    'Halaman Informasi — Dokumentasi fitur dan panduan sistem',
                  ]}
                />
              </div>
            </section>

            {/* ── SUPER ADMIN & ADMIN ── */}
            <section id="super-admin" className="scroll-mt-28">
              <SectionHeading
                icon={Shield}
                title="Super Admin & Admin"
                subtitle="Kendali penuh atas seluruh sistem, pengguna, data akademik, dan konfigurasi platform."
              />
              <div className="grid md:grid-cols-2 gap-5">
                <InfoCard
                  title="Manajemen Pengguna & Sistem"
                  items={[
                    'CRUD semua pengguna — guru, siswa, staff, orang tua',
                    'Assign dan update role pengguna (10 role tersedia)',
                    'Konfigurasi permission granular per role atau per user',
                    'Broadcast notifikasi massal ke role atau kelas tertentu',
                    'System Setting — konfigurasi AI provider, throttle, dan parameter global',
                  ]}
                />
                <InfoCard
                  title="Manajemen Akademik"
                  items={[
                    'Tahun Ajaran & Semester — kelola periode akademik aktif',
                    'Master Data — tingkat kelas, mata pelajaran, guru mapel',
                    'Kelas & Enrollment — kelola kelas dan penugasan siswa',
                    'Jadwal Pelajaran — buat jadwal mengajar (master jam, ruangan)',
                    'Kurikulum — upload dokumen CP, ATP, silabus untuk konteks RAG-AI',
                  ]}
                />
                <InfoCard
                  title="Keuangan"
                  items={[
                    'Kategori Pembayaran — kelola jenis tagihan (SPP, seragam, dll)',
                    'Generate tagihan massal per kelas atau angkatan',
                    'Monitor status pembayaran dan riwayat transaksi',
                    'Laporan keuangan dengan export Excel/PDF',
                    'Konfigurasi Midtrans — VA, E-wallet, Kartu Kredit, Retail',
                  ]}
                />
                <InfoCard
                  title="Konten & Laporan"
                  items={[
                    'Homepage CMS — kelola slider, berita, galeri, menu navigasi',
                    'Pengumuman — buat dan kelola pengumuman dashboard',
                    'Report & EIS — Executive Information System dengan analytics',
                    'Pendaftaran Ulang — monitor dan verifikasi pendaftaran siswa baru',
                    'Activity Log — audit trail seluruh aktivitas sistem',
                  ]}
                />
              </div>
            </section>

            {/* ── KEPALA SEKOLAH ── */}
            <section id="kepala" className="scroll-mt-28">
              <SectionHeading
                icon={Users}
                title="Kepala Sekolah & Wakil Kepala"
                subtitle="Akses monitoring dan pengawasan menyeluruh terhadap kinerja akademik dan operasional sekolah."
              />
              <div className="grid md:grid-cols-2 gap-5">
                <InfoCard
                  title="Monitoring Akademik"
                  items={[
                    'Dashboard EIS — ringkasan statistik akademik real-time',
                    'Monitor kehadiran guru dan siswa per kelas',
                    'Pantau progress penilaian dan pengumpulan tugas',
                    'Lihat laporan kinerja guru (LCKH) dan persetujuan',
                    'Akses rekap absensi dan catatan sikap seluruh kelas',
                  ]}
                />
                <InfoCard
                  title="Administrasi & Persetujuan"
                  items={[
                    'Approve dokumen pengajaran (RPP, silabus, modul ajar)',
                    'Monitor pendaftaran ulang dan data siswa baru',
                    'Akses laporan keuangan dan status tagihan',
                    'Kelola kalender akademik dan kegiatan sekolah',
                    'Broadcast pengumuman ke seluruh civitas akademika',
                  ]}
                />
              </div>
            </section>

            {/* ── STAFF TU ── */}
            <section id="staff-tu" className="scroll-mt-28">
              <SectionHeading
                icon={FileText}
                title="Staff TU"
                subtitle="Pengelolaan administrasi kesiswaan, data akademik, dan dokumen sekolah."
              />
              <div className="grid md:grid-cols-2 gap-5">
                <InfoCard
                  title="Administrasi Kesiswaan"
                  items={[
                    'Kelola data siswa — biodata, dokumen, status aktif',
                    'Proses pendaftaran ulang dan verifikasi dokumen',
                    'Kelola data orang tua dan wali siswa',
                    'Input dan update data prestasi siswa',
                    'Kelola data ekstrakurikuler dan anggota',
                  ]}
                />
                <InfoCard
                  title="Administrasi Akademik"
                  items={[
                    'Kelola data kelas dan enrollment siswa',
                    'Input dan update jadwal pelajaran',
                    'Kelola kalender akademik dan event sekolah',
                    'Proses perizinan siswa (sakit, izin, alfa)',
                    'Generate dan cetak laporan administrasi',
                  ]}
                />
              </div>
            </section>

            {/* ── STAFF KEUANGAN ── */}
            <section id="keuangan" className="scroll-mt-28">
              <SectionHeading
                icon={CreditCard}
                title="Staff Keuangan"
                subtitle="Pengelolaan tagihan, pembayaran, dan laporan keuangan sekolah."
              />
              <div className="grid md:grid-cols-2 gap-5">
                <InfoCard
                  title="Manajemen Tagihan"
                  items={[
                    'Buat kategori pembayaran (SPP, seragam, kegiatan, dll)',
                    'Generate tagihan massal per kelas atau angkatan',
                    'Monitor status tagihan — belum bayar, sebagian, lunas',
                    'Kirim reminder tagihan ke siswa dan orang tua',
                    'Proses pembayaran manual (tunai/transfer)',
                  ]}
                />
                <InfoCard
                  title="Laporan Keuangan"
                  items={[
                    'Dashboard ringkasan penerimaan harian, bulanan, tahunan',
                    'Riwayat transaksi dengan filter lengkap',
                    'Export laporan ke Excel dan PDF',
                    'Rekonsiliasi pembayaran Midtrans otomatis via webhook',
                    'Laporan tunggakan per siswa dan per kelas',
                  ]}
                />
              </div>
            </section>

            {/* ── GURU & WALI KELAS ── */}
            <section id="guru" className="scroll-mt-28">
              <SectionHeading
                icon={GraduationCap}
                title="Guru & Wali Kelas"
                subtitle="Pusat kendali pembelajaran — dari perencanaan, penyampaian materi, penugasan, hingga penilaian dan administrasi kelas."
              />
              <div className="grid md:grid-cols-2 gap-5">
                <InfoCard
                  title="Manajemen Pembelajaran"
                  items={[
                    '<strong>Materi Pelajaran</strong> — Upload konten (TEXT, FILE, VIDEO, LINK) per mata pelajaran',
                    '<strong>Tugas</strong> — 6 bentuk: Teks, File Upload, Link, Kuis, Proyek, Interactive Worksheet',
                    '<strong>Diskusi</strong> — Forum tanya jawab per mata pelajaran dengan balasan berjenjang',
                    '<strong>Penilaian</strong> — Input nilai pengetahuan, keterampilan, dan dimensi profil Pancasila',
                    '<strong>AI Generator</strong> — Generate RPP, materi, dan tugas dengan bantuan AI',
                  ]}
                />
                <InfoCard
                  title="Administrasi Guru"
                  items={[
                    '<strong>Absensi</strong> — Buka sesi QR (luring/WFH) atau input manual, lihat rekap',
                    '<strong>LCKH</strong> — Log Capaian Kinerja Harian dengan QR Code verifikasi publik',
                    '<strong>Dokumen Pengajaran</strong> — Upload RPP, silabus, modul ajar untuk approval',
                    '<strong>RPP</strong> — Buat dan kelola Rencana Pelaksanaan Pembelajaran',
                    '<strong>Perizinan</strong> — Proses izin siswa (approve/reject)',
                  ]}
                />
                <InfoCard
                  title="Wali Kelas (Tambahan)"
                  items={[
                    'Monitor kehadiran dan rekap absensi seluruh siswa di kelas wali',
                    'Input catatan sikap positif dan negatif per siswa',
                    'Input dan verifikasi prestasi siswa',
                    'Approve atau reject perizinan siswa kelas wali',
                    'Akses data lengkap siswa dan orang tua di kelas wali',
                  ]}
                />
                <InfoCard
                  title="Dashboard Guru"
                  items={[
                    'Jadwal mengajar hari ini dengan status sesi absensi',
                    'Daftar tugas yang menunggu penilaian',
                    'Statistik pengumpulan tugas per mata pelajaran',
                    'Notifikasi tugas dikumpulkan dan perizinan baru',
                    'Quick action: buka sesi absensi langsung dari dashboard',
                  ]}
                />
              </div>
            </section>

            {/* ── SISWA ── */}
            <section id="siswa" className="scroll-mt-28">
              <SectionHeading
                icon={BookOpen}
                title="Siswa"
                subtitle="Akses terpadu untuk seluruh aktivitas belajar, kehadiran, keuangan, dan komunikasi dengan guru."
              />
              <div className="grid md:grid-cols-2 gap-5">
                <InfoCard
                  title="Pembelajaran"
                  items={[
                    'Akses materi pelajaran (teks, file, video, link) per mata pelajaran',
                    'Kerjakan tugas berbagai bentuk termasuk worksheet interaktif',
                    'Draft auto-save — pekerjaan tersimpan otomatis saat mengerjakan',
                    'Ikut diskusi dan tanya jawab per mata pelajaran',
                    'Lihat nilai, feedback, dan riwayat pengumpulan tugas',
                  ]}
                />
                <InfoCard
                  title="Kehadiran & Administrasi"
                  items={[
                    'Scan QR Code untuk absensi (luring dengan GPS atau WFH)',
                    'Lihat rekap kehadiran dan persentase per mata pelajaran',
                    'Ajukan perizinan (sakit, izin) dengan upload surat',
                    'Lihat catatan sikap dan prestasi pribadi',
                    'Daftar dan lihat kegiatan ekstrakurikuler',
                  ]}
                />
                <InfoCard
                  title="Keuangan"
                  items={[
                    'Lihat tagihan aktif dan riwayat pembayaran',
                    'Bayar via Midtrans — Virtual Account, E-wallet, Kartu Kredit, Retail',
                    'Status pembayaran diperbarui otomatis via webhook',
                    'Unduh bukti pembayaran',
                  ]}
                />
                <InfoCard
                  title="Dashboard Siswa"
                  items={[
                    'Jadwal pelajaran hari ini',
                    'Tugas yang belum dikerjakan dan mendekati deadline',
                    'Notifikasi tugas baru, nilai keluar, dan tagihan',
                    'Ringkasan kehadiran dan nilai terkini',
                  ]}
                />
              </div>
            </section>

            {/* ── ORANG TUA ── */}
            <section id="orang-tua" className="scroll-mt-28">
              <SectionHeading
                icon={Users}
                title="Orang Tua"
                subtitle="Pantau perkembangan akademik, kehadiran, dan keuangan anak secara transparan dan real-time."
              />
              <div className="grid md:grid-cols-2 gap-5">
                <InfoCard
                  title="Monitoring Anak"
                  items={[
                    'Lihat rekap kehadiran dan persentase absensi anak',
                    'Pantau nilai dan progress tugas per mata pelajaran',
                    'Lihat catatan sikap dan prestasi anak',
                    'Akses jadwal pelajaran anak',
                    'Notifikasi real-time saat anak tidak hadir',
                  ]}
                />
                <InfoCard
                  title="Administrasi & Keuangan"
                  items={[
                    'Lihat dan bayar tagihan sekolah anak',
                    'Riwayat pembayaran dan bukti transaksi',
                    'Ajukan perizinan atas nama anak',
                    'Terima notifikasi status perizinan',
                    'Akses informasi kontak wali kelas',
                  ]}
                />
              </div>
            </section>

            {/* ── NOTIFIKASI ── */}
            <section id="notifikasi" className="scroll-mt-28">
              <SectionHeading
                icon={Bell}
                title="Sistem Notifikasi Otomatis"
                subtitle="Notifikasi real-time dikirim secara otomatis berdasarkan event yang terjadi di sistem, memastikan semua pihak selalu mendapat informasi terkini."
              />
              <div className="grid md:grid-cols-2 gap-5">
                <InfoCard
                  title="Notifikasi untuk Siswa & Orang Tua"
                  items={[
                    'Tugas baru dari guru',
                    'Tugas sudah dinilai — nilai dan feedback tersedia',
                    'Tagihan baru diterbitkan',
                    'Pembayaran berhasil dikonfirmasi',
                    'Status perizinan diperbarui (disetujui/ditolak)',
                    'Pengumuman baru dari sekolah',
                  ]}
                  accent
                />
                <InfoCard
                  title="Notifikasi untuk Guru & Manajemen"
                  items={[
                    'Tugas dikumpulkan oleh siswa',
                    'Perizinan baru menunggu persetujuan',
                    'Dokumen pengajaran baru diunggah',
                    'LCKH menunggu approval kepala sekolah',
                    'Siswa tidak hadir (untuk wali kelas)',
                    'Pembayaran masuk (untuk staff keuangan)',
                  ]}
                  accent
                />
              </div>
              <div className="mt-5 p-4 rounded-xl border border-gray-100 dark:border-gray-800/60 bg-gray-50/60 dark:bg-gray-900/40">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Notifikasi dikirim melalui <strong className="text-gray-700 dark:text-gray-300">Socket.IO</strong> untuk pembaruan real-time di browser, dan disimpan di database untuk riwayat. Sistem mendukung device token untuk push notification mobile.
                </p>
              </div>
            </section>

            {/* ── LAPORAN ── */}
            <section id="laporan" className="scroll-mt-28">
              <SectionHeading
                icon={BarChart3}
                title="Laporan & Analitik"
                subtitle="Sistem pelaporan komprehensif dengan export multi-format untuk mendukung pengambilan keputusan berbasis data."
              />
              <div className="grid md:grid-cols-2 gap-5">
                <InfoCard
                  title="Laporan Akademik"
                  items={[
                    'Rekap nilai per siswa, per kelas, per mata pelajaran',
                    'Statistik pengumpulan dan penilaian tugas',
                    'Laporan absensi — matriks kehadiran per periode',
                    'Rekap catatan sikap dan dimensi profil Pancasila',
                    'Laporan prestasi siswa',
                  ]}
                />
                <InfoCard
                  title="Laporan Operasional"
                  items={[
                    'EIS (Executive Information System) — dashboard ringkasan eksekutif',
                    'Laporan keuangan — penerimaan, tunggakan, rekonsiliasi',
                    'Laporan kinerja guru (LCKH) per periode',
                    'Statistik penggunaan fitur AI Generator',
                    'Export ke PDF, Excel, dan format cetak',
                  ]}
                />
              </div>
            </section>

            {/* ── KEAMANAN ── */}
            <section id="keamanan" className="scroll-mt-28">
              <SectionHeading
                icon={Lock}
                title="Keamanan & Akses"
                subtitle="Arsitektur keamanan berlapis dengan kontrol akses granular dan perlindungan data yang ketat."
              />
              <div className="grid md:grid-cols-2 gap-5">
                <InfoCard
                  title="Autentikasi & Otorisasi"
                  items={[
                    'Login dengan email/username + password',
                    'JWT (JSON Web Token) dengan refresh token rotation',
                    'Role-Based Access Control (RBAC) — 10 role pengguna',
                    'Permission granular per modul dan aksi',
                    'Override permission per user untuk kasus khusus',
                    'Rate limiting (throttle) untuk mencegah brute force',
                  ]}
                />
                <InfoCard
                  title="Keamanan Data & File"
                  items={[
                    'Public Bucket — foto profil, logo (akses URL langsung)',
                    'Private Bucket — dokumen, materi, tugas (presigned URL dengan TTL)',
                    'Validasi tipe file dan ukuran maksimal setiap upload',
                    'Kompresi gambar otomatis dengan Sharp',
                    'Semua komunikasi melalui HTTPS',
                    'Audit trail aktivitas pengguna via Activity Log',
                  ]}
                />
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}


