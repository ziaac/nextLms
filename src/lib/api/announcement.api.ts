import api from '@/lib/axios'
import type {
  Announcement,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  QueryAnnouncementDto,
  AnnouncementListResponse,
} from '@/types/announcement.types'

const BASE = '/announcement'

export const announcementApi = {
  /** GET /announcement — untuk user biasa (terfilter role & tanggal aktif) */
  getAll: (params?: QueryAnnouncementDto): Promise<AnnouncementListResponse> =>
    api.get<AnnouncementListResponse>(BASE, { params }).then((r) => r.data),

  /** GET /announcement/admin — untuk Creator_Pengumuman (semua, tanpa filter tanggal) */
  getAllAdmin: (params?: QueryAnnouncementDto): Promise<AnnouncementListResponse> =>
    api.get<AnnouncementListResponse>(`${BASE}/admin`, { params }).then((r) => r.data),

  /** GET /announcement/:id */
  getOne: (id: string): Promise<Announcement> =>
    api.get<Announcement>(`${BASE}/${id}`).then((r) => r.data),

  /** POST /announcement */
  create: (dto: CreateAnnouncementDto): Promise<Announcement> =>
    api.post<Announcement>(BASE, dto).then((r) => r.data),

  /** PATCH /announcement/:id */
  update: (id: string, dto: UpdateAnnouncementDto): Promise<Announcement> =>
    api.patch<Announcement>(`${BASE}/${id}`, dto).then((r) => r.data),

  /** DELETE /announcement/:id */
  remove: (id: string): Promise<{ message: string }> =>
    api.delete<{ message: string }>(`${BASE}/${id}`).then((r) => r.data),
}
