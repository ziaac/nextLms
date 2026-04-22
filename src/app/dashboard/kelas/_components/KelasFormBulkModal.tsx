'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Loader2, ChevronRight, ChevronLeft, Search, X } from 'lucide-react'
import { Modal, Button, Input, Select } from '@/components/ui'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
import { useWaliKelasList, kelasKeys } from '@/hooks/kelas/useKelas'
import { WaliKelasSearch } from './WaliKelasSearch'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'
import type { CreateKelasDto } from '@/types/kelas.types'
import { useRuanganList } from '@/hooks/ruangan/useRuangan'
import { RuanganSearch } from './RuanganSearch'


const FORM_ID = 'kelas-bulk-step1'

const stepOneSchema = z.object({
  jumlahKelas:    z.coerce.number().int().min(1, 'Minimal 1').max(100, 'Maksimal 100'),
  tahunAjaranId:  z.string().min(1, 'Pilih tahun ajaran'),
  tingkatKelasId: z.string().min(1, 'Pilih tingkat kelas'),
})
type StepOneValues = z.infer<typeof stepOneSchema>

interface KelasRow { namaKelas: string; kodeKelas: string; waliKelasId: string; ruanganId: string; kuotaMaksimal: string }
type Step = 'config' | 'form' | 'done'
interface Props { open: boolean; onClose: () => void }

// Style input yang tidak pakai dark: class — biar ikut sistem
const inputCls = [
  'w-full px-2 py-1.5 rounded-lg text-sm',
  'border border-gray-300',
  'bg-white text-gray-900 placeholder-gray-400',
  'focus:outline-none focus:ring-2 focus:ring-emerald-500',
].join(' ')

