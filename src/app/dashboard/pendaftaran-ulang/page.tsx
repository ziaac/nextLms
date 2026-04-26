'use client'

import { useState, useCallback } from 'react'
import { Plus, Upload, UserCheck, Download, Archive, Search, X, ShieldCheck } from 'lucide-react'
import { useTahunAjaranList, useTahunAjaranOneActive } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSiswaLulus, useDeleteSiswaLulus } from '@/hooks/pendaftaran/usePendaftaran'
import { ConfirmModal, Select } from '@/components/ui'
import type { SiswaLulus } from '@/types/pendaftaran.types'
import type { TahunAjaran } from '@/types/tahun-ajaran.types'
import { SiswaLulusTable } from './_components/SiswaLulusTable'
import { DetailPanel } from './_components/DetailPanel'
import { TambahEditModal } from './_components/TambahEditModal'
import { ImportModal } from './_components/ImportModal'
import { BuatkanAkunModal } from './_components/BuatkanAkunModal'
import { ExportModal } from './_components/ExportModal'
import { ArsipPanel } from './_components/ArsipPanel'
import { BiodataFormPanel } from './_components/BiodataFormPanel'
import { VerifikasiMassalModal } from './_components/VerifikasiMassalModal'
import { ImportBiodataModal } from './_components/ImportBiodataModal'

const JALUR_OPTIONS = [
  { value: 'ZONASI',      label: 'Zonasi' },
  { value: 'PRESTASI',    label: 'Prestasi' },
  { value: 'AFIRMASI',    label: 'Afirmasi' },
  { value: 'PERPINDAHAN', label: 'Perpindahan' },
  { value: 'REGULER',     label: 'Reguler' },
]

