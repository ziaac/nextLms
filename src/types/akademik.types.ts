// ============================================================
// akademik.types.ts — shape sesuai response API aktual
// ============================================================

export type Jenjang       = 'SMA' | 'MA'
export type KategoriMapel = 'WAJIB' | 'PEMINATAN' | 'LINTAS_MINAT' | 'MULOK' | 'PENGEMBANGAN_DIRI'
export type KelompokMapel = 'A' | 'B' | 'C'
export type HariEnum      = 'SENIN' | 'SELASA' | 'RABU' | 'KAMIS' | 'JUMAT' | 'SABTU' | 'MINGGU'
export type NamaSemester  = 'GANJIL' | 'GENAP'

// ── TingkatKelas ──────────────────────────────────────────────
export interface TingkatKelas {
  id:        string
  nama:      string
  jenjang:   Jenjang
  urutan:    number
  createdAt: string
}

export interface CreateTingkatKelasPayload {
  nama:    string
  jenjang: Jenjang
  urutan:  number
}
export interface UpdateTingkatKelasPayload extends Partial<CreateTingkatKelasPayload> {}

// ── MasterMapel ───────────────────────────────────────────────
export interface MasterMapel {
  id:        string
  kode:      string
  nama:      string
  kategori:  KategoriMapel
  kelompok:  KelompokMapel
  createdAt: string
  updatedAt: string
}

export interface CreateMasterMapelPayload {
  kode:     string
  nama:     string
  kategori: KategoriMapel
  kelompok: KelompokMapel
}
export interface UpdateMasterMapelPayload extends Partial<CreateMasterMapelPayload> {}
export interface FilterMasterMapelParams {
  search?:   string
  kategori?: KategoriMapel
  kelompok?: KelompokMapel
}

// ── Guru ──────────────────────────────────────────────────────
export interface GuruItem {
  id:      string
  profile: {
    namaLengkap: string
    nip?:        string | null
    fotoUrl?:    string | null
  }
}

// GuruMapel — dari response /mata-pelajaran-tingkat
export interface GuruMapel {
  id:                     string
  mataPelajaranTingkatId: string
  guruId:                 string
  guru:                   GuruItem
}

// ── MataPelajaranTingkat ──────────────────────────────────────
// Shape sesuai response GET /mata-pelajaran-tingkat/:id
export interface MataPelajaranTingkat {
  id:             string
  masterMapelId:  string
  tingkatKelasId: string
  createdAt:      string
  updatedAt:      string
  masterMapel:    Pick<MasterMapel, 'id' | 'kode' | 'nama' | 'kategori' | 'kelompok'>
  tingkatKelas:   Pick<TingkatKelas, 'id' | 'nama' | 'jenjang'>
  guruMapel:      GuruMapel[]
}

export interface CreateMapelTingkatPayload {
  masterMapelId:  string
  tingkatKelasId: string
}
export interface SetGuruPoolPayload { guruIds: string[] }

// ── Pengajar (team teaching) — shape dari response /mata-pelajaran
// CATATAN: tidak ada mataPelajaranId/createdAt di response aktual
export interface PengajarMapel {
  isKoordinator: boolean
  guru: {
    id:      string
    profile: { namaLengkap: string; fotoUrl: string | null }
  }
}

// ── Jadwal — shape dari response /mata-pelajaran
export interface JadwalSingkat {
  id:       string
  hari:     HariEnum
  masterJam: {
    id:         string
    namaSesi:   string
    jamMulai:   string
    jamSelesai: string
  } | null
  ruangan: {
    id:   string
    kode: string
    nama: string
  } | null
  guru?: {
    id:      string
    profile: { namaLengkap: string }
  }
}

// ── Semester — shape dari response /mata-pelajaran
export interface SemesterSingkat {
  id:      string
  nama:    NamaSemester
  urutan:  number
  isActive: boolean
}

// ── Kelas — shape dari response /mata-pelajaran
export interface KelasSingkat {
  id:           string
  namaKelas:    string
  tahunAjaranId: string
  ruanganId?:    string
}

// ── _count — shape dari response /mata-pelajaran
export interface MataPelajaranCount {
  materiPelajaran: number
  tugas:           number
  absensi:         number
  penilaian:       number
}

