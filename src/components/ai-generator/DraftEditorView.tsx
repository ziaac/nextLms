'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Spinner, Select, Skeleton } from '@/components/ui'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { useDraftDetail } from '@/hooks/ai-generator/useAiGenerator'
import { useMataPelajaranList } from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useKurikulumAktif, useFormatBaku } from '@/hooks/kurikulum/useKurikulum'
import type { DraftAI, SaveDraftDto, JenisKontenAI } from '@/types/ai-generator.types'
import type { StrukturFieldItem } from '@/types/kurikulum.types'

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

/** Map JenisKontenAI → JenisFormatBaku (untuk lookup format baku) */
const JENIS_TO_FORMAT: Record<JenisKontenAI, string> = {
  RPP:              'RPP',
  MATERI_PELAJARAN: 'MATERI_PELAJARAN',
  TUGAS:            'ASESMEN',
}

/** Ubah key snake_case atau camelCase menjadi label terbaca */
function toReadableLabel(key: string): string {
  // snake_case: "tujuan_pembelajaran" → "Tujuan Pembelajaran"
  if (key.includes('_')) {
    return key
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }
  // camelCase: "tujuanPembelajaran" → "Tujuan Pembelajaran"
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
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
 * Untuk RPP dengan format PDF_TEMPLATE:
 * Jika konten berisi banyak key (format lama), gabungkan menjadi satu field 'konten'.
 * Jika sudah ada key 'konten', kembalikan apa adanya.
 */
function normalizeRppKontenToSingle(
  raw: Record<string, unknown>,
  isRpp: boolean,
  hasSingleKonten: boolean,
): Record<string, unknown> {
  if (!isRpp) return raw
  // Sudah format baru (satu key 'konten') atau ada strukturField (multi-key terstruktur)
  if (hasSingleKonten) return raw

  // Format lama: gabungkan semua key menjadi satu HTML
  const keys = Object.keys(raw)
  if (keys.length === 0) return raw
  // Jika hanya ada key 'konten', sudah benar
  if (keys.length === 1 && keys[0] === 'konten') return raw

  // Pisahkan header identitas dari section A/B/C
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

  // Format baku: gunakan kurikulum SAAT draft dibuat (bukan yang aktif sekarang).
  // Ini menjamin konsistensi editor meski format baku sudah berubah di semester berikutnya.
  // Fallback ke kurikulum aktif jika kurikulumId tidak tersimpan (draft lama).
  const { data: formatBakuFromSnapshot } = useFormatBaku(draft?.kurikulumId ?? null)
  const { data: kurikulumAktif }         = useKurikulumAktif()

  // Load mata pelajaran (per kelas) untuk semester draft
  const { data: mapelData } = useMataPelajaranList(
    draft ? { semesterId: draft.semesterId, limit: 100 } : undefined,
  )

  // Hitung strukturField lebih awal (sebelum useEffect) agar bisa dipakai sebagai dependency
  const strukturField = useMemo((): StrukturFieldItem[] | null => {
    if (!draft) return null
    const jenisFormatBaku = JENIS_TO_FORMAT[draft.jenisKonten]
    const formatBakuList  = formatBakuFromSnapshot ?? kurikulumAktif?.formatBaku ?? []
    const formatBaku      = formatBakuList.find((fb) => fb.jenisFormat === jenisFormatBaku)
    return formatBaku?.strukturField?.length ? formatBaku.strukturField as StrukturFieldItem[] : null
  }, [draft, formatBakuFromSnapshot, kurikulumAktif])

  useEffect(() => {
    if (draft?.konten) {
      const raw = normalizeKonten(draft.konten)
      // Untuk RPP PDF_TEMPLATE: normalisasi multi-key ke single 'konten'
      const isRpp = draft.jenisKonten === 'RPP'
      const hasSingleKonten = typeof raw['konten'] === 'string' && !!raw['konten']
      const hasStrukturField = !!(strukturField && strukturField.length > 0)
      // Normalisasi hanya jika RPP dan tidak ada strukturField (PDF_TEMPLATE / fallback)
      const normalized = isRpp && !hasStrukturField
        ? normalizeRppKontenToSingle(raw, isRpp, hasSingleKonten)
        : raw
      setKonten(normalized)
    }
  }, [draft?.id, draft?.konten, strukturField])

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

  /** Render nilai complex (array/object) sebagai string untuk textarea */
  const getFieldValue = (key: string): string => {
    const val = konten[key]
    if (val == null) return ''
    if (typeof val === 'string') return val
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

  // strukturField sudah dihitung via useMemo di atas
  const fields = renderFieldsFor(draft, strukturField)

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
                value={getFieldValue(f.key)}
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

function renderFieldsFor(
  draft: DraftAI,
  strukturField: StrukturFieldItem[] | null,
): { key: string; label: string; richtext: boolean }[] {
  // Normalisasi konten
  const konten = normalizeKonten(draft.konten)

  // ── MATERI_PELAJARAN & TUGAS: skema tetap (tidak bergantung format baku) ──
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

  // ── RPP: gunakan strukturField dari format baku jika tersedia ─────────────
  if (strukturField && strukturField.length > 0) {
    // Urutkan sesuai urutan yang didefinisikan admin
    return strukturField
      .slice()
      .sort((a, b) => a.urutan - b.urutan)
      .map((f) => ({
        key:      f.key,
        label:    f.label,
        richtext: f.tipe === 'richtext' || f.tipe === 'list' || f.tipe === 'table',
      }))
  }

  // ── Fallback RPP: PDF_TEMPLATE atau format baku belum diisi ───────────────
  // Gabungkan semua key menjadi satu field 'konten' untuk editor tunggal.
  // Normalisasi ini terjadi di sini (read-only untuk renderFieldsFor),
  // konten aktual digabung di normalizeKontenForSingleField().
  return [{ key: 'konten', label: 'Konten RPP', richtext: true }]
}
