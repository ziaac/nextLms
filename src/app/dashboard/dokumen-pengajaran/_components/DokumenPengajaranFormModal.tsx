'use client'

import { useState, useEffect, useMemo }  from 'react'
import { toast }                from 'sonner'
import { Modal, Button, Select, Spinner } from '@/components/ui'
import { Combobox }             from '@/components/ui/Combobox'
import { FileUpload }           from '@/components/ui/FileUpload'
import { useCreateDokumenPengajaran, useUpdateDokumenPengajaran } from '@/hooks/dokumen-pengajaran/useDokumenPengajaran'
import { useTahunAjaranList, useTahunAjaranOneActive } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran, useSemesterActive } from '@/hooks/semester/useSemester'
import { useMataPelajaranList } from '@/hooks/mata-pelajaran/useMataPelajaran'
import { uploadApi }            from '@/lib/api/upload.api'
import type { JenisDokumen }    from '@/types/enums'
import type { DokumenPengajaranItem } from '@/types/dokumen-pengajaran.types'

const JENIS_OPTIONS = [
  { label: 'Pilih Jenis Dokumen',        value: '' },
  { label: 'CP (Capaian Pembelajaran)',  value: 'CP' },
  { label: 'ATP',                         value: 'ATP' },
  { label: 'Modul Ajar / RPP',            value: 'MODUL_AJAR_RPP' },
  { label: 'Modul Projek P5',             value: 'MODUL_PROJEK_P5' },
  { label: 'KKTP',                        value: 'KKTP' },
  { label: 'Rincian Minggu Efektif',      value: 'RINCIAN_MINGGU_EFEKTIF' },
  { label: 'Buku Pegangan',               value: 'BUKU_PEGANGAN' },
  { label: 'Lainnya',                     value: 'LAINNYA' },
]

interface Props {
  open:       boolean
  onClose:    () => void
  guruId?:    string
  editItem?:  DokumenPengajaranItem | null
}

