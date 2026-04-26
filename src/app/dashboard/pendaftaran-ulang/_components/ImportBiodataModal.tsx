'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Upload, Download, CheckCircle, AlertCircle, FileSpreadsheet, X, Info,
} from 'lucide-react'
import { Modal, Button, Select } from '@/components/ui'
import { useBulkImportBiodata } from '@/hooks/pendaftaran/usePendaftaran'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import type { TahunAjaran } from '@/types/tahun-ajaran.types'

interface Props {
  open: boolean
  onClose: () => void
  defaultTahunAjaranId: string
}

type Step = 'upload' | 'preview' | 'done'

interface ImportResult {
  dibuat: number
  diperbarui: number
  dilewati: number
  error: number
  total: number
  errorDetail: { noPendaftaran: string; alasan: string }[]
}

// Kolom template yang bisa diimport (tanpa upload keys)
const TEMPLATE_HEADERS = [
  'noPendaftaran','namaLengkap','nisn','nis','namaPanggilan',
  'jenisKelamin','tempatLahir','tanggalLahir','agama','noKK',
  'alamat','kelurahan','kecamatan','kabupaten','provinsi','kodePos',
  'noTelepon','noWa','noTelpRumah','email',
  'anakKe','jumlahSaudaraKandung','statusAnak','citaCita','hobi',
  'riwayatPenyakit','kebutuhanKhusus','ukuranBaju','bloodType',
  'tinggi','berat','jenisTinggal','alatTransportasi',
  'jarakKeSekolah','penerimaKIP','nomorKIP','peminatan',
  'namaSekolahAsal','alamatSekolahAsal','npsnSekolahAsal','statusSekolahAsal',
  'statusOrtuKandung',
  'namaAyah','nikAyah','statusAyah','pekerjaanAyah','pendidikanAyah','penghasilanAyah','noTelpAyah',
  'namaIbu','nikIbu','statusIbu','pekerjaanIbu','pendidikanIbu','penghasilanIbu','noTelpIbu',
  'namaWali','nikWali','hubunganWali','pekerjaanWali','pendidikanWali','penghasilanWali','noTelpWali',
]

