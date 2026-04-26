'use client'

import { useState, useCallback, useEffect } from 'react'
import { Save, Send, ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { pendaftaranPublicApi } from '@/lib/api/pendaftaran.api'
import type { VerifikasiIdentitasResult, BiodataSiswaBaru } from '@/types/pendaftaran.types'
import { StepProgress } from './StepProgress'
import { Field, Input, SectionTitle } from './FormField'
import { Select } from '@/components/ui'
import {
  JENIS_KELAMIN_OPTIONS, AGAMA_OPTIONS_FULL,
  STATUS_ANAK_OPTIONS, STATUS_ORTU_OPTIONS, STATUS_ORANG_TUA_OPTIONS,
  STATUS_SEKOLAH_OPTIONS, BLOOD_TYPE_OPTIONS, JENIS_TINGGAL_OPTIONS,
  ALAT_TRANSPORTASI_OPTIONS, JENJANG_PENDIDIKAN_OPTIONS, PENGHASILAN_OPTIONS,
  UKURAN_BAJU_OPTIONS, MONTHS_LABEL,
} from './form-constants'

const DAY_OPTIONS   = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1).padStart(2, '0') }))
const MONTH_OPTIONS = MONTHS_LABEL.map((m, i) => ({ value: String(i + 1), label: m }))
const YEAR_OPTIONS  = Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => new Date().getFullYear() - i)
  .map((y) => ({ value: String(y), label: String(y) }))

type FormData = Partial<Omit<BiodataSiswaBaru, 'id' | 'siswaLulusId' | 'status' | 'userId' | 'verifiedAt' | 'createdAt' | 'updatedAt' | 'siswaLulus'>>

interface Props {
  session: VerifikasiIdentitasResult
  existingBiodata: BiodataSiswaBaru | null
  onDone: (status: 'draft' | 'diajukan') => void
}

function toDateParts(dateStr: string | null | undefined) {
  if (!dateStr) return { d: '', m: '', y: '' }
  const dt = new Date(dateStr)
  return {
    d: String(dt.getDate()),
    m: String(dt.getMonth() + 1),
    y: String(dt.getFullYear()),
  }
}

