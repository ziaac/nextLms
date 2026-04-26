'use client'

import { useState, useEffect } from 'react'
import { UserCheck, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { Modal, Badge, Button, Select } from '@/components/ui'
import { useSiswaLulus, useBuatkanAkun } from '@/hooks/pendaftaran/usePendaftaran'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import type { SiswaLulus } from '@/types/pendaftaran.types'
import type { TahunAjaran } from '@/types/tahun-ajaran.types'

interface Props {
  open: boolean
  onClose: () => void
  tahunAjaranId: string
}

type Step = 'select' | 'confirm' | 'done'

interface DoneResult {
  berhasil: number
  dilewati: number
  error: number
}

export function BuatkanAkunModal({ open, onClose, tahunAjaranId }: Props) {
  const [step,          setStep]          = useState<Step>('select')
  const [selected,      setSelected]      = useState<Set<string>>(new Set())
  const [result,        setResult]        = useState<DoneResult | null>(null)
  const [localTahunId,  setLocalTahunId]  = useState(tahunAjaranId)

  const { data: tahunList } = useTahunAjaranList()

  const { data, isLoading } = useSiswaLulus({
    tahunAjaranId: localTahunId || undefined,
    limit: 1000,
  })

  const buatkan = useBuatkanAkun()

  // Only show DITERIMA biodata — eligible for account creation
  const eligible = (data?.data ?? []).filter(
    (s: SiswaLulus) => s.biodata?.status === 'DITERIMA',
  )
  const all = data?.data ?? []

  useEffect(() => {
    if (open) {
      setStep('select')
      setSelected(new Set())
      setResult(null)
      setLocalTahunId(tahunAjaranId)
    }
  }, [open, tahunAjaranId])

  const toggleItem = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === eligible.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(eligible.map((s: SiswaLulus) => s.id)))
    }
  }

  const handleConfirm = async () => {
    const ids = Array.from(selected)
    const res = await buatkan.mutateAsync(ids)
    setResult({ berhasil: res.berhasil, dilewati: res.dilewati, error: res.error ?? 0 })
    setStep('done')
  }

  const selectedItems = all.filter((s: SiswaLulus) => selected.has(s.id))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buatkan Akun Siswa"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {step === 'done' ? 'Tutup' : 'Batal'}
          </Button>
          {step === 'select' && (
            <Button
              onClick={() => setStep('confirm')}
              disabled={selected.size === 0}
              leftIcon={<UserCheck size={13} />}
            >
              Lanjut ({selected.size})
            </Button>
          )}
          {step === 'confirm' && (
            <>
              <Button variant="secondary" onClick={() => setStep('select')}>Kembali</Button>
              <Button onClick={handleConfirm} loading={buatkan.isPending}>
                Buat {selected.size} Akun
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="p-6 space-y-4">
        {/* Tahun Ajaran selector */}
        <div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tahun Ajaran</p>
          <Select
            options={(tahunList ?? []).map((t: TahunAjaran) => ({ value: t.id, label: t.nama }))}
            value={localTahunId}
            onChange={(e) => { setLocalTahunId(e.target.value); setSelected(new Set()) }}
            placeholder="— Pilih tahun ajaran —"
            disabled={step !== 'select'}
          />
        </div>

        {/* Info notice */}
        <div className="flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-2.5 text-xs text-blue-700 dark:text-blue-300">
          <Info size={13} className="shrink-0 mt-0.5" />
          <span>Akun hanya dapat dibuat untuk siswa dengan status biodata <strong>Diterima</strong>. Email: <code>nisn@m2m.my.id</code>, password: <code>DDMMYYYY</code> (tanggal lahir).</span>
        </div>

        {/* Select step */}
        {step === 'select' && (
          <>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-gray-400" />
              </div>
            ) : eligible.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                Tidak ada siswa dengan status biodata Diterima
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {eligible.length} siswa eligible
                  </p>
                  <button onClick={toggleAll} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                    {selected.size === eligible.length ? 'Batalkan Semua' : 'Pilih Semua'}
                  </button>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  {eligible.map((s: SiswaLulus) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleItem(s.id)}
                        className="w-4 h-4 rounded accent-emerald-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{s.nama}</p>
                        <p className="text-xs text-gray-400 font-mono">{s.noPendaftaran}</p>
                      </div>
                      {s.biodata?.nisn && (
                        <span className="text-xs font-mono text-gray-400">NISN: {s.biodata.nisn}</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Confirm step */}
        {step === 'confirm' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Akan membuat akun untuk <strong>{selected.size} siswa</strong> berikut:
            </p>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              {selectedItems.map((s: SiswaLulus) => (
                <div key={s.id} className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.nama}</p>
                  <p className="text-xs text-gray-400">
                    {s.biodata?.nisn ? `${s.biodata.nisn}@m2m.my.id` : '(NISN belum ada)'}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              Siswa yang sudah memiliki akun akan dilewati.
            </div>
          </div>
        )}

        {/* Done step */}
        {step === 'done' && result && (
          <div className="py-4 text-center space-y-4">
            <CheckCircle size={40} className="mx-auto text-emerald-500" />
            <p className="text-base font-semibold text-gray-900 dark:text-white">Proses Selesai</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{result.berhasil}</p>
                <p className="text-xs text-gray-500">Berhasil</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">{result.dilewati}</p>
                <p className="text-xs text-gray-500">Dilewati</p>
              </div>
              {result.error > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">{result.error}</p>
                  <p className="text-xs text-gray-500">Error</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