async function downloadTemplate() {
  const { utils, writeFile } = await import('xlsx')

  // ── Sheet 1: DATA ─────────────────────────────────────────────────
  const CONTOH_1 = [
    // noPendaftaran, namaLengkap, nisn, nis, namaPanggilan
    '2025-001', 'MUHAMMAD FAIZAL RAHMAN', '0123456789', '', 'Faizal',
    // jenisKelamin, tempatLahir, tanggalLahir, agama, noKK
    'L', 'Makassar', '15/01/2009', 'ISLAM', '7371234567890001',
    // alamat, kelurahan, kecamatan, kabupaten, provinsi, kodePos
    'Jl. Perintis Kemerdekaan No. 10', 'Tamalanrea Jaya', 'Tamalanrea', 'Kota Makassar', 'Sulawesi Selatan', '90245',
    // noTelepon, noWa, noTelpRumah, email
    '', '081234567890', '', 'faizal@email.com',
    // anakKe, jumlahSaudaraKandung, statusAnak, citaCita, hobi
    '2', '2', 'KANDUNG', 'Dokter', 'Membaca',
    // riwayatPenyakit, kebutuhanKhusus, ukuranBaju, bloodType
    '', '', 'M', 'B_POS',
    // tinggi, berat, jenisTinggal, alatTransportasi
    '165', '55', 'ORANG_TUA', 'MOTOR',
    // jarakKeSekolah, penerimaKIP, nomorKIP, peminatan
    '3.5', 'Tidak', '', 'IPA',
    // namaSekolahAsal, alamatSekolahAsal, npsnSekolahAsal, statusSekolahAsal
    'SMP Negeri 6 Makassar', 'Jl. Baji Gau No. 2 Makassar', '40307656', 'NEGERI',
    // statusOrtuKandung
    'LENGKAP',
    // namaAyah, nikAyah, statusAyah, pekerjaanAyah, pendidikanAyah, penghasilanAyah, noTelpAyah
    'RAHMAN TAUFIQ', '7371234567890002', 'HIDUP', 'Pegawai Negeri Sipil', 'S1', '5000000-10000000', '081298765432',
    // namaIbu, nikIbu, statusIbu, pekerjaanIbu, pendidikanIbu, penghasilanIbu, noTelpIbu
    'SITI AMINAH', '7371234567890003', 'HIDUP', 'Ibu Rumah Tangga', 'SMA', '', '081298765433',
    // namaWali, nikWali, hubunganWali, pekerjaanWali, pendidikanWali, penghasilanWali, noTelpWali
    '', '', '', '', '', '', '',
  ]

  const CONTOH_2 = [
    '2025-002', 'SITI RAHMA PUTRI', '9876543210', '', 'Rahma',
    'P', 'Gowa', '22/08/2009', 'ISLAM', '',
    'Jl. Poros Malino KM 5', 'Paccinongang', 'Somba Opu', 'Kabupaten Gowa', 'Sulawesi Selatan', '92111',
    '082345678901', '082345678901', '', '',
    '1', '1', 'KANDUNG', 'Guru', 'Menggambar',
    '', '', 'S', 'A_POS',
    '158', '48', 'ORANG_TUA', 'ANGKUTAN_UMUM',
    '12', 'Ya', 'KIP-123456789', 'IPS',
    'SMP Negeri 1 Sungguminasa', 'Jl. Usman Salengke No. 1 Gowa', '40307600', 'NEGERI',
    'LENGKAP',
    'SAHABUDDIN', '7372198706150001', 'HIDUP', 'Petani', 'SMP', '1000000-2000000', '082345678902',
    'HASNAWATI', '7372198809120002', 'HIDUP', 'Pedagang', 'SMP', '1000000-2000000', '082345678903',
    '', '', '', '', '', '', '',
  ]

  const ws = utils.aoa_to_sheet([TEMPLATE_HEADERS, CONTOH_1, CONTOH_2])
  ws['!cols'] = TEMPLATE_HEADERS.map((h) => ({ wch: Math.max(h.length + 4, 18) }))

  // ── Sheet 2: PANDUAN ──────────────────────────────────────────────
  const PANDUAN_HEADERS = ['Kolom', 'Wajib?', 'Tipe', 'Nilai yang Diterima / Keterangan', 'Contoh']
  const PANDUAN_ROWS = [
    // ── IDENTITAS ──
    ['--- IDENTITAS SISWA ---', '', '', '', ''],
    ['noPendaftaran',  'WAJIB',    'Teks',    'Harus cocok dengan data siswa lulus yang sudah diinput admin', '2025-001'],
    ['namaLengkap',   'Disarankan','Teks',    'Nama lengkap sesuai akta. Jika kosong, diambil dari data siswa lulus', 'MUHAMMAD FAIZAL RAHMAN'],
    ['nisn',          'Opsional',  'Angka',   '10 digit NISN dari Dapodik', '0123456789'],
    ['nis',           'Opsional',  'Teks',    'Nomor Induk Siswa di sekolah asal', ''],
    ['namaPanggilan', 'Opsional',  'Teks',    'Nama panggilan sehari-hari', 'Faizal'],
    ['jenisKelamin',  'Disarankan','Pilihan',  'L = Laki-laki  |  P = Perempuan\n(atau: "Laki-laki", "laki", "pria", "Perempuan", "wanita")', 'L'],
    ['tempatLahir',   'Disarankan','Teks',    'Kota/kabupaten tempat lahir (nama, bukan kode)', 'Makassar'],
    ['tanggalLahir',  'Disarankan','Tanggal', 'Format: DD/MM/YYYY atau DD-MM-YYYY atau YYYY-MM-DD', '15/01/2009'],
    ['agama',         'Disarankan','Pilihan',  'Nilai: ISLAM  (saat ini hanya Islam yang tersedia)', 'ISLAM'],
    ['noKK',          'Opsional',  'Angka',   '16 digit Nomor Kartu Keluarga', '7371234567890001'],
    // ── ALAMAT ──
    ['--- ALAMAT ---', '', '', '', ''],
    ['alamat',        'Opsional',  'Teks',    'Alamat lengkap (jalan, nomor, RT/RW)', 'Jl. Perintis Kemerdekaan No. 10'],
    ['kelurahan',     'Opsional',  'Teks',    '⚠ TULIS NAMA SAJA (bukan kode). Contoh wilayah Makassar di bawah.', 'Tamalanrea Jaya'],
    ['kecamatan',     'Opsional',  'Teks',    '⚠ TULIS NAMA SAJA (bukan kode)', 'Tamalanrea'],
    ['kabupaten',     'Opsional',  'Teks',    '⚠ TULIS NAMA SAJA termasuk "Kota" atau "Kabupaten"', 'Kota Makassar'],
    ['provinsi',      'Opsional',  'Teks',    '⚠ TULIS NAMA SAJA', 'Sulawesi Selatan'],
    ['kodePos',       'Opsional',  'Angka',   '5 digit kode pos', '90245'],
    ['noTelepon',     'Opsional',  'Teks',    'Nomor HP siswa (awali 08 atau 62)', '081234567890'],
    ['noWa',          'Opsional',  'Teks',    'Nomor WhatsApp (awali 08 atau 62)', '081234567890'],
    ['noTelpRumah',   'Opsional',  'Teks',    'Nomor telepon rumah', ''],
    ['email',         'Opsional',  'Teks',    'Alamat email siswa', 'siswa@email.com'],
    // ── DATA PERSONAL ──
    ['--- DATA PERSONAL ---', '', '', '', ''],
    ['anakKe',        'Opsional',  'Angka',   'Urutan anak (1, 2, 3, ...)', '2'],
    ['jumlahSaudaraKandung','Opsional','Angka','Jumlah saudara kandung (0 jika anak tunggal)', '2'],
    ['statusAnak',    'Opsional',  'Pilihan',  'KANDUNG  |  TIRI  |  ANGKAT', 'KANDUNG'],
    ['citaCita',      'Opsional',  'Teks',    'Cita-cita siswa', 'Dokter'],
    ['hobi',          'Opsional',  'Teks',    'Hobi siswa', 'Membaca'],
    ['riwayatPenyakit','Opsional', 'Teks',    'Riwayat penyakit kronis (kosongkan jika tidak ada)', ''],
    ['kebutuhanKhusus','Opsional', 'Teks',    'Kebutuhan khusus (kosongkan jika tidak ada)', ''],
    ['ukuranBaju',    'Opsional',  'Teks',    'Ukuran seragam: S / M / L / XL / XXL', 'M'],
    ['bloodType',     'Opsional',  'Pilihan',  'A_POS | A_NEG | B_POS | B_NEG | AB_POS | AB_NEG | O_POS | O_NEG\n(atau: A+, A-, B+, B-, AB+, AB-, O+, O-)', 'B_POS'],
    ['tinggi',        'Opsional',  'Angka',   'Tinggi badan dalam cm', '165'],
    ['berat',         'Opsional',  'Angka',   'Berat badan dalam kg', '55'],
    ['jenisTinggal',  'Opsional',  'Pilihan',  'ORANG_TUA | WALI | ASRAMA | PONDOK | PANTI | LAINNYA', 'ORANG_TUA'],
    ['alatTransportasi','Opsional','Pilihan',  'JALAN_KAKI | SEPEDA | MOTOR | MOBIL | ANGKUTAN_UMUM | LAINNYA', 'MOTOR'],
    ['jarakKeSekolah','Opsional',  'Angka',   'Jarak ke sekolah dalam km (desimal boleh, contoh: 3.5)', '3.5'],
    ['penerimaKIP',   'Opsional',  'Pilihan',  'Ya / Tidak  (atau: true/false, 1/0, iya/tidak)', 'Tidak'],
    ['nomorKIP',      'Opsional',  'Teks',    'Nomor KIP jika penerima KIP', ''],
    ['peminatan',     'Opsional',  'Teks',    'IPA / IPS / Bahasa / Agama (sesuai jurusan sekolah)', 'IPA'],
    // ── SEKOLAH ASAL ──
    ['--- SEKOLAH ASAL ---', '', '', '', ''],
    ['namaSekolahAsal',  'Opsional','Teks',   'Nama lengkap sekolah asal', 'SMP Negeri 6 Makassar'],
    ['alamatSekolahAsal','Opsional','Teks',   'Alamat sekolah asal', 'Jl. Baji Gau No. 2 Makassar'],
    ['npsnSekolahAsal',  'Opsional','Angka',  '8 digit NPSN sekolah asal (dari Dapodik)', '40307656'],
    ['statusSekolahAsal','Opsional','Pilihan', 'NEGERI | SWASTA | LUAR_NEGERI', 'NEGERI'],
    // ── ORANG TUA ──
    ['--- ORANG TUA ---', '', '', '', ''],
    ['statusOrtuKandung','Opsional','Pilihan', 'LENGKAP | CERAI_HIDUP | CERAI_MATI', 'LENGKAP'],
    ['namaAyah',      'Opsional',  'Teks',    'Nama lengkap ayah kandung', 'RAHMAN TAUFIQ'],
    ['nikAyah',       'Opsional',  'Angka',   '16 digit NIK ayah', '7371234567890002'],
    ['statusAyah',    'Opsional',  'Pilihan',  'HIDUP | MENINGGAL', 'HIDUP'],
    ['pekerjaanAyah', 'Opsional',  'Teks',    'Pekerjaan ayah (tulis bebas)', 'Pegawai Negeri Sipil'],
    ['pendidikanAyah','Opsional',  'Pilihan',  'TIDAK_SEKOLAH | SD | SMP | SMA | D1 | D2 | D3 | D4 | S1 | S2 | S3\n(SD/MI, SMP/MTs, SMA/SMK/MA juga diterima)', 'S1'],
    ['penghasilanAyah','Opsional', 'Teks',    'Rentang penghasilan bulanan (tulis bebas)', '5000000-10000000'],
    ['noTelpAyah',    'Opsional',  'Teks',    'Nomor HP ayah', '081298765432'],
    ['namaIbu',       'Opsional',  'Teks',    'Nama lengkap ibu kandung', 'SITI AMINAH'],
    ['nikIbu',        'Opsional',  'Angka',   '16 digit NIK ibu', '7371234567890003'],
    ['statusIbu',     'Opsional',  'Pilihan',  'HIDUP | MENINGGAL', 'HIDUP'],
    ['pekerjaanIbu',  'Opsional',  'Teks',    'Pekerjaan ibu (tulis bebas)', 'Ibu Rumah Tangga'],
    ['pendidikanIbu', 'Opsional',  'Pilihan',  'Sama seperti pendidikanAyah', 'SMA'],
    ['penghasilanIbu','Opsional',  'Teks',    'Rentang penghasilan bulanan ibu', ''],
    ['noTelpIbu',     'Opsional',  'Teks',    'Nomor HP ibu', '081298765433'],
    // ── WALI ──
    ['--- WALI (isi jika tinggal dengan wali) ---', '', '', '', ''],
    ['namaWali',      'Opsional',  'Teks',    'Nama wali (kosongkan jika tidak ada)', ''],
    ['nikWali',       'Opsional',  'Angka',   '16 digit NIK wali', ''],
    ['hubunganWali',  'Opsional',  'Teks',    'Hubungan dengan wali (contoh: Paman, Kakek, dll)', ''],
    ['pekerjaanWali', 'Opsional',  'Teks',    'Pekerjaan wali', ''],
    ['pendidikanWali','Opsional',  'Pilihan',  'Sama seperti pendidikanAyah', ''],
    ['penghasilanWali','Opsional', 'Teks',    'Rentang penghasilan wali', ''],
    ['noTelpWali',    'Opsional',  'Teks',    'Nomor HP wali', ''],
    // ── CATATAN WILAYAH ──
    ['', '', '', '', ''],
    ['=== CATATAN PENGISIAN WILAYAH ===', '', '', '', ''],
    ['Kelurahan/Desa', '', 'Teks bebas', 'Tulis nama kelurahan/desa apa adanya dari data siswa. Tidak perlu kode wilayah.', 'Tamalanrea Jaya'],
    ['Kecamatan',      '', 'Teks bebas', 'Tulis nama kecamatan. Jika siswa dari luar Makassar, tulis nama kecamatan di daerahnya.', 'Tamalanrea'],
    ['Kabupaten/Kota', '', 'Teks bebas', 'Tulis nama lengkap termasuk "Kota" atau "Kabupaten". Contoh: "Kota Makassar", "Kabupaten Gowa"', 'Kota Makassar'],
    ['Provinsi',       '', 'Teks bebas', 'Tulis nama provinsi lengkap', 'Sulawesi Selatan'],
    ['', '', '', '', ''],
    ['=== CATATAN UMUM ===', '', '', '', ''],
    ['Kolom yang tidak ada di file Anda', '', '', 'Tidak masalah — kolom opsional yang tidak ada akan dikosongkan', ''],
    ['Nama kolom berbeda (Nama Siswa, bukan namaLengkap)', '', '', 'Sistem akan mencoba mencocokkan otomatis. Namun lebih aman gunakan nama kolom di template ini.', ''],
    ['Siswa sudah punya biodata DIAJUKAN/DITERIMA', '', '', 'Baris tersebut akan DILEWATI — tidak ditimpa', ''],
    ['Siswa sudah punya biodata DRAFT', '', '', 'Data akan DIPERBARUI (merge) — field yang terisi di file akan menggantikan data lama', ''],
    ['Upload dokumen (foto, akta, KK, ijazah, dll)', '', '', 'TIDAK diimport dari file ini — siswa harus upload sendiri saat login', ''],
  ]

  const wsPanduan = utils.aoa_to_sheet([PANDUAN_HEADERS, ...PANDUAN_ROWS])
  wsPanduan['!cols'] = [
    { wch: 30 }, // Kolom
    { wch: 12 }, // Wajib
    { wch: 12 }, // Tipe
    { wch: 70 }, // Keterangan
    { wch: 30 }, // Contoh
  ]

  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'IMPORT DATA')
  utils.book_append_sheet(wb, wsPanduan, 'PANDUAN')
  writeFile(wb, 'template_import_biodata.xlsx')
}

