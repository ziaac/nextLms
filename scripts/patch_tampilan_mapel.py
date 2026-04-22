"""
PATCH — Revisi halaman mata-pelajaran-tingkat:
  1. Tambah search + filter per tingkat (frontend-side)
  2. Seluruh row bisa diklik untuk buka SlideOver (bukan hanya nama)
  3. Fix padding SlideOver content area

Jalankan dari ROOT project FRONTEND:
    python scripts/patch_mapel_tingkat_revisi.py
"""

import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def p(rel: str) -> str:
    return os.path.join(BASE, rel.replace("/", os.sep))


def write(label: str, path: str, content: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    mode = "diupdate" if os.path.exists(path) else "dibuat"
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    icon = "🔄" if mode == "diupdate" else "✅"
    print(f"  {icon} [{mode}]  {label}")


def patch(label: str, path: str, old: str, new: str) -> bool:
    if not os.path.exists(path):
        print(f"  ❌ [{label}] File tidak ditemukan")
        return False
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    if old not in content:
        print(f"  ⚠️  [{label}] Anchor tidak ditemukan — skip")
        return False
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.replace(old, new, 1))
    print(f"  ✅ [{label}]")
    return True


# ============================================================
# 1. SlideOver.tsx — tambah padding p-6 di content area
# ============================================================
SLIDEOVER_PATH = p("src/components/ui/SlideOver.tsx")

SLIDEOVER_OLD = """\
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {children}
        </div>"""

SLIDEOVER_NEW = """\
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="p-6">
            {children}
          </div>
        </div>"""

