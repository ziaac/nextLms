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
const AwardIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="8" r="6" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </svg>
)
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h8a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
  </svg>
)

// ── Row — seluruh row clickable ───────────────────────────────
function MapelTingkatRow({ item, onDetail, onDimensi }: {
  item:      MataPelajaranTingkat
  onDetail:  () => void
  onDimensi: () => void
}) {
  const deleteMutation  = useDeleteMapelTingkat()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const guruCount     = item.guruMapel.length
  const dimensiCount  = item._count?.dimensiProfil ?? 0

  return (
    <>
      <tr
        onClick={onDetail}
        className="border-b border-gray-100 dark:border-gray-700/50
          hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10
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
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Kelola Guru button with count */}
            <button
              onClick={(e) => { e.stopPropagation(); onDetail() }}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg
                border border-emerald-200 dark:border-emerald-700/50
                text-emerald-600 dark:text-emerald-400
                hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            >
              <UsersIcon />
              Kelola Guru{guruCount > 0 && ` (${guruCount})`}
            </button>
            {/* Dimensi Profil button with count */}
            <button
              onClick={(e) => { e.stopPropagation(); onDimensi() }}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg
                border border-purple-200 dark:border-purple-700/50
                text-purple-600 dark:text-purple-400
                hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              <AwardIcon />
              Dimensi Profil{dimensiCount > 0 && ` (${dimensiCount})`}
            </button>
            {/* Delete */}
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
function TingkatSection({ tingkat, search, onDetail, onDimensi }: {
  tingkat:   TingkatKelas
  search:    string
  onDetail:  (item: MataPelajaranTingkat) => void
  onDimensi: (item: MataPelajaranTingkat) => void
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
            <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700/50 px-4 py-4">
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
            Belum ada mata pelajaran untuk Tingkat {tingkat.nama}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-600/60">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-600/60">
              <tr>
                {['Kode','Nama','Kategori','Aksi'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-xs font-semibold text-gray-500
                    dark:text-gray-400 uppercase tracking-wider text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-700/50">
              {filtered.map((item) => (
                <MapelTingkatRow
                  key={item.id}
                  item={item}
                  onDetail={() => onDetail(item)}
                  onDimensi={() => onDimensi(item)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Reactive panel helpers ────────────────────────────────────
// We keep only (id, tingkatId, initialTab) in state and derive the full
// item from the live query so the SlideOver always reflects mutations.
function usePanelItem(itemId: string | null, tingkatId: string | null) {
  const { data } = useMapelTingkatByTingkat(tingkatId)
  return useMemo(
    () => (itemId && data ? (data.find((i) => i.id === itemId) ?? null) : null),
    [itemId, data],
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function MataPelajaranTingkatPage() {
  const { data: allTingkat, isLoading: loadingTingkat } = useTingkatKelasList()

  const [formOpen,        setFormOpen]        = useState(false)
  const [panelOpen,       setPanelOpen]       = useState(false)
  const [panelItemId,     setPanelItemId]     = useState<string | null>(null)
  const [panelTingkatId,  setPanelTingkatId]  = useState<string | null>(null)
  const [panelInitialTab, setPanelInitialTab] = useState<'guru' | 'dimensi'>('guru')
  const [search,          setSearch]          = useState('')
  const [filterTingkat,   setFilterTingkat]   = useState<string>('')

  // Derive panelItem reactively from live query — fixes stale snapshot bug
  const panelItem = usePanelItem(panelItemId, panelTingkatId)

  const openPanel = (item: MataPelajaranTingkat, tab: 'guru' | 'dimensi' = 'guru') => {
    setPanelItemId(item.id)
    setPanelTingkatId(item.tingkatKelasId)
    setPanelInitialTab(tab)
    setPanelOpen(true)
  }

  const handleClosePanel = () => {
    setPanelOpen(false)
    setTimeout(() => { setPanelItemId(null); setPanelTingkatId(null) }, 300)
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
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border
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
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border
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
              <div key={i} className="h-40 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
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
                onDetail={(item) => openPanel(item, 'guru')}
                onDimensi={(item) => openPanel(item, 'dimensi')}
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
        initialTab={panelInitialTab}
      />
    </>
  )
}
