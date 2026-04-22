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
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-800 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
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
    AKSI_DIBUTUHKAN:    'text-red-600 bg-red-50 border-red-200',
    BELUM_WAKTUNYA:     'text-gray-500 bg-gray-50 border-gray-200',
    KELAS_SUDAH_DIBUKA: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    TERLEWAT:           'text-orange-600 bg-orange-50 border-orange-200',
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
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        To Do Guru (Koordinator)
      </p>
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        <p className="text-xs text-emerald-700">Tidak ada to do saat ini</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        To Do Guru (Koordinator)
      </p>

      {todo?.jadwalHariIni.map((j) => (
        <div key={j.jadwalId}
          className={`rounded-lg border px-3 py-2.5 space-y-1 ${statusColor[j.statusSesi] ?? 'bg-gray-50 border-gray-200'}`}>
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
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">
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
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Performa Kelas</p>
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
        <TrendingUp className="w-4 h-4 text-gray-400" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Performa Kelas</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: 'Kehadiran',
            value: `${rataRataKehadiranSiswa}%`,
            color: rataRataKehadiranSiswa >= 80
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-amber-50 border-amber-200 text-amber-700',
          },
          {
            label: 'Rata Nilai',
            value: rataRataNilaiRaport > 0 ? rataRataNilaiRaport.toFixed(1) : '-',
            color: rataRataNilaiRaport >= 75
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-amber-50 border-amber-200 text-amber-700',
          },
          {
            label: 'Tugas Selesai',
            value: `${persentaseTugasSelesai}%`,
            color: persentaseTugasSelesai >= 70
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-amber-50 border-amber-200 text-amber-700',
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
              <span className="text-gray-500">Kelas</span>
              <span className="font-medium">{mapel.kelas.namaKelas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Semester</span>
              <span className="font-medium">{mapel.semester.nama}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">KKM / Bobot</span>
              <span className="font-medium">{mapel.kkm} / {mapel.bobot} SKS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Jadwal</span>
              <span className="font-medium text-right max-w-[60%]">{jadwalText}</span>
            </div>
          </div>

          {/* Pengajar */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pengajar</p>
            {mapel.pengajar.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada pengajar</p>
            ) : (
              <div className="space-y-2">
                {koordinator && (
                  <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-700">
                      {koordinator.guru.profile.namaLengkap.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {koordinator.guru.profile.namaLengkap}
                      </p>
                      <p className="text-xs text-emerald-600">Koordinator</p>
                    </div>
                  </div>
                )}
                {coTeacher.map((p) => (
                  <div key={p.guru.id} className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                      {p.guru.profile.namaLengkap.charAt(0)}
                    </div>
                    <p className="text-sm text-gray-700 truncate">{p.guru.profile.namaLengkap}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stat mini cards */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Statistik</p>
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
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Navigasi</p>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" leftIcon={<CalendarDays className="w-3.5 h-3.5" />}
                onClick={() => router.push(`/dashboard/absensi?mataPelajaranId=${mapel.id}`)}>
                Absensi
              </Button>
              <Button size="sm" variant="secondary" leftIcon={<CalendarCheck className="w-3.5 h-3.5 text-blue-500" />}
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
            <div className="space-y-2 pt-2 border-t border-gray-100">
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
              <Button size="sm" variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600"
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
