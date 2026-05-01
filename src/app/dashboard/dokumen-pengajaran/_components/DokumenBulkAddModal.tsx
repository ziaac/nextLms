'use client'

import { useState, useMemo, useEffect } from 'react'
import { toast }                          from 'sonner'
import { Modal, Button, Select, Spinner } from '@/components/ui'
import { Combobox }                       from '@/components/ui/Combobox'
import { FileUpload }                     from '@/components/ui/FileUpload'
import { Plus, Trash2 }                   from 'lucide-react'
import { useTahunAjaranList, useTahunAjaranActive } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran }       from '@/hooks/semester/useSemester'
import { useMataPelajaranList }           from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useGuruList }                    from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useBulkAddDokumen }              from '@/hooks/dokumen-pengajaran/useDokumenPengajaran'
import { uploadApi }                      from '@/lib/api/upload.api'
import type { JenisDokumen }              from '@/types/enums'
import type { MataPelajaran }             from '@/types/akademik.types'

// ── Konstanta ─────────────────────────────────────────────────
const JENIS_OPTIONS: { label: string; value: JenisDokumen }[] = [
  { label: 'CP (Capaian Pembelajaran)', value: 'CP' },
  { label: 'ATP',                        value: 'ATP' },
  { label: 'Modul Ajar / RPP',           value: 'MODUL_AJAR_RPP' },
  { label: 'Modul Projek P5',            value: 'MODUL_PROJEK_P5' },
  { label: 'KKTP',                       value: 'KKTP' },
  { label: 'Rincian Minggu Efektif',     value: 'RINCIAN_MINGGU_EFEKTIF' },
  { label: 'Buku Pegangan',             value: 'BUKU_PEGANGAN' },
  { label: 'Lainnya',                    value: 'LAINNYA' },
]

// ── DocRow ─────────────────────────────────────────────────────
interface DocRow {
  _key:         string
  jenisDokumen: JenisDokumen | ''
  judul:        string
  fileUrl:      string
}

let _keySeq = 0
const newRow = (): DocRow => ({
  _key:         String(++_keySeq),
  jenisDokumen: '',
  judul:        '',
  fileUrl:      '',
})

