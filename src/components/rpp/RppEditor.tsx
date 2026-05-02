'use client'

import { useState, useEffect } from 'react'
import { Button, Spinner } from '@/components/ui'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { useKurikulumAktif } from '@/hooks/kurikulum/useKurikulum'
import type { RPP } from '@/types/rpp.types'
import type { StrukturFieldItem } from '@/types/kurikulum.types'

interface RppEditorProps {
  rpp:          RPP
  onSave:       (konten: Record<string, unknown>) => Promise<void>
  onPublish:    () => Promise<void>
  isSaving:     boolean
  isPublishing: boolean
}

export function RppEditor({ rpp, onSave, onPublish, isSaving, isPublishing }: RppEditorProps) {
  const { data: kurikulumAktif } = useKurikulumAktif()

  // Ambil strukturField dari format baku RPP kurikulum aktif
  const formatBakuRPP = kurikulumAktif?.formatBaku?.find((fb) => fb.jenisFormat === 'RPP')
  const strukturField: StrukturFieldItem[] =
    (formatBakuRPP?.strukturField as StrukturFieldItem[] | undefined) ?? []

  // Inisialisasi konten dari RPP yang ada
  const [konten, setKonten] = useState<Record<string, unknown>>(
    (rpp.konten as Record<string, unknown>) ?? {},
  )

  useEffect(() => {
    setKonten((rpp.konten as Record<string, unknown>) ?? {})
  }, [rpp.id, rpp.konten])

  const updateField = (key: string, value: string) => {
    setKonten((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => onSave(konten)

  // Jika tidak ada strukturField, tampilkan editor generik
  const hasStruktur = strukturField.length > 0

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-1">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">{rpp.judul}</h2>
        <p className="text-sm text-gray-500">Topik: {rpp.topik}</p>
        {kurikulumAktif && (
          <p className="text-xs text-gray-400">
            Format: {kurikulumAktif.nama}
            {formatBakuRPP ? ` — ${formatBakuRPP.formatTipe}` : ' (tanpa format baku)'}
          </p>
        )}
      </div>

      {/* Editor fields */}
      {hasStruktur ? (
        <div className="space-y-6">
          {strukturField
            .slice()
            .sort((a, b) => a.urutan - b.urutan)
            .map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                  {field.hint && (
                    <span className="ml-2 text-xs text-gray-400 font-normal">{field.hint}</span>
                  )}
                </label>
                {field.tipe === 'richtext' ? (
                  <RichTextEditor
                    value={(konten[field.key] as string) ?? ''}
                    onChange={(val) => updateField(field.key, val)}
                    placeholder={field.placeholder ?? `Isi ${field.label}...`}
                  />
                ) : (
                  <textarea
                    value={(konten[field.key] as string) ?? ''}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder ?? `Isi ${field.label}...`}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                  />
                )}
              </div>
            ))}
        </div>
      ) : (
        // Fallback: editor generik jika tidak ada strukturField
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Konten RPP
          </label>
          <RichTextEditor
            value={(konten['konten'] as string) ?? ''}
            onChange={(val) => updateField('konten', val)}
            placeholder="Tulis konten RPP di sini..."
            minHeight="400px"
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button onClick={handleSave} disabled={isSaving || isPublishing}>
          {isSaving ? <><Spinner />&nbsp;Menyimpan...</> : 'Simpan Draft'}
        </Button>
        {rpp.status === 'DRAFT' && (
          <Button
            variant="secondary"
            onClick={onPublish}
            disabled={isSaving || isPublishing}
          >
            {isPublishing ? <><Spinner />&nbsp;Mempublikasi...</> : 'Publish RPP'}
          </Button>
        )}
        {rpp.status === 'PUBLISHED' && (
          <span className="text-sm text-emerald-600 font-medium">✓ Sudah dipublikasi</span>
        )}
      </div>
    </div>
  )
}
