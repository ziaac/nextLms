'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Search, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useSemesterOptions } from '@/hooks/semester/useSemester'
import { useMasterSikapList, useCreateCatatanSikap, useUpdateCatatanSikap } from '@/hooks/sikap/useSikap'
import { usersApi } from '@/lib/api/users.api'
import { useDebounce } from '@/hooks/useDebounce'
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox'
import type { CatatanSikapItem, JenisSikap } from '@/types/sikap.types'
import { toast } from 'sonner'
import { format } from 'date-fns'

// ── Helpers ───────────────────────────────────────────────────────────────────

const nowHHMM  = () => format(new Date(), 'HH:mm')
const todayISO = () => format(new Date(), 'yyyy-MM-dd')

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open:       boolean
  onClose:    () => void
  editItem?:  CatatanSikapItem | null   // jika ada → mode edit
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SikapFormModal({ open, onClose, editItem }: Props) {
  const isEdit = !!editItem

  // ── Form state ────────────────────────────────────────────────
  const [siswaId,       setSiswaId]       = useState('')
  const [siswaLabel,    setSiswaLabel]    = useState('')
  const [semesterId,    setSemesterId]    = useState('')
  const [masterSikapId, setMasterSikapId] = useState('')
  const [tanggal,       setTanggal]       = useState(todayISO())
  const [waktu,         setWaktu]         = useState(nowHHMM())
  const [lokasi,        setLokasi]        = useState('')
  const [kronologi,     setKronologi]     = useState('')
  const [tindakLanjut,  setTindakLanjut]  = useState('')

  // Siswa search state
  const [siswaSearch,   setSiswaSearch]   = useState('')
  const [siswaDropOpen, setSiswaDropOpen] = useState(false)
  const debouncedSearch = useDebounce(siswaSearch, 300)

  // Master sikap jenis filter
  const [jenisFilter, setJenisFilter] = useState<JenisSikap | ''>('')

  // ── Remote data ───────────────────────────────────────────────
  const { options: semOptions, activeSem } = useSemesterOptions()

  const { data: masterData } = useMasterSikapList(jenisFilter ? { jenis: jenisFilter } : undefined)
  const masterList = masterData?.data ?? []

  const { data: siswaPage } = useQuery({
    queryKey: ['users', 'siswa-search', debouncedSearch],
    queryFn:  () => usersApi.getAll({ role: 'SISWA', search: debouncedSearch, limit: 20 }),
    staleTime: 30_000,
    enabled:  siswaDropOpen || debouncedSearch.length > 0,
  })
  const siswaList = siswaPage?.data ?? []

  // ── Master sikap options (grouped) ────────────────────────────
  const masterOptions = useMemo<ComboboxOption[]>(() =>
    masterList.map((m) => ({
      value: m.id,
      label: `[${m.kode}] ${m.nama} (${m.jenis === 'POSITIF' ? '+' : '-'}${Math.abs(m.point)})`,
      group: jenisFilter === '' ? (m.jenis === 'POSITIF' ? 'Positif' : 'Negatif') : undefined,
    })),
    [masterList, jenisFilter],
  )

  // ── Prefill saat edit ─────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    if (editItem) {
      setSiswaId(editItem.siswaId)
      setSiswaLabel(editItem.siswa?.profile?.namaLengkap ?? editItem.siswaId)
      setSemesterId(editItem.semesterId ?? activeSem?.id ?? '')
      setMasterSikapId(editItem.masterSikapId)
      setTanggal(editItem.tanggal.slice(0, 10))
      setWaktu(new Date(editItem.waktu).toISOString().slice(11, 16))
      setLokasi(editItem.lokasi ?? '')
      setKronologi(editItem.kronologi ?? '')
      setTindakLanjut(editItem.tindakLanjut ?? '')
    } else {
      setSiswaId('')
      setSiswaLabel('')
      setSemesterId(activeSem?.id ?? '')
      setMasterSikapId('')
      setTanggal(todayISO())
      setWaktu(nowHHMM())
      setLokasi('')
      setKronologi('')
      setTindakLanjut('')
      setSiswaSearch('')
    }
  }, [open, editItem, activeSem?.id])

  // ── Mutations ─────────────────────────────────────────────────
  const createMut = useCreateCatatanSikap()
  const updateMut = useUpdateCatatanSikap()
  const isSaving  = createMut.isPending || updateMut.isPending

  const canSubmit = siswaId && semesterId && masterSikapId && tanggal && waktu

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const payload = {
      siswaId, semesterId, masterSikapId,
      tanggal, waktu,
      ...(lokasi       ? { lokasi }       : {}),
      ...(kronologi    ? { kronologi }    : {}),
      ...(tindakLanjut ? { tindakLanjut } : {}),
    }
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: editItem!.id, payload })
        toast.success('Catatan sikap berhasil diperbarui')
      } else {
        await createMut.mutateAsync(payload)
        toast.success('Catatan sikap berhasil ditambahkan')
      }
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Gagal menyimpan catatan')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {isEdit ? 'Edit Catatan Sikap' : 'Tambah Catatan Sikap'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* ── Siswa ──────────────────────────────────────── */}
          {!isEdit && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Siswa <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all">
                  <Search size={14} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Cari nama siswa..."
                    value={siswaLabel || siswaSearch}
                    onChange={(e) => {
                      setSiswaSearch(e.target.value)
                      setSiswaLabel('')
                      setSiswaId('')
                      setSiswaDropOpen(true)
                    }}
                    onFocus={() => setSiswaDropOpen(true)}
                    className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
                  />
                  {siswaId && (
                    <button
                      type="button"
                      onClick={() => { setSiswaId(''); setSiswaLabel(''); setSiswaSearch('') }}
                      className="text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Dropdown */}
                {siswaDropOpen && !siswaId && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {siswaList.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-gray-400">
                        {debouncedSearch ? 'Tidak ditemukan' : 'Ketik untuk cari siswa...'}
                      </p>
                    ) : (
                      siswaList.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSiswaId(s.id)
                            setSiswaLabel(s.profile?.namaLengkap ?? s.username)
                            setSiswaSearch('')
                            setSiswaDropOpen(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <p className="font-medium text-gray-800 dark:text-gray-200">
                            {s.profile?.namaLengkap ?? s.username}
                          </p>
                          <p className="text-xs text-gray-400">{s.profile?.nisn ?? s.username}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Semester ──────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Semester <span className="text-red-500">*</span>
            </label>
            <Combobox
              options={semOptions}
              value={semesterId}
              onChange={setSemesterId}
              placeholder="Pilih semester..."
            />
          </div>

          {/* ── Kategori Sikap ─────────────────────────────── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Kategori Sikap <span className="text-red-500">*</span>
              </label>
              {/* Jenis filter pills */}
              <div className="flex gap-1">
                {(['', 'POSITIF', 'NEGATIF'] as const).map((j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => { setJenisFilter(j); setMasterSikapId('') }}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors',
                      jenisFilter === j
                        ? j === 'POSITIF'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                          : j === 'NEGATIF'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700',
                    )}
                  >
                    {j === '' ? 'Semua' : j === 'POSITIF' ? 'Positif' : 'Negatif'}
                  </button>
                ))}
              </div>
            </div>
            <Combobox
              options={masterOptions}
              value={masterSikapId}
              onChange={setMasterSikapId}
              placeholder="Pilih kategori..."
              searchable
              searchPlaceholder="Cari kategori sikap..."
              minSearchLength={1}
            />
          </div>

          {/* ── Tanggal & Waktu ────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Waktu <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={waktu}
                onChange={(e) => setWaktu(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* ── Lokasi ──────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Lokasi</label>
            <input
              type="text"
              placeholder="Mis. Ruang kelas, kantin, lapangan..."
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* ── Kronologi ───────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Kronologi / Keterangan</label>
            <textarea
              placeholder="Uraikan kejadian secara singkat..."
              value={kronologi}
              onChange={(e) => setKronologi(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* ── Tindak Lanjut ───────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Tindak Lanjut</label>
            <textarea
              placeholder="Tindakan yang sudah/akan diambil..."
              value={tindakLanjut}
              onChange={(e) => setTindakLanjut(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!canSubmit || isSaving}
            onClick={handleSubmit}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              canSubmit && !isSaving
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed',
            )}
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Simpan Perubahan' : 'Tambah Catatan'}
          </button>
        </div>
      </div>
    </div>
  )
}
