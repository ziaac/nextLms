import api from '@/lib/axios'
import type {
  KalenderAkademik,
  CreateKalenderAkademikDto,
  UpdateKalenderAkademikDto,
  QueryKalenderBulan,
  QueryKalenderTahunAjaran,
  BulkCreateKalenderDto,
} from '@/types/kalender-akademik.types'

const BASE = '/kalender-akademik'

export const kalenderAkademikApi = {
  /** GET /kalender-akademik/bulan — untuk tampilan calendar view */
  getByBulan: (params: QueryKalenderBulan): Promise<KalenderAkademik[]> =>
    api.get<KalenderAkademik[]>(`${BASE}/bulan`, { params }).then((r) => r.data),

  /** GET /kalender-akademik — semua event dalam tahun ajaran */
  getByTahunAjaran: (params: QueryKalenderTahunAjaran): Promise<KalenderAkademik[]> =>
    api.get<KalenderAkademik[]>(BASE, { params }).then((r) => r.data),

  /** GET /kalender-akademik/:id */
  getOne: (id: string): Promise<KalenderAkademik> =>
    api.get<KalenderAkademik>(`${BASE}/${id}`).then((r) => r.data),

  /** POST /kalender-akademik */
  create: (dto: CreateKalenderAkademikDto): Promise<KalenderAkademik> =>
    api.post<KalenderAkademik>(BASE, dto).then((r) => r.data),

  /** POST /kalender-akademik/bulk */
  bulkCreate: (dto: BulkCreateKalenderDto): Promise<{ message: string; count: number }> =>
    api.post<{ message: string; count: number }>(`${BASE}/bulk`, dto).then((r) => r.data),

  /** PATCH /kalender-akademik/:id */
  update: (id: string, dto: UpdateKalenderAkademikDto): Promise<KalenderAkademik> =>
    api.patch<KalenderAkademik>(`${BASE}/${id}`, dto).then((r) => r.data),

  /** DELETE /kalender-akademik/:id */
  remove: (id: string): Promise<{ message: string }> =>
    api.delete<{ message: string }>(`${BASE}/${id}`).then((r) => r.data),
}
