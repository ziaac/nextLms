export type HariEnum =
  | 'SENIN' | 'SELASA' | 'RABU' | 'KAMIS' | 'JUMAT' | 'SABTU'

export const HARI_LIST: HariEnum[] = [
  'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU',
]

// ─── MasterJam (ringkas) ─────────────────────────────────────
export interface MasterJamRef {
  id:          string
  namaSesi:    string
  jamMulai:    string
  jamSelesai:  string
  jumlahMenit: number
  bobotJp:     number
  tipeHari:    string
  isIstirahat: boolean
  urutan:      number
}

// ─── JadwalPelajaran ─────────────────────────────────────────
export interface JadwalPelajaran {
  id:              string
  kelasId:         string
  semesterId:      string
  mataPelajaranId: string
  guruId:          string
  hari:            HariEnum
  masterJamId:     string
  ruanganId:       string | null
  isActive:        boolean
  createdAt:       string
  updatedAt:       string
  masterJam?:      MasterJamRef
  kelas?: {
    namaKelas:     string
    tingkatKelas?: { nama: string }
  }
  semester?: {
    nama:          string
    tahunAjaran?:  { nama: string }
  }
  mataPelajaran?: {
    id:                     string
    mataPelajaranTingkatId: string
    kelasId:                string
    kkm:                    number
    bobot:                  number
    isActive:               boolean
    mataPelajaranTingkat?: {
      id:          string
      masterMapel: { id: string; nama: string; kode: string; kategori: string }
    }
  }
  guru?: {
    id:      string
    email:   string
    role:    string
    profile: { namaLengkap: string }
  }
  ruangan?: RuanganRef | null
}

export interface RuanganRef {
  id:   string
  kode: string
  nama: string
}

// ─── Roster ──────────────────────────────────────────────────
export interface RosterItem {
  jadwalId:      string
  jamMulai:      string
  jamSelesai:    string
  mataPelajaran: { id: string; nama: string; kode: string }
  guru:          { id: string; namaLengkap: string }
  ruangan:       RuanganRef | null
}

export interface RosterKelasResponse {
  kelas:    { id: string; namaKelas: string; tingkatKelas: { nama: string } }
  semester: string
  roster:   Record<HariEnum, RosterItem[]>
  totalJam: number
}

export interface RosterGuruRosterItem extends Omit<RosterItem, 'guru'> {
  kelas: { id: string; namaKelas: string }
}

export interface RosterGuruResponse {
  guruId:   string
  semester: string
  roster:   Record<HariEnum, RosterGuruRosterItem[]>
  totalJam: number
}

// ─── Ringkasan Semua Kelas ───────────────────────────────────
// GET /jadwal-pelajaran/ringkasan-semua-kelas?semesterId=
export interface RingkasanMapelItem {
  nama: string   // nama mapel
  jam:  number   // total jam/bobot
}

export interface RingkasanKelasItem {
  kelasId:      string
  namaKelas:    string
  tingkat?:     string
  jumlahMapel:  number          // ← dari tabel MataPelajaran (bukan dari jadwal)
  totalJam:     number
  rincianMapel: RingkasanMapelItem[]
}

// ─── Ringkasan Satu Kelas ────────────────────────────────────
// GET /jadwal-pelajaran/ringkasan-kelas?semesterId=&kelasId=
export interface RingkasanDetailHari {
  hari:  string
  jam:   string   // "07:15 - 08:45"
  bobot: number
}

export interface RingkasanRincianItem {
  namaMapel: string
  guru:      string
  totalJam:  number
  detail:    RingkasanDetailHari[]
}

export interface RingkasanKelasDetailResponse {
  kelasId:  string
  totalJam: number
  rincian:  RingkasanRincianItem[]
}

// ─── Beban Mengajar ──────────────────────────────────────────
// GET /jadwal-pelajaran/beban-mengajar?guruId=&semesterId=
export interface BebanDetailItem {
  kelas:  string
  hari:   string
  jam:    string   // "07:15 - 08:45"
  bobot:  number
}

export interface BebanRincianItem {
  namaMapel: string
  totalJam:  number
  detail:    BebanDetailItem[]
}

export interface BebanMengajarResponse {
  guruId:        string
  totalSemuaJam: number
  rincian:       BebanRincianItem[]
}

// ─── Ketersediaan ────────────────────────────────────────────
export interface KetersediaanRequest {
  semesterId:  string
  hari:        HariEnum
  masterJamId: string
}

export interface GuruAvailable    { id: string; namaLengkap: string }
export interface RuanganAvailable { id: string; kode: string; nama: string }
export interface KetersediaanResponse {
  message:          string
  guruTersedia:     GuruAvailable[]
  ruanganTersedia:  RuanganAvailable[]
}

// ─── Rekap Guru ──────────────────────────────────────────────
export interface RekapGuruMapelItem {
  mataPelajaranTingkatId: string
  namaMapel:  string
  kodeMapel:  string
  tingkat:    string
  jenjang:    string
}

export interface RekapGuruItem {
  guruId:              string
  namaLengkap:         string
  nip:                 string
  totalMapelDiajarkan: number
  daftarMapel:         RekapGuruMapelItem[]
}

// ─── Payloads ────────────────────────────────────────────────
export interface CreateJadwalPayload {
  hari:            HariEnum
  masterJamId:     string
  kelasId:         string
  semesterId:      string
  guruId:          string
  mataPelajaranId: string
  ruanganId?:      string
}

export interface BulkJadwalItem {
  mataPelajaranId: string
  guruId:          string
  ruanganId?:      string
  hari:            HariEnum
  masterJamId:     string
}

export interface BulkJadwalPayload {
  kelasId:    string
  semesterId: string
  jadwal:     BulkJadwalItem[]
}

export interface BulkMapelJadwalItem {
  kelasId:     string
  ruanganId?:  string
  hari:        HariEnum
  masterJamId: string
}

export interface BulkMapelJadwalPayload {
  semesterId:      string
  mataPelajaranId: string
  guruId:          string
  jadwal:          BulkMapelJadwalItem[]
}

export interface CopySemesterPayload {
  sourceSemesterId: string
  targetSemesterId: string
}

// ─── Filter Params ───────────────────────────────────────────
export interface FilterJadwalParams {
  semesterId?: string
  kelasId?:    string
  guruId?:     string
  hari?:       HariEnum
  isActive?:   boolean
}

export interface FilterRingkasanParams {
  semesterId:      string
  tingkatKelasId?: string
}

// ─── Export Params ───────────────────────────────────────────
export interface ExportJadwalSekolahParams { semesterId: string }
export interface ExportJadwalKelasParams   { semesterId: string; kelasId: string }
export interface ExportJadwalGuruParams    { semesterId: string; guruId?: string }
