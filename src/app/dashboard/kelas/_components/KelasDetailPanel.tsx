'use client'

import { Users, Pencil, Trash2, BookOpen, MapPin, User, Hash, BarChart3, GraduationCap, CalendarDays } from 'lucide-react'
import { SlideOver, Button, Badge, Skeleton } from '@/components/ui'
import { useKelasStatistik } from '@/hooks/kelas/useKelas'
import { KelasStatAkademik } from './KelasStatAkademik'
import type { Kelas } from '@/types/kelas.types'

interface Props {
  kelas: Kelas | null
  onClose: () => void
  onEdit: (kelas: Kelas) => void
  onDelete: (kelas: Kelas) => void
  onNavigateSiswa:   (kelasId: string) => void
  onNavigateMapel?:  (kelasId: string) => void
  onNavigateJadwal?: (kelasId: string) => void
}

export function KelasDetailPanel({ kelas, onClose, onEdit, onDelete, onNavigateSiswa, onNavigateMapel, onNavigateJadwal }: Props) {
  const { data: statistik, isLoading: loadingStatistik } = useKelasStatistik(kelas?.id ?? null)

  return (
    <SlideOver open={!!kelas} onClose={onClose} title={kelas?.namaKelas ?? 'Detail Kelas'}>
      {kelas && (
        <div className="space-y-6 pb-6">

          <div className="flex flex-wrap gap-2">
            <Badge variant="default">{kelas.tahunAjaran.nama}</Badge>
            <Badge variant="info">{kelas.tingkatKelas.nama}</Badge>
            {kelas.kodeKelas && <Badge variant="default">{kelas.kodeKelas}</Badge>}
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/60 overflow-hidden">
            <InfoRow icon={<User className="h-4 w-4 text-gray-400" />} label="Wali Kelas" value={kelas.waliKelas?.profile.namaLengkap ?? 'Belum ditentukan'} />
            <InfoRow icon={<MapPin className="h-4 w-4 text-gray-400" />} label="Ruangan" value={kelas.ruangan?.nama ?? '\u2014'} />
            <InfoRow icon={<Hash className="h-4 w-4 text-gray-400" />} label="Kuota Maksimal" value={`${kelas.kuotaMaksimal} siswa`} />
            <InfoRow icon={<BookOpen className="h-4 w-4 text-gray-400" />} label="Tahun Ajaran" value={kelas.tahunAjaran.nama} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Statistik Siswa</h3>
            </div>

            {loadingStatistik ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : statistik ? (
              <>
                <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Terisi: <span className="font-semibold text-gray-900 dark:text-white">{statistik.jumlahSiswa}</span></span>
                    <span>Kuota: <span className="font-semibold text-gray-900 dark:text-white">{statistik.kuotaMaksimal}</span></span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min((statistik.jumlahSiswa / statistik.kuotaMaksimal) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-right">
                    Sisa: <span className={statistik.kuotaTersisa <= 0 ? 'text-red-500 font-semibold' : 'text-emerald-600 font-semibold'}>{statistik.kuotaTersisa}</span>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Laki-laki" value={statistik.siswaLaki} color="blue" />
                  <StatCard label="Perempuan" value={statistik.siswaPerempuan} color="pink" />
                </div>
              </>
            ) : <p className="text-sm text-gray-400 italic">Data statistik tidak tersedia</p>}
          </div>

          <KelasStatAkademik
            kelasId={kelas.id}
            tahunAjaranId={kelas.tahunAjaranId}
          />

          <Button className="w-full" leftIcon={<Users className="h-4 w-4" />} onClick={() => onNavigateSiswa(kelas.id)}>
            Lihat Daftar Siswa
          </Button>

          {(onNavigateMapel || onNavigateJadwal) && (
            <div className="grid grid-cols-2 gap-2">
              {onNavigateMapel && (
                <Button
                  variant="secondary"
                  leftIcon={<GraduationCap className="h-4 w-4" />}
                  onClick={() => onNavigateMapel(kelas.id)}
                >
                  Mata Pelajaran
                </Button>
              )}
              {onNavigateJadwal && (
                <Button
                  variant="secondary"
                  leftIcon={<CalendarDays className="h-4 w-4" />}
                  onClick={() => onNavigateJadwal(kelas.id)}
                >
                  Jadwal
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => onEdit(kelas)}>
              Edit Kelas
            </Button>
            <Button variant="ghost" onClick={() => onDelete(kelas)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

        </div>
      )}
    </SlideOver>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {icon}
      <span className="text-xs text-gray-500 dark:text-gray-400 w-28 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white font-medium">{value}</span>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'blue' | 'pink' }) {
  const cls = color === 'blue'
    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
    : 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300'
  return (
    <div className={`rounded-lg p-3 flex flex-col items-center gap-1 ${cls}`}>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs font-medium">{label}</span>
    </div>
  )
}
