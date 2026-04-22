import api from '@/lib/axios'

export interface WilayahItem {
  kode: string
  nama: string
  tipe?: string
  indukKode?: string
}

// ── Cache in-memory ───────────────────────────────────────────────
const cache = {
  provinsi:  null as WilayahItem[] | null,
  kabupaten: new Map<string, WilayahItem[]>(),
  kecamatan: new Map<string, WilayahItem[]>(),
}

export const wilayahApi = {
  searchKelurahan: async (q: string): Promise<WilayahItem[]> => {
    if (q.length < 3) return []
    const { data } = await api.get('/wilayah/search', { params: { q } })
    return (data as WilayahItem[]).filter(item => item.tipe === 'KELURAHAN_DESA')
  },

  getAllProvinsi: async (): Promise<WilayahItem[]> => {
    if (cache.provinsi) return cache.provinsi
    const { data } = await api.get('/wilayah/provinsi')
    cache.provinsi = data
    return data
  },

  getKabupaten: async (indukKode: string): Promise<WilayahItem[]> => {
    if (cache.kabupaten.has(indukKode)) return cache.kabupaten.get(indukKode)!
    const { data } = await api.get('/wilayah/kabupaten', { params: { indukKode } })
    cache.kabupaten.set(indukKode, data)
    return data
  },

  getKecamatan: async (indukKode: string): Promise<WilayahItem[]> => {
    if (cache.kecamatan.has(indukKode)) return cache.kecamatan.get(indukKode)!
    const { data } = await api.get('/wilayah/kecamatan', { params: { indukKode } })
    cache.kecamatan.set(indukKode, data)
    return data
  },
}

export function deriveKodeInduk(kelurahanKode: string) {
  const parts = kelurahanKode.split('.')
  return {
    provinsiKode:  parts[0],
    kabupatenKode: parts.slice(0, 2).join('.'),
    kecamatanKode: parts.slice(0, 3).join('.'),
  }
}

export async function resolveWilayahNames(kelurahanKode: string) {
  const { provinsiKode, kabupatenKode, kecamatanKode } = deriveKodeInduk(kelurahanKode)

  const [provinsiList, kabupatenList, kecamatanList] = await Promise.all([
    wilayahApi.getAllProvinsi(),
    wilayahApi.getKabupaten(provinsiKode),
    wilayahApi.getKecamatan(kabupatenKode),
  ])

  return {
    provinsi:  provinsiList.find(p => p.kode === provinsiKode)?.nama  ?? '',
    kabupaten: kabupatenList.find(k => k.kode === kabupatenKode)?.nama ?? '',
    kecamatan: kecamatanList.find(k => k.kode === kecamatanKode)?.nama ?? '',
  }
}

/**
 * Pre-fetch nama kecamatan & kabupaten untuk list kelurahan
 * Dijalankan sekali saat dropdown terbuka, hasilnya di-cache
 */
export async function enrichKelurahanList(
  items: WilayahItem[],
): Promise<(WilayahItem & { namaKecamatan: string; namaKabupaten: string })[]> {
  if (items.length === 0) return []

  // Kumpulkan semua unique kabupatenKode yang dibutuhkan
  const kabupatenKodeSet = new Set(
    items.map(item => deriveKodeInduk(item.kode).kabupatenKode)
  )

  // Fetch kecamatan untuk setiap kabupaten unik (paralel, dengan cache)
  const provinsiKode = deriveKodeInduk(items[0].kode).provinsiKode
  await wilayahApi.getKabupaten(provinsiKode) // cache kabupaten

  await Promise.all(
    Array.from(kabupatenKodeSet).map(kode => wilayahApi.getKecamatan(kode))
  )

  // Enrich setiap item dengan nama kecamatan & kabupaten dari cache
  return items.map(item => {
    const { kabupatenKode, kecamatanKode } = deriveKodeInduk(item.kode)
    const kabList = cache.kabupaten.get(provinsiKode) ?? []
    const kecList = cache.kecamatan.get(kabupatenKode) ?? []

    return {
      ...item,
      namaKabupaten: kabList.find(k => k.kode === kabupatenKode)?.nama ?? kabupatenKode,
      namaKecamatan: kecList.find(k => k.kode === kecamatanKode)?.nama ?? kecamatanKode,
    }
  })
}