// ── Hook: cascade filter + daftar mapel ───────────────────────
function useMapelFilter(guruId?: string, restrictToActive = false) {
  const [taId,               setTaId]               = useState('')
  const [semId,              setSemId]              = useState('')
  const [filterMapelTingkatId, setFilterMapelTingkatId] = useState('')

  // TA list — admin: semua; guru: hanya aktif
  const { data: taAllRaw }    = useTahunAjaranList()
  const { data: taActiveRaw = [] } = useTahunAjaranActive()

  const taList = (
    restrictToActive
      ? (taActiveRaw as { id: string; nama: string; isActive?: boolean }[])
      : ((taAllRaw as { id: string; nama: string }[] | undefined) ?? [])
  )

  // Auto-resolve TA untuk mode restricted
  const activeTA      = restrictToActive ? taList[0] ?? null : null
  const resolvedTaId  = restrictToActive ? (activeTA?.id ?? '') : taId

  const { data: semListRaw } = useSemesterByTahunAjaran(resolvedTaId || null)
  const allSemList = (semListRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? []

  // Semester — admin: semua; guru: hanya aktif
  const semList = restrictToActive
    ? allSemList.filter((s) => s.isActive)
    : allSemList

  // Auto-select semester jika hanya 1 yang aktif
  useEffect(() => {
    if (restrictToActive && semList.length === 1 && !semId) {
      setSemId(semList[0].id)
    }
  }, [restrictToActive, semList, semId])

  const { data: mapelData, isFetching } = useMataPelajaranList(
    semId ? { semesterId: semId, ...(guruId ? { guruId } : {}), limit: 100 } : undefined,
    { enabled: !!semId },
  )
  const mapelList: MataPelajaran[] = (mapelData?.data ?? []) as MataPelajaran[]

  // Derived: opsi "Mata Pelajaran" dari mataPelajaranTingkat — label "Fisika X", "Fisika XI"
  const mapelTingkatOptions = useMemo(() => {
    const map = new Map<string, string>()
    mapelList.forEach((m) => {
      const mpt  = m.mataPelajaranTingkat
      const id   = mpt?.id
      const nama = mpt?.masterMapel?.nama
      const tk   = (mpt as any)?.tingkatKelas?.nama
      if (id && nama) map.set(id, tk ? `${nama} ${tk}` : nama)
    })
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [mapelList])

  const filteredMapel = filterMapelTingkatId
    ? mapelList.filter((m) => m.mataPelajaranTingkat?.id === filterMapelTingkatId)
    : mapelList

  const reset = () => { setTaId(''); setSemId(''); setFilterMapelTingkatId('') }

  return {
    taId, setTaId, semId, setSemId, filterMapelTingkatId, setFilterMapelTingkatId,
    taList, activeTA, semList, mapelTingkatOptions, filteredMapel, isFetching,
    resolvedTaId, reset,
  }
}

// ── Props ─────────────────────────────────────────────────────
interface Props {
  open:     boolean
  onClose:  () => void
  isAdmin?: boolean
  guruId?:  string   // guru yang sedang login (non-admin)
}

// ── Modal utama ───────────────────────────────────────────────
export function DokumenBulkAddModal({ open, onClose, isAdmin, guruId }: Props) {

  // Guru search (admin only)
  const [adminGuruId, setAdminGuruId] = useState('')
  const { data: guruRaw } = useGuruList()
  const guruList = guruRaw ?? []
  const guruOptions = useMemo(() =>
    guruList.map((g) => ({
      value: g.id,
      label: g.profile?.namaLengkap ?? g.username ?? g.id,
    })),
  [guruList])

  // Effective guruId untuk query mapel
  const effectiveGuruId = isAdmin ? (adminGuruId || undefined) : guruId

  const filter = useMapelFilter(effectiveGuruId, !isAdmin)
  const [targetIds, setTargetIds] = useState<string[]>([])
  const [docs,      setDocs]      = useState<DocRow[]>([newRow()])

  const mutation = useBulkAddDokumen()

  // Reset saat modal ditutup
  useEffect(() => {
    if (!open) {
      setAdminGuruId('')
      filter.reset()
      setTargetIds([])
      setDocs([newRow()])
    }
  // Intentional: filter.reset, setAdminGuruId, setTargetIds, setDocs, newRow adalah
  // stable references. Menambahkannya ke deps tidak diperlukan dan bisa menyebabkan
  // re-render yang tidak perlu.
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset mapel & targets saat guru berubah (admin)
  useEffect(() => {
    filter.setSemId('')
    filter.setFilterMapelTingkatId('')
    setTargetIds([])
  // Intentional: filter.setSemId, filter.setFilterMapelTingkatId, setTargetIds adalah
  // stable references. Effect ini hanya perlu berjalan saat adminGuruId berubah.
  }, [adminGuruId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Jenis yang sudah dipakai (untuk filter antar-row) ────────
  const usedJenis = useMemo(
    () => docs.map((d) => d.jenisDokumen).filter(Boolean) as JenisDokumen[],
    [docs],
  )

  // ── Operasi row ───────────────────────────────────────────────
  const updateDoc = (key: string, field: keyof DocRow, value: string) =>
    setDocs((prev) => prev.map((d) => d._key === key ? { ...d, [field]: value } : d))

  const addRow = () => {
    if (docs.length >= JENIS_OPTIONS.length) return
    setDocs((prev) => [...prev, newRow()])
  }

  const removeRow = (key: string) => {
    if (docs.length <= 1) return
    setDocs((prev) => prev.filter((d) => d._key !== key))
  }

  const toggleTarget = (id: string) =>
    setTargetIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  // ── Validasi ──────────────────────────────────────────────────
  const canSubmit =
    (!isAdmin || !!adminGuruId) &&
    targetIds.length > 0 &&
    docs.length > 0 &&
    docs.every((d) => d.jenisDokumen && d.judul.trim() && d.fileUrl) &&
    !mutation.isPending

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      const res = await mutation.mutateAsync({
        ...(isAdmin && adminGuruId ? { guruId: adminGuruId } : {}),
        documents: docs.map((d) => ({
          judul:        d.judul.trim(),
          jenisDokumen: d.jenisDokumen as JenisDokumen,
          fileUrl:      d.fileUrl,
        })),
        targetMataPelajaranIds: targetIds,
      })
      toast.success(res.message ?? `${res.totalDibuat} dokumen berhasil ditambahkan`)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Gagal menambahkan dokumen'
      toast.error(msg)
    }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Unggah Massal"
      description="Tambahkan beberapa tipe dokumen ke satu atau lebih kelas sekaligus"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button
            leftIcon={<Plus size={14} />}
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={mutation.isPending}
          >
            Simpan Dokumen
          </Button>
        </>
      }
    >
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ── Kiri: Filter target kelas ──────────────────────── */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-2">
              Target Kelas
            </h3>

            {/* Guru — admin only */}
            {isAdmin && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Guru <span className="text-red-500">*</span>
                </label>
                <Combobox
                  options={guruOptions}
                  value={adminGuruId}
                  onChange={setAdminGuruId}
                  searchOnly
                  minSearchLength={0}
                  placeholder="Cari nama guru..."
                />
              </div>
            )}

            {/* Tahun Ajaran */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Tahun Ajaran <span className="text-red-500">*</span>
              </label>
              {!isAdmin ? (
                // Guru: dikunci ke TA aktif — tampilkan sebagai label
                <div className="h-9 px-3 flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
                  {filter.activeTA?.nama ?? 'Memuat...'}
                  <span className="ml-auto text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full font-medium">Aktif</span>
                </div>
              ) : (
                <Select
                  options={[
                    { label: 'Pilih Tahun Ajaran', value: '' },
                    ...filter.taList.map((t) => ({ label: t.nama, value: t.id })),
                  ]}
                  value={filter.taId}
                  onChange={(e) => {
                    filter.setTaId(e.target.value)
                    filter.setSemId(''); filter.setFilterMapelTingkatId(''); setTargetIds([])
                  }}
                  disabled={isAdmin && !adminGuruId}
                />
              )}
            </div>

            {/* Semester */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Semester <span className="text-red-500">*</span>
              </label>
              {!isAdmin && filter.semList.length === 1 ? (
                // Guru: 1 semester aktif — kunci otomatis
                <div className="h-9 px-3 flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
                  {filter.semList[0].nama}
                  <span className="ml-auto text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full font-medium">Aktif</span>
                </div>
              ) : (
                <Select
                  options={[
                    { label: 'Pilih Semester', value: '' },
                    ...filter.semList.map((s) => ({ label: s.nama + (s.isActive ? ' (Aktif)' : ''), value: s.id })),
                  ]}
                  value={filter.semId}
                  onChange={(e) => {
                    filter.setSemId(e.target.value)
                    filter.setFilterMapelTingkatId(''); setTargetIds([])
                  }}
                  disabled={!filter.resolvedTaId}
                />
              )}
            </div>

            {/* Mata Pelajaran */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Mata Pelajaran
              </label>
              <Select
                options={[
                  { label: filter.semId ? 'Semua Mata Pelajaran' : 'Pilih semester dulu', value: '' },
                  ...filter.mapelTingkatOptions.map((t) => ({ label: t.label, value: t.value })),
                ]}
                value={filter.filterMapelTingkatId}
                onChange={(e) => { filter.setFilterMapelTingkatId(e.target.value); setTargetIds([]) }}
                disabled={!filter.semId}
              />
            </div>

            {/* Daftar kelas (checkbox) */}
            {filter.semId && !filter.filterMapelTingkatId && (
              <p className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-2.5 py-1.5">
                Pilih mata pelajaran untuk menampilkan daftar kelas
              </p>
            )}

            {filter.semId && filter.filterMapelTingkatId && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Kelas Tujuan <span className="text-red-500">*</span>
                  </label>
                  {targetIds.length > 0 && (
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      {targetIds.length} dipilih
                    </span>
                  )}
                </div>

                {filter.isFetching ? (
                  <div className="flex items-center gap-2 py-2 text-xs text-gray-400">
                    <Spinner />Memuat...
                  </div>
                ) : filter.filteredMapel.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2 italic">Tidak ada mata pelajaran tersedia</p>
                ) : (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {filter.filteredMapel.map((m) => (
                      <label
                        key={m.id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          targetIds.includes(m.id)
                            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={targetIds.includes(m.id)}
                          onChange={() => toggleTarget(m.id)}
                          className="accent-emerald-600 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                            {m.kelas?.namaKelas ?? '—'}
                          </p>
                          {!filter.filterMapelTingkatId && (
                            <p className="text-[10px] text-gray-400 truncate">
                              {m.mataPelajaranTingkat?.masterMapel?.nama ?? ''}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Kanan: Daftar dokumen ──────────────────────────── */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-2">
              Dokumen <span className="normal-case font-normal text-gray-400">({docs.length})</span>
            </h3>

            <div className="space-y-3">
              {docs.map((doc, idx) => (
                <DocRowCard
                  key={doc._key}
                  doc={doc}
                  index={idx}
                  usedJenis={usedJenis}
                  canRemove={docs.length > 1}
                  onUpdate={(field, value) => updateDoc(doc._key, field, value)}
                  onRemove={() => removeRow(doc._key)}
                />
              ))}
            </div>

            {docs.length < JENIS_OPTIONS.length && (
              <button
                type="button"
                onClick={addRow}
                className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-xs text-gray-400 hover:border-emerald-400 hover:text-emerald-500 dark:hover:border-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <Plus size={13} />
                Tambah Dokumen
              </button>
            )}
          </div>

        </div>
      </div>
    </Modal>
  )
}

// ── Kartu satu dokumen ────────────────────────────────────────
function DocRowCard({
  doc, index, usedJenis, canRemove, onUpdate, onRemove,
}: {
  doc:       DocRow
  index:     number
  usedJenis: JenisDokumen[]
  canRemove: boolean
  onUpdate:  (field: keyof DocRow, value: string) => void
  onRemove:  () => void
}) {
  // Tampilkan jenis yang belum dipakai oleh row lain + jenis milik row ini sendiri
  const availableJenis = JENIS_OPTIONS.filter(
    (o) => !usedJenis.includes(o.value) || o.value === doc.jenisDokumen,
  )

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2.5">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
          Dokumen {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="h-6 w-6 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Jenis Dokumen */}
      <Select
        options={[
          { label: 'Pilih Jenis Dokumen', value: '' },
          ...availableJenis,
        ]}
        value={doc.jenisDokumen}
        onChange={(e) => onUpdate('jenisDokumen', e.target.value)}
      />

      {/* Judul */}
      <input
        type="text"
        value={doc.judul}
        onChange={(e) => onUpdate('judul', e.target.value)}
        placeholder="Judul dokumen..."
        className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />

      {/* File upload */}
      <FileUpload
        label=""
        hint="PDF, Word, PowerPoint, Excel · maks. 20 MB"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
        onUpload={uploadApi.dokumenPengajaran}
        onSuccess={(url) => onUpdate('fileUrl', url)}
        currentKey={doc.fileUrl || null}
        previewLabel="Dokumen"
      />
    </div>
  )
}