// ── MataPelajaran ─────────────────────────────────────────────
// Shape sesuai response GET /mata-pelajaran (wrapped { data, meta })
export interface MataPelajaran {
  id:                     string
  mataPelajaranTingkatId: string
  semesterId:             string
  kelasId:                string
  kkm:                    number
  bobot:                  number
  targetPertemuan:        number
  ruanganId?:       string
  isActive:               boolean
  createdAt:              string
  updatedAt:              string
  mataPelajaranTingkat: {
    id:           string
    masterMapelId: string
    tingkatKelasId: string
    masterMapel:  Pick<MasterMapel, 'id' | 'kode' | 'nama' | 'kategori' | 'kelompok'>
    tingkatKelas: Pick<TingkatKelas, 'id' | 'nama' | 'jenjang'>
  }
  ruangan?: {           // Tambahkan relasi objeknya agar bisa tampil di UI
    id:   string;
    nama: string;
    kode: string;
  };
  semester:        SemesterSingkat
  kelas:           KelasSingkat
  pengajar:        PengajarMapel[]
  jadwalPelajaran: JadwalSingkat[]
  _count:          MataPelajaranCount
}

// ── Pagination wrapper ────────────────────────────────────────
export interface PaginatedResponse<T> {
  data:  T[]
  meta: {
    total:      number
    page:       number
    limit:      number
    totalPages: number
  }
}

// ── DTO ───────────────────────────────────────────────────────
export interface CreateMataPelajaranPayload {
  mataPelajaranTingkatId: string
  semesterId:             string
  kelasId:                string
  kkm?:                   number
  bobot?:                 number
  targetPertemuan?:       number
  guruIds?:               string[]
  ruanganId?: string
}

export interface UpdateMataPelajaranPayload {
  kkm?:     number
  bobot?:   number
  targetPertemuan?:       number
  ruanganId?:       string
  guruIds?: string[]
}

export interface FilterMataPelajaranParams {
  semesterId?:             string
  kelasId?:                string
  tingkatKelasId?:         string
  guruId?:                 string
  mataPelajaranTingkatId?: string
  kategori?:               KategoriMapel
  kelompok?:               KelompokMapel
  search?:                 string
  isActive?:               boolean
  page?:                   number
  limit?:                  number
  semesterIsActive?:       boolean
}

// ── Stat Ringkasan ────────────────────────────────────────────
export interface StatAbsensiMapel {
  hadir:           number
  sakit:           number
  izin:            number
  alpa:            number
  total:           number
  persentaseHadir: number
}

export interface StatTugasMapel {
  totalTugas:           number
  sudahDikumpulkan:     number
  belumDikumpulkan:     number
  persentaseKetuntasan: number
}

export interface StatPenilaianMapel {
  totalNilai: number
  rataRata:   number | null
}

export interface StatMateriMapel {
  totalMateri: number
  published:   number
}

// ── Todo ──────────────────────────────────────────────────────
export type TodoJenis = 'TUGAS_BELUM_KUMPUL' | 'ABSENSI_BELUM_ISI' | 'ABSENSI_KOSONG'
export interface TodoItem {
  jenis:           TodoJenis
  label:           string
  mataPelajaranId: string
}

// ── Report Guru Saya ──────────────────────────────────────────
// Shape dari GET /report/guru/saya

export interface JadwalMengajarItem {
  hari:  string  // "SENIN", "SELASA", dll
  kelas: string  // "X-A 2026"
  mapel: string  // "Bahasa Arab"
}

export interface TugasStatsItem {
  judul:        string
  kelas:        string
  mapel:        string
  totalSiswa:   number
  sudahSubmit:  number
}

export interface StatistikGuruResponse {
  guruId:          string
  tahunAjaranId:   string
  semesterId:      string
  mataPelajaranId: string | null
  periode: {
    bulan: number
    tahun: number
  }
  jadwalMengajar:    JadwalMengajarItem[]
  tugas:             TugasStatsItem[]
  totalNilaiDiinput: number
  totalSesiAbsensi:  number
}

// ── Report Siswa Overview ─────────────────────────────────────
// Shape dari GET /report/siswa/overview

export interface TimPengajarSingkat {
  id:            string
  nama:          string
  foto:          string | null
  isKoordinator: boolean
}

export interface JadwalSiswaItem {
  hari:      string  // "SENIN", "SELASA", dll
  jamMulai:  string
  jamSelesai: string
  ruangan:   string | null
}

export interface MapelSiswaItem {
  id:          string   // mataPelajaranId
  kodeMapel:   string
  namaMapel:   string
  kategori:    string
  kkm:         number
  timPengajar: TimPengajarSingkat[]
  jadwal:      JadwalSiswaItem[]  // array jadwal per minggu
  stats: {
    absensiPercentage: number
    tugasSelesai:      number
    tugasTotal:        number
    totalMateri:       number
    materiDibaca:      number
  }
}

