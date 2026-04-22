import type { HariEnum } from './jadwal.types'

export interface JadwalMingguanItem {
  id:          string
  hari:        HariEnum
  jamMulai:    string
  jamSelesai:  string
  urutanJam:   number
  jpSesi:      number
  bobotMapel:  number
  namaMapel:   string
  namaGuru:    string
  ruangan:     string | null
  namaKelas:   string
  isActive:    boolean
}

export interface JadwalMingguanResponse {
  totalJp: number
  data:    JadwalMingguanItem[]
}

// Hari ini — masih raw, normalize di widget
export interface JadwalHariIniRaw {
  id:            string
  hari:          HariEnum
  jamMulai:      string
  jamSelesai:    string
  urutanJam?:    number
  jpSesi?:       number
  namaMapel:     string
  namaGuru?:     string
  namaKelas?:    string
  ruangan:       string | null
  isOngoing:     boolean
}
