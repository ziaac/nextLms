'use client'

import { User, Heart, Calendar, BarChart3, BookOpen, Award, CheckCircle2, ArrowRightLeft, Download } from 'lucide-react'
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
import type { KelasSiswa, CatatanSikapRekap, NilaiRapor } from '@/types/kelas.types'

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

          {/* Nilai Rapor */}
          <Section title="Nilai Rapor" icon={<BookOpen className="h-4 w-4" />}>
            {loadNilai ? <StatsSkeleton count={3} /> : nilaiList.length > 0 ? (
              <div className="space-y-2">
                {/* Export all */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => exportAllNilai(nilaiList, namaLengkap)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                  >
                    <Download className="h-3 w-3" /> Export Semua
                  </button>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-900">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700/60">
                        <th className="text-left px-3 py-2.5 font-semibold text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Mata Pelajaran
                        </th>
                        <th className="text-center px-2 py-2.5 font-semibold text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide w-10">
                          KKM
                        </th>
                        <th className="text-center px-2 py-2.5 font-semibold text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Pengetahuan
                        </th>
                        <th className="text-center px-2 py-2.5 font-semibold text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Keterampilan
                        </th>
                        <th className="w-7 px-1" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                      {nilaiList.map((n, i) => (
                        <tr key={i} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors group">
                          <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200 max-w-[110px] truncate">
                            {n.mapelNama}
                          </td>
                          <td className="px-2 py-2.5 text-center text-gray-400 dark:text-gray-500 tabular-nums">
                            {n.kkm ?? '—'}
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <NilaiCell nilai={n.nilaiPengetahuan} predikat={n.predikatPengetahuan} kkm={n.kkm} />
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <NilaiCell nilai={n.nilaiKeterampilan} predikat={n.predikatKeterampilan} kkm={n.kkm} />
                          </td>
                          <td className="px-1 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => exportSingleNilai(n, namaLengkap)}
                              title="Export baris ini"
                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all"
                            >
                              <Download className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : <Placeholder text="Belum ada data nilai rapor" />}
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

// ── Nilai Rapor helpers ───────────────────────────────────────────────────────

function NilaiCell({ nilai, predikat, kkm }: { nilai: number; predikat: string; kkm: number }) {
  const lulus  = nilai >= kkm
  const color  = lulus
    ? 'text-emerald-700 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400'
  return (
    <div className="inline-flex items-center gap-1 justify-center">
      <span className={`font-bold tabular-nums ${color}`}>{nilai}</span>
      {predikat && (
        <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          {predikat}
        </span>
      )}
    </div>
  )
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function exportAllNilai(nilaiList: NilaiRapor[], namaLengkap: string) {
  const rows = [
    ['Mata Pelajaran', 'KKM', 'Nilai Pengetahuan', 'Predikat', 'Nilai Keterampilan', 'Predikat Keterampilan'],
    ...nilaiList.map((n) => [
      n.mapelNama,
      String(n.kkm ?? ''),
      String(n.nilaiPengetahuan),
      n.predikatPengetahuan,
      String(n.nilaiKeterampilan),
      n.predikatKeterampilan,
    ]),
  ]
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
  downloadCSV(csv, `nilai-${namaLengkap.replace(/\s+/g, '_')}.csv`)
}

function exportSingleNilai(n: NilaiRapor, namaLengkap: string) {
  const rows = [
    ['Siswa', 'Mata Pelajaran', 'KKM', 'Nilai Pengetahuan', 'Predikat', 'Nilai Keterampilan', 'Predikat Keterampilan'],
    [
      namaLengkap,
      n.mapelNama,
      String(n.kkm ?? ''),
      String(n.nilaiPengetahuan),
      n.predikatPengetahuan,
      String(n.nilaiKeterampilan),
      n.predikatKeterampilan,
    ],
  ]
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
  downloadCSV(csv, `nilai-${namaLengkap.replace(/\s+/g, '_')}-${n.mapelNama.replace(/\s+/g, '_')}.csv`)
}
