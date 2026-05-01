/**
 * API calls untuk halaman publik (tanpa auth)
 * Semua endpoint @Public() di backend
 */
import { API_URL } from '@/lib/constants'
import type { AnnouncementListResponse } from '@/types/announcement.types'
import type { KalenderAkademik } from '@/types/kalender-akademik.types'

async function fetchPublic<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`Fetch error: ${res.status}`)
  return res.json()
}

export const publicApi = {
  stats:        () => fetchPublic<{
    totalSiswa: number; totalGuru: number; totalKelas: number
    totalMapel: number; totalEkskul: number
  }>('/report/public/stats'),

  aktivitasSemester: () => fetchPublic<{
    semesterNama: string | null
    tahunAjaran:  string | null
    jadwal:    { totalJP: number; totalSesiDibuka: number }
    kehadiran: { persentase: number; totalAbsensi: number }
    materi:    { totalDibuat: number; totalSiswaSelesai: number; totalSiswa: number }
    tugas:     { totalDibuat: number; totalSiswaKumpul: number; totalPengumpulan: number }
    profil:    { totalSiswa: number; totalGuru: number; totalMapel: number }
  }>('/report/public/aktivitas-semester'),

  profil:       () => fetchPublic<any>('/homepage/profil'),
  slider:       () => fetchPublic<any[]>('/homepage/slider'),
  menu:         () => fetchPublic<any[]>('/homepage/menu'),
  fitur:        () => fetchPublic<any[]>('/homepage/fitur'),
  berita:       (limit = 4) => fetchPublic<any>(`/homepage/berita?limit=${limit}`),
  beritaKategori: () => fetchPublic<any[]>('/homepage/berita/kategori'),
  beritaBySlug: (slug: string) => fetchPublic<any>(`/homepage/berita/slug/${slug}`),
  beritaList:   (params: string) => fetchPublic<any>(`/homepage/berita?${params}`),
  galeriAlbum:  () => fetchPublic<any[]>('/homepage/galeri/kategori'),
  galeriDetail: (id: string) => fetchPublic<any>(`/homepage/galeri/kategori/${id}`),
  jadwalHariIni:() => fetchPublic<any>('/jadwal-pelajaran/publik/hari-ini'),

  // Pengumuman publik (tanpa auth)
  announcementPublik: (params?: { page?: number; limit?: number; priority?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', params.page.toString())
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.priority) query.set('priority', params.priority)
    const queryString = query.toString()
    return fetchPublic<AnnouncementListResponse>(
      `/announcement/public${queryString ? `?${queryString}` : ''}`
    )
  },

  // Kalender akademik publik (tanpa auth)
  kalenderPublik: (params: { bulan: number; tahun: number }) => {
    const query = new URLSearchParams()
    query.set('bulan', params.bulan.toString())
    query.set('tahun', params.tahun.toString())
    return fetchPublic<KalenderAkademik[]>(`/kalender-akademik/bulan?${query.toString()}`)
  },
}