export default function PendaftaranUlangPage() {
  const [page,            setPage]            = useState(1)
  const [search,          setSearch]          = useState('')
  const [tahunAjaranId,   setTahunAjaranId]   = useState('')
  const [jalur,           setJalur]           = useState('')
  const [detailItem,      setDetailItem]      = useState<SiswaLulus | null>(null)
  const [editItem,        setEditItem]        = useState<SiswaLulus | null | undefined>(undefined)
  const [deleteItem,      setDeleteItem]      = useState<SiswaLulus | null>(null)
  const [showImport,      setShowImport]      = useState(false)
  const [showBuatAkun,    setShowBuatAkun]    = useState(false)
  const [showExport,      setShowExport]      = useState(false)
  const [showArsip,        setShowArsip]        = useState(false)
  const [showVerifMassal,  setShowVerifMassal]  = useState(false)
  const [showImportBiodata, setShowImportBiodata] = useState(false)
  const [biodataItem,      setBiodataItem]      = useState<SiswaLulus | null>(null)

  const { data: activeTA } = useTahunAjaranOneActive()
  const { data: tahunList } = useTahunAjaranList()

  // Use active tahun ajaran as default when no filter set
  const resolvedTahunId = tahunAjaranId || activeTA?.id || ''

  const { data, isLoading } = useSiswaLulus({
    tahunAjaranId: resolvedTahunId || undefined,
    jalurPendaftaran: jalur || undefined,
    search: search || undefined,
    page,
    limit: 50,
  })

  const deleteMutation = useDeleteSiswaLulus()

  const handleEdit = useCallback((item: SiswaLulus) => {
    setDetailItem(null)
    setEditItem(item)
  }, [])

  const handleBiodata = useCallback((item: SiswaLulus) => {
    setDetailItem(null)
    setBiodataItem(item)
  }, [])

  const handleDelete = useCallback((item: SiswaLulus) => {
    setDeleteItem(item)
  }, [])

  const handleConfirmDelete = async () => {
    if (!deleteItem) return
    await deleteMutation.mutateAsync(deleteItem.id)
    setDeleteItem(null)
  }

  const handlePageChange = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearchChange = (v: string) => {
    setSearch(v)
    setPage(1)
  }

  const handleTahunChange = (v: string) => {
    setTahunAjaranId(v)
    setPage(1)
  }

  const handleJalurChange = (v: string) => {
    setJalur(v)
    setPage(1)
  }

  const displayTahun = tahunList?.find((t: TahunAjaran) => t.id === resolvedTahunId)

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">Pendaftaran Ulang</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {displayTahun ? `Tahun Ajaran ${displayTahun.nama}` : 'Memuat...'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowArsip(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Archive size={13} /> Arsip
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Download size={13} /> Export
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Upload size={13} /> Import
          </button>
          <button
            onClick={() => setShowImportBiodata(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Upload size={13} /> Import Biodata
          </button>
          <button
            onClick={() => setShowVerifMassal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <ShieldCheck size={13} /> Verifikasi Massal
          </button>
          <button
            onClick={() => setShowBuatAkun(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
          >
            <UserCheck size={13} /> Buatkan Akun
          </button>
          <button
            onClick={() => setEditItem(null)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <Plus size={13} /> Tambah Data
          </button>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama atau no. pendaftaran..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Tahun Ajaran */}
        <Select
          size="sm"
          options={(tahunList ?? []).map((t: TahunAjaran) => ({ value: t.id, label: t.nama }))}
          value={tahunAjaranId || activeTA?.id || ''}
          onChange={(e) => handleTahunChange(e.target.value)}
          placeholder="Semua Tahun"
        />

        {/* Jalur */}
        <Select
          size="sm"
          options={JALUR_OPTIONS}
          value={jalur}
          onChange={(e) => handleJalurChange(e.target.value)}
          placeholder="Semua Jalur"
        />
      </div>

      {/* ── Table ────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5 shadow-sm">
        <SiswaLulusTable
          data={data}
          isLoading={isLoading}
          page={page}
          onPageChange={handlePageChange}
          onRowClick={setDetailItem}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* ── Detail Panel ─────────────────────────────────────────── */}
      <DetailPanel
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={handleEdit}
        onBiodata={handleBiodata}
      />

      {/* ── Tambah / Edit Modal ───────────────────────────────────── */}
      <TambahEditModal
        open={editItem !== undefined}
        onClose={() => setEditItem(undefined)}
        item={editItem ?? null}
        defaultTahunAjaranId={resolvedTahunId}
      />

      {/* ── Import Modal ─────────────────────────────────────────── */}
      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        defaultTahunAjaranId={resolvedTahunId}
      />

      {/* ── Buatkan Akun Modal ───────────────────────────────────── */}
      <BuatkanAkunModal
        open={showBuatAkun}
        onClose={() => setShowBuatAkun(false)}
        tahunAjaranId={resolvedTahunId}
      />

      {/* ── Export Modal ─────────────────────────────────────────── */}
      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        defaultTahunAjaranId={resolvedTahunId}
      />

      {/* ── Import Biodata Modal ─────────────────────────────────── */}
      <ImportBiodataModal
        open={showImportBiodata}
        onClose={() => setShowImportBiodata(false)}
        defaultTahunAjaranId={resolvedTahunId}
      />

      {/* ── Verifikasi Massal Modal ──────────────────────────────── */}
      <VerifikasiMassalModal
        open={showVerifMassal}
        onClose={() => setShowVerifMassal(false)}
        defaultTahunAjaranId={resolvedTahunId}
      />

      {/* ── Biodata Form Panel ───────────────────────────────────── */}
      <BiodataFormPanel
        item={biodataItem}
        onClose={() => setBiodataItem(null)}
      />

      {/* ── Arsip Panel ──────────────────────────────────────────── */}
      <ArsipPanel
        open={showArsip}
        onClose={() => setShowArsip(false)}
      />

      {/* ── Confirm Delete ───────────────────────────────────────── */}
      <ConfirmModal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Data Pendaftar"
        description={`Hapus "${deleteItem?.nama}" (${deleteItem?.noPendaftaran})? Data tidak bisa dikembalikan.`}
        confirmLabel="Hapus"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
