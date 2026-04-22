'use client'

import { User, Heart, Calendar, BarChart3, BookOpen, Award, CheckCircle2, ArrowRightLeft } from 'lucide-react'
import { SlideOver, Button, Badge, Skeleton } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import {
  useAbsensiRekapSiswa,
  useCatatanSikapRekap,
  usePrestasiSiswa,
  useNilaiRaporSiswa,
} from '@/hooks/kelas/useKelasSiswa'
import { formatTanggalSaja } from '@/lib/helpers/timezone'
import { StatusSiswa, StatusAkhirTahun } from '@/types/kelas.types'
import { getPublicFileUrl } from '@/lib/constants'
import type { KelasSiswa, CatatanSikapRekap } from '@/types/kelas.types'

const safeTanggal = (val: string | null | undefined) =>
  val ? formatTanggalSaja(val) : '—'

interface Props {
  kelasSiswa: KelasSiswa | null
  onClose:    () => void
  onMutasi:   (ks: KelasSiswa) => void
  readOnly?:  boolean
}

const statusAkhirTahunConfig: Partial<Record<StatusAkhirTahun, {
  label: string
  variant: 'success' | 'warning' | 'danger' | 'default' | 'info' | 'purple'
}>> = {
  [StatusAkhirTahun.NAIK_KELAS]:        { label: 'Naik Kelas',  variant: 'success' },
  [StatusAkhirTahun.TIDAK_NAIK]:        { label: 'Tidak Naik',  variant: 'warning' },
  [StatusAkhirTahun.LULUS]:             { label: 'Lulus',        variant: 'info'    },
  [StatusAkhirTahun.DO]:                { label: 'DO',           variant: 'danger'  },
  [StatusAkhirTahun.MENGUNDURKAN_DIRI]: { label: 'Undur Diri',   variant: 'default' },
}

const statusConfig: Record<StatusSiswa, {
  label: string
  variant: 'success' | 'warning' | 'danger' | 'default'
}> = {
  [StatusSiswa.AKTIF]:             { label: 'Aktif',      variant: 'success' },
  [StatusSiswa.PINDAH]:            { label: 'Pindah',     variant: 'warning' },
  [StatusSiswa.KELUAR]:            { label: 'Keluar',     variant: 'danger'  },
  [StatusSiswa.LULUS]:             { label: 'Lulus',      variant: 'default' },
  [StatusSiswa.DO]:                { label: 'DO',         variant: 'danger'  },
  [StatusSiswa.MENGUNDURKAN_DIRI]: { label: 'Undur Diri', variant: 'default' },
}

// Helper: hitung ringkasan sikap dari array CatatanSikapRekap
function hitungSikap(list: CatatanSikapRekap[]) {
  const positif = list.filter((c) => c.kategori === 'POSITIF').length
  const negatif = list.filter((c) => c.kategori === 'NEGATIF').length
  const totalPoin = list.reduce((sum, c) => sum + (c.poin ?? 0), 0)
  return { positif, negatif, totalPoin }
}

