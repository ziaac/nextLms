import os, sys

def write_file(base, rel, content, check):
    path = os.path.join(base, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    with open(path, "r", encoding="utf-8") as f:
        v = f.read()
    print(f"  {'OK' if check in v else 'GAGAL'}: {rel}")

def resolve_hooks(base):
    hooks_root = os.path.join(base, "src", "hooks")
    def hook_import(folder, fallback):
        fp = os.path.join(hooks_root, folder)
        if os.path.isdir(fp):
            files = [f for f in os.listdir(fp) if f.endswith(".ts")]
            if files:
                name = sorted(files)[0].replace(".ts", "")
                return f"@/hooks/{folder}/{name}"
        return fallback
    return {
        "kelas":    hook_import("kelas",        "@/hooks/kelas/useKelas"),
        "semester": hook_import("semester",      "@/hooks/semester/useSemester"),
        "ta":       hook_import("tahun-ajaran",  "@/hooks/tahun-ajaran/useTahunAjaran"),
    }

def main():
    base = sys.argv[1] if len(sys.argv) > 1 else "../"
    base = os.path.abspath(base)
    print(f"Base dir: {base}\n")

    h = resolve_hooks(base)

    # ─────────────────────────────────────────────────────────────
    # STEP 1 — Tambah types ke akademik.types.ts
    # ─────────────────────────────────────────────────────────────
    print("=== STEP 1: Tambah ReportGuruSaya types ke akademik.types.ts ===")

    types_path = os.path.join(base, "src/types/akademik.types.ts")
    with open(types_path, "r", encoding="utf-8") as f:
        types_content = f.read()

    report_types = """
// ── Report Guru Saya ──────────────────────────────────────────
// Shape dari GET /report/guru/saya

export interface JadwalMengajarItem {
  hari:  string  // "SENIN", "SELASA", dll
  kelas: string  // "X-A 2026"
  mapel: string  // "Bahasa Arab"
}

export interface TugasStatsItem {
  judul:        string
  kelas:        string
  mapel:        string
  totalSiswa:   number
  sudahSubmit:  number
}

export interface StatistikGuruResponse {
  guruId:          string
  tahunAjaranId:   string
  semesterId:      string
  mataPelajaranId: string | null
  periode: {
    bulan: number
    tahun: number
  }
  jadwalMengajar:    JadwalMengajarItem[]
  tugas:             TugasStatsItem[]
  totalNilaiDiinput: number
  totalSesiAbsensi:  number
}
"""

    if "StatistikGuruResponse" not in types_content:
        types_content += report_types
        with open(types_path, "w", encoding="utf-8") as f:
            f.write(types_content)
        print("  OK: tambah StatistikGuruResponse ke akademik.types.ts")
    else:
        print("  SKIP: StatistikGuruResponse sudah ada")

    # ─────────────────────────────────────────────────────────────
    # STEP 2 — Tambah report API
    # ─────────────────────────────────────────────────────────────
    print("\n=== STEP 2: src/lib/api/report.api.ts ===")

    report_api = """\
import api from '@/lib/axios'
import type { StatistikGuruResponse } from '@/types/akademik.types'

// ── Report Guru ───────────────────────────────────────────────

export interface ReportGuruParams {
  tahunAjaranId:   string
  semesterId:      string
  mataPelajaranId?: string
  bulan?:          number
  tahun?:          number
}

export const reportApi = {
  /**
   * GET /report/guru/saya
   * Statistik guru: jadwal, tugas, nilai, absensi
   * Jika mataPelajaranId diisi → filter per mapel
   */
  getGuruSaya: async (params: ReportGuruParams): Promise<StatistikGuruResponse> => {
    const res = await api.get<StatistikGuruResponse>('/report/guru/saya', { params })
    return res.data
  },
}
"""
    write_file(base, "src/lib/api/report.api.ts", report_api, "getGuruSaya")

    # ─────────────────────────────────────────────────────────────
    # STEP 3 — MapelCardGuru component
    # ─────────────────────────────────────────────────────────────
    print("\n=== STEP 3: mapel-card-guru.tsx ===")

    mapel_card_guru = """\
'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen, ClipboardList, BarChart2, CalendarDays,
  Users, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { Button, Badge, Skeleton } from '@/components/ui'
import { reportApi } from '@/lib/api/report.api'
import type { MataPelajaran } from '@/types/akademik.types'

interface Props {
  mapel:         MataPelajaran
  tahunAjaranId: string
  semesterId:    string
}

function StatMini({
  label, value, sub, icon: Icon, color = 'gray',
}: {
  label: string
  value: string | number
  sub?:  string
  icon:  React.ElementType
  color?: 'gray' | 'emerald' | 'amber' | 'blue'
}) {
  const colorMap = {
    gray:    'text-gray-400 bg-gray-50',
    emerald: 'text-emerald-500 bg-emerald-50',
    amber:   'text-amber-500 bg-amber-50',
    blue:    'text-blue-500 bg-blue-50',
  }
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-gray-100 px-3 py-2">
      <div className={`rounded-lg p-1.5 ${colorMap[color]}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
        {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

export function MapelCardGuru({ mapel, tahunAjaranId, semesterId }: Props) {
  const router = useRouter()

  // Fetch stat per mapel — lazy, hanya saat card render
  const { data: stat, isLoading: loadingStat } = useQuery({
    queryKey: ['report-guru-saya', mapel.id, semesterId],
    queryFn:  () => reportApi.getGuruSaya({
      tahunAjaranId,
      semesterId,
      mataPelajaranId: mapel.id,
    }),
    staleTime: 1000 * 60 * 5,
    enabled:   !!tahunAjaranId && !!semesterId,
  })

  const namaMapel  = mapel.mataPelajaranTingkat.masterMapel.nama
  const kodeMapel  = mapel.mataPelajaranTingkat.masterMapel.kode
  const namaKelas  = mapel.kelas.namaKelas

  // Hitung stat tugas dari report
  const totalTugas    = stat?.tugas.length ?? 0
  const totalSubmit   = stat?.tugas.reduce((acc, t) => acc + t.sudahSubmit, 0) ?? 0
  const totalSiswa    = stat?.tugas.reduce((acc, t) => acc + t.totalSiswa, 0) ?? 0
  const belumSubmit   = totalSiswa - totalSubmit

  // Todo: ada tugas yang belum semua siswa submit
  const adaTodoPengumpulan = stat?.tugas.some(
    (t) => t.sudahSubmit < t.totalSiswa
  ) ?? false

  const jadwalText = mapel.jadwalPelajaran.length > 0
    ? mapel.jadwalPelajaran
        .map((j) => `${j.hari.slice(0, 3)} ${j.jamMulai.slice(0, 5)}`)
        .join(', ')
    : 'Belum ada jadwal'

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">

      
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{namaMapel}</p>
          <p className="text-xs text-gray-400 mt-0.5">{kodeMapel} · {namaKelas}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant={mapel.isActive ? 'success' : 'default'}>
            {mapel.isActive ? 'Aktif' : 'Nonaktif'}
          </Badge>
          <Badge variant="info">{mapel.mataPelajaranTingkat.masterMapel.kategori}</Badge>
        </div>
      </div>

      
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>{jadwalText}</span>
      </div>

      
      {adaTodoPengumpulan && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">
            Ada siswa belum mengumpulkan tugas
          </p>
        </div>
      )}

      
      {loadingStat ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <StatMini
            label="Sesi Absensi"
            value={stat?.totalSesiAbsensi ?? mapel._count.absensi}
            icon={CalendarDays}
            color="blue"
          />
          <StatMini
            label="Tugas Dibuat"
            value={totalTugas}
            sub={totalTugas > 0 ? `${totalSubmit}/${totalSiswa} terkumpul` : undefined}
            icon={ClipboardList}
            color={adaTodoPengumpulan ? 'amber' : 'emerald'}
          />
          <StatMini
            label="Materi"
            value={mapel._count.materiPelajaran}
            icon={BookOpen}
            color="gray"
          />
          <StatMini
            label="Nilai Diinput"
            value={stat?.totalNilaiDiinput ?? mapel._count.penilaian}
            icon={BarChart2}
            color="gray"
          />
        </div>
      )}

      
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<CalendarDays className="w-3.5 h-3.5" />}
          onClick={() => router.push(`/dashboard/absensi?mataPelajaranId=${mapel.id}`)}
        >
          Absensi
        </Button>
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<BookOpen className="w-3.5 h-3.5" />}
          onClick={() => router.push(`/dashboard/materi?mataPelajaranId=${mapel.id}`)}
        >
          Materi
        </Button>
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<ClipboardList className="w-3.5 h-3.5" />}
          onClick={() => router.push(`/dashboard/tugas?mataPelajaranId=${mapel.id}`)}
        >
          Tugas
        </Button>
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Users className="w-3.5 h-3.5" />}
          onClick={() => router.push(`/dashboard/kelas/${mapel.kelasId}`)}
        >
          Siswa
        </Button>
      </div>
    </div>
  )
}
"""
    write_file(base,
        "src/app/dashboard/pembelajaran/guru/_components/mapel-card-guru.tsx",
        mapel_card_guru, "MapelCardGuru")

    # ─────────────────────────────────────────────────────────────
    # STEP 4 — MapelArsipSlideover
    # ─────────────────────────────────────────────────────────────
    print("\n=== STEP 4: mapel-arsip-slideover.tsx ===")

    arsip_slideover = """\
'use client'

import { useRouter } from 'next/navigation'
import { BookOpen, ClipboardList, BarChart2, CalendarDays } from 'lucide-react'
import { SlideOver, Button, Badge, Skeleton } from '@/components/ui'
import { useMataPelajaranList } from '@/hooks/useMataPelajaran'
import type { UserRole } from '@/types/enums'

interface Props {
  open:          boolean
  onClose:       () => void
  guruId:        string
  // Semester tidak aktif — diambil dari TA terkait
  semesterIds:   string[]  // list semesterId yang tidak aktif
}

export function MapelArsipSlideover({ open, onClose, guruId, semesterIds }: Props) {
  const router = useRouter()

  // Fetch mapel arsip — semua semester tidak aktif per guru
  // Fetch per semesterId (ambil yang pertama sebagai contoh)
  // TODO: idealnya backend support filter isActive=false atau multi semesterId
  const { data: arsipResponse, isLoading } = useMataPelajaranList(
    open && guruId ? {
      guruId,
      isActive: false,
    } : undefined
  )
  const arsipList = arsipResponse?.data ?? []

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Arsip Mata Pelajaran"
      width="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Daftar mata pelajaran dari semester yang sudah tidak aktif.
          Akses bersifat hanya lihat.
        </p>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        )}

        {!isLoading && arsipList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <BookOpen className="w-8 h-8 opacity-40" />
            <p className="text-sm">Tidak ada arsip mata pelajaran</p>
          </div>
        )}

        {!isLoading && arsipList.map((mapel) => (
          <div
            key={mapel.id}
            className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-700 text-sm">
                  {mapel.mataPelajaranTingkat.masterMapel.nama}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {mapel.kelas.namaKelas} · Semester {mapel.semester.nama}
                </p>
              </div>
              <Badge variant="default">Arsip</Badge>
            </div>

            
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                onClick={() => router.push(
                  `/dashboard/materi?mataPelajaranId=${mapel.id}&readOnly=true`
                )}
              >
                Lihat Materi
              </Button>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<ClipboardList className="w-3.5 h-3.5" />}
                onClick={() => router.push(
                  `/dashboard/tugas?mataPelajaranId=${mapel.id}&readOnly=true`
                )}
              >
                Lihat Tugas
              </Button>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<BarChart2 className="w-3.5 h-3.5" />}
                onClick={() => router.push(
                  `/dashboard/penilaian?mataPelajaranId=${mapel.id}&readOnly=true`
                )}
              >
                Lihat Nilai
              </Button>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<CalendarDays className="w-3.5 h-3.5" />}
                onClick={() => router.push(
                  `/dashboard/absensi?mataPelajaranId=${mapel.id}&readOnly=true`
                )}
              >
                Lihat Absensi
              </Button>
            </div>
          </div>
        ))}
      </div>
    </SlideOver>
  )
}
"""
    write_file(base,
        "src/app/dashboard/pembelajaran/guru/_components/mapel-arsip-slideover.tsx",
        arsip_slideover, "MapelArsipSlideover")

    # ─────────────────────────────────────────────────────────────
    # STEP 5 — Guru Page
    # ─────────────────────────────────────────────────────────────
    print("\n=== STEP 5: pembelajaran/guru/page.tsx ===")

    guru_page = f"""\
'use client'

import {{ useState, useMemo, useEffect }} from 'react'
import {{ Archive, CalendarDays }} from 'lucide-react'
import {{ PageHeader, Button, SearchInput }} from '@/components/ui'
import {{ useMataPelajaranList }} from '@/hooks/useMataPelajaran'
import {{ useSemesterByTahunAjaran }} from '{h["semester"]}'
import {{ useTahunAjaranActive }} from '{h["ta"]}'
import {{ useAuthStore }} from '@/stores/auth.store'
import {{ isGuru }} from '@/lib/helpers/role'
import {{ MapelCardGuru }} from './_components/mapel-card-guru'
import {{ MapelArsipSlideover }} from './_components/mapel-arsip-slideover'
import {{ useRouter }} from 'next/navigation'

export default function PembelajaranGuruPage() {{
  const router        = useRouter()
  const {{ user }}    = useAuthStore()
  const bolehAkses    = isGuru(user?.role)

  const [search,      setSearch]      = useState('')
  const [arsipOpen,   setArsipOpen]   = useState(false)

  // ── Resolve TA & Semester aktif ───────────────────────────────
  const {{ data: taList = [] }}         = useTahunAjaranActive()
  const taAktif                         = taList[0]
  const {{ data: semesterList = [] }}   = useSemesterByTahunAjaran(taAktif?.id || null)
  const semesterAktif                   = semesterList.find((s) => s.isActive)
  const semesterTidakAktif              = semesterList.filter((s) => !s.isActive)

  // ── Fetch mapel guru aktif ────────────────────────────────────
  const {{ data: mapelResponse, isLoading }} = useMataPelajaranList(
    user?.id && semesterAktif?.id ? {{
      guruId:     user.id,
      semesterId: semesterAktif.id,
    }} : undefined
  )
  const mapelList = mapelResponse?.data ?? []

  // ── Filter search ─────────────────────────────────────────────
  const filtered = useMemo(() => {{
    if (!search.trim()) return mapelList
    const q = search.toLowerCase()
    return mapelList.filter((m) =>
      m.mataPelajaranTingkat.masterMapel.nama.toLowerCase().includes(q) ||
      m.kelas.namaKelas.toLowerCase().includes(q)
    )
  }}, [mapelList, search])

  if (!bolehAkses) {{
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p className="text-sm">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }}

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pembelajaran Saya"
        description={{
          semesterAktif
            ? `Semester ${{semesterAktif.nama}} — ${{taAktif?.nama ?? ''}}`
            : 'Tidak ada semester aktif'
        }}
        actions={{
          <div className="flex gap-2">
            <Button
              variant="secondary"
              leftIcon={{<CalendarDays className="w-4 h-4" />}}
              onClick={{() => router.push('/dashboard/jadwal')}}
            >
              Jadwal Saya
            </Button>
            <Button
              variant="secondary"
              leftIcon={{<Archive className="w-4 h-4" />}}
              onClick={{() => setArsipOpen(true)}}
            >
              Arsip
            </Button>
          </div>
        }}
      />

      
      <div className="w-full sm:w-72">
        <SearchInput
          placeholder="Cari mata pelajaran..."
          value={{search}}
          onChange={{setSearch}}
        />
      </div>

      
      {{!semesterAktif && !isLoading && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-700">
            Tidak ada semester aktif saat ini.
            Hubungi admin untuk mengaktifkan semester.
          </p>
        </div>
      )}}

      
      {{isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {{Array.from({{ length: 6 }}).map((_, i) => (
            <div key={{i}} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {{Array.from({{ length: 4 }}).map((__, j) => (
                  <div key={{j}} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                ))}}
              </div>
            </div>
          ))}}
        </div>
      )}}

      
      {{!isLoading && filtered.length === 0 && semesterAktif && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <CalendarDays className="w-10 h-10 opacity-40" />
          <p className="text-sm font-medium">
            {{search ? 'Tidak ada mata pelajaran ditemukan' : 'Belum ada mata pelajaran di semester ini'}}
          </p>
          {{!search && (
            <p className="text-xs text-center max-w-xs">
              Mata pelajaran akan muncul setelah admin menambahkan Anda sebagai pengajar.
            </p>
          )}}
        </div>
      )}}

      
      {{!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {{filtered.map((mapel) => (
            <MapelCardGuru
              key={{mapel.id}}
              mapel={{mapel}}
              tahunAjaranId={{taAktif?.id ?? ''}}
              semesterId={{semesterAktif?.id ?? ''}}
            />
          ))}}
        </div>
      )}}

      
      {{!isLoading && mapelList.length > 0 && (
        <p className="text-xs text-gray-400">
          Menampilkan {{filtered.length}} dari {{mapelList.length}} mata pelajaran
        </p>
      )}}

      
      <MapelArsipSlideover
        open={{arsipOpen}}
        onClose={{() => setArsipOpen(false)}}
        guruId={{user?.id ?? ''}}
        semesterIds={{semesterTidakAktif.map((s) => s.id)}}
      />
    </div>
  )
}}
"""
    write_file(base,
        "src/app/dashboard/pembelajaran/guru/page.tsx",
        guru_page, "PembelajaranGuruPage")

    print("\n=== Batch 4 selesai. ===")
    print("""
File yang di-generate:
  src/types/akademik.types.ts              (tambah ReportGuruSaya types)
  src/lib/api/report.api.ts                (baru)
  src/app/dashboard/pembelajaran/guru/
    _components/mapel-card-guru.tsx        (card mapel dengan stat)
    _components/mapel-arsip-slideover.tsx  (arsip read-only)
    page.tsx                               (halaman guru)

CATATAN:
  1. Stat per mapel di-fetch via GET /report/guru/saya?mataPelajaranId=
     Setiap card fetch sendiri (lazy) — efisien karena data kecil per mapel
  2. Arsip fetch dengan filter isActive=false — sesuaikan jika backend
     belum support filter ini (cek response)
  3. Navigasi materi/tugas arsip pakai ?readOnly=true — implementasi
     read-only di halaman materi/tugas dilakukan di fase selanjutnya
  4. SearchInput diimport dari @/components/ui — pastikan sudah ada di barrel
""")

if __name__ == "__main__":
    main()