export function DokumenPengajaranFormModal({ open, onClose, guruId, editItem }: Props) {
  const isEditMode = !!editItem
  const [taId,                 setTaId]                 = useState('')
  const [semId,                setSemId]                = useState('')
  const [filterMapelTingkatId, setFilterMapelTingkatId] = useState('')
  const [mapelIds,             setMapelIds]             = useState<string[]>([])   // create: multi
  const [mapelId,              setMapelId]              = useState('')              // edit: single
  const [jenisDokumen,         setJenisDokumen]         = useState<JenisDokumen | ''>('')
  const [judul,                setJudul]                = useState('')
  const [fileUrl,              setFileUrl]              = useState('')

  const { data: taListRaw }  = useTahunAjaranList()
  const taList = (taListRaw as { id: string; nama: string }[] | undefined) ?? []

  const { data: taAktif }     = useTahunAjaranOneActive()
  const { data: semAktifRaw } = useSemesterActive()

  // Guru: TA+Semester di-lock ke aktif. Admin (guruId undefined): bebas pilih
  const taId_locked = !!guruId

  // Auto-set TA + Semester aktif urutan tertinggi hanya untuk guru
  useEffect(() => {
    if (!open || !guruId) return
    const activeTA = (taAktif as any)?.id
    if (activeTA) {
      setTaId(activeTA)
      const semAktifList = (semAktifRaw as any[]) ?? []
      const highest = semAktifList
        .filter((s: any) => s.tahunAjaranId === activeTA && s.isActive)
        .sort((a: any, b: any) => b.urutan - a.urutan)[0]
      if (highest) setSemId(highest.id)
    }
  }, [open, taAktif, semAktifRaw, guruId])

  const { data: semListRaw } = useSemesterByTahunAjaran(taId || null)
  const semList = (semListRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? []

  const { data: mapelData } = useMataPelajaranList(
    semId ? { semesterId: semId, ...(guruId ? { guruId } : {}), limit: 100 } : undefined,
    { enabled: !!semId },
  )
  const mapelList = mapelData?.data ?? []

  // Derive unique mataPelajaranTingkat dari mapelList yang sudah ter-fetch
  const mapelTingkatOptions = useMemo(() => {
    const seen = new Set<string>()
    const opts: { value: string; label: string }[] = []
    for (const m of mapelList) {
      const id = m.mataPelajaranTingkat?.id
      if (id && !seen.has(id)) {
        seen.add(id)
        const tingkat = (m.mataPelajaranTingkat as any).tingkatKelas?.nama
        const nama    = m.mataPelajaranTingkat.masterMapel.nama
        opts.push({ value: id, label: tingkat ? `${nama} ${tingkat}` : nama })
      }
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label))
  }, [mapelList])

  // Filter mapelList berdasarkan mataPelajaranTingkat yang dipilih
  const filteredMapelList = filterMapelTingkatId
    ? mapelList.filter((m) => m.mataPelajaranTingkat?.id === filterMapelTingkatId)
    : mapelList

  const mapelOptions = filteredMapelList.map((m) => ({
    value: m.id,
    label: `${m.mataPelajaranTingkat.masterMapel.nama} · ${m.kelas.namaKelas}`,
    hint:  m.mataPelajaranTingkat.masterMapel.kode ?? undefined,
  }))

  const createMutation = useCreateDokumenPengajaran()
  const updateMutation = useUpdateDokumenPengajaran()
  const mutation       = isEditMode ? updateMutation : createMutation

  // Pre-fill fields saat mode edit
  useEffect(() => {
    if (open && editItem) {
      setTaId(editItem.tahunAjaranId ?? editItem.tahunAjaran?.id ?? '')
      setSemId(editItem.semesterId   ?? editItem.semester?.id   ?? '')
      setMapelId(editItem.mataPelajaran?.id ?? '')
      setJenisDokumen(editItem.jenisDokumen ?? '')
      setJudul(editItem.judul ?? '')
      setFileUrl(editItem.fileUrl ?? '')
    }
  }, [open, editItem])

  useEffect(() => {
    if (!open) {
      setTaId(''); setSemId(''); setFilterMapelTingkatId('')
      setMapelIds([]); setMapelId('')
      setJenisDokumen(''); setJudul(''); setFileUrl('')
    }
  }, [open])

  // Reset pilihan kelas saat filter rumpun berubah (create mode)
  const handleFilterTingkatChange = (v: string) => {
    setFilterMapelTingkatId(v)
    setMapelIds([])
    setMapelId('')
  }

  const toggleMapelId = (id: string) => {
    setMapelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const canSubmit = isEditMode
    ? !!taId && !!semId && !!mapelId  && !!jenisDokumen && judul.trim().length > 0 && !!fileUrl
    : !!taId && !!semId && mapelIds.length > 0 && !!jenisDokumen && judul.trim().length > 0 && !!fileUrl

  const handleSubmit = async () => {
    if (!canSubmit) return
    const base = {
      tahunAjaranId: taId,
      semesterId:    semId,
      jenisDokumen:  jenisDokumen as JenisDokumen,
      judul:         judul.trim(),
      fileUrl,
    }
    try {
      if (isEditMode && editItem) {
        await updateMutation.mutateAsync({ id: editItem.id, payload: { ...base, mataPelajaranId: mapelId } })
        toast.success('Dokumen berhasil diperbarui')
      } else {
        let ok = 0
        for (const id of mapelIds) {
          try {
            await createMutation.mutateAsync({ ...base, mataPelajaranId: id })
            ok++
          } catch { /* lanjut ke kelas berikutnya */ }
        }
        toast.success(ok === mapelIds.length
          ? `${ok} dokumen berhasil diajukan`
          : `${ok} dari ${mapelIds.length} dokumen berhasil diajukan`
        )
      }
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? (isEditMode ? 'Gagal memperbarui dokumen' : 'Gagal mengajukan dokumen')
      toast.error(msg)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditMode ? 'Edit Dokumen Pengajaran' : 'Unggah Dokumen Pengajaran'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit || mutation.isPending}
          >
            {mutation.isPending
              ? <><Spinner />&nbsp;Menyimpan...</>
              : isEditMode
                ? 'Simpan Perubahan'
                : mapelIds.length > 1
                  ? `Ajukan ke ${mapelIds.length} Kelas`
                  : 'Ajukan'
            }
          </Button>
        </>
      }
    >
      <div className="p-6 space-y-4">

        {/* Tahun Ajaran & Semester */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Tahun Ajaran <span className="text-red-500">*</span>
            </label>
            {taId_locked ? (
              // Guru: dikunci ke TA aktif
              <div className="h-9 px-3 flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
                {taId ? (taList.find((t) => t.id === taId)?.nama ?? 'Memuat...') : 'Memuat...'}
                <span className="ml-auto text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full font-medium">Aktif</span>
              </div>
            ) : (
              <Select
                options={[
                  { label: 'Pilih Tahun Ajaran', value: '' },
                  ...taList.map((t) => ({ label: t.nama, value: t.id })),
                ]}
                value={taId}
                onChange={(e) => { setTaId(e.target.value); setSemId(''); setMapelId('') }}
              />
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Semester <span className="text-red-500">*</span>
            </label>
            {(() => {
              const activeSemList = semList.filter((s) => s.isActive)
              if (taId_locked && activeSemList.length === 1) {
                // Guru: 1 semester aktif — kunci otomatis
                return (
                  <div className="h-9 px-3 flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
                    {activeSemList[0].nama}
                    <span className="ml-auto text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full font-medium">Aktif</span>
                  </div>
                )
              }
              // Admin atau 2+ semester aktif: select bersih
              const opts = taId_locked ? activeSemList : semList
              return (
                <Select
                  options={[
                    { label: 'Pilih Semester', value: '' },
                    ...opts.map((s) => ({
                      label: s.nama + (s.isActive ? ' (Aktif)' : ''),
                      value: s.id,
                    })),
                  ]}
                  value={semId}
                  onChange={(e) => { setSemId(e.target.value); setMapelId('') }}
                  disabled={!taId}
                />
              )
            })()}
          </div>
        </div>


        {/* Filter Mata Pelajaran */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Mata Pelajaran
          </label>
          <Select
            options={[
              { label: mapelTingkatOptions.length === 0 ? 'Pilih semester dulu' : 'Semua Mata Pelajaran', value: '' },
              ...mapelTingkatOptions,
            ]}
            value={filterMapelTingkatId}
            onChange={(e) => handleFilterTingkatChange(e.target.value)}
            disabled={!semId || mapelTingkatOptions.length === 0}
          />
        </div>

        {/* Kelas */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Kelas <span className="text-red-500">*</span>
            </label>
            {!isEditMode && mapelIds.length > 0 && (
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                {mapelIds.length} kelas dipilih
              </span>
            )}
          </div>

          {isEditMode ? (
            <Combobox
              options={mapelOptions}
              value={mapelId}
              onChange={setMapelId}
              searchOnly
              minSearchLength={0}
              placeholder={!semId ? 'Pilih semester terlebih dahulu' : 'Pilih kelas...'}
              disabled={!semId}
            />
          ) : (
            <div className={`rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden ${!semId ? 'opacity-50 pointer-events-none' : ''}`}>
              {filteredMapelList.length === 0 ? (
                <p className="text-xs text-gray-400 px-3 py-3 text-center">
                  {!semId ? 'Pilih semester terlebih dahulu' : 'Tidak ada kelas tersedia'}
                </p>
              ) : (
                <div className="max-h-44 overflow-y-auto">
                  {filteredMapelList.map((m) => {
                    const checked = mapelIds.includes(m.id)
                    return (
                      <label
                        key={m.id}
                        className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
                          checked
                            ? 'bg-emerald-50 dark:bg-emerald-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMapelId(m.id)}
                          className="accent-emerald-600 shrink-0"
                        />
                        <span className="text-sm text-gray-800 dark:text-gray-200 truncate">
                          {m.kelas.namaKelas}
                        </span>
                        {!filterMapelTingkatId && (
                          <span className="text-xs text-gray-400 ml-auto shrink-0">
                            {m.mataPelajaranTingkat.masterMapel.nama}
                          </span>
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Jenis Dokumen */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Jenis Dokumen <span className="text-red-500">*</span>
          </label>
          <Select
            options={JENIS_OPTIONS}
            value={jenisDokumen}
            onChange={(e) => setJenisDokumen(e.target.value as JenisDokumen | '')}
          />
        </div>

        {/* Judul */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Judul Dokumen <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Contoh: Modul Ajar Bab 1 - Algoritma Pemrograman"
            className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* File Upload */}
        <FileUpload
          label="File Dokumen *"
          hint="PDF, Word, PowerPoint, Excel (maks. 20 MB)"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
          onUpload={uploadApi.dokumenPengajaran}
          onSuccess={setFileUrl}
          currentKey={fileUrl || null}
          previewLabel="Dokumen Pengajaran"
        />

      </div>
    </Modal>
  )
}
