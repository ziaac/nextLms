import type { StatusPerizinan, JenisPerizinan } from './enums'

export interface PerizinanPayload {
  userId:         string
  jenis:          JenisPerizinan
  tanggalMulai:   string
  tanggalSelesai: string
  alasan:         string
  fileBuktiUrl?:  string
}

export interface PerizinanUserProfile {
  namaLengkap: string
  nisn?:       string
}

export interface PerizinanUser {
  id:       string
  role:     string
  profile?: PerizinanUserProfile
}

export interface PerizinanApprover {
  id:       string
  profile?: { namaLengkap: string }
}

export interface PerizinanItem {
  id:               string
  userId:           string
  jenis:            JenisPerizinan
  tanggalMulai:     string
  tanggalSelesai:   string
  alasan:           string
  fileBuktiUrl?:    string | null
  status:           StatusPerizinan
  catatanApproval?: string | null
  approvedBy?:      string | null
  approvedAt?:      string | null
  createdAt:        string
  updatedAt:        string
  user?:            PerizinanUser
  approver?:        PerizinanApprover | null
}

export interface PerizinanMeta {
  total:    number
  page:     number
  limit:    number
  lastPage: number
}

export interface PerizinanListResponse {
  data: PerizinanItem[]
  meta: PerizinanMeta
}

export interface PerizinanApprovalPayload {
  status:           StatusPerizinan
  catatanApproval?: string
}

export interface PerizinanRevisiPayload {
  jenis?:          JenisPerizinan
  tanggalMulai?:   string
  tanggalSelesai?: string
  alasan?:         string
  fileBuktiUrl?:   string | null
}

export interface PerizinanQueryParams {
  page?:           number
  limit?:          number
  userId?:         string
  jenis?:          JenisPerizinan
  status?:         StatusPerizinan
  tanggalMulai?:   string
  tanggalSelesai?: string
}

export interface SiswaPerKelasItem {
  id:    string
  nama:  string
  nisn:  string
  rekap: { H: number; I: number; S: number; A: number }
}
