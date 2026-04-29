'use client'

import { formatJam } from '@/lib/helpers/timezone'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen, ClipboardList, BarChart2, Users,
  CalendarDays, Edit, Trash2, ToggleLeft, Download,
  Clock, AlertCircle, CheckCircle2, TrendingUp, CalendarCheck,
} from 'lucide-react'
import { SlideOver, Button, Badge, Skeleton } from '@/components/ui'
import { reportApi } from '@/lib/api/report.api'
import type { MataPelajaran, StatusSesiGuru, MapelOverviewItem } from '@/types/akademik.types'

interface Props {
  mapel:          MataPelajaran | null
  onClose:        () => void
  onEdit:         (mapel: MataPelajaran) => void
  onDelete:       (mapel: MataPelajaran) => void
  onToggleActive: (mapel: MataPelajaran) => void
  onExport:       (mapel: MataPelajaran) => void
  canCrud:        boolean
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20 px-4 py-3">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

// ── TodoGuruSection — HARUS di atas MapelSlideover ────────────
function TodoGuruSection({
  koordinatorId,
  mataPelajaranId,
}: {
  koordinatorId:   string
  mataPelajaranId: string
}) {
  const { data: todo, isLoading } = useQuery({
    queryKey: ['guru-todo', koordinatorId, mataPelajaranId],
    queryFn:  () => reportApi.getGuruTodo({
      guruId:          koordinatorId,
      mataPelajaranId,
    }),
    enabled:   !!koordinatorId && !!mataPelajaranId,
    staleTime: 1000 * 60 * 2,
  })

  const totalPending   = todo?.menungguPenilaian.length ?? 0
  const adaJadwalHariIni = (todo?.jadwalHariIni.length ?? 0) > 0

  const statusColor: Record<string, string> = {
    AKSI_DIBUTUHKAN:    'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    BELUM_WAKTUNYA:     'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800',
    KELAS_SUDAH_DIBUKA: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    TERLEWAT:           'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  }
  const statusLabel: Record<string, string> = {
    AKSI_DIBUTUHKAN:    'Perlu Buka Absen',
    BELUM_WAKTUNYA:     'Belum Waktunya',
    KELAS_SUDAH_DIBUKA: 'Sudah Dibuka',
    TERLEWAT:           'Terlewat',
  }

  if (isLoading) return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32 rounded" />
      <Skeleton className="h-14 rounded-lg" />
    </div>
  )

  if (!adaJadwalHariIni && totalPending === 0) return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        To Do Guru (Koordinator)
      </p>
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
        <p className="text-xs text-emerald-700 dark:text-emerald-400">Tidak ada to do saat ini</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        To Do Guru (Koordinator)
      </p>

      {todo?.jadwalHariIni.map((j) => (
        <div key={j.jadwalId}
          className={`rounded-lg border px-3 py-2.5 space-y-1 ${statusColor[j.statusSesi] ?? 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium">{j.kelas}</span>
            </div>
            <span className="text-xs font-medium">{statusLabel[j.statusSesi] ?? j.statusSesi}</span>
          </div>
          <p className="text-xs opacity-70">
            {formatJam(j.jamMulai)} – {formatJam(j.jamSelesai)}
        {(j.ruangan as any)?.nama ? ` · ${(j.ruangan as any).nama}` : ''}          </p>
        </div>
      ))}

      {totalPending > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {totalPending} tugas menunggu penilaian
          </p>
        </div>
      )}
    </div>
  )
}


// ── PerformaSection — stat overview per mapel ────────────────
function PerformaSection({
  mapelId,
  kelasId,
  tahunAjaranId,
  semesterId,
}: {
  mapelId:       string
  kelasId:       string
  tahunAjaranId: string
  semesterId?:   string
}) {
  const { data: overviewList = [], isLoading } = useQuery({
    queryKey: ['mapel-overview', kelasId, tahunAjaranId, semesterId],
    queryFn:  () => reportApi.getMapelOverview({ tahunAjaranId, kelasId, semesterId }),
    enabled:  !!mapelId && !!kelasId && !!tahunAjaranId,
    staleTime: 1000 * 60 * 5,
  })

  const item = overviewList.find(o => o.mataPelajaranId === mapelId)

  if (isLoading) return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Performa Kelas</p>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  )

  if (!item) return null

  const { rataRataKehadiranSiswa, rataRataNilaiRaport, persentaseTugasSelesai } = item.performaGlobal

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Performa Kelas</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: 'Kehadiran',
            value: `${rataRataKehadiranSiswa}%`,
            color: rataRataKehadiranSiswa >= 80
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
          },
          {
            label: 'Rata Nilai',
            value: rataRataNilaiRaport > 0 ? rataRataNilaiRaport.toFixed(1) : '-',
            color: rataRataNilaiRaport >= 75
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
          },
          {
            label: 'Tugas Selesai',
            value: `${persentaseTugasSelesai}%`,
            color: persentaseTugasSelesai >= 70
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
          },
        ].map((s) => (
          <div key={s.label}
            className={`rounded-lg border px-3 py-2.5 text-center ${s.color}`}>
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-[10px] font-medium mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── MapelSlideover ────────────────────────────────────────────
export function MapelSlideover({
  mapel, onClose, onEdit, onDelete, onToggleActive, onExport, canCrud,
}: Props) {
  const router = useRouter()

  if (!mapel) return null

  const namaMapel   = mapel.mataPelajaranTingkat.masterMapel.nama
  const kodeMapel   = mapel.mataPelajaranTingkat.masterMapel.kode
  const kategori    = mapel.mataPelajaranTingkat.masterMapel.kategori
  const koordinator = mapel.pengajar.find((p) => p.isKoordinator)
  const coTeacher   = mapel.pengajar.filter((p) => !p.isKoordinator)

  const jadwalText = mapel.jadwalPelajaran.length > 0
    ? mapel.jadwalPelajaran
        .map((j) => {
          const hari = j.hari.slice(0, 3)
          const jam  = j.masterJam?.jamMulai ? formatJam(j.masterJam.jamMulai) : ''
          return jam ? `${hari} ${jam}` : hari
        })
        .join(', ')
    : 'Belum ada jadwal'

  return (
    <SlideOver open={!!mapel} onClose={onClose} title={namaMapel} width="lg">
      {mapel && (
        <div className="space-y-6">

          {/* Badge info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={mapel.isActive ? 'success' : 'danger'}>
              {mapel.isActive ? 'Aktif' : 'Nonaktif'}
            </Badge>
            <Badge variant="info">{kategori}</Badge>
            <Badge variant="default">{kodeMapel}</Badge>
          </div>

          {/* Info dasar */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Kelas</span>
              <span className="font-medium text-gray-800 dark:text-gray-100">{mapel.kelas.namaKelas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Semester</span>
              <span className="font-medium text-gray-800 dark:text-gray-100">{mapel.semester.nama}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">KKM / Bobot</span>
              <span className="font-medium text-gray-800 dark:text-gray-100">{mapel.kkm} / {mapel.bobot} SKS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Jadwal</span>
              <span className="font-medium text-right max-w-[60%] text-gray-800 dark:text-gray-100">{jadwalText}</span>
            </div>
          </div>

          {/* Pengajar */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Pengajar</p>
            {mapel.pengajar.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Belum ada pengajar</p>
            ) : (
              <div className="space-y-2">
                {koordinator && (
                  <div className="flex items-center gap-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-200 dark:bg-emerald-900/40 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {koordinator.guru.profile.namaLengkap.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                        {koordinator.guru.profile.namaLengkap}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">Koordinator</p>
                    </div>
                  </div>
                )}
                {coTeacher.map((p) => (
                  <div key={p.guru.id} className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
                      {p.guru.profile.namaLengkap.charAt(0)}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{p.guru.profile.namaLengkap}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stat mini cards */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Statistik</p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Materi"    value={mapel._count.materiPelajaran} sub="konten diunggah" />
              <StatCard label="Tugas"     value={mapel._count.tugas}           sub="tugas dibuat" />
              <StatCard label="Absensi"   value={mapel._count.absensi}         sub="sesi absen" />
              <StatCard label="Penilaian" value={mapel._count.penilaian}       sub="entri nilai" />
            </div>
          </div>

          {/* Performa Kelas */}
          <PerformaSection
            mapelId={mapel.id}
            kelasId={mapel.kelasId}
            tahunAjaranId={mapel.kelas.tahunAjaranId}
            semesterId={mapel.semesterId}
          />

          {/* Todo Guru */}
          <TodoGuruSection
            koordinatorId={koordinator?.guru.id ?? ''}
            mataPelajaranId={mapel.id}
          />

          {/* Navigasi */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Navigasi</p>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" leftIcon={<CalendarDays className="w-3.5 h-3.5" />}
                onClick={() => router.push(`/dashboard/absensi?mataPelajaranId=${mapel.id}`)}>
                Absensi
              </Button>
              <Button size="sm" variant="secondary" leftIcon={<CalendarCheck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />}
                onClick={() => router.push(`/dashboard/jadwal?kelasId=${mapel.kelasId}&semesterId=${mapel.semesterId}`)}>
                Jadwal
              </Button>
              <Button size="sm" variant="secondary" leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                onClick={() => router.push(`/dashboard/materi?mataPelajaranId=${mapel.id}`)}>
                Materi
              </Button>
              <Button size="sm" variant="secondary" leftIcon={<ClipboardList className="w-3.5 h-3.5" />}
                onClick={() => router.push(`/dashboard/tugas?mataPelajaranId=${mapel.id}`)}>
                Tugas
              </Button>
              <Button size="sm" variant="secondary" leftIcon={<BarChart2 className="w-3.5 h-3.5" />}
                onClick={() => router.push(`/dashboard/penilaian?mataPelajaranId=${mapel.id}`)}>
                Penilaian
              </Button>
              <Button size="sm" variant="secondary" leftIcon={<Users className="w-3.5 h-3.5" />}
                onClick={() => router.push(`/dashboard/kelas/${mapel.kelasId}`)}>
                Siswa Kelas
              </Button>
              <Button size="sm" variant="secondary" leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() => onExport(mapel)}>
                Export Nilai
              </Button>
            </div>
          </div>

          {/* Aksi CRUD */}
          {canCrud && (
            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800">
              <Button size="sm" variant="secondary" className="w-full justify-start"
                leftIcon={<Edit className="w-3.5 h-3.5" />}
                onClick={() => onEdit(mapel)}>
                Edit Mata Pelajaran
              </Button>
              <Button size="sm" variant="secondary" className="w-full justify-start"
                leftIcon={<ToggleLeft className="w-3.5 h-3.5" />}
                onClick={() => onToggleActive(mapel)}>
                {mapel.isActive ? 'Nonaktifkan' : 'Aktifkan'} Mata Pelajaran
              </Button>
              <Button size="sm" variant="ghost" className="w-full justify-start text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => onDelete(mapel)}>
                Hapus Mata Pelajaran
              </Button>
            </div>
          )}

        </div>
      )}
    </SlideOver>
  )
}
