
import { UserItem } from './users.types'
import { MataPelajaran } from './akademik.types'
import { MateriItem } from './materi-pelajaran.types'

export enum TujuanTugas {
  TUGAS_HARIAN = 'TUGAS_HARIAN',
  PENGAYAAN = 'PENGAYAAN',
  REMEDIAL = 'REMEDIAL',
  PROYEK = 'PROYEK',
  UTS = 'UTS',
  UAS = 'UAS',
  PORTOFOLIO = 'PORTOFOLIO',
  PRAKTIKUM = 'PRAKTIKUM',
  LAINNYA = 'LAINNYA'
}

export enum BentukTugas {
  FILE_SUBMISSION = 'FILE_SUBMISSION',
  RICH_TEXT = 'RICH_TEXT',
  HYBRID = 'HYBRID',
  QUIZ_MULTIPLE_CHOICE = 'QUIZ_MULTIPLE_CHOICE',
  QUIZ_MIX = 'QUIZ_MIX'
}

export enum TipeSoalKuis {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  ESSAY = 'ESSAY'
}

export enum ModePengerjaan {
  INDIVIDU = 'INDIVIDU',
  KELOMPOK = 'KELOMPOK'
}

export enum StatusPengumpulan {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  DINILAI = 'DINILAI',
  REVISI = 'REVISI'
}

export interface QuizSettings {
  isAutograde?: boolean
  isAcakSoal?: boolean
  isAcakOpsi?: boolean
  isStrictBrowser?: boolean
}

export interface OpsiKuisPayload {
  teks: string
  gambarUrl?: string
  isCorrect: boolean
  urutan: number
}

export interface SoalKuisPayload {
  pertanyaan: string
  gambarUrl?: string
  tipe: TipeSoalKuis
  bobot: number
  urutan: number
  opsi?: OpsiKuisPayload[]
}

export interface OpsiKuis extends OpsiKuisPayload {
  id: string
  soalId: string
}

export interface SoalKuis extends SoalKuisPayload {
  id: string
  tugasId: string
  opsi?: OpsiKuis[]
}

export interface TugasItem {
  id: string
  materiPelajaranIds?: string[]
  mataPelajaranId: string
  guruId: string
  kelasId: string
  semesterId?: string
  judul: string
  deskripsi?: string
  instruksi?: string
  fileUrls?: string[] | any
  tujuan: TujuanTugas
  bentuk: BentukTugas
  modePengerjaan: ModePengerjaan
  bobot: number
  bobotPenilaian?: any
  tanggalMulai: string
  tanggalSelesai: string
  allowLateSubmission: boolean
  lateSubmissionPenalty?: number
  maxFileSize?: number
  allowedFileTypes: string[]
  isPublished: boolean
  quizSettings?: QuizSettings
  createdAt: string
  updatedAt: string
  
  // Relations (Populated by include)
  materiPelajarans?: MateriItem[]
  mataPelajaran?: MataPelajaran
  kelas?: any
  guru?: UserItem
  _count?: {
    pengumpulanTugas: number
  }
  soalKuis?: SoalKuis[]
}

export interface PengumpulanTugas {
  id: string
  tugasId: string
  siswaId: string
  fileUrls?: string[] | any
  jawaban?: string
  catatan?: string
  tanggalSubmit?: string
  isLate: boolean
  status: StatusPengumpulan
  revisiKe: number
  createdAt: string
  updatedAt: string
  
  // Relations
  tugas?: TugasItem
  siswa?: UserItem
  penilaian?: any[]
}

export interface TugasQueryParams {
  page?: number
  limit?: number
  search?: string
  kelasId?: string
  semesterId?: string
  mataPelajaranId?: string
  tujuan?: TujuanTugas
  bentuk?: BentukTugas
  modePengerjaan?: ModePengerjaan
  isPublished?: boolean
  guruId?: string
  isSemesterAktif?: boolean
}

export interface TugasPayload {
  materiPelajaranIds?: string[]
  mataPelajaranId: string
  kelasId: string
  semesterId?: string
  judul: string
  deskripsi?: string
  instruksi?: string
  fileUrls?: string[]
  tujuan: TujuanTugas
  bentuk: BentukTugas
  modePengerjaan: ModePengerjaan
  bobot: number
  bobotPenilaian?: any
  tanggalMulai: string
  tanggalSelesai: string
  allowLateSubmission: boolean
  lateSubmissionPenalty?: number | null
  maxFileSize?: number | null
  allowedFileTypes?: string[]
  isPublished: boolean
  quizSettings?: QuizSettings
  soalKuis?: SoalKuisPayload[]
}
