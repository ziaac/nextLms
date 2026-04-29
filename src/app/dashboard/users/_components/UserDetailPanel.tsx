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

const STATUS_ANAK_LABEL: Record<string, string> = {
  KANDUNG: 'Anak Kandung', TIRI: 'Anak Tiri', ANGKAT: 'Anak Angkat',
}

const STATUS_ORTU_LABEL: Record<string, string> = {
  LENGKAP: 'Lengkap (Ayah & Ibu)',
  CERAI_HIDUP: 'Cerai Hidup',
  CERAI_MATI: 'Cerai Mati / Salah Satu Meninggal',
}

const STATUS_ORTU_KANDUNG_LABEL: Record<string, string> = {
  HIDUP: 'Masih Hidup', MENINGGAL: 'Sudah Meninggal',
}

const STATUS_SEKOLAH_LABEL: Record<string, string> = {
  NEGERI: 'Negeri', SWASTA: 'Swasta', LUAR_NEGERI: 'Luar Negeri',
}

const JALUR_LABEL: Record<string, string> = {
  ZONASI: 'Zonasi', PRESTASI: 'Prestasi', AFIRMASI: 'Afirmasi',
  PERPINDAHAN: 'Perpindahan Tugas Orang Tua', REGULER: 'Reguler',
}

