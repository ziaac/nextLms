import {
  LayoutDashboard, CalendarDays, BookOpen, ClipboardList, GraduationCap,
  QrCode, Award, Users, DollarSign, CreditCard,
  Settings, BarChart3, Home, Bell, UserCircle, School,
  BookMarked, ShieldCheck, Calendar, Layers,
  Building2, FolderOpen, ListTodo, Star, ClipboardCheck,
} from 'lucide-react'
import type { UserRole } from '@/types'

export interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles?: UserRole[]          // jika undefined → semua role
  children?: NavItem[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
  roles?: UserRole[]
}

export const NAV_GROUPS: NavGroup[] = [
  // ── SAYA ──────────────────────────────────────────────────────────────────
  {
    label: 'SAYA',
    items: [
      { label: 'Dashboard',   href: '/dashboard',        icon: LayoutDashboard },
      { label: 'To Do',       href: '/dashboard/todo',   icon: ListTodo },
      { label: 'Profil Saya', href: '/dashboard/profil', icon: UserCircle },
      {
        label: 'Log LCKH',
        href:  '/dashboard/log-lckh',
        icon:  ClipboardCheck,
        roles: ['GURU', 'WALI_KELAS'],
      },
    ],
  },

  // ── AKSI DIPERLUKAN (manajemen) ───────────────────────────────────────────
  {
    label: 'AKSI DIPERLUKAN',
    roles: ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU'],
    items: [
      {
        label: 'To Do',
        href:  '/dashboard/todo',
        icon:  ListTodo,
        roles: ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU'],
      },
      {
        label: 'LCKH Guru',
        href:  '/dashboard/log-lckh/manajemen',
        icon:  ClipboardCheck,
        roles: ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA'],
      },
    ],
  },

  // ── PENGGUNA ──────────────────────────────────────────────────────────────
  {
    label: 'PENGGUNA',
    roles: ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU'],
    items: [
      {
        label: 'Pengguna',
        href:  '/dashboard/users',
        icon:  Users,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Pendaftaran Ulang',
        href:  '/dashboard/pendaftaran-ulang',
        icon:  ClipboardList,
        roles: ['ADMIN', 'SUPER_ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU'],
      },
    ],
  },

  // ── AKADEMIK ──────────────────────────────────────────────────────────────
  {
    label: 'AKADEMIK',
    items: [
      {
        label: 'Kelas & Siswa',
        href:  '/dashboard/kelas',
        icon:  School,
        roles: [
          'SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU',
          'WALI_KELAS', 'GURU',
        ],
      },
      {
        label: 'Mata Pelajaran',
        href:  '/dashboard/pembelajaran',
        icon:  GraduationCap,
        roles: [
          'SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU',
          'GURU', 'WALI_KELAS', 'SISWA', 'ORANG_TUA',
        ],
      },
      {
        label: 'Dokumen Pengajaran',
        href:  '/dashboard/dokumen-pengajaran',
        icon:  FolderOpen,
        roles: [
          'GURU', 'WALI_KELAS',
          'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'ADMIN', 'SUPER_ADMIN',
        ],
      },
      {
        label: 'Materi Pelajaran',
        href:  '/dashboard/materi-pelajaran',
        icon:  BookOpen,
        roles: [
          'GURU', 'WALI_KELAS', 'SISWA',
          'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'ADMIN', 'SUPER_ADMIN',
        ],
      },
      {
        label: 'Tugas & Nilai',
        href:  '/dashboard/tugas',
        icon:  ClipboardList,
        roles: ['GURU', 'WALI_KELAS', 'SISWA', 'ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Jadwal & Absensi',
        href:  '/dashboard/jadwal',
        icon:  CalendarDays,
        roles: [
          'GURU', 'WALI_KELAS', 'SISWA',
          'SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU',
        ],
      },
      {
        label: 'Absensi',
        href:  '/dashboard/absensi',
        icon:  QrCode,
        roles: ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU'],
      },
      {
        label: 'Perizinan',
        href:  '/dashboard/perizinan',
        icon:  ShieldCheck,
        roles: [
          'GURU', 'WALI_KELAS',
          'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU', 'ADMIN', 'SUPER_ADMIN',
        ],
      },
    ],
  },

  // ── OPERASIONAL ───────────────────────────────────────────────────────────
  {
    label: 'OPERASIONAL',
    items: [
      {
        label: 'Catatan Sikap',
        href:  '/dashboard/sikap',
        icon:  BookMarked,
        roles: [
          'GURU', 'WALI_KELAS', 'SISWA',
          'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'ADMIN', 'SUPER_ADMIN',
        ],
      },
      {
        label: 'Prestasi',
        href:  '/dashboard/prestasi',
        icon:  Award,
        roles: [
          'GURU', 'WALI_KELAS', 'SISWA',
          'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'ADMIN', 'SUPER_ADMIN',
        ],
      },
      {
        label: 'Ekstrakurikuler',
        href:  '/dashboard/ekskul',
        icon:  Layers,
        roles: [
          'GURU', 'SISWA',
          'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'ADMIN', 'SUPER_ADMIN',
        ],
      },
      {
        label: 'Kalender',
        href:  '/dashboard/kalender',
        icon:  Calendar,
        // semua role
      },
    ],
  },

  // ── KEUANGAN ──────────────────────────────────────────────────────────────
  {
    label: 'KEUANGAN',
    roles: ['SISWA', 'ORANG_TUA', 'STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN'],
    items: [
      {
        label: 'Tagihan',
        href:  '/dashboard/tagihan',
        icon:  DollarSign,
        roles: ['SISWA', 'ORANG_TUA', 'STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Pembayaran',
        href:  '/dashboard/pembayaran',
        icon:  CreditCard,
        roles: ['SISWA', 'ORANG_TUA', 'STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN'],
      },
    ],
  },

  // ── LAPORAN & CMS ─────────────────────────────────────────────────────────
  {
    label: 'Laporan & CMS',
    roles: ['ADMIN', 'SUPER_ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU'],
    items: [
      {
        label: 'Report & EIS',
        href:  '/dashboard/report',
        icon:  BarChart3,
        roles: ['ADMIN', 'SUPER_ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA'],
      },
      {
        label: 'Homepage CMS',
        href:  '/dashboard/homepage',
        icon:  Home,
        roles: ['ADMIN', 'SUPER_ADMIN', 'STAFF_TU', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA'],
      },
      {
        label: 'Pengumuman',
        href:  '/dashboard/announcement',
        icon:  Bell,
        roles: [
          'ADMIN', 'SUPER_ADMIN',
          'KEPALA_SEKOLAH', 'WAKIL_KEPALA',
          'GURU', 'WALI_KELAS',
        ],
      },
    ],
  },

  // ── MANAJEMEN MASTER DATA ─────────────────────────────────────────────────
  {
    label: 'Manajemen Master Data',
    roles: ['ADMIN', 'SUPER_ADMIN', 'WAKIL_KEPALA', 'KEPALA_SEKOLAH', 'STAFF_TU'],
    items: [
      {
        label: 'TA / Semester',
        href:  '/dashboard/tahun-ajaran',
        icon:  Settings,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Master Jam',
        href:  '/dashboard/master-jam',
        icon:  CalendarDays,
        roles: ['ADMIN', 'SUPER_ADMIN', 'WAKIL_KEPALA', 'KEPALA_SEKOLAH', 'STAFF_TU'],
      },
      {
        label: 'Master Ruangan',
        href:  '/dashboard/ruangan',
        icon:  Building2,
        roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF_TU'],
      },
      {
        label: 'Master Kelas',
        href:  '/dashboard/tingkat-kelas',
        icon:  Layers,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Master Mapel',
        href:  '/dashboard/mata-pelajaran',
        icon:  BookOpen,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Guru Mapel',
        href:  '/dashboard/mata-pelajaran-tingkat',
        icon:  BookOpen,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Dimensi Profil',
        href:  '/dashboard/master-dimensi-profil',
        icon:  Star,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Master Sikap',
        href:  '/dashboard/master-sikap',
        icon:  BookMarked,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Kategori Bayar',
        href:  '/dashboard/kategori-pembayaran',
        icon:  DollarSign,
        roles: ['ADMIN', 'SUPER_ADMIN', 'STAFF_KEUANGAN'],
      },
    ],
  },
]

/** Filter nav groups berdasarkan role user dan mapping URL dinamis */
export function getNavForRole(user: { role?: string } | null | undefined): NavGroup[] {
  const role = (user?.role ?? 'SISWA') as UserRole
  return NAV_GROUPS
    .filter((g) => !g.roles || g.roles.includes(role))
    .map((g) => ({
      ...g,
      items: g.items
        .filter((item) => !item.roles || item.roles.includes(role))
        .map((item) => {
          // ── Mapping URL dinamis per role ──────────────────────────────────

          // 1. Absensi (QR) → sub-route manajemen
          if (item.label === 'Absensi' && item.href === '/dashboard/absensi') {
            return { ...item, href: '/dashboard/absensi/manajemen' }
          }

          // 2. Mata Pelajaran → sub-route per role
          if (item.label === 'Mata Pelajaran' && item.href === '/dashboard/pembelajaran') {
            if (role === 'GURU' || role === 'WALI_KELAS')
              return { ...item, href: '/dashboard/pembelajaran/guru' }
            if (role === 'SISWA' || role === 'ORANG_TUA')
              return { ...item, href: '/dashboard/pembelajaran/siswa' }
            return { ...item, href: '/dashboard/pembelajaran/manajemen' }
          }

          // 3. Jadwal & Absensi → sub-route per role
          if (item.label === 'Jadwal & Absensi' && item.href === '/dashboard/jadwal') {
            if (role === 'SISWA') return { ...item, href: '/dashboard/jadwal/kelas' }
            if (role === 'GURU' || role === 'WALI_KELAS')
              return { ...item, href: '/dashboard/jadwal/guru' }
            return { ...item, href: '/dashboard/jadwal/manajemen' }
          }

          // 4. Kelas & Siswa → sub-route per role
          if (item.label === 'Kelas & Siswa' && item.href === '/dashboard/kelas') {
            if (role === 'GURU' || role === 'WALI_KELAS')
              return { ...item, href: '/dashboard/kelas-belajar/guru' }
            return { ...item, href: '/dashboard/kelas' }
          }

          return item
        }),
    }))
    .filter((g) => g.items.length > 0)
}
