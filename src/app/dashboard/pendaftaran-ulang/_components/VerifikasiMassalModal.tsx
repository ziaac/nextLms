'use client'

import { useState, useEffect, useMemo } from 'react'
import { CheckCircle, ShieldCheck, Info, Loader2 } from 'lucide-react'
import { Modal, Button, Select } from '@/components/ui'
import { useSiswaLulus, useBulkVerifikasiBiodata } from '@/hooks/pendaftaran/usePendaftaran'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import type { SiswaLulus } from '@/types/pendaftaran.types'
import type { TahunAjaran } from '@/types/tahun-ajaran.types'

interface Props {
  open: boolean
  onClose: () => void
  defaultTahunAjaranId: string
}

type Step = 'select' | 'confirm' | 'done'

export function VerifikasiMassalModal({ open, onClose, defaultTahunAjaranId }: Props) {
  const [step,         setStep]         = useState<Step>('select')
  const [tahunId,      setTahunId]      = useState(defaultTahunAjaranId)
  const [selected,     setSelected]     = useState<Set<string>>(new Set())   // biodata IDs
  const [doneCount,    setDoneCount]    = useState(0)

  const { data: tahunList }              = useTahunAjaranList()
  const bulk                             = useBulkVerifikasiBiodata()

  // Load semua siswa untuk tahun ini — filter DIAJUKAN di client
  const { data, isLoading } = useSiswaLulus({
    tahunAjaranId: tahunId || undefined,
    limit: 1000,
  })

  // Hanya yang sudah submit biodata (DIAJUKAN) — belum diverifikasi
  const eligible = useMemo(
    () => (data?.data ?? []).filter((s: SiswaLulus) => s.biodata?.status === 'DIAJUKAN'),
    [data],
  )

  const allBiodataIds = useMemo(() => eligible.map((s) => s.biodata!.id), [eligible])

  // Reset tiap buka
  useEffect(() => {
    if (open) {
      setStep('select')
      setTahunId(defaultTahunAjaranId)
      setDoneCount(0)
    }
  }, [open, defaultTahunAjaranId])

  // Auto-select all ketika data baru di-load
  useEffect(() => {
    setSelected(new Set(allBiodataIds))
  }, [allBiodataIds])

  const isAllSelected = selected.size === eligible.length && eligible.length > 0

  const toggleAll = () => {
    if (isAllSelected) setSelected(new Set())
    else setSelected(new Set(allBiodataIds))
  }

  const toggleOne = (biodataId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(biodataId)) next.delete(biodataId)
      else next.add(biodataId)
      return next
    })
  }

  const handleVerifikasi = async () => {
    const ids = Array.from(selected)
    const res = await bulk.mutateAsync(ids)
    setDoneCount(res.updated)
    setStep('done')
  }

  const tahunOptions = (tahunList ?? []).map((t: TahunAjaran) => ({ value: t.id, label: t.nama }))
  const selectedItems = eligible.filter((s) => selected.has(s.biodata!.id))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Verifikasi Massal Biodata"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {step === 'done' ? 'Tutup' : 'Batal'}
          </Button>

          {step === 'select' && (
            <Button
              onClick={() => setStep('confirm')}
              disabled={selected.size === 0}
              leftIcon={<ShieldCheck size={13} />}
            >
              Lanjut · {selected.size} biodata
            </Button>
          )}

          {step === 'confirm' && (
            <>
              <Button variant="secondary" onClick={() => setStep('select')}>Kembali</Button>
              <Button
                onClick={handleVerifikasi}
                loading={bulk.isPending}
                leftIcon={<ShieldCheck size={13} />}
              >
                Terima {selected.size} Biodata
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="p-6 space-y-4">

        {/* Info */}
        <div className="flex items-start gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2.5 text-xs text-emerald-700 dark:text-emerald-300">
          <Info size={13} className="shrink-0 mt-0.5" />
          <span>
            Karena ini adalah <strong>pendaftaran ulang</strong>, semua biodata yang sudah diajukan
            dapat langsung diterima. Hanya biodata dengan status <strong>Diajukan</strong> yang
            akan diproses.
          </span>
        </div>

        {/* Step: select */}
        {step === 'select' && (
          <>
            {/* Tahun selector */}
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tahun Ajaran</p>
              <Select
                options={tahunOptions}
                value={tahunId}
                onChange={(e) => setTahunId(e.target.value)}
                placeholder="— Pilih tahun ajaran —"
              />
            </div>

            {/* List */}
            {!tahunId ? (
              <div className="py-6 text-center text-sm text-gray-400">
                Pilih tahun ajaran terlebih dahulu
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-gray-400" />
              </div>
            ) : eligible.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                Tidak ada biodata dengan status <strong>Diajukan</strong> untuk tahun ini
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span className="text-emerald-600 font-semibold">{eligible.length}</span> biodata siap diverifikasi
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded accent-emerald-600"
                    />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      {isAllSelected ? 'Batalkan Semua' : 'Pilih Semua'}
                    </span>
                  </label>
                </div>

                <div className="space-y-0.5 max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  {eligible.map((s: SiswaLulus) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(s.biodata!.id)}
                        onChange={() => toggleOne(s.biodata!.id)}
                        className="w-4 h-4 rounded accent-emerald-600 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{s.nama}</p>
                        <p className="text-xs text-gray-400 font-mono">{s.noPendaftaran}</p>
                      </div>
                      {s.biodata?.nisn && (
                        <span className="text-xs font-mono text-gray-400 flex-shrink-0">
                          {s.biodata.nisn}
                        </span>
                      )}
                    </label>
                  ))}
                </div>

                <p className="text-xs text-gray-400 mt-1.5 text-right">
                  {selected.size} / {eligible.length} dipilih
                </p>
              </div>
            )}
          </>
        )}

        {/* Step: confirm */}
        {step === 'confirm' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Akan menerima biodata <strong>{selected.size} siswa</strong> berikut sebagai <strong>Diterima</strong>:
            </p>
            <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              {selectedItems.map((s) => (
                <div key={s.id} className="px-3 py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{s.nama}</p>
                    <p className="text-xs text-gray-400 font-mono">{s.noPendaftaran}</p>
                  </div>
                  {s.biodata?.nisn && (
                    <span className="text-xs font-mono text-gray-400 flex-shrink-0">{s.biodata.nisn}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <Info size={13} className="shrink-0 mt-0.5" />
              Biodata yang sudah berstatus Diterima atau Ditolak tidak akan berubah.
            </div>
          </div>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <div className="py-6 text-center space-y-3">
            <CheckCircle size={40} className="mx-auto text-emerald-500" />
            <p className="text-base font-semibold text-gray-900 dark:text-white">Verifikasi Selesai</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="text-2xl font-bold text-emerald-600">{doneCount}</span>
              <br />
              biodata berhasil diterima
            </p>
            {doneCount < selected.size && (
              <p className="text-xs text-amber-600">
                {selected.size - doneCount} biodata dilewati (sudah diverifikasi sebelumnya)
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