# ============================================================
# 2. mata-pelajaran-tingkat/page.tsx — search, filter tingkat, row click
# ============================================================
PAGE_CONTENT = """\
'use client'

import { useState, useMemo } from 'react'
import { PageHeader, Button, Badge, EmptyState, ConfirmModal } from '@/components/ui'
import { SearchInput } from '@/components/ui'
import {
  useMapelTingkatByTingkat,
  useDeleteMapelTingkat,
} from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
import MapelTingkatFormModal from './_components/MapelTingkatFormModal'
import MapelTingkatPanel    from './_components/MapelTingkatPanel'
import type { MataPelajaranTingkat, TingkatKelas } from '@/types/akademik.types'

const KATEGORI_LABEL: Record<string, string> = {
  WAJIB: 'Wajib', PEMINATAN: 'Peminatan', LINTAS_MINAT: 'Lintas Minat',
  MULOK: 'Mulok', PENGEMBANGAN_DIRI: 'Pengembangan Diri',
}
const KATEGORI_VARIANT: Record<string, 'info'|'success'|'warning'|'purple'|'default'> = {
  WAJIB: 'info', PEMINATAN: 'success', LINTAS_MINAT: 'warning',
  MULOK: 'purple', PENGEMBANGAN_DIRI: 'default',
}

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)
const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h8a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
  </svg>
)

// ── Row — seluruh row clickable ───────────────────────────────
function MapelTingkatRow({ item, onDetail }: {
  item: MataPelajaranTingkat; onDetail: () => void
}) {
  const deleteMutation  = useDeleteMapelTingkat()
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <>
      <tr
        onClick={onDetail}
        className="border-b border-gray-100 dark:border-gray-700/50
          hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10
          cursor-pointer transition-colors group"
      >
        <td className="px-4 py-3">
          <span className="font-mono text-sm font-semibold text-gray-700 dark:text-gray-300">
            {item.masterMapel.kode}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm font-medium text-gray-900 dark:text-white
            group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {item.masterMapel.nama}
          </span>
        </td>
        <td className="px-4 py-3">
          <Badge variant={KATEGORI_VARIANT[item.masterMapel.kategori] ?? 'default'} size="sm">
            {KATEGORI_LABEL[item.masterMapel.kategori] ?? item.masterMapel.kategori}
          </Badge>
        </td>
        <td className="px-4 py-3">
          {item.guruMapel.length === 0 ? (
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">Belum ada guru</span>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {item.guruMapel.slice(0, 3).map((gm) => (
                  <div key={gm.id} title={gm.guru.profile.namaLengkap}
                    className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30
                      border-2 border-white dark:border-gray-900
                      flex items-center justify-center
                      text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {gm.guru.profile.namaLengkap.split(' ').slice(0,2).map((n: string) => n[0]).join('')}
                  </div>
                ))}
                {item.guruMapel.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700
                    border-2 border-white dark:border-gray-900
                    flex items-center justify-center
                    text-[10px] font-medium text-gray-500 dark:text-gray-400">
                    +{item.guruMapel.length - 3}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {item.guruMapel.length} guru
              </span>
            </div>
          )}
        </td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          {/* Tombol aksi — stopPropagation agar tidak trigger onDetail */}
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); onDetail() }}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg
                border border-emerald-200 dark:border-emerald-700/50
                text-emerald-600 dark:text-emerald-400
                hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            >
              <UsersIcon />
              Kelola Guru
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50
                dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            >
              <TrashIcon />
            </button>
          </div>
        </td>
      </tr>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteMutation.mutate(item.id, { onSuccess: () => setConfirmDelete(false) })
        }
        isLoading={deleteMutation.isPending}
        title="Hapus Mapel dari Tingkat"
        description={`Yakin hapus "${item.masterMapel.nama} — Tingkat ${item.tingkatKelas.nama}"? Pool guru akan ikut terhapus.`}
        confirmLabel="Hapus"
        variant="danger"
      />
    </>
  )
}

// ── Tabel per tingkat dengan filter ──────────────────────────
function TingkatSection({ tingkat, search, onDetail }: {
  tingkat:  TingkatKelas
  search:   string
  onDetail: (item: MataPelajaranTingkat) => void
}) {
  const { data, isLoading } = useMapelTingkatByTingkat(tingkat.id)

  // Filter frontend berdasarkan search
  const filtered = useMemo(() => {
    if (!data) return []
    if (!search) return data
    const q = search.toLowerCase()
    return data.filter((item) =>
      item.masterMapel.nama.toLowerCase().includes(q) ||
      item.masterMapel.kode.toLowerCase().includes(q)
    )
  }, [data, search])

  // Sembunyikan section jika search aktif dan tidak ada hasil
  if (search && filtered.length === 0 && !isLoading) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg
          bg-emerald-100 dark:bg-emerald-900/20
          text-emerald-700 dark:text-emerald-400 font-bold text-sm">
          {tingkat.nama}
        </div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Tingkat {tingkat.nama}
        </p>
        {!isLoading && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            · {filtered.length}{search ? ` dari ${data?.length ?? 0}` : ''} mata pelajaran
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-1.5">
          {[1,2,3].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700/50 px-4 py-4">
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
            Belum ada mata pelajaran untuk Tingkat {tingkat.nama}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-600/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-600/60">
              <tr>
                {['Kode','Nama','Kategori','Guru Pengajar','Aksi'].map((h, i) => (
                  <th key={h} className={`px-4 py-2.5 text-xs font-semibold text-gray-500
                    dark:text-gray-400 uppercase tracking-wider
                    ${i === 4 ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-700/50">
              {filtered.map((item) => (
                <MapelTingkatRow key={item.id} item={item} onDetail={() => onDetail(item)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function MataPelajaranTingkatPage() {
  const { data: allTingkat, isLoading: loadingTingkat } = useTingkatKelasList()

  const [formOpen,       setFormOpen]       = useState(false)
  const [panelOpen,      setPanelOpen]      = useState(false)
  const [panelItem,      setPanelItem]      = useState<MataPelajaranTingkat | null>(null)
  const [search,         setSearch]         = useState('')
  const [filterTingkat,  setFilterTingkat]  = useState<string>('') // '' = semua

  const handleDetail = (item: MataPelajaranTingkat) => {
    setPanelItem(item)
    setPanelOpen(true)
  }

  const handleClosePanel = () => {
    setPanelOpen(false)
    setTimeout(() => setPanelItem(null), 300)
  }

  // Tingkat yang ditampilkan — semua atau yang dipilih
  const tingkatToShow = allTingkat
    ? filterTingkat
      ? allTingkat.filter((t) => t.id === filterTingkat)
      : [...allTingkat].sort((a, b) => a.urutan - b.urutan)
    : []

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Mata Pelajaran per Tingkat"
          description="Kelola pemetaan mata pelajaran ke tingkat kelas beserta pool guru pengajarnya."
          actions={
            <Button onClick={() => setFormOpen(true)}>
              <span className="flex items-center gap-1.5">
                <PlusIcon />
                Tambah
              </span>
            </Button>
          }
        />

        {/* Search + Filter tingkat */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Cari kode atau nama mapel..."
            />
          </div>

          {/* Filter pill per tingkat */}
          {allTingkat && allTingkat.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterTingkat('')}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors border
                  ${filterTingkat === ''
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-gray-200 dark:border-gray-600/60 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                Semua
              </button>
              {[...allTingkat].sort((a, b) => a.urutan - b.urutan).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilterTingkat(t.id === filterTingkat ? '' : t.id)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors border
                    ${filterTingkat === t.id
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-gray-200 dark:border-gray-600/60 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                  {t.nama}
                </button>
              ))}
            </div>
          )}
        </div>

        {loadingTingkat ? (
          <div className="space-y-6">
            {[1,2,3].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : !allTingkat || allTingkat.length === 0 ? (
          <EmptyState
            title="Belum ada tingkat kelas"
            description="Tambahkan Tingkat X, XI, XII terlebih dahulu di menu Tingkat Kelas."
          />
        ) : (
          <div className="space-y-8">
            {tingkatToShow.map((tingkat) => (
              <TingkatSection
                key={tingkat.id}
                tingkat={tingkat}
                search={search}
                onDetail={handleDetail}
              />
            ))}
          </div>
        )}
      </div>

      <MapelTingkatFormModal open={formOpen} onClose={() => setFormOpen(false)} />

      <MapelTingkatPanel
        open={panelOpen}
        onClose={handleClosePanel}
        item={panelItem}
      />
    </>
  )
}
"""


def main():
    print("\n" + "=" * 56)
    print("  PATCH — Revisi mata-pelajaran-tingkat & SlideOver")
    print("=" * 56)

    print("\n[1] SlideOver.tsx — tambah padding p-6")
    patch("SlideOver content padding", SLIDEOVER_PATH, SLIDEOVER_OLD, SLIDEOVER_NEW)

    print("\n[2] mata-pelajaran-tingkat/page.tsx — search + filter + row click")
    write(
        "page.tsx",
        p("src/app/dashboard/mata-pelajaran-tingkat/page.tsx"),
        PAGE_CONTENT,
    )

    print("\n" + "=" * 56)
    print("  Perubahan:")
    print("  • SlideOver — semua content area dapat padding p-6")
    print("  • Search — filter frontend by kode/nama, real-time")
    print("  • Filter tingkat — pill X | XI | XII | Semua")
    print("  • Row — seluruh baris clickable, buka SlideOver")
    print("  • Tombol hapus — stopPropagation agar tidak trigger panel")
    print("  • Section tingkat disembunyikan jika search aktif & kosong")
    print("=" * 56)
    print()


if __name__ == "__main__":
    main()