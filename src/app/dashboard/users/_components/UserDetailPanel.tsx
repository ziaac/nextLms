'use client'

import { useState } from 'react'
import { Eye } from 'lucide-react'
import { SlideOver, Badge } from '@/components/ui'
import { FilePreview } from '@/components/ui/FilePreview'
import { RoleBadge } from './UserBadge'
import { useUser } from '@/hooks/users/useUsers'
import { getInitials } from '@/lib/utils'
import { getPublicFileUrl as getFileUrl } from '@/lib/constants'
import { formatTanggalSaja } from '@/lib/helpers/timezone'
import type { UserItem } from '@/types/users.types'

interface UserDetailPanelProps {
  user: UserItem | null
  onClose: () => void
  onEdit: (user: UserItem) => void
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin',
  KEPALA_SEKOLAH: 'Kepala Sekolah', WAKIL_KEPALA: 'Wakil Kepala',
  GURU: 'Guru', WALI_KELAS: 'Wali Kelas', SISWA: 'Siswa',
  ORANG_TUA: 'Orang Tua', STAFF_TU: 'Staff TU', STAFF_KEUANGAN: 'Staff Keuangan',
}

const PENDIDIKAN_LABEL: Record<string, string> = {
  TIDAK_SEKOLAH: 'Tidak Sekolah', SD: 'SD', SMP: 'SMP', SMA: 'SMA/SMK',
  D1: 'D1', D2: 'D2', D3: 'D3', D4: 'D4', S1: 'S1', S2: 'S2', S3: 'S3',
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

const BLOOD_DISPLAY: Record<string, string> = {
  A_POS: 'A+', A_NEG: 'A-', B_POS: 'B+', B_NEG: 'B-',
  AB_POS: 'AB+', AB_NEG: 'AB-', O_POS: 'O+', O_NEG: 'O-',
}

export function UserDetailPanel({ user, onClose, onEdit }: UserDetailPanelProps) {
  const { data, isLoading } = useUser(user?.id ?? '')
  const [preview, setPreview] = useState<{ key: string; label: string } | null>(null)

  const nama = data?.profile?.namaLengkap ?? user?.profile?.namaLengkap ?? '-'
  const foto = data?.profile?.fotoUrl ? getFileUrl(data.profile.fotoUrl) : null

  return (
    <>
      <SlideOver
        open={!!user}
        onClose={onClose}
        title="Detail Pengguna"
        description={user ? ROLE_LABEL[user.role] : ''}
        width="lg"
      >
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <div className="p-0 space-y-6 pb-10">

            {/* Avatar + info utama */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center flex-shrink-0">
                {foto
                  ? <img src={foto} alt={nama} className="w-full h-full object-cover" />
                  : <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{getInitials(nama)}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{nama}</h3>
                {data.profile.namaPanggilan && (
                  <p className="text-sm text-gray-400">Panggilan: {data.profile.namaPanggilan}</p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <RoleBadge role={data.role} />
                  <Badge variant={data.isActive ? 'success' : 'default'}>
                    {data.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                  {data.profile.tahunMasuk && (
                    <Badge variant="info">Angkatan {data.profile.tahunMasuk}</Badge>
                  )}
                </div>
              </div>
              <button
                onClick={() => { onClose(); onEdit(user!) }}
                className="flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                Edit
              </button>
            </div>

            {/* Akun */}
            <Section title="Akun">
              <Grid>
                <Field label="Email"         value={data.email} />
                <Field label="Username"      value={data.username} />
                <Field label="Login Terakhir"
                  value={data.lastLoginAt ? formatTanggalSaja(data.lastLoginAt) : '-'} />
                <Field label="Login Count"   value={data.loginCount?.toString()} />
              </Grid>
            </Section>

            {/* Identitas */}
            <Section title="Identitas Pribadi">
              <Grid>
                <Field label="Nama Lengkap"  value={data.profile.namaLengkap} />
                <Field label="Jenis Kelamin"
                  value={data.profile.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
                <Field label="Tempat Lahir"  value={data.profile.tempatLahir} />
                <Field label="Tanggal Lahir"
                  value={data.profile.tanggalLahir ? formatTanggalSaja(data.profile.tanggalLahir) : undefined} />
                <Field label="Agama"         value={data.profile.agama} />
                <Field label="Gol. Darah"
                  value={data.profile.bloodType ? BLOOD_DISPLAY[data.profile.bloodType] : undefined} />
                <Field label="Tinggi"        value={data.profile.tinggi ? `${data.profile.tinggi} cm` : undefined} />
                <Field label="Berat"         value={data.profile.berat ? `${data.profile.berat} kg` : undefined} />
              </Grid>
            </Section>

            {/* Nomor Identitas */}
            <Section title="Nomor Identitas">
              <Grid>
                <Field label="NIK"    value={data.profile.nik} />
                <Field label="No. KK" value={data.profile.noKK} />
                <Field label="NISN"   value={data.profile.nisn} />
                <Field label="NIP"    value={data.profile.nip} />
                <Field label="NUPTK"  value={data.profile.nuptk} />
              </Grid>
            </Section>

            {/* Kontak */}
            <Section title="Kontak">
              <Grid>
                <Field label="No. HP"     value={data.profile.noTelepon} />
                <Field label="WhatsApp"   value={data.profile.noWa} />
                <Field label="Telp Rumah" value={data.profile.noTelpRumah} />
              </Grid>
            </Section>

            {/* Alamat */}
            <Section title="Alamat">
              <div className="space-y-2">
                {data.profile.alamat && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">{data.profile.alamat}</p>
                )}
                <Grid>
                  <Field label="Kelurahan" value={data.profile.kelurahan} />
                  <Field label="Kecamatan" value={data.profile.kecamatan} />
                  <Field label="Kabupaten" value={data.profile.kabupaten} />
                  <Field label="Provinsi"  value={data.profile.provinsi} />
                  <Field label="Kode Pos"  value={data.profile.kodePos} />
                </Grid>
              </div>
            </Section>

            {/* Data Tambahan */}
            <Section title="Data Tambahan">
              <Grid>
                <Field label="Tahun Masuk"    value={data.profile.tahunMasuk?.toString()} />
                <Field label="Sekolah Asal"   value={data.profile.namaSekolahAsal} />
                <Field label="Anak Ke-"       value={data.profile.anakKe?.toString()} />
                <Field label="Jml Saudara"    value={data.profile.jumlahSaudaraKandung?.toString()} />
                <Field label="Jenis Tinggal"
                  value={data.profile.jenisTinggal ? TINGGAL_LABEL[data.profile.jenisTinggal] : undefined} />
                <Field label="Transportasi"
                  value={data.profile.alatTransportasi ? TRANSPORTASI_LABEL[data.profile.alatTransportasi] : undefined} />
                <Field label="Jarak ke Sekolah"
                  value={data.profile.jarakKeSekolah ? `${data.profile.jarakKeSekolah} km` : undefined} />
                <Field label="Penerima KIP"
                  value={data.profile.penerimaKIP ? 'Ya' : 'Tidak'} />
                {data.profile.penerimaKIP && (
                  <Field label="Nomor KIP" value={data.profile.nomorKIP} />
                )}
              </Grid>
            </Section>

            {/* Data Ayah */}
            <Section title="Data Orang Tua — Ayah">
              <Grid>
                <Field label="Nama"       value={data.profile.namaAyah} />
                <Field label="NIK"        value={data.profile.nikAyah} />
                <Field label="Pekerjaan"  value={data.profile.pekerjaanAyah} />
                <Field label="Pendidikan"
                  value={data.profile.pendidikanAyah ? PENDIDIKAN_LABEL[data.profile.pendidikanAyah] : undefined} />
                <Field label="Penghasilan" value={data.profile.penghasilanAyah} />
              </Grid>
            </Section>

            {/* Data Ibu */}
            <Section title="Data Orang Tua — Ibu">
              <Grid>
                <Field label="Nama"       value={data.profile.namaIbu} />
                <Field label="NIK"        value={data.profile.nikIbu} />
                <Field label="Pekerjaan"  value={data.profile.pekerjaanIbu} />
                <Field label="Pendidikan"
                  value={data.profile.pendidikanIbu ? PENDIDIKAN_LABEL[data.profile.pendidikanIbu] : undefined} />
                <Field label="Penghasilan" value={data.profile.penghasilanIbu} />
              </Grid>
            </Section>

            {/* Data Wali */}
            {data.profile.namaWali && (
              <Section title="Data Wali">
                <Grid>
                  <Field label="Nama"        value={data.profile.namaWali} />
                  <Field label="Hubungan"    value={data.profile.hubunganWali} />
                  <Field label="NIK"         value={data.profile.nikWali} />
                  <Field label="No. Telp"    value={data.profile.noTelpWali} />
                  <Field label="Pekerjaan"   value={data.profile.pekerjaanWali} />
                  <Field label="Pendidikan"
                    value={data.profile.pendidikanWali ? PENDIDIKAN_LABEL[data.profile.pendidikanWali] : undefined} />
                  <Field label="Penghasilan" value={data.profile.penghasilanWali} />
                </Grid>
              </Section>
            )}

            {/* Dokumen */}
            {(data.profile.aktaKey || data.profile.kkKey || data.profile.kipKey) && (
              <Section title="Dokumen">
                <div className="space-y-2">
                  {data.profile.aktaKey && (
                    <DocItem
                      label="Akta Kelahiran"
                      docKey={data.profile.aktaKey}
                      onPreview={() => setPreview({ key: data.profile.aktaKey!, label: 'Akta Kelahiran' })}
                    />
                  )}
                  {data.profile.kkKey && (
                    <DocItem
                      label="Kartu Keluarga"
                      docKey={data.profile.kkKey}
                      onPreview={() => setPreview({ key: data.profile.kkKey!, label: 'Kartu Keluarga' })}
                    />
                  )}
                  {data.profile.kipKey && (
                    <DocItem
                      label="KIP / PKH"
                      docKey={data.profile.kipKey}
                      onPreview={() => setPreview({ key: data.profile.kipKey!, label: 'KIP / PKH' })}
                    />
                  )}
                </div>
              </Section>
            )}

          </div>
        ) : null}
      </SlideOver>

      {/* File Preview Modal */}
      <FilePreview
        open={!!preview}
        onClose={() => setPreview(null)}
        docKey={preview?.key ?? null}
        label={preview?.label}
      />
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-400/40 pt-3">
        {title}
      </p>
      {children}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-gray-800 dark:text-gray-200">{value}</p>
    </div>
  )
}

function DocItem({ label, docKey, onPreview }: {
  label: string
  docKey: string
  onPreview: () => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <button
        type="button"
        onClick={onPreview}
        className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
      >
        <Eye size={13} />
        Lihat
      </button>
    </div>
  )
}
