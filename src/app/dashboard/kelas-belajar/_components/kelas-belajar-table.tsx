'use client'

import { useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { Button, Badge, Skeleton } from '@/components/ui'
import type { Kelas } from '@/types/kelas.types'

interface Props {
  data:      Kelas[]
  isLoading: boolean
}

export function KelasBelajarTable({ data, isLoading }: Props) {
  const router = useRouter()

  function handleMapel(kelasId: string) {
    router.push(`/dashboard/pembelajaran?kelasId=${kelasId}`)
  }

  // ── Loading skeleton ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Tahun Ajaran', 'Tingkat', 'Nama Kelas', 'Wali Kelas', 'Ruangan', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 6 }).map((__, j) => (
                  <td key={j} className="px-4 py-3">
                    <Skeleton className="h-4 w-24 rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // ── Empty state ───────────────────────────────────────────────
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <BookOpen className="w-10 h-10 opacity-40" />
          <p className="text-sm font-medium">Tidak ada kelas ditemukan</p>
          <p className="text-xs">Coba ubah filter pencarian</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block rounded-2xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Tahun Ajaran', 'Tingkat', 'Nama Kelas', 'Wali Kelas', 'Ruangan', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.map((kelas) => (
              <tr key={kelas.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">
                  {kelas.tahunAjaran?.nama ?? '-'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="default">{kelas.tingkatKelas?.nama ?? '-'}</Badge>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800">
                  {kelas.namaKelas}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {kelas.waliKelas?.profile?.namaLengkap ?? (
                    <span className="text-gray-400 italic text-xs">Belum ditentukan</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {typeof kelas.ruangan === 'string' ? kelas.ruangan : (kelas.ruangan?.nama ?? '-')}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                    onClick={() => handleMapel(kelas.id)}
                  >
                    Mata Pelajaran
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col gap-3">
        {data.map((kelas) => (
          <div key={kelas.id} className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-800">{kelas.namaKelas}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {kelas.tahunAjaran?.nama}
                </p>
              </div>
              <Badge variant="default">{kelas.tingkatKelas?.nama}</Badge>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <span className="font-medium text-gray-600">Wali Kelas: </span>
                {kelas.waliKelas?.profile?.namaLengkap ?? 'Belum ditentukan'}
              </p>
              <p>
                <span className="font-medium text-gray-600">Ruangan: </span>
                {typeof kelas.ruangan === 'string' ? kelas.ruangan : (kelas.ruangan?.nama ?? '-')}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<BookOpen className="w-3.5 h-3.5" />}
              onClick={() => handleMapel(kelas.id)}
              className="w-full justify-center"
            >
              Lihat Mata Pelajaran
            </Button>
          </div>
        ))}
      </div>
    </>
  )
}
