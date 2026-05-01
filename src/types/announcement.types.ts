import type { UserRole } from '@/types/enums'

export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export const PRIORITY_LABEL: Record<AnnouncementPriority, string> = {
  LOW:    'Rendah',
  NORMAL: 'Normal',
  HIGH:   'Tinggi',
  URGENT: 'Mendesak',
}

// Warna badge prioritas — Tailwind class string
export const PRIORITY_COLOR: Record<AnnouncementPriority, string> = {
  LOW:    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  NORMAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  HIGH:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export interface Announcement {
  id:           string
  judul:        string
  konten:       string            // HTML dari RichTextEditor
  targetRole:   UserRole[]        // kosong = semua role
  priority:     AnnouncementPriority
  startDate:    string            // ISO datetime string
  endDate:      string | null     // ISO datetime string
  isActive:     boolean
  isPinned:     boolean
  createdBy:    string
  createdAt:    string
  updatedAt:    string
  createdByUser: {
    id:      string
    profile: { namaLengkap: string } | null
  }
}

export interface CreateAnnouncementDto {
  judul:       string             // maks 250 karakter
  konten:      string
  targetRole?: UserRole[]
  priority?:   AnnouncementPriority
  startDate:   string             // ISO datetime string
  endDate?:    string
  isActive?:   boolean
  isPinned?:   boolean
}

export type UpdateAnnouncementDto = Partial<CreateAnnouncementDto>

export interface QueryAnnouncementDto {
  page?:       number
  limit?:      number
  priority?:   AnnouncementPriority
  targetRole?: string
  isActive?:   boolean
  isPinned?:   boolean
}

export interface AnnouncementListResponse {
  data: Announcement[]
  meta: {
    total:      number
    page:       number
    limit:      number
    totalPages: number
  }
}