export function SiswaDetailPanel({ kelasSiswa, onClose, onMutasi, readOnly }: Props) {
  const siswaId = kelasSiswa?.siswaId ?? null

  const { data: userDetail, isLoading: loadingUser } = useQuery({
    queryKey: ['users', siswaId],
    queryFn:  () => api.get(`/users/${siswaId}`).then((r) => r.data),
    enabled:  !!siswaId,
    staleTime: 1000 * 60 * 5,
  })

  const { data: absensi,      isLoading: loadAbsensi  } = useAbsensiRekapSiswa(siswaId)
  const { data: sikapList,    isLoading: loadSikap    } = useCatatanSikapRekap(siswaId)
  const { data: prestasiResp, isLoading: loadPrestasi } = usePrestasiSiswa(siswaId)
  const { data: nilaiResp,    isLoading: loadNilai    } = useNilaiRaporSiswa(siswaId)

  const prestasi  = prestasiResp?.data ?? []
  const nilaiList = nilaiResp?.data ?? []

  // CatatanSikapRekap dari API adalah single object, bukan array
  // Wrap ke array agar hitungSikap bisa proses
  const sikapArr = sikapList
    ? Array.isArray(sikapList) ? sikapList : [sikapList]
    : []
  const sikapStat = hitungSikap(sikapArr)

  const profil      = userDetail?.profile ?? kelasSiswa?.siswa.profile
  const namaLengkap = profil?.namaLengkap ?? kelasSiswa?.siswa.profile.namaLengkap ?? ''

  return (
    <SlideOver open={!!kelasSiswa} onClose={onClose} title={namaLengkap} width="lg">
      {kelasSiswa && (
        <div className="space-y-6 pb-6">

          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center">
              {profil?.fotoUrl
                ? <img src={getPublicFileUrl(profil.fotoUrl)} alt={namaLengkap} className="h-full w-full object-cover" />
                : <User className="h-8 w-8 text-gray-400" />
              }
            </div>
            <div className="flex-1 min-w-0">
              {loadingUser
                ? <div className="space-y-1"><Skeleton className="h-5 w-40" /><Skeleton className="h-3 w-28" /></div>
                : (
                  <>
                    <p className="font-bold text-gray-900 dark:text-white truncate">{namaLengkap}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                      {profil?.nisn ? `NISN: ${profil.nisn}` : 'Tanpa NISN'} · {profil?.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </p>
                  </>
                )
              }
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant={statusConfig[kelasSiswa.status].variant}>
                  {statusConfig[kelasSiswa.status].label}
                </Badge>
                {kelasSiswa.statusAkhirTahun && (
                  <Badge variant={statusAkhirTahunConfig[kelasSiswa.statusAkhirTahun]?.variant ?? 'default'}>
                    {statusAkhirTahunConfig[kelasSiswa.statusAkhirTahun]?.label ?? kelasSiswa.statusAkhirTahun}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Informasi Pribadi */}
          <Section title="Informasi Pribadi" icon={<User className="h-4 w-4" />}>
            {loadingUser ? <StatsSkeleton count={3} /> : (
              <div className="space-y-1">
                <Field label="TTL" value={profil?.tempatLahir ? `${profil.tempatLahir}, ${safeTanggal(profil.tanggalLahir)}` : '—'} />
                <Field label="Agama"           value={profil?.agama   ?? '—'} />
                <Field label="Alamat"          value={profil?.alamat  ?? '—'} />
                {profil?.noWa && <Field label="WhatsApp" value={profil.noWa} />}
                <Field label="No. Absen"       value={kelasSiswa.nomorAbsen ? String(kelasSiswa.nomorAbsen) : '—'} />
                <Field label="Tanggal Masuk"   value={safeTanggal(kelasSiswa.tanggalMasuk)} />
                {kelasSiswa.statusAkhirTahun && (
                  <Field label="Status Akhir Tahun" value={statusAkhirTahunConfig[kelasSiswa.statusAkhirTahun]?.label ?? kelasSiswa.statusAkhirTahun} />
                )}
                {kelasSiswa.catatanAkhirTahun && (
                  <Field label="Catatan Akhir Tahun" value={kelasSiswa.catatanAkhirTahun} />
                )}
              </div>
            )}
          </Section>

          {/* Data Orang Tua */}
          <Section title="Data Orang Tua" icon={<Heart className="h-4 w-4" />}>
            {loadingUser ? <StatsSkeleton count={2} /> : (
              <div className="space-y-1">
                <Field label="Nama Ayah"      value={profil?.namaAyah      ?? '—'} />
                <Field label="Pekerjaan Ayah" value={profil?.pekerjaanAyah ?? '—'} />
                <Field label="Nama Ibu"       value={profil?.namaIbu       ?? '—'} />
                <Field label="Pekerjaan Ibu"  value={profil?.pekerjaanIbu  ?? '—'} />
                {profil?.namaWali && (
                  <Field label="Nama Wali" value={`${profil.namaWali} (${profil.hubunganWali ?? 'Wali'})`} />
                )}
              </div>
            )}
          </Section>

          {/* Rekap Absensi — FIX: field alfa (bukan alpa) */}
          <Section title="Rekap Absensi" icon={<Calendar className="h-4 w-4" />}>
            {loadAbsensi ? <StatsSkeleton count={4} />
              : absensi ? (
                <div className="grid grid-cols-4 gap-2">
                  <StatCard label="Hadir" value={absensi.hadir} color="emerald" />
                  <StatCard label="Sakit" value={absensi.sakit} color="blue"    />
                  <StatCard label="Izin"  value={absensi.izin}  color="yellow"  />
                  <StatCard label="Alfa"  value={absensi.alfa}  color="red"     />
                </div>
              ) : <Placeholder text="Data absensi belum tersedia" />
            }
          </Section>

          {/* Poin Sikap — FIX: CatatanSikapRekap adalah list catatan, hitung manual */}
          <Section title="Poin Sikap" icon={<BarChart3 className="h-4 w-4" />}>
            {loadSikap ? <StatsSkeleton count={3} />
              : sikapArr.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  <StatCard label="Positif"    value={sikapStat.positif}   color="emerald" />
                  <StatCard label="Negatif"    value={sikapStat.negatif}   color="red"     />
                  <StatCard label="Total Poin" value={sikapStat.totalPoin} color="blue"    />
                </div>
              ) : <Placeholder text="Data sikap belum tersedia" />
            }
          </Section>

          {/* Nilai Rapor — FIX: mapelNama, nilaiPengetahuan, predikatPengetahuan */}
          <Section title="Nilai Rapor" icon={<BookOpen className="h-4 w-4" />}>
            {loadNilai ? <StatsSkeleton count={3} />
              : nilaiList.length > 0 ? (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/60 overflow-hidden">
                  {nilaiList.map((n, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {n.mapelNama}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {n.nilaiPengetahuan}
                        </span>
                        <Badge variant="default">{n.predikatPengetahuan}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <Placeholder text="Belum ada data nilai rapor" />
            }
          </Section>

          {/* Prestasi — FIX: namaPrestasi (bukan nama) */}
          <Section title="Prestasi" icon={<Award className="h-4 w-4" />}>
            {loadPrestasi ? <StatsSkeleton count={2} />
              : prestasi.length > 0 ? (
                <div className="space-y-2">
                  {prestasi.map((p) => (
                    <div key={p.id} className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {p.namaPrestasi}
                        </p>
                        <Badge variant="default">{p.peringkat}</Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {p.tingkat} · {safeTanggal(p.tanggal)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : <Placeholder text="Belum ada prestasi tercatat" />
            }
          </Section>

          <Section title="Ekstrakurikuler" icon={<CheckCircle2 className="h-4 w-4" />}>
            <Placeholder text="Data ekstrakurikuler belum tersedia (endpoint dalam pengembangan)" />
          </Section>

          {kelasSiswa.status === StatusSiswa.AKTIF && !readOnly && (
            <Button
              className="w-full" variant="secondary"
              leftIcon={<ArrowRightLeft className="h-4 w-4" />}
              onClick={() => onMutasi(kelasSiswa)}
            >
              Mutasi / Ubah Status
            </Button>
          )}

        </div>
      )}
    </SlideOver>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-700/60 pt-4">
        <span className="text-gray-400">{icon}</span>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value || value === '—') return null
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-800 dark:text-gray-200">{value}</p>
    </div>
  )
}

type StatColor = 'emerald' | 'blue' | 'yellow' | 'red'
const statColorMap: Record<StatColor, string> = {
  emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
  blue:    'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  yellow:  'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
  red:     'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
}

function StatCard({ label, value, color }: { label: string; value: number; color: StatColor }) {
  return (
    <div className={'rounded-lg p-2.5 flex flex-col items-center gap-0.5 ' + statColorMap[color]}>
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs">{label}</span>
    </div>
  )
}

function StatsSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-lg" />
      ))}
    </div>
  )
}

function Placeholder({ text }: { text: string }) {
  return <p className="text-sm text-gray-400 dark:text-gray-500 italic py-1">{text}</p>
}
