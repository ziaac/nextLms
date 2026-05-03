'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Spinner, Select, Skeleton } from '@/components/ui'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { useDraftDetail } from '@/hooks/ai-generator/useAiGenerator'
import { useMataPelajaranList } from '@/hooks/mata-pelajaran/useMataPelajaran'
import type { DraftAI, SaveDraftDto, JenisKontenAI } from '@/types/ai-generator.types'

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

/** Normalisasi konten: AI kadang wrap dalam array berisi satu objek */
function normalizeKonten(raw: unknown): Record<string, unknown> {
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'object' && raw[0] !== null) {
    return raw[0] as Record<string, unknown>
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return {}
}

/**
 * Untuk RPP: jika konten berisi banyak key (draft lama dengan multi-field),
 * gabungkan menjadi satu field 'konten'.
 * Draft baru selalu menghasilkan { konten: "<html>" } sehingga tidak ada perubahan.
 */
function normalizeRppKontenToSingle(raw: Record<string, unknown>): Record<string, unknown> {
  // Sudah format baru — satu key 'konten'
  if (typeof raw['konten'] === 'string' && !!raw['konten']) return raw

  const keys = Object.keys(raw)
  if (keys.length === 0) return raw
  if (keys.length === 1 && keys[0] === 'konten') return raw

  // Format lama: gabungkan semua key menjadi satu HTML
  const headerKeys  = keys.filter((k) => !/^[A-Z]\./.test(k))
  const sectionKeys = keys.filter((k) => /^[A-Z]\./.test(k)).sort()

  const headerHtml = headerKeys.length > 0
    ? `<table style="border-collapse:collapse;margin-bottom:20px;width:100%">${
        headerKeys.map((key) => {
          const val = raw[key]
          const content = typeof val === 'string' ? val : JSON.stringify(val)
          return `<tr><td style="width:220px;padding:3px 8px;font-weight:600;vertical-align:top">${key}</td><td style="padding:3px 8px">: ${content}</td></tr>`
        }).join('')
      }</table>`
    : ''

  const sectionsHtml = sectionKeys
    .map((key) => {
      const val = raw[key]
      const content = typeof val === 'string' ? val : JSON.stringify(val)
      const isHtml = /<[a-z][\s\S]*>/i.test(content)
      return `<h3>${key}</h3>${isHtml ? content : `<p>${content}</p>`}`
    })
    .join('\n')

  return { konten: headerHtml + sectionsHtml }
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
      const raw = normalizeKonten(draft.konten)
      // RPP selalu dinormalisasi ke single 'konten' HTML
      // (format baku kurikulum tidak lagi terhubung ke AI generate)
      const normalized = draft.jenisKonten === 'RPP'
        ? normalizeRppKontenToSingle(raw)
        : raw
      setKonten(normalized)
    }
  }, [draft?.id, draft?.konten, draft?.jenisKonten])

  const mapelOptions = useMemo(
    () =>
      (mapelData?.data ?? []).map((m) => {
        const namaMapel = m.mataPelajaranTingkat?.masterMapel?.nama ?? m.id
        const kelas     = m.kelas?.namaKelas ? ` — ${m.kelas.namaKelas}` : ''
        return { value: m.id, label: `${namaMapel}${kelas}` }
      }),
    [mapelData],
  )

  const updateField = (key: string, value: string) => {
    setKonten((prev) => ({ ...prev, [key]: value }))
  }

  /** Render nilai untuk field editor.
   * Untuk richtext: strip \n agar tidak muncul sebagai karakter visible di editor.
   * Untuk textarea biasa: biarkan apa adanya.
   */
  const getFieldValue = (key: string, richtext = false): string => {
    const val = konten[key]
    if (val == null) return ''
    if (typeof val === 'string') {
      // \n dalam HTML hanya whitespace — strip agar tidak muncul di rich text editor
      return richtext ? val.replace(/\n/g, ' ').replace(/ {2,}/g, ' ').trim() : val
    }
    return JSON.stringify(val, null, 2)
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

  const fields = renderFieldsFor(draft.jenisKonten)

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
                value={getFieldValue(f.key, true)}
                onChange={(val) => updateField(f.key, val)}
              />
            ) : (
              <textarea
                value={getFieldValue(f.key)}
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

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tentukan field editor berdasarkan jenisKonten.
 *
 * RPP — selalu satu field 'konten' richtext (HTML).
 *   Format baku kurikulum tidak lagi terhubung ke AI generate.
 *   AI selalu menghasilkan { "konten": "<html...>" }.
 *
 * MATERI_PELAJARAN & TUGAS — skema tetap sesuai output AI.
 */
function renderFieldsFor(
  jenisKonten: JenisKontenAI,
): { key: string; label: string; richtext: boolean }[] {
  if (jenisKonten === 'MATERI_PELAJARAN') {
    return [
      { key: 'judul',              label: 'Judul',               richtext: false },
      { key: 'deskripsi',          label: 'Deskripsi',           richtext: false },
      { key: 'tujuanPembelajaran', label: 'Tujuan Pembelajaran', richtext: false },
      { key: 'kompetensiDasar',    label: 'Kompetensi Dasar',    richtext: false },
      { key: 'konten',             label: 'Konten',              richtext: true  },
    ]
  }

  if (jenisKonten === 'TUGAS') {
    return [
      { key: 'judul',     label: 'Judul',     richtext: false },
      { key: 'deskripsi', label: 'Deskripsi', richtext: false },
      { key: 'instruksi', label: 'Instruksi', richtext: true  },
    ]
  }

  // RPP — satu field konten HTML
  return [{ key: 'konten', label: 'Konten RPP', richtext: true }]
}
