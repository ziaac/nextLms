import api from '@/lib/axios'
import type {
  ProfilMadrasah,
  UpsertProfilDto,
  Slider,
  CreateSliderDto,
  UpdateSliderDto,
  ReorderItem,
  Berita,
  BeritaListResponse,
  CreateBeritaDto,
  UpdateBeritaDto,
  QueryBeritaDto,
  KategoriBerita,
  KategoriGaleri,
  GaleriFoto,
  CreateKategoriGaleriDto,
  CreateGaleriFotoDto,
  FiturAplikasi,
  CreateFiturDto,
  UpdateFiturDto,
  Menu,
  CreateMenuDto,
  UpdateMenuDto,
} from '@/types/homepage.types'

const BASE = '/homepage'

// ── Profil Madrasah ───────────────────────────────────────────────────────────
export const profilApi = {
  get: () =>
    api.get<ProfilMadrasah>(`${BASE}/profil`).then((r) => r.data),

  upsert: (dto: UpsertProfilDto) =>
    api.patch<ProfilMadrasah>(`${BASE}/profil`, dto).then((r) => r.data),
}

// ── Slider ────────────────────────────────────────────────────────────────────
export const sliderApi = {
  list: (onlyActive = false) =>
    api
      .get<Slider[]>(`${BASE}/slider`, { params: onlyActive ? {} : { all: 'true' } })
      .then((r) => r.data),

  create: (dto: CreateSliderDto) =>
    api.post<Slider>(`${BASE}/slider`, dto).then((r) => r.data),

  update: (id: string, dto: UpdateSliderDto) =>
    api.patch<Slider>(`${BASE}/slider/${id}`, dto).then((r) => r.data),

  reorder: (items: ReorderItem[]) =>
    api.patch(`${BASE}/slider/reorder`, { items }).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`${BASE}/slider/${id}`).then((r) => r.data),
}

// ── Berita ────────────────────────────────────────────────────────────────────
export const beritaApi = {
  list: (query: QueryBeritaDto = {}, isAdmin = false) =>
    api
      .get<BeritaListResponse>(`${BASE}/berita`, {
        params: { ...query, ...(isAdmin ? { admin: 'true' } : {}) },
      })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<Berita>(`${BASE}/berita/${id}`).then((r) => r.data),

  getBySlug: (slug: string) =>
    api.get<Berita>(`${BASE}/berita/slug/${slug}`).then((r) => r.data),

  create: (dto: CreateBeritaDto) =>
    api.post<Berita>(`${BASE}/berita`, dto).then((r) => r.data),

  update: (id: string, dto: UpdateBeritaDto) =>
    api.patch<Berita>(`${BASE}/berita/${id}`, dto).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`${BASE}/berita/${id}`).then((r) => r.data),

  // Kategori
  listKategori: () =>
    api.get<KategoriBerita[]>(`${BASE}/berita/kategori`).then((r) => r.data),

  createKategori: (dto: { nama: string; slug: string }) =>
    api.post<KategoriBerita>(`${BASE}/berita/kategori`, dto).then((r) => r.data),

  removeKategori: (id: string) =>
    api.delete(`${BASE}/berita/kategori/${id}`).then((r) => r.data),
}

// ── Galeri ────────────────────────────────────────────────────────────────────
export const galeriApi = {
  listKategori: (onlyActive = false) =>
    api
      .get<KategoriGaleri[]>(`${BASE}/galeri/kategori`, {
        params: onlyActive ? {} : { all: 'true' },
      })
      .then((r) => r.data),

  getKategori: (id: string) =>
    api.get<KategoriGaleri>(`${BASE}/galeri/kategori/${id}`).then((r) => r.data),

  createKategori: (dto: CreateKategoriGaleriDto) =>
    api.post<KategoriGaleri>(`${BASE}/galeri/kategori`, dto).then((r) => r.data),

  updateKategori: (id: string, dto: Partial<CreateKategoriGaleriDto>) =>
    api.patch<KategoriGaleri>(`${BASE}/galeri/kategori/${id}`, dto).then((r) => r.data),

  removeKategori: (id: string) =>
    api.delete(`${BASE}/galeri/kategori/${id}`).then((r) => r.data),

  createFoto: (dto: CreateGaleriFotoDto) =>
    api.post<GaleriFoto>(`${BASE}/galeri/foto`, dto).then((r) => r.data),

  bulkCreateFoto: (items: CreateGaleriFotoDto[]) =>
    api
      .post<{ message: string; count: number }>(`${BASE}/galeri/foto/bulk`, { items })
      .then((r) => r.data),

  removeFoto: (id: string) =>
    api.delete(`${BASE}/galeri/foto/${id}`).then((r) => r.data),
}

// ── Fitur Aplikasi ────────────────────────────────────────────────────────────
export const fiturApi = {
  list: (onlyActive = false) =>
    api
      .get<FiturAplikasi[]>(`${BASE}/fitur`, { params: onlyActive ? {} : { all: 'true' } })
      .then((r) => r.data),

  create: (dto: CreateFiturDto) =>
    api.post<FiturAplikasi>(`${BASE}/fitur`, dto).then((r) => r.data),

  update: (id: string, dto: UpdateFiturDto) =>
    api.patch<FiturAplikasi>(`${BASE}/fitur/${id}`, dto).then((r) => r.data),

  reorder: (items: ReorderItem[]) =>
    api.patch(`${BASE}/fitur/reorder`, { items }).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`${BASE}/fitur/${id}`).then((r) => r.data),
}

// ── Menu ──────────────────────────────────────────────────────────────────────
export const menuApi = {
  list: (onlyActive = false) =>
    api
      .get<Menu[]>(`${BASE}/menu`, { params: onlyActive ? {} : { all: 'true' } })
      .then((r) => r.data),

  create: (dto: CreateMenuDto) =>
    api.post<Menu>(`${BASE}/menu`, dto).then((r) => r.data),

  update: (id: string, dto: UpdateMenuDto) =>
    api.patch<Menu>(`${BASE}/menu/${id}`, dto).then((r) => r.data),

  reorder: (items: ReorderItem[]) =>
    api.patch(`${BASE}/menu/reorder`, { items }).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`${BASE}/menu/${id}`).then((r) => r.data),
}
