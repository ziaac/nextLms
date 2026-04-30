import type {
  StatusTagihan,
  StatusPembayaran,
  MetodePembayaran,
} from '@/types/enums'

// ─── Kategori Pembayaran ───────────────────────────────────────────
export interface KategoriPembayaran {
  id: string
  kode: string
  nama: string
  deskripsi: string | null
  isRecurring: boolean
  isMandatory: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateKategoriPembayaranDto {
  kode: string
  nama: string
  deskripsi?: string
  isRecurring?: boolean
  isMandatory?: boolean
}

export interface UpdateKategoriPembayaranDto extends Partial<CreateKategoriPembayaranDto> {}

export interface QueryKategoriPembayaranDto {
  page?: number
  limit?: number
  isActive?: boolean
  search?: string
}

// ─── Tagihan ──────────────────────────────────────────────────────
export interface Tagihan {
  id: string
  siswaId: string
  kategoriPembayaranId: string
  tahunAjaranId: string
  bulan: number
  tahun: number
  totalTagihan: string
  totalBayar: string
  sisaBayar: string
  diskon: string | null
  denda: string | null
  tanggalJatuhTempo: string | null
  status: StatusTagihan
  createdAt: string
  updatedAt: string
  siswa?: {
    id: string
    profile: { namaLengkap: string; nisn: string | null } | null
  }
  kategoriPembayaran?: { kode: string; nama: string }
  tahunAjaran?: { nama: string }
  pembayaran?: Pembayaran[]
}

export interface CreateTagihanDto {
  siswaId: string
  kategoriPembayaranId: string
  tahunAjaranId: string
  bulan: number
  tahun: number
  jumlah: number
  diskon?: number
  denda?: number
  tanggalJatuhTempo?: string
}

export interface BulkGenerateTagihanDto {
  kategoriPembayaranId: string
  tahunAjaranId: string
  bulan: number
  tahun: number
  jumlah: number
  tanggalJatuhTempo?: string
  kelasId?: string
}

export interface QueryTagihanDto {
  page?: number
  limit?: number
  status?: StatusTagihan
  tahunAjaranId?: string
  kategoriPembayaranId?: string
  siswaId?: string
  search?: string
}

export interface RekapSiswaResponse {
  siswaId: string
  totalTagihan: number
  totalBayar: number
  sisaTagihan: number
  jumlahTagihan: number
  jumlahLunas: number
  jumlahBelumBayar: number
}

export interface RekapKelasResponse {
  kelasId: string
  namaKelas: string
  totalTagihan: number
  totalTerkumpul: number
  jumlahSiswa: number
  jumlahLunas: number
}

export interface QueryRekapKelasDto {
  tahunAjaranId: string
  kategoriPembayaranId?: string
  kelasId?: string
}

// ─── Pembayaran ───────────────────────────────────────────────────
export interface Pembayaran {
  id: string
  tagihanId: string
  nomorTransaksi: string
  jumlahBayar: string
  metodePembayaran: MetodePembayaran
  tanggalBayar: string
  buktiBayarUrl: string | null
  catatanKasir: string | null
  referensiBank: string | null
  statusPembayaran: StatusPembayaran
  createdBy: string
  createdAt: string
  updatedAt: string
  tagihan?: Tagihan
  creator?: {
    id: string
    profile: { namaLengkap: string } | null
  }
}

export interface CreatePembayaranDto {
  tagihanId: string
  jumlahBayar: number
  metodePembayaran: MetodePembayaran
  tanggalBayar: string
  buktiBayarUrl?: string
  catatanKasir?: string
  referensiBank?: string
}

export interface DigitalPaymentDto {
  tagihanId: string
  jumlahBayar: number
  metodePembayaran: MetodePembayaran
  tanggalBayar: string
  referensiBank: string
}

export interface VerifikasiPembayaranDto {
  status: 'VERIFIED' | 'REJECTED'
  catatanKasir?: string
}

export interface QueryPembayaranDto {
  page?: number
  limit?: number
  tagihanId?: string
  siswaId?: string
  statusPembayaran?: StatusPembayaran
  metodePembayaran?: MetodePembayaran
  tanggalMulai?: string
  tanggalSelesai?: string
}

export interface RekapPembayaranResponse {
  periode: { dari: string; sampai: string }
  jumlahTransaksi: number
  totalTerkumpul: number
  perMetode: Record<string, { count: number; total: number }>
}

export interface RekapQueryDto {
  tanggalMulai: string
  tanggalSelesai: string
  metodePembayaran?: MetodePembayaran
}

// ─── Payment Gateway ──────────────────────────────────────────────
export interface CreateSnapTokenDto {
  tagihanId: string
  jumlahBayar: number
  metodePembayaran: MetodePembayaran
}

export interface SnapTokenResponse {
  snapToken: string
  orderId: string
}

export interface CreateDokuCheckoutDto {
  tagihanId: string
  jumlahBayar: number
  metodePembayaran: MetodePembayaran
}

export interface DokuCheckoutResponse {
  checkoutUrl: string
  invoiceNumber: string
}

// ─── System Setting ───────────────────────────────────────────────
export interface SystemSetting {
  key: string
  value: string
  description: string | null
  category: string | null
  updatedAt: string
}

export type PaymentProcessor = 'midtrans' | 'doku'