export function UserDetailPanel({ user, onClose, onEdit }: UserDetailPanelProps) {
  const { data, isLoading } = useUser(user?.id ?? '')
  const [preview, setPreview] = useState<{ key: string; label: string } | null>(null)

  const nama = data?.profile?.namaLengkap ?? user?.profile?.namaLengkap ?? '-'
  const foto = data?.profile?.fotoUrl ? getFileUrl(data.profile.fotoUrl) : null

  const role        = data?.role ?? user?.role ?? ''
  const isSiswa     = role === 'SISWA'
  const hasNip      = ['KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'GURU', 'WALI_KELAS', 'STAFF_TU', 'STAFF_KEUANGAN'].includes(role)
  const hasNuptk    = ['GURU', 'WALI_KELAS'].includes(role)

  const p = data?.profile

  // Dokumen yang ada
  const docs = p ? [
    { key: p.aktaKey,       label: 'Akta Kelahiran' },
    { key: p.kkKey,         label: 'Kartu Keluarga' },
    { key: p.ijazahLaluKey, label: 'Ijazah / STTB Terakhir' },
    { key: p.raporKey,      label: 'Rapor Terakhir' },
    { key: p.skhunKey,      label: 'SKHUN' },
    { key: p.sertifikatKey, label: 'Sertifikat Prestasi' },
    { key: p.ktpOrtuKey,    label: 'KTP Orang Tua / Wali' },
    { key: p.kipKey,        label: 'KIP / PKH' },
  ].filter((d) => !!d.key) : []

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
        ) : data && p ? (
          <div className="p-0 space-y-6 pb-10">

            {/* ── Avatar + info utama ── */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center flex-shrink-0">
                {foto
                  ? <img src={foto} alt={nama} className="w-full h-full object-cover" />
                  : <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{getInitials(nama)}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{nama}</h3>
                {p.namaPanggilan && (
                  <p className="text-sm text-gray-400">Panggilan: {p.namaPanggilan}</p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <RoleBadge role={data.role} />
                  <Badge variant={data.isActive ? 'success' : 'default'}>
                    {data.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                  {p.tahunMasuk && (
                    <Badge variant="info">Angkatan {p.tahunMasuk}</Badge>
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

            {/* ── Akun ── */}
            <Section title="Akun">
              <Grid>
                <Field label="Email"          value={data.email} />
                <Field label="Username"       value={data.username} />
                <Field label="Login Terakhir" value={data.lastLoginAt ? formatTanggalSaja(data.lastLoginAt) : '-'} />
                <Field label="Login Count"    value={data.loginCount?.toString()} />
              </Grid>
            </Section>

            {/* ── Identitas Pribadi ── */}
            <Section title="Identitas Pribadi">
              <Grid>
                <Field label="Nama Lengkap"  value={p.namaLengkap} />
                <Field label="Nama Panggilan" value={p.namaPanggilan} />
                <Field label="Jenis Kelamin"
                  value={p.jenisKelamin === 'L' ? 'Laki-laki' : p.jenisKelamin === 'P' ? 'Perempuan' : undefined} />
                <Field label="Agama"         value={p.agama} />
                <Field label="Tempat Lahir"  value={p.tempatLahir} />
                <Field label="Tanggal Lahir"
                  value={p.tanggalLahir ? formatTanggalSaja(p.tanggalLahir) : undefined} />
                <Field label="Gol. Darah"
                  value={p.bloodType ? BLOOD_DISPLAY[p.bloodType] : undefined} />
                <Field label="Tinggi" value={p.tinggi ? `${p.tinggi} cm` : undefined} />
                <Field label="Berat"  value={p.berat  ? `${p.berat} kg`  : undefined} />
              </Grid>
            </Section>

            {/* ── Nomor Identitas ── */}
            <Section title="Nomor Identitas">
              <Grid>
                <Field label="NIK"    value={p.nik} />
                <Field label="No. KK" value={p.noKK} />
                {isSiswa && <Field label="NISN" value={p.nisn} />}
                {isSiswa && <Field label="NIS"  value={p.nis} />}
                {hasNip   && <Field label="NIP"   value={p.nip} />}
                {hasNuptk && <Field label="NUPTK" value={p.nuptk} />}
                {isSiswa && <Field label="Tahun Masuk"       value={p.tahunMasuk?.toString()} />}
                {isSiswa && <Field label="Nomor Pendaftaran" value={p.nomorPendaftaran} />}
                {isSiswa && <Field label="Jalur Pendaftaran"
                  value={p.jalurPendaftaran ? JALUR_LABEL[p.jalurPendaftaran] : undefined} />}
              </Grid>
            </Section>

            {/* ── Sekolah Asal — hanya siswa ── */}
            {isSiswa && (
              <Section title="Sekolah Asal">
                <Grid>
                  <Field label="Nama Sekolah Asal" value={p.namaSekolahAsal} />
                  <Field label="NPSN"              value={p.npsnSekolahAsal} />
                  <Field label="Status Sekolah"
                    value={p.statusSekolahAsal ? STATUS_SEKOLAH_LABEL[p.statusSekolahAsal] : undefined} />
                  <Field label="Alamat Sekolah Asal" value={p.alamatSekolahAsal} />
                </Grid>
              </Section>
            )}

            {/* ── Data Keluarga — hanya siswa ── */}
            {isSiswa && (
              <Section title="Data Keluarga">
                <Grid>
                  <Field label="Anak Ke-"        value={p.anakKe?.toString()} />
                  <Field label="Jml Saudara"      value={p.jumlahSaudaraKandung?.toString()} />
                  <Field label="Status Anak"
                    value={p.statusAnak ? STATUS_ANAK_LABEL[p.statusAnak] : undefined} />
                  <Field label="Status Orang Tua"
                    value={p.statusOrtuKandung ? STATUS_ORTU_LABEL[p.statusOrtuKandung] : undefined} />
                  <Field label="Jenis Tinggal"
                    value={p.jenisTinggal ? TINGGAL_LABEL[p.jenisTinggal] : undefined} />
                  <Field label="Transportasi"
                    value={p.alatTransportasi ? TRANSPORTASI_LABEL[p.alatTransportasi] : undefined} />
                  <Field label="Jarak ke Sekolah"
                    value={p.jarakKeSekolah ? `${p.jarakKeSekolah} km` : undefined} />
                </Grid>
              </Section>
            )}

            {/* ── Kontak ── */}
            <Section title="Kontak">
              <Grid>
                <Field label="No. HP"     value={p.noTelepon} />
                <Field label="WhatsApp"   value={p.noWa} />
                <Field label="Telp Rumah" value={p.noTelpRumah} />
              </Grid>
            </Section>

            {/* ── Alamat ── */}
            <Section title="Alamat">
              <div className="space-y-2">
                {p.alamat && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">{p.alamat}</p>
                )}
                <Grid>
                  <Field label="Kelurahan" value={p.kelurahan} />
                  <Field label="Kecamatan" value={p.kecamatan} />
                  <Field label="Kabupaten" value={p.kabupaten} />
                  <Field label="Provinsi"  value={p.provinsi} />
                  <Field label="Kode Pos"  value={p.kodePos} />
                </Grid>
              </div>
            </Section>

            {/* ── Bantuan Sosial — hanya siswa ── */}
            {isSiswa && (
              <Section title="Bantuan Sosial (KIP/PKH)">
                <Grid>
                  <Field label="Penerima KIP" value={p.penerimaKIP ? 'Ya' : 'Tidak'} />
                  {p.penerimaKIP && <Field label="Nomor KIP" value={p.nomorKIP} />}
                </Grid>
              </Section>
            )}

            {/* ── Data Pribadi Siswa — hanya siswa ── */}
            {isSiswa && (
              <Section title="Data Pribadi Siswa">
                <Grid>
                  <Field label="Cita-cita"        value={p.citaCita} />
                  <Field label="Hobi"             value={p.hobi} />
                  <Field label="Riwayat Penyakit" value={p.riwayatPenyakit} />
                  <Field label="Kebutuhan Khusus" value={p.kebutuhanKhusus} />
                  <Field label="Ukuran Baju"      value={p.ukuranBaju} />
                </Grid>
              </Section>
            )}

            {/* ── Data Fisik ── */}
            <Section title="Data Fisik">
              <Grid>
                <Field label="Gol. Darah"
                  value={p.bloodType ? BLOOD_DISPLAY[p.bloodType] : undefined} />
                <Field label="Tinggi" value={p.tinggi ? `${p.tinggi} cm` : undefined} />
                <Field label="Berat"  value={p.berat  ? `${p.berat} kg`  : undefined} />
              </Grid>
            </Section>

            {/* ── Data Ayah — hanya siswa ── */}
            {isSiswa && (
              <Section title="Data Orang Tua — Ayah">
                <Grid>
                  <Field label="Nama"      value={p.namaAyah} />
                  <Field label="NIK"       value={p.nikAyah} />
                  <Field label="Status"
                    value={p.statusAyah ? STATUS_ORTU_KANDUNG_LABEL[p.statusAyah] : undefined} />
                  <Field label="No. Telp"  value={p.noTelpAyah} />
                  <Field label="Pekerjaan" value={p.pekerjaanAyah} />
                  <Field label="Pendidikan"
                    value={p.pendidikanAyah ? PENDIDIKAN_LABEL[p.pendidikanAyah] : undefined} />
                  <Field label="Penghasilan" value={p.penghasilanAyah} />
                </Grid>
              </Section>
            )}

            {/* ── Data Ibu — hanya siswa ── */}
            {isSiswa && (
              <Section title="Data Orang Tua — Ibu">
                <Grid>
                  <Field label="Nama"      value={p.namaIbu} />
                  <Field label="NIK"       value={p.nikIbu} />
                  <Field label="Status"
                    value={p.statusIbu ? STATUS_ORTU_KANDUNG_LABEL[p.statusIbu] : undefined} />
                  <Field label="No. Telp"  value={p.noTelpIbu} />
                  <Field label="Pekerjaan" value={p.pekerjaanIbu} />
                  <Field label="Pendidikan"
                    value={p.pendidikanIbu ? PENDIDIKAN_LABEL[p.pendidikanIbu] : undefined} />
                  <Field label="Penghasilan" value={p.penghasilanIbu} />
                </Grid>
              </Section>
            )}

            {/* ── Data Wali — hanya siswa, jika ada ── */}
            {isSiswa && p.namaWali && (
              <Section title="Data Wali">
                <Grid>
                  <Field label="Nama"        value={p.namaWali} />
                  <Field label="Hubungan"    value={p.hubunganWali} />
                  <Field label="NIK"         value={p.nikWali} />
                  <Field label="No. Telp"    value={p.noTelpWali} />
                  <Field label="Pekerjaan"   value={p.pekerjaanWali} />
                  <Field label="Pendidikan"
                    value={p.pendidikanWali ? PENDIDIKAN_LABEL[p.pendidikanWali] : undefined} />
                  <Field label="Penghasilan" value={p.penghasilanWali} />
                </Grid>
              </Section>
            )}

            {/* ── Dokumen — hanya siswa ── */}
            {isSiswa && docs.length > 0 && (
              <Section title="Dokumen">
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <DocItem
                      key={doc.key!}
                      label={doc.label}
                      docKey={doc.key!}
                      onPreview={() => setPreview({ key: doc.key!, label: doc.label })}
                    />
                  ))}
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
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-800 pt-3">
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
    <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/60 px-4 py-2.5">
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
