'use client'

import { useState, useMemo, useEffect } from 'react'
import { toast }                         from 'sonner'
import { Modal, Button, Select, Spinner } from '@/components/ui'
import { AlertTriangle, CheckCircle2, AlertCircle, Copy, ArrowRight } from 'lucide-react'
import { useTahunAjaranList }             from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran }       from '@/hooks/semester/useSemester'
import { useMataPelajaranList }           from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useBulkRolloverDokumen }         from '@/hooks/dokumen-pengajaran/useDokumenPengajaran'
import { checkTargetsDokumen }            from '@/lib/api/dokumen-pengajaran.api'
import type { CheckTargetsResponse, CheckTargetsTarget } from '@/types/dokumen-pengajaran.types'
import type { MataPelajaran }             from '@/types/akademik.types'

interface Props {
  open:    boolean
  onClose: () => void
  guruId?: string
}

function useMapelSection(guruId?: string) {
  const [taId,               setTaId]               = useState('')
  const [semId,              setSemId]              = useState('')
  const [filterMapelTingkatId, setFilterMapelTingkatId] = useState('')

  const { data: taListRaw } = useTahunAjaranList()
  const taList = (taListRaw as { id: string; nama: string }[] | undefined) ?? []

  const { data: semListRaw } = useSemesterByTahunAjaran(taId || null)
  const semList = (semListRaw as { id: string; nama: string }[] | undefined) ?? []

  const { data: mapelData, isFetching } = useMataPelajaranList(
    semId ? { semesterId: semId, ...(guruId ? { guruId } : {}), limit: 100 } : undefined,
    { enabled: !!semId },
  )
  const mapelList: MataPelajaran[] = (mapelData?.data ?? []) as MataPelajaran[]

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

  const filteredList = filterMapelTingkatId
    ? mapelList.filter((m) => m.mataPelajaranTingkat?.id === filterMapelTingkatId)
    : mapelList

  const reset = () => { setTaId(''); setSemId(''); setFilterMapelTingkatId('') }

  return {
    taId, setTaId, semId, setSemId, filterMapelTingkatId, setFilterMapelTingkatId,
    taList, semList, mapelTingkatOptions,
    mapelList,
    filteredList,
    isFetching, reset,
  }
}

