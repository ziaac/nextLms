'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Spinner, Select, Skeleton } from '@/components/ui'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { useDraftDetail } from '@/hooks/ai-generator/useAiGenerator'
import { useMataPelajaranList } from '@/hooks/mata-pelajaran/useMataPelajaran'
import type { DraftAI, SaveDraftDto } from '@/types/ai-generator.types'

interface Props {
  draftId:   string
  onCancel:  () => void
  onSave:    (dto: SaveDraftDto) => Promise<void>
  isSaving:  boolean
}

const SAVE_LABEL: Record<string, string> = {
  RPP:              'Simpan sebagai RPP',
  MATERI_PELAJARAN: 'Simpan sebagai Materi',
  TUGAS:            'Simpan sebagai Tugas',
}

export function DraftEditorView({ draftId, onCancel, onSave, isSaving }: Props) {
  const { data: draft, isLoading } = useDraftDetail(draftId)
  const [konten, setKonten]               = useState<Record<string, unknown>>({})
  const [mataPelajaranId, setMataPelajaranId] = useState('')

  // Load mata pelajaran (per kelas) untuk semester draft
  const { data: mapelData } = useMataPelajaranList(
    draft ? { semesterId: draft.semesterId, limit: 100 } : undefined,
  )

  useEffect(() => {
    if (draft?.konten) {
      setKonten(draft.konten as Record<string, unknown>)
    }
  }, [draft?.id, draft?.konten])

  const mapelOptions = useMemo(
    () =>
      (mapelData?.data ?? []).map((m) => {
        const item = m as {
          id: string
          mataPelajaranTingkat?: { masterMapel?: { nama: string; kode?: string } }
          kelas?: { namaKelas: string }
        }
        const namaMapel = item.mataPelajaranTingkat?.masterMapel?.nama ?? item.id
        const kelas     = item.kelas?.namaKelas ? ` — ${item.kelas.namaKelas}` : ''
        return { value: item.id, label: `${namaMapel}${kelas}` }
      }),
    [mapelData],
  )

  const updateField = (key: string, value: string) => {
    setKonten((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!draft || !mataPelajaranId) return
    await onSave({
      kontenEdited:    konten,
      mataPelajaranId,
    })
  }

  if (isLoading || !draft) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (draft.status !== 'COMPLETED' && draft.status !== 'SAVED') {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">Draft belum siap. Status saat ini: {draft.status}</p>
        <Button variant="secondary" className="mt-4" onClick={onCancel}>Kembali</Button>
      </div>
    )
  }

  const fields = renderFieldsFor(draft)

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-1">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">{draft.judul}</h2>
        <p className="text-sm text-gray-500">Topik: {draft.topik}</p>
        <p className="text-xs text-gray-400">
          {draft.jenisKonten} · Provider: {draft.provider ?? '—'} · Token: {draft.tokenUsed ?? '—'}
        </p>
      </div>

      <div className="space-y-5">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {f.label}
            </label>
            {f.richtext ? (
              <RichTextEditor
                value={(konten[f.key] as string) ?? ''}
                onChange={(val) => updateField(f.key, val)}
              />
            ) : (
              <textarea
                value={(konten[f.key] as string) ?? ''}
                onChange={(e) => updateField(f.key, e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
              />
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
        <Select
          label="Pilih Mata Pelajaran (kelas)"
          placeholder="Pilih mata pelajaran"
          options={mapelOptions}
          value={mataPelajaranId}
          onChange={(e) => setMataPelajaranId(e.target.value)}
        />

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving || !mataPelajaranId || draft.status === 'SAVED'}
          >
            {isSaving ? (
              <><Spinner />&nbsp;Menyimpan…</>
            ) : (
              SAVE_LABEL[draft.jenisKonten] ?? 'Simpan'
            )}
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
            Batal
          </Button>
          {draft.status === 'SAVED' && (
            <span className="text-sm text-emerald-600 font-medium">✓ Sudah disimpan</span>
          )}
        </div>
      </div>
    </div>
  )
}

function renderFieldsFor(draft: DraftAI): { key: string; label: string; richtext: boolean }[] {
  const konten = (draft.konten ?? {}) as Record<string, unknown>

  if (draft.jenisKonten === 'MATERI_PELAJARAN') {
    return [
      { key: 'judul',              label: 'Judul',              richtext: false },
      { key: 'deskripsi',          label: 'Deskripsi',          richtext: false },
      { key: 'tujuanPembelajaran', label: 'Tujuan Pembelajaran',richtext: false },
      { key: 'kompetensiDasar',    label: 'Kompetensi Dasar',   richtext: false },
      { key: 'konten',             label: 'Konten',             richtext: true  },
    ]
  }

  if (draft.jenisKonten === 'TUGAS') {
    return [
      { key: 'judul',     label: 'Judul',     richtext: false },
      { key: 'deskripsi', label: 'Deskripsi', richtext: false },
      { key: 'instruksi', label: 'Instruksi', richtext: true  },
    ]
  }

  // RPP -- render semua key sebagai richtext
  return Object.keys(konten).map((key) => ({
    key,
    label:    key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
    richtext: true,
  }))
}