export interface SiswaOverviewResponse {
  overview: {
    totalMapel: number
  }
  mapel: MapelSiswaItem[]
}

// ── Orang Tua Anak ────────────────────────────────────────────
// Shape dari GET /orang-tua/anak
// CATATAN: Sesuaikan setelah seed akun orang tua
export interface AnakOrangTua {
  id:      string   // siswaId
  profile: {
    namaLengkap: string
    nisn:        string | null
    fotoUrl:     string | null
  }
  kelasAktif?: {
    id:       string
    namaKelas: string
    tahunAjaran: { nama: string }
  } | null
}

// ── Todo Siswa ────────────────────────────────────────────────
// Shape dari GET /report/siswa/todo

export interface TugasPendingItem {
  id:              string
  mataPelajaranId: string  // tersedia di backend — untuk filter per card
  judul:           string
  tipe:            string   // 'INDIVIDU' | 'KELOMPOK'
  namaMapel:       string
  deadline:        string   // ISO date
}

export interface AbsensiPendingItem {
  jadwalId:        string
  mataPelajaranId: string
  namaMapel:       string
  jamMulai:        string
  jamSelesai:      string
  status:          'AKSI_DIBUTUHKAN' | 'MENUNGGU_GURU'
}

export interface MateriPerMapelItem {
  mataPelajaranId: string
  namaMapel:       string
  belumDibaca:     number
}

export interface TodoSiswaResponse {
  tugasPending:    TugasPendingItem[]
  absensiPending:  AbsensiPendingItem[]
  materiPerMapel:  MateriPerMapelItem[]
}

// ── Todo Guru ─────────────────────────────────────────────────
// Shape dari GET /report/guru/todo

export interface TugasMenungguPenilaianItem {
  pengumpulanTugasId: string
  tugasId:            string
  judulTugas:         string
  namaMapel:          string
  kelas:              string
  namaSiswa:          string
  fotoSiswa:          string | null
  tanggalSubmit:      string
  statusLabel:        string
}

export type StatusSesiGuru =
  | 'AKSI_DIBUTUHKAN'
  | 'BELUM_WAKTUNYA'
  | 'KELAS_SUDAH_DIBUKA'
  | 'TERLEWAT'

export interface JadwalHariIniItem {
  jadwalId:   string
  kelas:      string
  namaMapel:  string
  ruangan:    string | null
  jamMulai:   string
  jamSelesai: string
  statusSesi: StatusSesiGuru
}

export interface TodoGuruResponse {
  menungguPenilaian: TugasMenungguPenilaianItem[]
  jadwalHariIni:     JadwalHariIniItem[]
}

// ── Mapel Overview (per kelas) ────────────────────────────────
// Shape dari GET /report/mapel/overview?tahunAjaranId=&kelasId=

export interface MapelOverviewItem {
  masterMapelId:   string
  mataPelajaranId: string | null  // null jika mode global se-sekolah
  namaMapel:       string
  kategori:        string
  totalKelasDiajar: number
  timPengajar:     string[]
  performaGlobal: {
    rataRataKehadiranSiswa:  number  // persen
    rataRataNilaiRaport:     number  // 0-100
    persentaseTugasSelesai:  number  // persen
  }
}

// ── Bulk Per Kelas ────────────────────────────────────────────
export interface BulkPerKelasPreviewItem {
  kelasId:       string
  namaKelas:     string
  kodeKelas:     string | null
  alreadyExists: boolean
}

export interface BulkPerKelasPreviewResponse {
  meta: {
    semester: {
      id:       string
      nama:     string
      isActive: boolean
      tahunAjaran: { id: string; nama: string }
    }
    mataPelajaran: {
      id:   string
      kode: string
      nama: string
      tingkatKelas: { id: string; nama: string; jenjang: string }
    }
    kkm:             number
    bobot:           number
    targetPertemuan: number
    totalKelas:      number
    totalBaru:       number
    totalSkip:       number
  }
  items: BulkPerKelasPreviewItem[]
}

export interface BulkPerKelasPreviewPayload {
  semesterId:             string
  tingkatKelasId:         string
  mataPelajaranTingkatId: string
  kkm?:                   number
  bobot?:                 number
  targetPertemuan?:       number
}

export interface BulkPerKelasExecutePayload {
  semesterId:             string
  mataPelajaranTingkatId: string
  kkm?:                   number
  bobot?:                 number
  targetPertemuan?:       number
}

export interface BulkPerKelasExecuteResponse {
  message:        string
  totalDiproses:  number
  results:        { id: string; kelasId: string }[]
}
