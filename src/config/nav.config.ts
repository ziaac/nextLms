import {
  LayoutDashboard, CalendarDays, BookOpen, ClipboardList, GraduationCap, School2,
  QrCode, FileText, Award, Users, DollarSign, CreditCard,
  Settings, BarChart3, Home, Bell, UserCircle, School,
  BookMarked, ShieldCheck, Calendar, Layers,
  Building2, FolderOpen,
} from 'lucide-react'
import type { UserRole } from '@/types'
import { ST } from 'next/dist/shared/lib/utils'

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
  {
    label: 'SAYA',
    items: [
      { label: 'Dashboard',     href: '/dashboard',               icon: LayoutDashboard },
      { label: 'Notifikasi',    href: '/dashboard/notifikasi',    icon: Bell },
      { label: 'Profil Saya',   href: '/dashboard/profil',        icon: UserCircle },
    ],
  },
  {
    label: 'PENGGUNA',
    items: [
      {
        label: 'Pengguna',
        href: '/dashboard/users',
        icon: Users,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
          {
        label: 'Pendaftaran Ulang',
        href: '/dashboard/pendaftaran-ulang',
        icon: ClipboardList,
        roles: ['ADMIN', 'SUPER_ADMIN', 'STAFF_TU'],
      },
    ],
  },
  {

    label: 'AKADEMIK',
    items: [
        {
        label: 'Kelas & Siswa',
        href: '/dashboard/kelas',
        icon: School,
        roles: ['ADMIN', 'SUPER_ADMIN', 'WALI_KELAS', 'GURU'],
      },
      {
        label: 'Mata Pelajaran',
        href: '/dashboard/pembelajaran',
        icon: GraduationCap,
        roles: [
          'SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU',
          'GURU', 'WALI_KELAS', 'SISWA', 'ORANG_TUA',
        ],
      },
            {
        label: 'Dokumen Pengajaran',
        href: '/dashboard/dokumen-pengajaran',
        icon: FolderOpen,
        roles: ['GURU', 'WALI_KELAS', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'ADMIN', 'SUPER_ADMIN'],
      },
        {
        label: 'Materi Pelajaran',
        href: '/dashboard/materi-pelajaran',
        icon: BookOpen,
        roles: ['GURU', 'SISWA', 'WALI_KELAS', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Tugas & Penilaian',
        href: '/dashboard/tugas',
        icon: ClipboardList,
        roles: ['GURU', 'WALI_KELAS', 'SISWA', 'ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Jadwal',
        href: '/dashboard/jadwal',
        icon: CalendarDays,
        roles: ['GURU', 'SISWA', 'WALI_KELAS', 'ADMIN', 'SUPER_ADMIN', 'WAKIL_KEPALA', 'KEPALA_SEKOLAH'],
      },
      {
        label: 'Absensi',
        href: '/dashboard/absensi',
        icon: QrCode,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Perizinan',
        href: '/dashboard/perizinan',
        icon: ShieldCheck,
        roles: ['GURU', 'WALI_KELAS', 'ADMIN', 'SUPER_ADMIN'],
      },

    ],
  },
  {
    label: 'OPERASIONAL',
    items: [
      {
        label: 'Catatan Sikap',
        href: '/dashboard/sikap',
        icon: BookMarked,
        roles: ['GURU', 'WALI_KELAS', 'ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Prestasi',
        href: '/dashboard/prestasi',
        icon: Award,
        roles: ['GURU', 'SISWA', 'WALI_KELAS', 'ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Ekstrakurikuler',
        href: '/dashboard/ekskul',
        icon: Layers,
        roles: ['GURU', 'SISWA', 'ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Kalender',
        href: '/dashboard/kalender',
        icon: Calendar,
      },
    ],
  },
  {
    label: 'KEUANGAN',
    roles: ['SISWA', 'ORANG_TUA', 'STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN'],
    items: [
      {
        label: 'Tagihan',
        href: '/dashboard/tagihan',
        icon: DollarSign,
        roles: ['SISWA', 'ORANG_TUA', 'STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Pembayaran',
        href: '/dashboard/pembayaran',
        icon: CreditCard,
        roles: ['SISWA', 'ORANG_TUA', 'STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN'],
      },
    ],
  },
  {
    label: 'Laporan & CMS',
    roles: ['ADMIN', 'SUPER_ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA'],
    items: [
      {
        label: 'Report & EIS',
        href: '/dashboard/report',
        icon: BarChart3,
        roles: ['ADMIN', 'SUPER_ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA'],
      },
      {
        label: 'Homepage CMS',
        href: '/dashboard/homepage',
        icon: Home,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Pengumuman',
        href: '/dashboard/announcement',
        icon: Bell,
        roles: ['ADMIN', 'SUPER_ADMIN', 'GURU', 'WALI_KELAS'],
      },
    ],
  },
  {
    label: 'Manajemen Master Data',
    roles: ['ADMIN', 'SUPER_ADMIN', 'WALI_KELAS', 'WAKIL_KEPALA', 'KEPALA_SEKOLAH'],
    items: [      
     {
        label: 'TA / Semester',
        href: '/dashboard/tahun-ajaran',
        icon: Settings,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Master Jam',
        href: '/dashboard/master-jam',
        icon: CalendarDays,
        roles: ['ADMIN', 'SUPER_ADMIN', 'WAKIL_KEPALA', 'KEPALA_SEKOLAH', 'STAFF_TU'],
      },
      { label: 'Master Ruangan', 
        href: '/dashboard/ruangan', 
        icon: Building2, 
        roles: ['SUPER_ADMIN','ADMIN','STAFF_TU'] },
      {
        label: 'Master Kelas',
        href: '/dashboard/tingkat-kelas',
        icon: Layers,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Master Mapel',
        href: '/dashboard/mata-pelajaran',
        icon: BookOpen,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Guru Mapel',
        href:  '/dashboard/mata-pelajaran-tingkat',
        icon:  BookOpen,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Master Sikap',
        href: '/dashboard/master-sikap',
        icon: BookMarked,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Kategori Bayar',
        href: '/dashboard/kategori-pembayaran',
        icon: DollarSign,
        roles: ['ADMIN', 'SUPER_ADMIN', 'STAFF_KEUANGAN'],
      },
    ],
  },
]

/** Filter nav groups berdasarkan role user dan mapping URL dinamis */
export function getNavForRole(user: any): NavGroup[] {
  const role = (user?.role ?? 'SISWA') as UserRole
  return NAV_GROUPS
    .filter((g) => !g.roles || g.roles.includes(role))
    .map((g) => ({
      ...g,
      items: g.items
        .filter((item) => !item.roles || item.roles.includes(role))
        .map((item) => {
          // ── Mapping URL khusus untuk mencegah redirect loop & loading tiada ujung ──
          
          // 1. Absensi
          if (item.label === 'Absensi' && item.href === '/dashboard/absensi') {
            let dynamicHref = '/dashboard/absensi/manajemen'
            if (role === 'SISWA' || role === 'ORANG_TUA') dynamicHref = '/dashboard/absensi/siswa'
            return { ...item, href: dynamicHref }
          }

          // 2. Mata Pelajaran (Pembelajaran)
          if (item.label === 'Mata Pelajaran' && item.href === '/dashboard/pembelajaran') {
            let dynamicHref = '/dashboard/pembelajaran/manajemen'
            if (role === 'GURU' || role === 'WALI_KELAS') dynamicHref = '/dashboard/pembelajaran/guru'
            else if (role === 'SISWA' || role === 'ORANG_TUA') dynamicHref = '/dashboard/pembelajaran/siswa'
            return { ...item, href: dynamicHref }
          }

          // 3. Jadwal
          if (item.label === 'Jadwal' && item.href === '/dashboard/jadwal') {
            if (role === 'SISWA') return { ...item, label: 'Absensi', href: '/dashboard/jadwal/kelas' }
            if (role === 'GURU' || role === 'WALI_KELAS') return { ...item, href: '/dashboard/jadwal/guru' }
            return { ...item, href: '/dashboard/jadwal/manajemen' }
          }
          
          // 4. Tugas — siswa cukup lihat "Tugas" bukan "Tugas & Penilaian"
          if (item.label === 'Tugas & Penilaian' && item.href === '/dashboard/tugas') {
            if (role === 'SISWA') return { ...item, label: 'Tugas' }
          }

          // 5. Kelas & Siswa (Kelas Belajar)
          if (item.label === 'Kelas & Siswa' && item.href === '/dashboard/kelas') {
            let dynamicHref = '/dashboard/kelas'
            if (role === 'GURU' || role === 'WALI_KELAS') {
              dynamicHref = '/dashboard/kelas-belajar/guru'
            }
            return { ...item, href: dynamicHref }
          }

          return item
        }),
    }))
    .filter((g) => g.items.length > 0)
}
