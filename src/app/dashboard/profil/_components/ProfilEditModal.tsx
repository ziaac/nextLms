'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, Button, Input, Select, WilayahAutocomplete, FileUpload, FotoProfilUpload } from '@/components/ui'
import type { WilayahValue } from '@/components/ui/WilayahAutocomplete'
import { useProfil } from '@/hooks/users/useProfil'
import { uploadApi } from '@/lib/api/upload.api'
import { usersApi } from '@/lib/api/users.api'
import { getErrorMessage } from '@/lib/utils'

export type ProfilEditMode = 'admin' | 'guru' | 'siswa'

interface Props {
  open: boolean
  onClose: () => void
  mode: ProfilEditMode
}

const BLOOD_OPTIONS = [
  { value: 'A_POS', label: 'A+' }, { value: 'A_NEG', label: 'A-' },
  { value: 'B_POS', label: 'B+' }, { value: 'B_NEG', label: 'B-' },
  { value: 'AB_POS', label: 'AB+' }, { value: 'AB_NEG', label: 'AB-' },
  { value: 'O_POS', label: 'O+' }, { value: 'O_NEG', label: 'O-' },
]
const TINGGAL_OPTIONS = [
  { value: 'ORANG_TUA', label: 'Bersama Orang Tua' }, { value: 'WALI', label: 'Bersama Wali' },
  { value: 'ASRAMA', label: 'Asrama' }, { value: 'PONDOK', label: 'Pondok Pesantren' },
  { value: 'PANTI', label: 'Panti Asuhan' }, { value: 'LAINNYA', label: 'Lainnya' },
]
const TRANSPORTASI_OPTIONS = [
  { value: 'JALAN_KAKI', label: 'Jalan Kaki' }, { value: 'SEPEDA', label: 'Sepeda' },
  { value: 'MOTOR', label: 'Motor' }, { value: 'MOBIL', label: 'Mobil' },
  { value: 'ANGKUTAN_UMUM', label: 'Angkutan Umum' }, { value: 'LAINNYA', label: 'Lainnya' },
]
const PENDIDIKAN_OPTIONS = [
  { value: 'TIDAK_SEKOLAH', label: 'Tidak Sekolah' }, { value: 'SD', label: 'SD' },
  { value: 'SMP', label: 'SMP' }, { value: 'SMA', label: 'SMA/SMK' },
  { value: 'D1', label: 'D1' }, { value: 'D2', label: 'D2' }, { value: 'D3', label: 'D3' },
  { value: 'D4', label: 'D4' }, { value: 'S1', label: 'S1' }, { value: 'S2', label: 'S2' }, { value: 'S3', label: 'S3' },
]
const JALUR_OPTIONS = [
  { value: 'ZONASI', label: 'Zonasi' }, { value: 'PRESTASI', label: 'Prestasi' },
  { value: 'AFIRMASI', label: 'Afirmasi' }, { value: 'PERPINDAHAN', label: 'Perpindahan Tugas Orang Tua' },
  { value: 'REGULER', label: 'Reguler' },
]
const STATUS_ANAK_OPTIONS = [
  { value: 'KANDUNG', label: 'Anak Kandung' }, { value: 'TIRI', label: 'Anak Tiri' }, { value: 'ANGKAT', label: 'Anak Angkat' },
]
const STATUS_ORTU_OPTIONS = [
  { value: 'LENGKAP', label: 'Lengkap (Ayah & Ibu)' }, { value: 'CERAI_HIDUP', label: 'Cerai Hidup' },
  { value: 'CERAI_MATI', label: 'Cerai Mati / Salah Satu Meninggal' },
]
const STATUS_ORTU_KANDUNG_OPTIONS = [
  { value: 'HIDUP', label: 'Masih Hidup' }, { value: 'MENINGGAL', label: 'Sudah Meninggal' },
]
const STATUS_SEKOLAH_OPTIONS = [
  { value: 'NEGERI', label: 'Negeri' }, { value: 'SWASTA', label: 'Swasta' }, { value: 'LUAR_NEGERI', label: 'Luar Negeri' },
]
const UKURAN_BAJU_OPTIONS = [
  { value: 'S', label: 'S' }, { value: 'M', label: 'M' }, { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' }, { value: 'XXL', label: 'XXL' },
]
const AGAMA_OPTIONS = [
  { value: 'ISLAM', label: 'Islam' }, { value: 'KRISTEN', label: 'Kristen' },
  { value: 'KATOLIK', label: 'Katolik' }, { value: 'HINDU', label: 'Hindu' },
  { value: 'BUDHA', label: 'Budha' }, { value: 'KONGHUCU', label: 'Konghucu' },
]
const JK_OPTIONS = [{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]

const formSchema = z.object({
  namaLengkap:   z.string().min(2, 'Minimal 2 karakter'),
  namaPanggilan: z.string().optional(),
  jenisKelamin:  z.string().min(1, 'Wajib dipilih'),
  tempatLahir:   z.string().min(2, 'Wajib diisi'),
  tanggalLahir:  z.string().min(1, 'Wajib diisi'),
  agama:         z.string().optional(),
  nik:           z.string().optional(),
  noKK:          z.string().optional(),
  nip:           z.string().optional(),
  nuptk:         z.string().optional(),
  nisn:          z.string().optional(),
  nis:           z.string().optional(),
  tahunMasuk:    z.string().optional(),
  nomorPendaftaran: z.string().optional(),
  jalurPendaftaran: z.string().optional(),
  namaSekolahAsal:   z.string().optional(),
  npsnSekolahAsal:   z.string().optional(),
  statusSekolahAsal: z.string().optional(),
  alamatSekolahAsal: z.string().optional(),
  anakKe:               z.string().optional(),
  jumlahSaudaraKandung: z.string().optional(),
  statusAnak:           z.string().optional(),
  statusOrtuKandung:    z.string().optional(),
  jenisTinggal:         z.string().optional(),
  alatTransportasi:     z.string().optional(),
  jarakKeSekolah:       z.string().optional(),
  noTelepon:   z.string().optional(),
  noWa:        z.string().optional(),
  noTelpRumah: z.string().optional(),
  penerimaKIP: z.boolean().optional(),
  nomorKIP:    z.string().optional(),
  alamat:  z.string().optional(),
  kodePos: z.string().optional(),
  wilayah: z.object({
    kelurahan: z.string().optional(), kecamatan: z.string().optional(),
    kabupaten: z.string().optional(), provinsi:  z.string().optional(),
    kodeKelurahan: z.string().optional(),
  }).optional(),
  bloodType: z.string().optional(),
  tinggi:    z.string().optional(),
  berat:     z.string().optional(),
  citaCita:        z.string().optional(),
  hobi:            z.string().optional(),
  riwayatPenyakit: z.string().optional(),
  kebutuhanKhusus: z.string().optional(),
  ukuranBaju:      z.string().optional(),
  namaAyah: z.string().optional(), nikAyah: z.string().optional(),
  statusAyah: z.string().optional(), noTelpAyah: z.string().optional(),
  pekerjaanAyah: z.string().optional(), pendidikanAyah: z.string().optional(), penghasilanAyah: z.string().optional(),
  namaIbu: z.string().optional(), nikIbu: z.string().optional(),
  statusIbu: z.string().optional(), noTelpIbu: z.string().optional(),
  pekerjaanIbu: z.string().optional(), pendidikanIbu: z.string().optional(), penghasilanIbu: z.string().optional(),
  namaWali: z.string().optional(), nikWali: z.string().optional(),
  hubunganWali: z.string().optional(), noTelpWali: z.string().optional(),
  pekerjaanWali: z.string().optional(), pendidikanWali: z.string().optional(), penghasilanWali: z.string().optional(),
  fotoUrl:      z.string().optional(),
  aktaKey:      z.string().optional(),
  kkKey:        z.string().optional(),
  kipKey:       z.string().optional(),
  ijazahLaluKey: z.string().optional(),
  raporKey:      z.string().optional(),
  skhunKey:      z.string().optional(),
  sertifikatKey: z.string().optional(),
  ktpOrtuKey:    z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

function toDateInput(iso?: string | null) {
  if (!iso) return ''
  return iso.split('T')[0]
}

function buildPayload(data: FormData) {
  const wilayah = data.wilayah as WilayahValue | undefined
  const payload: Record<string, unknown> = { ...data }
  delete payload.wilayah
  delete payload.fotoUrl
  if (wilayah?.kelurahan) payload.kelurahan = wilayah.kelurahan
  if (wilayah?.kecamatan) payload.kecamatan = wilayah.kecamatan
  if (wilayah?.kabupaten) payload.kabupaten = wilayah.kabupaten
  if (wilayah?.provinsi)  payload.provinsi  = wilayah.provinsi
  if (payload.tinggi)               payload.tinggi               = parseInt(payload.tinggi as string)
  if (payload.berat)                payload.berat                = parseInt(payload.berat as string)
  if (payload.anakKe)               payload.anakKe               = parseInt(payload.anakKe as string)
  if (payload.jumlahSaudaraKandung) payload.jumlahSaudaraKandung = parseInt(payload.jumlahSaudaraKandung as string)
  if (payload.jarakKeSekolah)       payload.jarakKeSekolah       = parseFloat(payload.jarakKeSekolah as string)
  if (payload.tahunMasuk)           payload.tahunMasuk           = parseInt(payload.tahunMasuk as string)
  return Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== '' && v !== undefined && v !== null))
}

const FORM_ID = 'profil-edit-form'

export function ProfilEditModal({ open, onClose, mode }: Props) {
  const { data: userDetail, isLoading, updateMutation, userId } = useProfil()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const formTopRef = useRef<HTMLDivElement>(null)
  const prevOpen = useRef(false)

  const form = useForm<FormData>({ resolver: zodResolver(formSchema) })
  const penerimaKIP = form.watch('penerimaKIP')
  const isSiswa = mode === 'siswa'
  const isGuru  = mode === 'guru'

  useEffect(() => {
    if (open && !prevOpen.current) {
      updateMutation.reset()
      setSubmitError(null)
    }
    prevOpen.current = open
  }, [open])

  useEffect(() => {
    if (!open || !userDetail) return
    const p = userDetail.profile
    form.reset({
      namaLengkap:   p.namaLengkap   ?? '',
      namaPanggilan: p.namaPanggilan  ?? '',
      jenisKelamin:  p.jenisKelamin   ?? '',
      tempatLahir:   p.tempatLahir    ?? '',
      tanggalLahir:  toDateInput(p.tanggalLahir),
      agama:         p.agama          ?? 'ISLAM',
      nik:           p.nik            ?? '',
      noKK:          p.noKK           ?? '',
      nip:           p.nip            ?? '',
      nuptk:         p.nuptk          ?? '',
      nisn:          p.nisn           ?? '',
      nis:           p.nis            ?? '',
      tahunMasuk:    p.tahunMasuk?.toString() ?? '',
      nomorPendaftaran:  p.nomorPendaftaran  ?? '',
      jalurPendaftaran:  p.jalurPendaftaran  ?? '',
      namaSekolahAsal:   p.namaSekolahAsal   ?? '',
      npsnSekolahAsal:   p.npsnSekolahAsal   ?? '',
      statusSekolahAsal: p.statusSekolahAsal ?? '',
      alamatSekolahAsal: p.alamatSekolahAsal ?? '',
      anakKe:               p.anakKe?.toString()               ?? '',
      jumlahSaudaraKandung: p.jumlahSaudaraKandung?.toString() ?? '',
      statusAnak:           p.statusAnak           ?? '',
      statusOrtuKandung:    p.statusOrtuKandung    ?? '',
      jenisTinggal:         p.jenisTinggal         ?? '',
      alatTransportasi:     p.alatTransportasi      ?? '',
      jarakKeSekolah:       p.jarakKeSekolah?.toString() ?? '',
      noTelepon:   p.noTelepon   ?? '',
      noWa:        p.noWa        ?? '',
      noTelpRumah: p.noTelpRumah ?? '',
      penerimaKIP: p.penerimaKIP ?? false,
      nomorKIP:    p.nomorKIP    ?? '',
      alamat:      p.alamat      ?? '',
      kodePos:     p.kodePos     ?? '',
      wilayah: { kelurahan: p.kelurahan ?? '', kecamatan: p.kecamatan ?? '', kabupaten: p.kabupaten ?? '', provinsi: p.provinsi ?? '' },
      bloodType:  p.bloodType ?? '',
      tinggi:     p.tinggi?.toString() ?? '',
      berat:      p.berat?.toString()  ?? '',
      citaCita:        p.citaCita        ?? '',
      hobi:            p.hobi            ?? '',
      riwayatPenyakit: p.riwayatPenyakit ?? '',
      kebutuhanKhusus: p.kebutuhanKhusus ?? '',
      ukuranBaju:      p.ukuranBaju      ?? '',
      namaAyah: p.namaAyah ?? '', nikAyah: p.nikAyah ?? '',
      statusAyah: p.statusAyah ?? '', noTelpAyah: p.noTelpAyah ?? '',
      pekerjaanAyah: p.pekerjaanAyah ?? '', pendidikanAyah: p.pendidikanAyah ?? '', penghasilanAyah: p.penghasilanAyah ?? '',
      namaIbu: p.namaIbu ?? '', nikIbu: p.nikIbu ?? '',
      statusIbu: p.statusIbu ?? '', noTelpIbu: p.noTelpIbu ?? '',
      pekerjaanIbu: p.pekerjaanIbu ?? '', pendidikanIbu: p.pendidikanIbu ?? '', penghasilanIbu: p.penghasilanIbu ?? '',
      namaWali: p.namaWali ?? '', nikWali: p.nikWali ?? '',
      hubunganWali: p.hubunganWali ?? '', noTelpWali: p.noTelpWali ?? '',
      pekerjaanWali: p.pekerjaanWali ?? '', pendidikanWali: p.pendidikanWali ?? '', penghasilanWali: p.penghasilanWali ?? '',
      fotoUrl:      p.fotoUrl      ?? '',
      aktaKey:      p.aktaKey      ?? '',
      kkKey:        p.kkKey        ?? '',
      kipKey:       p.kipKey       ?? '',
      ijazahLaluKey: p.ijazahLaluKey ?? '',
      raporKey:      p.raporKey      ?? '',
      skhunKey:      p.skhunKey      ?? '',
      sertifikatKey: p.sertifikatKey ?? '',
      ktpOrtuKey:    p.ktpOrtuKey    ?? '',
    } as never)
  }, [open, userDetail?.id])

  const isPending = updateMutation.isPending

  const onSubmit = async (data: FormData) => {
    setSubmitError(null)
    try {
      await updateMutation.mutateAsync(buildPayload(data) as never)
      onClose()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  const r = form.register
  const e = form.formState.errors

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Profil"
      size="xl"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={isPending}>Batal</Button>
          <Button type="submit" form={FORM_ID} loading={isPending || isLoading}>Simpan Perubahan</Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
        <div className="p-6 space-y-6">
          <div ref={formTopRef} />
          {submitError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
            </div>
          )}

          {/* Foto */}
          <div className="flex justify-center">
            <FotoProfilUpload
              currentKey={form.watch('fotoUrl')}
              namaLengkap={form.watch('namaLengkap')}
              onUpload={uploadApi.fotoProfil}
              onSuccess={(key) => form.setValue('fotoUrl', key)}
              onSaveToProfile={userId ? (key) => usersApi.updateFoto(userId, key) : undefined}
              disabled={isPending}
            />
          </div>

          {/* IDENTITAS */}
          <S title="Identitas Pribadi">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input label="Nama Lengkap" error={e.namaLengkap?.message} {...r('namaLengkap')} />
              </div>
              <Input label="Nama Panggilan" {...r('namaPanggilan')} />
              <Select label="Jenis Kelamin" options={JK_OPTIONS} placeholder="Pilih..."
                error={e.jenisKelamin?.message} value={form.watch('jenisKelamin')} {...r('jenisKelamin')} />
              <Select label="Agama" options={AGAMA_OPTIONS} value={form.watch('agama')} {...r('agama')} />
              <Input label="Tempat Lahir" error={e.tempatLahir?.message} {...r('tempatLahir')} />
              <Input label="Tanggal Lahir" type="date" error={e.tanggalLahir?.message} {...r('tanggalLahir')} />
            </div>
          </S>

          {/* NOMOR IDENTITAS */}
          <S title="Nomor Identitas">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="NIK" placeholder="16 digit" {...r('nik')} />
              <Input label="No. Kartu Keluarga (KK)" placeholder="16 digit" {...r('noKK')} />
              {isSiswa && <Input label="NISN" placeholder="10 digit" {...r('nisn')} />}
              {isSiswa && <Input label="NIS" placeholder="Nomor Induk Siswa" {...r('nis')} />}
              {isSiswa && <Input label="Tahun Masuk" type="number" placeholder="2024" {...r('tahunMasuk')} />}
              {isSiswa && <Input label="Nomor Pendaftaran" {...r('nomorPendaftaran')} />}
              {isSiswa && (
                <Select label="Jalur Pendaftaran" options={JALUR_OPTIONS} placeholder="Pilih..."
                  value={form.watch('jalurPendaftaran')} {...r('jalurPendaftaran')} />
              )}
              {isGuru && <Input label="NIP" placeholder="18 digit" {...r('nip')} />}
              {isGuru && <Input label="NUPTK" placeholder="16 digit" {...r('nuptk')} />}
            </div>
          </S>

          {/* SEKOLAH ASAL — siswa */}
          {isSiswa && (
            <S title="Sekolah Asal">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nama Sekolah Asal" {...r('namaSekolahAsal')} />
                <Input label="NPSN Sekolah Asal" placeholder="8 digit" {...r('npsnSekolahAsal')} />
                <Select label="Status Sekolah" options={STATUS_SEKOLAH_OPTIONS} placeholder="Pilih..."
                  value={form.watch('statusSekolahAsal')} {...r('statusSekolahAsal')} />
                <div className="sm:col-span-2">
                  <Input label="Alamat Sekolah Asal" {...r('alamatSekolahAsal')} />
                </div>
              </div>
            </S>
          )}

          {/* DATA KELUARGA — siswa */}
          {isSiswa && (
            <S title="Data Keluarga">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Anak Ke-" type="number" placeholder="1" {...r('anakKe')} />
                <Input label="Jumlah Saudara Kandung" type="number" placeholder="0" {...r('jumlahSaudaraKandung')} />
                <Select label="Status Anak" options={STATUS_ANAK_OPTIONS} placeholder="Pilih..."
                  value={form.watch('statusAnak')} {...r('statusAnak')} />
                <Select label="Status Orang Tua Kandung" options={STATUS_ORTU_OPTIONS} placeholder="Pilih..."
                  value={form.watch('statusOrtuKandung')} {...r('statusOrtuKandung')} />
                <Select label="Jenis Tinggal" options={TINGGAL_OPTIONS} placeholder="Pilih..."
                  value={form.watch('jenisTinggal')} {...r('jenisTinggal')} />
                <Select label="Alat Transportasi" options={TRANSPORTASI_OPTIONS} placeholder="Pilih..."
                  value={form.watch('alatTransportasi')} {...r('alatTransportasi')} />
                <Input label="Jarak ke Sekolah (Km)" type="number" placeholder="0" {...r('jarakKeSekolah')} />
              </div>
            </S>
          )}

          {/* KONTAK */}
          <S title="Kontak">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="No. Telepon / HP" placeholder="08xxxxxxxxxx" {...r('noTelepon')} />
              <Input label="No. WhatsApp" placeholder="08xxxxxxxxxx" {...r('noWa')} />
              <Input label="No. Telp Rumah" placeholder="opsional" {...r('noTelpRumah')} />
            </div>
          </S>

          {/* ALAMAT */}
          <S title="Alamat">
            <div className="space-y-4">
              <Input label="Alamat Lengkap (Jl/Dusun/RT/RW)" {...r('alamat')} />
              <Controller
                control={form.control} name="wilayah"
                render={({ field }) => (
                  <WilayahAutocomplete value={field.value as WilayahValue} onChange={field.onChange} />
                )}
              />
              <Input label="Kode Pos" placeholder="5 digit" {...r('kodePos')} />
            </div>
          </S>

          {/* BANTUAN SOSIAL — siswa */}
          {isSiswa && (
            <S title="Bantuan Sosial (KIP/PKH)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 sm:col-span-2">
                  <input type="checkbox" id="penerimaKIP" {...r('penerimaKIP')} className="w-4 h-4 rounded accent-emerald-600" />
                  <label htmlFor="penerimaKIP" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">Penerima KIP / PKH</label>
                </div>
                {penerimaKIP && <Input label="Nomor KIP/PKH" {...r('nomorKIP')} />}
              </div>
            </S>
          )}

          {/* DATA PRIBADI SISWA */}
          {isSiswa && (
            <S title="Data Pribadi Siswa">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Cita-cita" placeholder="opsional" {...r('citaCita')} />
                <Input label="Hobi" placeholder="opsional" {...r('hobi')} />
                <Input label="Riwayat Penyakit" placeholder="opsional" {...r('riwayatPenyakit')} />
                <Input label="Kebutuhan Khusus" placeholder="opsional" {...r('kebutuhanKhusus')} />
                <Select label="Ukuran Baju" options={UKURAN_BAJU_OPTIONS} placeholder="Pilih..."
                  value={form.watch('ukuranBaju')} {...r('ukuranBaju')} />
              </div>
            </S>
          )}

          {/* DATA FISIK */}
          <S title="Data Fisik">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select label="Gol. Darah" options={BLOOD_OPTIONS} placeholder="Pilih..."
                value={form.watch('bloodType')} {...r('bloodType')} />
              <Input label="Tinggi Badan (cm)" type="number" {...r('tinggi')} />
              <Input label="Berat Badan (kg)" type="number" {...r('berat')} />
            </div>
          </S>

          {/* DATA AYAH — siswa */}
          {isSiswa && (
            <S title="Data Orang Tua — Ayah">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nama Ayah" {...r('namaAyah')} />
                <Input label="NIK Ayah" placeholder="16 digit" {...r('nikAyah')} />
                <Select label="Status Ayah" options={STATUS_ORTU_KANDUNG_OPTIONS} placeholder="Pilih..."
                  value={form.watch('statusAyah')} {...r('statusAyah')} />
                <Input label="No. Telp / WA Ayah" placeholder="08xxxxxxxxxx" {...r('noTelpAyah')} />
                <Input label="Pekerjaan Ayah" {...r('pekerjaanAyah')} />
                <Select label="Pendidikan Ayah" options={PENDIDIKAN_OPTIONS} placeholder="Pilih..."
                  value={form.watch('pendidikanAyah')} {...r('pendidikanAyah')} />
                <Input label="Penghasilan Ayah / bulan" placeholder="Rp" {...r('penghasilanAyah')} />
              </div>
            </S>
          )}

          {/* DATA IBU — siswa */}
          {isSiswa && (
            <S title="Data Orang Tua — Ibu">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nama Ibu" {...r('namaIbu')} />
                <Input label="NIK Ibu" placeholder="16 digit" {...r('nikIbu')} />
                <Select label="Status Ibu" options={STATUS_ORTU_KANDUNG_OPTIONS} placeholder="Pilih..."
                  value={form.watch('statusIbu')} {...r('statusIbu')} />
                <Input label="No. Telp / WA Ibu" placeholder="08xxxxxxxxxx" {...r('noTelpIbu')} />
                <Input label="Pekerjaan Ibu" {...r('pekerjaanIbu')} />
                <Select label="Pendidikan Ibu" options={PENDIDIKAN_OPTIONS} placeholder="Pilih..."
                  value={form.watch('pendidikanIbu')} {...r('pendidikanIbu')} />
                <Input label="Penghasilan Ibu / bulan" placeholder="Rp" {...r('penghasilanIbu')} />
              </div>
            </S>
          )}

          {/* DATA WALI — siswa */}
          {isSiswa && (
            <S title="Data Wali (opsional)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nama Wali" {...r('namaWali')} />
                <Input label="NIK Wali" placeholder="16 digit" {...r('nikWali')} />
                <Input label="Hubungan dengan Siswa" placeholder="Kakek, Paman, dll" {...r('hubunganWali')} />
                <Input label="No. Telp / WA Wali" {...r('noTelpWali')} />
                <Input label="Pekerjaan Wali" {...r('pekerjaanWali')} />
                <Select label="Pendidikan Wali" options={PENDIDIKAN_OPTIONS} placeholder="Pilih..."
                  value={form.watch('pendidikanWali')} {...r('pendidikanWali')} />
                <Input label="Penghasilan Wali / bulan" placeholder="Rp" {...r('penghasilanWali')} />
              </div>
            </S>
          )}

          {/* DOKUMEN — siswa */}
          {isSiswa && (
            <S title="Dokumen">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FileUpload label="Akta Kelahiran" hint="PDF / JPG / PNG, maks 5MB"
                  currentKey={form.watch('aktaKey')} onUpload={uploadApi.biodataAkta}
                  onSuccess={(key) => form.setValue('aktaKey', key)} />
                <FileUpload label="Kartu Keluarga (KK)" hint="PDF / JPG / PNG, maks 5MB"
                  currentKey={form.watch('kkKey')} onUpload={uploadApi.biodataKK}
                  onSuccess={(key) => form.setValue('kkKey', key)} />
                <FileUpload label="Ijazah / STTB Terakhir" hint="PDF / JPG / PNG, maks 5MB"
                  currentKey={form.watch('ijazahLaluKey')} onUpload={uploadApi.biodataIjazah}
                  onSuccess={(key) => form.setValue('ijazahLaluKey', key)} />
                <FileUpload label="Rapor Terakhir" hint="PDF / JPG / PNG, maks 5MB"
                  currentKey={form.watch('raporKey')} onUpload={uploadApi.biodataRapor}
                  onSuccess={(key) => form.setValue('raporKey', key)} />
                <FileUpload label="SKHUN" hint="PDF / JPG / PNG, maks 5MB"
                  currentKey={form.watch('skhunKey')} onUpload={uploadApi.biodataSkhun}
                  onSuccess={(key) => form.setValue('skhunKey', key)} />
                <FileUpload label="Sertifikat Prestasi" hint="PDF / JPG / PNG, maks 5MB"
                  currentKey={form.watch('sertifikatKey')} onUpload={uploadApi.biodataSertifikat}
                  onSuccess={(key) => form.setValue('sertifikatKey', key)} />
                <FileUpload label="KTP Orang Tua / Wali" hint="PDF / JPG / PNG, maks 5MB"
                  currentKey={form.watch('ktpOrtuKey')} onUpload={uploadApi.biodataKtpOrtu}
                  onSuccess={(key) => form.setValue('ktpOrtuKey', key)} />
                {penerimaKIP && (
                  <FileUpload label="Kartu KIP / PKH" hint="PDF / JPG / PNG, maks 5MB"
                    currentKey={form.watch('kipKey')} onUpload={uploadApi.biodataKIP}
                    onSuccess={(key) => form.setValue('kipKey', key)} />
                )}
              </div>
            </S>
          )}

        </div>
      </form>
    </Modal>
  )
}

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800/70 pt-3">
        {title}
      </p>
      {children}
    </div>
  )
}