export function ImportBiodataModal({ open, onClose, defaultTahunAjaranId }: Props) {
  const [step,        setStep]        = useState<Step>('upload')
  const [tahunId,     setTahunId]     = useState(defaultTahunAjaranId)
  const [rows,        setRows]        = useState<Record<string, unknown>[]>([])
  const [fileName,    setFileName]    = useState('')
  const [parseError,  setParseError]  = useState<string | null>(null)
  const [result,      setResult]      = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: tahunList } = useTahunAjaranList()
  const importMutation      = useBulkImportBiodata()

  useEffect(() => {
    if (open) {
      setStep('upload')
      setTahunId(defaultTahunAjaranId)
      setRows([])
      setFileName('')
      setParseError(null)
      setResult(null)
    }
  }, [open, defaultTahunAjaranId])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError(null)
    setFileName(file.name)
    try {
      const { read, utils } = await import('xlsx')
      const buf  = await file.arrayBuffer()
      const wb   = read(buf)
      const ws   = wb.Sheets[wb.SheetNames[0]]
      const data = utils.sheet_to_json<Record<string, unknown>>(ws, {
        defval: '',
        raw: false,         // semua jadi string, lebih mudah mapping
      })
      if (!data.length) throw new Error('File tidak mengandung data')
      setRows(data)
      setStep('preview')
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Gagal membaca file')
    }
    // reset input supaya bisa upload file yang sama lagi
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleImport = async () => {
    if (!tahunId || !rows.length) return
    const res = await importMutation.mutateAsync({ tahunAjaranId: tahunId, data: rows })
    setResult(res)
    setStep('done')
  }

  const tahunOptions = (tahunList ?? []).map((t: TahunAjaran) => ({ value: t.id, label: t.nama }))

  // Baris preview (maks 5)
  const previewCols = ['noPendaftaran','namaLengkap','nisn','jenisKelamin','tanggalLahir']
  const previewRows = rows.slice(0, 5)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import Biodata dari Sistem Lama"
      footer={
        <>
          {/* Tombol download template selalu ada di kiri */}
          {step !== 'done' && (
            <button
              type="button"
              onClick={downloadTemplate}
              className="mr-auto flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <Download size={13} /> Download Template
            </button>
          )}

          <Button variant="secondary" onClick={onClose}>
            {step === 'done' ? 'Tutup' : 'Batal'}
          </Button>

          {step === 'preview' && (
            <>
              <Button variant="secondary" onClick={() => setStep('upload')}>Kembali</Button>
              <Button
                onClick={handleImport}
                loading={importMutation.isPending}
                leftIcon={<Upload size={13} />}
                disabled={!tahunId}
              >
                Import {rows.length} Baris
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="p-6 space-y-4">

        {/* Info */}
        <div className="flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-2.5 text-xs text-blue-700 dark:text-blue-300">
          <Info size={13} className="shrink-0 mt-0.5" />
          <span>
            Download template terlebih dahulu, isi dengan data dari sistem lama, lalu upload.
            Data upload keys (foto, akta, KK, dll) <strong>tidak diimport</strong> — siswa upload ulang sendiri.
            Biodata yang sudah DIAJUKAN/DITERIMA tidak akan ditimpa.
          </span>
        </div>

        {/* ─── Step: UPLOAD ─────────────────────────────────────── */}
        {step === 'upload' && (
          <>
            {/* Tahun Ajaran */}
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tahun Ajaran <span className="text-red-500">*</span></p>
              <Select
                options={tahunOptions}
                value={tahunId}
                onChange={(e) => setTahunId(e.target.value)}
                placeholder="— Pilih tahun ajaran —"
              />
            </div>

            {/* Drop zone */}
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">File Excel</p>
              <label className={`
                flex flex-col items-center justify-center gap-3
                rounded-xl border-2 border-dashed cursor-pointer
                px-6 py-10 transition-colors
                ${!tahunId
                  ? 'border-gray-200 dark:border-gray-700 opacity-40 pointer-events-none'
                  : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10'}
              `}>
                <FileSpreadsheet size={32} className="text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Klik untuk pilih file</p>
                  <p className="text-xs text-gray-400 mt-0.5">.xlsx atau .xls</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFile}
                  disabled={!tahunId}
                />
              </label>
            </div>

            {parseError && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                {parseError}
              </div>
            )}
          </>
        )}

        {/* ─── Step: PREVIEW ────────────────────────────────────── */}
        {step === 'preview' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-emerald-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{fileName}</span>
              </div>
              <button
                onClick={() => { setRows([]); setFileName(''); setStep('upload') }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ditemukan <span className="font-semibold text-emerald-600">{rows.length}</span> baris data.
              Preview 5 baris pertama:
            </p>

            {/* Preview table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    {previewCols.map((c) => (
                      <th key={c} className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-gray-400">...</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {previewRows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      {previewCols.map((c) => (
                        <td key={c} className="px-3 py-2 text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                          {String(row[c] ?? row[c.toLowerCase()] ?? '-')}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-gray-400">
                        {Object.keys(row).length} kolom
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              Pastikan kolom <code>noPendaftaran</code> cocok dengan data yang sudah diinput di sistem.
              Biodata akan dibuat sebagai <strong>DRAFT</strong> — siswa masih perlu submit sendiri.
            </div>
          </div>
        )}

        {/* ─── Step: DONE ───────────────────────────────────────── */}
        {step === 'done' && result && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <p className="text-center text-base font-semibold text-gray-900 dark:text-white">Import Selesai</p>

            {/* Ringkasan */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Dibuat',     value: result.dibuat,     color: 'text-emerald-600' },
                { label: 'Diperbarui', value: result.diperbarui, color: 'text-blue-600' },
                { label: 'Dilewati',   value: result.dilewati,   color: 'text-amber-500' },
                { label: 'Error',      value: result.error,      color: 'text-red-500' },
              ].map((s) => (
                <div key={s.label} className="text-center rounded-xl bg-gray-50 dark:bg-gray-800 py-3">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Error detail */}
            {result.errorDetail.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Detail ({result.errorDetail.length} masalah):
                </p>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-red-200 dark:border-red-800 divide-y divide-red-100 dark:divide-red-900">
                  {result.errorDetail.map((e, i) => (
                    <div key={i} className="px-3 py-2 flex items-start gap-2">
                      <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{e.noPendaftaran}</span>
                        <span className="text-xs text-gray-400 ml-2">— {e.alasan}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </Modal>
  )
}
