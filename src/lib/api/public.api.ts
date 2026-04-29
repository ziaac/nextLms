/**
 * API calls untuk halaman publik (tanpa auth)
 * Semua endpoint @Public() di backend
 */
import { API_URL } from '@/lib/constants'

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

  profil:       () => fetchPublic<any>('/homepage/profil'),
  slider:       () => fetchPublic<any[]>('/homepage/slider'),
  menu:         () => fetchPublic<any[]>('/homepage/menu'),
  fitur:        () => fetchPublic<any[]>('/homepage/fitur'),
  berita:       (limit = 4) => fetchPublic<any>(`/homepage/berita?limit=${limit}`),
  galeriAlbum:  () => fetchPublic<any[]>('/homepage/galeri/kategori'),
  galeriDetail: (id: string) => fetchPublic<any>(`/homepage/galeri/kategori/${id}`),
  jadwalHariIni:() => fetchPublic<any>('/jadwal-pelajaran/publik/hari-ini'),
}
