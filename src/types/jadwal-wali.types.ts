export interface SesiWali {
  id:      string
  jam:     string
  mapel:   string
  guru:    string
  nip:     string
  ruangan: string | null
}

// jadwal = Record<HariEnum, SesiWali[]> (object, bukan array)
export interface KelasWali {
  kelasId:   string
  namaKelas: string
  jadwal:    Record<string, SesiWali[]>
}

// Response adalah array langsung
export type JadwalKelasWaliResponse = KelasWali[]