// ── Status config ─────────────────────────────────────────────
const STATUS_CONFIG = {
  EMPTY:    { icon: CheckCircle2,  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', label: 'Siap disalin' },
  PARTIAL:  { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',         label: 'Sebagian ada' },
  COMPLETE: { icon: AlertCircle,   color: 'text-gray-500 dark:text-gray-400',       bg: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',               label: 'Sudah lengkap' },
}

function TargetCheckRow({ target }: { target: CheckTargetsTarget }) {
  const cfg  = STATUS_CONFIG[target.status]
  const Icon = cfg.icon
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${cfg.bg}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={`h-3.5 w-3.5 shrink-0 ${cfg.color}`} />
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
            {target.namaKelas}
          </span>
        </div>
        <span className={`text-[10px] font-medium shrink-0 ${cfg.color}`}>{cfg.label}</span>
      </div>

      {target.status === 'PARTIAL' && (
        <div className="mt-1.5 space-y-0.5 pl-5">
          {target.alreadyHas.length > 0 && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400">
              Sudah ada: {target.alreadyHas.join(', ')}
            </p>
          )}
          {target.missing.length > 0 && (
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
              Akan disalin: {target.missing.join(', ')}
            </p>
          )}
        </div>
      )}
      {target.status === 'COMPLETE' && (
        <p className="mt-1 text-[10px] text-gray-400 pl-5">Semua dokumen sudah ada di kelas ini</p>
      )}
      {target.status === 'EMPTY' && target.canCopy > 0 && (
        <p className="mt-1 text-[10px] text-emerald-500 pl-5">{target.canCopy} dokumen akan disalin</p>
      )}
    </div>
  )
}

// ── Fase 2: Panel hasil pemeriksaan ──────────────────────────
function CheckResultPanel({
  checkResult,
  selectedSumber,
  selectedTargets,
}: {
  checkResult:     CheckTargetsResponse
  selectedSumber:  MataPelajaran | undefined
  selectedTargets: MataPelajaran[]
}) {
  const sourceEmpty = checkResult.source.totalDocuments === 0

  return (
    <div className="space-y-4">

      {/* Ringkasan pilihan */}
      <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3">
        <span className="font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[140px]">
          {selectedSumber?.mataPelajaranTingkat?.masterMapel?.nama ?? '—'}
          {' '}·{' '}
          {selectedSumber?.kelas?.namaKelas ?? '—'}
        </span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <span className="truncate">
          {selectedTargets.map((m) => m.kelas?.namaKelas ?? '—').join(', ')}
        </span>
      </div>

      {/* Info sumber */}
      {sourceEmpty ? (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Sumber tidak memiliki dokumen
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              Pilih mata pelajaran sumber lain yang sudah memiliki dokumen
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              {checkResult.source.totalDocuments} dokumen tersedia di sumber
            </p>
            <p className="text-xs text-blue-500 mt-0.5 leading-relaxed">
              {checkResult.source.documentList.map((d) => d.judul).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Per-target */}
      {!sourceEmpty && checkResult.targets.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            Status Kelas Tujuan
          </p>
          <div className="space-y-1.5">
            {checkResult.targets.map((t) => (
              <TargetCheckRow key={t.mataPelajaranId} target={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Modal utama ───────────────────────────────────────────────
export function DokumenBulkRolloverModal({ open, onClose, guruId }: Props) {
  const sumber = useMapelSection(guruId)
  const tujuan = useMapelSection()

  const [sumberMapelId,  setSumberMapelId]  = useState('')
  const [tujuanMapelIds, setTujuanMapelIds] = useState<string[]>([])
  const [checkResult,    setCheckResult]    = useState<CheckTargetsResponse | null>(null)
  const [isChecking,     setIsChecking]     = useState(false)

  const mutation = useBulkRolloverDokumen()

  useEffect(() => {
    if (!open) {
      sumber.reset(); tujuan.reset()
      setSumberMapelId(''); setTujuanMapelIds([])
      setCheckResult(null)
    }
  // Intentional: sumber.reset, tujuan.reset, dan setter state adalah stable references.
  // Effect ini hanya perlu berjalan saat modal dibuka/ditutup.
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedSumber       = sumber.mapelList.find((m) => m.id === sumberMapelId)
  const sumberMapelTingkatId = selectedSumber?.mataPelajaranTingkatId ?? ''
  const selectedTargets      = tujuan.mapelList.filter((m) => tujuanMapelIds.includes(m.id))

  const tujuanListByMapelTingkat = tujuan.filteredList

  // Guard sumber berubah
  useEffect(() => {
    setCheckResult(null)
    if (!sumberMapelId) { setTujuanMapelIds([]); return }
    setTujuanMapelIds((prev) => {
      if (!prev.includes(sumberMapelId)) return prev
      toast.warning('Mata pelajaran sumber tidak bisa dijadikan tujuan')
      return prev.filter((id) => id !== sumberMapelId)
    })
  }, [sumberMapelId])

  const toggleTujuan = (id: string) => {
    setCheckResult(null)
    setTujuanMapelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const canCheck  = !!sumberMapelId && tujuanMapelIds.length > 0 && !isChecking
  const hasSource = (checkResult?.source.totalDocuments ?? 0) > 0
  const canSubmit = hasSource && checkResult !== null && !mutation.isPending

  const handleCheck = async () => {
    if (!canCheck) return
    setIsChecking(true)
    try {
      const result = await checkTargetsDokumen(sumberMapelId, tujuanMapelIds)
      setCheckResult(result)
      if (result.source.totalDocuments === 0) {
        toast.warning('Sumber tidak memiliki dokumen untuk disalin')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Gagal memeriksa dokumen'
      toast.error(msg)
    } finally {
      setIsChecking(false)
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      const res = await mutation.mutateAsync({
        sumberMataPelajaranId:  sumberMapelId,
        targetMataPelajaranIds: tujuanMapelIds,
      })
      toast.success(res.message ?? 'Dokumen berhasil disalin')
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Gagal menyalin dokumen'
      toast.error(msg)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Salin Dokumen Pengajaran"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          {checkResult ? (
            <>
              <Button variant="secondary" onClick={() => setCheckResult(null)}>
                Ubah Pilihan
              </Button>
              <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
                {mutation.isPending
                  ? <><Spinner />&nbsp;Menyalin...</>
                  : <><Copy className="h-3.5 w-3.5 mr-1.5" />Salin Dokumen</>
                }
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={handleCheck} disabled={!canCheck}>
              {isChecking ? <><Spinner />&nbsp;Memeriksa...</> : 'Periksa Dokumen'}
            </Button>
          )}
        </>
      }
    >
      <div className="p-6">

        {/* ── Fase 2: Hasil pemeriksaan (menggantikan form) ── */}
        {checkResult ? (
          <CheckResultPanel
            checkResult={checkResult}
            selectedSumber={selectedSumber}
            selectedTargets={selectedTargets}
          />
        ) : (

          /* ── Fase 1: Form pilihan ── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Sumber */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-2">
                Sumber
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Tahun Ajaran <span className="text-red-500">*</span>
                </label>
                <Select
                  options={[
                    { label: 'Pilih Tahun Ajaran', value: '' },
                    ...sumber.taList.map((t) => ({ label: t.nama, value: t.id })),
                  ]}
                  value={sumber.taId}
                  onChange={(e) => {
                    sumber.setTaId(e.target.value)
                    sumber.setSemId(''); sumber.setFilterMapelTingkatId('')
                    setSumberMapelId('')
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Semester <span className="text-red-500">*</span>
                </label>
                <Select
                  options={[
                    { label: 'Pilih Semester', value: '' },
                    ...sumber.semList.map((s) => ({ label: s.nama, value: s.id })),
                  ]}
                  value={sumber.semId}
                  onChange={(e) => {
                    sumber.setSemId(e.target.value)
                    sumber.setFilterMapelTingkatId(''); setSumberMapelId('')
                  }}
                  disabled={!sumber.taId}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Mata Pelajaran
                </label>
                <Select
                  options={[
                    { label: sumber.semId ? 'Semua Mata Pelajaran' : 'Pilih semester dulu', value: '' },
                    ...sumber.mapelTingkatOptions.map((t) => ({ label: t.label, value: t.value })),
                  ]}
                  value={sumber.filterMapelTingkatId}
                  onChange={(e) => { sumber.setFilterMapelTingkatId(e.target.value); setSumberMapelId('') }}
                  disabled={!sumber.semId}
                />
              </div>

              {sumber.semId && !sumber.filterMapelTingkatId && (
                <p className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-2.5 py-1.5">
                  Pilih mata pelajaran untuk menampilkan daftar kelas
                </p>
              )}

              {sumber.semId && sumber.filterMapelTingkatId && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Kelas <span className="text-red-500">*</span>
                  </label>
                  {sumber.isFetching ? (
                    <p className="text-xs text-gray-400 py-2">Memuat...</p>
                  ) : sumber.filteredList.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">Tidak ada data</p>
                  ) : (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {sumber.filteredList.map((m) => (
                        <label
                          key={m.id}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            sumberMapelId === m.id
                              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <input
                            type="radio"
                            name="sumberMapel"
                            value={m.id}
                            checked={sumberMapelId === m.id}
                            onChange={() => setSumberMapelId(m.id)}
                            className="accent-emerald-600"
                          />
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                            {m.kelas?.namaKelas ?? '—'}
                          </p>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tujuan */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-2">
                Tujuan
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Tahun Ajaran <span className="text-red-500">*</span>
                </label>
                <Select
                  options={[
                    { label: 'Pilih Tahun Ajaran', value: '' },
                    ...tujuan.taList.map((t) => ({ label: t.nama, value: t.id })),
                  ]}
                  value={tujuan.taId}
                  onChange={(e) => {
                    tujuan.setTaId(e.target.value)
                    tujuan.setSemId(''); tujuan.setFilterMapelTingkatId('')
                    setTujuanMapelIds([])
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Semester <span className="text-red-500">*</span>
                </label>
                <Select
                  options={[
                    { label: 'Pilih Semester', value: '' },
                    ...tujuan.semList.map((s) => ({ label: s.nama, value: s.id })),
                  ]}
                  value={tujuan.semId}
                  onChange={(e) => {
                    tujuan.setSemId(e.target.value)
                    tujuan.setFilterMapelTingkatId(''); setTujuanMapelIds([])
                  }}
                  disabled={!tujuan.taId}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Mata Pelajaran
                </label>
                <Select
                  options={[
                    { label: tujuan.semId ? 'Semua Mata Pelajaran' : 'Pilih semester dulu', value: '' },
                    ...tujuan.mapelTingkatOptions.map((t) => ({ label: t.label, value: t.value })),
                  ]}
                  value={tujuan.filterMapelTingkatId}
                  onChange={(e) => { tujuan.setFilterMapelTingkatId(e.target.value); setTujuanMapelIds([]) }}
                  disabled={!tujuan.semId}
                />
              </div>

              {tujuan.semId && !tujuan.filterMapelTingkatId && (
                <p className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-2.5 py-1.5">
                  Pilih mata pelajaran untuk menampilkan daftar kelas tujuan
                </p>
              )}

              {tujuan.semId && tujuan.filterMapelTingkatId && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Kelas Tujuan <span className="text-red-500">*</span>
                    </label>
                    {tujuanMapelIds.length > 0 && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        {tujuanMapelIds.length} dipilih
                      </span>
                    )}
                  </div>

                  {tujuan.isFetching ? (
                    <p className="text-xs text-gray-400 py-2">Memuat...</p>
                  ) : tujuanListByMapelTingkat.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">
                      Tidak ada kelas tersedia
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {tujuanListByMapelTingkat.map((m) => {
                        const isSelf = m.id === sumberMapelId
                        return (
                          <label
                            key={m.id}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors ${
                              isSelf
                                ? 'border-gray-200 dark:border-gray-700 opacity-40 cursor-not-allowed'
                                : tujuanMapelIds.includes(m.id)
                                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 cursor-pointer'
                                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
                            }`}
                          >
                            <input
                              type="checkbox"
                              value={m.id}
                              checked={tujuanMapelIds.includes(m.id)}
                              onChange={() => toggleTujuan(m.id)}
                              disabled={isSelf}
                              className="accent-emerald-600"
                            />
                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate flex-1">
                              {m.kelas?.namaKelas ?? '—'}
                            </p>
                            {isSelf && (
                              <span className="text-[10px] text-gray-400 shrink-0">sumber</span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </Modal>
  )
}
