'use client'

import { useState, useRef } from 'react'
import { Upload, Download, AlertCircle, CheckCircle, X, FileSpreadsheet } from 'lucide-react'
import { Modal, Button, Select } from '@/components/ui'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useBulkImport } from '@/hooks/pendaftaran/usePendaftaran'
import type { TahunAjaran } from '@/types/tahun-ajaran.types'

interface RowPreview {
  noPendaftaran: string
  nama: string
  tanggalLahir: string
  jalurPendaftaran?: string
}

type ImportStep = 'upload' | 'preview' | 'done'

const JALUR_VALID = ['ZONASI', 'PRESTASI', 'AFIRMASI', 'PERPINDAHAN', 'REGULER', '']

interface Props {
  open: boolean
  onClose: () => void
  defaultTahunAjaranId?: string
}

export function ImportModal({ open, onClose, defaultTahunAjaranId }: Props) {
  const [step,          setStep]          = useState<ImportStep>('upload')
  const [tahunAjaranId, setTahunAjaranId] = useState(defaultTahunAjaranId ?? '')
  const [rows,          setRows]          = useState<RowPreview[]>([])
  const [errors,        setErrors]        = useState<string[]>([])
  const [doneCount,     setDoneCount]     = useState(0)
  const [fileName,      setFileName]      = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: tahunList } = useTahunAjaranList()
  const bulkImport = useBulkImport()

  const tahunOptions = (tahunList ?? []).map((t: TahunAjaran) => ({ value: t.id, label: t.nama }))

  const resetState = () => {
    setStep('upload')
    setRows([])
    setErrors([])
    setDoneCount(0)
    setFileName('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleClose = () => { resetState(); onClose() }

  const parseDate = (raw: string): string => {
    const trimmed = String(raw).trim()
    if (!trimmed) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
    const parts = trimmed.split('/')
    if (parts.length === 3) {
      const [d, mo, y] = parts
      return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
    return trimmed
  }

  const parseJalur = (raw: string): string => {
    const upper = String(raw ?? '').toUpperCase().trim()
    return JALUR_VALID.includes(upper) ? upper : ''
  }

  const handleFile = async (file: File) => {
    setFileName(file.name)
    setErrors([])
    setRows([])
    try {
      const XLSX = await import('xlsx')
      const buf  = await file.arrayBuffer()
      const wb   = XLSX.read(buf, { type: 'buffer', cellDates: false })
      const ws   = wb.Sheets[wb.SheetNames[0]]
      const raw  = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][]

      if (raw.length < 2) { setErrors(['File kosong atau hanya memiliki header']); return }

      const header  = (raw[0] as string[]).map((h) => String(h).toLowerCase().trim())
      const colNoPend = header.findIndex((h) => h.includes('pendaftaran') || h === 'no_pendaftaran' || h === 'nopendaftaran')
      const colNama   = header.findIndex((h) => h.includes('nama'))
      const colTgl    = header.findIndex((h) => h.includes('lahir') || h.includes('tanggal'))
      const colJalur  = header.findIndex((h) => h.includes('jalur'))

      if (colNoPend < 0 || colNama < 0 || colTgl < 0) {
        setErrors(['Kolom wajib tidak ditemukan. Gunakan template yang tersedia.'])
        return
      }

      const parsed: RowPreview[] = []
      const errs: string[] = []

      for (let i = 1; i < raw.length; i++) {
        const row    = raw[i] as unknown[]
        const noPend = String(row[colNoPend] ?? '').trim().toUpperCase()
        const nama   = String(row[colNama]   ?? '').trim().toUpperCase()
        const tgl    = parseDate(String(row[colTgl] ?? ''))
        const jalur  = colJalur >= 0 ? parseJalur(String(row[colJalur] ?? '')) : ''
        if (!noPend && !nama) continue
        if (!noPend)  errs.push(`Baris ${i + 1}: Nomor pendaftaran kosong`)
        else if (!nama) errs.push(`Baris ${i + 1}: Nama kosong`)
        else if (!tgl)  errs.push(`Baris ${i + 1}: Tanggal lahir tidak valid`)
        else parsed.push({ noPendaftaran: noPend, nama, tanggalLahir: tgl, jalurPendaftaran: jalur || undefined })
      }
      setErrors(errs)
      setRows(parsed)
      if (parsed.length > 0) setStep('preview')
    } catch {
      setErrors(['Gagal membaca file. Pastikan format xlsx/csv yang valid.'])
    }
  }

  const handleDrop  = (e: React.DragEvent) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f) }

  const handleImport = async () => {
    if (!tahunAjaranId || rows.length === 0) return
    const res = await bulkImport.mutateAsync(rows.map((r) => ({ ...r, tahunAjaranId })))
    setDoneCount(res.count)
    setStep('done')
  }

  const downloadTemplate = () => {
    import('xlsx').then((XLSX) => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['No Pendaftaran', 'Nama Lengkap', 'Tanggal Lahir', 'Jalur Pendaftaran'],
        ['2025-001', 'CONTOH NAMA SISWA', '2008-05-15', 'ZONASI'],
      ])
      ws['!cols'] = [{ wch: 18 }, { wch: 30 }, { wch: 16 }, { wch: 18 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Template')
      XLSX.writeFile(wb, 'template-import-pendaftar.xlsx')
    })
  }

  const STEPS: ImportStep[] = ['upload', 'preview', 'done']
  const STEP_LABELS = { upload: 'Unggah File', preview: 'Pratinjau', done: 'Selesai' }
  const stepIdx = STEPS.indexOf(step)

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import Data Pendaftar"
      footer={
        <>
          <button
            onClick={downloadTemplate}
            className="mr-auto flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <Download size={12} /> Download Template
          </button>
          <Button variant="secondary" onClick={handleClose}>
            {step === 'done' ? 'Tutup' : 'Batal'}
          </Button>
          {step === 'preview' && (
            <Button
              onClick={handleImport}
              loading={bulkImport.isPending}
              disabled={rows.length === 0 || !tahunAjaranId}
            >
              Import {rows.length} Data
            </Button>
          )}
          {step === 'upload' && rows.length > 0 && (
            <Button onClick={() => setStep('preview')}>Lanjut</Button>
          )}
        </>
      }
    >
      <div className="p-6 space-y-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className="w-6 h-px bg-gray-200 dark:bg-gray-700" />}
              <span className={i <= stepIdx ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}>
                {i + 1}. {STEP_LABELS[s]}
              </span>
            </div>
          ))}
        </div>

        {/* Tahun Ajaran — shown on upload & preview */}
        {step !== 'done' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              Tahun Ajaran <span className="text-red-500">*</span>
            </label>
            <Select
              placeholder="— Pilih tahun ajaran —"
              options={tahunOptions}
              value={tahunAjaranId}
              onChange={(e) => setTahunAjaranId(e.target.value)}
            />
          </div>
        )}

        {/* Upload drop zone */}
        {step === 'upload' && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors"
          >
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleInput} />
            <FileSpreadsheet size={32} className="mx-auto text-gray-400 mb-3" />
            {fileName ? (
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{fileName}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Drag &amp; drop atau klik untuk memilih file
                </p>
                <p className="text-xs text-gray-400 mt-1">Format: xlsx, xls, csv</p>
              </>
            )}
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 space-y-1 max-h-32 overflow-y-auto">
            {errors.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                {e}
              </div>
            ))}
          </div>
        )}

        {/* Preview table */}
        {step === 'preview' && rows.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{rows.length} baris siap diimport</p>
              <button
                onClick={() => { setStep('upload'); setRows([]); setFileName(''); if (fileRef.current) fileRef.current.value = '' }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1"
              >
                <X size={11} /> Ganti file
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 max-h-52">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">No. Pendaftaran</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Nama</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Tgl Lahir</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Jalur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {rows.slice(0, 20).map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5 font-mono text-gray-700 dark:text-gray-300">{r.noPendaftaran}</td>
                      <td className="px-3 py-1.5 text-gray-800 dark:text-gray-200">{r.nama}</td>
                      <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{r.tanggalLahir}</td>
                      <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">{r.jalurPendaftaran || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 20 && (
                <p className="text-xs text-gray-400 text-center py-2">… dan {rows.length - 20} baris lainnya</p>
              )}
            </div>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="py-6 text-center">
            <CheckCircle size={40} className="mx-auto text-emerald-500 mb-3" />
            <p className="text-base font-semibold text-gray-900 dark:text-white">{doneCount} data berhasil diimport</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Data pendaftar telah ditambahkan ke sistem.</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
