import { UserRole } from './enums'

/** Struktur user sesuai response backend */
export interface AuthUser {
  id:          string
  email:       string
  role:        UserRole
  namaLengkap: string
  fotoUrl:     string | null
  isVerified:  boolean
  nisn:        string | null
  nip:         string | null
  isWaliKelas: boolean
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface LoginDto {
  email: string
  password: string
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
}
