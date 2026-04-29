// ── Enums ─────────────────────────────────────────────────────────────────────
export type StatusBerita = 'DRAFT' | 'PUBLISHED'
export type TipeMenu     = 'ONEPAGE' | 'LINK'

// ── Profil Madrasah ───────────────────────────────────────────────────────────
export interface ProfilMadrasah {
  id:          string
  nama:        string
  visi:        string
  misi:        string
  sejarah:     string | null
  sambutan:    string | null
  namaKepala:  string
  fotoKepala:  string | null
  foto1Url:    string | null
  foto2Url:    string | null
  foto3Url:    string | null
  alamat:      string
  telepon:     string
  email:       string
  website:     string | null
  akreditasi:  string | null
  createdAt:   string
  updatedAt:   string
}

export interface UpsertProfilDto {
  nama:        string
  visi:        string
  misi:        string
  sejarah?:    string | null
  sambutan?:   string | null
  namaKepala:  string
  fotoKepala?: string | null
  foto1Url?:   string | null
  foto2Url?:   string | null
  foto3Url?:   string | null
  alamat:      string
  telepon:     string
  email:       string
  website?:    string | null
  akreditasi?: string | null
}

// ── Slider ────────────────────────────────────────────────────────────────────
export interface Slider {
  id:          string
  judul:       string
  deskripsi:   string | null
  imageUrl:    string
  linkUrl:     string | null
  urutan:      number
  isActive:    boolean
  createdAt:   string
  updatedAt:   string
}

export interface CreateSliderDto {
  judul:       string
  deskripsi?:  string | null
  imageUrl:    string
  linkUrl?:    string | null
  urutan:      number
  isActive?:   boolean
}

export type UpdateSliderDto = Partial<CreateSliderDto>

export interface ReorderItem {
  id:     string
  urutan: number
}

// ── Berita ────────────────────────────────────────────────────────────────────
export interface KategoriBerita {
  id:   string
  nama: string
  slug: string
}

export interface BeritaAuthor {
  id:      string
  profile: { namaLengkap: string; fotoUrl: string | null } | null
}

export interface Berita {
  id:          string
  judul:       string
  slug:        string
  konten:      string
  excerpt:     string | null
  kategoriId:  string | null
  fotoUrl:     string | null
  authorId:    string
  status:      StatusBerita
  publishedAt: string | null
  viewCount:   number
  createdAt:   string
  updatedAt:   string
  kategori:    KategoriBerita | null
  author:      BeritaAuthor
}

export interface CreateBeritaDto {
  judul:        string
  slug:         string
  konten:       string
  excerpt?:     string | null
  kategoriId?:  string | null
  fotoUrl?:     string | null
  status?:      StatusBerita
  publishedAt?: string | null
}

export type UpdateBeritaDto = Partial<CreateBeritaDto>

export interface QueryBeritaDto {
  page?:       number
  limit?:      number
  status?:     StatusBerita
  kategoriId?: string
  search?:     string
}

export interface BeritaListResponse {
  data:    Berita[]
  total:   number
  page:    number
  limit:   number
  lastId?: string
}

// ── Galeri ────────────────────────────────────────────────────────────────────
export interface KategoriGaleri {
  id:          string
  nama:        string
  deskripsi:   string | null
  coverUrl:    string | null
  urutan:      number
  isActive:    boolean
  createdAt:   string
  updatedAt:   string
  _count?:     { foto: number }
  foto?:       GaleriFoto[]
}

export interface GaleriFoto {
  id:          string
  kategoriId:  string
  judul:       string | null
  deskripsi:   string | null
  fotoUrl:     string
  urutan:      number
  isActive:    boolean
  createdAt:   string
  updatedAt:   string
}

export interface CreateKategoriGaleriDto {
  nama:         string
  deskripsi?:   string | null
  coverUrl?:    string | null
  urutan?:      number
  isActive?:    boolean
}

export interface CreateGaleriFotoDto {
  kategoriId:  string
  judul?:      string | null
  deskripsi?:  string | null
  fotoUrl:     string
  urutan?:     number
  isActive?:   boolean
}

// ── Fitur Aplikasi ────────────────────────────────────────────────────────────
export interface FiturAplikasi {
  id:          string
  judul:       string
  deskripsi:   string
  fotoUrl:     string | null
  urutan:      number
  isActive:    boolean
  createdAt:   string
  updatedAt:   string
}

export interface CreateFiturDto {
  judul:       string
  deskripsi:   string
  fotoUrl?:    string | null
  urutan:      number
  isActive?:   boolean
}

export type UpdateFiturDto = Partial<CreateFiturDto>

// ── Menu ──────────────────────────────────────────────────────────────────────
export interface Menu {
  id:          string
  label:       string
  tipe:        TipeMenu
  target:      string
  urutan:      number
  isActive:    boolean
  createdAt:   string
  updatedAt:   string
}

export interface CreateMenuDto {
  label:       string
  tipe:        TipeMenu
  target:      string
  urutan:      number
  isActive?:   boolean
}

export type UpdateMenuDto = Partial<CreateMenuDto>
