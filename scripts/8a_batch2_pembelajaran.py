import os
import sys

def write_file(base: str, rel: str, content: str, check: str):
    path = os.path.join(base, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    with open(path, "r", encoding="utf-8") as f:
        v = f.read()
    print(f"  {'OK' if check in v else 'GAGAL'}: {rel}")

def main():
    base = sys.argv[1] if len(sys.argv) > 1 else "../"
    base = os.path.abspath(base)
    print(f"Base dir: {base}\n")

    # ─────────────────────────────────────────────────────────────
    # 1. src/lib/helpers/role.ts (sudah ada dari Batch 1 Revisi)
    #    — skip, sudah di-generate
    # ─────────────────────────────────────────────────────────────

    # ─────────────────────────────────────────────────────────────
    # 2. src/app/dashboard/kelas-belajar/_components/kelas-belajar-filters.tsx
    # ─────────────────────────────────────────────────────────────
    print("=== STEP 1: KelajarBelajarFilters ===")

    kelas_belajar_filters = '''\
'use client'

import { useMemo } from 'react'
import { Select, SearchInput } from '@/components/ui'
import type { TahunAjaran } from '@/types/tahun-ajaran.types'
import type { TingkatKelas } from '@/types/akademik.types'

interface Props {
  // data dropdown
  tahunAjaranList:  TahunAjaran[]
  tingkatKelasList: TingkatKelas[]

  // nilai filter saat ini
  tahunAjaranId:  string
  semesterId:     string
  tingkatKelasId: string
  search:         string

  // setter
  onTahunAjaranChange:  (id: string) => void
  onSemesterChange:     (id: string) => void
  onTingkatChange:      (id: string) => void
  onSearchChange:       (v: string) => void

  // semester list diturunkan dari tahunAjaran yang dipilih
  semesterList: Array<{ id: string; nama: string; urutan: number }>

  // apakah ada lebih dari 1 tahun ajaran aktif
  showTahunAjaranFilter: boolean
}

export function KelasBelajarFilters({
  tahunAjaranList,
  tingkatKelasList,
  semesterList,
  tahunAjaranId,
  semesterId,
  tingkatKelasId,
  search,
  onTahunAjaranChange,
  onSemesterChange,
  onTingkatChange,
  onSearchChange,
  showTahunAjaranFilter,
}: Props) {
  const tahunAjaranOptions = useMemo(
    () => tahunAjaranList.map((ta) => ({ label: ta.nama, value: ta.id })),
    [tahunAjaranList],
  )

  const semesterOptions = useMemo(
    () => [
      { label: 'Semua Semester', value: '' },
      ...semesterList.map((s) => ({
        label: `Semester ${s.nama}`,
        value: s.id,
      })),
    ],
    [semesterList],
  )

  const tingkatOptions = useMemo(
    () => [
      { label: 'Semua Tingkat', value: '' },
      ...tingkatKelasList.map((t) => ({
        label: `Kelas ${t.nama}`,
        value: t.id,
      })),
    ],
    [tingkatKelasList],
  )

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="w-full sm:w-64">
        <SearchInput
          placeholder="Cari nama kelas..."
          value={search}
          onChange={onSearchChange}
        />
      </div>

      {/* Filter Tahun Ajaran — hanya tampil jika > 1 TA aktif */}
      {showTahunAjaranFilter && (
        <div className="w-full sm:w-48">
          <Select
            options={tahunAjaranOptions}
            value={tahunAjaranId}
            onChange={(e) => onTahunAjaranChange(e.target.value)}
          />
        </div>
      )}

      {/* Filter Semester */}
      <div className="w-full sm:w-48">
        <Select
          options={semesterOptions}
          value={semesterId}
          onChange={(e) => onSemesterChange(e.target.value)}
        />
      </div>

      {/* Filter Tingkat */}
      <div className="w-full sm:w-40">
        <Select
          options={tingkatOptions}
          value={tingkatKelasId}
          onChange={(e) => onTingkatChange(e.target.value)}
        />
      </div>
    </div>
  )
}
'''
    write_file(
        base,
        "src/app/dashboard/kelas-belajar/_components/kelas-belajar-filters.tsx",
        kelas_belajar_filters,
        "KelasBelajarFilters",
    )

    # ─────────────────────────────────────────────────────────────
    # 3. src/app/dashboard/kelas-belajar/_components/kelas-belajar-table.tsx
    # ─────────────────────────────────────────────────────────────
    print("=== STEP 2: KelasBelajarTable ===")

    kelas_belajar_table = '''\
'use client'

import { useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { Button, Badge, Skeleton } from '@/components/ui'
import type { Kelas } from '@/types/kelas.types'

interface Props {
  data:      Kelas[]
  isLoading: boolean
}

// Label semester singkat
function labelSemester(nama: string): string {
  if (nama === 'GANJIL') return 'Ganjil'
  if (nama === 'GENAP')  return 'Genap'
  return nama
}

export function KelasBelajarTable({ data, isLoading }: Props) {
  const router = useRouter()

  function handleMapel(kelasId: string) {
    router.push(`/dashboard/pembelajaran?kelasId=${kelasId}`)
  }

  // ── Loading skeleton ────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Tahun Ajaran', 'Semester', 'Tingkat', 'Nama Kelas', 'Wali Kelas', 'Ruangan', ''].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 7 }).map((__, j) => (
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

  // ── Empty state ─────────────────────────────────────────────
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

  // ── Desktop table ───────────────────────────────────────────
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[
                'Tahun Ajaran',
                'Semester',
                'Tingkat',
                'Nama Kelas',
                'Wali Kelas',
                'Ruangan',
                '',
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.map((kelas) => (
              <tr
                key={kelas.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-800">
                  {kelas.tahunAjaran?.nama ?? '-'}
                </td>
                <td className="px-4 py-3">
                  {/* semester ditampilkan dari relasi kelas → tahunAjaran → semester aktif */}
                  {/* CATATAN: jika backend tidak include semester di kelas,
                      tampilkan dari filter semester yang dipilih */}
                  <Badge variant="info">
                    {labelSemester(kelas.semester?.nama ?? '-')}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {kelas.tingkatKelas?.nama ?? '-'}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800">
                  {kelas.namaKelas}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {kelas.waliKelas?.profile?.namaLengkap ?? (
                    <span className="text-gray-400 italic text-xs">Belum ditentukan</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {kelas.ruangan ?? (
                    <span className="text-gray-400 italic text-xs">-</span>
                  )}
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

      {/* Mobile card list */}
      <div className="md:hidden flex flex-col gap-3">
        {data.map((kelas) => (
          <div
            key={kelas.id}
            className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-800">{kelas.namaKelas}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {kelas.tahunAjaran?.nama} •{' '}
                  <Badge variant="info" className="text-xs">
                    {labelSemester(kelas.semester?.nama ?? '-')}
                  </Badge>
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
                {kelas.ruangan ?? '-'}
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
'''
    write_file(
        base,
        "src/app/dashboard/kelas-belajar/_components/kelas-belajar-table.tsx",
        kelas_belajar_table,
        "KelasBelajarTable",
    )

    # ─────────────────────────────────────────────────────────────
    # 4. src/app/dashboard/kelas-belajar/page.tsx
    # ─────────────────────────────────────────────────────────────
    print("=== STEP 3: KelasBelajarPage ===")

    kelas_belajar_page = '''\
'use client'

import { useState, useMemo, useEffect } from 'react'
import { PageHeader } from '@/components/ui'
import { useKelasList }            from '@/hooks/useKelas'
import { useTahunAjaranActive }    from '@/hooks/useTahunAjaran'
import { useSemesterByTahunAjaran } from '@/hooks/useSemester'
import { useAuthStore }            from '@/stores/auth.store'
import { canAccess, ROLE_AKSES_KELAS_BELAJAR } from '@/lib/helpers/role'
import { KelasBelajarFilters } from './_components/kelas-belajar-filters'
import { KelasBelajarTable }   from './_components/kelas-belajar-table'
import type { TingkatKelas }   from '@/types/akademik.types'

// CATATAN: tingkat kelas di-fetch dari API /tingkat-kelas
// Jika sudah ada hook useTingkatKelasList, ganti import di bawah
// Untuk sementara menggunakan endpoint langsung via useQuery inline
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

function useTingkatKelasList() {
  return useQuery({
    queryKey: ['tingkat-kelas'],
    queryFn: async (): Promise<TingkatKelas[]> => {
      const res = await api.get<TingkatKelas[]>('/tingkat-kelas')
      return res.data ?? []
    },
    staleTime: 1000 * 60 * 10,
  })
}

export default function KelasBelajarPage() {
  const { user } = useAuthStore()

  // Guard role — redirect jika tidak punya akses
  // Middleware Next.js sudah handle auth, ini untuk guard role di client
  const bolehAkses = canAccess(user?.role, ROLE_AKSES_KELAS_BELAJAR)

  // ── Filter state ─────────────────────────────────────────────
  const [tahunAjaranId,  setTahunAjaranId]  = useState<string>('')
  const [semesterId,     setSemesterId]     = useState<string>('')
  const [tingkatKelasId, setTingkatKelasId] = useState<string>('')
  const [search,         setSearch]         = useState<string>('')

  // ── Data fetch ───────────────────────────────────────────────
  const { data: tahunAjaranList = [], isLoading: loadingTA } =
    useTahunAjaranActive()

  const { data: semesterList = [] } =
    useSemesterByTahunAjaran(tahunAjaranId || null)

  const { data: tingkatKelasList = [] } = useTingkatKelasList()

  // Set default tahun ajaran ke yang pertama (terbaru) saat data load
  useEffect(() => {
    if (tahunAjaranList.length > 0 && !tahunAjaranId) {
      setTahunAjaranId(tahunAjaranList[0].id)
    }
  }, [tahunAjaranList, tahunAjaranId])

  // Set default semester ke yang aktif saat semester list berubah
  useEffect(() => {
    if (semesterList.length > 0 && !semesterId) {
      const aktif = semesterList.find((s) => s.isActive)
      if (aktif) setSemesterId(aktif.id)
    }
  }, [semesterList, semesterId])

  // ── Fetch kelas dengan filter ─────────────────────────────────
  const kelasFilter = useMemo(
    () => ({
      tahunAjaranId:  tahunAjaranId  || undefined,
      tingkatKelasId: tingkatKelasId || undefined,
      // CATATAN: API /kelas tidak punya filter semesterId langsung.
      // Semester digunakan untuk filter tampilan di sisi client.
    }),
    [tahunAjaranId, tingkatKelasId],
  )

  const { data: kelasList = [], isLoading: loadingKelas } =
    useKelasList(kelasFilter)

  // ── Filter & sort di client ───────────────────────────────────
  const filtered = useMemo(() => {
    let result = kelasList

    // Filter semester — cocokkan via relasi semester di kelas
    // CATATAN: Kelas tidak punya semesterId langsung di schema.
    // Semester filter di sini untuk UI consistency; data sudah
    // ter-scope oleh tahunAjaranId di API.
    // Jika backend menambahkan semesterId ke response kelas, aktifkan filter di bawah:
    // if (semesterId) {
    //   result = result.filter((k) => k.semesterId === semesterId)
    // }

    // Filter search nama kelas
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((k) =>
        k.namaKelas.toLowerCase().includes(q),
      )
    }

    // Sort: tingkat ASC, namaKelas ASC
    return [...result].sort((a, b) => {
      const tingkatA = a.tingkatKelas?.urutan ?? 0
      const tingkatB = b.tingkatKelas?.urutan ?? 0
      if (tingkatA !== tingkatB) return tingkatA - tingkatB
      return a.namaKelas.localeCompare(b.namaKelas)
    })
  }, [kelasList, search])

  // ── Guard ────────────────────────────────────────────────────
  if (!bolehAkses) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────
  const showTAFilter = tahunAjaranList.length > 1

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelas Belajar"
        description="Daftar kelas aktif beserta mata pelajaran yang berlangsung"
      />

      {/* Filter */}
      <KelasBelajarFilters
        tahunAjaranList={tahunAjaranList}
        semesterList={semesterList}
        tingkatKelasList={tingkatKelasList}
        tahunAjaranId={tahunAjaranId}
        semesterId={semesterId}
        tingkatKelasId={tingkatKelasId}
        search={search}
        onTahunAjaranChange={(id) => {
          setTahunAjaranId(id)
          setSemesterId('')  // reset semester saat TA berubah
        }}
        onSemesterChange={setSemesterId}
        onTingkatChange={setTingkatKelasId}
        onSearchChange={setSearch}
        showTahunAjaranFilter={showTAFilter}
      />

      {/* Tabel */}
      <KelasBelajarTable
        data={filtered}
        isLoading={loadingKelas || loadingTA}
      />

      {/* Info jumlah hasil */}
      {!loadingKelas && (
        <p className="text-xs text-gray-400">
          Menampilkan {filtered.length} dari {kelasList.length} kelas
        </p>
      )}
    </div>
  )
}
'''
    write_file(
        base,
        "src/app/dashboard/kelas-belajar/page.tsx",
        kelas_belajar_page,
        "KelasBelajarPage",
    )

    print("\n=== Batch 2 selesai. ===")
    print("""
File yang di-generate:
  src/app/dashboard/kelas-belajar/_components/kelas-belajar-filters.tsx
  src/app/dashboard/kelas-belajar/_components/kelas-belajar-table.tsx
  src/app/dashboard/kelas-belajar/page.tsx

CATATAN PENTING:
  1. Kelas type (kelas.types.ts) perlu field 'semester' opsional:
       semester?: { id: string; nama: string; isActive: boolean; urutan: number }
     Karena API /kelas mungkin include semester aktif di response.
     Sesuaikan setelah cek Network tab.

  2. useTingkatKelasList() dibuat inline di page.tsx.
     Jika sudah ada hook di hooks/, hapus inline dan import dari sana.

  3. Filter semester di client sementara di-comment karena
     model Kelas tidak punya semesterId langsung.
     Aktifkan jika backend include semesterId di response kelas.

  4. Tombol Mata Pelajaran → /dashboard/pembelajaran?kelasId=xxx
     (entry point, redirect berdasarkan role di Batch 6)
""")

if __name__ == "__main__":
    main()