export function KelasFormBulkModal({ open, onClose }: Props) {
  const [step, setStep]             = useState<Step>('config')
  const [config, setConfig]         = useState<StepOneValues | null>(null)
  const [rows, setRows]             = useState<KelasRow[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults]       = useState({ ok: 0, fail: 0 })

  const { data: tahunAjaranData }  = useTahunAjaranList()
  const { data: tingkatKelasData } = useTingkatKelasList()
  const { data: waliKelasList }    = useWaliKelasList()
  const { data: ruanganList = [] } = useRuanganList()
  const qc = useQueryClient()

  const tahunAjaranList  = tahunAjaranData  ?? []
  const tingkatKelasList = tingkatKelasData ?? []

  const tahunAjaranOptions = [
    { label: 'Pilih Tahun Ajaran', value: '' },
    ...tahunAjaranList.map((t) => ({ label: t.nama, value: t.id })),
  ]
  const tingkatKelasOptions = [
    { label: 'Pilih Tingkat Kelas', value: '' },
    ...tingkatKelasList.map((t) => ({ label: t.nama, value: t.id })),
  ]
  const waliKelasOptions = [
    { label: '— Belum ditentukan —', value: '' },
    ...(waliKelasList ?? []).map((u) => ({
      label: u.profile.nip ? `${u.profile.namaLengkap} (${u.profile.nip})` : u.profile.namaLengkap,
      value: u.id,
    })),
  ]

  const { register, handleSubmit, control, reset: resetStep1, formState: { errors } } = useForm<StepOneValues>({
    resolver: zodResolver(stepOneSchema) as any, // <-- Tambahkan as any di sini
    defaultValues: { jumlahKelas: 6, tahunAjaranId: '', tingkatKelasId: '' },
  })

  const handleStep1 = handleSubmit((values: StepOneValues) => { // <-- Beri tipe eksplisit di sini
    setConfig(values)
    setRows(Array.from({ length: values.jumlahKelas }, () => ({
      namaKelas: '', kodeKelas: '', waliKelasId: '', ruanganId: '', kuotaMaksimal: '36'
    })))
    setStep('form')
  })

  const updateRow = (i: number, field: keyof KelasRow, value: string) =>
    setRows((prev) => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row))

  const validRows = useMemo(() => rows.filter((r) => r.namaKelas.trim() !== ''), [rows])

  const tahunAjaranNama = tahunAjaranList.find((t) => t.id === config?.tahunAjaranId)?.nama ?? ''
  const tingkatNama     = tingkatKelasList.find((t) => t.id === config?.tingkatKelasId)?.nama ?? ''

  const handleSubmitBulk = async () => {
    if (!config || validRows.length === 0) return
    setSubmitting(true)
    let ok = 0, fail = 0
    for (const row of validRows) {
      const dto: CreateKelasDto = {
        tahunAjaranId:  config.tahunAjaranId,
        tingkatKelasId: config.tingkatKelasId,
        namaKelas:      row.namaKelas.trim(),
        kodeKelas:      row.kodeKelas.trim() || undefined,
        waliKelasId:    row.waliKelasId || undefined,
        ruanganId:      row.ruanganId.trim() || undefined,
        kuotaMaksimal:  row.kuotaMaksimal ? parseInt(row.kuotaMaksimal) : undefined,
      }
      try { await api.post('/kelas', dto); ok++ } catch { fail++ }
    }
    await qc.invalidateQueries({ queryKey: kelasKeys.all })
    setResults({ ok, fail })
    setSubmitting(false)
    setStep('done')
    if (fail === 0) toast.success(`${ok} kelas berhasil dibuat`)
    else            toast.warning(`${ok} berhasil, ${fail} gagal`)
  }

  const handleClose = () => {
    setStep('config'); setConfig(null); setRows([]); setResults({ ok: 0, fail: 0 }); resetStep1(); onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Tambah Kelas Bulk" size="xl"
      footer={
        step === 'config' ? (
          <>
            <Button variant="secondary" onClick={handleClose}>Batal</Button>
            <Button type="submit" form={FORM_ID} rightIcon={<ChevronRight className="h-4 w-4" />}>Lanjut</Button>
          </>
        ) : step === 'form' ? (
          <>
            <Button variant="secondary" leftIcon={<ChevronLeft className="h-4 w-4" />} onClick={() => setStep('config')}>Kembali</Button>
            <Button variant="ghost" onClick={handleClose}>Batal</Button>
            <Button onClick={handleSubmitBulk} disabled={submitting || validRows.length === 0}
              leftIcon={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}>
              {submitting ? 'Menyimpan...' : `Simpan ${validRows.length} Kelas`}
            </Button>
          </>
        ) : (
          <Button className="w-full" onClick={handleClose}>Tutup</Button>
        )
      }
    >
      <div className="p-6">

        {/* STEP 1 */}
        {step === 'config' && (
          <form id={FORM_ID} onSubmit={handleStep1} className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Tentukan jumlah kelas dan parameter globalnya.</p>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Berapa kelas yang akan dibuat? <span className="text-red-500">*</span></label>
              <Input {...register('jumlahKelas')} type="number" min={1} max={100} placeholder="6" error={errors.jumlahKelas?.message} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tahun Ajaran <span className="text-red-500">*</span></label>
              <Controller name="tahunAjaranId" control={control} render={({ field }) => (
                <Select options={tahunAjaranOptions} value={field.value} onChange={(e) => field.onChange(e.target.value)} />
              )} />
              {errors.tahunAjaranId && <p className="text-xs text-red-500">{errors.tahunAjaranId.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tingkat Kelas <span className="text-red-500">*</span></label>
              <Controller name="tingkatKelasId" control={control} render={({ field }) => (
                <Select options={tingkatKelasOptions} value={field.value} onChange={(e) => field.onChange(e.target.value)} />
              )} />
              {errors.tingkatKelasId && <p className="text-xs text-red-500">{errors.tingkatKelasId.message}</p>}
            </div>
          </form>
        )}

        {/* STEP 2 */}
        {step === 'form' && config && (
          <div className="space-y-4">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex flex-wrap gap-x-6 gap-y-1">
              <span><span className="font-medium">Tahun Ajaran:</span> {tahunAjaranNama}</span>
              <span><span className="font-medium">Tingkat:</span> {tingkatNama}</span>
              <span><span className="font-medium">Jumlah baris:</span> {config.jumlahKelas}</span>
            </div>
            <p className="text-xs text-gray-500">Isi kolom <span className="font-semibold">Nama Kelas</span> untuk menyimpan baris. Baris kosong dilewati.</p>

            <div className="rounded-lg border border-gray-200">
              <div className="overflow-x-auto overflow-y-auto max-h-72">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2 text-center w-8">#</th>
                      <th className="px-3 py-2 text-left min-w-[140px]">Nama Kelas <span className="text-red-400">*</span></th>
                      <th className="px-3 py-2 text-left min-w-[120px]">Kode Kelas</th>
                      <th className="px-3 py-2 text-left min-w-[180px]">Wali Kelas</th>
                      <th className="px-3 py-2 text-left min-w-[200px]">Ruangan</th>
                      <th className="px-3 py-2 text-left min-w-[80px]">Kuota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {rows.map((row, i) => (
                      <tr key={i} className={row.namaKelas.trim() ? 'bg-emerald-50' : ''}>
                        <td className="px-3 py-2 text-center text-gray-400 font-mono w-8">{i + 1}</td>
                        <td className="px-2 py-1.5 min-w-[140px]">
                          <input value={row.namaKelas} onChange={(e) => updateRow(i, 'namaKelas', e.target.value)}
                            placeholder="XII IPA 1" style={{ fontSize: '16px' }} className={inputCls} />
                        </td>
                        <td className="px-2 py-1.5 min-w-[120px]">
                          <input value={row.kodeKelas} onChange={(e) => updateRow(i, 'kodeKelas', e.target.value)}
                            placeholder="XII-IPA-1" style={{ fontSize: '16px' }} className={inputCls} />
                        </td>
                        <td className="px-2 py-1.5 min-w-[200px]">
                          <WaliKelasSearch
                            waliList={waliKelasList ?? []}
                            selectedId={row.waliKelasId}
                            onChange={(id) => updateRow(i, 'waliKelasId', id)}
                          />
                        </td>
                      <td className="px-2 py-1.5 min-w-[250px]">
                        <RuanganSearch
                          ruanganList={ruanganList}
                          selectedId={row.ruanganId}
                          onChange={(id) => updateRow(i, 'ruanganId', id)}
                          filterJenis="KELAS"
                        />
                      </td>
                        <td className="px-2 py-1.5 min-w-[80px]">
                          <input value={row.kuotaMaksimal} onChange={(e) => updateRow(i, 'kuotaMaksimal', e.target.value)}
                            type="number" min={1} max={100} placeholder="36" className={inputCls} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-right">
              <span className="font-semibold text-emerald-600">{validRows.length}</span> dari {config.jumlahKelas} kelas siap disimpan
            </p>
          </div>
        )}

        {/* STEP 3 */}
        {step === 'done' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">Selesai!</p>
              <p className="text-sm text-gray-500 mt-1">
                <span className="text-emerald-600 font-semibold">{results.ok} kelas</span> berhasil dibuat
                {results.fail > 0 && <>, <span className="text-red-500 font-semibold">{results.fail} kelas</span> gagal</>}.
              </p>
            </div>
          </div>
        )}

      </div>
    </Modal>
  )
}


interface WaliSearchCellProps {
  waliList: Array<{ id: string; profile: { namaLengkap: string; nip: string | null; fotoUrl: string | null } }>
  selectedId: string
  search: string
  open: boolean
  onSearchChange: (v: string) => void
  onOpenChange: (v: boolean) => void
  onSelect: (id: string) => void
}

function WaliSearchCell({ waliList, selectedId, search, open, onSearchChange, onOpenChange, onSelect }: WaliSearchCellProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedWali = waliList.find((w) => w.id === selectedId)

  const filtered = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return waliList.filter((w) =>
      w.profile.namaLengkap.toLowerCase().includes(q) ||
      (w.profile.nip ?? '').includes(q)
    ).slice(0, 10)
  }, [waliList, search])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onOpenChange(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onOpenChange])

  return (
    <div ref={containerRef} className="relative">
      {selectedWali ? (
        <div className="flex items-center justify-between rounded-lg border border-emerald-400 bg-emerald-50 px-2 py-1.5 gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{selectedWali.profile.namaLengkap}</p>
            {selectedWali.profile.nip && (
              <p className="text-[10px] text-gray-400">{selectedWali.profile.nip}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Hapus pilihan"
            onClick={() => onSelect('')}
            className="shrink-0 text-gray-400 hover:text-red-500"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
          <input
            className="w-full pl-6 pr-2 py-1.5 text-xs rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Ketik nama / NIP..."
            value={search}
            style={{ fontSize: '16px' }}
            onChange={(e) => { onSearchChange(e.target.value); onOpenChange(true) }}
            onFocus={() => { if (search) onOpenChange(true) }}
          />
        </div>
      )}

      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filtered.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => onSelect(w.id)}
              className="w-full text-left px-3 py-2 hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <p className="text-xs font-medium text-gray-900">{w.profile.namaLengkap}</p>
              {w.profile.nip && <p className="text-[10px] text-gray-400">{w.profile.nip}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
