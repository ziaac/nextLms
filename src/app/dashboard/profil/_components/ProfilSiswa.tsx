'use client'

import { useState } from 'react'
import { Edit, FileText } from 'lucide-react'
import { Button, PageHeader, Skeleton, Badge } from '@/components/ui'
import { useProfil } from '@/hooks/users/useProfil'
import { ProfilSection, ProfilField } from './ProfilSection'
import { ProfilEditModal } from './ProfilEditModal'
import { ProfilFotoCard } from './ProfilFotoCard'
import { ProfilDokumenSection } from './ProfilDokumenSection'

export function ProfilSiswa() {
  const { data, isLoading } = useProfil()
  const [editOpen, setEditOpen] = useState(false)

  const p = data?.profile

  const JALUR_LABEL: Record<string, string> = {
    ZONASI: 'Zonasi', PRESTASI: 'Prestasi', AFIRMASI: 'Afirmasi',
    PERPINDAHAN: 'Perpindahan Tugas Orang Tua', REGULER: 'Reguler',
  }
  const TINGGAL_LABEL: Record<string, string> = {
    ORANG_TUA: 'Bersama Orang Tua', WALI: 'Bersama Wali',
    ASRAMA: 'Asrama', PONDOK: 'Pondok Pesantren',
    PANTI: 'Panti Asuhan', LAINNYA: 'Lainnya',
  }
  const TRANSPORTASI_LABEL: Record<string, string> = {
    JALAN_KAKI: 'Jalan Kaki', SEPEDA: 'Sepeda', MOTOR: 'Motor',
    MOBIL: 'Mobil', ANGKUTAN_UMUM: 'Angkutan Umum', LAINNYA: 'Lainnya',
  }
  const PENDIDIKAN_LABEL: Record<string, string> = {
    TIDAK_SEKOLAH: 'Tidak Sekolah', SD: 'SD', SMP: 'SMP', SMA: 'SMA/SMK',
    D1: 'D1', D2: 'D2', D3: 'D3', D4: 'D4', S1: 'S1', S2: 'S2', S3: 'S3',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil Saya"
        description="Biodata lengkap siswa"
        actions={
          <Button leftIcon={<Edit size={16} />} onClick={() => setEditOpen(true)}>
            Edit Profil
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 rounded-2xl" />
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Foto & info singkat */}
            <ProfilFotoCard
              namaLengkap={p?.namaLengkap ?? ''}
              fotoUrl={p?.fotoUrl}
              role={data?.role}
              email={data?.email}
              username={data?.username}
              extra={[
                { label: 'NISN', value: p?.nisn },
                { label: 'NIS', value: p?.nis },
                { label: 'Tahun Masuk', value: p?.tahunMasuk?.toString() },
              ]}
            >
              {p?.penerimaKIP && (
                <div className="mt-3 flex justify-center">
                  <Badge variant="warning">Penerima KIP/PKH</Badge>
                </div>
              )}
            </ProfilFotoCard>

            {/* Identitas & Pendaftaran */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
              <ProfilSection title="Identitas Pribadi">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ProfilField label="Nama Lengkap" value={p?.namaLengkap} />
                  <ProfilField label="Nama Panggilan" value={p?.namaPanggilan} />
                  <ProfilField label="Jenis Kelamin" value={p?.jenisKelamin === 'L' ? 'Laki-laki' : p?.jenisKelamin === 'P' ? 'Perempuan' : null} />
                  <ProfilField label="Agama" value={p?.agama} />
                  <ProfilField label="Tempat Lahir" value={p?.tempatLahir} />
                  <ProfilField label="Tanggal Lahir" value={p?.tanggalLahir ? new Date(p.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
                  <ProfilField label="Cita-cita" value={p?.citaCita} />
                  <ProfilField label="Hobi" value={p?.hobi} />
                  <ProfilField label="Ukuran Baju" value={p?.ukuranBaju} />
                  <ProfilField label="Riwayat Penyakit" value={p?.riwayatPenyakit} />
                  <ProfilField label="Kebutuhan Khusus" value={p?.kebutuhanKhusus} />
                </div>
              </ProfilSection>

              <ProfilSection title="Nomor Identitas & Pendaftaran">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ProfilField label="NIK" value={p?.nik} />
                  <ProfilField label="No. Kartu Keluarga" value={p?.noKK} />
                  <ProfilField label="NISN" value={p?.nisn} />
                  <ProfilField label="NIS" value={p?.nis} />
                  <ProfilField label="Tahun Masuk" value={p?.tahunMasuk?.toString()} />
                  <ProfilField label="Nomor Pendaftaran" value={p?.nomorPendaftaran} />
                  <ProfilField label="Jalur Pendaftaran" value={p?.jalurPendaftaran ? JALUR_LABEL[p.jalurPendaftaran] : null} />
                </div>
              </ProfilSection>
            </div>
          </div>

          {/* Sekolah Asal */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
            <ProfilSection title="Sekolah Asal">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ProfilField label="Nama Sekolah Asal" value={p?.namaSekolahAsal} />
                <ProfilField label="NPSN Sekolah Asal" value={p?.npsnSekolahAsal} />
                <ProfilField label="Status Sekolah" value={p?.statusSekolahAsal} />
                <div className="sm:col-span-2">
                  <ProfilField label="Alamat Sekolah Asal" value={p?.alamatSekolahAsal} />
                </div>
              </div>
            </ProfilSection>

            <ProfilSection title="Data Keluarga">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ProfilField label="Anak Ke-" value={p?.anakKe?.toString()} />
                <ProfilField label="Jumlah Saudara Kandung" value={p?.jumlahSaudaraKandung?.toString()} />
                <ProfilField label="Status Anak" value={p?.statusAnak} />
                <ProfilField label="Status Orang Tua" value={p?.statusOrtuKandung?.replace('_', ' ')} />
                <ProfilField label="Jenis Tinggal" value={p?.jenisTinggal ? TINGGAL_LABEL[p.jenisTinggal] : null} />
                <ProfilField label="Alat Transportasi" value={p?.alatTransportasi ? TRANSPORTASI_LABEL[p.alatTransportasi] : null} />
                <ProfilField label="Jarak ke Sekolah" value={p?.jarakKeSekolah ? `${p.jarakKeSekolah} km` : null} />
              </div>
            </ProfilSection>

            <ProfilSection title="Kontak & Alamat">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ProfilField label="No. Telepon" value={p?.noTelepon} />
                <ProfilField label="No. WhatsApp" value={p?.noWa} />
                <ProfilField label="No. Telp Rumah" value={p?.noTelpRumah} />
                <div className="sm:col-span-2">
                  <ProfilField label="Alamat Lengkap" value={p?.alamat} />
                </div>
                <ProfilField label="Kelurahan" value={p?.kelurahan} />
                <ProfilField label="Kecamatan" value={p?.kecamatan} />
                <ProfilField label="Kabupaten / Kota" value={p?.kabupaten} />
                <ProfilField label="Provinsi" value={p?.provinsi} />
              </div>
            </ProfilSection>

            <ProfilSection title="Data Fisik">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ProfilField label="Golongan Darah" value={p?.bloodType?.replace('_POS', '+').replace('_NEG', '-')} />
                <ProfilField label="Tinggi Badan" value={p?.tinggi ? `${p.tinggi} cm` : null} />
                <ProfilField label="Berat Badan" value={p?.berat ? `${p.berat} kg` : null} />
              </div>
            </ProfilSection>
          </div>

          {/* Orang Tua */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
              <p className="font-semibold text-gray-800 dark:text-gray-100">Data Ayah</p>
              <div className="grid grid-cols-1 gap-3">
                <ProfilField label="Nama Ayah" value={p?.namaAyah} />
                <ProfilField label="NIK Ayah" value={p?.nikAyah} />
                <ProfilField label="Status" value={p?.statusAyah === 'HIDUP' ? 'Masih Hidup' : p?.statusAyah === 'MENINGGAL' ? 'Sudah Meninggal' : null} />
                <ProfilField label="No. Telp Ayah" value={p?.noTelpAyah} />
                <ProfilField label="Pekerjaan" value={p?.pekerjaanAyah} />
                <ProfilField label="Pendidikan" value={p?.pendidikanAyah ? PENDIDIKAN_LABEL[p.pendidikanAyah] : null} />
                <ProfilField label="Penghasilan / bulan" value={p?.penghasilanAyah} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
              <p className="font-semibold text-gray-800 dark:text-gray-100">Data Ibu</p>
              <div className="grid grid-cols-1 gap-3">
                <ProfilField label="Nama Ibu" value={p?.namaIbu} />
                <ProfilField label="NIK Ibu" value={p?.nikIbu} />
                <ProfilField label="Status" value={p?.statusIbu === 'HIDUP' ? 'Masih Hidup' : p?.statusIbu === 'MENINGGAL' ? 'Sudah Meninggal' : null} />
                <ProfilField label="No. Telp Ibu" value={p?.noTelpIbu} />
                <ProfilField label="Pekerjaan" value={p?.pekerjaanIbu} />
                <ProfilField label="Pendidikan" value={p?.pendidikanIbu ? PENDIDIKAN_LABEL[p.pendidikanIbu] : null} />
                <ProfilField label="Penghasilan / bulan" value={p?.penghasilanIbu} />
              </div>
            </div>
          </div>

          {/* Wali */}
          {(p?.namaWali || p?.nikWali) && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
              <p className="font-semibold text-gray-800 dark:text-gray-100">Data Wali</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ProfilField label="Nama Wali" value={p?.namaWali} />
                <ProfilField label="NIK Wali" value={p?.nikWali} />
                <ProfilField label="Hubungan" value={p?.hubunganWali} />
                <ProfilField label="No. Telp Wali" value={p?.noTelpWali} />
                <ProfilField label="Pekerjaan" value={p?.pekerjaanWali} />
                <ProfilField label="Pendidikan" value={p?.pendidikanWali ? PENDIDIKAN_LABEL[p.pendidikanWali] : null} />
                <ProfilField label="Penghasilan / bulan" value={p?.penghasilanWali} />
              </div>
            </div>
          )}

          {/* Dokumen */}
          <ProfilDokumenSection profile={p} />
        </div>
      )}

      <ProfilEditModal open={editOpen} onClose={() => setEditOpen(false)} mode="siswa" />
    </div>
  )
}
