'use client'

import { useEffect, useState } from 'react'
import { Modal, Button, Select, Spinner, FileUpload } from '@/components/ui'
import { Plus, Trash2 } from 'lucide-react'
import { uploadKurikulumTemplatePdf } from '@/lib/api/kurikulum.api'
import { useFormatBaku } from '@/hooks/kurikulum/useKurikulum'
import type {
  Kurikulum,
  FormatTipe,
  JenisFormatBaku,
  StrukturFieldItem,
  CreateFormatBakuDto,
} from '@/types/kurikulum.types'

const JENIS_OPTIONS: { value: JenisFormatBaku; label: string }[] = [
  { value: 'RPP',              label: 'RPP' },
  { value: 'MATERI_PELAJARAN', label: 'Materi Pelajaran' },
  { value: 'ASESMEN',          label: 'Asesmen' },
]

const TIPE_OPTIONS: { value: FormatTipe; label: string }[] = [
  { value: 'RICHTEXT',     label: 'Richtext (Struktur Field)' },
  { value: 'PDF_TEMPLATE', label: 'PDF Template' },
]

const FIELD_TIPE_OPTIONS = [
  { value: 'text',     label: 'Teks Singkat' },
  { value: 'richtext', label: 'Teks Kaya (Richtext)' },
  { value: 'list',     label: 'Daftar (List)' },
  { value: 'table',    label: 'Tabel' },
]

interface FormatBakuModalProps {
  open:      boolean
  onClose:   () => void
  onSubmit:  (dto: CreateFormatBakuDto) => Promise<void>
  kurikulum: Kurikulum | null
  isPending: boolean
  error?:    string | null
}

export function FormatBakuModal({
  open,
  onClose,
  onSubmit,
  kurikulum,
  isPending,
  error,
}: FormatBakuModalProps) {
  const [jenisFormat,    setJenisFormat]    = useState<JenisFormatBaku>('RPP')
  const [formatTipe,     setFormatTipe]     = useState<FormatTipe>('RICHTEXT')
  const [pdfTemplateKey, setPdfTemplateKey] = useState('')
  const [fields, setFields] = useState<StrukturFieldItem[]>([])

  // Fetch existing format baku hanya saat modal terbuka
  const { data: existingFormats } = useFormatBaku(open ? (kurikulum?.id ?? null) : null)

  // Effect 1: Reset selector jenis ke RPP setiap kali modal dibuka
  useEffect(() => {
    if (open) setJenisFormat('RPP')
  }, [open])

  // Effect 2: Pre-populate form dari data yang sudah ada, atau reset ke blank
  // Dijalankan setiap modal dibuka, jenis berganti, atau data selesai dimuat
  useEffect(() => {
    if (!open) return
    const existing = existingFormats?.find((f) => f.jenisFormat === jenisFormat)
    if (existing) {
      setFormatTipe(existing.formatTipe)
      setFields((existing.strukturField as StrukturFieldItem[]) ?? [])
      setPdfTemplateKey(existing.pdfTemplateKey ?? '')
    } else {
      // Belum ada format untuk jenis ini — tampilkan form kosong
      setFormatTipe('RICHTEXT')
      setFields([])
      setPdfTemplateKey('')
    }
  }, [open, jenisFormat, existingFormats])

  const addField = () => {
    setFields((prev) => [
      ...prev,
      {
        key:      `field_${prev.length + 1}`,
        label:    '',
        tipe:     'richtext',
        required: false,
        urutan:   prev.length + 1,
      },
    ])
  }

  const removeField = (idx: number) => {
    setFields((prev) => prev.filter((_, i) => i !== idx).map((f, i) => ({ ...f, urutan: i + 1 })))
  }

  const updateField = (idx: number, patch: Partial<StrukturFieldItem>) => {
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const dto: CreateFormatBakuDto = {
      jenisFormat,
      formatTipe,
      ...(formatTipe === 'RICHTEXT'     ? { strukturField: fields }    : {}),
      ...(formatTipe === 'PDF_TEMPLATE' ? { pdfTemplateKey: pdfTemplateKey.trim() } : {}),
    }
    await onSubmit(dto)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Format Baku — ${kurikulum?.nama ?? ''}`}
      size="2xl"
      footer={
        <div className="flex gap-2 justify-end px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button type="submit" form="format-baku-form" disabled={isPending}>
            {isPending ? <><Spinner />&nbsp;Menyimpan...</> : 'Simpan Format Baku'}
          </Button>
        </div>
      }
    >
      <form id="format-baku-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Jenis Format <span className="text-red-500">*</span>
            </label>
            <Select
              value={jenisFormat}
              onChange={(e) => setJenisFormat(e.target.value as JenisFormatBaku)}
              options={JENIS_OPTIONS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipe Format <span className="text-red-500">*</span>
            </label>
            <Select
              value={formatTipe}
              onChange={(e) => setFormatTipe(e.target.value as FormatTipe)}
              options={TIPE_OPTIONS}
            />
          </div>
        </div>

        {formatTipe === 'PDF_TEMPLATE' && (
          <FileUpload
            label="Upload PDF Template"
            hint="Format PDF, maks. 10 MB"
            accept="application/pdf,.pdf"
            currentKey={pdfTemplateKey || null}
            onUpload={uploadKurikulumTemplatePdf}
            onSuccess={(key) => setPdfTemplateKey(key)}
            compressImage={false}
          />
        )}

        {formatTipe === 'RICHTEXT' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Struktur Field
              </label>
              <Button type="button" size="sm" variant="secondary" onClick={addField} leftIcon={<Plus className="h-3.5 w-3.5" />}>
                Tambah Field
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-gray-400 italic text-center py-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                Belum ada field. Klik &ldquo;Tambah Field&rdquo; untuk mulai.
              </p>
            )}

            {fields.map((field, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-3 items-start p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">Key</label>
                  <input
                    type="text"
                    value={field.key}
                    onChange={(e) => updateField(idx, { key: e.target.value })}
                    placeholder="tujuan_pembelajaran"
                    className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="col-span-4">
                  <label className="block text-xs text-gray-500 mb-1">Label</label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(idx, { label: e.target.value })}
                    placeholder="Tujuan Pembelajaran"
                    className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">Tipe</label>
                  <select
                    value={field.tipe}
                    onChange={(e) => updateField(idx, { tipe: e.target.value as StrukturFieldItem['tipe'] })}
                    className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {FIELD_TIPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1 flex flex-col items-center pt-5">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(idx, { required: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-500">Wajib</span>
                  </label>
                </div>
                <div className="col-span-1 flex items-center justify-center pt-4">
                  <button
                    type="button"
                    onClick={() => removeField(idx)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </form>
    </Modal>
  )
}