export function FormBiodata({ session, existingBiodata, onDone }: Props) {
  const currentYear = new Date().getFullYear()

  // Parse existing tanggalLahir for date dropdowns
  const initDate = toDateParts(existingBiodata?.tanggalLahir)

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [biodataId, setBiodataId] = useState<string | null>(existingBiodata?.id ?? null)

  // Date fields separate
  const [tglD, setTglD] = useState(initDate.d)
  const [tglM, setTglM] = useState(initDate.m)
  const [tglY, setTglY] = useState(initDate.y)

  const [form, setForm] = useState<FormData>({
    nisn:              existingBiodata?.nisn ?? '',
    nis:               existingBiodata?.nis ?? '',
    namaLengkap:       existingBiodata?.namaLengkap ?? session.nama.toUpperCase(),
    namaPanggilan:     existingBiodata?.namaPanggilan ?? '',
    jenisKelamin:      existingBiodata?.jenisKelamin ?? undefined,
    tempatLahir:       existingBiodata?.tempatLahir ?? '',
    agama:             existingBiodata?.agama ?? 'ISLAM' as never,
    noKK:              existingBiodata?.noKK ?? '',
    alamat:            existingBiodata?.alamat ?? '',
    kelurahan:         existingBiodata?.kelurahan ?? '',
    kecamatan:         existingBiodata?.kecamatan ?? '',
    kabupaten:         existingBiodata?.kabupaten ?? '',
    provinsi:          existingBiodata?.provinsi ?? '',
    kodePos:           existingBiodata?.kodePos ?? '',
    noTelepon:         existingBiodata?.noTelepon ?? '',
    noWa:              existingBiodata?.noWa ?? '',
    noTelpRumah:       existingBiodata?.noTelpRumah ?? '',
    email:             existingBiodata?.email ?? '',
    anakKe:            existingBiodata?.anakKe ?? undefined,
    jumlahSaudaraKandung: existingBiodata?.jumlahSaudaraKandung ?? undefined,
    statusAnak:        existingBiodata?.statusAnak ?? undefined,
    citaCita:          existingBiodata?.citaCita ?? '',
    hobi:              existingBiodata?.hobi ?? '',
    riwayatPenyakit:   existingBiodata?.riwayatPenyakit ?? '',
    kebutuhanKhusus:   existingBiodata?.kebutuhanKhusus ?? '',
    ukuranBaju:        existingBiodata?.ukuranBaju ?? undefined,
    bloodType:         existingBiodata?.bloodType ?? undefined,
    tinggi:            existingBiodata?.tinggi ?? undefined,
    berat:             existingBiodata?.berat ?? undefined,
    jenisTinggal:      existingBiodata?.jenisTinggal ?? undefined,
    alatTransportasi:  existingBiodata?.alatTransportasi ?? undefined,
    jarakKeSekolah:    existingBiodata?.jarakKeSekolah ?? undefined,
    penerimaKIP:       existingBiodata?.penerimaKIP ?? false,
    nomorKIP:          existingBiodata?.nomorKIP ?? '',
    peminatan:         existingBiodata?.peminatan ?? '',
    namaSekolahAsal:   existingBiodata?.namaSekolahAsal ?? '',
    alamatSekolahAsal: existingBiodata?.alamatSekolahAsal ?? '',
    npsnSekolahAsal:   existingBiodata?.npsnSekolahAsal ?? '',
    statusSekolahAsal: existingBiodata?.statusSekolahAsal ?? undefined,
    statusOrtuKandung: existingBiodata?.statusOrtuKandung ?? undefined,
    namaAyah:          existingBiodata?.namaAyah ?? '',
    nikAyah:           existingBiodata?.nikAyah ?? '',
    statusAyah:        existingBiodata?.statusAyah ?? undefined,
    pekerjaanAyah:     existingBiodata?.pekerjaanAyah ?? '',
    pendidikanAyah:    existingBiodata?.pendidikanAyah ?? undefined,
    penghasilanAyah:   existingBiodata?.penghasilanAyah ?? undefined,
    noTelpAyah:        existingBiodata?.noTelpAyah ?? '',
    namaIbu:           existingBiodata?.namaIbu ?? '',
    nikIbu:            existingBiodata?.nikIbu ?? '',
    statusIbu:         existingBiodata?.statusIbu ?? undefined,
    pekerjaanIbu:      existingBiodata?.pekerjaanIbu ?? '',
    pendidikanIbu:     existingBiodata?.pendidikanIbu ?? undefined,
    penghasilanIbu:    existingBiodata?.penghasilanIbu ?? undefined,
    noTelpIbu:         existingBiodata?.noTelpIbu ?? '',
    namaWali:          existingBiodata?.namaWali ?? '',
    nikWali:           existingBiodata?.nikWali ?? '',
    hubunganWali:      existingBiodata?.hubunganWali ?? '',
    pekerjaanWali:     existingBiodata?.pekerjaanWali ?? '',
    pendidikanWali:    existingBiodata?.pendidikanWali ?? undefined,
    penghasilanWali:   existingBiodata?.penghasilanWali ?? undefined,
    noTelpWali:        existingBiodata?.noTelpWali ?? '',
  })

  const set = useCallback((field: keyof FormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const buildPayload = useCallback(() => {
    const tanggalLahir = tglD && tglM && tglY
      ? `${tglY}-${String(tglM).padStart(2, '0')}-${String(tglD).padStart(2, '0')}`
      : undefined

    return {
      ...form,
      namaLengkap: (form.namaLengkap ?? '').toUpperCase(),
      namaAyah:    form.namaAyah ? form.namaAyah.toUpperCase() : undefined,
      namaIbu:     form.namaIbu  ? form.namaIbu.toUpperCase()  : undefined,
      namaWali:    form.namaWali ? form.namaWali.toUpperCase() : undefined,
      tanggalLahir,
      siswaLulusId: session.id,
      // tahunMasuk: readonly, set to current year if not in existingBiodata
    }
  }, [form, tglD, tglM, tglY, session.id])

  const saveDraft = useCallback(async () => {
    setSaveError(null)
    setSaving(true)
    try {
      const payload = buildPayload()
      if (biodataId) {
        await pendaftaranPublicApi.updateBiodata(biodataId, payload)
      } else {
        const created = await pendaftaranPublicApi.createBiodata(payload)
        setBiodataId(created.id)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setSaveError(msg ?? 'Gagal menyimpan data. Silakan coba lagi.')
    } finally {
      setSaving(false)
    }
  }, [biodataId, buildPayload])

  const handleNext = useCallback(async () => {
    await saveDraft()
    if (!saveError) setStep((s) => Math.min(s + 1, 6))
  }, [saveDraft, saveError])

  const handlePrev = () => setStep((s) => Math.max(s - 1, 1))

  const handleSubmit = useCallback(async () => {
    setSaveError(null)
    setSubmitting(true)
    try {
      // Save latest data first
      const payload = buildPayload()
      let id = biodataId
      if (id) {
        await pendaftaranPublicApi.updateBiodata(id, payload)
      } else {
        const created = await pendaftaranPublicApi.createBiodata(payload)
        id = created.id
        setBiodataId(id)
      }
      // Submit (DRAFT → DIAJUKAN)
      await pendaftaranPublicApi.submitBiodata(id!)
      onDone('diajukan')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setSaveError(msg ?? 'Gagal mengirimkan data. Pastikan semua data wajib sudah terisi.')
    } finally {
      setSubmitting(false)
    }
  }, [biodataId, buildPayload, onDone])

  const inputCls = 'w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500'
  const selectCls = `${inputCls} cursor-pointer`

  return (
    <div>
      <StepProgress currentStep={step} />

      {/* Status draft notice */}
      {existingBiodata?.status === 'DRAFT' && (
        <div className="flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3 mb-6 text-sm text-blue-700 dark:text-blue-300">
          <Info size={16} className="mt-0.5 shrink-0" />
          <span>Data Anda tersimpan sebagai draf. Lengkapi dan kirimkan formulir sebelum batas waktu pendaftaran.</span>
        </div>
      )}

      {/* ── STEP 1: DATA PRIBADI ──────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Data Pribadi</h2>

          <Field label="Nama Lengkap" required hint="Sesuai akta kelahiran, otomatis kapital">
            <Input
              value={form.namaLengkap ?? ''}
              onChange={(e) => set('namaLengkap', e.target.value.toUpperCase())}
              placeholder="Nama lengkap"
            />
          </Field>

          <Field label="Nama Panggilan">
            <Input
              value={form.namaPanggilan ?? ''}
              onChange={(e) => set('namaPanggilan', e.target.value)}
              placeholder="Nama panggilan sehari-hari"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Jenis Kelamin" required>
              <Select
                value={form.jenisKelamin ?? ''}
                onChange={(e) => set('jenisKelamin', e.target.value)}
                options={JENIS_KELAMIN_OPTIONS}
                placeholder="Pilih"
              />
            </Field>
            <Field label="Agama" required>
              <Select
                value={form.agama ?? ''}
                onChange={(e) => set('agama', e.target.value as never)}
                options={AGAMA_OPTIONS_FULL}
                placeholder="Pilih"
              />
            </Field>
          </div>

          <Field label="Tempat Lahir" required>
            <Input
              value={form.tempatLahir ?? ''}
              onChange={(e) => set('tempatLahir', e.target.value)}
              placeholder="Kota tempat lahir"
            />
          </Field>

          <Field label="Tanggal Lahir" required hint="Sesuai akta kelahiran">
            <div className="grid grid-cols-3 gap-2">
              <Select size="sm" placeholder="Tgl"   options={DAY_OPTIONS}   value={tglD} onChange={(e) => setTglD(e.target.value)} />
              <Select size="sm" placeholder="Bulan" options={MONTH_OPTIONS} value={tglM} onChange={(e) => setTglM(e.target.value)} />
              <Select size="sm" placeholder="Tahun" options={YEAR_OPTIONS}  value={tglY} onChange={(e) => setTglY(e.target.value)} />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="NISN" hint="10 digit">
              <Input
                value={form.nisn ?? ''}
                onChange={(e) => set('nisn', e.target.value)}
                placeholder="0000000000"
                maxLength={10}
              />
            </Field>
            <Field label="NIS" hint="Nomor Induk Siswa">
              <Input
                value={form.nis ?? ''}
                onChange={(e) => set('nis', e.target.value)}
                placeholder="NIS dari sekolah"
                maxLength={20}
              />
            </Field>
          </div>

          <Field label="No. Kartu Keluarga">
            <Input
              value={form.noKK ?? ''}
              onChange={(e) => set('noKK', e.target.value)}
              placeholder="16 digit nomor KK"
              maxLength={16}
            />
          </Field>
        </div>
      )}

      {/* ── STEP 2: ALAMAT & KONTAK ───────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Alamat & Kontak</h2>

          <Field label="Alamat Lengkap" required>
            <textarea
              value={form.alamat ?? ''}
              onChange={(e) => set('alamat', e.target.value)}
              rows={3}
              placeholder="Jalan, RT/RW, nomor rumah"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Kelurahan / Desa">
              <Input value={form.kelurahan ?? ''} onChange={(e) => set('kelurahan', e.target.value)} placeholder="Kelurahan" />
            </Field>
            <Field label="Kecamatan">
              <Input value={form.kecamatan ?? ''} onChange={(e) => set('kecamatan', e.target.value)} placeholder="Kecamatan" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Kabupaten / Kota">
              <Input value={form.kabupaten ?? ''} onChange={(e) => set('kabupaten', e.target.value)} placeholder="Kabupaten/Kota" />
            </Field>
            <Field label="Provinsi">
              <Input value={form.provinsi ?? ''} onChange={(e) => set('provinsi', e.target.value)} placeholder="Provinsi" />
            </Field>
          </div>

          <Field label="Kode Pos">
            <Input value={form.kodePos ?? ''} onChange={(e) => set('kodePos', e.target.value)} placeholder="5 digit" maxLength={5} className="max-w-[120px]" />
          </Field>

          <SectionTitle>Kontak</SectionTitle>

          <div className="grid grid-cols-2 gap-4">
            <Field label="No. HP / WA" hint="Nomor aktif yang dapat dihubungi">
              <Input value={form.noTelepon ?? ''} onChange={(e) => set('noTelepon', e.target.value)} placeholder="08xx" />
            </Field>
            <Field label="No. WhatsApp">
              <Input value={form.noWa ?? ''} onChange={(e) => set('noWa', e.target.value)} placeholder="08xx (jika berbeda)" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="No. Telepon Rumah">
              <Input value={form.noTelpRumah ?? ''} onChange={(e) => set('noTelpRumah', e.target.value)} placeholder="0411-xxx" />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="email@contoh.com" />
            </Field>
          </div>
        </div>
      )}

      {/* ── STEP 3: DATA PRIBADI LANJUTAN ────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Data Pribadi Lanjutan</h2>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Anak Ke-">
              <Input type="number" min={1} value={form.anakKe ?? ''} onChange={(e) => set('anakKe', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="1" />
            </Field>
            <Field label="Jml. Saudara">
              <Input type="number" min={0} value={form.jumlahSaudaraKandung ?? ''} onChange={(e) => set('jumlahSaudaraKandung', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="0" />
            </Field>
            <Field label="Status Anak">
              <Select value={form.statusAnak ?? ''} onChange={(e) => set('statusAnak', e.target.value || undefined)} options={STATUS_ANAK_OPTIONS} placeholder="Pilih" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Cita-cita">
              <Input value={form.citaCita ?? ''} onChange={(e) => set('citaCita', e.target.value)} placeholder="Cita-cita" />
            </Field>
            <Field label="Hobi">
              <Input value={form.hobi ?? ''} onChange={(e) => set('hobi', e.target.value)} placeholder="Hobi" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Riwayat Penyakit" hint="Jika tidak ada, kosongkan">
              <Input value={form.riwayatPenyakit ?? ''} onChange={(e) => set('riwayatPenyakit', e.target.value)} placeholder="Contoh: Asma" />
            </Field>
            <Field label="Kebutuhan Khusus" hint="Jika tidak ada, kosongkan">
              <Input value={form.kebutuhanKhusus ?? ''} onChange={(e) => set('kebutuhanKhusus', e.target.value)} placeholder="Jika ada" />
            </Field>
          </div>

          <SectionTitle>Kondisi Fisik</SectionTitle>

          <div className="grid grid-cols-4 gap-4">
            <Field label="Gol. Darah">
              <Select value={form.bloodType ?? ''} onChange={(e) => set('bloodType', e.target.value || undefined)} options={BLOOD_TYPE_OPTIONS} placeholder="-" />
            </Field>
            <Field label="Ukuran Baju">
              <Select value={form.ukuranBaju ?? ''} onChange={(e) => set('ukuranBaju', e.target.value || undefined)} options={UKURAN_BAJU_OPTIONS} placeholder="-" />
            </Field>
            <Field label="Tinggi (cm)">
              <Input type="number" min={100} max={250} value={form.tinggi ?? ''} onChange={(e) => set('tinggi', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="0" />
            </Field>
            <Field label="Berat (kg)">
              <Input type="number" min={20} max={200} value={form.berat ?? ''} onChange={(e) => set('berat', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="0" />
            </Field>
          </div>

          <SectionTitle>Keadaan di Rumah</SectionTitle>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tinggal Bersama">
              <Select value={form.jenisTinggal ?? ''} onChange={(e) => set('jenisTinggal', e.target.value || undefined)} options={JENIS_TINGGAL_OPTIONS} placeholder="Pilih" />
            </Field>
            <Field label="Transportasi ke Sekolah">
              <Select value={form.alatTransportasi ?? ''} onChange={(e) => set('alatTransportasi', e.target.value || undefined)} options={ALAT_TRANSPORTASI_OPTIONS} placeholder="Pilih" />
            </Field>
          </div>

          <Field label="Jarak ke Sekolah (km)" hint="Estimasi jarak tempuh">
            <Input type="number" min={0} step={0.1} value={form.jarakKeSekolah ?? ''} onChange={(e) => set('jarakKeSekolah', e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="0.5" className="max-w-[160px]" />
          </Field>

          <SectionTitle>KIP (Kartu Indonesia Pintar)</SectionTitle>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="penerimaKIP"
              checked={form.penerimaKIP ?? false}
              onChange={(e) => set('penerimaKIP', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="penerimaKIP" className="text-sm text-gray-700 dark:text-gray-300">Penerima KIP (Kartu Indonesia Pintar)</label>
          </div>

          {form.penerimaKIP && (
            <Field label="Nomor KIP">
              <Input value={form.nomorKIP ?? ''} onChange={(e) => set('nomorKIP', e.target.value)} placeholder="Nomor pada kartu KIP" />
            </Field>
          )}

          <Field label="Peminatan" hint="Program peminatan yang dipilih">
            <Input value={form.peminatan ?? ''} onChange={(e) => set('peminatan', e.target.value)} placeholder="Contoh: IPA, IPS, Bahasa, Agama" />
          </Field>
        </div>
      )}

      {/* ── STEP 4: SEKOLAH ASAL ─────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Data Sekolah Asal</h2>

          <Field label="Nama Sekolah Asal" required>
            <Input value={form.namaSekolahAsal ?? ''} onChange={(e) => set('namaSekolahAsal', e.target.value)} placeholder="SMP/MTs ..." />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="NPSN Sekolah Asal" hint="8 digit nomor pokok sekolah">
              <Input value={form.npsnSekolahAsal ?? ''} onChange={(e) => set('npsnSekolahAsal', e.target.value)} placeholder="00000000" maxLength={8} />
            </Field>
            <Field label="Status Sekolah">
              <Select value={form.statusSekolahAsal ?? ''} onChange={(e) => set('statusSekolahAsal', e.target.value || undefined)} options={STATUS_SEKOLAH_OPTIONS} placeholder="Pilih" />
            </Field>
          </div>

          <Field label="Alamat Sekolah Asal">
            <textarea
              value={form.alamatSekolahAsal ?? ''}
              onChange={(e) => set('alamatSekolahAsal', e.target.value)}
              rows={2}
              placeholder="Alamat sekolah asal"
              className={inputCls}
            />
          </Field>
        </div>
      )}

      {/* ── STEP 5: DATA ORANG TUA ───────────────────────────────── */}
      {step === 5 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Data Orang Tua & Wali</h2>

          <Field label="Status Orang Tua Kandung" required>
            <Select value={form.statusOrtuKandung ?? ''} onChange={(e) => set('statusOrtuKandung', e.target.value || undefined)} options={STATUS_ORTU_OPTIONS} placeholder="Pilih status" />
          </Field>

          <SectionTitle>Data Ayah</SectionTitle>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Nama Ayah" hint="Otomatis kapital">
              <Input value={form.namaAyah ?? ''} onChange={(e) => set('namaAyah', e.target.value.toUpperCase())} placeholder="Nama ayah" />
            </Field>
            <Field label="NIK Ayah">
              <Input value={form.nikAyah ?? ''} onChange={(e) => set('nikAyah', e.target.value)} placeholder="16 digit NIK" maxLength={16} />
            </Field>
          </div>

          <Field label="Status Ayah">
            <Select value={form.statusAyah ?? ''} onChange={(e) => set('statusAyah', e.target.value || undefined)} options={STATUS_ORANG_TUA_OPTIONS} placeholder="Pilih" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Pekerjaan Ayah">
              <Input value={form.pekerjaanAyah ?? ''} onChange={(e) => set('pekerjaanAyah', e.target.value)} placeholder="Pekerjaan" />
            </Field>
            <Field label="Pendidikan Terakhir Ayah">
              <Select value={form.pendidikanAyah ?? ''} onChange={(e) => set('pendidikanAyah', e.target.value || undefined)} options={JENJANG_PENDIDIKAN_OPTIONS} placeholder="Pilih" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Penghasilan Bulanan Ayah">
              <Select value={form.penghasilanAyah ?? ''} onChange={(e) => set('penghasilanAyah', e.target.value || undefined)} options={PENGHASILAN_OPTIONS} placeholder="Pilih rentang" />
            </Field>
            <Field label="No. Telepon Ayah">
              <Input value={form.noTelpAyah ?? ''} onChange={(e) => set('noTelpAyah', e.target.value)} placeholder="08xx" />
            </Field>
          </div>

          <SectionTitle>Data Ibu</SectionTitle>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Nama Ibu" hint="Otomatis kapital">
              <Input value={form.namaIbu ?? ''} onChange={(e) => set('namaIbu', e.target.value.toUpperCase())} placeholder="Nama ibu" />
            </Field>
            <Field label="NIK Ibu">
              <Input value={form.nikIbu ?? ''} onChange={(e) => set('nikIbu', e.target.value)} placeholder="16 digit NIK" maxLength={16} />
            </Field>
          </div>

          <Field label="Status Ibu">
            <Select value={form.statusIbu ?? ''} onChange={(e) => set('statusIbu', e.target.value || undefined)} options={STATUS_ORANG_TUA_OPTIONS} placeholder="Pilih" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Pekerjaan Ibu">
              <Input value={form.pekerjaanIbu ?? ''} onChange={(e) => set('pekerjaanIbu', e.target.value)} placeholder="Pekerjaan" />
            </Field>
            <Field label="Pendidikan Terakhir Ibu">
              <Select value={form.pendidikanIbu ?? ''} onChange={(e) => set('pendidikanIbu', e.target.value || undefined)} options={JENJANG_PENDIDIKAN_OPTIONS} placeholder="Pilih" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Penghasilan Bulanan Ibu">
              <Select value={form.penghasilanIbu ?? ''} onChange={(e) => set('penghasilanIbu', e.target.value || undefined)} options={PENGHASILAN_OPTIONS} placeholder="Pilih rentang" />
            </Field>
            <Field label="No. Telepon Ibu">
              <Input value={form.noTelpIbu ?? ''} onChange={(e) => set('noTelpIbu', e.target.value)} placeholder="08xx" />
            </Field>
          </div>

          <SectionTitle>Data Wali (Opsional)</SectionTitle>
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">Isi hanya jika ada wali selain ayah/ibu.</p>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Nama Wali">
              <Input value={form.namaWali ?? ''} onChange={(e) => set('namaWali', e.target.value.toUpperCase())} placeholder="Nama wali" />
            </Field>
            <Field label="Hubungan Wali">
              <Input value={form.hubunganWali ?? ''} onChange={(e) => set('hubunganWali', e.target.value)} placeholder="Kakek, Paman, dll" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="NIK Wali">
              <Input value={form.nikWali ?? ''} onChange={(e) => set('nikWali', e.target.value)} placeholder="16 digit NIK" maxLength={16} />
            </Field>
            <Field label="No. Telepon Wali">
              <Input value={form.noTelpWali ?? ''} onChange={(e) => set('noTelpWali', e.target.value)} placeholder="08xx" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Pekerjaan Wali">
              <Input value={form.pekerjaanWali ?? ''} onChange={(e) => set('pekerjaanWali', e.target.value)} placeholder="Pekerjaan" />
            </Field>
            <Field label="Pendidikan Terakhir Wali">
              <Select value={form.pendidikanWali ?? ''} onChange={(e) => set('pendidikanWali', e.target.value || undefined)} options={JENJANG_PENDIDIKAN_OPTIONS} placeholder="Pilih" />
            </Field>
          </div>
        </div>
      )}

      {/* ── STEP 6: REVIEW & SUBMIT ───────────────────────────────── */}
      {step === 6 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Periksa & Kirimkan</h2>

          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 space-y-1">
            <p className="font-medium">Perhatian sebelum mengirim</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>Setelah dikirim, data tidak dapat diubah kecuali dikembalikan oleh admin.</li>
              <li>Pastikan semua data sudah benar dan sesuai dokumen resmi.</li>
              <li>Nama lengkap dan nama orang tua menggunakan huruf kapital.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            {[
              ['Nama Lengkap', (form.namaLengkap ?? '').toUpperCase()],
              ['NISN', form.nisn ?? '-'],
              ['NIS', form.nis ?? '-'],
              ['Jenis Kelamin', form.jenisKelamin === 'L' ? 'Laki-laki' : form.jenisKelamin === 'P' ? 'Perempuan' : '-'],
              ['Tempat, Tgl Lahir', `${form.tempatLahir ?? '-'}, ${tglD ? `${String(tglD).padStart(2,'0')} ${MONTHS_LABEL[parseInt(tglM)-1]} ${tglY}` : '-'}`],
              ['Agama', form.agama ?? '-'],
              ['Alamat', form.alamat ?? '-'],
              ['No. HP', form.noTelepon ?? '-'],
              ['Nama Ayah', (form.namaAyah ?? '-').toUpperCase()],
              ['Nama Ibu', (form.namaIbu ?? '-').toUpperCase()],
              ['Sekolah Asal', form.namaSekolahAsal ?? '-'],
              ['Peminatan', form.peminatan ?? '-'],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-2 px-4 py-2.5">
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {saveError && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 mt-4 text-sm text-red-700 dark:text-red-400">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={handlePrev}
          disabled={step === 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft size={15} /> Kembali
        </button>

        <div className="flex items-center gap-2">
          {/* Save draft */}
          <button
            type="button"
            onClick={saveDraft}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 transition-colors"
          >
            {saving ? <span className="h-3.5 w-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
            Simpan Draf
          </button>

          {step < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 transition-colors"
            >
              {saving ? <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Lanjut <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 transition-colors"
            >
              {submitting ? <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
              {submitting ? 'Mengirim...' : 'Kirim Formulir'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
